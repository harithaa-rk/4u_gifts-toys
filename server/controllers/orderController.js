import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Notification from "../models/Notification.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Helper to send email notification to admin
const sendOrderNotification = async (order) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL, // admin email address in .env
      subject: `New Order Received - ${order._id}`,
      html: `<h3>New Order Received</h3>
        <p>Order ID: ${order._id}</p>
        <p>User ID: ${order.userId}</p>
        <p>Total Amount: ₹${order.totalAmount}</p>`,
    };
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Failed to send order email", err);
  }
};

export const createOrder = async (req, res) => {
  const userId = req.userId; // set by verifyToken middleware
  const { products } = req.body; // products: [{ productId, quantity }]
  try {
    // Populate product details to compute total price
    const populated = await Promise.all(
      products.map(async (p) => {
        const product = await Product.findById(p.productId);
        if (!product) throw new Error("Product not found: " + p.productId);
        return { ...p, price: product.price };
      })
    );
    const total = populated.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const order = new Order({ 
      userId, 
      products, 
      totalAmount: total, 
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod || "card",
      paymentStatus: req.body.paymentMethod === "cod" ? "Pending" : "Paid"
    });
    await order.save();
    
    // Create DB notification
    const notification = new Notification({
      message: `New order placed for ₹${total.toLocaleString("en-IN")}`,
      orderId: order._id,
    });
    await notification.save();

    // send email to admin (non-blocking)
    sendOrderNotification(order);
    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// Customer: get their own orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId })
      .populate("products.productId", "name price images")
      .sort({ createdAt: -1 })
      .lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  try {
    const orders = await Order.find()
      .populate("userId", "name email")
      .populate("products.productId", "name price images")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    const totalOrders = await Order.countDocuments();
    res.json({ orders, totalPages: Math.ceil(totalOrders / limit), currentPage: page });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status provided." });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    
    const validStatuses = ['Pending', 'Paid', 'Failed', 'Refunded'];
    if (!validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid payment status provided." });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { paymentStatus },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

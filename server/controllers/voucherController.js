import crypto from "crypto";
import jwt from "jsonwebtoken";
import Voucher from "../models/Voucher.js";
import Notification from "../models/Notification.js";

// Helper to securely generate a unique voucher code: e.g., 4U-GIFT-A8F2-9C1D
const generateVoucherCode = async () => {
  let unique = false;
  let code = "";
  while (!unique) {
    const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
    const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
    code = `4U-GIFT-${part1}-${part2}`;
    const existing = await Voucher.findOne({ code });
    if (!existing) unique = true;
  }
  return code;
};

// Create a digital gift voucher
export const createVoucher = async (req, res) => {
  try {
    const { amount, recipientName, recipientEmail, personalMessage, paymentMethod } = req.body;

    const allowedAmounts = [100, 250, 500, 1000];
    const numericAmount = Number(amount);
    if (!allowedAmounts.includes(numericAmount)) {
      return res.status(400).json({ 
        message: "Invalid voucher amount. Supported amounts are ₹100, ₹250, ₹500, or ₹1,000." 
      });
    }

    if (!recipientName || !recipientName.trim()) {
      return res.status(400).json({ message: "Recipient name is required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!recipientEmail || !emailRegex.test(recipientEmail.trim())) {
      return res.status(400).json({ message: "A valid recipient email address is required." });
    }

    // Optional user attachment if authenticated
    let purchaserId = null;
    let purchaserEmail = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        purchaserId = decoded.id;
        purchaserEmail = decoded.email || null;
      } catch {
        // Continue as guest
      }
    }

    const code = await generateVoucherCode();

    const voucher = new Voucher({
      code,
      amount: numericAmount,
      purchaserId,
      purchaserEmail,
      recipientName: recipientName.trim(),
      recipientEmail: recipientEmail.trim().toLowerCase(),
      personalMessage: personalMessage ? personalMessage.trim() : "",
      paymentMethod: paymentMethod || "card",
      paymentStatus: paymentMethod === "cod" ? "Pending" : "Paid",
      status: "active",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    await voucher.save();

    // Create Admin Notification
    const notif = new Notification({
      message: `🎟️ New Gift Voucher issued for ₹${numericAmount} to ${recipientName} (${code})`,
    });
    await notif.save();

    res.status(201).json({
      success: true,
      message: "Gift voucher issued successfully!",
      voucher: {
        _id: voucher._id,
        code: voucher.code,
        amount: voucher.amount,
        currency: voucher.currency,
        recipientName: voucher.recipientName,
        recipientEmail: voucher.recipientEmail,
        personalMessage: voucher.personalMessage,
        paymentStatus: voucher.paymentStatus,
        status: voucher.status,
        expiryDate: voucher.expiryDate,
        createdAt: voucher.createdAt,
      }
    });
  } catch (err) {
    console.error("Voucher creation error:", err);
    res.status(500).json({ message: "Failed to create gift voucher. Please try again." });
  }
};

// Verify a voucher code for checkout discount
export const verifyVoucher = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ valid: false, message: "Voucher code is required." });
    }

    const cleanCode = code.trim().toUpperCase();
    const voucher = await Voucher.findOne({ code: cleanCode });

    if (!voucher) {
      return res.status(404).json({ valid: false, message: "Invalid voucher code." });
    }

    if (voucher.status === "redeemed") {
      return res.status(400).json({ valid: false, message: "This voucher has already been redeemed." });
    }

    if (voucher.status !== "active") {
      return res.status(400).json({ valid: false, message: `Voucher is ${voucher.status}.` });
    }

    if (voucher.expiryDate && new Date() > new Date(voucher.expiryDate)) {
      voucher.status = "expired";
      await voucher.save();
      return res.status(400).json({ valid: false, message: "This voucher has expired." });
    }

    res.json({
      valid: true,
      code: voucher.code,
      amount: voucher.amount,
      currency: voucher.currency,
      recipientName: voucher.recipientName,
      expiryDate: voucher.expiryDate,
      message: `Valid ₹${voucher.amount} Gift Voucher!`
    });
  } catch (err) {
    console.error("Voucher verification error:", err);
    res.status(500).json({ valid: false, message: "Server error checking voucher." });
  }
};

// Redeem a voucher (called on order completion or direct redemption)
export const redeemVoucher = async (req, res) => {
  try {
    const { code, orderId } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: "Voucher code is required." });
    }

    const cleanCode = code.trim().toUpperCase();
    const voucher = await Voucher.findOne({ code: cleanCode });

    if (!voucher || voucher.status !== "active") {
      return res.status(400).json({ success: false, message: "Voucher is not active or already redeemed." });
    }

    voucher.status = "redeemed";
    voucher.redeemedAt = new Date();
    if (req.userId) voucher.redeemedBy = req.userId;
    await voucher.save();

    res.json({
      success: true,
      message: `Voucher ${cleanCode} redeemed successfully!`,
      amountRedeemed: voucher.amount
    });
  } catch (err) {
    console.error("Voucher redemption error:", err);
    res.status(500).json({ success: false, message: "Server error redeeming voucher." });
  }
};

// Get user vouchers
export const getUserVouchers = async (req, res) => {
  try {
    const userId = req.userId;
    const vouchers = await Voucher.find({
      $or: [{ purchaserId: userId }, { redeemedBy: userId }]
    }).sort({ createdAt: -1 });

    res.json(vouchers);
  } catch (err) {
    console.error("Get user vouchers error:", err);
    res.status(500).json({ message: "Failed to load vouchers." });
  }
};

// Admin: Get all vouchers
export const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (err) {
    console.error("Get all vouchers error:", err);
    res.status(500).json({ message: "Failed to load vouchers." });
  }
};

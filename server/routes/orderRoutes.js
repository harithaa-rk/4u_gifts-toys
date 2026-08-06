import express from "express";
import { createOrder, getAllOrders, getUserOrders, updateOrderStatus, updatePaymentStatus } from "../controllers/orderController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Customer: place a new order
router.post("/", verifyToken, createOrder);

// Customer: view their own orders
router.get("/my", verifyToken, getUserOrders);

// Admin: view all orders with pagination
router.get("/admin", verifyToken, getAllOrders);

// Admin: update order status
router.put("/admin/:id/status", verifyToken, updateOrderStatus);

// Admin: update payment status
router.put("/admin/:id/payment", verifyToken, updatePaymentStatus);

export default router;

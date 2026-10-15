import express from "express";
import { 
  getPaymentSettings, 
  updatePaymentSettings, 
  verifyUtr,
  createRazorpayOrder,
  verifyRazorpayPayment
} from "../controllers/paymentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: Get current payment methods, admin bank, UPI & Razorpay key
router.get("/settings", getPaymentSettings);

// Admin: Update bank account, UPI & Razorpay details
router.put("/settings", verifyToken, updatePaymentSettings);

// Public/Checkout: Validate & check UTR format in real time
router.post("/verify-utr", verifyUtr);

// Razorpay: Initialize order
router.post("/razorpay/create-order", createRazorpayOrder);

// Razorpay: Verify signature / payment
router.post("/razorpay/verify-payment", verifyRazorpayPayment);

export default router;

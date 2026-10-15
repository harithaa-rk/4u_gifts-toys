import express from "express";
import { 
  createVoucher, 
  verifyVoucher, 
  redeemVoucher, 
  getUserVouchers, 
  getAllVouchers 
} from "../controllers/voucherController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public / Guest accessible with optional auth
router.post("/", createVoucher);
router.get("/verify/:code", verifyVoucher);

// Protected routes
router.post("/redeem", verifyToken, redeemVoucher);
router.get("/my-vouchers", verifyToken, getUserVouchers);

// Admin route
router.get("/", getAllVouchers);

export default router;

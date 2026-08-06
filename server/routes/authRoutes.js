import express from "express";
import { registerUser, loginUser, verifyOtp, verifyMe } from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.get("/me", verifyToken, verifyMe);   // ← token validation endpoint

export default router;
import express from "express";
import { 
  registerUser, 
  loginUser, 
  verifyOtp, 
  verifyMe, 
  updateLanguagePreference,
  googleAuth,
  quickLogin 
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/verify-otp", verifyOtp);
router.post("/google", googleAuth);
router.post("/quick-login", quickLogin);
router.get("/me", verifyToken, verifyMe);   // Token validation endpoint
router.put("/preference", verifyToken, updateLanguagePreference); // Language preference endpoint

export default router;
import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import {
  getMyInvitations,
  verifyInvitationToken,
  acceptInvitation,
  rejectInvitation,
} from "../controllers/invitationController.js";

const router = express.Router();

// Preview invitation token without login (for email landing links)
router.get("/verify/:token", verifyInvitationToken);

// Customer pending invitations list
router.get("/my-invitations", verifyToken, getMyInvitations);

// Accept and Reject endpoints
router.post("/:id/accept", verifyToken, acceptInvitation);
router.post("/:id/reject", verifyToken, rejectInvitation);

// Support accept/reject by token directly
router.post("/accept", verifyToken, acceptInvitation);
router.post("/reject", verifyToken, rejectInvitation);

export default router;

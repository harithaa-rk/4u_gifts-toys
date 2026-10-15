import express from "express";
import Notification from "../models/Notification.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get customer notifications with unread count
router.get("/", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Retrieve notifications addressed to this user, or legacy notifications where recipientId is null
    const query = {
      $or: [{ recipientId: userId }, { recipientId: null, orderId: { $ne: null } }],
    };

    const [notifications, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate("actorId", "name avatar")
        .populate("wishlistId", "name coverImage")
        .sort({ createdAt: -1 })
        .limit(40),
      Notification.countDocuments({ ...query, read: false }),
    ]);

    res.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (err) {
    console.error("Error in GET /api/notifications:", err);
    res.status(500).json({ message: err.message });
  }
});

// Mark single notification as read
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id },
      { read: true },
      { new: true }
    );
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark all notifications as read for current user
router.put("/read-all", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    await Notification.updateMany(
      {
        $or: [{ recipientId: userId }, { recipientId: null }],
        read: false,
      },
      { read: true }
    );
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a notification
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Notification deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

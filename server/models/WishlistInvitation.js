import mongoose from "mongoose";

const wishlistInvitationSchema = new mongoose.Schema(
  {
    wishlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollaborativeWishlist",
      required: true,
      index: true,
    },
    inviterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    recipientUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    role: {
      type: String,
      enum: ["editor", "viewer"],
      default: "viewer",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "expired", "revoked"],
      default: "pending",
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      maxlength: 300,
      default: "",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    respondedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate active pending invitations for the same email and wishlist
wishlistInvitationSchema.index({ wishlistId: 1, recipientEmail: 1, status: 1 });

export default mongoose.model("WishlistInvitation", wishlistInvitationSchema);

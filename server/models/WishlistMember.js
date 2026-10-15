import mongoose from "mongoose";

const wishlistMemberSchema = new mongoose.Schema(
  {
    wishlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollaborativeWishlist",
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["owner", "editor", "viewer"],
      default: "viewer",
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "left", "removed"],
      default: "active",
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness of active membership
wishlistMemberSchema.index({ wishlistId: 1, userId: 1, status: 1 });
wishlistMemberSchema.index({ userId: 1, status: 1, createdAt: -1 });

export default mongoose.model("WishlistMember", wishlistMemberSchema);

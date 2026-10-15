import mongoose from "mongoose";

const wishlistActivitySchema = new mongoose.Schema(
  {
    wishlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollaborativeWishlist",
      required: true,
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "wishlist_created",
        "item_added",
        "item_removed",
        "item_note_updated",
        "item_status_changed",
        "member_joined",
        "member_left",
        "member_removed",
        "role_changed",
        "privacy_changed",
        "comment_added",
      ],
      required: true,
    },
    details: {
      type: Object,
      default: {},
    },
  },
  { timestamps: true }
);

wishlistActivitySchema.index({ wishlistId: 1, createdAt: -1 });

export default mongoose.model("WishlistActivity", wishlistActivitySchema);

import mongoose from "mongoose";

const reactionSchema = new mongoose.Schema({
  emoji: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const wishlistCommentSchema = new mongoose.Schema(
  {
    wishlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollaborativeWishlist",
      required: true,
      index: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      default: null,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    reactions: [reactionSchema],
  },
  { timestamps: true }
);

wishlistCommentSchema.index({ wishlistId: 1, createdAt: -1 });

export default mongoose.model("WishlistComment", wishlistCommentSchema);

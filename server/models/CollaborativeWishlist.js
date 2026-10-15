import mongoose from "mongoose";

const wishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantName: {
    type: String,
    default: null,
  },
  desiredQuantity: {
    type: Number,
    default: 1,
    min: 1,
    max: 99,
  },
  note: {
    type: String,
    maxlength: 300,
    default: "",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Group Shopping Coordination
  groupStatus: {
    type: String,
    enum: ["unreserved", "interested", "planning_to_buy", "reserved", "purchased"],
    default: "unreserved",
  },
  reservedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  reservedAt: {
    type: Date,
    default: null,
  },
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
    default: null,
  },
  order: {
    type: Number,
    default: 0,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const collaborativeWishlistSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    coverImage: {
      type: String,
      default: "",
    },
    visibility: {
      type: String,
      enum: ["private", "shared", "public"],
      default: "private",
      index: true,
    },
    shareCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    settings: {
      allowEditorInvites: {
        type: Boolean,
        default: false,
      },
      allowComments: {
        type: Boolean,
        default: true,
      },
      allowReactions: {
        type: Boolean,
        default: true,
      },
    },
    items: [wishlistItemSchema],
  },
  { timestamps: true }
);

// Indexes for high performance querying
collaborativeWishlistSchema.index({ ownerId: 1, isArchived: 1 });
collaborativeWishlistSchema.index({ visibility: 1, isArchived: 1, createdAt: -1 });

export default mongoose.model("CollaborativeWishlist", collaborativeWishlistSchema);

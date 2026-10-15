import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "wishlist_invite",
        "invite_accepted",
        "invite_rejected",
        "collaborator_added",
        "collaborator_removed",
        "item_added",
        "item_removed",
        "item_updated",
        "item_reserved",
        "item_purchased",
        "new_comment",
        "reaction_added",
        "order_status",
        "general",
      ],
      default: "general",
    },
    wishlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollaborativeWishlist",
      default: null,
    },
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WishlistInvitation",
      default: null,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
    message: {
      type: String,
      required: true,
    },
    link: {
      type: String,
      default: "",
    },
    metadata: {
      type: Object,
      default: {},
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);

import mongoose from "mongoose";
import CollaborativeWishlist from "../models/CollaborativeWishlist.js";
import WishlistMember from "../models/WishlistMember.js";

/**
 * Middleware factory for Role-Based Wishlist Authorization.
 * @param {'viewer' | 'editor' | 'owner'} minRole
 */
export const requireWishlistAccess = (minRole = "viewer") => {
  return async (req, res, next) => {
    try {
      const wishlistId = req.params.id || req.params.wishlistId;

      if (!wishlistId || !mongoose.Types.ObjectId.isValid(wishlistId)) {
        return res.status(400).json({ message: "Invalid wishlist ID format." });
      }

      const wishlist = await CollaborativeWishlist.findById(wishlistId);
      if (!wishlist) {
        return res.status(404).json({ message: "Wishlist not found." });
      }

      const currentUserId = req.userId ? req.userId.toString() : null;
      const isOwner = currentUserId && wishlist.ownerId.toString() === currentUserId;

      let member = null;
      let effectiveRole = null;

      if (isOwner) {
        effectiveRole = "owner";
      } else if (currentUserId) {
        member = await WishlistMember.findOne({
          wishlistId: wishlist._id,
          userId: currentUserId,
          status: "active",
        });
        if (member) {
          effectiveRole = member.role;
        }
      }

      // Check public guest access (only allowed for read-only 'viewer' role on unarchived public lists)
      if (!effectiveRole && minRole === "viewer" && wishlist.visibility === "public" && !wishlist.isArchived) {
        effectiveRole = "viewer";
        req.isPublicGuest = true;
      }

      // If user has no access at all
      if (!effectiveRole) {
        return res.status(403).json({
          message: "Access denied. This wishlist is private or shared only with invited members.",
        });
      }

      // Enforce role hierarchy: owner > editor > viewer
      if (minRole === "owner" && effectiveRole !== "owner") {
        return res.status(403).json({
          message: "Forbidden. Only the wishlist owner can perform this operation.",
        });
      }

      if (minRole === "editor" && effectiveRole !== "owner" && effectiveRole !== "editor") {
        return res.status(403).json({
          message: "Forbidden. Editor or Owner permissions are required for this action.",
        });
      }

      // Attach context to request
      req.wishlist = wishlist;
      req.userRole = effectiveRole;
      req.membership = member;

      next();
    } catch (err) {
      console.error("[AUTH] requireWishlistAccess error:", err);
      res.status(500).json({ message: "Server error verifying wishlist authorization." });
    }
  };
};

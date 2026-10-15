import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireWishlistAccess } from "../middleware/wishlistAuthMiddleware.js";
import {
  getMyWishlists,
  createWishlist,
  getWishlistById,
  updateWishlist,
  duplicateWishlist,
  toggleArchiveWishlist,
  deleteWishlist,
  addItemToWishlist,
  updateWishlistItem,
  updateItemGroupStatus,
  removeItemFromWishlist,
  reorderWishlistItems,
  inviteCollaborator,
  listWishlistInvitations,
  revokeInvitation,
  resendInvitation,
  updateMemberRole,
  removeMember,
  getWishlistActivity,
  getWishlistComments,
  addWishlistComment,
  deleteWishlistComment,
  toggleCommentReaction,
  getPublicWishlistByCode,
  discoverPublicWishlists,
  addProductsToMultipleWishlists,
  clearWishlist,
  migrateLegacyWishlist,
} from "../controllers/collaborativeWishlistController.js";

const router = express.Router();

// ── Public Routes (No authentication required) ──
router.get("/public", discoverPublicWishlists);
router.get("/public/:shareCode", getPublicWishlistByCode);

// ── Authenticated Customer Routes ──
router.get("/", verifyToken, getMyWishlists);
router.post("/", verifyToken, createWishlist);
router.post("/batch-add", verifyToken, addProductsToMultipleWishlists);
router.post("/migrate-legacy", verifyToken, migrateLegacyWishlist);

// Single Wishlist View (requires at least 'viewer' role or public access)
router.get("/:id", verifyToken, requireWishlistAccess("viewer"), getWishlistById);

// Update details & settings (Owner only)
router.put("/:id", verifyToken, requireWishlistAccess("owner"), updateWishlist);

// Duplicate list
router.post("/:id/duplicate", verifyToken, requireWishlistAccess("viewer"), duplicateWishlist);

// Archive / Restore (Owner only)
router.put("/:id/archive", verifyToken, requireWishlistAccess("owner"), toggleArchiveWishlist);

// Delete wishlist (Owner only)
router.delete("/:id", verifyToken, requireWishlistAccess("owner"), deleteWishlist);

// Items Management (Owner or Editor)
router.post("/:id/items", verifyToken, requireWishlistAccess("editor"), addItemToWishlist);
router.post("/:id/clear", verifyToken, requireWishlistAccess("editor"), clearWishlist);
router.put("/:id/items/:itemId", verifyToken, requireWishlistAccess("editor"), updateWishlistItem);
router.put("/:id/items/:itemId/group-status", verifyToken, requireWishlistAccess("viewer"), updateItemGroupStatus);
router.delete("/:id/items/:itemId", verifyToken, requireWishlistAccess("editor"), removeItemFromWishlist);
router.put("/:id/reorder", verifyToken, requireWishlistAccess("editor"), reorderWishlistItems);

// Invitations (Owner, or Editor if allowed by settings)
router.post("/:id/invitations", verifyToken, requireWishlistAccess("editor"), inviteCollaborator);
router.get("/:id/invitations", verifyToken, requireWishlistAccess("editor"), listWishlistInvitations);
router.delete("/:id/invitations/:inviteId", verifyToken, requireWishlistAccess("owner"), revokeInvitation);
router.post("/:id/invitations/:inviteId/resend", verifyToken, requireWishlistAccess("owner"), resendInvitation);

// Members Management
router.put("/:id/members/:memberId", verifyToken, requireWishlistAccess("owner"), updateMemberRole);
router.delete("/:id/members/:memberId", verifyToken, requireWishlistAccess("viewer"), removeMember);

// Activity Feed (At least 'viewer')
router.get("/:id/activity", verifyToken, requireWishlistAccess("viewer"), getWishlistActivity);

// Comments & Reactions
router.get("/:id/comments", verifyToken, requireWishlistAccess("viewer"), getWishlistComments);
router.post("/:id/comments", verifyToken, requireWishlistAccess("viewer"), addWishlistComment);
router.delete("/:id/comments/:commentId", verifyToken, requireWishlistAccess("viewer"), deleteWishlistComment);
router.post("/:id/comments/:commentId/reactions", verifyToken, requireWishlistAccess("viewer"), toggleCommentReaction);

export default router;

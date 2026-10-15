import crypto from "crypto";
import CollaborativeWishlist from "../models/CollaborativeWishlist.js";
import WishlistMember from "../models/WishlistMember.js";
import WishlistInvitation from "../models/WishlistInvitation.js";
import WishlistActivity from "../models/WishlistActivity.js";
import WishlistComment from "../models/WishlistComment.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Product from "../models/Product.js";
import { emitToWishlist, emitToUser } from "../socket.js";
import { sendWishlistInvitationEmail } from "../utils/emailService.js";

// Helper to sanitize public user representation
const safeUser = (user) => {
  if (!user) return null;
  return {
    _id: user._id,
    name: user.name || "4U Gifting Member",
    avatar: user.avatar || "",
    role: user.role,
  };
};

/**
 * 1. GET ALL CUSTOMER'S WISHLISTS (Owned, Shared With Me, Archived)
 */
export const getMyWishlists = async (req, res) => {
  try {
    const userId = req.userId;

    // A. Owned wishlists
    const ownedWishlists = await CollaborativeWishlist.find({
      ownerId: userId,
      isArchived: false,
    })
      .populate("ownerId", "name email avatar")
      .populate("items.productId", "name price images quantity category status")
      .sort({ updatedAt: -1 });

    // B. Shared with me wishlists (active membership where user is not owner)
    const memberships = await WishlistMember.find({
      userId,
      role: { $in: ["editor", "viewer"] },
      status: "active",
    }).populate({
      path: "wishlistId",
      populate: [
        { path: "ownerId", select: "name email avatar" },
        { path: "items.productId", select: "name price images quantity category status" },
      ],
    });

    const sharedWishlists = memberships
      .map((m) => {
        if (!m.wishlistId || m.wishlistId.isArchived) return null;
        const wObj = m.wishlistId.toObject();
        wObj.currentUserRole = m.role;
        return wObj;
      })
      .filter(Boolean);

    // C. Archived wishlists (owned by user)
    const archivedWishlists = await CollaborativeWishlist.find({
      ownerId: userId,
      isArchived: true,
    })
      .populate("ownerId", "name email avatar")
      .populate("items.productId", "name price images quantity category status")
      .sort({ updatedAt: -1 });

    // D. Fetch collaborator count & avatars for each list
    const attachMembers = async (lists) => {
      return Promise.all(
        lists.map(async (w) => {
          const wObj = w.toObject ? w.toObject() : w;
          const members = await WishlistMember.find({
            wishlistId: wObj._id,
            status: "active",
          }).populate("userId", "name avatar");

          wObj.members = members.map((m) => ({
            _id: m._id,
            userId: m.userId?._id,
            name: m.userId?.name || "Member",
            avatar: m.userId?.avatar,
            role: m.role,
          }));

          return wObj;
        })
      );
    };

    const [ownedWithMembers, sharedWithMembers, archivedWithMembers] = await Promise.all([
      attachMembers(ownedWishlists),
      attachMembers(sharedWishlists),
      attachMembers(archivedWishlists),
    ]);

    // Check if user has a primary wishlist; if not and no wishlists exist, create default "My Favorites"
    if (ownedWithMembers.length === 0 && sharedWithMembers.length === 0) {
      const defaultList = new CollaborativeWishlist({
        ownerId: userId,
        name: "My Favorites",
        description: "My personal boutique wishlist of toys, gifts, and treats.",
        visibility: "private",
        isPrimary: true,
      });
      await defaultList.save();

      // Owner membership
      await WishlistMember.create({
        wishlistId: defaultList._id,
        userId,
        role: "owner",
        status: "active",
      });

      const populatedDefault = await CollaborativeWishlist.findById(defaultList._id)
        .populate("ownerId", "name email avatar");

      const defaultObj = populatedDefault.toObject();
      defaultObj.members = [
        {
          userId,
          name: populatedDefault.ownerId?.name || "Me",
          role: "owner",
        },
      ];
      ownedWithMembers.push(defaultObj);
    }

    res.json({
      success: true,
      owned: ownedWithMembers,
      shared: sharedWithMembers,
      archived: archivedWithMembers,
    });
  } catch (err) {
    console.error("Error in getMyWishlists:", err);
    res.status(500).json({ message: "Failed to retrieve your wishlists." });
  }
};

/**
 * 2. CREATE NEW WISHLIST
 */
export const createWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { name, description, coverImage, visibility, settings, inviteEmails, inviteRole } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Wishlist name is required." });
    }

    // Generate unique shareCode if public
    let shareCode = undefined;
    if (visibility === "public" || visibility === "shared") {
      shareCode = crypto.randomBytes(6).toString("hex");
    }

    const wishlist = new CollaborativeWishlist({
      ownerId: userId,
      name: name.trim(),
      description: (description || "").trim(),
      coverImage: coverImage || "",
      visibility: visibility || "private",
      shareCode,
      settings: {
        allowEditorInvites: settings?.allowEditorInvites ?? false,
        allowComments: settings?.allowComments ?? true,
        allowReactions: settings?.allowReactions ?? true,
      },
    });

    await wishlist.save();

    // Create Owner membership
    await WishlistMember.create({
      wishlistId: wishlist._id,
      userId,
      role: "owner",
      status: "active",
    });

    // Record creation activity
    await WishlistActivity.create({
      wishlistId: wishlist._id,
      actorId: userId,
      type: "wishlist_created",
      details: { name: wishlist.name },
    });

    // If emails were provided on creation, dispatch invitations
    if (Array.isArray(inviteEmails) && inviteEmails.length > 0) {
      const inviter = await User.findById(userId);
      const role = inviteRole === "editor" ? "editor" : "viewer";

      for (const rawEmail of inviteEmails) {
        const email = (rawEmail || "").trim().toLowerCase();
        if (!email || email === inviter?.email?.toLowerCase()) continue;

        // Check if recipient is registered
        const recipientUser = await User.findOne({ email });

        // Token creation
        const rawToken = crypto.randomBytes(32).toString("hex");
        const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const invite = await WishlistInvitation.create({
          wishlistId: wishlist._id,
          inviterId: userId,
          recipientEmail: email,
          recipientUserId: recipientUser?._id || null,
          role,
          status: "pending",
          tokenHash,
          expiresAt,
        });

        // In-app notification if registered
        if (recipientUser) {
          await Notification.create({
            recipientId: recipientUser._id,
            actorId: userId,
            type: "wishlist_invite",
            wishlistId: wishlist._id,
            invitationId: invite._id,
            message: `${inviter?.name || "A friend"} invited you to collaborate on wishlist "${wishlist.name}"! 🎁`,
            link: `/wishlist/${wishlist._id}`,
          });
          emitToUser(recipientUser._id, "notification:new", {
            message: `${inviter?.name || "A friend"} invited you to "${wishlist.name}"!`,
          });
        }

        // Send email
        await sendWishlistInvitationEmail({
          recipientEmail: email,
          inviterName: inviter?.name || "A 4U Patron",
          wishlistName: wishlist.name,
          role,
          invitationToken: rawToken,
          expiresAt,
        });
      }
    }

    const populated = await CollaborativeWishlist.findById(wishlist._id)
      .populate("ownerId", "name email avatar");

    res.status(201).json({
      success: true,
      message: `Wishlist "${wishlist.name}" created successfully! 🎉`,
      wishlist: populated,
    });
  } catch (err) {
    console.error("Error in createWishlist:", err);
    res.status(500).json({ message: "Failed to create wishlist." });
  }
};

/**
 * 3. GET SINGLE WISHLIST BY ID
 */
export const getWishlistById = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const effectiveRole = req.userRole;

    // Populate owner, items with product details, and items' addedBy
    await wishlist.populate([
      { path: "ownerId", select: "name email avatar" },
      { path: "items.productId", select: "name price images quantity category brand description status model3d variants" },
      { path: "items.addedBy", select: "name avatar" },
      { path: "items.reservedBy", select: "name avatar" },
      { path: "items.purchasedBy", select: "name avatar" },
    ]);

    // Active members
    const members = await WishlistMember.find({
      wishlistId: wishlist._id,
      status: "active",
    }).populate("userId", "name email avatar");

    const formattedMembers = members.map((m) => ({
      _id: m._id,
      userId: m.userId?._id,
      name: m.userId?.name || "Member",
      avatar: m.userId?.avatar || "",
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    // Permissions summary
    const permissions = {
      role: effectiveRole,
      canEditItems: effectiveRole === "owner" || effectiveRole === "editor",
      canInvite: effectiveRole === "owner" || (effectiveRole === "editor" && wishlist.settings?.allowEditorInvites),
      canManageSettings: effectiveRole === "owner",
      canComment: (wishlist.settings?.allowComments ?? true) && (effectiveRole === "owner" || effectiveRole === "editor" || effectiveRole === "viewer"),
      canReact: wishlist.settings?.allowReactions ?? true,
      isOwner: effectiveRole === "owner",
      isGuest: Boolean(req.isPublicGuest),
    };

    // Filter out deleted products gracefully while keeping placeholder if needed
    const cleanItems = wishlist.items.map((item) => {
      const it = item.toObject();
      if (!it.productId) {
        it.isUnavailable = true;
        it.product = {
          name: "Item no longer available",
          price: 0,
          quantity: 0,
          images: [],
        };
      } else {
        it.product = it.productId;
      }
      return it;
    });

    res.json({
      success: true,
      wishlist: {
        ...wishlist.toObject(),
        items: cleanItems,
        members: formattedMembers,
        permissions,
      },
    });
  } catch (err) {
    console.error("Error in getWishlistById:", err);
    res.status(500).json({ message: "Failed to retrieve wishlist details." });
  }
};

/**
 * 4. UPDATE WISHLIST DETAILS & SETTINGS (Owner Only)
 */
export const updateWishlist = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const { name, description, coverImage, visibility, settings } = req.body;

    if (name) wishlist.name = name.trim();
    if (description !== undefined) wishlist.description = description.trim();
    if (coverImage !== undefined) wishlist.coverImage = coverImage;

    // Visibility change
    if (visibility && ["private", "shared", "public"].includes(visibility)) {
      const prevVis = wishlist.visibility;
      wishlist.visibility = visibility;
      if (visibility === "public" && !wishlist.shareCode) {
        wishlist.shareCode = crypto.randomBytes(6).toString("hex");
      }
      if (prevVis !== visibility) {
        await WishlistActivity.create({
          wishlistId: wishlist._id,
          actorId: req.userId,
          type: "privacy_changed",
          details: { oldVisibility: prevVis, newVisibility: visibility },
        });
      }
    }

    if (settings) {
      if (typeof settings.allowEditorInvites === "boolean") {
        wishlist.settings.allowEditorInvites = settings.allowEditorInvites;
      }
      if (typeof settings.allowComments === "boolean") {
        wishlist.settings.allowComments = settings.allowComments;
      }
      if (typeof settings.allowReactions === "boolean") {
        wishlist.settings.allowReactions = settings.allowReactions;
      }
    }

    await wishlist.save();
    emitToWishlist(wishlist._id, "wishlist:updated", { type: "settings_updated" });

    res.json({
      success: true,
      message: "Wishlist settings updated successfully! ✨",
      wishlist,
    });
  } catch (err) {
    console.error("Error in updateWishlist:", err);
    res.status(500).json({ message: "Failed to update wishlist." });
  }
};

/**
 * 5. DUPLICATE WISHLIST
 */
export const duplicateWishlist = async (req, res) => {
  try {
    const sourceWishlist = req.wishlist;
    const userId = req.userId;

    const duplicated = new CollaborativeWishlist({
      ownerId: userId,
      name: `${sourceWishlist.name} (Copy)`,
      description: sourceWishlist.description,
      coverImage: sourceWishlist.coverImage,
      visibility: "private",
      settings: sourceWishlist.settings,
      items: sourceWishlist.items.map((it) => ({
        productId: it.productId,
        variantName: it.variantName,
        desiredQuantity: it.desiredQuantity,
        note: it.note,
        priority: it.priority,
        addedBy: userId,
        groupStatus: "unreserved",
      })),
    });

    await duplicated.save();

    // Owner membership
    await WishlistMember.create({
      wishlistId: duplicated._id,
      userId,
      role: "owner",
      status: "active",
    });

    res.status(201).json({
      success: true,
      message: `Wishlist cloned as "${duplicated.name}"! 📋`,
      wishlist: duplicated,
    });
  } catch (err) {
    console.error("Error in duplicateWishlist:", err);
    res.status(500).json({ message: "Failed to duplicate wishlist." });
  }
};

/**
 * 6. ARCHIVE / RESTORE WISHLIST (Owner Only)
 */
export const toggleArchiveWishlist = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    wishlist.isArchived = !wishlist.isArchived;
    await wishlist.save();

    emitToWishlist(wishlist._id, "wishlist:updated", {
      type: wishlist.isArchived ? "archived" : "restored",
    });

    res.json({
      success: true,
      message: wishlist.isArchived ? "Wishlist moved to archive. 📦" : "Wishlist restored! ✨",
      isArchived: wishlist.isArchived,
    });
  } catch (err) {
    console.error("Error in toggleArchiveWishlist:", err);
    res.status(500).json({ message: "Failed to archive/restore wishlist." });
  }
};

/**
 * 7. DELETE WISHLIST (Owner Only)
 */
export const deleteWishlist = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const wishlistId = wishlist._id;

    // Delete memberships, invites, activities, comments, and wishlist document
    await Promise.all([
      CollaborativeWishlist.findByIdAndDelete(wishlistId),
      WishlistMember.deleteMany({ wishlistId }),
      WishlistInvitation.deleteMany({ wishlistId }),
      WishlistActivity.deleteMany({ wishlistId }),
      WishlistComment.deleteMany({ wishlistId }),
    ]);

    emitToWishlist(wishlistId, "wishlist:deleted", { wishlistId });

    res.json({
      success: true,
      message: "Wishlist permanently deleted.",
    });
  } catch (err) {
    console.error("Error in deleteWishlist:", err);
    res.status(500).json({ message: "Failed to delete wishlist." });
  }
};

/**
 * 8. ADD PRODUCT TO WISHLIST (Owner or Editor)
 */
export const addItemToWishlist = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const userId = req.userId;
    const { productId, variantName, desiredQuantity, note, priority } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found in catalogue." });
    }

    // Prevent duplicate entries for the same product and variant
    const existingIndex = wishlist.items.findIndex(
      (it) => it.productId?.toString() === productId.toString() && (it.variantName || null) === (variantName || null)
    );

    if (existingIndex !== -1) {
      return res.status(400).json({
        message: "This product is already in the wishlist. You can edit its desired quantity or note.",
      });
    }

    const newItem = {
      productId,
      variantName: variantName || null,
      desiredQuantity: Math.max(1, Number(desiredQuantity) || 1),
      note: (note || "").trim().slice(0, 300),
      priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
      addedBy: userId,
      groupStatus: "unreserved",
      order: wishlist.items.length,
    };

    wishlist.items.push(newItem);
    await wishlist.save();

    // Log activity
    const actor = await User.findById(userId).select("name");
    await WishlistActivity.create({
      wishlistId: wishlist._id,
      actorId: userId,
      type: "item_added",
      details: {
        productName: product.name,
        productId: product._id,
        quantity: newItem.desiredQuantity,
        actorName: actor?.name || "Member",
      },
    });

    // Notify other members
    const members = await WishlistMember.find({
      wishlistId: wishlist._id,
      userId: { $ne: userId },
      status: "active",
    });

    for (const m of members) {
      await Notification.create({
        recipientId: m.userId,
        actorId: userId,
        type: "item_added",
        wishlistId: wishlist._id,
        message: `${actor?.name || "A collaborator"} added "${product.name}" to wishlist "${wishlist.name}". 🎁`,
        link: `/wishlist/${wishlist._id}`,
      });
      emitToUser(m.userId, "notification:new", {
        message: `${actor?.name || "A collaborator"} added "${product.name}" to "${wishlist.name}".`,
      });
    }

    emitToWishlist(wishlist._id, "wishlist:item_added", {
      item: newItem,
      productName: product.name,
    });

    res.status(201).json({
      success: true,
      message: `${product.name} added to wishlist! 🎉`,
      items: wishlist.items,
    });
  } catch (err) {
    console.error("Error in addItemToWishlist:", err);
    res.status(500).json({ message: "Failed to add item to wishlist." });
  }
};

/**
 * 9. UPDATE ITEM IN WISHLIST (Note, Desired Quantity, Priority)
 */
export const updateWishlistItem = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const itemId = req.params.itemId;
    const { note, desiredQuantity, priority } = req.body;

    const item = wishlist.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Wishlist item not found." });
    }

    if (note !== undefined) item.note = note.trim().slice(0, 300);
    if (desiredQuantity !== undefined) item.desiredQuantity = Math.max(1, Number(desiredQuantity));
    if (priority && ["low", "medium", "high"].includes(priority)) item.priority = priority;

    await wishlist.save();

    // Log Activity
    await WishlistActivity.create({
      wishlistId: wishlist._id,
      actorId: req.userId,
      type: "item_note_updated",
      details: { itemId, note: item.note, quantity: item.desiredQuantity },
    });

    emitToWishlist(wishlist._id, "wishlist:item_updated", { itemId, item });

    res.json({
      success: true,
      message: "Item details updated! ✨",
      item,
    });
  } catch (err) {
    console.error("Error in updateWishlistItem:", err);
    res.status(500).json({ message: "Failed to update wishlist item." });
  }
};

/**
 * 10. UPDATE ITEM GROUP SHOPPING COORDINATION STATUS (Planning to buy, Reserved, Purchased, Unreserved)
 */
export const updateItemGroupStatus = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const itemId = req.params.itemId;
    const userId = req.userId;
    const { groupStatus } = req.body;

    const validStatuses = ["unreserved", "interested", "planning_to_buy", "reserved", "purchased"];
    if (!validStatuses.includes(groupStatus)) {
      return res.status(400).json({ message: "Invalid group status." });
    }

    const item = wishlist.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Wishlist item not found." });
    }

    // Reservation conflict protection
    if (
      (groupStatus === "reserved" || groupStatus === "purchased") &&
      item.groupStatus === "reserved" &&
      item.reservedBy &&
      item.reservedBy.toString() !== userId.toString()
    ) {
      const reservingUser = await User.findById(item.reservedBy).select("name");
      return res.status(409).json({
        message: `This item was already reserved by ${reservingUser?.name || "another collaborator"}.`,
      });
    }

    const prevStatus = item.groupStatus;
    item.groupStatus = groupStatus;

    if (groupStatus === "reserved" || groupStatus === "planning_to_buy") {
      item.reservedBy = userId;
      item.reservedAt = new Date();
    } else if (groupStatus === "purchased") {
      item.purchasedBy = userId;
      item.reservedBy = userId;
    } else if (groupStatus === "unreserved") {
      item.reservedBy = null;
      item.reservedAt = null;
      item.purchasedBy = null;
    }

    await wishlist.save();

    const actor = await User.findById(userId).select("name");
    const product = await Product.findById(item.productId).select("name");

    await WishlistActivity.create({
      wishlistId: wishlist._id,
      actorId: userId,
      type: "item_status_changed",
      details: {
        productName: product?.name || "Item",
        oldStatus: prevStatus,
        newStatus: groupStatus,
        actorName: actor?.name || "Member",
      },
    });

    emitToWishlist(wishlist._id, "wishlist:item_status_changed", {
      itemId,
      groupStatus,
      reservedBy: actor ? { _id: actor._id, name: actor.name } : null,
    });

    res.json({
      success: true,
      message: `Item marked as "${groupStatus.replace(/_/g, " ")}"! 👍`,
      item,
    });
  } catch (err) {
    console.error("Error in updateItemGroupStatus:", err);
    res.status(500).json({ message: "Failed to update item group status." });
  }
};

/**
 * 11. REMOVE ITEM FROM WISHLIST (Owner or Editor)
 */
export const removeItemFromWishlist = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const itemId = req.params.itemId;
    const userId = req.userId;

    const item = wishlist.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in wishlist." });
    }

    const product = await Product.findById(item.productId).select("name");
    const productName = product?.name || "Item";

    item.deleteOne();
    await wishlist.save();

    const actor = await User.findById(userId).select("name");
    await WishlistActivity.create({
      wishlistId: wishlist._id,
      actorId: userId,
      type: "item_removed",
      details: { productName, actorName: actor?.name || "Member" },
    });

    emitToWishlist(wishlist._id, "wishlist:item_removed", { itemId, productName });

    res.json({
      success: true,
      message: `${productName} removed from wishlist.`,
    });
  } catch (err) {
    console.error("Error in removeItemFromWishlist:", err);
    res.status(500).json({ message: "Failed to remove item from wishlist." });
  }
};

/**
 * 12. REORDER ITEMS (Owner or Editor)
 */
export const reorderWishlistItems = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const { itemIds } = req.body;

    if (!Array.isArray(itemIds)) {
      return res.status(400).json({ message: "itemIds must be an array of IDs in new order." });
    }

    itemIds.forEach((id, index) => {
      const it = wishlist.items.id(id);
      if (it) it.order = index;
    });

    // Sort items array by order field
    wishlist.items.sort((a, b) => (a.order || 0) - (b.order || 0));
    await wishlist.save();

    emitToWishlist(wishlist._id, "wishlist:reordered", { itemIds });

    res.json({ success: true, message: "Items reordered." });
  } catch (err) {
    console.error("Error in reorderWishlistItems:", err);
    res.status(500).json({ message: "Failed to reorder items." });
  }
};

/**
 * 13. INVITE COLLABORATOR BY EMAIL
 */
export const inviteCollaborator = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const inviterId = req.userId;
    const { email: rawEmail, role, message } = req.body;

    if (!rawEmail || !rawEmail.trim()) {
      return res.status(400).json({ message: "Recipient email is required." });
    }

    const email = rawEmail.trim().toLowerCase();
    const inviter = await User.findById(inviterId);

    // Prevent inviting oneself
    if (inviter && inviter.email?.toLowerCase() === email) {
      return res.status(400).json({ message: "You cannot invite yourself to your own wishlist." });
    }

    const assignedRole = role === "editor" ? "editor" : "viewer";

    // Check if recipient is already an active member
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const alreadyMember = await WishlistMember.findOne({
        wishlistId: wishlist._id,
        userId: existingUser._id,
        status: "active",
      });
      if (alreadyMember) {
        return res.status(400).json({ message: `${existingUser.name || email} is already an active collaborator.` });
      }
    }

    // Check for existing pending invitation
    const existingInvite = await WishlistInvitation.findOne({
      wishlistId: wishlist._id,
      recipientEmail: email,
      status: "pending",
    });

    if (existingInvite && existingInvite.expiresAt > new Date()) {
      return res.status(400).json({
        message: "An active invitation has already been sent to this email. You can resend or revoke it.",
      });
    }

    // Token creation with SHA-256 hash
    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = new WishlistInvitation({
      wishlistId: wishlist._id,
      inviterId,
      recipientEmail: email,
      recipientUserId: existingUser?._id || null,
      role: assignedRole,
      status: "pending",
      tokenHash,
      message: (message || "").trim().slice(0, 300),
      expiresAt,
    });
    await invite.save();

    // If recipient is already registered in 4U, create in-app notification & emit socket
    if (existingUser) {
      await Notification.create({
        recipientId: existingUser._id,
        actorId: inviterId,
        type: "wishlist_invite",
        wishlistId: wishlist._id,
        invitationId: invite._id,
        message: `${inviter?.name || "A friend"} invited you to collaborate on "${wishlist.name}"! 🎁`,
        link: `/wishlist/${wishlist._id}`,
      });
      emitToUser(existingUser._id, "notification:new", {
        message: `${inviter?.name || "A friend"} invited you to collaborate on "${wishlist.name}".`,
      });
    }

    // Send boutique email
    const emailResult = await sendWishlistInvitationEmail({
      recipientEmail: email,
      inviterName: inviter?.name || "A 4U Patron",
      wishlistName: wishlist.name,
      role: assignedRole,
      message: invite.message,
      invitationToken: rawToken,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      message: `Invitation sent to ${email}! ✨`,
      invitation: {
        _id: invite._id,
        recipientEmail: email,
        role: assignedRole,
        status: invite.status,
        expiresAt: invite.expiresAt,
      },
      emailDelivered: emailResult.delivered,
      mockInviteUrl: emailResult.mock ? emailResult.inviteUrl : undefined,
    });
  } catch (err) {
    console.error("Error in inviteCollaborator:", err);
    res.status(500).json({ message: "Failed to send invitation." });
  }
};

/**
 * 14. LIST INVITATIONS FOR A WISHLIST (Owner or Editor)
 */
export const listWishlistInvitations = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const invites = await WishlistInvitation.find({
      wishlistId: wishlist._id,
    })
      .populate("inviterId", "name avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, invitations: invites });
  } catch (err) {
    console.error("Error in listWishlistInvitations:", err);
    res.status(500).json({ message: "Failed to fetch invitations." });
  }
};

/**
 * 15. CANCEL / REVOKE INVITATION
 */
export const revokeInvitation = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const inviteId = req.params.inviteId;

    const invite = await WishlistInvitation.findOne({
      _id: inviteId,
      wishlistId: wishlist._id,
    });

    if (!invite) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    invite.status = "revoked";
    await invite.save();

    res.json({ success: true, message: "Invitation revoked." });
  } catch (err) {
    console.error("Error in revokeInvitation:", err);
    res.status(500).json({ message: "Failed to revoke invitation." });
  }
};

/**
 * 16. RESEND INVITATION
 */
export const resendInvitation = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const inviteId = req.params.inviteId;
    const inviterId = req.userId;

    const invite = await WishlistInvitation.findOne({
      _id: inviteId,
      wishlistId: wishlist._id,
    });

    if (!invite) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    invite.tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    invite.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    invite.status = "pending";
    await invite.save();

    const inviter = await User.findById(inviterId);
    const emailResult = await sendWishlistInvitationEmail({
      recipientEmail: invite.recipientEmail,
      inviterName: inviter?.name || "A 4U Patron",
      wishlistName: wishlist.name,
      role: invite.role,
      message: invite.message,
      invitationToken: rawToken,
      expiresAt: invite.expiresAt,
    });

    res.json({
      success: true,
      message: `Invitation resent to ${invite.recipientEmail}!`,
      mockInviteUrl: emailResult.mock ? emailResult.inviteUrl : undefined,
    });
  } catch (err) {
    console.error("Error in resendInvitation:", err);
    res.status(500).json({ message: "Failed to resend invitation." });
  }
};

/**
 * 17. UPDATE MEMBER ROLE (Owner Only)
 */
export const updateMemberRole = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const memberId = req.params.memberId;
    const { role } = req.body;

    if (!["editor", "viewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified." });
    }

    const member = await WishlistMember.findOne({
      _id: memberId,
      wishlistId: wishlist._id,
      status: "active",
    }).populate("userId", "name");

    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    if (member.role === "owner") {
      return res.status(400).json({ message: "Cannot modify owner's role through this endpoint." });
    }

    const oldRole = member.role;
    member.role = role;
    await member.save();

    await WishlistActivity.create({
      wishlistId: wishlist._id,
      actorId: req.userId,
      type: "role_changed",
      details: { memberName: member.userId?.name || "Member", oldRole, newRole: role },
    });

    emitToWishlist(wishlist._id, "wishlist:member_updated", {
      memberId,
      userId: member.userId?._id,
      role,
    });

    res.json({
      success: true,
      message: `${member.userId?.name || "Member"}'s role updated to ${role}.`,
    });
  } catch (err) {
    console.error("Error in updateMemberRole:", err);
    res.status(500).json({ message: "Failed to update member role." });
  }
};

/**
 * 18. REMOVE MEMBER / LEAVE WISHLIST (Owner or Self)
 */
export const removeMember = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const memberId = req.params.memberId;
    const currentUserId = req.userId.toString();
    const isOwner = wishlist.ownerId.toString() === currentUserId;

    const member = await WishlistMember.findOne({
      _id: memberId,
      wishlistId: wishlist._id,
      status: "active",
    }).populate("userId", "name");

    if (!member) {
      return res.status(404).json({ message: "Member not found." });
    }

    // Owner cannot be removed
    if (member.role === "owner" || member.userId?._id.toString() === wishlist.ownerId.toString()) {
      return res.status(400).json({ message: "The wishlist owner cannot be removed." });
    }

    const isSelfLeaving = member.userId?._id.toString() === currentUserId;
    if (!isOwner && !isSelfLeaving) {
      return res.status(403).json({ message: "Forbidden. You can only remove yourself unless you are the owner." });
    }

    member.status = isSelfLeaving ? "left" : "removed";
    await member.save();

    await WishlistActivity.create({
      wishlistId: wishlist._id,
      actorId: req.userId,
      type: isSelfLeaving ? "member_left" : "member_removed",
      details: { memberName: member.userId?.name || "Member" },
    });

    emitToWishlist(wishlist._id, "wishlist:member_removed", {
      memberId,
      userId: member.userId?._id,
      isSelfLeaving,
    });

    res.json({
      success: true,
      message: isSelfLeaving ? "You left the wishlist." : "Collaborator removed.",
    });
  } catch (err) {
    console.error("Error in removeMember:", err);
    res.status(500).json({ message: "Failed to remove member." });
  }
};

/**
 * 19. GET ACTIVITY FEED
 */
export const getWishlistActivity = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(50, parseInt(req.query.limit) || 20);

    const activities = await WishlistActivity.find({
      wishlistId: wishlist._id,
    })
      .populate("actorId", "name avatar")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, activities });
  } catch (err) {
    console.error("Error in getWishlistActivity:", err);
    res.status(500).json({ message: "Failed to retrieve activity feed." });
  }
};

/**
 * 20. GET COMMENTS
 */
export const getWishlistComments = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const comments = await WishlistComment.find({
      wishlistId: wishlist._id,
    })
      .populate("authorId", "name avatar")
      .populate("reactions.userId", "name")
      .sort({ createdAt: 1 });

    res.json({ success: true, comments });
  } catch (err) {
    console.error("Error in getWishlistComments:", err);
    res.status(500).json({ message: "Failed to retrieve comments." });
  }
};

/**
 * 21. ADD COMMENT
 */
export const addWishlistComment = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const authorId = req.userId;
    const { content, productId } = req.body;

    if (!wishlist.settings?.allowComments) {
      return res.status(403).json({ message: "Comments are disabled for this wishlist." });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content cannot be empty." });
    }

    const comment = new WishlistComment({
      wishlistId: wishlist._id,
      productId: productId || null,
      authorId,
      content: content.trim().slice(0, 500),
    });
    await comment.save();

    const populated = await WishlistComment.findById(comment._id)
      .populate("authorId", "name avatar");

    await WishlistActivity.create({
      wishlistId: wishlist._id,
      actorId: authorId,
      type: "comment_added",
      details: { textSnippet: comment.content.slice(0, 60) },
    });

    emitToWishlist(wishlist._id, "wishlist:comment_added", { comment: populated });

    res.status(201).json({ success: true, comment: populated });
  } catch (err) {
    console.error("Error in addWishlistComment:", err);
    res.status(500).json({ message: "Failed to post comment." });
  }
};

/**
 * 22. DELETE COMMENT
 */
export const deleteWishlistComment = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const commentId = req.params.commentId;
    const userId = req.userId.toString();
    const isOwner = wishlist.ownerId.toString() === userId;

    const comment = await WishlistComment.findOne({
      _id: commentId,
      wishlistId: wishlist._id,
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Only comment author or wishlist owner can delete
    if (!isOwner && comment.authorId.toString() !== userId) {
      return res.status(403).json({ message: "Forbidden. You can only delete your own comments." });
    }

    await comment.deleteOne();
    emitToWishlist(wishlist._id, "wishlist:comment_deleted", { commentId });

    res.json({ success: true, message: "Comment deleted." });
  } catch (err) {
    console.error("Error in deleteWishlistComment:", err);
    res.status(500).json({ message: "Failed to delete comment." });
  }
};

/**
 * 23. TOGGLE REACTION ON COMMENT
 */
export const toggleCommentReaction = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const commentId = req.params.commentId;
    const userId = req.userId;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ message: "Emoji is required." });
    }

    const comment = await WishlistComment.findOne({
      _id: commentId,
      wishlistId: wishlist._id,
    });

    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    const existingIndex = comment.reactions.findIndex(
      (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingIndex !== -1) {
      comment.reactions.splice(existingIndex, 1);
    } else {
      comment.reactions.push({ emoji, userId });
    }

    await comment.save();

    const populated = await WishlistComment.findById(comment._id)
      .populate("authorId", "name avatar")
      .populate("reactions.userId", "name");

    emitToWishlist(wishlist._id, "wishlist:reaction_updated", {
      commentId,
      reactions: populated.reactions,
    });

    res.json({ success: true, reactions: populated.reactions });
  } catch (err) {
    console.error("Error in toggleCommentReaction:", err);
    res.status(500).json({ message: "Failed to update reaction." });
  }
};

/**
 * 24. PUBLIC SHAREABLE WISHLIST VIEW (No sensitive customer details exposed)
 */
export const getPublicWishlistByCode = async (req, res) => {
  try {
    const { shareCode } = req.params;

    const wishlist = await CollaborativeWishlist.findOne({
      shareCode,
      visibility: "public",
      isArchived: false,
    })
      .populate("ownerId", "name avatar")
      .populate("items.productId", "name price images quantity category brand description status model3d");

    if (!wishlist) {
      return res.status(404).json({ message: "Public wishlist not found or sharing has been disabled." });
    }

    // Sanitized output for public consumers
    const cleanList = {
      _id: wishlist._id,
      name: wishlist.name,
      description: wishlist.description,
      coverImage: wishlist.coverImage,
      owner: {
        name: wishlist.ownerId?.name || "4U Gifting Member",
        avatar: wishlist.ownerId?.avatar || "",
      },
      itemsCount: wishlist.items.length,
      items: wishlist.items.map((it) => ({
        _id: it._id,
        productId: it.productId?._id,
        name: it.productId?.name || "Curated Toy",
        price: it.productId?.price || 0,
        images: it.productId?.images || [],
        quantity: it.productId?.quantity || 0,
        category: it.productId?.category || "",
        desiredQuantity: it.desiredQuantity,
        note: it.note,
        priority: it.priority,
        groupStatus: it.groupStatus,
      })),
    };

    res.json({ success: true, wishlist: cleanList });
  } catch (err) {
    console.error("Error in getPublicWishlistByCode:", err);
    res.status(500).json({ message: "Failed to load public wishlist." });
  }
};

/**
 * 25. DISCOVER PUBLIC WISHLISTS (Opt-in public collections)
 */
export const discoverPublicWishlists = async (req, res) => {
  try {
    const publicLists = await CollaborativeWishlist.find({
      visibility: "public",
      isArchived: false,
    })
      .populate("ownerId", "name avatar")
      .populate("items.productId", "name price images quantity")
      .sort({ updatedAt: -1 })
      .limit(20);

    const formatted = publicLists.map((w) => ({
      _id: w._id,
      name: w.name,
      description: w.description,
      coverImage: w.coverImage,
      shareCode: w.shareCode,
      owner: {
        name: w.ownerId?.name || "4U Member",
        avatar: w.ownerId?.avatar || "",
      },
      itemsCount: w.items.length,
      previewImages: w.items
        .slice(0, 4)
        .map((it) => it.productId?.images?.[0])
        .filter(Boolean),
    }));

    res.json({ success: true, wishlists: formatted });
  } catch (err) {
    console.error("Error in discoverPublicWishlists:", err);
    res.status(500).json({ message: "Failed to discover public wishlists." });
  }
};

/**
 * 26. BATCH ADD PRODUCT TO MULTIPLE WISHLISTS
 */
export const addProductsToMultipleWishlists = async (req, res) => {
  try {
    const userId = req.userId;
    const { wishlistIds, productId, variantName, desiredQuantity, note, priority } = req.body;

    if (!Array.isArray(wishlistIds) || wishlistIds.length === 0) {
      return res.status(400).json({ message: "At least one wishlist must be selected." });
    }
    if (!productId) {
      return res.status(400).json({ message: "Product ID is required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    const results = [];
    const actor = await User.findById(userId).select("name");

    for (const wId of wishlistIds) {
      const wishlist = await CollaborativeWishlist.findById(wId);
      if (!wishlist) {
        results.push({ wishlistId: wId, name: "Unknown", status: "not_found" });
        continue;
      }

      // Check permission: must be owner or editor
      const isOwner = wishlist.ownerId.toString() === userId.toString();
      let isEditor = false;
      if (!isOwner) {
        const member = await WishlistMember.findOne({ wishlistId: wId, userId, status: "active" });
        if (member && (member.role === "editor" || member.role === "owner")) {
          isEditor = true;
        }
      }

      if (!isOwner && !isEditor) {
        results.push({ wishlistId: wId, name: wishlist.name, status: "unauthorized" });
        continue;
      }

      // Check duplicate
      const alreadyInList = wishlist.items.some(
        (it) => it.productId.toString() === productId.toString() &&
          ((!it.variantName && !variantName) || it.variantName === variantName)
      );

      if (alreadyInList) {
        results.push({ wishlistId: wId, name: wishlist.name, status: "already_exists" });
        continue;
      }

      const newItem = {
        productId,
        variantName: variantName || null,
        desiredQuantity: Math.max(1, Number(desiredQuantity) || 1),
        note: (note || "").trim().slice(0, 300),
        priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
        addedBy: userId,
        groupStatus: "unreserved",
        order: wishlist.items.length,
      };

      wishlist.items.push(newItem);
      await wishlist.save();

      // Log activity
      await WishlistActivity.create({
        wishlistId: wishlist._id,
        actorId: userId,
        type: "item_added",
        details: {
          productName: product.name,
          productId: product._id,
          quantity: newItem.desiredQuantity,
          actorName: actor?.name || "Member",
        },
      });

      emitToWishlist(wishlist._id, "wishlist:item_added", {
        item: newItem,
        productName: product.name,
      });

      results.push({ wishlistId: wId, name: wishlist.name, status: "added" });
    }

    const addedCount = results.filter((r) => r.status === "added").length;
    const alreadyExistsCount = results.filter((r) => r.status === "already_exists").length;

    res.json({
      success: true,
      results,
      addedCount,
      alreadyExistsCount,
      message: addedCount > 0 
        ? `Added ${product.name} to ${addedCount} wishlist${addedCount > 1 ? "s" : ""}!` 
        : `Product is already saved in the selected wishlist${results.length > 1 ? "s" : ""}.`,
    });
  } catch (err) {
    console.error("Error in addProductsToMultipleWishlists:", err);
    res.status(500).json({ message: "Failed to add product to wishlists." });
  }
};

/**
 * 27. CLEAR ALL ITEMS IN WISHLIST (Owner or Editor)
 */
export const clearWishlist = async (req, res) => {
  try {
    const wishlist = req.wishlist;
    const userId = req.userId;

    const count = wishlist.items.length;
    wishlist.items = [];
    await wishlist.save();

    const actor = await User.findById(userId).select("name");
    await WishlistActivity.create({
      wishlistId: wishlist._id,
      actorId: userId,
      type: "item_removed",
      details: { productName: `All ${count} items`, actorName: actor?.name || "Member" },
    });

    emitToWishlist(wishlist._id, "wishlist:cleared", { wishlistId: wishlist._id });

    res.json({
      success: true,
      message: "Wishlist cleared successfully.",
      items: [],
    });
  } catch (err) {
    console.error("Error in clearWishlist:", err);
    res.status(500).json({ message: "Failed to clear wishlist." });
  }
};

/**
 * 28. MIGRATE LEGACY WISHLIST FROM LOCALSTORAGE TO MONGODB
 */
export const migrateLegacyWishlist = async (req, res) => {
  try {
    const userId = req.userId;
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.json({ success: true, migratedCount: 0 });
    }

    // Find or create default "My Wishlist"
    let defaultList = await CollaborativeWishlist.findOne({
      ownerId: userId,
      isArchived: false,
    }).sort({ createdAt: 1 });

    if (!defaultList) {
      defaultList = await CollaborativeWishlist.create({
        ownerId: userId,
        name: "My Wishlist",
        description: "My collection of favorite toys & gifts 🌸",
        visibility: "private",
        items: [],
      });
      await WishlistMember.create({
        wishlistId: defaultList._id,
        userId,
        role: "owner",
        status: "active",
      });
    }

    let migratedCount = 0;
    for (const rawItem of items) {
      const prodId = rawItem._id || rawItem.productId;
      if (!prodId) continue;

      const product = await Product.findById(prodId);
      if (!product) continue;

      const already = defaultList.items.some((it) => it.productId.toString() === prodId.toString());
      if (!already) {
        defaultList.items.push({
          productId: prodId,
          variantName: rawItem.selectedVariant || null,
          desiredQuantity: rawItem.quantity || 1,
          note: "",
          priority: "medium",
          addedBy: userId,
          groupStatus: "unreserved",
          order: defaultList.items.length,
        });
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      await defaultList.save();
    }

    res.json({
      success: true,
      migratedCount,
      wishlistId: defaultList._id,
    });
  } catch (err) {
    console.error("Error in migrateLegacyWishlist:", err);
    res.status(500).json({ message: "Failed to migrate legacy wishlist." });
  }
};

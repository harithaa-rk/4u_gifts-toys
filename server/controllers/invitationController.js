import crypto from "crypto";
import WishlistInvitation from "../models/WishlistInvitation.js";
import WishlistMember from "../models/WishlistMember.js";
import CollaborativeWishlist from "../models/CollaborativeWishlist.js";
import WishlistActivity from "../models/WishlistActivity.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { emitToWishlist, emitToUser } from "../socket.js";

/**
 * 1. GET PENDING INVITATIONS FOR CURRENT LOGGED IN USER
 */
export const getMyInvitations = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const email = (user.email || "").trim().toLowerCase();

    // Match either by recipientUserId or by normalized email
    const invitations = await WishlistInvitation.find({
      $or: [{ recipientUserId: userId }, { recipientEmail: email }],
      status: "pending",
      expiresAt: { $gt: new Date() },
    })
      .populate("inviterId", "name email avatar")
      .populate("wishlistId", "name description coverImage items")
      .sort({ createdAt: -1 });

    const formatted = invitations
      .filter((inv) => inv.wishlistId && !inv.wishlistId.isArchived)
      .map((inv) => ({
        _id: inv._id,
        wishlistId: inv.wishlistId._id,
        wishlistName: inv.wishlistId.name,
        wishlistDescription: inv.wishlistId.description,
        coverImage: inv.wishlistId.coverImage,
        itemsCount: inv.wishlistId.items?.length || 0,
        inviterName: inv.inviterId?.name || "A 4U Patron",
        inviterAvatar: inv.inviterId?.avatar || "",
        role: inv.role,
        message: inv.message,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      }));

    res.json({ success: true, invitations: formatted });
  } catch (err) {
    console.error("Error in getMyInvitations:", err);
    res.status(500).json({ message: "Failed to retrieve your invitations." });
  }
};

/**
 * 2. VERIFY INVITATION TOKEN (Safe Preview for Landing Page)
 */
export const verifyInvitationToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) {
      return res.status(400).json({ message: "Invitation token required." });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const invite = await WishlistInvitation.findOne({
      tokenHash,
    })
      .populate("inviterId", "name avatar")
      .populate("wishlistId", "name description coverImage items");

    if (!invite) {
      return res.status(404).json({ message: "Invalid or nonexistent invitation." });
    }

    if (invite.status === "accepted") {
      return res.status(410).json({
        message: "This invitation has already been accepted.",
        wishlistId: invite.wishlistId?._id,
        alreadyAccepted: true,
      });
    }

    if (invite.status === "revoked" || invite.status === "cancelled") {
      return res.status(410).json({ message: "This invitation was revoked by the wishlist owner." });
    }

    if (invite.expiresAt < new Date()) {
      invite.status = "expired";
      await invite.save();
      return res.status(410).json({ message: "This invitation link has expired." });
    }

    res.json({
      success: true,
      invitation: {
        _id: invite._id,
        wishlistId: invite.wishlistId?._id,
        wishlistName: invite.wishlistId?.name,
        wishlistDescription: invite.wishlistId?.description,
        coverImage: invite.wishlistId?.coverImage,
        itemsCount: invite.wishlistId?.items?.length || 0,
        inviterName: invite.inviterId?.name || "A 4U Patron",
        inviterAvatar: invite.inviterId?.avatar || "",
        role: invite.role,
        message: invite.message,
        recipientEmail: invite.recipientEmail,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (err) {
    console.error("Error in verifyInvitationToken:", err);
    res.status(500).json({ message: "Failed to verify invitation token." });
  }
};

/**
 * 3. ACCEPT INVITATION (Idempotent & Email-Verified)
 */
export const acceptInvitation = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params; // Can be invite ID or token
    const { token } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: "Please log in to accept this invitation." });
    }

    let invite = null;

    if (token) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      invite = await WishlistInvitation.findOne({ tokenHash });
    } else if (id) {
      invite = await WishlistInvitation.findById(id);
    }

    if (!invite) {
      return res.status(404).json({ message: "Invitation not found or invalid." });
    }

    // Verify recipient email match to prevent identity theft
    const userEmail = (user.email || "").trim().toLowerCase();
    if (invite.recipientEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({
        message: `This invitation was issued to ${invite.recipientEmail}. You are signed in as ${userEmail}. Please sign in with the invited email address.`,
      });
    }

    if (invite.status === "accepted") {
      return res.json({
        success: true,
        message: "You have already joined this wishlist!",
        wishlistId: invite.wishlistId,
      });
    }

    if (invite.status === "revoked" || invite.status === "cancelled") {
      return res.status(410).json({ message: "This invitation was revoked by the wishlist owner." });
    }

    if (invite.expiresAt < new Date()) {
      invite.status = "expired";
      await invite.save();
      return res.status(410).json({ message: "This invitation link has expired." });
    }

    const wishlist = await CollaborativeWishlist.findById(invite.wishlistId);
    if (!wishlist) {
      return res.status(404).json({ message: "The shared wishlist no longer exists." });
    }

    // Update invitation record
    invite.status = "accepted";
    invite.recipientUserId = userId;
    invite.respondedAt = new Date();
    await invite.save();

    // Upsert WishlistMember (Idempotent)
    let member = await WishlistMember.findOne({
      wishlistId: wishlist._id,
      userId,
    });

    if (member) {
      member.role = invite.role;
      member.status = "active";
      member.invitedBy = invite.inviterId;
      await member.save();
    } else {
      member = await WishlistMember.create({
        wishlistId: wishlist._id,
        userId,
        role: invite.role,
        status: "active",
        invitedBy: invite.inviterId,
      });
    }

    // Log Activity
    await WishlistActivity.create({
      wishlistId: wishlist._id,
      actorId: userId,
      type: "member_joined",
      details: {
        memberName: user.name || "A collaborator",
        role: invite.role,
      },
    });

    // Notify Inviter
    await Notification.create({
      recipientId: invite.inviterId,
      actorId: userId,
      type: "invite_accepted",
      wishlistId: wishlist._id,
      message: `${user.name || "Your invitee"} accepted your invitation to "${wishlist.name}" as an ${invite.role}! 🎉`,
      link: `/wishlist/${wishlist._id}`,
    });

    emitToUser(invite.inviterId, "notification:new", {
      message: `${user.name} accepted your invite to "${wishlist.name}"!`,
    });

    emitToWishlist(wishlist._id, "wishlist:member_joined", {
      member: {
        _id: member._id,
        userId: user._id,
        name: user.name,
        avatar: user.avatar,
        role: member.role,
      },
    });

    res.json({
      success: true,
      message: `Welcome to "${wishlist.name}"! You are now a collaborating ${invite.role}. ✨`,
      wishlistId: wishlist._id,
    });
  } catch (err) {
    console.error("Error in acceptInvitation:", err);
    res.status(500).json({ message: "Failed to accept invitation." });
  }
};

/**
 * 4. REJECT INVITATION (Idempotent)
 */
export const rejectInvitation = async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { token } = req.body;

    const user = await User.findById(userId);
    let invite = null;

    if (token) {
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      invite = await WishlistInvitation.findOne({ tokenHash });
    } else if (id) {
      invite = await WishlistInvitation.findById(id);
    }

    if (!invite) {
      return res.status(404).json({ message: "Invitation not found." });
    }

    const userEmail = (user?.email || "").trim().toLowerCase();
    if (invite.recipientEmail.toLowerCase() !== userEmail) {
      return res.status(403).json({ message: "You can only decline invitations addressed to your email." });
    }

    invite.status = "rejected";
    invite.respondedAt = new Date();
    await invite.save();

    const wishlist = await CollaborativeWishlist.findById(invite.wishlistId);

    // Notify Inviter
    if (wishlist) {
      await Notification.create({
        recipientId: invite.inviterId,
        actorId: userId,
        type: "invite_rejected",
        wishlistId: wishlist._id,
        message: `${user?.name || "Invitee"} declined the invitation to "${wishlist.name}".`,
        link: `/wishlist/${wishlist._id}`,
      });
    }

    res.json({
      success: true,
      message: "Invitation declined.",
    });
  } catch (err) {
    console.error("Error in rejectInvitation:", err);
    res.status(500).json({ message: "Failed to reject invitation." });
  }
};

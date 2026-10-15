import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import CollaborativeWishlist from "./models/CollaborativeWishlist.js";
import WishlistMember from "./models/WishlistMember.js";

let io = null;

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  // JWT Authentication middleware for Socket connections
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
          socket.userId = decoded.id;
        } catch (jwtErr) {
          console.warn("[SOCKET] Invalid JWT token in socket handshake:", jwtErr.message);
          socket.userId = null;
        }
      } else {
        socket.userId = null;
      }
      next();
    } catch (err) {
      next(err);
    }
  });

  io.on("connection", (socket) => {
    // If authenticated, join user-specific notification room
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Join Wishlist Room with security check
    socket.on("join_wishlist", async ({ wishlistId }) => {
      try {
        if (!wishlistId) return;

        const wishlist = await CollaborativeWishlist.findById(wishlistId);
        if (!wishlist) {
          socket.emit("room_error", { message: "Wishlist not found" });
          return;
        }

        // Check if public
        if (wishlist.visibility === "public" && !wishlist.isArchived) {
          socket.join(`wishlist:${wishlistId}`);
          return;
        }

        // If private or shared, verify user membership
        if (!socket.userId) {
          socket.emit("room_error", { message: "Authentication required to join private wishlist" });
          return;
        }

        const isOwner = wishlist.ownerId.toString() === socket.userId.toString();
        const member = isOwner
          ? true
          : await WishlistMember.findOne({
              wishlistId: wishlist._id,
              userId: socket.userId,
              status: "active",
            });

        if (isOwner || member) {
          socket.join(`wishlist:${wishlistId}`);
        } else {
          socket.emit("room_error", { message: "Access denied to wishlist room" });
        }
      } catch (err) {
        console.error("[SOCKET] Error in join_wishlist:", err);
      }
    });

    // Leave Wishlist Room
    socket.on("leave_wishlist", ({ wishlistId }) => {
      if (wishlistId) {
        socket.leave(`wishlist:${wishlistId}`);
      }
    });

    socket.on("disconnect", () => {
      // Clean up
    });
  });

  return io;
};

/**
 * Emit event to all authorized members in a wishlist room
 */
export const emitToWishlist = (wishlistId, event, data) => {
  if (io && wishlistId) {
    io.to(`wishlist:${wishlistId.toString()}`).emit(event, data);
  }
};

/**
 * Emit event to a specific user (e.g. notifications, invites)
 */
export const emitToUser = (userId, event, data) => {
  if (io && userId) {
    io.to(`user:${userId.toString()}`).emit(event, data);
  }
};

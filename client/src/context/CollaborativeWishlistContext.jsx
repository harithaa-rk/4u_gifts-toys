import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "../utils/constants";

const CollaborativeWishlistContext = createContext();

export const useCollaborativeWishlist = () => useContext(CollaborativeWishlistContext);

export const CollaborativeWishlistProvider = ({ children }) => {
  const { isLoggedIn, currentUser } = useAuth();

  // Wishlists lists
  const [ownedWishlists, setOwnedWishlists] = useState([]);
  const [sharedWishlists, setSharedWishlists] = useState([]);
  const [archivedWishlists, setArchivedWishlists] = useState([]);
  const [loadingWishlists, setLoadingWishlists] = useState(false);

  // Active invitations & notifications
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  // Socket reference
  const socketRef = useRef(null);

  // Helper for auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /**
   * 1. Initialize Socket.IO connection when user logs in
   */
  useEffect(() => {
    if (!isLoggedIn) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setOwnedWishlists([]);
      setSharedWishlists([]);
      setArchivedWishlists([]);
      setPendingInvitations([]);
      setNotifications([]);
      setUnreadNotificationsCount(0);
      return;
    }

    const token = localStorage.getItem("token");
    const socketUrl = API_BASE_URL.replace("/api", "");

    const socket = io(socketUrl, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      // Successfully connected
    });

    // Real-time notification received
    socket.on("notification:new", (data) => {
      toast(data.message || "New wishlist notification! 🌸", { icon: "🔔" });
      fetchNotifications();
      fetchInvitations();
    });

    // Clean up
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoggedIn]);

  /**
   * 2. Fetch Wishlists (Owned, Shared, Archived)
   */
  const fetchWishlists = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoadingWishlists(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/collaborative-wishlists`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setOwnedWishlists(res.data.owned || []);
        setSharedWishlists(res.data.shared || []);
        setArchivedWishlists(res.data.archived || []);
      }
    } catch (err) {
      console.error("Error fetching wishlists:", err);
    } finally {
      setLoadingWishlists(false);
    }
  }, [isLoggedIn]);

  /**
   * 3. Fetch Pending Invitations
   */
  const fetchInvitations = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/invitations/my-invitations`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setPendingInvitations(res.data.invitations || []);
      }
    } catch (err) {
      console.error("Error fetching invitations:", err);
    }
  }, [isLoggedIn]);

  /**
   * 4. Fetch Notifications & Unread Count
   */
  const fetchNotifications = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await axios.get(`${API_BASE_URL}/notifications`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadNotificationsCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  }, [isLoggedIn]);

  // Initial load on login
  useEffect(() => {
    if (isLoggedIn) {
      fetchWishlists();
      fetchInvitations();
      fetchNotifications();
    }
  }, [isLoggedIn, fetchWishlists, fetchInvitations, fetchNotifications]);

  /**
   * 5. Wishlist Management Methods
   */
  const createWishlist = async (data) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/collaborative-wishlists`, data, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        toast.success(res.data.message || "Wishlist created! 🎉");
        await fetchWishlists();
        return res.data.wishlist;
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create wishlist.";
      toast.error(msg);
      throw err;
    }
  };

  const updateWishlist = async (id, data) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/collaborative-wishlists/${id}`, data, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        toast.success(res.data.message || "Settings updated! ✨");
        await fetchWishlists();
        return res.data.wishlist;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update wishlist.");
      throw err;
    }
  };

  const deleteWishlist = async (id) => {
    try {
      const res = await axios.delete(`${API_BASE_URL}/collaborative-wishlists/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        toast.success("Wishlist deleted.");
        await fetchWishlists();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete wishlist.");
      throw err;
    }
  };

  const duplicateWishlist = async (id) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/collaborative-wishlists/${id}/duplicate`,
        {},
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Wishlist duplicated! 📋");
        await fetchWishlists();
        return res.data.wishlist;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to duplicate wishlist.");
      throw err;
    }
  };

  const toggleArchiveWishlist = async (id) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/collaborative-wishlists/${id}/archive`,
        {},
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message);
        await fetchWishlists();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to archive/restore wishlist.");
      throw err;
    }
  };

  /**
   * 6. Item Management Methods
   */
  const addItemToWishlist = async (wishlistId, itemData) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/collaborative-wishlists/${wishlistId}/items`,
        itemData,
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Added to wishlist! 🎁");
        await fetchWishlists();
        return res.data;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add item to wishlist.");
      throw err;
    }
  };

  const removeItemFromWishlist = async (wishlistId, itemId) => {
    try {
      const res = await axios.delete(
        `${API_BASE_URL}/collaborative-wishlists/${wishlistId}/items/${itemId}`,
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Item removed.");
        await fetchWishlists();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove item.");
      throw err;
    }
  };

  /**
   * 7. Invitation Actions
   */
  const inviteCollaborator = async (wishlistId, inviteData) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/collaborative-wishlists/${wishlistId}/invitations`,
        inviteData,
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Invitation sent! ✨");
        return res.data;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invitation.");
      throw err;
    }
  };

  const acceptInvitation = async (idOrToken, tokenValue) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/invitations/${idOrToken}/accept`,
        { token: tokenValue },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Invitation accepted! 🎉");
        await fetchWishlists();
        await fetchInvitations();
        await fetchNotifications();
        return res.data;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept invitation.");
      throw err;
    }
  };

  const rejectInvitation = async (idOrToken, tokenValue) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/invitations/${idOrToken}/reject`,
        { token: tokenValue },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast("Invitation declined.", { icon: "👋" });
        await fetchInvitations();
        return res.data;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to decline invitation.");
      throw err;
    }
  };

  /**
   * 8. Notification Actions
   */
  const markNotificationAsRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`, {}, { headers: getAuthHeaders() });
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadNotificationsCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/read-all`, {}, { headers: getAuthHeaders() });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadNotificationsCount(0);
      toast.success("All marked as read");
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const addProductsToMultipleWishlists = async (wishlistIds, productId, options = {}) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/collaborative-wishlists/batch-add`,
        { wishlistIds, productId, ...options },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        await fetchWishlists();
        return res.data;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to wishlists.");
      throw err;
    }
  };

  const clearWishlist = async (wishlistId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/collaborative-wishlists/${wishlistId}/clear`,
        {},
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Wishlist cleared.");
        await fetchWishlists();
        return res.data;
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clear wishlist.");
      throw err;
    }
  };

  const migrateLegacyWishlist = async (items) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/collaborative-wishlists/migrate-legacy`,
        { items },
        { headers: getAuthHeaders() }
      );
      if (res.data.success && res.data.migratedCount > 0) {
        await fetchWishlists();
      }
      return res.data;
    } catch (err) {
      console.error("Migration error:", err);
    }
  };

  return (
    <CollaborativeWishlistContext.Provider
      value={{
        socket: socketRef.current,
        ownedWishlists,
        sharedWishlists,
        archivedWishlists,
        loadingWishlists,
        pendingInvitations,
        notifications,
        unreadNotificationsCount,
        fetchWishlists,
        fetchInvitations,
        fetchNotifications,
        createWishlist,
        updateWishlist,
        deleteWishlist,
        duplicateWishlist,
        toggleArchiveWishlist,
        addItemToWishlist,
        addProductsToMultipleWishlists,
        clearWishlist,
        migrateLegacyWishlist,
        removeItemFromWishlist,
        inviteCollaborator,
        acceptInvitation,
        rejectInvitation,
        markNotificationAsRead,
        markAllNotificationsAsRead,
      }}
    >
      {children}
    </CollaborativeWishlistContext.Provider>
  );
};

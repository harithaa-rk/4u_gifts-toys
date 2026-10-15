import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, Plus, Users, Globe, Lock, Share2, Sparkles, 
  Trash2, Copy, Search, Check, ArrowLeft, MoreVertical, 
  Settings, ShoppingBag, Zap, ChevronRight, MessageSquare, 
  Activity, ShieldCheck, Mail, CheckCircle, AlertCircle, 
  Edit3, UserMinus, ShieldAlert, Clock, Eye
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useCollaborativeWishlist } from "../context/CollaborativeWishlistContext";
import { API_BASE_URL } from "../utils/constants";
import TemuInstantBuyModal from "../components/payment/TemuInstantBuyModal";

const SingleWishlistPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoggedIn, currentUser } = useAuth();
  const { addToCart } = useCart();
  const { socket, clearWishlist } = useCollaborativeWishlist();

  // Wishlist State
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [stockOnly, setStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("default");

  // Active Tab/Panel: 'items' | 'activity' | 'comments' | 'members'
  const [activeSidePanel, setActiveSidePanel] = useState("items");

  // Activity & Comments
  const [activities, setActivities] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Invite Modal
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviteMessage, setInviteMessage] = useState("");
  const [pendingInvites, setPendingInvites] = useState([]);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Add Product Modal
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Settings / Privacy Modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editVisibility, setEditVisibility] = useState("private");
  const [editAllowEditorInvites, setEditAllowEditorInvites] = useState(false);
  const [editAllowComments, setEditAllowComments] = useState(true);

  // Instant Buy Modal State
  const [instantBuyItem, setInstantBuyItem] = useState(null);
  const [instantBuyOpen, setInstantBuyOpen] = useState(false);

  // Item Note Editing
  const [editingItemId, setEditingItemId] = useState(null);
  const [editNoteText, setEditNoteText] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /**
   * 1. Fetch Wishlist Details
   */
  const fetchWishlistData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/collaborative-wishlists/${id}`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setWishlist(res.data.wishlist);
        setEditName(res.data.wishlist.name);
        setEditDesc(res.data.wishlist.description || "");
        setEditVisibility(res.data.wishlist.visibility);
        setEditAllowEditorInvites(res.data.wishlist.settings?.allowEditorInvites ?? false);
        setEditAllowComments(res.data.wishlist.settings?.allowComments ?? true);
      }
    } catch (err) {
      console.error("Error loading wishlist:", err);
      setError(err.response?.data?.message || "Failed to load wishlist.");
    } finally {
      setLoading(false);
    }
  };

  /**
   * 2. Fetch Activity Feed
   */
  const fetchActivities = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/collaborative-wishlists/${id}/activity`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setActivities(res.data.activities || []);
      }
    } catch (err) {
      console.error("Error fetching activity:", err);
    }
  };

  /**
   * 3. Fetch Comments
   */
  const fetchComments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/collaborative-wishlists/${id}/comments`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setComments(res.data.comments || []);
      }
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  /**
   * 4. Fetch Pending Invitations
   */
  const fetchPendingInvites = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/collaborative-wishlists/${id}/invitations`, {
        headers: getAuthHeaders(),
      });
      if (res.data.success) {
        setPendingInvites(res.data.invitations || []);
      }
    } catch (err) {
      console.error("Error fetching wishlist invitations:", err);
    }
  };

  // Initial Load
  useEffect(() => {
    fetchWishlistData();
    fetchActivities();
    fetchComments();
    fetchPendingInvites();
  }, [id]);

  /**
   * 5. Real-Time Socket.IO Synchronization
   */
  useEffect(() => {
    if (!socket || !id) return;

    // Join room
    socket.emit("join_wishlist", { wishlistId: id });

    // Listeners
    socket.on("wishlist:updated", () => {
      fetchWishlistData();
      fetchActivities();
    });

    socket.on("wishlist:item_added", (data) => {
      toast(`${data.productName || "An item"} was added to the collection! 🎁`, { icon: "✨" });
      fetchWishlistData();
      fetchActivities();
    });

    socket.on("wishlist:item_removed", () => {
      fetchWishlistData();
      fetchActivities();
    });

    socket.on("wishlist:item_updated", () => {
      fetchWishlistData();
    });

    socket.on("wishlist:item_status_changed", () => {
      fetchWishlistData();
      fetchActivities();
    });

    socket.on("wishlist:comment_added", (data) => {
      setComments((prev) => [...prev, data.comment]);
    });

    socket.on("wishlist:comment_deleted", ({ commentId }) => {
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    });

    socket.on("wishlist:reaction_updated", ({ commentId, reactions }) => {
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, reactions } : c))
      );
    });

    socket.on("wishlist:member_joined", (data) => {
      toast(`${data.member?.name || "A collaborator"} joined the wishlist! 👥`, { icon: "🎉" });
      fetchWishlistData();
      fetchActivities();
    });

    return () => {
      socket.emit("leave_wishlist", { wishlistId: id });
      socket.off("wishlist:updated");
      socket.off("wishlist:item_added");
      socket.off("wishlist:item_removed");
      socket.off("wishlist:item_updated");
      socket.off("wishlist:item_status_changed");
      socket.off("wishlist:comment_added");
      socket.off("wishlist:comment_deleted");
      socket.off("wishlist:reaction_updated");
      socket.off("wishlist:member_joined");
    };
  }, [socket, id]);

  /**
   * 6. Group Shopping Coordination Status Handlers
   */
  const handleUpdateGroupStatus = async (itemId, newStatus) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/collaborative-wishlists/${id}/items/${itemId}/group-status`,
        { groupStatus: newStatus },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message || "Updated coordination status!");
        fetchWishlistData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update item status.");
    }
  };

  /**
   * 7. Save Note on Item
   */
  const handleSaveItemNote = async (itemId) => {
    try {
      const res = await axios.put(
        `${API_BASE_URL}/collaborative-wishlists/${id}/items/${itemId}`,
        { note: editNoteText },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success("Note updated! ✨");
        setEditingItemId(null);
        fetchWishlistData();
      }
    } catch (err) {
      toast.error("Failed to update note.");
    }
  };

  /**
   * 8. Remove Item
   */
  const handleRemoveItem = async (itemId, productName) => {
    if (!window.confirm(`Remove "${productName}" from this wishlist?`)) return;
    try {
      await axios.delete(
        `${API_BASE_URL}/collaborative-wishlists/${id}/items/${itemId}`,
        { headers: getAuthHeaders() }
      );
      toast.success(`${productName} removed.`);
      fetchWishlistData();
    } catch (err) {
      toast.error("Failed to remove item.");
    }
  };

  /**
   * 9. Post Comment
   */
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/collaborative-wishlists/${id}/comments`,
        { content: newComment.trim() },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        setNewComment("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  /**
   * 10. React with Emoji
   */
  const handleToggleReaction = async (commentId, emoji) => {
    try {
      await axios.post(
        `${API_BASE_URL}/collaborative-wishlists/${id}/comments/${commentId}/reactions`,
        { emoji },
        { headers: getAuthHeaders() }
      );
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  };

  /**
   * 11. Send Collaborator Invite
   */
  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsSendingInvite(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/collaborative-wishlists/${id}/invitations`,
        {
          email: inviteEmail.trim(),
          role: inviteRole,
          message: inviteMessage.trim(),
        },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(res.data.message || `Invitation sent to ${inviteEmail}! ✨`);
        setInviteEmail("");
        setInviteMessage("");
        fetchPendingInvites();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send invitation.");
    } finally {
      setIsSendingInvite(false);
    }
  };

  /**
   * 12. Add Product from Catalogue Modal
   */
  const handleOpenAddProduct = async () => {
    setAddProductModalOpen(true);
    if (catalogProducts.length === 0) {
      setLoadingCatalog(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/products`);
        if (Array.isArray(res.data)) {
          setCatalogProducts(res.data.filter((p) => p.status === "active" || !p.status));
        }
      } catch (err) {
        console.error("Error loading catalogue:", err);
      } finally {
        setLoadingCatalog(false);
      }
    }
  };

  const handleAddProductFromCatalog = async (prod) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/collaborative-wishlists/${id}/items`,
        {
          productId: prod._id,
          desiredQuantity: 1,
          priority: "medium",
        },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success(`${prod.name} added to wishlist! 🎉`);
        fetchWishlistData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add product.");
    }
  };

  /**
   * 13. Update Settings (Owner Only)
   */
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(
        `${API_BASE_URL}/collaborative-wishlists/${id}`,
        {
          name: editName.trim(),
          description: editDesc.trim(),
          visibility: editVisibility,
          settings: {
            allowEditorInvites: editAllowEditorInvites,
            allowComments: editAllowComments,
          },
        },
        { headers: getAuthHeaders() }
      );
      if (res.data.success) {
        toast.success("Settings updated! ✨");
        setSettingsModalOpen(false);
        fetchWishlistData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update settings.");
    }
  };

  /**
   * 14. Bulk Buy / Move to Cart
   */
  const handleMoveAllToCart = () => {
    if (!wishlist?.items || wishlist.items.length === 0) return;
    wishlist.items.forEach((it) => {
      if (it.product && it.product.quantity > 0) {
        addToCart(it.product);
      }
    });
    toast.success("Available items added to your cart! 🛍️");
  };

  const handleBuyAllWithRazorpay = () => {
    if (!wishlist?.items || wishlist.items.length === 0) return;
    const availableItems = wishlist.items
      .map((it) => it.product)
      .filter((p) => p && p.quantity > 0);

    if (availableItems.length === 0) {
      toast.error("No items in stock to purchase right now.");
      return;
    }
    setInstantBuyItem(availableItems);
    setInstantBuyOpen(true);
  };

  // Clear all items from this wishlist
  const handleClearWishlist = async () => {
    if (!window.confirm("Are you sure you want to remove all items from this wishlist?")) return;
    try {
      await clearWishlist(id);
      fetchWishlistData();
      toast.success("Wishlist cleared successfully.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to clear wishlist.");
    }
  };

  // Filtered & Sorted items for this specific wishlist
  const filteredItems = useMemo(() => {
    if (!wishlist?.items) return [];
    let res = [...wishlist.items];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      res = res.filter((it) => it.product?.name?.toLowerCase().includes(q));
    }
    if (stockOnly) {
      res = res.filter((it) => (it.product?.quantity || 0) > 0);
    }
    if (sortBy === "price-low") {
      res.sort((a, b) => (Number(a.product?.price) || 0) - (Number(b.product?.price) || 0));
    } else if (sortBy === "price-high") {
      res.sort((a, b) => (Number(b.product?.price) || 0) - (Number(a.product?.price) || 0));
    } else if (sortBy === "name") {
      res.sort((a, b) => (a.product?.name || "").localeCompare(b.product?.name || ""));
    }
    return res;
  }, [wishlist?.items, searchQuery, stockOnly, sortBy]);

  // Total Wishlist Value
  const totalValue = useMemo(() => {
    if (!wishlist?.items) return 0;
    return wishlist.items.reduce((acc, it) => acc + (Number(it.product?.price) || 0) * (it.desiredQuantity || 1), 0);
  }, [wishlist]);

  if (loading) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Sparkles size={36} color="#FF3F9D" className="animate-spin" />
      </div>
    );
  }

  if (error || !wishlist) {
    return (
      <div style={{ padding: "120px 20px", textAlign: "center", minHeight: "80vh" }}>
        <AlertCircle size={48} color="#dc2626" style={{ margin: "0 auto 16px" }} />
        <h2 style={{ fontFamily: "var(--font-display)", color: "var(--plum)" }}>
          {error || "Wishlist Not Found"}
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 24 }}>
          This wishlist might be private or the link may have been revoked.
        </p>
        <button
          type="button"
          onClick={() => navigate("/wishlist")}
          style={{
            padding: "10px 24px",
            borderRadius: "var(--radius-pill)",
            background: "#FF3F9D",
            color: "#fff",
            border: "none",
            fontWeight: 800,
            cursor: "pointer",
          }}
        >
          Back to Wishlist Hub
        </button>
      </div>
    );
  }

  const { permissions, items, members } = wishlist;
  const isOwner = permissions.isOwner;
  const canEdit = permissions.canEditItems;
  const canInvite = permissions.canInvite;

  return (
    <div
      style={{
        background: "var(--bg, #FFF9FB)",
        minHeight: "100vh",
        padding: "110px 5% 90px",
        fontFamily: "inherit",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* ── BREADCRUMB & BACK NAVIGATION ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)" }}>
            <Link to="/" style={{ textDecoration: "none", color: "inherit", fontWeight: 700 }}>
              Home
            </Link>
            <ChevronRight size={14} />
            <Link to="/wishlist" style={{ textDecoration: "none", color: "inherit", fontWeight: 700 }}>
              My Wishlists
            </Link>
            <ChevronRight size={14} />
            <span style={{ color: "#FF3F9D", fontWeight: 800 }}>
              {wishlist.name}
            </span>
          </div>

          <Link
            to="/wishlist"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 16px",
              borderRadius: "100px",
              background: "#fff",
              border: "1.5px solid rgba(255, 99, 183, 0.35)",
              color: "var(--plum)",
              fontSize: 12,
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
              transition: "all 0.2s",
            }}
          >
            <ArrowLeft size={14} />
            <span>Back to My Wishlists</span>
          </Link>
        </div>

        {/* ── HEADER BANNER ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, #FFFFFF 0%, #FFF5F9 100%)",
            borderRadius: "32px",
            padding: "32px 36px",
            border: "2px solid rgba(255, 99, 183, 0.3)",
            boxShadow: "0 14px 40px rgba(64, 32, 68, 0.06)",
            marginBottom: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  background:
                    wishlist.visibility === "public"
                      ? "rgba(114, 230, 176, 0.25)"
                      : wishlist.visibility === "shared"
                      ? "rgba(128, 87, 232, 0.15)"
                      : "rgba(64, 32, 68, 0.08)",
                  color:
                    wishlist.visibility === "public"
                      ? "#065f46"
                      : wishlist.visibility === "shared"
                      ? "#8057E8"
                      : "var(--plum)",
                  fontSize: 12,
                  fontWeight: 900,
                  padding: "4px 12px",
                  borderRadius: "var(--radius-pill)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  textTransform: "capitalize",
                }}
              >
                {wishlist.visibility === "public" ? <Globe size={13} /> : wishlist.visibility === "shared" ? <Users size={13} /> : <Lock size={13} />}
                <span>{wishlist.visibility} Registry</span>
              </span>

              {/* Role Badge */}
              <span
                style={{
                  background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 900,
                  padding: "3px 10px",
                  borderRadius: "var(--radius-pill)",
                  textTransform: "uppercase",
                }}
              >
                Your Role: {permissions.role}
              </span>

              {/* Live Real-time Indicator */}
              <span style={{ fontSize: 11, color: "#059669", fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#059669" }} />
                Real-Time Live
              </span>
            </div>

            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(24px, 3.5vw, 34px)",
                fontWeight: 900,
                color: "var(--plum)",
                margin: "0 0 8px",
              }}
            >
              {wishlist.name}
            </h1>

            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 16px", maxWidth: 600, lineHeight: 1.5 }}>
              {wishlist.description || "Curated boutique toy and gift collection."}
            </p>

            {/* Collaborators Avatar Stack */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center" }}>
                {members.slice(0, 6).map((m, idx) => (
                  <div
                    key={m._id || idx}
                    title={`${m.name} (${m.role})`}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: idx % 2 === 0 ? "#FF63B7" : "#8057E8",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "2px solid #fff",
                      marginLeft: idx > 0 ? -8 : 0,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    }}
                  >
                    {m.name.slice(0, 1).toUpperCase()}
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 13, color: "var(--plum)", fontWeight: 700 }}>
                {members.length} {members.length === 1 ? "Member" : "Members"}
              </span>

              {/* Owner tag */}
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                · Created by <strong>{wishlist.ownerId?.name || "Owner"}</strong>
              </span>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {canEdit && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleOpenAddProduct}
                style={{
                  padding: "11px 20px",
                  borderRadius: "var(--radius-pill)",
                  background: "linear-gradient(135deg, #FF3F9D, #C9184A)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 6px 18px rgba(255, 63, 157, 0.3)",
                }}
              >
                <Plus size={16} strokeWidth={3} />
                <span>Add Products</span>
              </motion.button>
            )}

            {canInvite && (
              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                style={{
                  padding: "11px 18px",
                  borderRadius: "var(--radius-pill)",
                  background: "#fff",
                  border: "1.5px solid rgba(128, 87, 232, 0.4)",
                  color: "#8057E8",
                  fontWeight: 800,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Users size={15} />
                <span>Invite Friends</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyLink}
              style={{
                padding: "11px 14px",
                borderRadius: "var(--radius-pill)",
                background: "#fff",
                border: "1.5px solid #e5e7eb",
                color: "var(--plum)",
                fontWeight: 700,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
              title="Copy share link"
            >
              <Share2 size={15} />
              <span>Share</span>
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                style={{
                  padding: "11px 14px",
                  borderRadius: "var(--radius-pill)",
                  background: "#fff",
                  border: "1.5px solid #e5e7eb",
                  color: "var(--plum)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                title="Wishlist Settings"
              >
                <Settings size={15} />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── MAIN LAYOUT: ITEMS GRID + COLLABORATION SIDEBAR ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 26, alignItems: "start" }}>
          
          {/* LEFT: PRODUCTS LIST & GROUP COORDINATION */}
          <div>
            {/* Express Group Shopping Banner */}
            {items.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "14px 20px",
                  border: "1px solid rgba(255, 99, 183, 0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>Total Value: </span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900, color: "#FF3F9D" }}>
                    ₹{totalValue.toLocaleString("en-IN")}
                  </span>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 6 }}>
                    ({items.length} {items.length === 1 ? "item" : "items"})
                  </span>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleBuyAllWithRazorpay}
                    style={{
                      padding: "9px 18px",
                      borderRadius: "var(--radius-pill)",
                      background: "linear-gradient(135deg, #8057E8, #A78BFA)",
                      color: "#fff",
                      border: "none",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Zap size={14} fill="#fff" /> Buy All (Razorpay / UPI)
                  </motion.button>

                  <button
                    type="button"
                    onClick={handleMoveAllToCart}
                    style={{
                      padding: "9px 16px",
                      borderRadius: "var(--radius-pill)",
                      background: "#fff",
                      border: "1.5px solid rgba(255, 99, 183, 0.4)",
                      color: "var(--plum)",
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <ShoppingBag size={14} color="#FF3F9D" /> Add to Cart
                  </button>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleClearWishlist}
                      style={{
                        padding: "9px 14px",
                        borderRadius: "var(--radius-pill)",
                        background: "#fff",
                        border: "1.5px solid #fecdd3",
                        color: "#e11d48",
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                      title="Clear all products from this wishlist"
                    >
                      <Trash2 size={14} /> Clear Wishlist
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Search, Stock Filter, and Sorting Controls */}
            {items.length > 0 && (
              <div
                style={{
                  background: "#fff",
                  borderRadius: "18px",
                  padding: "12px 18px",
                  border: "1px solid rgba(255, 99, 183, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ position: "relative", flex: 1, minWidth: "180px" }}>
                  <Search size={15} color="#9ca3af" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    placeholder="Search gifts in this list…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "7px 12px 7px 34px",
                      borderRadius: "100px",
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                      outline: "none",
                      boxSizing: "border-box",
                      color: "var(--plum)",
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: "var(--plum)", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={stockOnly}
                      onChange={(e) => setStockOnly(e.target.checked)}
                      style={{ accentColor: "#FF3F9D", cursor: "pointer" }}
                    />
                    <span>In Stock Only</span>
                  </label>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "100px",
                      border: "1px solid #e5e7eb",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--plum)",
                      background: "#fff",
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="default">Sort: Default</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name">Name (A-Z)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Empty State */}
            {items.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "#fff",
                  borderRadius: "28px",
                  border: "2px dashed rgba(255, 99, 183, 0.35)",
                }}
              >
                <span style={{ fontSize: 48, display: "block", marginBottom: 12 }}>🎁</span>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900, color: "var(--plum)", margin: "0 0 6px" }}>
                  This wishlist is empty
                </h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 20px" }}>
                  Browse our catalogue or add handcrafted boutique toys to start curating gifts.
                </p>
                {canEdit && (
                  <button
                    type="button"
                    onClick={handleOpenAddProduct}
                    style={{
                      padding: "11px 24px",
                      borderRadius: "var(--radius-pill)",
                      background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                      color: "#fff",
                      border: "none",
                      fontWeight: 900,
                      fontSize: 14,
                      cursor: "pointer",
                    }}
                  >
                    + Add Items from Catalogue
                  </button>
                )}
              </div>
            ) : filteredItems.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "40px 20px",
                  background: "#fff",
                  borderRadius: "20px",
                  border: "1px dashed #e5e7eb",
                }}
              >
                <Search size={32} color="#9ca3af" style={{ margin: "0 auto 8px" }} />
                <h4 style={{ margin: "0 0 4px", color: "var(--plum)" }}>No matching gifts found</h4>
                <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)" }}>
                  Try adjusting your search keyword or in-stock filter.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {filteredItems.map((it) => {
                  const product = it.product;
                  const isOutOfStock = product?.quantity <= 0;
                  const isReserved = it.groupStatus === "reserved" || it.groupStatus === "purchased";

                  return (
                    <motion.div
                      key={it._id}
                      layout
                      style={{
                        background: "#fff",
                        borderRadius: "24px",
                        padding: "18px 20px",
                        border: "1.5px solid",
                        borderColor: isReserved ? "rgba(128, 87, 232, 0.4)" : "rgba(255, 99, 183, 0.25)",
                        boxShadow: "0 6px 20px rgba(64, 32, 68, 0.04)",
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      {/* Product Image */}
                      <Link
                        to={`/product/${product?._id}`}
                        style={{ textDecoration: "none", flexShrink: 0 }}
                      >
                        <div
                          style={{
                            width: 80,
                            height: 80,
                            borderRadius: "16px",
                            background: "#FFF0F6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                          }}
                        >
                          {product?.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 6 }}
                            />
                          ) : (
                            <span style={{ fontSize: 32 }}>🧸</span>
                          )}
                        </div>
                      </Link>

                      {/* Content & Details */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 900, color: "#FF3F9D", textTransform: "uppercase" }}>
                            {product?.category || "Boutique Item"}
                          </span>
                          {it.priority === "high" && (
                            <span style={{ fontSize: 10, fontWeight: 900, background: "rgba(239,68,68,0.1)", color: "#dc2626", padding: "2px 6px", borderRadius: "var(--radius-pill)" }}>
                              Must Have! 🔥
                            </span>
                          )}
                        </div>

                        <Link
                          to={`/product/${product?._id}`}
                          style={{ textDecoration: "none", color: "inherit" }}
                        >
                          <h4 style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 800, color: "var(--plum)", margin: "0 0 6px" }}>
                            {product?.name || "Product"}
                          </h4>
                        </Link>

                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900, color: "#FF3F9D" }}>
                            ₹{(+product?.price || 0).toLocaleString("en-IN")}
                          </span>
                          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                            · Desired: <strong>{it.desiredQuantity || 1}</strong>
                          </span>
                          {isOutOfStock ? (
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#dc2626" }}>
                              (Out of Stock)
                            </span>
                          ) : (
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>
                              ({product?.quantity} in stock)
                            </span>
                          )}
                        </div>

                        {/* Gift Note */}
                        {editingItemId === it._id ? (
                          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                            <input
                              type="text"
                              value={editNoteText}
                              onChange={(e) => setEditNoteText(e.target.value)}
                              placeholder="Add personal note…"
                              style={{
                                flex: 1,
                                padding: "6px 10px",
                                borderRadius: "8px",
                                border: "1px solid #FF3F9D",
                                fontSize: 12,
                                outline: "none",
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveItemNote(it._id)}
                              style={{ padding: "6px 12px", borderRadius: "8px", background: "#FF3F9D", color: "#fff", border: "none", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItemId(null)}
                              style={{ padding: "6px 10px", borderRadius: "8px", background: "#f3f4f6", border: "none", fontSize: 11, cursor: "pointer" }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            {it.note ? (
                              <span style={{ fontSize: 12, fontStyle: "italic", color: "var(--plum)", background: "#FFF5F9", padding: "3px 8px", borderRadius: "8px" }}>
                                "{it.note}"
                              </span>
                            ) : (
                              canEdit && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingItemId(it._id);
                                    setEditNoteText(it.note || "");
                                  }}
                                  style={{ background: "none", border: "none", color: "#8057E8", fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                                >
                                  <Edit3 size={12} /> Add Note
                                </button>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      {/* GROUP SHOPPING COORDINATION STATUS */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 160 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                          Coordination:
                        </span>

                        <select
                          value={it.groupStatus}
                          onChange={(e) => handleUpdateGroupStatus(it._id, e.target.value)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: "12px",
                            border: "1.5px solid",
                            borderColor:
                              it.groupStatus === "purchased"
                                ? "#059669"
                                : it.groupStatus === "reserved"
                                ? "#8057E8"
                                : it.groupStatus === "planning_to_buy"
                                ? "#FF3F9D"
                                : "#e5e7eb",
                            background:
                              it.groupStatus === "purchased"
                                ? "rgba(114,230,176,0.2)"
                                : it.groupStatus === "reserved"
                                ? "rgba(128,87,232,0.1)"
                                : it.groupStatus === "planning_to_buy"
                                ? "rgba(255,63,157,0.1)"
                                : "#fff",
                            color: "var(--plum)",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            outline: "none",
                          }}
                        >
                          <option value="unreserved">⚪ Unreserved</option>
                          <option value="interested">👀 Interested</option>
                          <option value="planning_to_buy">🛍️ Planning to Buy</option>
                          <option value="reserved">🔒 Reserved</option>
                          <option value="purchased">✅ Purchased</option>
                        </select>

                        {it.reservedBy && (
                          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                            By {it.reservedBy.name || "Collaborator"}
                          </span>
                        )}
                      </div>

                      {/* Dual Action Buttons */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => {
                            setInstantBuyItem(product);
                            setInstantBuyOpen(true);
                          }}
                          style={{
                            padding: "8px 14px",
                            borderRadius: "var(--radius-pill)",
                            background: isOutOfStock ? "#d1d5db" : "linear-gradient(135deg, #8057E8, #A78BFA)",
                            color: "#fff",
                            border: "none",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Zap size={13} fill="#fff" /> Buy Now
                        </button>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => addToCart(product)}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "var(--radius-pill)",
                            background: "#fff",
                            border: "1px solid rgba(255, 99, 183, 0.4)",
                            color: "var(--plum)",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isOutOfStock ? "not-allowed" : "pointer",
                          }}
                        >
                          + Cart
                        </button>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(it._id, product?.name)}
                            style={{
                              padding: "8px",
                              borderRadius: "50%",
                              background: "none",
                              border: "none",
                              color: "#dc2626",
                              cursor: "pointer",
                            }}
                            title="Remove from wishlist"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT: INTERACTIVE COLLABORATION PANEL (Activity & Comments) */}
          <div
            style={{
              background: "#fff",
              borderRadius: "24px",
              border: "1.5px solid rgba(255, 99, 183, 0.25)",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(64, 32, 68, 0.04)",
              position: "sticky",
              top: 100,
            }}
          >
            {/* Panel Tabs Header */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                borderBottom: "1px solid rgba(255, 99, 183, 0.15)",
                background: "linear-gradient(135deg, #FFF9FB, #FAF5FF)",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveSidePanel("items")}
                style={{
                  padding: "12px",
                  background: "none",
                  border: "none",
                  borderBottom: activeSidePanel === "items" ? "2px solid #FF3F9D" : "2px solid transparent",
                  color: activeSidePanel === "items" ? "#FF3F9D" : "var(--plum)",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <MessageSquare size={15} /> Chat ({comments.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveSidePanel("activity")}
                style={{
                  padding: "12px",
                  background: "none",
                  border: "none",
                  borderBottom: activeSidePanel === "activity" ? "2px solid #8057E8" : "2px solid transparent",
                  color: activeSidePanel === "activity" ? "#8057E8" : "var(--plum)",
                  fontWeight: 900,
                  fontSize: 13,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Activity size={15} /> Activity
              </button>
            </div>

            {/* TAB A: COLLABORATIVE CHAT & COMMENTS */}
            {activeSidePanel === "items" && (
              <div style={{ display: "flex", flexDirection: "column", height: 440 }}>
                <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: 10 }}>
                  {comments.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 10px", color: "var(--text-muted)" }}>
                      <MessageSquare size={28} color="#FF3F9D" style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                      <p style={{ fontSize: 13, margin: 0, fontWeight: 700 }}>No messages yet</p>
                      <p style={{ fontSize: 11, margin: "4px 0 0" }}>Start coordinating gifts with your group here!</p>
                    </div>
                  ) : (
                    comments.map((c) => {
                      const isMe = c.authorId?._id === currentUser?.id;
                      return (
                        <div
                          key={c._id}
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: isMe ? "flex-end" : "flex-start",
                          }}
                        >
                          <span style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>
                            {isMe ? "You" : c.authorId?.name || "Collaborator"}
                          </span>
                          <div
                            style={{
                              background: isMe ? "linear-gradient(135deg, #FF3F9D, #8057E8)" : "#f3f4f6",
                              color: isMe ? "#fff" : "var(--plum)",
                              padding: "8px 12px",
                              borderRadius: "16px",
                              fontSize: 13,
                              maxWidth: "85%",
                              lineHeight: 1.4,
                            }}
                          >
                            {c.content}
                          </div>

                          {/* Emoji Reactions Bar */}
                          <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                            {["❤️", "🎉", "🧸", "✨"].map((emoji) => {
                              const reactionCount = c.reactions?.filter((r) => r.emoji === emoji).length || 0;
                              return (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => handleToggleReaction(c._id, emoji)}
                                  style={{
                                    background: "#fff",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "10px",
                                    padding: "2px 6px",
                                    fontSize: 11,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 2,
                                  }}
                                >
                                  <span>{emoji}</span>
                                  {reactionCount > 0 && <span>{reactionCount}</span>}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Comment Input */}
                <form
                  onSubmit={handlePostComment}
                  style={{
                    padding: "10px",
                    borderTop: "1px solid rgba(255, 99, 183, 0.15)",
                    display: "flex",
                    gap: 6,
                    background: "#fff",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Type message to group…"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: "var(--radius-pill)",
                      border: "1.5px solid #e5e7eb",
                      fontSize: 12,
                      outline: "none",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingComment || !newComment.trim()}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "var(--radius-pill)",
                      background: "#FF3F9D",
                      color: "#fff",
                      border: "none",
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    Send
                  </button>
                </form>
              </div>
            )}

            {/* TAB B: ACTIVITY AUDIT TRAIL */}
            {activeSidePanel === "activity" && (
              <div style={{ padding: "14px", maxHeight: 440, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
                {activities.length === 0 ? (
                  <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, margin: 20 }}>
                    No recent activity recorded.
                  </p>
                ) : (
                  activities.map((act) => (
                    <div key={act._id} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 12 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          background: "rgba(255, 63, 157, 0.15)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#FF3F9D",
                          flexShrink: 0,
                          fontSize: 11,
                        }}
                      >
                        ✓
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 800, color: "var(--plum)" }}>
                          {act.actorId?.name || "Member"}:
                        </span>{" "}
                        <span style={{ color: "var(--text-muted)" }}>
                          {act.type === "item_added"
                            ? `Added ${act.details?.productName || "an item"}`
                            : act.type === "item_removed"
                            ? `Removed ${act.details?.productName || "an item"}`
                            : act.type === "item_status_changed"
                            ? `Marked item as ${act.details?.newStatus?.replace(/_/g, " ")}`
                            : act.type === "member_joined"
                            ? "Joined the collection"
                            : act.type.replace(/_/g, " ")}
                        </span>
                        <div style={{ fontSize: 10, color: "var(--text-light)", marginTop: 2 }}>
                          {new Date(act.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          INVITE COLLABORATORS MODAL
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {inviteModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(38, 16, 43, 0.72)",
              backdropFilter: "blur(12px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setInviteModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#FFFFFF",
                borderRadius: "28px",
                maxWidth: "520px",
                width: "100%",
                padding: "26px",
                boxShadow: "0 20px 60px rgba(45, 14, 52, 0.25)",
                border: "2px solid rgba(128, 87, 232, 0.35)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Users size={22} color="#8057E8" />
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 900, color: "var(--plum)", margin: 0 }}>
                    Invite Collaborators
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendInvite} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 6 }}>
                    Recipient's Gmail / Email Address:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. friend@gmail.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1.5px solid #e5e7eb",
                      fontSize: 13,
                      outline: "none",
                    }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--plum)" }}>Role:</span>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="invRole"
                      checked={inviteRole === "editor"}
                      onChange={() => setInviteRole("editor")}
                      style={{ accentColor: "#8057E8" }}
                    />
                    Editor (Can add/edit items & notes)
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    <input
                      type="radio"
                      name="invRole"
                      checked={inviteRole === "viewer"}
                      onChange={() => setInviteRole("viewer")}
                      style={{ accentColor: "#8057E8" }}
                    />
                    Viewer (Read-only)
                  </label>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 6 }}>
                    Personal Invitation Message (Optional):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Join our group collection for the celebration!"
                    value={inviteMessage}
                    onChange={(e) => setInviteMessage(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "12px",
                      border: "1.5px solid #e5e7eb",
                      fontSize: 12,
                      outline: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSendingInvite || !inviteEmail.trim()}
                  style={{
                    padding: "11px",
                    borderRadius: "var(--radius-pill)",
                    background: "linear-gradient(135deg, #8057E8, #FF3F9D)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: isSendingInvite ? "wait" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Mail size={15} />
                  <span>{isSendingInvite ? "Sending Invitation…" : "Send Email Invitation"}</span>
                </button>
              </form>

              {/* Pending Invites List */}
              {pendingInvites.length > 0 && (
                <div style={{ marginTop: 20, borderTop: "1px solid #f3f4f6", paddingTop: 14 }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 8 }}>
                    Pending Sent Invitations:
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 120, overflowY: "auto" }}>
                    {pendingInvites.map((inv) => (
                      <div
                        key={inv._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          background: "#FAF5FF",
                          borderRadius: "10px",
                          fontSize: 11,
                        }}
                      >
                        <span>{inv.recipientEmail} ({inv.role})</span>
                        <span style={{ color: "#8057E8", fontWeight: 700 }}>Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════
          ADD PRODUCTS FROM CATALOGUE MODAL
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {addProductModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(38, 16, 43, 0.72)",
              backdropFilter: "blur(12px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setAddProductModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#FFFFFF",
                borderRadius: "28px",
                maxWidth: "680px",
                width: "100%",
                padding: "24px",
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 20px 60px rgba(45, 14, 52, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900, color: "var(--plum)", margin: 0 }}>
                  Add Products from 4U Boutique Catalogue
                </h3>
                <button
                  type="button"
                  onClick={() => setAddProductModalOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
                >
                  ✕
                </button>
              </div>

              {/* Search input */}
              <input
                type="text"
                placeholder="Search toys, plushies, flowers, hampers…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                style={{
                  padding: "10px 14px",
                  borderRadius: "12px",
                  border: "1.5px solid #e5e7eb",
                  fontSize: 13,
                  outline: "none",
                  marginBottom: 14,
                }}
              />

              {/* Products Grid */}
              <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
                {catalogProducts
                  .filter((p) => !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()))
                  .map((p) => {
                    const alreadyAdded = items.some((it) => it.productId === p._id || it.product?._id === p._id);
                    return (
                      <div
                        key={p._id}
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "16px",
                          padding: 10,
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div style={{ height: 100, background: "#FFF0F6", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", marginBottom: 8 }}>
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                          ) : (
                            <span style={{ fontSize: 28 }}>🎁</span>
                          )}
                        </div>
                        <h5 style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.name}
                        </h5>
                        <span style={{ fontSize: 13, fontWeight: 900, color: "#FF3F9D", marginBottom: 8 }}>
                          ₹{(+p.price).toLocaleString("en-IN")}
                        </span>

                        <button
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => handleAddProductFromCatalog(p)}
                          style={{
                            marginTop: "auto",
                            padding: "6px",
                            borderRadius: "var(--radius-pill)",
                            background: alreadyAdded ? "#e5e7eb" : "linear-gradient(135deg, #FF3F9D, #8057E8)",
                            color: alreadyAdded ? "var(--text-muted)" : "#fff",
                            border: "none",
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: alreadyAdded ? "default" : "pointer",
                          }}
                        >
                          {alreadyAdded ? "Already Added" : "+ Add to List"}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════
          SETTINGS & PRIVACY MODAL (Owner Only)
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {settingsModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(38, 16, 43, 0.72)",
              backdropFilter: "blur(12px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setSettingsModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#FFFFFF",
                borderRadius: "28px",
                maxWidth: "480px",
                width: "100%",
                padding: "24px",
                boxShadow: "0 20px 60px rgba(45, 14, 52, 0.25)",
              }}
            >
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900, color: "var(--plum)", margin: "0 0 14px" }}>
                Wishlist Settings & Permissions
              </h3>

              <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "var(--plum)" }}>Collection Name:</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: 13, marginTop: 4 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: "var(--plum)" }}>Privacy Mode:</label>
                  <select
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "10px", border: "1.5px solid #e5e7eb", fontSize: 13, marginTop: 4 }}
                  >
                    <option value="private">🔒 Private (Only Me)</option>
                    <option value="shared">👥 Shared (Invited Members Only)</option>
                    <option value="public">🌐 Public (Anyone with safe link)</option>
                  </select>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 6 }}>
                  <input
                    type="checkbox"
                    checked={editAllowEditorInvites}
                    onChange={(e) => setEditAllowEditorInvites(e.target.checked)}
                    style={{ accentColor: "#8057E8" }}
                  />
                  Allow Editors to invite other collaborators
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={editAllowComments}
                    onChange={(e) => setEditAllowComments(e.target.checked)}
                    style={{ accentColor: "#8057E8" }}
                  />
                  Enable member comments & reactions
                </label>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => setSettingsModalOpen(false)}
                    style={{ padding: "8px 16px", borderRadius: "var(--radius-pill)", background: "#f3f4f6", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ padding: "8px 20px", borderRadius: "var(--radius-pill)", background: "#FF3F9D", color: "#fff", border: "none", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Express Razorpay Checkout Modal */}
      <TemuInstantBuyModal
        isOpen={instantBuyOpen}
        onClose={() => setInstantBuyOpen(false)}
        product={instantBuyItem}
      />
    </div>
  );
};

export default SingleWishlistPage;

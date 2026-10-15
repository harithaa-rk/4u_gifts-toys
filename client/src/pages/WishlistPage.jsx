import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Heart, Plus, Users, Globe, Lock, Share2, Sparkles, 
  Trash2, Copy, Search, Check, FolderHeart, ArrowRight, 
  Archive, RotateCcw, AlertCircle, ShoppingBag, Zap, 
  ChevronRight, MoreVertical, ShieldCheck, Mail, CheckCircle
} from "lucide-react";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useCollaborativeWishlist } from "../context/CollaborativeWishlistContext";
import { API_BASE_URL } from "../utils/constants";

const WishlistPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isLoggedIn, currentUser } = useAuth();

  const {
    ownedWishlists,
    sharedWishlists,
    archivedWishlists,
    loadingWishlists,
    pendingInvitations,
    createWishlist,
    duplicateWishlist,
    toggleArchiveWishlist,
    deleteWishlist,
    acceptInvitation,
    rejectInvitation,
  } = useCollaborativeWishlist();

  // Active Tab: 'owned' | 'shared' | 'public' | 'archived'
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "owned");
  const [searchQuery, setSearchQuery] = useState("");
  const [privacyFilter, setPrivacyFilter] = useState("all");

  // Public wishlists discovery
  const [publicWishlists, setPublicWishlists] = useState([]);
  const [loadingPublic, setLoadingPublic] = useState(false);

  // Create Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newVisibility, setNewVisibility] = useState("shared");
  const [newEmails, setNewEmails] = useState("");
  const [newRole, setNewRole] = useState("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Quick Action Menu State
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Edit Wishlist Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingWishlist, setEditingWishlist] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editVisibility, setEditVisibility] = useState("private");
  const [isEditingSubmitting, setIsEditingSubmitting] = useState(false);

  const handleOpenEdit = (w) => {
    setActiveMenuId(null);
    setEditingWishlist(w);
    setEditTitle(w.name || "");
    setEditDescription(w.description || "");
    setEditVisibility(w.visibility || "private");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      toast.error("Wishlist title is required.");
      return;
    }
    setIsEditingSubmitting(true);
    try {
      await updateWishlist(editingWishlist._id, {
        name: editTitle.trim(),
        description: editDescription.trim(),
        visibility: editVisibility,
      });
      toast.success("Wishlist details updated! ✨");
      setEditModalOpen(false);
      setEditingWishlist(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update wishlist.");
    } finally {
      setIsEditingSubmitting(false);
    }
  };

  // Sync tab with URL
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Fetch Public Collections when on 'public' tab
  useEffect(() => {
    if (activeTab === "public") {
      const fetchPublic = async () => {
        setLoadingPublic(true);
        try {
          const res = await axios.get(`${API_BASE_URL}/collaborative-wishlists/public`);
          if (res.data.success) {
            setPublicWishlists(res.data.wishlists || []);
          }
        } catch (err) {
          console.error("Error fetching public wishlists:", err);
        } finally {
          setLoadingPublic(false);
        }
      };
      fetchPublic();
    }
  }, [activeTab]);

  // Filtered List based on Active Tab, Search, and Privacy
  const currentList = useMemo(() => {
    let list = [];
    if (activeTab === "owned") list = ownedWishlists;
    else if (activeTab === "shared") list = sharedWishlists;
    else if (activeTab === "archived") list = archivedWishlists;
    else if (activeTab === "public") return publicWishlists;

    return list.filter((w) => {
      const matchSearch =
        !searchQuery.trim() ||
        w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchPrivacy =
        privacyFilter === "all" || w.visibility === privacyFilter;

      return matchSearch && matchPrivacy;
    });
  }, [activeTab, ownedWishlists, sharedWishlists, archivedWishlists, publicWishlists, searchQuery, privacyFilter]);

  // Handle Create Wishlist
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a collection name.");
      return;
    }

    setIsSubmitting(true);
    try {
      const emailsList = newEmails
        .split(/[\s,]+/)
        .map((e) => e.trim().toLowerCase())
        .filter((e) => e.length > 0);

      const created = await createWishlist({
        name: newTitle.trim(),
        description: newDesc.trim(),
        visibility: newVisibility,
        inviteEmails: emailsList,
        inviteRole: newRole,
      });

      setCreateModalOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewEmails("");
      if (created?._id) {
        navigate(`/wishlist/${created._id}`);
      }
    } catch {
      // Toast handled by context
    } finally {
      setIsSubmitting(false);
    }
  };

  // Statistics
  const totalItemsCount = useMemo(() => {
    return [...ownedWishlists, ...sharedWishlists].reduce(
      (acc, curr) => acc + (curr.items?.length || 0),
      0
    );
  }, [ownedWishlists, sharedWishlists]);

  return (
    <div
      style={{
        background: "var(--bg, #FFF9FB)",
        minHeight: "100vh",
        padding: "110px 5% 90px",
        fontFamily: "inherit",
        boxSizing: "border-box",
      }}
      onClick={() => setActiveMenuId(null)}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* ── HERO BANNER & STATS ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, #2D1432 0%, #402044 55%, #562758 100%)",
            borderRadius: "32px",
            padding: "36px 36px 32px",
            color: "#fff",
            marginBottom: 30,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 20px 50px rgba(45, 14, 52, 0.25)",
          }}
        >
          {/* Decorative Sparkles & Ribbon */}
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255, 63, 157, 0.3) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                    color: "#fff",
                    fontSize: 11,
                    fontWeight: 900,
                    padding: "4px 12px",
                    borderRadius: "var(--radius-pill)",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                  }}
                >
                  Gift Wishlists
                </span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: 700 }}>
                  · 4U Toys & Gifts
                </span>
              </div>

              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(26px, 3.8vw, 36px)",
                  fontWeight: 900,
                  margin: "0 0 10px",
                  lineHeight: 1.2,
                }}
              >
                My Wishlists & Gift Collections 🎁
              </h1>

              <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, maxWidth: 580, margin: 0, lineHeight: 1.5 }}>
                Curate personalized gift collections for birthdays, celebrations, and festive occasions with family and friends.
              </p>
            </div>

            {/* Create Wishlist CTA Button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                if (!isLoggedIn) {
                  toast.error("Please log in to create a collaborative wishlist! 💖");
                  navigate("/login");
                  return;
                }
                setCreateModalOpen(true);
              }}
              style={{
                padding: "14px 28px",
                borderRadius: "var(--radius-pill)",
                background: "linear-gradient(135deg, #FF3F9D, #FF63B7)",
                color: "#fff",
                border: "none",
                fontFamily: "var(--font-display)",
                fontWeight: 900,
                fontSize: 15,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 8px 24px rgba(255, 63, 157, 0.4)",
              }}
            >
              <Plus size={18} strokeWidth={3} />
              <span>{t("wishlist.createNew", "Create New Wishlist")}</span>
            </motion.button>
          </div>

          {/* Quick Metrics */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginTop: 26,
              paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,0.12)",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#FF63B7" }}>{ownedWishlists.length}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>My Collections</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#A78BFA" }}>{sharedWishlists.length}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Shared With Me</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#72E6B0" }}>{totalItemsCount}</span>
              <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>Total Curated Gifts</span>
            </div>
          </div>
        </motion.div>

        {/* ── PENDING INVITATIONS NOTIFICATION BANNER (If Any) ── */}
        {pendingInvitations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "linear-gradient(135deg, #FFF0F6 0%, #FAF5FF 100%)",
              border: "2px solid #FF3F9D",
              borderRadius: "24px",
              padding: "18px 24px",
              marginBottom: 28,
              boxShadow: "0 10px 30px rgba(255, 63, 157, 0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "rgba(255, 63, 157, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FF3F9D",
                  }}
                >
                  <Mail size={22} />
                </div>
                <div>
                  <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, fontWeight: 900, color: "var(--plum)", margin: "0 0 2px" }}>
                    You have {pendingInvitations.length} pending wishlist invitation{pendingInvitations.length > 1 ? "s" : ""}! 💌
                  </h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                    Accept to collaborate, view notes, and coordinate gift purchases together.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {pendingInvitations.map((inv) => (
                  <div
                    key={inv._id}
                    style={{
                      background: "#fff",
                      borderRadius: "var(--radius-pill)",
                      padding: "6px 14px",
                      border: "1px solid rgba(255, 99, 183, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 800, color: "var(--plum)" }}>
                      {inv.inviterName} → "{inv.wishlistName}"
                    </span>
                    <button
                      type="button"
                      onClick={() => acceptInvitation(inv._id)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: "var(--radius-pill)",
                        background: "#FF3F9D",
                        color: "#fff",
                        border: "none",
                        fontWeight: 800,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectInvitation(inv._id)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "var(--radius-pill)",
                        background: "none",
                        color: "var(--text-muted)",
                        border: "none",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Decline
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* ── TABS NAVIGATION & TOOLBAR ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
            marginBottom: 24,
            borderBottom: "1.5px solid rgba(255, 99, 183, 0.2)",
            paddingBottom: 14,
          }}
        >
          {/* Tabs */}
          <div style={{ display: "flex", gap: 8, overflowX: "auto" }}>
            {[
              { id: "owned", label: "My Collections", count: ownedWishlists.length, icon: "📂" },
              { id: "shared", label: "Shared With Me", count: sharedWishlists.length, icon: "👥" },
              { id: "public", label: "Public Discovery", icon: "🌐" },
              { id: "archived", label: "Archived", count: archivedWishlists.length, icon: "📦" },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "var(--radius-pill)",
                    background: isActive ? "linear-gradient(135deg, #FF3F9D, #8057E8)" : "#fff",
                    color: isActive ? "#fff" : "var(--plum)",
                    border: "1.5px solid",
                    borderColor: isActive ? "transparent" : "rgba(255, 99, 183, 0.25)",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    boxShadow: isActive ? "0 4px 14px rgba(255, 63, 157, 0.25)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      style={{
                        background: isActive ? "rgba(255,255,255,0.25)" : "rgba(255, 63, 157, 0.12)",
                        color: isActive ? "#fff" : "#FF3F9D",
                        padding: "1px 7px",
                        borderRadius: "10px",
                        fontSize: 11,
                        fontWeight: 900,
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Privacy filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ position: "relative", minWidth: 220 }}>
              <Search size={15} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                type="text"
                placeholder="Search collections…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px 8px 34px",
                  borderRadius: "var(--radius-pill)",
                  border: "1.5px solid #e5e7eb",
                  fontSize: 13,
                  outline: "none",
                  background: "#fff",
                  color: "var(--plum)",
                }}
              />
            </div>

            {activeTab !== "public" && (
              <select
                value={privacyFilter}
                onChange={(e) => setPrivacyFilter(e.target.value)}
                style={{
                  padding: "8px 14px",
                  borderRadius: "var(--radius-pill)",
                  border: "1.5px solid #e5e7eb",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--plum)",
                  background: "#fff",
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                <option value="all">All Visibility</option>
                <option value="private">🔒 Private Only</option>
                <option value="shared">👥 Shared Only</option>
                <option value="public">🌐 Public Only</option>
              </select>
            )}
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            COLLECTIONS GRID (Instagram Saved Collections Aesthetic)
        ════════════════════════════════════════════════════════════════ */}
        {loadingWishlists || (activeTab === "public" && loadingPublic) ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <Sparkles size={36} color="#FF3F9D" className="animate-spin" style={{ margin: "0 auto 12px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: 14, fontWeight: 700 }}>
              Loading magical collections…
            </p>
          </div>
        ) : currentList.length === 0 ? (
          /* Empty State */
          <div
            style={{
              textAlign: "center",
              padding: "70px 24px",
              background: "#fff",
              borderRadius: "28px",
              border: "2px dashed rgba(255, 99, 183, 0.35)",
              maxWidth: 620,
              margin: "30px auto",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "rgba(255, 63, 157, 0.12)",
                color: "#FF3F9D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <FolderHeart size={32} />
            </div>

            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "var(--plum)", margin: "0 0 8px" }}>
              {activeTab === "owned"
                ? "No Collections Yet"
                : activeTab === "shared"
                ? "No Shared Collections Yet"
                : activeTab === "archived"
                ? "No Archived Collections"
                : "No Public Collections Discovered"}
            </h3>

            <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 24px", lineHeight: 1.6 }}>
              {activeTab === "owned"
                ? "Create custom collections for birthdays, family holidays, or surprise registries and invite loved ones to curate together!"
                : activeTab === "shared"
                ? "When friends or family invite you to their wishlists, their collections will show up right here."
                : activeTab === "archived"
                ? "Wishlists you archive will safely rest here and can be restored anytime."
                : "Be the first to share your boutique toy registry with the community!"}
            </p>

            {activeTab === "owned" && (
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                style={{
                  padding: "12px 28px",
                  borderRadius: "var(--radius-pill)",
                  background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                  color: "#fff",
                  border: "none",
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 6px 20px rgba(255, 63, 157, 0.3)",
                }}
              >
                <Plus size={16} strokeWidth={3} /> Create Your First Wishlist
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
              gap: 24,
            }}
          >
            {currentList.map((w) => {
              const previewItems = w.items || [];
              const previewImages = previewItems
                .map((it) => it.productId?.images?.[0] || it.images?.[0])
                .filter(Boolean);

              const isOwner = w.ownerId?._id === currentUser?.id || w.ownerId === currentUser?.id;
              const isShared = w.visibility === "shared";
              const isPublic = w.visibility === "public";
              const membersCount = w.members?.length || (isShared ? 2 : 1);

              return (
                <motion.div
                  key={w._id}
                  whileHover={{ y: -6, boxShadow: "0 18px 45px rgba(255, 63, 157, 0.16)" }}
                  transition={{ duration: 0.2 }}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "24px",
                    overflow: "hidden",
                    border: "1.5px solid rgba(255, 99, 183, 0.25)",
                    boxShadow: "0 10px 30px rgba(64, 32, 68, 0.05)",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    position: "relative",
                  }}
                  onClick={() => {
                    if (activeTab === "public") {
                      navigate(`/wishlist/shared/${w.shareCode}`);
                    } else {
                      navigate(`/wishlist/${w._id}`);
                    }
                  }}
                >
                  {/* ── 4-IMAGE INSTAGRAM STYLE PREVIEW COLLAGE ── */}
                  <div
                    style={{
                      height: 190,
                      background: "linear-gradient(135deg, #FFF0F6 0%, #FAF5FF 100%)",
                      display: "grid",
                      gridTemplateColumns: previewImages.length >= 2 ? "1fr 1fr" : "1fr",
                      gridTemplateRows: previewImages.length >= 3 ? "1fr 1fr" : "1fr",
                      gap: 2,
                      padding: 2,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {previewImages.length === 0 ? (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
                        {w.coverImage ? "🎀" : "🎁"}
                      </div>
                    ) : (
                      previewImages.slice(0, 4).map((img, idx) => (
                        <div
                          key={idx}
                          style={{
                            overflow: "hidden",
                            background: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <img
                            src={img}
                            alt=""
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              padding: 6,
                            }}
                          />
                        </div>
                      ))
                    )}

                    {/* Visibility Pill Overlay */}
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        left: 10,
                        background: "rgba(255, 255, 255, 0.92)",
                        backdropFilter: "blur(6px)",
                        padding: "3px 10px",
                        borderRadius: "var(--radius-pill)",
                        fontSize: 11,
                        fontWeight: 900,
                        color: isPublic ? "#059669" : isShared ? "#8057E8" : "#402044",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                    >
                      {isPublic ? <Globe size={12} /> : isShared ? <Users size={12} /> : <Lock size={12} />}
                      <span style={{ textTransform: "capitalize" }}>{w.visibility}</span>
                    </div>

                    {/* Quick Menu Button */}
                    {activeTab !== "public" && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === w._id ? null : w._id);
                        }}
                        style={{
                          position: "absolute",
                          top: 10,
                          right: 10,
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "rgba(255,255,255,0.92)",
                          border: "none",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          color: "var(--plum)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                        }}
                      >
                        <MoreVertical size={16} />
                      </button>
                    )}

                    {/* Dropdown Menu */}
                    {activeMenuId === w._id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: "absolute",
                          top: 46,
                          right: 10,
                          background: "#fff",
                          borderRadius: "16px",
                          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                          border: "1px solid rgba(255,99,183,0.3)",
                          padding: "6px",
                          zIndex: 30,
                          minWidth: 150,
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            navigate(`/wishlist/${w._id}`);
                          }}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "10px",
                            background: "none",
                            border: "none",
                            textAlign: "left",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--plum)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <FolderHeart size={13} color="#FF3F9D" /> Open Wishlist
                        </button>

                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(w)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "10px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--plum)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Settings size={13} /> Edit Details
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveMenuId(null);
                            duplicateWishlist(w._id);
                          }}
                          style={{
                            padding: "8px 12px",
                            borderRadius: "10px",
                            background: "none",
                            border: "none",
                            textAlign: "left",
                            fontSize: 12,
                            fontWeight: 700,
                            color: "var(--plum)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          <Copy size={13} /> Duplicate
                        </button>

                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              toggleArchiveWishlist(w._id);
                            }}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "10px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--plum)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Archive size={13} /> {w.isArchived ? "Restore" : "Archive"}
                          </button>
                        )}

                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuId(null);
                              if (window.confirm(`Are you sure you want to delete "${w.name}"?`)) {
                                deleteWishlist(w._id);
                              }
                            }}
                            style={{
                              padding: "8px 12px",
                              borderRadius: "10px",
                              background: "none",
                              border: "none",
                              textAlign: "left",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#dc2626",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: "16px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <h3
                        style={{
                          fontFamily: "var(--font-display)",
                          fontSize: 17,
                          fontWeight: 900,
                          color: "var(--plum)",
                          margin: 0,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {w.name}
                      </h3>
                      {w.isPrimary && (
                        <span
                          style={{
                            background: "rgba(255, 63, 157, 0.15)",
                            color: "#FF3F9D",
                            fontSize: 10,
                            fontWeight: 900,
                            padding: "2px 7px",
                            borderRadius: "var(--radius-pill)",
                            textTransform: "uppercase",
                          }}
                        >
                          Default
                        </span>
                      )}
                    </div>

                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: 13,
                        margin: "0 0 14px",
                        lineHeight: 1.4,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        flex: 1,
                      }}
                    >
                      {w.description || "Shared boutique gift registry."}
                    </p>

                    {/* Bottom Metadata: Collaborator Avatars & Count */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 12,
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                        marginTop: "auto",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 900, color: "#FF3F9D" }}>
                          ₹{previewItems.reduce((acc, it) => acc + (Number(it.productId?.price) || Number(it.price) || 0) * (it.desiredQuantity || 1), 0).toLocaleString("en-IN")}
                        </span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>
                          • {previewItems.length} {previewItems.length === 1 ? "gift" : "gifts"}
                        </span>
                      </div>

                      {/* Collaborator Avatars Stack */}
                      <div style={{ display: "flex", alignItems: "center" }}>
                        {isShared && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: "rgba(128, 87, 232, 0.1)",
                              padding: "3px 8px",
                              borderRadius: "var(--radius-pill)",
                              fontSize: 11,
                              fontWeight: 800,
                              color: "#8057E8",
                            }}
                          >
                            <Users size={12} />
                            <span>{membersCount} members</span>
                          </div>
                        )}
                        {!isShared && (
                          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>
                            {w.owner?.name || w.ownerId?.name || "Personal"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          CREATE WISHLIST MODAL
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {createModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(38, 16, 43, 0.72)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setCreateModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#FFFFFF",
                borderRadius: "28px",
                maxWidth: "540px",
                width: "100%",
                boxShadow: "0 24px 60px rgba(45, 14, 52, 0.3)",
                border: "2px solid rgba(255, 99, 183, 0.35)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                maxHeight: "90vh",
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: "20px 24px 16px",
                  background: "linear-gradient(135deg, #FFF9FB 0%, #FAF5FF 100%)",
                  borderBottom: "1px solid rgba(255, 99, 183, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "rgba(255, 63, 157, 0.15)",
                      color: "#FF3F9D",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FolderHeart size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900, color: "var(--plum)", margin: 0 }}>
                      Create Collaborative Wishlist
                    </h3>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Curate gifts together or keep it personal
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={{
                    background: "rgba(64, 32, 68, 0.06)",
                    border: "none",
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: 16,
                    color: "var(--plum)",
                    fontWeight: 800,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleCreateSubmit} style={{ padding: "20px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 6 }}>
                    Collection Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. My Birthday Wishlist, Diwali Shopping, Baby Shower"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: "14px",
                      border: "1.5px solid #e5e7eb",
                      fontSize: 14,
                      outline: "none",
                      color: "var(--plum)",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 6 }}>
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={300}
                    placeholder="Share what this gift collection is for..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      border: "1.5px solid #e5e7eb",
                      fontSize: 13,
                      outline: "none",
                      fontFamily: "inherit",
                      resize: "none",
                      color: "var(--plum)",
                    }}
                  />
                </div>

                {/* Privacy Setting */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 8 }}>
                    Privacy Mode:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                    {[
                      { id: "private", title: "Private", icon: <Lock size={15} />, desc: "Only you" },
                      { id: "shared", title: "Shared", icon: <Users size={15} />, desc: "Invited friends" },
                      { id: "public", title: "Public", icon: <Globe size={15} />, desc: "Shareable link" },
                    ].map((mode) => (
                      <div
                        key={mode.id}
                        onClick={() => setNewVisibility(mode.id)}
                        style={{
                          padding: "12px",
                          borderRadius: "16px",
                          border: "2px solid",
                          borderColor: newVisibility === mode.id ? "#FF3F9D" : "#e5e7eb",
                          background: newVisibility === mode.id ? "rgba(255, 240, 246, 0.6)" : "#fff",
                          cursor: "pointer",
                          textAlign: "center",
                          transition: "all 0.15s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: newVisibility === mode.id ? "#FF3F9D" : "var(--plum)", fontWeight: 900, fontSize: 13, marginBottom: 2 }}>
                          {mode.icon}
                          <span>{mode.title}</span>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{mode.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invite Collaborators (Optional initial dispatch) */}
                {newVisibility === "shared" && (
                  <div
                    style={{
                      background: "linear-gradient(135deg, #FFF9FB, #FAF5FF)",
                      padding: 16,
                      borderRadius: "18px",
                      border: "1.5px solid rgba(128, 87, 232, 0.25)",
                    }}
                  >
                    <label style={{ fontSize: 13, fontWeight: 900, color: "var(--plum)", display: "block", marginBottom: 4 }}>
                      Invite Friends by Email:
                    </label>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 10px" }}>
                      Enter Gmail/email addresses separated by commas. They'll receive an invitation with your assigned role.
                    </p>

                    <input
                      type="text"
                      placeholder="e.g. friend1@gmail.com, sister@example.com"
                      value={newEmails}
                      onChange={(e) => setNewEmails(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 14px",
                        borderRadius: "12px",
                        border: "1.5px solid #e5e7eb",
                        fontSize: 13,
                        outline: "none",
                        marginBottom: 10,
                        color: "var(--plum)",
                      }}
                    />

                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--plum)" }}>Role:</span>
                      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="role"
                          checked={newRole === "editor"}
                          onChange={() => setNewRole("editor")}
                          style={{ accentColor: "#8057E8" }}
                        />
                        Editor (Can add/remove items & notes)
                      </label>
                      <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                        <input
                          type="radio"
                          name="role"
                          checked={newRole === "viewer"}
                          onChange={() => setNewRole("viewer")}
                          style={{ accentColor: "#8057E8" }}
                        />
                        Viewer (View only)
                      </label>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(false)}
                    style={{
                      padding: "11px 22px",
                      borderRadius: "var(--radius-pill)",
                      background: "#f3f4f6",
                      border: "none",
                      fontWeight: 800,
                      fontSize: 13,
                      color: "var(--plum)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !newTitle.trim()}
                    style={{
                      padding: "11px 28px",
                      borderRadius: "var(--radius-pill)",
                      background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                      border: "none",
                      color: "#fff",
                      fontWeight: 900,
                      fontSize: 13,
                      cursor: isSubmitting ? "wait" : "pointer",
                      boxShadow: "0 6px 18px rgba(255, 63, 157, 0.35)",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <Sparkles size={14} />
                    <span>{isSubmitting ? "Creating…" : "Create Collection"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ── EDIT WISHLIST MODAL ── */}
        {editModalOpen && editingWishlist && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(38, 16, 43, 0.72)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
            }}
            onClick={() => setEditModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: 480,
                background: "#fff",
                borderRadius: "32px",
                border: "2px solid rgba(255, 99, 183, 0.4)",
                boxShadow: "0 24px 70px rgba(64, 32, 68, 0.25)",
                padding: "30px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900, color: "var(--plum)", margin: 0 }}>
                  Edit Wishlist Details
                </h3>
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 6 }}>
                    Wishlist Name *
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: "14px",
                      border: "1.5px solid rgba(255, 99, 183, 0.4)",
                      fontSize: 14,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      border: "1.5px solid #e5e7eb",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 6 }}>
                    Visibility & Privacy
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["private", "shared", "public"].map((vis) => (
                      <button
                        key={vis}
                        type="button"
                        onClick={() => setEditVisibility(vis)}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "12px",
                          border: "1.5px solid",
                          borderColor: editVisibility === vis ? "#FF3F9D" : "#e5e7eb",
                          background: editVisibility === vis ? "#FFF0F6" : "#fff",
                          color: editVisibility === vis ? "#FF3F9D" : "var(--plum)",
                          fontSize: 12,
                          fontWeight: 800,
                          textTransform: "capitalize",
                          cursor: "pointer",
                        }}
                      >
                        {vis}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setEditModalOpen(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "100px",
                      background: "#f3f4f6",
                      border: "none",
                      fontWeight: 800,
                      fontSize: 13,
                      color: "var(--plum)",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEditingSubmitting || !editTitle.trim()}
                    style={{
                      padding: "10px 24px",
                      borderRadius: "100px",
                      background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                      color: "#fff",
                      border: "none",
                      fontWeight: 900,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    {isEditingSubmitting ? "Saving…" : "Save Changes"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WishlistPage;
import React, { useState, useEffect, useMemo } from "react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, ShoppingBag, Trash2, ChevronRight, Zap, Sparkles, 
  Share2, Copy, Check, Search, ArrowUpDown, CheckCircle, 
  AlertCircle, ExternalLink, Filter, RotateCcw, Package,
  Truck, ShieldCheck, Tag, ArrowRight
} from "lucide-react";
import { useTranslation } from "react-i18next";
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../utils/constants";
import TemuInstantBuyModal from "../components/payment/TemuInstantBuyModal";

const CATEGORIES = [
  { id: "all", label: "All Items", icon: "✨" },
  { id: "Toys", label: "Toys", icon: "🧸" },
  { id: "Baby", label: "Baby Essentials", icon: "🍼" },
  { id: "Mommy", label: "Mommy & Care", icon: "👩‍👧" },
  { id: "Father", label: "Father's Day", icon: "👔" },
  { id: "Decor", label: "Home Decor", icon: "🌸" },
  { id: "Fancy", label: "Fancy Gifts", icon: "🎀" },
];

const WishlistPage = () => {
  const { t } = useTranslation();
  const { wishlistItems, toggleWishlist, removeFromWishlist, clearWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // Instant Razorpay Purchase State
  const [instantBuyItem, setInstantBuyItem] = useState(null);
  const [instantBuyOpen, setInstantBuyOpen] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Filter, Search, and Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [inStockOnly, setInStockOnly] = useState(false);

  // Share and Clear Modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Fetch Recommended / Trending Products from Catalogue
  useEffect(() => {
    const fetchRecs = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/products`);
        if (Array.isArray(res.data)) {
          const active = res.data.filter((p) => p.status === "active" || p.status === "low_stock" || !p.status);
          setRecommendations(active.slice(0, 8));
        }
      } catch (err) {
        console.error("Error fetching wishlist recommendations:", err);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecs();
  }, []);

  // Filter and Sort Wishlist Items
  const filteredWishlist = useMemo(() => {
    return wishlistItems
      .filter((item) => {
        // Category filter
        const matchCat =
          selectedCategory === "all" ||
          item.category?.toLowerCase() === selectedCategory.toLowerCase();

        // Search query
        const matchSearch =
          !searchQuery.trim() ||
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchQuery.toLowerCase());

        // In Stock filter
        const matchStock = inStockOnly ? (item.quantity ?? 1) > 0 : true;

        return matchCat && matchSearch && matchStock;
      })
      .sort((a, b) => {
        if (sortBy === "price_asc") return (Number(a.price) || 0) - (Number(b.price) || 0);
        if (sortBy === "price_desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
        if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
        return 0; // 'recent' maintains default list order
      });
  }, [wishlistItems, selectedCategory, searchQuery, inStockOnly, sortBy]);

  // Total Wishlist Value
  const totalWishlistValue = useMemo(() => {
    return wishlistItems.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
  }, [wishlistItems]);

  // Bulk Actions
  const handleOpenDirectBuy = (item) => {
    setInstantBuyItem(item);
    setInstantBuyOpen(true);
  };

  const handleBuyAllWishlist = () => {
    if (wishlistItems.length === 0) return;
    setInstantBuyItem(wishlistItems);
    setInstantBuyOpen(true);
  };

  const handleMoveAllToCart = () => {
    if (!isLoggedIn) {
      toast.error(t("auth.loginRequired", "Please login to add items to your cart! 🛍️"));
      navigate("/login");
      return;
    }
    if (wishlistItems.length === 0) return;

    wishlistItems.forEach((item) => {
      addToCart(item);
    });
    toast.success(
      t("wishlist.movedAllToCart", `All ${wishlistItems.length} items moved to your shopping bag! 🛍️`)
    );
  };

  const handleMoveSingleToCart = (product) => {
    if (!isLoggedIn) {
      toast.error(t("auth.loginRequired", "Please login to add items to your cart! 🛍️"));
      navigate("/login");
      return;
    }
    addToCart(product);
    removeFromWishlist(product._id);
    toast.success(`${product.name} moved to cart! 🛍️`);
  };

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/wishlist?shared=true`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success(t("wishlist.linkCopied", "Wishlist link copied to clipboard! 📋"));
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleShareWhatsApp = () => {
    const url = `${window.location.origin}/wishlist?shared=true`;
    const message = encodeURIComponent(
      `Check out my favorite gifts & toys on 4U Toys & Treats boutique!\n${url}`
    );
    window.open(`https://api.whatsapp.com/send?text=${message}`, "_blank");
  };

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 25, scale: 0.96 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 320, damping: 26 },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 15,
      transition: { duration: 0.2 },
    },
  };

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
        
        {/* ── BREADCRUMB ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--text-muted)", marginBottom: 20 }}>
          <Link to="/" style={{ textDecoration: "none", color: "inherit", fontWeight: 700 }}>
            {t("nav.home", "Home")}
          </Link>
          <ChevronRight size={14} />
          <Link to="/shop" style={{ textDecoration: "none", color: "inherit", fontWeight: 700 }}>
            {t("nav.shop", "Shop")}
          </Link>
          <ChevronRight size={14} />
          <span style={{ color: "#FF3F9D", fontWeight: 800 }}>
            {t("wishlist.title", "My Wishlist")}
          </span>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            EMPTY WISHLIST STATE WITH RICH INTERACTIVE FUNCTIONALITIES
        ════════════════════════════════════════════════════════════════ */}
        {wishlistItems.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
            
            {/* Empty Hero Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                textAlign: "center",
                padding: "60px 24px",
                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.92) 0%, rgba(255, 245, 250, 0.88) 100%)",
                backdropFilter: "blur(20px)",
                borderRadius: "32px",
                border: "2px solid rgba(255, 99, 183, 0.25)",
                boxShadow: "0 20px 60px rgba(64, 32, 68, 0.06)",
                maxWidth: "740px",
                margin: "0 auto",
                width: "100%",
              }}
            >
              <div style={{ position: "relative", display: "inline-block", marginBottom: 20 }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <Heart size={86} color="#FF3F9D" style={{ opacity: 0.2 }} />
                </motion.div>
                <Heart
                  size={42}
                  color="#FF3F9D"
                  fill="#FF3F9D"
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }}
                />
              </div>

              <span
                style={{
                  display: "inline-block",
                  padding: "4px 14px",
                  borderRadius: "var(--radius-pill)",
                  background: "rgba(255, 63, 157, 0.12)",
                  color: "#FF3F9D",
                  fontSize: 12,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "1px",
                  marginBottom: 10,
                }}
              >
                {t("wishlist.curatedCollection", "Boutique Favorites")}
              </span>

              <h1
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(26px, 3.5vw, 36px)",
                  color: "var(--plum)",
                  fontWeight: 900,
                  margin: "0 0 10px",
                }}
              >
                {t("wishlist.emptyTitle", "Your Wishlist is Empty")}
              </h1>

              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "15px",
                  margin: "0 auto 28px",
                  lineHeight: "1.6",
                  maxWidth: "520px",
                }}
              >
                {t(
                  "wishlist.emptyDesc",
                  "Explore our magical collection and tap the heart icon on any toy or gift to save it for later or purchase instantly!"
                )}
              </p>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 30 }}>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/shop")}
                  style={{
                    padding: "14px 34px",
                    background: "linear-gradient(135deg, #FF3F9D 0%, #8057E8 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "var(--radius-pill)",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: 900,
                    boxShadow: "0 8px 24px rgba(255, 63, 157, 0.35)",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Sparkles size={18} /> {t("wishlist.browseProducts", "Browse All Gifts & Toys")}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate("/")}
                  style={{
                    padding: "14px 28px",
                    background: "#FFFFFF",
                    color: "var(--plum)",
                    border: "1.5px solid rgba(255, 99, 183, 0.35)",
                    borderRadius: "var(--radius-pill)",
                    cursor: "pointer",
                    fontSize: "15px",
                    fontWeight: 800,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span>🎡 {t("wishlist.tryVendingMachine", "Try 3D Magical Dispenser")}</span>
                </motion.button>
              </div>

              {/* Quick Category Exploration Pills */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>
                  {t("wishlist.exploreByCat", "Explore Categories:")}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                  {[
                    { path: "/shop", label: "🧸 All Toys" },
                    { path: "/baby", label: "🍼 Baby Essentials" },
                    { path: "/mommy", label: "👩‍👧 Mommy Corner" },
                    { path: "/father", label: "👔 Father's Day" },
                    { path: "/decor", label: "🌸 Home Decor" },
                    { path: "/fancy", label: "🎀 Fancy Collectibles" },
                  ].map((cat) => (
                    <button
                      key={cat.path}
                      type="button"
                      onClick={() => navigate(cat.path)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: "var(--radius-pill)",
                        background: "#fff",
                        border: "1px solid rgba(255, 99, 183, 0.25)",
                        color: "var(--plum)",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(64,32,68,0.04)",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#FF3F9D";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(255, 99, 183, 0.25)";
                        e.currentTarget.style.transform = "translateY(0)";
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* ── RECOMMENDED BOUTIQUE GIFTS GRID (When Wishlist is Empty) ── */}
            {recommendations.length > 0 && (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "#FF3F9D", letterSpacing: "1px" }}>
                      ⭐ {t("wishlist.trendingHeader", "Top Picks For You")}
                    </span>
                    <h2 style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 900, color: "var(--plum)", margin: "4px 0 0" }}>
                      {t("wishlist.trendingTitle", "Trending Magical Gifts to Add")}
                    </h2>
                  </div>
                  <Link
                    to="/shop"
                    style={{
                      textDecoration: "none",
                      color: "#FF3F9D",
                      fontWeight: 800,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {t("shop.viewAll", "View Entire Shop")} <ChevronRight size={16} />
                  </Link>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 22,
                  }}
                >
                  {recommendations.slice(0, 4).map((prod) => {
                    const isWished = isInWishlist(prod._id);
                    const originalPrice = Math.round(Number(prod.price) * 1.25);
                    return (
                      <div
                        key={prod._id}
                        style={{
                          background: "#fff",
                          borderRadius: "24px",
                          overflow: "hidden",
                          border: "1.5px solid rgba(255, 99, 183, 0.2)",
                          boxShadow: "0 10px 30px rgba(64, 32, 68, 0.05)",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          transition: "transform 0.25s, box-shadow 0.25s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-6px)";
                          e.currentTarget.style.boxShadow = "0 16px 40px rgba(255, 63, 157, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = "0 10px 30px rgba(64, 32, 68, 0.05)";
                        }}
                      >
                        {/* Wishlist toggle button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            toggleWishlist(prod);
                          }}
                          style={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            width: 38,
                            height: 38,
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.92)",
                            border: "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            zIndex: 10,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                          }}
                          title={isWished ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart
                            size={18}
                            color="#FF3F9D"
                            fill={isWished ? "#FF3F9D" : "none"}
                          />
                        </button>

                        {/* Image */}
                        <Link to={`/product/${prod._id}`} style={{ textDecoration: "none", display: "block" }}>
                          <div style={{ height: 200, background: "#FFF0F5", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                            {prod.images?.[0] ? (
                              <img
                                src={prod.images[0]}
                                alt={prod.name}
                                style={{ width: "100%", height: "100%", objectFit: "contain", padding: 12 }}
                              />
                            ) : (
                              <span style={{ fontSize: 48 }}>🎁</span>
                            )}
                          </div>
                        </Link>

                        {/* Content */}
                        <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: "#FF3F9D", marginBottom: 4 }}>
                            {prod.category || "Wonder"}
                          </span>
                          <Link to={`/product/${prod._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                            <h3
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: 16,
                                fontWeight: 800,
                                color: "var(--plum)",
                                margin: "0 0 8px",
                                lineHeight: 1.3,
                                display: "-webkit-box",
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {prod.name}
                            </h3>
                          </Link>

                          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: "auto", marginBottom: 14 }}>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900, color: "#FF3F9D" }}>
                              ₹{Number(prod.price).toLocaleString("en-IN")}
                            </span>
                            <span style={{ fontSize: 12, color: "var(--text-light)", textDecoration: "line-through" }}>
                              ₹{originalPrice.toLocaleString("en-IN")}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 900, color: "#059669", background: "rgba(114,230,176,0.25)", padding: "2px 6px", borderRadius: "var(--radius-pill)" }}>
                              20% OFF
                            </span>
                          </div>

                          {/* Dual Action Buttons */}
                          <div style={{ display: "flex", gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => handleOpenDirectBuy(prod)}
                              style={{
                                flex: 1,
                                padding: "10px",
                                borderRadius: "var(--radius-pill)",
                                background: "linear-gradient(135deg, #8057E8 0%, #A78BFA 100%)",
                                color: "#fff",
                                border: "none",
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                boxShadow: "0 4px 12px rgba(128, 87, 232, 0.25)",
                              }}
                            >
                              <Zap size={14} fill="#fff" /> Buy Now
                            </button>

                            <button
                              type="button"
                              onClick={() => addToCart(prod)}
                              style={{
                                flex: 1,
                                padding: "10px",
                                borderRadius: "var(--radius-pill)",
                                background: "linear-gradient(135deg, #FF3F9D 0%, #C9184A 100%)",
                                color: "#fff",
                                border: "none",
                                fontWeight: 800,
                                fontSize: 12,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 4,
                                boxShadow: "0 4px 12px rgba(255, 63, 157, 0.25)",
                              }}
                            >
                              <ShoppingBag size={14} /> Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ════════════════════════════════════════════════════════════════
              POPULATED WISHLIST STATE WITH COMPREHENSIVE TOOLS & CONTROLS
          ════════════════════════════════════════════════════════════════ */
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* ── HEADER BANNER ── */}
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 16,
                padding: "24px 28px",
                background: "linear-gradient(135deg, #FFF5F9 0%, #FAF5FF 100%)",
                borderRadius: "28px",
                border: "1.5px solid rgba(255, 99, 183, 0.3)",
                boxShadow: "0 10px 30px rgba(64, 32, 68, 0.04)",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "14px",
                      background: "rgba(255, 63, 157, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Heart size={24} color="#FF3F9D" fill="#FF3F9D" />
                  </div>
                  <div>
                    <h1
                      style={{
                        fontFamily: "var(--font-display)",
                        fontSize: "clamp(22px, 3vw, 28px)",
                        color: "var(--plum)",
                        fontWeight: 900,
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      {t("wishlist.title", "My Favorites")}
                      <span
                        style={{
                          background: "#FF3F9D",
                          color: "#fff",
                          fontSize: 13,
                          fontWeight: 800,
                          padding: "3px 12px",
                          borderRadius: "var(--radius-pill)",
                        }}
                      >
                        {wishlistItems.length}
                      </span>
                    </h1>
                    <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                      Estimated Total:{" "}
                      <strong style={{ color: "#FF3F9D" }}>
                        ₹{totalWishlistValue.toLocaleString("en-IN")}
                      </strong>{" "}
                      · <span style={{ color: "#059669", fontWeight: 700 }}>🎉 Eligible for Free Boutique Delivery</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Express Bulk Actions */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                {/* Buy All with Razorpay / UPI */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuyAllWishlist}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "var(--radius-pill)",
                    background: "linear-gradient(135deg, #8057E8 0%, #A78BFA 100%)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 6px 20px rgba(128, 87, 232, 0.35)",
                  }}
                >
                  <Zap size={16} fill="#fff" />
                  <span>
                    Buy All ({wishlistItems.length}) with Razorpay · ₹{totalWishlistValue.toLocaleString("en-IN")}
                  </span>
                </motion.button>

                {/* Move All to Cart */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleMoveAllToCart}
                  style={{
                    padding: "12px 20px",
                    borderRadius: "var(--radius-pill)",
                    background: "#fff",
                    color: "var(--plum)",
                    border: "1.5px solid rgba(255, 99, 183, 0.35)",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 4px 12px rgba(64,32,68,0.04)",
                  }}
                >
                  <ShoppingBag size={16} color="#FF3F9D" />
                  <span>{t("wishlist.moveAllToCart", "Move All to Cart")}</span>
                </motion.button>

                {/* Share Wishlist */}
                <button
                  type="button"
                  onClick={() => setShareModalOpen(true)}
                  style={{
                    padding: "11px 16px",
                    borderRadius: "var(--radius-pill)",
                    background: "#fff",
                    color: "var(--plum)",
                    border: "1.5px solid #e5e7eb",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  title="Share your wishlist"
                >
                  <Share2 size={15} color="#8057E8" />
                  <span>Share</span>
                </button>

                {/* Clear Wishlist */}
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(true)}
                  style={{
                    padding: "11px 14px",
                    borderRadius: "var(--radius-pill)",
                    background: "rgba(239, 68, 68, 0.08)",
                    color: "#dc2626",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                  title="Clear all favorites"
                >
                  <Trash2 size={15} />
                  <span>Clear</span>
                </button>
              </div>
            </motion.div>

            {/* ── TOOLBAR: SEARCH, CATEGORY FILTER & SORT ── */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                padding: "16px 20px",
                background: "#fff",
                borderRadius: "20px",
                border: "1px solid rgba(255, 99, 183, 0.2)",
                boxShadow: "0 4px 16px rgba(64,32,68,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                
                {/* Search Bar */}
                <div
                  style={{
                    position: "relative",
                    flex: "1 1 240px",
                    maxWidth: 360,
                  }}
                >
                  <Search
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("wishlist.searchPlaceholder", "Search saved items…")}
                    style={{
                      width: "100%",
                      padding: "10px 14px 10px 38px",
                      borderRadius: "var(--radius-pill)",
                      border: "1.5px solid #e5e7eb",
                      fontSize: 13,
                      outline: "none",
                      color: "var(--plum)",
                      background: "#fafafa",
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Right controls: In-Stock toggle and Sort Dropdown */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  {/* In Stock Only Checkbox */}
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--plum)",
                      cursor: "pointer",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      style={{ accentColor: "#FF3F9D", cursor: "pointer", width: 16, height: 16 }}
                    />
                    <span>{t("shop.inStockOnly", "In Stock Only")}</span>
                  </label>

                  {/* Sort By Dropdown */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <ArrowUpDown size={14} color="var(--text-muted)" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        padding: "8px 14px",
                        borderRadius: "var(--radius-pill)",
                        border: "1.5px solid #e5e7eb",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "var(--plum)",
                        background: "#fff",
                        cursor: "pointer",
                        outline: "none",
                      }}
                    >
                      <option value="recent">🕒 Recently Added</option>
                      <option value="price_asc">📈 Price: Low to High</option>
                      <option value="price_desc">📉 Price: High to Low</option>
                      <option value="name">🔤 Product Name (A-Z)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: "6px 14px",
                      borderRadius: "var(--radius-pill)",
                      border: "1.5px solid",
                      borderColor: selectedCategory === cat.id ? "#FF3F9D" : "#e5e7eb",
                      background: selectedCategory === cat.id ? "linear-gradient(135deg, #FF3F9D, #8057E8)" : "#fff",
                      color: selectedCategory === cat.id ? "#fff" : "var(--plum)",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 0.15s",
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── WISHLIST ITEMS GRID ── */}
            {filteredWishlist.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "50px 20px",
                  background: "#fff",
                  borderRadius: "24px",
                  border: "1px dashed rgba(255, 99, 183, 0.4)",
                  color: "var(--text-muted)",
                }}
              >
                <Filter size={32} color="#FF3F9D" style={{ margin: "0 auto 10px", opacity: 0.6 }} />
                <h3 style={{ fontFamily: "var(--font-display)", color: "var(--plum)", fontSize: 18, margin: "0 0 6px" }}>
                  No matching favorites found
                </h3>
                <p style={{ fontSize: 13, margin: 0 }}>
                  Try resetting your category or search filter to see your saved items.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setInStockOnly(false);
                  }}
                  style={{
                    marginTop: 14,
                    padding: "8px 18px",
                    borderRadius: "var(--radius-pill)",
                    background: "transparent",
                    border: "1.5px solid #FF3F9D",
                    color: "#FF3F9D",
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: "pointer",
                  }}
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <motion.div
                variants={containerVars}
                initial="hidden"
                animate="show"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "24px",
                }}
              >
                <AnimatePresence mode="popLayout">
                  {filteredWishlist.map((product) => {
                    const originalPrice = Math.round(Number(product.price) * 1.25);
                    const isOutOfStock = (product.quantity ?? 1) <= 0;
                    const isLowStock = (product.quantity ?? 1) > 0 && (product.quantity ?? 1) <= 2;

                    return (
                      <motion.div
                        variants={itemVars}
                        key={product._id}
                        layout
                        style={{
                          background: "#FFFFFF",
                          borderRadius: "24px",
                          overflow: "hidden",
                          border: "1.5px solid rgba(255, 99, 183, 0.25)",
                          boxShadow: "0 10px 30px rgba(64, 32, 68, 0.05)",
                          display: "flex",
                          flexDirection: "column",
                          position: "relative",
                          transition: "all 0.25s",
                        }}
                        whileHover={{ y: -6, boxShadow: "0 16px 40px rgba(255, 63, 157, 0.16)" }}
                      >
                        {/* Remove overlay button */}
                        <button
                          type="button"
                          onClick={() => removeFromWishlist(product._id)}
                          style={{
                            position: "absolute",
                            top: "14px",
                            right: "14px",
                            zIndex: 10,
                            background: "rgba(255, 255, 255, 0.92)",
                            border: "none",
                            borderRadius: "50%",
                            width: "36px",
                            height: "36px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            color: "#e63946",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#ffebee")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255, 255, 255, 0.92)")}
                          title={t("wishlist.remove", "Remove from favorites")}
                        >
                          <Trash2 size={16} />
                        </button>

                        {/* Stock Badge Overlay */}
                        <div style={{ position: "absolute", top: 14, left: 14, zIndex: 10 }}>
                          {isOutOfStock ? (
                            <span
                              style={{
                                background: "#dc2626",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 900,
                                padding: "4px 8px",
                                borderRadius: "var(--radius-pill)",
                                textTransform: "uppercase",
                              }}
                            >
                              Sold Out
                            </span>
                          ) : isLowStock ? (
                            <span
                              style={{
                                background: "#ea580c",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 900,
                                padding: "4px 8px",
                                borderRadius: "var(--radius-pill)",
                              }}
                            >
                              Only {product.quantity} Left!
                            </span>
                          ) : (
                            <span
                              style={{
                                background: "rgba(114, 230, 176, 0.95)",
                                color: "#064e3b",
                                fontSize: 10,
                                fontWeight: 900,
                                padding: "4px 8px",
                                borderRadius: "var(--radius-pill)",
                              }}
                            >
                              In Stock
                            </span>
                          )}
                        </div>

                        {/* Image */}
                        <Link
                          to={`/product/${product._id}`}
                          style={{ textDecoration: "none", color: "inherit", display: "block" }}
                        >
                          <div
                            style={{
                              height: "220px",
                              overflow: "hidden",
                              background: "linear-gradient(135deg, #FFF0F6 0%, #FAF5FF 100%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                  padding: "16px",
                                  transition: "transform 0.3s ease",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.06)")}
                                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                              />
                            ) : (
                              <span style={{ fontSize: "56px" }}>🎁</span>
                            )}
                          </div>
                        </Link>

                        {/* Content */}
                        <div style={{ padding: "18px 20px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#FF3F9D",
                              fontWeight: 900,
                              textTransform: "uppercase",
                              letterSpacing: "0.8px",
                              marginBottom: "4px",
                            }}
                          >
                            {product.category || "Boutique"}
                          </span>

                          <Link
                            to={`/product/${product._id}`}
                            style={{ textDecoration: "none", color: "inherit" }}
                          >
                            <h3
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "16px",
                                fontWeight: 800,
                                color: "var(--plum)",
                                margin: "0 0 10px",
                                lineHeight: 1.35,
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {product.name}
                            </h3>
                          </Link>

                          {/* Pricing with Discount */}
                          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "auto", marginBottom: "16px" }}>
                            <span
                              style={{
                                fontFamily: "var(--font-display)",
                                fontSize: "22px",
                                fontWeight: 900,
                                color: "#FF3F9D",
                              }}
                            >
                              ₹{(+product.price).toLocaleString("en-IN")}
                            </span>
                            <span
                              style={{
                                fontSize: "13px",
                                color: "var(--text-light)",
                                textDecoration: "line-through",
                              }}
                            >
                              ₹{originalPrice.toLocaleString("en-IN")}
                            </span>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 900,
                                color: "#059669",
                                background: "rgba(114,230,176,0.25)",
                                padding: "2px 6px",
                                borderRadius: "var(--radius-pill)",
                              }}
                            >
                              20% OFF
                            </span>
                          </div>

                          {/* Action Buttons: ⚡ Direct Buy Now & 🛒 Move to Cart */}
                          <div style={{ display: "flex", gap: "8px" }}>
                            {/* Direct Razorpay Instant Buy (Temu style) */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              disabled={isOutOfStock}
                              onClick={() => handleOpenDirectBuy(product)}
                              style={{
                                flex: 1,
                                padding: "11px 8px",
                                background: isOutOfStock
                                  ? "#d1d5db"
                                  : "linear-gradient(135deg, #8057E8 0%, #A78BFA 100%)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "var(--radius-pill)",
                                fontWeight: 900,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                cursor: isOutOfStock ? "not-allowed" : "pointer",
                                fontSize: "12px",
                                boxShadow: isOutOfStock ? "none" : "0 4px 14px rgba(128, 87, 232, 0.3)",
                              }}
                            >
                              <Zap size={14} fill="#fff" /> Buy Now
                            </motion.button>

                            {/* Move to Cart */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              disabled={isOutOfStock}
                              onClick={() => handleMoveSingleToCart(product)}
                              style={{
                                flex: 1,
                                padding: "11px 8px",
                                background: isOutOfStock
                                  ? "#d1d5db"
                                  : "linear-gradient(135deg, #FF3F9D 0%, #C9184A 100%)",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: "var(--radius-pill)",
                                fontWeight: 900,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                cursor: isOutOfStock ? "not-allowed" : "pointer",
                                fontSize: "12px",
                                boxShadow: isOutOfStock ? "none" : "0 4px 14px rgba(255, 63, 157, 0.3)",
                              }}
                            >
                              <ShoppingBag size={14} /> Move to Cart
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── RECOMMENDED COMPANION PRODUCTS SECTION (When items are in wishlist) ── */}
            {recommendations.length > 0 && (
              <div style={{ marginTop: 40, borderTop: "1.5px solid rgba(255, 99, 183, 0.2)", paddingTop: 30 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "#FF3F9D", letterSpacing: "1px" }}>
                      ✨ {t("wishlist.recommendedMore", "You May Also Like")}
                    </span>
                    <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "var(--plum)", margin: "4px 0 0" }}>
                      Discover More Boutique Toys & Gifts
                    </h3>
                  </div>
                  <Link
                    to="/shop"
                    style={{
                      textDecoration: "none",
                      color: "#FF3F9D",
                      fontWeight: 800,
                      fontSize: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {t("shop.viewAll", "View Shop")} <ChevronRight size={16} />
                  </Link>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: 20,
                  }}
                >
                  {recommendations.slice(0, 4).map((prod) => {
                    const isWished = isInWishlist(prod._id);
                    return (
                      <div
                        key={prod._id}
                        style={{
                          background: "#fff",
                          borderRadius: "20px",
                          overflow: "hidden",
                          border: "1.5px solid rgba(255, 99, 183, 0.2)",
                          boxShadow: "0 6px 20px rgba(64,32,68,0.04)",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        <div style={{ height: 160, background: "#FFF0F5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {prod.images?.[0] ? (
                            <img
                              src={prod.images[0]}
                              alt={prod.name}
                              style={{ width: "100%", height: "100%", objectFit: "contain", padding: 10 }}
                            />
                          ) : (
                            <span style={{ fontSize: 40 }}>🎁</span>
                          )}
                        </div>

                        <div style={{ padding: "14px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: "#FF3F9D", textTransform: "uppercase" }}>
                            {prod.category}
                          </span>
                          <h4 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, color: "var(--plum)", margin: "4px 0 10px" }}>
                            {prod.name}
                          </h4>
                          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: "auto", marginBottom: 12 }}>
                            <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900, color: "#FF3F9D" }}>
                              ₹{Number(prod.price).toLocaleString("en-IN")}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleWishlist(prod)}
                              style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                                color: isWished ? "#FF3F9D" : "var(--text-muted)",
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              <Heart size={16} fill={isWished ? "#FF3F9D" : "none"} color="#FF3F9D" />
                              <span>{isWished ? "Saved" : "Save"}</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => addToCart(prod)}
                            style={{
                              width: "100%",
                              padding: "9px",
                              borderRadius: "var(--radius-pill)",
                              background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                              color: "#fff",
                              border: "none",
                              fontSize: 12,
                              fontWeight: 800,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6,
                            }}
                          >
                            <ShoppingBag size={14} /> Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════
          SHARE WISHLIST MODAL
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {shareModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(38, 16, 43, 0.7)",
              backdropFilter: "blur(12px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setShareModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#FFFFFF",
                borderRadius: "28px",
                padding: "28px 24px",
                maxWidth: "480px",
                width: "100%",
                boxShadow: "0 24px 60px rgba(45, 14, 52, 0.3)",
                border: "2px solid rgba(255, 99, 183, 0.3)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "rgba(128, 87, 232, 0.12)",
                  color: "#8057E8",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <Share2 size={26} />
              </div>

              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "var(--plum)", margin: "0 0 6px" }}>
                Share Your Wishlist
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 0 20px", lineHeight: 1.5 }}>
                Send your curated favorites to family and friends so they know exactly what brings you joy!
              </p>

              {/* Share link input with copy button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#FAF5FF",
                  borderRadius: "16px",
                  padding: "6px 8px 6px 14px",
                  border: "1.5px solid rgba(128, 87, 232, 0.3)",
                  marginBottom: 16,
                }}
              >
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/wishlist?shared=true`}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 13,
                    color: "var(--plum)",
                    fontWeight: 600,
                  }}
                />
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "12px",
                    background: copiedLink ? "#059669" : "linear-gradient(135deg, #8057E8, #FF3F9D)",
                    color: "#fff",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? "Copied!" : "Copy"}</span>
                </button>
              </div>

              {/* Share on WhatsApp */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "var(--radius-pill)",
                  background: "#25D366",
                  color: "#fff",
                  border: "none",
                  fontWeight: 900,
                  fontSize: 14,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 16px rgba(37, 211, 102, 0.3)",
                  marginBottom: 12,
                }}
              >
                <span>💬 Share via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: "pointer",
                  padding: "6px 12px",
                }}
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════
          CONFIRM CLEAR WISHLIST DIALOG
      ════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {confirmClearOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(38, 16, 43, 0.7)",
              backdropFilter: "blur(12px)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={() => setConfirmClearOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#FFFFFF",
                borderRadius: "28px",
                padding: "28px 24px",
                maxWidth: "420px",
                width: "100%",
                boxShadow: "0 24px 60px rgba(45, 14, 52, 0.3)",
                border: "2px solid rgba(239, 68, 68, 0.25)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.12)",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                }}
              >
                <Trash2 size={24} />
              </div>

              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900, color: "var(--plum)", margin: "0 0 6px" }}>
                Clear Entire Wishlist?
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 0 22px", lineHeight: 1.5 }}>
                This will remove all {wishlistItems.length} saved treasures from your favorites. This action cannot be undone.
              </p>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setConfirmClearOpen(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "var(--radius-pill)",
                    background: "#f3f4f6",
                    color: "var(--plum)",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  Keep Items
                </button>

                <button
                  type="button"
                  onClick={() => {
                    clearWishlist();
                    setConfirmClearOpen(false);
                    toast.success(t("wishlist.cleared", "Wishlist cleared!"));
                  }}
                  style={{
                    flex: 1,
                    padding: "12px",
                    borderRadius: "var(--radius-pill)",
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(220, 38, 38, 0.3)",
                  }}
                >
                  Yes, Clear All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════
          TEMU-STYLE EXPRESS RAZORPAY CHECKOUT MODAL
      ════════════════════════════════════════════════════════════════ */}
      <TemuInstantBuyModal
        isOpen={instantBuyOpen}
        onClose={() => setInstantBuyOpen(false)}
        product={instantBuyItem}
      />
    </div>
  );
};

export default WishlistPage;
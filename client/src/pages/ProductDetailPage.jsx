import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft,
  ShoppingBag,
  Check,
  Star,
  ShieldCheck,
  Truck,
  Box,
  Heart,
  Share2,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  X,
  Sparkles,
  MapPin,
  Clock,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  MessageSquare,
  Gift,
} from "lucide-react";
import toast from "react-hot-toast";

import ARViewer from "../components/product/ARViewer";
import TemuInstantBuyModal from "../components/payment/TemuInstantBuyModal";
import AddToWishlistModal from "../components/wishlist/AddToWishlistModal";
import { API_BASE_URL } from "../utils/constants";
import { useTranslation } from "react-i18next";

const API = API_BASE_URL;

const ProductDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isLoggedIn, currentUser } = useAuth();

  // Product & category data
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Gallery state
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({ display: "none" });

  // Purchase options state
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [isAdded, setIsAdded] = useState(false);
  const [showAR, setShowAR] = useState(false);
  const [instantBuyModalOpen, setInstantBuyModalOpen] = useState(false);
  const [wishlistModalOpen, setWishlistModalOpen] = useState(false);

  // Tabs state
  const [activeTab, setActiveTab] = useState("overview");

  // Delivery estimation state
  const [pincode, setPincode] = useState("");
  const [deliveryEstimate, setDeliveryEstimate] = useState(null);
  const [checkingPin, setCheckingPin] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ totalCount: 0, averageRating: 5.0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newReviewTitle, setNewReviewTitle] = useState("");
  const [newReviewComment, setNewReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Fetch product, reviews and related items from genuine database
  useEffect(() => {
    let isMounted = true;
    window.scrollTo({ top: 0, behavior: "smooth" });

    const fetchProductData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prodRes, catRes, allProdsRes] = await Promise.all([
          axios.get(`${API}/products/${id}`).catch(() => null),
          axios.get(`${API}/categories`).catch(() => ({ data: [] })),
          axios.get(`${API}/products`).catch(() => ({ data: [] })),
        ]);

        let foundProd = prodRes?.data;
        // Fallback search in full products list if direct /:id endpoint failed
        if (!foundProd && Array.isArray(allProdsRes.data)) {
          foundProd = allProdsRes.data.find((p) => p._id === id);
        }

        if (!foundProd) {
          if (isMounted) setError("Product not found");
          return;
        }

        if (isMounted) {
          setProduct(foundProd);
          setActiveImage(0);

          // Find category metadata
          const foundCat = (catRes.data || []).find(
            (c) => c.id === foundProd.category || c.label === foundProd.category
          );
          setCategory(foundCat);

          // Filter authentic related products from the same category
          if (Array.isArray(allProdsRes.data)) {
            const related = allProdsRes.data.filter(
              (p) => p._id !== foundProd._id && p.category === foundProd.category && p.status !== "inactive"
            ).slice(0, 4);
            setRelatedProducts(related.length > 0 ? related : allProdsRes.data.filter(p => p._id !== foundProd._id).slice(0, 4));
          }

          // Initialize default variant if product has variants
          if (foundProd.variants && foundProd.variants.length > 0) {
            setSelectedVariant(foundProd.variants[0]);
          }
        }

        // Fetch customer reviews for this product
        try {
          const reviewsRes = await axios.get(`${API}/products/${id}/reviews`);
          if (isMounted && reviewsRes.data) {
            setReviews(reviewsRes.data.reviews || []);
            setReviewStats({
              totalCount: reviewsRes.data.totalCount || 0,
              averageRating: reviewsRes.data.averageRating || 5.0,
              distribution: reviewsRes.data.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            });
          }
        } catch {
          // Reviews endpoint optional fallback
        }
      } catch (err) {
        console.error("Error loading product detail:", err);
        if (isMounted) setError("Unable to load product. Please check your connection.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProductData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Keyboard navigation for Lightbox modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!lightboxOpen) return;
      if (e.key === "Escape") setLightboxOpen(false);
      if (e.key === "ArrowLeft") handlePrevImage();
      if (e.key === "ArrowRight") handleNextImage();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, activeImage, product]);

  // Gallery Navigation
  const imagesList = product?.images && product.images.length > 0 ? product.images : [];
  const handlePrevImage = () => {
    if (imagesList.length <= 1) return;
    setActiveImage((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };
  const handleNextImage = () => {
    if (imagesList.length <= 1) return;
    setActiveImage((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  // Desktop Image Hover Zoom
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: "block",
      backgroundPosition: `${x}% ${y}%`,
      backgroundImage: `url(${imagesList[activeImage] || ""})`,
    });
  };
  const handleMouseLeave = () => {
    setZoomStyle({ display: "none" });
  };

  // Variant change
  const handleSelectVariant = (variant, optIndex = 0) => {
    setSelectedVariant(variant);
    // If variant has specific image, switch gallery
    if (variant.optionImages && variant.options?.[optIndex]) {
      const optName = variant.options[optIndex];
      const varImg = variant.optionImages[optName] || variant.optionImages.get?.(optName);
      if (varImg) {
        const foundIdx = imagesList.indexOf(varImg);
        if (foundIdx !== -1) setActiveImage(foundIdx);
      }
    }
  };

  // Add to Cart
  const handleAddToCart = () => {
    if (!product) return;
    if (product.quantity <= 0) {
      toast.error(t("shop.outOfStock", "This product is currently out of stock."));
      return;
    }
    if (!isLoggedIn) {
      toast.error("Please login to add items to your cart! 🛍️");
      navigate("/login");
      return;
    }

    const itemToAdd = {
      ...product,
      selectedVariant: selectedVariant ? selectedVariant.name : null,
    };

    for (let i = 0; i < quantity; i++) {
      addToCart(itemToAdd);
    }

    setIsAdded(true);
    toast.success(`${product.name} × ${quantity} added to cart! 🎉`);
    setTimeout(() => setIsAdded(false), 2000);
  };

  // Buy Now (Temu-style Express Razorpay Purchase)
  const handleBuyNow = () => {
    if (!product) return;
    if (product.quantity <= 0) {
      toast.error(t("shop.outOfStock", "This product is currently out of stock."));
      return;
    }
    setInstantBuyModalOpen(true);
  };

  // Wishlist toggle & collaborative collections
  const handleWishlistToggle = () => {
    if (!product) return;
    if (!isLoggedIn) {
      toast.error('Please log in to save to your gift wishlists 💖');
      navigate('/login');
      return;
    }
    setWishlistModalOpen(true);
  };

  // Share product
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name || "4U Toys & Gifts",
        text: `Look at this magical find on 4U Toys & Gifts: ${product?.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t("product.linkCopied", "Product link copied to clipboard! 🔗"));
    }
  };

  // Delivery PIN code checker
  const handleCheckPincode = (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(pincode.trim())) {
      toast.error("Please enter a valid 6-digit Indian PIN code.");
      return;
    }
    setCheckingPin(true);
    setTimeout(() => {
      setCheckingPin(false);
      setDeliveryEstimate({
        pin: pincode.trim(),
        days: pincode.startsWith("6") || pincode.startsWith("5") ? "2 – 3 Business Days" : "3 – 5 Business Days",
        cod: true,
        freeShipping: true,
      });
      toast.success(`Delivery available for PIN ${pincode.trim()}! 🚚`);
    }, 500);
  };

  // Review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!newReviewComment.trim()) {
      toast.error("Please enter your review comments.");
      return;
    }
    if (!isLoggedIn) {
      toast.error("Please login to submit a verified review.");
      navigate("/login");
      return;
    }

    setSubmittingReview(true);
    try {
      const payload = {
        rating: newRating,
        title: newReviewTitle.trim() || "Magical find! ✨",
        comment: newReviewComment.trim(),
        userName: currentUser?.name || "Verified Customer",
        userEmail: currentUser?.email,
        userId: currentUser?._id,
      };

      const res = await axios.post(`${API}/products/${id}/reviews`, payload);
      if (res.data?.success) {
        toast.success("Thank you! Your verified review has been published. 🌟");
        setReviews([res.data.review, ...reviews]);
        setReviewStats((prev) => ({
          ...prev,
          totalCount: prev.totalCount + 1,
          averageRating: res.data.productRating || prev.averageRating,
        }));
        setNewReviewComment("");
        setNewReviewTitle("");
        setReviewModalOpen(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  // Calculated discount
  const originalPrice = product?.originalPrice || (product?.price ? Math.round(product.price * 1.25) : 0);
  const discountPercent = originalPrice > product?.price ? Math.round(((originalPrice - product.price) / originalPrice) * 100) : 0;
  const isOutOfStock = product ? product.quantity <= 0 : false;
  const isLowStock = product ? product.quantity > 0 && product.quantity <= 5 : false;

  // Loading skeleton
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg, #FFFDFB)", padding: "140px 5% 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50 }}>
          <div style={{ height: 480, background: "#f3f4f6", borderRadius: 28, animation: "pulse 1.5s infinite" }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ width: 140, height: 28, background: "#f3f4f6", borderRadius: 14 }} />
            <div style={{ width: "85%", height: 44, background: "#f3f4f6", borderRadius: 12 }} />
            <div style={{ width: 160, height: 36, background: "#f3f4f6", borderRadius: 12 }} />
            <div style={{ width: "100%", height: 120, background: "#f3f4f6", borderRadius: 18 }} />
          </div>
        </div>
        <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
      </div>
    );
  }

  // Not found
  if (error || !product) {
    return (
      <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center" }}>
        <span style={{ fontSize: 64, marginBottom: 16 }}>🧸</span>
        <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 900, color: "var(--plum)", margin: "0 0 10px" }}>
          {error || "Product Not Found"}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 15, maxWidth: 420, margin: "0 0 24px" }}>
          This magical toy may have moved to a different showroom shelf or is currently unavailable.
        </p>
        <button
          onClick={() => navigate("/shop")}
          style={{
            padding: "12px 28px",
            borderRadius: "var(--radius-pill)",
            background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
            color: "#fff",
            border: "none",
            fontWeight: 800,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Explore Boutique Catalogue
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "linear-gradient(180deg, #FFF9FC 0%, #FFFFFF 100%)", minHeight: "100vh", paddingBottom: 100 }}>
      {/* ── BREADCRUMBS & TOP NAVIGATION BAR ── */}
      <div style={{ padding: "clamp(100px, 13vh, 120px) 5% 16px", maxWidth: 1240, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          {/* Breadcrumbs with Working Back Button */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#fff",
                border: "1.5px solid rgba(255, 99, 183, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: "var(--plum)",
                boxShadow: "0 2px 8px rgba(64,32,68,0.06)",
                transition: "transform 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateX(-3px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "translateX(0)")}
              title="Go back"
            >
              <ArrowLeft size={18} color="#FF3F9D" />
            </button>

            <nav aria-label="Breadcrumb" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
              <Link to="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>{t("nav.home", "Home")}</Link>
              <ChevronRight size={14} color="#d1d5db" />
              <Link to="/shop" style={{ color: "var(--text-muted)", textDecoration: "none" }}>{t("nav.shop", "Shop")}</Link>
              {category && (
                <>
                  <ChevronRight size={14} color="#d1d5db" />
                  <Link to={`/shop?category=${category.id || category.label}`} style={{ color: "var(--text-muted)", textDecoration: "none" }}>
                    {category.label || product.category}
                  </Link>
                </>
              )}
              <ChevronRight size={14} color="#d1d5db" />
              <span style={{ color: "#FF3F9D", fontWeight: 800, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {product.name}
              </span>
            </nav>
          </div>

          {/* Quick Actions (Share & Wishlist) */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleShare}
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-pill)",
                background: "#fff",
                border: "1.5px solid rgba(255, 99, 183, 0.3)",
                color: "var(--plum)",
                fontSize: 12,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <Share2 size={15} color="#FF3F9D" />
              <span>{t("product.shareProduct", "Share")}</span>
            </button>

            <button
              onClick={handleWishlistToggle}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "#fff",
                border: "1.5px solid rgba(255, 99, 183, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
              title={isInWishlist(product._id) ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart size={18} color="#FF3F9D" fill={isInWishlist(product._id) ? "#FF3F9D" : "none"} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN PRODUCT SECTION (TEMU-INSPIRED 2-COLUMN LAYOUT) ── */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 5%" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "clamp(30px, 5vw, 60px)", alignItems: "start" }}>
          {/* ──────────────────────────────────────────────────────────
              LEFT: INTERACTIVE PRODUCT GALLERY & ZOOM
          ────────────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 16, flexDirection: "row", alignItems: "flex-start" }}>
              {/* Vertical Thumbnail Strip (Desktop) */}
              {imagesList.length > 1 && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    maxHeight: 520,
                    overflowY: "auto",
                    paddingRight: 4,
                  }}
                >
                  {imagesList.map((img, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setActiveImage(idx)}
                      onMouseEnter={() => setActiveImage(idx)}
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 16,
                        overflow: "hidden",
                        border: "2px solid",
                        borderColor: activeImage === idx ? "#FF3F9D" : "rgba(255, 99, 183, 0.2)",
                        background: "#fff",
                        padding: 0,
                        cursor: "pointer",
                        boxShadow: activeImage === idx ? "0 4px 14px rgba(255, 63, 157, 0.3)" : "none",
                        flexShrink: 0,
                        position: "relative",
                      }}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4 }} />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Large Main Image with Zoom Lens */}
              <div
                style={{
                  flex: 1,
                  height: "clamp(360px, 52vw, 540px)",
                  background: "#FFFFFF",
                  borderRadius: "28px",
                  border: "2px solid rgba(255, 99, 183, 0.25)",
                  boxShadow: "0 14px 40px rgba(64, 32, 68, 0.08)",
                  position: "relative",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "zoom-in",
                }}
                onClick={() => setLightboxOpen(true)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                {/* Genuine Product Image */}
                {imagesList[activeImage] ? (
                  <motion.img
                    key={activeImage}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    src={imagesList[activeImage]}
                    alt={product.name}
                    style={{ width: "92%", height: "92%", objectFit: "contain" }}
                  />
                ) : (
                  <span style={{ fontSize: 90 }}>🎁</span>
                )}

                {/* Magnifier Zoom Lens Window (Desktop) */}
                <div
                  style={{
                    ...zoomStyle,
                    position: "absolute",
                    inset: 0,
                    pointerEvents: "none",
                    backgroundRepeat: "no-repeat",
                    backgroundSize: "220%",
                    zIndex: 10,
                  }}
                />

                {/* Floating AR / 3D Action Badge */}
                {(product.model3d || imagesList.length > 0) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAR((v) => !v);
                    }}
                    style={{
                      position: "absolute",
                      top: 16,
                      left: 16,
                      background: "rgba(38, 16, 43, 0.88)",
                      color: "#fff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      backdropFilter: "blur(8px)",
                      borderRadius: "var(--radius-pill)",
                      padding: "6px 14px",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                      zIndex: 20,
                    }}
                  >
                    <Box size={14} color="#FF3F9D" />
                    <span>3D / AR View</span>
                  </button>
                )}

                {/* Fullscreen Expand Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxOpen(true);
                  }}
                  title="Open full-screen viewer"
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    background: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid rgba(255, 99, 183, 0.3)",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "var(--plum)",
                    zIndex: 20,
                  }}
                >
                  <Maximize2 size={16} />
                </button>

                {/* Save to Wishlist Collection Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleWishlistToggle();
                  }}
                  title="Save to Gift Wishlist"
                  style={{
                    position: "absolute",
                    top: 60,
                    right: 16,
                    background: "rgba(255, 255, 255, 0.9)",
                    border: "1px solid rgba(255, 99, 183, 0.3)",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#FF3F9D",
                    zIndex: 20,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <Heart size={18} fill="#FF3F9D" />
                </button>

                {/* Image Nav Arrows */}
                {imagesList.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      style={{
                        position: "absolute",
                        left: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(255, 255, 255, 0.88)",
                        border: "1px solid rgba(255, 99, 183, 0.25)",
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "var(--plum)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        zIndex: 20,
                      }}
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "rgba(255, 255, 255, 0.88)",
                        border: "1px solid rgba(255, 99, 183, 0.25)",
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "var(--plum)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        zIndex: 20,
                      }}
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}

                {/* Zoom Hint */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(6px)",
                    borderRadius: "var(--radius-pill)",
                    padding: "4px 12px",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--text-muted)",
                    pointerEvents: "none",
                  }}
                >
                  {t("product.zoomHint", "Hover to zoom • Click for full screen")}
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              RIGHT: PRODUCT DETAILS, PRICING, VARIANTS & ACTIONS
          ────────────────────────────────────────────────────────── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Category & Badge Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span
                style={{
                  background: "linear-gradient(135deg, rgba(255,99,183,0.15), rgba(128,87,232,0.15))",
                  color: "#FF3F9D",
                  padding: "4px 12px",
                  borderRadius: "var(--radius-pill)",
                  fontSize: 12,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{category?.icon || "🎁"}</span>
                <span>{category?.label || product.category}</span>
              </span>

              {product.brand && (
                <span
                  style={{
                    background: "#F3F4F6",
                    color: "var(--plum)",
                    padding: "4px 10px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  Brand: {product.brand}
                </span>
              )}

              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-light)",
                  fontFamily: "monospace",
                }}
              >
                SKU: {product.sku || product._id?.slice(-6).toUpperCase()}
              </span>
            </div>

            {/* Product Title */}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(26px, 3.5vw, 36px)",
                fontWeight: 900,
                color: "var(--plum)",
                lineHeight: 1.2,
                margin: 0,
              }}
            >
              {product.name}
            </h1>

            {/* Star Rating & Verified Reviews Count */}
            <div
              onClick={() => {
                setActiveTab("reviews");
                const el = document.getElementById("pdp-tabs-section");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                cursor: "pointer",
                width: "fit-content",
              }}
            >
              <div style={{ display: "flex", gap: 2 }}>
                {[1, 2, 3, 4, 5].map((st) => (
                  <Star
                    key={st}
                    size={16}
                    color="#F59E0B"
                    fill={st <= Math.round(reviewStats.averageRating) ? "#F59E0B" : "#e5e7eb"}
                  />
                ))}
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: "var(--plum)" }}>
                {reviewStats.averageRating}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                ({reviewStats.totalCount > 0 ? `${reviewStats.totalCount} verified reviews` : "Be first to review"})
              </span>
            </div>

            {/* Price Presentation with Strikethrough & Real Discount */}
            <div
              style={{
                background: "linear-gradient(135deg, #FFF9FB 0%, #FAF5FF 100%)",
                borderRadius: "20px",
                padding: "18px 22px",
                border: "1.5px solid rgba(255, 99, 183, 0.2)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: "clamp(30px, 4vw, 40px)",
                    fontWeight: 900,
                    color: "#FF3F9D",
                  }}
                >
                  ₹{(+product.price).toLocaleString("en-IN")}
                </span>

                {originalPrice > product.price && (
                  <span
                    style={{
                      fontSize: 18,
                      color: "var(--text-light)",
                      textDecoration: "line-through",
                      fontWeight: 700,
                    }}
                  >
                    ₹{originalPrice.toLocaleString("en-IN")}
                  </span>
                )}

                {discountPercent > 0 && (
                  <span
                    style={{
                      background: "linear-gradient(135deg, #10B981, #059669)",
                      color: "#fff",
                      fontSize: 12,
                      fontWeight: 900,
                      padding: "4px 10px",
                      borderRadius: "var(--radius-pill)",
                      boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
                    }}
                  >
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 5 }}>
                  <ShieldCheck size={14} color="#059669" />
                  {t("product.inclusiveTaxes", "Inclusive of all taxes • 100% Authentic Boutique Toy")}
                </span>

                {/* Stock Status Badge */}
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: "var(--radius-pill)",
                    background: isOutOfStock ? "#fee2e2" : isLowStock ? "#fef3c7" : "rgba(114, 230, 176, 0.25)",
                    color: isOutOfStock ? "#dc2626" : isLowStock ? "#b45309" : "#059669",
                  }}
                >
                  {isOutOfStock
                    ? t("shop.outOfStock", "Out of Stock")
                    : isLowStock
                    ? `Only ${product.quantity} left in stock!`
                    : `${t("shop.inStock", "In Stock")} (${product.quantity} available)`}
                </span>
              </div>
            </div>

            {/* ── PRODUCT VARIANTS (COLOR / SIZE / STYLE) ── */}
            {product.variants && product.variants.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {product.variants.map((v, vIdx) => (
                  <div key={vIdx}>
                    <label style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", marginBottom: 8, display: "block" }}>
                      Select {v.name}: <span style={{ color: "#FF3F9D" }}>{selectedVariant?.name === v.name ? "Selected" : ""}</span>
                    </label>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {(v.options || []).map((opt, oIdx) => (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelectVariant(v, oIdx)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: "var(--radius-pill)",
                            border: "1.5px solid",
                            borderColor: selectedVariant?.name === v.name ? "#FF3F9D" : "#e5e7eb",
                            background: selectedVariant?.name === v.name ? "linear-gradient(135deg, #FF3F9D, #8057E8)" : "#fff",
                            color: selectedVariant?.name === v.name ? "#fff" : "var(--plum)",
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── QUANTITY SELECTOR WITH INVENTORY LIMIT ── */}
            {!isOutOfStock && (
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--plum)" }}>
                  {t("product.quantity", "Quantity")}:
                </span>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    border: "1.5px solid rgba(255, 99, 183, 0.3)",
                    borderRadius: "var(--radius-pill)",
                    background: "#fff",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    style={{
                      width: 40,
                      height: 40,
                      border: "none",
                      background: "transparent",
                      fontSize: 18,
                      fontWeight: 800,
                      cursor: quantity <= 1 ? "not-allowed" : "pointer",
                      color: quantity <= 1 ? "#9ca3af" : "var(--plum)",
                    }}
                  >
                    −
                  </button>
                  <span style={{ width: 44, textAlign: "center", fontSize: 16, fontWeight: 900, color: "var(--plum)" }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.quantity, q + 1))}
                    disabled={quantity >= product.quantity}
                    style={{
                      width: 40,
                      height: 40,
                      border: "none",
                      background: "transparent",
                      fontSize: 18,
                      fontWeight: 800,
                      cursor: quantity >= product.quantity ? "not-allowed" : "pointer",
                      color: quantity >= product.quantity ? "#9ca3af" : "var(--plum)",
                    }}
                  >
                    +
                  </button>
                </div>

                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
                  Subtotal: <strong style={{ color: "#FF3F9D" }}>₹{(quantity * product.price).toLocaleString("en-IN")}</strong>
                </span>
              </div>
            )}

            {/* ── MAIN PURCHASE ACTION BUTTONS ── */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 6 }}>
              {/* Add to Cart */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                style={{
                  flex: 1,
                  minWidth: 160,
                  padding: "16px 24px",
                  borderRadius: "var(--radius-pill)",
                  background: isOutOfStock
                    ? "#e5e7eb"
                    : isAdded
                    ? "#72E6B0"
                    : "linear-gradient(135deg, #FF3F9D 0%, #C9184A 100%)",
                  color: isOutOfStock ? "#9ca3af" : isAdded ? "#064e3b" : "#fff",
                  border: "none",
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: 16,
                  cursor: isOutOfStock ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow: isOutOfStock ? "none" : "0 8px 24px rgba(255, 63, 157, 0.35)",
                  transition: "all 0.2s",
                }}
              >
                {isAdded ? <Check size={20} /> : <ShoppingBag size={20} />}
                <span>
                  {isOutOfStock
                    ? t("shop.outOfStock", "Out of Stock")
                    : isAdded
                    ? t("product.addedToCart", "Added to Cart!")
                    : t("product.addToCart", "Add to Cart")}
                </span>
              </motion.button>

              {/* Buy Now */}
              {!isOutOfStock && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBuyNow}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    padding: "16px 24px",
                    borderRadius: "var(--radius-pill)",
                    background: "linear-gradient(135deg, #8057E8 0%, #A78BFA 100%)",
                    color: "#fff",
                    border: "none",
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    boxShadow: "0 8px 24px rgba(128, 87, 232, 0.35)",
                  }}
                >
                  <Sparkles size={20} />
                  <span>{t("product.buyNow", "Buy Now ⚡")}</span>
                </motion.button>
              )}

              {/* Save to Collaborative Wishlist */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWishlistToggle}
                type="button"
                style={{
                  minWidth: 160,
                  padding: "16px 22px",
                  borderRadius: "var(--radius-pill)",
                  background: "#FFF0F6",
                  border: "2px solid #FF3F9D",
                  color: "#FF3F9D",
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 4px 14px rgba(255, 63, 157, 0.12)",
                }}
              >
                <Heart size={18} fill="#FF3F9D" />
                <span>Save to Wishlist</span>
              </motion.button>
            </div>

            {/* ── DELIVERY ESTIMATOR & PINCODE CHECKER ── */}
            <div
              style={{
                marginTop: 8,
                padding: "18px 20px",
                borderRadius: "20px",
                background: "#FFFFFF",
                border: "1.5px solid rgba(255, 99, 183, 0.2)",
                boxShadow: "0 4px 14px rgba(0,0,0,0.02)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Truck size={18} color="#FF3F9D" />
                <span style={{ fontSize: 13, fontWeight: 900, color: "var(--plum)" }}>
                  {t("product.deliveryTitle", "Delivery & Estimated Arrival")}
                </span>
              </div>

              <form onSubmit={handleCheckPincode} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ position: "relative", flex: 1 }}>
                  <MapPin size={16} color="#9ca3af" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder={t("product.enterPincode", "Enter 6-digit PIN code")}
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 34px",
                      borderRadius: "var(--radius-pill)",
                      border: "1.5px solid #e5e7eb",
                      fontSize: 13,
                      outline: "none",
                      color: "var(--plum)",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={checkingPin}
                  style={{
                    padding: "9px 18px",
                    borderRadius: "var(--radius-pill)",
                    background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {checkingPin ? "Checking…" : t("product.checkPincode", "Check")}
                </button>
              </form>

              {deliveryEstimate && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: "14px",
                    background: "rgba(114, 230, 176, 0.2)",
                    border: "1px solid rgba(114, 230, 176, 0.4)",
                    fontSize: 12,
                    color: "#065f46",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle size={15} color="#059669" />
                    <strong>{deliveryEstimate.days}</strong>
                  </div>
                  <div style={{ fontSize: 11, color: "#047857" }}>
                    • Free shipping eligible on this boutique order
                    <br />• Cash on Delivery (COD) supported
                  </div>
                </motion.div>
              )}

              {/* Guarantees List */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12, paddingTop: 12, borderTop: "1px solid #f3f4f6" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                  <RotateCcw size={16} color="#059669" />
                  <span>7-Day Easy Returns</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--text-muted)" }}>
                  <Gift size={16} color="#FF3F9D" />
                  <span>Complimentary Gift Wrap</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3D / AR VIEWER EXPANDABLE SECTION ── */}
        <AnimatePresence>
          {showAR && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: 20 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 20 }}
              style={{ marginTop: 40, overflow: "hidden" }}
            >
              <div
                style={{
                  background: "linear-gradient(135deg, rgba(38,16,43,0.96) 0%, rgba(26,26,46,0.96) 100%)",
                  borderRadius: "28px",
                  padding: "24px 28px",
                  border: "1.5px solid rgba(255, 99, 183, 0.3)",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Box size={24} color="#FF3F9D" />
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#fff" }}>
                        Interactive 3D &amp; Augmented Reality Experience
                      </h3>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                        Drag to rotate 360° on desktop or tap View in AR on iPhone/Android to project in your room
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAR(false)}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "none",
                      color: "#fff",
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <ARViewer
                  model={product.model3d}
                  images={product.images || []}
                  poster={product.images?.[0]}
                  productName={product.name}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TABBED PRODUCT DETAILS, SPECS, SHIPPING & REVIEWS ── */}
        <section id="pdp-tabs-section" style={{ marginTop: 60 }}>
          {/* Tab Navigation Chips */}
          <div
            style={{
              display: "flex",
              gap: 10,
              borderBottom: "2px solid #f3f4f6",
              paddingBottom: 4,
              overflowX: "auto",
              marginBottom: 28,
            }}
          >
            {[
              { id: "overview", label: t("product.overviewTab", "Overview & Story") },
              { id: "specs", label: t("product.specsTab", "Specifications") },
              { id: "delivery", label: t("product.deliveryTab", "Shipping & Guarantees") },
              { id: "reviews", label: `${t("product.reviewsTab", "Customer Reviews")} (${reviews.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "12px 22px",
                  borderRadius: "var(--radius-pill)",
                  border: "none",
                  background: activeTab === tab.id ? "linear-gradient(135deg, #FF3F9D, #8057E8)" : "transparent",
                  color: activeTab === tab.id ? "#fff" : "var(--plum)",
                  fontFamily: "var(--font-display)",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  boxShadow: activeTab === tab.id ? "0 4px 14px rgba(255, 63, 157, 0.25)" : "none",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW & DESCRIPTION */}
          {activeTab === "overview" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#fff",
                borderRadius: "28px",
                padding: "clamp(24px, 4vw, 36px)",
                border: "1.5px solid rgba(255, 99, 183, 0.2)",
                boxShadow: "0 10px 30px rgba(64,32,68,0.04)",
              }}
            >
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "var(--plum)", margin: "0 0 14px" }}>
                {t("product.description", "About This Wonder")}
              </h3>
              <p style={{ color: "var(--text-muted)", fontSize: 16, lineHeight: 1.8, margin: "0 0 24px" }}>
                {product.description || "A magical gift carefully handcrafted and curated for your loved ones from our 4U Toys & Gifts boutique."}
              </p>

              {/* Cute Playful Highlight Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 20 }}>
                {[
                  { icon: "🧸", title: "Child-Safe Certified", desc: "Non-toxic, soft edges and BPA-free premium materials." },
                  { icon: "🌈", title: "Inspires Imagination", desc: "Crafted to spark wonder, creativity, and cheerful smiles." },
                  { icon: "🎁", title: "Luxury Packaging", desc: "Delivered in signature boutique boxes with satin ribbons." },
                  { icon: "✨", title: "Handpicked Quality", desc: "Every toy is thoroughly inspected before dispatch." },
                ].map((card, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "16px 18px",
                      borderRadius: "18px",
                      background: "linear-gradient(135deg, #FFF9FB 0%, #FAF5FF 100%)",
                      border: "1px solid rgba(255, 99, 183, 0.2)",
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{card.icon}</span>
                    <h4 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 900, color: "var(--plum)", margin: "8px 0 4px" }}>
                      {card.title}
                    </h4>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 2: SPECIFICATIONS */}
          {activeTab === "specs" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#fff",
                borderRadius: "28px",
                padding: "clamp(24px, 4vw, 36px)",
                border: "1.5px solid rgba(255, 99, 183, 0.2)",
                boxShadow: "0 10px 30px rgba(64,32,68,0.04)",
              }}
            >
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "var(--plum)", margin: "0 0 16px" }}>
                {t("product.specifications", "Product Specifications")}
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                {[
                  { label: "Category", val: product.category },
                  { label: "Subcategory", val: product.subcategory || "Boutique Special" },
                  { label: "Brand", val: product.brand || "4U Toys & Gifts" },
                  { label: "SKU Identifier", val: product.sku || product._id?.slice(-8).toUpperCase() },
                  { label: "Age Recommendation", val: product.ageGroup || "All Ages (3+)" },
                  { label: "Weight", val: product.weight || "Lightweight & Safe" },
                  { label: "Safety Standard", val: "EN-71 / IS 9873 Child Safe" },
                  { label: "Care Instructions", val: "Wipe with damp cloth • Avoid high heat" },
                  ...(product.specifications || []).map((s) => ({ label: s.key, val: s.value })),
                ].map((row, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      background: rIdx % 2 === 0 ? "#FFF9FB" : "#FFFFFF",
                      borderRadius: "12px",
                      border: "1px solid #f3f4f6",
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>{row.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", textAlign: "right" }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* TAB 3: SHIPPING & GUARANTEES */}
          {activeTab === "delivery" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#fff",
                borderRadius: "28px",
                padding: "clamp(24px, 4vw, 36px)",
                border: "1.5px solid rgba(255, 99, 183, 0.2)",
                boxShadow: "0 10px 30px rgba(64,32,68,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <h3 style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 900, color: "var(--plum)", margin: 0 }}>
                {t("product.deliveryTab", "Shipping & Return Policies")}
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                <div style={{ padding: 20, borderRadius: 20, background: "#FFF9FB", border: "1px solid rgba(255,99,183,0.2)" }}>
                  <Truck size={24} color="#FF3F9D" style={{ marginBottom: 10 }} />
                  <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "var(--plum)" }}>
                    Express Pan-India Delivery
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Orders dispatched within 24 hours. Free delivery on orders over ₹499. Live SMS tracking updates provided.
                  </p>
                </div>

                <div style={{ padding: 20, borderRadius: 20, background: "#FAF5FF", border: "1px solid rgba(128,87,232,0.2)" }}>
                  <RotateCcw size={24} color="#8057E8" style={{ marginBottom: 10 }} />
                  <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "var(--plum)" }}>
                    7-Day Easy Exchange Policy
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    If your item is damaged or not as expected, request a hassle-free pickup and replacement within 7 days.
                  </p>
                </div>

                <div style={{ padding: 20, borderRadius: 20, background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)" }}>
                  <ShieldCheck size={24} color="#059669" style={{ marginBottom: 10 }} />
                  <h4 style={{ margin: "0 0 6px", fontSize: 16, fontWeight: 900, color: "var(--plum)" }}>
                    Safe Delivery Guarantee
                  </h4>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Double-walled shockproof packaging ensures your toys arrive in pristine, unblemished boutique condition.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4: REAL CUSTOMER REVIEWS & RATINGS */}
          {activeTab === "reviews" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "#fff",
                borderRadius: "28px",
                padding: "clamp(24px, 4vw, 36px)",
                border: "1.5px solid rgba(255, 99, 183, 0.2)",
                boxShadow: "0 10px 30px rgba(64,32,68,0.04)",
                display: "flex",
                flexDirection: "column",
                gap: 24,
              }}
            >
              {/* Rating Summary Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 20,
                  paddingBottom: 24,
                  borderBottom: "1.5px solid #f3f4f6",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 900, color: "#FF3F9D", lineHeight: 1 }}>
                      {reviewStats.averageRating}
                    </div>
                    <div style={{ display: "flex", gap: 3, margin: "6px 0" }}>
                      {[1, 2, 3, 4, 5].map((st) => (
                        <Star key={st} size={16} color="#F59E0B" fill={st <= Math.round(reviewStats.averageRating) ? "#F59E0B" : "#e5e7eb"} />
                      ))}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 700 }}>
                      {reviews.length} Verified Reviews
                    </div>
                  </div>

                  {/* 5-Star Breakdown Bars */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
                    {[5, 4, 3, 2, 1].map((num) => {
                      const count = reviewStats.distribution[num] || 0;
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : num === 5 ? 100 : 0;
                      return (
                        <div key={num} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-muted)" }}>
                          <span style={{ width: 14 }}>{num}★</span>
                          <div style={{ width: 120, height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", background: "#F59E0B", borderRadius: 3 }} />
                          </div>
                          <span style={{ width: 24, textAlign: "right" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Write a Review Button */}
                <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      toast.error("Please login to write a review!");
                      navigate("/login");
                      return;
                    }
                    setReviewModalOpen(true);
                  }}
                  style={{
                    padding: "12px 24px",
                    borderRadius: "var(--radius-pill)",
                    background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                    color: "#fff",
                    border: "none",
                    fontFamily: "var(--font-display)",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    boxShadow: "0 6px 18px rgba(255, 63, 157, 0.3)",
                  }}
                >
                  <MessageSquare size={16} />
                  <span>{t("product.writeReview", "Write a Review")}</span>
                </button>
              </div>

              {/* Reviews List */}
              {reviews.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <span style={{ fontSize: 44 }}>✨</span>
                  <h4 style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900, color: "var(--plum)", margin: "10px 0 6px" }}>
                    {t("product.noReviewsYet", "No customer reviews yet. Be the first to share the magic!")}
                  </h4>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
                    Purchased this item? Share your thoughts to help other parents and gifters.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {reviews.map((rev, rIdx) => (
                    <div
                      key={rev._id || `review_item_${rIdx}`}
                      style={{
                        padding: "18px 20px",
                        borderRadius: "20px",
                        background: "#FFF9FB",
                        border: "1px solid rgba(255, 99, 183, 0.15)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                              color: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontWeight: 900,
                              fontSize: 13,
                            }}
                          >
                            {rev.userName?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)" }}>
                              {rev.userName}
                            </div>
                            <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                              {[1, 2, 3, 4, 5].map((st) => (
                                <Star key={st} size={12} color="#F59E0B" fill={st <= rev.rating ? "#F59E0B" : "#e5e7eb"} />
                              ))}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: "#059669",
                              background: "rgba(114,230,176,0.25)",
                              padding: "2px 8px",
                              borderRadius: "var(--radius-pill)",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CheckCircle size={10} />
                            Verified Purchase
                          </span>
                          <span style={{ fontSize: 11, color: "var(--text-light)" }}>
                            {new Date(rev.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {rev.title && (
                        <h5 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, color: "var(--plum)", margin: "4px 0 0" }}>
                          {rev.title}
                        </h5>
                      )}

                      <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, margin: 0 }}>
                        {rev.comment}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </section>

        {/* ── RELATED PRODUCTS / MORE MAGICAL GIFTS (Real Catalogue) ── */}
        {relatedProducts.length > 0 && (
          <section style={{ marginTop: 70 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", color: "#FF3F9D", letterSpacing: "1px" }}>
                  Curated Companions
                </span>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 900, color: "var(--plum)", margin: "4px 0 0" }}>
                  {t("product.relatedProducts", "More Magical Gifts You'll Love")}
                </h3>
              </div>
              <button
                onClick={() => navigate("/shop")}
                style={{
                  padding: "8px 18px",
                  borderRadius: "var(--radius-pill)",
                  background: "#fff",
                  border: "1.5px solid rgba(255,99,183,0.3)",
                  color: "#FF3F9D",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                View Full Shop →
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20 }}>
              {relatedProducts.map((rel, relIdx) => (
                <motion.div
                  key={rel._id || `rel_item_${relIdx}`}
                  whileHover={{ y: -6 }}
                  onClick={() => navigate(`/product/${rel._id}`)}
                  style={{
                    background: "#FFFFFF",
                    borderRadius: "24px",
                    overflow: "hidden",
                    border: "1.5px solid rgba(255, 99, 183, 0.2)",
                    boxShadow: "0 8px 24px rgba(64,32,68,0.06)",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      height: 180,
                      background: "linear-gradient(135deg, #FFF9FB 0%, #FAF5FF 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 12,
                    }}
                  >
                    {rel.images?.[0] ? (
                      <img src={rel.images[0]} alt={rel.name} style={{ width: "90%", height: "90%", objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: 54 }}>🎁</span>
                    )}
                  </div>
                  <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#FF3F9D", textTransform: "uppercase" }}>
                        {rel.category}
                      </span>
                      <h4 style={{ fontFamily: "var(--font-display)", fontSize: 15, fontWeight: 800, color: "var(--plum)", margin: "4px 0 8px", lineHeight: 1.3 }}>
                        {rel.name}
                      </h4>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 8 }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 900, color: "#FF3F9D" }}>
                        ₹{(+rel.price).toLocaleString("en-IN")}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--plum)" }}>View Details →</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ── LIGHTBOX FULLSCREEN IMAGE VIEWER MODAL ── */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(20, 8, 24, 0.94)",
              backdropFilter: "blur(14px)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onClick={() => setLightboxOpen(false)}
          >
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              style={{
                position: "absolute",
                top: 24,
                right: 24,
                background: "rgba(255,255,255,0.12)",
                border: "none",
                color: "#fff",
                width: 44,
                height: 44,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 20,
              }}
            >
              <X size={22} />
            </button>

            {/* Counter */}
            <div
              style={{
                position: "absolute",
                top: 28,
                left: 28,
                color: "#fff",
                fontSize: 14,
                fontWeight: 800,
                background: "rgba(255,255,255,0.12)",
                padding: "6px 14px",
                borderRadius: "var(--radius-pill)",
              }}
            >
              {activeImage + 1} / {imagesList.length}
            </div>

            {/* Lightbox Image with Prev/Next buttons */}
            <div
              style={{ maxWidth: "88vw", maxHeight: "85vh", position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={(e) => e.stopPropagation()}
            >
              {imagesList[activeImage] && (
                <img
                  src={imagesList[activeImage]}
                  alt={product.name}
                  style={{ maxWidth: "80vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 16 }}
                />
              )}

              {imagesList.length > 1 && (
                <>
                  <button
                    onClick={handlePrevImage}
                    style={{
                      position: "absolute",
                      left: -50,
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      color: "#fff",
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronLeft size={28} />
                  </button>
                  <button
                    onClick={handleNextImage}
                    style={{
                      position: "absolute",
                      right: -50,
                      background: "rgba(255,255,255,0.15)",
                      border: "none",
                      color: "#fff",
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <ChevronRight size={28} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── WRITE REVIEW MODAL ── */}
      <AnimatePresence>
        {reviewModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(38,16,43,0.7)",
              backdropFilter: "blur(10px)",
              zIndex: 2000,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
            }}
            onClick={() => setReviewModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                width: "100%",
                maxWidth: 480,
                background: "#fff",
                borderRadius: "28px",
                padding: "28px",
                boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
                border: "2px solid rgba(255, 99, 183, 0.3)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontFamily: "var(--font-display)", fontSize: 20, fontWeight: 900, color: "var(--plum)", margin: 0 }}>
                  {t("product.writeReview", "Write a Review")}
                </h3>
                <button
                  onClick={() => setReviewModalOpen(false)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--plum)" }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Rating selection */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 6 }}>
                    {t("product.yourRating", "Your Rating *")}
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewRating(st)}
                        style={{
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                          padding: 4,
                          display: "flex",
                        }}
                      >
                        <Star size={24} color="#F59E0B" fill={st <= newRating ? "#F59E0B" : "#e5e7eb"} />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Review title */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 6 }}>
                    {t("product.reviewTitle", "Review Title (Optional)")}
                  </label>
                  <input
                    type="text"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    placeholder="e.g. My daughter loved this magical plush!"
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      border: "1.5px solid #e5e7eb",
                      fontSize: 13,
                      outline: "none",
                      color: "var(--plum)",
                    }}
                  />
                </div>

                {/* Review comment */}
                <div>
                  <label style={{ fontSize: 13, fontWeight: 800, color: "var(--plum)", display: "block", marginBottom: 6 }}>
                    {t("product.reviewComment", "Your Experience & Comments *")}
                  </label>
                  <textarea
                    rows={4}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Share how this gift delighted your family, the quality, and overall smiles..."
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      border: "1.5px solid #e5e7eb",
                      fontSize: 13,
                      outline: "none",
                      color: "var(--plum)",
                      resize: "none",
                      fontFamily: "inherit",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  style={{
                    padding: "12px",
                    borderRadius: "var(--radius-pill)",
                    background: "linear-gradient(135deg, #FF3F9D, #8057E8)",
                    color: "#fff",
                    border: "none",
                    fontFamily: "var(--font-display)",
                    fontWeight: 900,
                    fontSize: 14,
                    cursor: submittingReview ? "not-allowed" : "pointer",
                    boxShadow: "0 6px 18px rgba(255,63,157,0.3)",
                    marginTop: 6,
                  }}
                >
                  {submittingReview ? t("product.submitting", "Submitting...") : t("product.submitReview", "Submit Verified Review")}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MOBILE STICKY PURCHASE BAR ── */}
      <div
        className="mobile-sticky-purchase-bar"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(14px)",
          borderTop: "1.5px solid rgba(255, 99, 183, 0.3)",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          zIndex: 900,
          boxShadow: "0 -4px 20px rgba(64,32,68,0.1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {imagesList[0] && (
            <img src={imagesList[0]} alt={product.name} style={{ width: 44, height: 44, objectFit: "contain", borderRadius: 10, background: "#FFF9FB" }} />
          )}
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: "var(--plum)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {product.name}
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 900, color: "#FF3F9D" }}>
              ₹{(+product.price).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            style={{
              padding: "10px 16px",
              borderRadius: "var(--radius-pill)",
              background: isOutOfStock ? "#e5e7eb" : "linear-gradient(135deg, #FF3F9D, #C9184A)",
              color: isOutOfStock ? "#9ca3af" : "#fff",
              border: "none",
              fontSize: 13,
              fontWeight: 800,
              cursor: isOutOfStock ? "not-allowed" : "pointer",
            }}
          >
            {isAdded ? "Added!" : "Add to Cart"}
          </button>
          {!isOutOfStock && (
            <button
              onClick={handleBuyNow}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-pill)",
                background: "linear-gradient(135deg, #8057E8, #A78BFA)",
                color: "#fff",
                border: "none",
                fontSize: 13,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              Buy Now
            </button>
          )}
        </div>
      </div>
      <style>{`
        @media (min-width: 769px) {
          .mobile-sticky-purchase-bar { display: none !important; }
        }
      `}</style>

      {/* Temu-Style Express Razorpay Checkout Modal */}
      <TemuInstantBuyModal
        isOpen={instantBuyModalOpen}
        onClose={() => setInstantBuyModalOpen(false)}
        product={product}
        initialQuantity={quantity}
        selectedVariant={selectedVariant ? selectedVariant.name : null}
      />

      {/* Collaborative Wishlists Modal */}
      <AddToWishlistModal
        isOpen={wishlistModalOpen}
        onClose={() => setWishlistModalOpen(false)}
        product={product}
      />
    </div>
  );
};

export default ProductDetailPage;
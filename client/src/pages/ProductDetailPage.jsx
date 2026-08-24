import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "lucide-react";
import toast from "react-hot-toast";

import ARViewer from "../components/product/ARViewer";
import { API_BASE_URL } from "../utils/constants";

const API = API_BASE_URL;

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isLoggedIn } = useAuth();

  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [showAR, setShowAR] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/categories`),
        ]);

        const foundProd = prodRes.data.find((p) => p._id === id);

        if (foundProd) {
          setProduct(foundProd);

          const foundCat = catRes.data.find(
            (c) =>
              c.id === foundProd.category ||
              c.label === foundProd.category
          );

          setCategory(foundCat);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAdd = () => {
    if (!isLoggedIn) {
      toast.error("Please login to add items to cart! 🛍️", {
        style: {
          borderRadius: "20px",
          background: "var(--card-bg, #fff)",
          color: "var(--text, #333)",
          boxShadow: "0 10px 25px rgba(255, 77, 109, 0.2)",
        },
      });
      navigate("/login");
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }

    setIsAdded(true);

    toast.success(
      `${product.name} × ${quantity} added to cart!`
    );

    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!isLoggedIn) {
      toast.error("Please login to buy items! ⚡", {
        style: {
          borderRadius: "20px",
          background: "var(--card-bg, #fff)",
          color: "var(--text, #333)",
          boxShadow: "0 10px 25px rgba(255, 77, 109, 0.2)",
        },
      });
      navigate("/login");
      return;
    }

    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }

    navigate("/checkout");
  };

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          fontWeight: "700",
        }}
      >
        Loading magic...
      </div>
    );

  if (!product)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "20px",
          fontWeight: "700",
        }}
      >
        Product not found.
      </div>
    );

  return (
    <div
      style={{
        background: "var(--bg)",
        minHeight: "100vh",
        paddingBottom: "100px",
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .pdp-grid { grid-template-columns: 1fr !important; gap: 30px !important; }
          .pdp-img  { height: 320px !important; border-radius: 20px !important; }
          .pdp-title { font-size: 28px !important; }
          .pdp-price { font-size: 26px !important; }
          .pdp-actions { flex-direction: column !important; }
          .pdp-sticky { position: relative !important; top: 0 !important; }
          .pdp-thumbs { flex-direction: row !important; overflow-x: auto !important; scrollbar-width: none; }
          .pdp-thumbs img, .pdp-thumbs div { width: 64px !important; height: 64px !important; flex-shrink: 0; }
        }
        @media (max-width: 480px) {
          .pdp-title { font-size: 22px !important; }
          .pdp-price { font-size: 22px !important; }
          .pdp-desc  { font-size: 15px !important; }
        }
      `}</style>
      {/* TOP NAV */}
      <div
        style={{
          padding: "120px 5% 30px",
          display: "flex",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "var(--card-bg)",
            border: "1px solid var(--border)",
            borderRadius: "50%",
            width: "45px",
            height: "45px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "var(--text)",
          }}
        >
          <ArrowLeft size={20} />
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div
        className="pdp-grid"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 5%",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "60px",
          alignItems: "start",
        }}
      >
        {/* LEFT SIDE */}
        <div
          className="pdp-sticky"
          style={{
            position: "sticky",
            top: "120px",
            display: "flex",
            gap: "20px",
          }}
        >
          {/* THUMBNAILS */}
          {product.images?.length > 1 && (
            <div
              className="pdp-thumbs"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "15px",
              }}
            >
              {product.images.map((img, i) => (
                <motion.div
                  key={i}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setActiveImage(i)}
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "16px",
                    overflow: "hidden",
                    cursor: "pointer",
                    border:
                      activeImage === i
                        ? "2px solid var(--primary)"
                        : "2px solid transparent",
                    opacity: activeImage === i ? 1 : 0.6,
                  }}
                >
                  <img
                    src={img}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}

          {/* MAIN IMAGE */}
          <motion.div
            layoutId={`product-image-${product._id}`}
            className="pdp-img"
            style={{
              flex: 1,
              background: "var(--secondary)",
              borderRadius: "30px",
              overflow: "hidden",
              height: "600px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={activeImage}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={product.images?.[activeImage]}
                alt={product.name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </AnimatePresence>

            {!product.images?.[0] && (
              <div style={{ fontSize: "100px" }}>
                {category?.icon || "🎁"}
              </div>
            )}
          </motion.div>
        </div>

        {/* RIGHT SIDE */}
        <div style={{ padding: "20px 0" }}>
          {/* CATEGORY */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--secondary)",
              color: "var(--primary)",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "14px",
              fontWeight: 700,
              marginBottom: "20px",
            }}
          >
            {category?.icon}{" "}
            {category?.label || product.category}
          </div>

          {/* PRODUCT NAME */}
          <h1
            className="pdp-title"
            style={{
              fontSize: "48px",
              fontWeight: 800,
              color: "var(--text)",
              margin: "0 0 20px",
              lineHeight: 1.1,
            }}
          >
            {product.name}
          </h1>

          {/* PRICE */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "30px",
            }}
          >
            <div
              className="pdp-price"
              style={{
                fontSize: "36px",
                fontWeight: 900,
                color: "var(--primary)",
              }}
            >
              ₹{(+product.price).toLocaleString()}
            </div>

            {product.status === "low_stock" && (
              <span
                style={{
                  color: "#e63946",
                  fontWeight: 600,
                  background: "#ffebee",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              >
                Low Stock
              </span>
            )}
          </div>

          {/* DESCRIPTION */}
          <p
            className="pdp-desc"
            style={{
              fontSize: "18px",
              color: "var(--text-muted)",
              lineHeight: 1.8,
              marginBottom: "40px",
            }}
          >
            {product.description ||
              "A magical gift carefully curated for your loved ones."}
          </p>

          {/* FEATURES */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              marginBottom: "40px",
              background: "var(--card-bg)",
              padding: "24px",
              borderRadius: "20px",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <ShieldCheck color="var(--primary)" />
              <span style={{ fontWeight: 600 }}>
                Premium Quality Assured
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <Truck color="var(--primary)" />
              <span style={{ fontWeight: 600 }}>
                Fast & Safe Delivery
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
              }}
            >
              <Star color="var(--primary)" />
              <span style={{ fontWeight: 600 }}>
                Loved by Parents & Kids
              </span>
            </div>
          </div>

          {/* AR CTA BUTTON — shown inline on right panel */}
          {(product.model3d || product.images?.[0]) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowAR(v => !v)}
              style={{
                width: "100%",
                marginBottom: "20px",
                padding: "18px 24px",
                borderRadius: "20px",
                fontSize: "17px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.1)",
                cursor: "pointer",
                boxShadow: "0 8px 32px rgba(26,26,46,0.35)",
                letterSpacing: "0.3px",
              }}
            >
              <Box size={22} />
              {showAR ? "Hide 3D / AR Viewer" : "View Product in 3D / AR"}
              <span style={{
                marginLeft: 4,
                background: "linear-gradient(135deg,#ff4d6d,#c9184a)",
                fontSize: "11px",
                fontWeight: 700,
                padding: "3px 9px",
                borderRadius: "12px",
                letterSpacing: "0.5px",
              }}>AR</span>
            </motion.button>
          )}

          {/* QUANTITY */}
          {product.status !== "out_of_stock" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                marginBottom: "20px",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--text)",
                  fontSize: "16px",
                }}
              >
                Quantity:
              </span>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  border: "1px solid var(--border)",
                  borderRadius: "50px",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() =>
                    setQuantity((q) => Math.max(1, q - 1))
                  }
                  style={{
                    width: "44px",
                    height: "44px",
                    background: "var(--card-bg)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "22px",
                    fontWeight: 700,
                  }}
                >
                  −
                </button>

                <span
                  style={{
                    width: "50px",
                    textAlign: "center",
                    fontWeight: 800,
                    fontSize: "18px",
                  }}
                >
                  {quantity}
                </span>

                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  style={{
                    width: "44px",
                    height: "44px",
                    background: "var(--card-bg)",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "22px",
                    fontWeight: 700,
                  }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* ADD TO CART & WISHLIST */}
          <div className="pdp-actions" style={{ display: "flex", gap: "15px", marginBottom: "15px" }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              disabled={product.status === "out_of_stock"}
              className="btn-primary"
              style={{
                flex: 1,
                padding: "20px",
                borderRadius: "20px",
                fontSize: "18px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
              }}
            >
              <AnimatePresence mode="wait">
                {isAdded ? (
                  <motion.div
                    key="added"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <Check size={24} />
                    Added to Cart!
                  </motion.div>
                ) : (
                  <motion.div
                    key="add"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <ShoppingBag size={24} />
                    {product.status === "out_of_stock"
                      ? "Out of Stock"
                      : "Add to Cart"}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {product.status !== "out_of_stock" && (
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 8px 28px rgba(255,77,109,0.5)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleWishlist(product)}
                style={{
                  width: "68px",
                  height: "68px",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isInWishlist(product._id)
                    ? "linear-gradient(135deg, #c9184a, #ff4d6d)"
                    : "linear-gradient(135deg, #ff4d6d, #ff758f)",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  boxShadow: isInWishlist(product._id)
                    ? "0 4px 18px rgba(201,24,74,0.45)"
                    : "0 4px 18px rgba(255,77,109,0.35)",
                  transition: "all 0.25s ease",
                }}
              >
                <Heart size={26} fill="#fff" color="#fff" />
              </motion.button>
            )}
          </div>

          {/* BUY NOW */}
          {product.status !== "out_of_stock" && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBuyNow}
              style={{
                width: "100%",
                padding: "20px",
                borderRadius: "20px",
                fontSize: "18px",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "12px",
                background: "transparent",
                border:
                  "2px solid var(--primary, #ff4d6d)",
                color: "var(--primary, #ff4d6d)",
                cursor: "pointer",
              }}
            >
              ⚡ Buy Now
            </motion.button>
          )}
        </div>
      </div>

      {/* ── FULL-WIDTH AR VIEWER SECTION ─────────────────────────────── */}
      <AnimatePresence>
        {(product.model3d || product.images?.[0]) && showAR && (
          <motion.div
            key="ar-section"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            style={{
              maxWidth: "1200px",
              margin: "0 auto",
              padding: "0 5% 80px",
            }}
          >
            {/* Glassmorphism card */}
            <div
              style={{
                background: "linear-gradient(135deg, rgba(26,26,46,0.96) 0%, rgba(22,33,62,0.96) 100%)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                borderRadius: "28px",
                border: "1px solid rgba(255,255,255,0.1)",
                overflow: "hidden",
                boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "24px 28px 0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <motion.div
                    animate={{ rotateY: [0, 360] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                    style={{ display: "flex" }}
                  >
                    <Box size={28} color="#ff4d6d" />
                  </motion.div>
                  <div>
                    <h2 style={{
                      margin: 0,
                      fontSize: "22px",
                      fontWeight: 800,
                      color: "#fff",
                      lineHeight: 1.2,
                    }}>
                      View in 3D &amp; AR
                    </h2>
                    <p style={{
                      margin: "2px 0 0",
                      fontSize: "13px",
                      color: "rgba(255,255,255,0.5)",
                    }}>
                      {product.name} — interactive 3D model
                    </p>
                  </div>
                </div>

                {/* Badges */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{
                    background: "rgba(255,77,109,0.2)",
                    border: "1px solid rgba(255,77,109,0.4)",
                    color: "#ff4d6d",
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "5px 12px",
                    borderRadius: "20px",
                    letterSpacing: "0.5px",
                  }}>🥽 AR MODE</span>
                  <span style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.7)",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: "20px",
                  }}>📦 3D VIEW</span>
                  {/* Close button */}
                  <button
                    onClick={() => setShowAR(false)}
                    style={{
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.7)",
                      borderRadius: "50%",
                      width: "34px",
                      height: "34px",
                      cursor: "pointer",
                      fontSize: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "background 0.2s",
                      marginLeft: "4px",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Device hint bar */}
              <div style={{
                display: "flex",
                gap: "6px",
                padding: "14px 28px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                {[
                  { icon: "🖥️", text: "Desktop: Drag to rotate" },
                  { icon: "📱", text: "Android: View in AR (Scene Viewer)" },
                  { icon: "🍎", text: "iPhone: Quick Look AR" },
                ].map(h => (
                  <span key={h.text} style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.45)",
                    background: "rgba(255,255,255,0.05)",
                    padding: "4px 10px",
                    borderRadius: "8px",
                  }}>
                    {h.icon} {h.text}
                  </span>
                ))}
              </div>

              {/* ARViewer */}
              <div style={{ padding: "0" }}>
                <ARViewer
                  model={product.model3d}
                  images={product.images || []}
                  poster={product.images?.[0]}
                  productName={product.name}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetailPage;
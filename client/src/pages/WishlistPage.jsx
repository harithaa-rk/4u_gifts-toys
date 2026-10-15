import React, { useState } from "react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Trash2, ChevronRight, Zap, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import TemuInstantBuyModal from "../components/payment/TemuInstantBuyModal";

const WishlistPage = () => {
  const { t } = useTranslation();
  const { wishlistItems, toggleWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Instant Razorpay Purchase State
  const [instantBuyItem, setInstantBuyItem] = useState(null);
  const [instantBuyOpen, setInstantBuyOpen] = useState(false);

  const handleOpenDirectBuy = (item) => {
    setInstantBuyItem(item);
    setInstantBuyOpen(true);
  };

  const handleBuyAllWishlist = () => {
    if (wishlistItems.length === 0) return;
    setInstantBuyItem(wishlistItems);
    setInstantBuyOpen(true);
  };

  const totalWishlistValue = wishlistItems.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);

  // Animation variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVars = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
    exit: {
      opacity: 0,
      scale: 0.9,
      y: 10,
      transition: { duration: 0.25 },
    },
  };

  return (
    <div
      style={{
        background: "var(--bg, #fff0f5)",
        minHeight: "100vh",
        padding: "120px 5% 80px",
        fontFamily: "inherit",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1240px", margin: "0 auto" }}>
        {wishlistItems.length === 0 ? (
          /* EMPTY STATE */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: "center",
              padding: "100px 20px",
              background: "var(--card-bg, rgba(255, 255, 255, 0.7))",
              backdropFilter: "blur(20px)",
              borderRadius: "30px",
              border: "1px solid var(--border)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.05)",
              maxWidth: "600px",
              margin: "40px auto 0",
            }}
          >
            <div style={{ position: "relative", display: "inline-block", marginBottom: "25px" }}>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              >
                <Heart size={80} color="var(--primary)" style={{ opacity: 0.25 }} />
              </motion.div>
              <Heart
                size={36}
                color="var(--primary)"
                fill="var(--primary)"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            </div>
            <h2
              style={{
                fontSize: "30px",
                color: "var(--text)",
                fontWeight: 800,
                margin: "0 0 10px",
              }}
            >
              {t('wishlist.emptyTitle', 'Your Wishlist is Empty')}
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "16px",
                margin: "0 0 35px",
                lineHeight: "1.6",
              }}
            >
              {t('wishlist.emptyDesc', 'Explore our magical collection and save the items you love to revisit or purchase directly anytime.')}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/shop")}
              style={{
                padding: "16px 36px",
                background: "linear-gradient(135deg, var(--primary), #ff8fab)",
                color: "#fff",
                border: "none",
                borderRadius: "30px",
                cursor: "pointer",
                fontSize: "18px",
                fontWeight: 800,
                boxShadow: "0 10px 25px rgba(244, 143, 177, 0.4)",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              {t('wishlist.browseProducts', 'Browse Products')} <ChevronRight size={20} />
            </motion.button>
          </motion.div>
        ) : (
          /* WISHLIST GRID */
          <>
            {/* Header & Quick Buy All Bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "25px",
                flexWrap: "wrap",
                gap: "15px",
              }}
            >
              <h1
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  margin: 0,
                  fontSize: "34px",
                  color: "var(--text)",
                  fontWeight: 900,
                }}
              >
                <Heart size={34} color="var(--primary)" fill="var(--primary)" /> {t('wishlist.title', 'My Favorites')}
                <span
                  style={{
                    background: "var(--primary)",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: "20px",
                    verticalAlign: "middle",
                    boxShadow: "0 4px 10px rgba(255, 77, 109, 0.3)",
                  }}
                >
                  {wishlistItems.length}
                </span>
              </h1>

              {/* Express Buy All Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleBuyAllWishlist}
                  style={{
                    padding: "12px 22px",
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #8057E8 0%, #A78BFA 100%)",
                    color: "#fff",
                    border: "none",
                    fontWeight: 800,
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 6px 20px rgba(128, 87, 232, 0.35)",
                  }}
                >
                  <Zap size={16} fill="#fff" /> Checkout All ({wishlistItems.length}) with Razorpay · ₹{totalWishlistValue.toLocaleString('en-IN')}
                </motion.button>

                <Link to="/shop" style={{ textDecoration: "none", color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px", fontSize: "14px" }}>
                  {t('cart.exploreShop', 'Continue Shopping')} <ChevronRight size={16} />
                </Link>
              </div>
            </motion.div>

            {/* Grid */}
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="show"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "28px",
              }}
            >
              <AnimatePresence mode="popLayout">
                {wishlistItems.map((product) => (
                  <motion.div
                    variants={itemVars}
                    key={product._id}
                    layout
                    style={{
                      background: "var(--card-bg, rgba(255, 255, 255, 0.8))",
                      backdropFilter: "blur(20px)",
                      borderRadius: "24px",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow, 0 10px 30px rgba(0,0,0,0.02))",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                    whileHover={{ y: -8, boxShadow: "0 15px 40px rgba(255, 77, 109, 0.12)" }}
                  >
                    {/* Delete overlay button */}
                    <button
                      onClick={() => removeFromWishlist(product._id)}
                      style={{
                        position: "absolute",
                        top: "15px",
                        right: "15px",
                        zIndex: 10,
                        background: "rgba(255,255,255,0.85)",
                        border: "none",
                        borderRadius: "50%",
                        width: "36px",
                        height: "36px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                        color: "#e63946",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#ffebee")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.85)")}
                      title="Remove from favorites"
                    >
                      <Trash2 size={16} />
                    </button>

                    <Link to={`/product/${product._id}`} style={{ textDecoration: "none", color: "inherit", flex: 1, display: "flex", flexDirection: "column" }}>
                      {/* Image container */}
                      <div style={{ height: "230px", overflow: "hidden", background: "var(--secondary, #ffeef2)" }}>
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "64px",
                            }}
                          >
                            🎁
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ padding: "20px 22px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            color: "var(--primary)",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "1px",
                            marginBottom: "6px",
                          }}
                        >
                          {product.category}
                        </span>
                        <h3
                          style={{
                            fontSize: "17px",
                            fontWeight: 700,
                            color: "var(--text)",
                            margin: "0 0 10px",
                            lineHeight: 1.3,
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {product.name}
                        </h3>
                        <div
                          style={{
                            marginTop: "auto",
                            fontSize: "22px",
                            fontWeight: 900,
                            color: "var(--primary)",
                          }}
                        >
                          ₹{(+product.price).toLocaleString('en-IN')}
                        </div>
                      </div>
                    </Link>

                    {/* Dual Action Buttons: Direct Razorpay Buy & Add to Cart */}
                    <div style={{ padding: "0 20px 20px", display: "flex", gap: "10px" }}>
                      
                      {/* Direct Razorpay Instant Purchase (Temu style) */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleOpenDirectBuy(product)}
                        style={{
                          flex: 1,
                          padding: "12px 8px",
                          background: "linear-gradient(135deg, #8057E8 0%, #A78BFA 100%)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "14px",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          boxShadow: "0 4px 14px rgba(128, 87, 232, 0.35)",
                        }}
                      >
                        <Zap size={15} fill="#fff" /> Buy Now
                      </motion.button>

                      {/* Add to Cart */}
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => addToCart(product)}
                        style={{
                          flex: 1,
                          padding: "12px 8px",
                          background: "linear-gradient(135deg, #ff4d6d 0%, #c9184a 100%)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "14px",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          cursor: "pointer",
                          fontSize: "13px",
                          boxShadow: "0 4px 14px rgba(255, 77, 109, 0.35)",
                        }}
                      >
                        <ShoppingBag size={15} /> Add to Cart
                      </motion.button>

                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>

      {/* Temu-Style Express Razorpay Checkout Modal */}
      <TemuInstantBuyModal
        isOpen={instantBuyOpen}
        onClose={() => setInstantBuyOpen(false)}
        product={instantBuyItem}
      />
    </div>
  );
};

export default WishlistPage;
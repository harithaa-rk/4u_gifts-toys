import React from "react";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, ShoppingBag, Trash2, ChevronRight } from "lucide-react";

const WishlistPage = () => {
  const { wishlistItems, toggleWishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const navigate = useNavigate();

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
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
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
              Your Wishlist is Empty
            </h2>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "16px",
                lineHeight: 1.6,
                margin: "0 0 30px",
              }}
            >
              Save your favorite magical toys and gifts here to keep track of them.
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
              Discover Magic <ChevronRight size={20} />
            </motion.button>
          </motion.div>
        ) : (
          /* WISHLIST GRID */
          <>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "40px",
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
                  fontSize: "36px",
                  color: "var(--text)",
                  fontWeight: 800,
                }}
              >
                <Heart size={36} color="var(--primary)" fill="var(--primary)" /> My Favorites
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
              <Link to="/shop" style={{ textDecoration: "none", color: "var(--primary)", fontWeight: 700, display: "flex", alignItems: "center", gap: "5px" }}>
                Continue Shopping <ChevronRight size={16} />
              </Link>
            </motion.div>

            {/* Grid */}
            <motion.div
              variants={containerVars}
              initial="hidden"
              animate="show"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "30px",
              }}
            >
              <AnimatePresence mode="popLayout">
                {wishlistItems.map((product) => (
                  <motion.div
                    variants={itemVars}
                    key={product._id}
                    layout
                    style={{
                      background: "var(--card-bg, rgba(255, 255, 255, 0.75))",
                      backdropFilter: "blur(20px)",
                      borderRadius: "24px",
                      overflow: "hidden",
                      border: "1px solid var(--border)",
                      boxShadow: "var(--shadow, 0 10px 30px rgba(0,0,0,0.02))",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                    }}
                    whileHover={{ y: -8, boxShadow: "0 15px 40px rgba(255, 77, 109, 0.08)" }}
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
                      <div style={{ height: "240px", overflow: "hidden", background: "var(--secondary, #ffeef2)" }}>
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
                      <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
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
                            fontSize: "18px",
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
                            fontWeight: 800,
                            color: "var(--primary)",
                            marginBottom: "16px",
                          }}
                        >
                          ₹{(+product.price).toLocaleString()}
                        </div>
                      </div>
                    </Link>

                    {/* Add to Cart button */}
                    <div style={{ padding: "0 24px 24px" }}>
                      <motion.button
                        whileHover={{ scale: 1.03, boxShadow: "0 8px 28px rgba(255, 77, 109, 0.55)" }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => addToCart(product)}
                        style={{
                          width: "100%",
                          padding: "14px",
                          background: "linear-gradient(135deg, #ff4d6d 0%, #c9184a 100%)",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "14px",
                          fontWeight: 800,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                          cursor: "pointer",
                          fontSize: "15px",
                          letterSpacing: "0.3px",
                          boxShadow: "0 5px 18px rgba(255, 77, 109, 0.45)",
                          transition: "all 0.25s ease",
                        }}
                      >
                        <ShoppingBag size={18} /> Add to Cart
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
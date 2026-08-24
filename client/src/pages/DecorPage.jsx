import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { ShoppingBag, Sparkles, Home, Heart } from "lucide-react";
import { API_BASE_URL } from "../utils/constants";

const API = API_BASE_URL;

const DecorPage = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${API}/products`);
        // Filter loosely by category or name containing 'decor' or 'home'
        const decorItems = data.filter(p => 
          (p.status === "active" || p.status === "low_stock") &&
          (p.category.toLowerCase().includes("decor") || p.category.toLowerCase().includes("home") || p.name.toLowerCase().includes("decor") || p.name.toLowerCase().includes("home"))
        );
        setProducts(decorItems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ background: "#faf8f5", minHeight: "100vh", paddingBottom: "100px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Hero Section */}
      <section style={{ padding: "160px 5% 100px", textAlign: "center", background: "linear-gradient(135deg, #f5ebe0, #e3d5ca)", borderBottom: "1.5px solid rgba(213, 189, 175, 0.4)", position: "relative", overflow: "hidden", marginBottom: "60px" }}>
        
        {/* Soft Ambient Floating Elements */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              opacity: [0.15, 0.4, 0.15], 
              scale: [0.8, 1.2, 0.8],
              y: [0, Math.random() * -40 - 20, 0]
            }}
            transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 2 }}
            style={{ position: "absolute", top: `${Math.random() * 70 + 10}%`, left: `${Math.random() * 90}%`, fontSize: `${Math.random() * 20 + 20}px`, filter: "blur(1px)", pointerEvents: "none" }}
          >
            {["🏡", "✨", "🛋", "🪴"][i % 4]}
          </motion.div>
        ))}

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ fontSize: "clamp(28px, 8vw, 64px)", fontWeight: 900, color: "#604a3f", margin: "0 0 20px", position: "relative", zIndex: 10, letterSpacing: "1px" }}
        >
          Home Decor 🏡
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          style={{ fontSize: "clamp(15px, 3.5vw, 22px)", color: "#8a7060", maxWidth: "600px", margin: "0 auto", position: "relative", zIndex: 10, fontWeight: 500 }}
        >
          Cozy corners, elegant accessories, and beautiful artifacts to light up your space.
        </motion.p>
      </section>

      {/* Product Grid */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5%" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#604a3f", fontSize: "18px" }}>Fetching elegant pieces... 🏺</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#604a3f", fontSize: "18px" }}>No decor products found currently. Please add some from the Admin Dashboard!</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "40px" }}>
            {products.map((p, i) => (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
                whileHover={{ y: -10, boxShadow: "0 20px 40px rgba(96, 74, 63, 0.15)" }}
                key={p._id}
                style={{ background: "#fff", borderRadius: "24px", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.03)", border: "1px solid #e6dfd9", display: "flex", flexDirection: "column", position: "relative" }}
              >
                {/* Wishlist Heart Icon overlay */}
                <motion.button
                  whileHover={{ scale: 1.15, boxShadow: '0 6px 22px rgba(255,77,109,0.55)' }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleWishlist(p);
                  }}
                  style={{
                    position: "absolute",
                    top: "15px",
                    right: "15px",
                    zIndex: 20,
                    background: isInWishlist(p._id)
                      ? "linear-gradient(135deg, #c9184a, #ff4d6d)"
                      : "linear-gradient(135deg, #ff4d6d, #ff758f)",
                    border: "none",
                    borderRadius: "50%",
                    width: "38px",
                    height: "38px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    boxShadow: "0 4px 14px rgba(255,77,109,0.4)",
                    transition: "all 0.25s ease"
                  }}
                >
                  <Heart size={18} fill="#fff" color="#fff" />
                </motion.button>

                <Link to={`/product/${p._id}`} style={{ textDecoration: "none", color: "inherit", flex: 1, display: "flex", flexDirection: "column" }}>
                  {p.images?.[0] ? (
                    <div style={{ overflow: "hidden", height: "260px" }}>
                      <motion.img whileHover={{ scale: 1.06 }} src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "0.4s" }} />
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: "260px", background: "#f5ebe0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px" }}>🏡</div>
                  )}
                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", color: "#8a7060", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Home & Living</span>
                    <h3 style={{ margin: "0 0 10px", fontSize: "20px", color: "#604a3f", fontWeight: 700, lineHeight: "1.3" }}>{p.name}</h3>
                    <div style={{ marginTop: "auto", fontSize: "22px", fontWeight: 800, color: "#604a3f" }}>₹{(+p.price).toLocaleString()}</div>
                  </div>
                </Link>
                <div style={{ padding: "0 24px 24px" }}>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(p)}
                    style={{ width: "100%", padding: "14px", background: "#604a3f", color: "#fff", border: "none", borderRadius: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", fontSize: "16px", boxShadow: "0 4px 15px rgba(96, 74, 63, 0.2)" }}
                  >
                    <ShoppingBag size={20} /> Add to Cart
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DecorPage;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { ShoppingBag, Heart } from "lucide-react";

const API = "http://localhost:5000/api";

const BabyPage = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${API}/products`);
        // Filter loosely by category or name containing 'baby'
        const babyItems = data.filter(p => 
          (p.status === "active" || p.status === "low_stock") &&
          (p.category.toLowerCase().includes("baby") || p.name.toLowerCase().includes("baby"))
        );
        setProducts(babyItems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ background: "#f0f8ff", minHeight: "100vh", paddingBottom: "100px", overflow: "hidden" }}>
      
      {/* Hero Section */}
      <section style={{ position: "relative", padding: "150px 5% 100px", textAlign: "center", background: "linear-gradient(135deg, #e3f2fd, #bbdefb)", borderBottomLeftRadius: "50%", borderBottomRightRadius: "50%", marginBottom: "80px" }}>
        
        {/* Floating Bubbles */}
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              y: [0, -100, 0], 
              x: [0, Math.random() * 50 - 25, 0],
              opacity: [0.3, 0.8, 0.3]
            }}
            transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", bottom: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, width: `${Math.random() * 40 + 20}px`, height: `${Math.random() * 40 + 20}px`, background: "rgba(255,255,255,0.6)", borderRadius: "50%", boxShadow: "inset 0 0 10px rgba(255,255,255,1)" }}
          />
        ))}

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: "clamp(32px, 8vw, 64px)", fontWeight: 900, color: "#1565c0", margin: "0 0 20px", position: "relative", zIndex: 10 }}
        >
          Baby Wonderland 🍼
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: "clamp(15px, 3.5vw, 20px)", color: "#1976d2", maxWidth: "600px", margin: "0 auto", position: "relative", zIndex: 10 }}
        >
          Softest toys, magical gifts, and absolute comfort for your little miracles.
        </motion.p>
      </section>

      {/* Product Grid */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5%" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#1565c0" }}>Loading sweet dreams...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#1565c0" }}>No baby products found currently. Please add some from the Admin Dashboard!</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "40px" }}>
            {products.map((p, i) => (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -10 }}
                key={p._id}
                style={{ background: "#fff", borderRadius: "30px", overflow: "hidden", boxShadow: "0 20px 40px rgba(33, 150, 243, 0.1)", display: "flex", flexDirection: "column", position: "relative" }}
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
                    <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "250px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "250px", background: "#e3f2fd", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px" }}>🧸</div>
                  )}
                  <div style={{ padding: "24px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: "20px", color: "#1565c0" }}>{p.name}</h3>
                    <div style={{ marginTop: "auto", fontSize: "24px", fontWeight: 800, color: "#2196f3" }}>₹{(+p.price).toLocaleString()}</div>
                  </div>
                </Link>
                <div style={{ padding: "0 24px 24px" }}>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(p)}
                    style={{ width: "100%", padding: "14px", background: "#2196f3", color: "#fff", border: "none", borderRadius: "15px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", fontSize: "16px" }}
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

export default BabyPage;

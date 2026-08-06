import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { Sparkles, ShoppingBag, Heart } from "lucide-react";

const API = "http://localhost:5000/api";

const FancyPage = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${API}/products`);
        const fancyItems = data.filter(p => 
          (p.status === "active" || p.status === "low_stock") &&
          (p.category.toLowerCase().includes("fancy") || p.category.toLowerCase().includes("gift") || p.name.toLowerCase().includes("fancy"))
        );
        setProducts(fancyItems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ background: "#fffff8", minHeight: "100vh", paddingBottom: "100px" }}>
      
      {/* Hero Section */}
      <section style={{ padding: "150px 5% 100px", textAlign: "center", background: "linear-gradient(135deg, #fffde7, #fff9c4)", position: "relative", overflow: "hidden", marginBottom: "60px" }}>
        
        {/* Sparkle animations */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ 
              opacity: [0, 1, 0], 
              scale: [0, 1, 0],
              rotate: [0, 180]
            }}
            transition={{ duration: 2 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
            style={{ position: "absolute", top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, color: "#fbc02d" }}
          >
            <Sparkles size={Math.random() * 20 + 10} />
          </motion.div>
        ))}

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ fontSize: "clamp(30px, 8vw, 64px)", fontWeight: 900, color: "#f57f17", margin: "0 0 20px", position: "relative", zIndex: 10, textShadow: "0 4px 15px rgba(251, 192, 45, 0.4)" }}
        >
          Fancy Gifts ✨
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: "clamp(15px, 3.5vw, 22px)", color: "#fbc02d", maxWidth: "600px", margin: "0 auto", position: "relative", zIndex: 10, fontWeight: 500 }}
        >
          Extraordinary presents for extraordinary people. Unbox the magic!
        </motion.p>
      </section>

      {/* Product Grid */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "0 5%" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#f57f17", fontSize: "18px" }}>Summoning magic... ✨</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#f57f17", fontSize: "18px" }}>No magical items found. Check back later!</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "40px" }}>
            {products.map((p, i) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring" }}
                whileHover={{ y: -10, boxShadow: "0 20px 40px rgba(251, 192, 45, 0.3)" }}
                key={p._id}
                style={{ background: "#fff", borderRadius: "20px", padding: "10px", boxShadow: "0 10px 20px rgba(0,0,0,0.05)", border: "1px solid #fff59d", display: "flex", flexDirection: "column", position: "relative" }}
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
                    <div style={{ borderRadius: "12px", overflow: "hidden", height: "260px" }}>
                      <motion.img whileHover={{ scale: 1.1 }} src={p.images[0]} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", transition: "0.4s" }} />
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: "260px", background: "#fff9c4", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px" }}>🌟</div>
                  )}
                  <div style={{ padding: "20px 10px", flex: 1, textAlign: "center" }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: "20px", color: "#f57f17" }}>{p.name}</h3>
                    <div style={{ fontSize: "24px", fontWeight: 800, color: "#fbc02d" }}>₹{(+p.price).toLocaleString()}</div>
                  </div>
                </Link>
                <div style={{ padding: "0 10px 10px" }}>
                  <motion.button 
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(p)}
                    style={{ width: "100%", padding: "14px", background: "linear-gradient(90deg, #fbc02d, #f57f17)", color: "#fff", border: "none", borderRadius: "12px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", fontSize: "16px", boxShadow: "0 5px 15px rgba(251, 192, 45, 0.4)" }}
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

export default FancyPage;

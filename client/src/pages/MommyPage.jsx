import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { ShoppingBag, Heart } from "lucide-react";
import { API_BASE_URL } from "../utils/constants";

const API = API_BASE_URL;

const MommyPage = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${API}/products`);
        const mommyItems = data.filter(p => 
          (p.status === "active" || p.status === "low_stock") &&
          (p.category.toLowerCase().includes("mom") || p.name.toLowerCase().includes("mom"))
        );
        setProducts(mommyItems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ background: "#fff5f5", minHeight: "100vh", paddingBottom: "100px", fontFamily: "'Playfair Display', serif" }}>
      
      {/* Hero Section */}
      <section style={{ padding: "160px 5% 100px", textAlign: "center", background: "linear-gradient(to right, #ffebee, #fce4ec)", borderBottom: "1px solid rgba(244, 143, 177, 0.3)", position: "relative", overflow: "hidden" }}>
        
        {/* Decorative elements */}
        <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "200px", height: "200px", background: "rgba(244, 143, 177, 0.4)", filter: "blur(50px)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "-50px", right: "-50px", width: "300px", height: "300px", background: "rgba(255, 138, 101, 0.2)", filter: "blur(60px)", borderRadius: "50%" }} />

        <motion.h1 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          style={{ fontSize: "clamp(30px, 8vw, 72px)", fontWeight: 700, color: "#c2185b", margin: "0 0 20px", position: "relative", zIndex: 10, fontStyle: "italic" }}
        >
          For Super Moms ❤️
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{ fontSize: "clamp(15px, 3.5vw, 22px)", color: "#d81b60", maxWidth: "600px", margin: "0 auto", position: "relative", zIndex: 10, fontFamily: "sans-serif", fontWeight: 300 }}
        >
          Elegant, practical, and beautiful gifts for the queens of our hearts.
        </motion.p>
      </section>

      {/* Product Grid */}
      <div style={{ maxWidth: "1200px", margin: "80px auto 0", padding: "0 5%", fontFamily: "sans-serif" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#c2185b" }}>Loading elegance...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#c2185b" }}>No Mommy products found currently. Please add some!</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "40px" }}>
            {products.map((p, i) => (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(194, 24, 91, 0.15)" }}
                key={p._id}
                style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(10px)", border: "1px solid rgba(244, 143, 177, 0.3)", borderRadius: "0", display: "flex", flexDirection: "column", transition: "all 0.3s", position: "relative" }}
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
                    <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "300px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "300px", background: "#fce4ec", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px" }}>👜</div>
                  )}
                  <div style={{ padding: "30px", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                    <h3 style={{ margin: "0 0 15px", fontSize: "20px", color: "#880e4f", fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{p.name}</h3>
                    <div style={{ marginTop: "auto", fontSize: "18px", color: "#c2185b", letterSpacing: "2px" }}>₹{(+p.price).toLocaleString()}</div>
                  </div>
                </Link>
                <div style={{ padding: "0 30px 30px" }}>
                  <motion.button 
                    whileHover={{ scale: 1.02, boxShadow: "0 6px 20px rgba(194,24,91,0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(p)}
                    style={{ width: "100%", padding: "14px", background: "linear-gradient(135deg, #c2185b, #880e4f)", color: "#fff", border: "none", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", cursor: "pointer", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700, boxShadow: "0 4px 14px rgba(194,24,91,0.3)" }}
                  >
                    <ShoppingBag size={16} /> Add to Cart
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

export default MommyPage;

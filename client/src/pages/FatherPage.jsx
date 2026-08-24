import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { ShoppingBag, ChevronRight, Heart } from "lucide-react";
import { API_BASE_URL } from "../utils/constants";

const API = API_BASE_URL;

const FatherPage = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await axios.get(`${API}/products`);
        const fatherItems = data.filter(p => 
          (p.status === "active" || p.status === "low_stock") &&
          (p.category.toLowerCase().includes("father") || p.category.toLowerCase().includes("dad") || p.name.toLowerCase().includes("dad"))
        );
        setProducts(fatherItems);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ background: "#fffaf0", minHeight: "100vh", paddingBottom: "100px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Hero Section */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "150px 5% 100px", background: "#fff3e0", borderBottom: "4px solid #ffcc80" }}>
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          style={{ width: "100px", height: "6px", background: "#ef6c00", marginBottom: "30px" }}
        />
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: "clamp(26px, 7vw, 60px)", fontWeight: 900, color: "#e65100", margin: "0 0 20px", textTransform: "uppercase", letterSpacing: "clamp(1px, 1vw, 4px)", textAlign: "center" }}
        >
          Gifts for Dad
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          style={{ fontSize: "clamp(14px, 3vw, 20px)", color: "#f57c00", maxWidth: "600px", textAlign: "center", margin: "0 auto", fontWeight: 500 }}
        >
          Sleek, practical, and meaningful. Show him how much he means to the family.
        </motion.p>
      </section>

      {/* Product Grid */}
      <div style={{ maxWidth: "1200px", margin: "80px auto 0", padding: "0 5%" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#ef6c00", fontWeight: "bold" }}>LOADING...</div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "50px", color: "#ef6c00", fontWeight: "bold" }}>NO PRODUCTS FOUND. CHECK INVENTORY.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
            {products.map((p, i) => (
              <motion.div
                initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
                key={p._id}
                style={{ background: "#fff", border: "2px solid #ffe0b2", display: "flex", flexDirection: "column", position: "relative" }}
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
                    <img src={p.images[0]} alt={p.name} style={{ width: "100%", height: "260px", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "260px", background: "#ffcc80", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px" }}>👔</div>
                  )}
                  <div style={{ padding: "20px", flex: 1 }}>
                    <h3 style={{ margin: "0 0 10px", fontSize: "20px", fontWeight: 800, color: "#e65100", textTransform: "uppercase" }}>{p.name}</h3>
                    <div style={{ fontSize: "24px", fontWeight: 900, color: "#333" }}>₹{(+p.price).toLocaleString()}</div>
                  </div>
                </Link>
                <div style={{ padding: "0 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={() => addToCart(p)}
                    style={{ background: "#ef6c00", color: "#fff", border: "none", padding: "12px 20px", fontWeight: 700, display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", textTransform: "uppercase" }}
                  >
                    Add to Cart <ChevronRight size={18} />
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

export default FatherPage;

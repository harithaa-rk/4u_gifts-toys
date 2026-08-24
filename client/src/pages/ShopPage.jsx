import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { ShoppingCart, Search, LayoutGrid, List, Heart } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../utils/constants";

const API = API_BASE_URL;

const ShopPage = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [activeCategory, setActiveCategory] = useState("all");

  // Sync search state with URL query parameter changes
  useEffect(() => {
    setSearch(searchParams.get("search") || "");
  }, [searchParams]);

  // Update URL parameter when search input changes
  const handleSearchChange = (value) => {
    setSearch(value);
    if (value) {
      setSearchParams({ search: value });
    } else {
      setSearchParams({});
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/categories`),
        ]);
        setProducts(prodRes.data.filter(p => p.status === "active" || p.status === "low_stock"));
        setCategories(catRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === "all" || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ background: "#fdfbfd", minHeight: "100vh", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      
      {/* Top Banner */}
      <div style={{ background: "linear-gradient(90deg, #9c27b0, #7b1fa2)", padding: "clamp(90px, 15vw, 120px) 5% clamp(30px, 5vw, 40px)", textAlign: "center", color: "#fff", marginBottom: "30px" }}>
        <h1 style={{ margin: "0 0 10px", fontSize: "clamp(26px, 6vw, 36px)", fontWeight: 700, letterSpacing: "1px" }}>Our Collection</h1>
        <p style={{ margin: 0, fontSize: "clamp(14px, 3vw, 16px)", opacity: 0.9 }}>Discover magical gifts handpicked just for you.</p>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 5%" }}>
        
        {/* Horizontal Toolbar */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "16px 20px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(156, 39, 176, 0.08)", marginBottom: "40px", gap: "14px" }}>
          
          <div style={{ color: "#666", fontSize: "15px", fontWeight: 500 }}>
            Showing {filteredProducts.length} products
          </div>

          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", width: "100%", maxWidth: "500px" }}>
            {/* Search Input */}
            <div style={{ position: "relative", flex: 1, minWidth: "160px" }}>
               <Search size={18} style={{ position: "absolute", left: "14px", top: "12px", color: "#9c27b0" }} />
               <input 
                 type="text" 
                 placeholder="Search products..." 
                 value={search}
                 onChange={e => handleSearchChange(e.target.value)}
                 style={{ width: "100%", padding: "10px 15px 10px 40px", borderRadius: "30px", border: "1px solid #e1bee7", background: "#faf5fb", color: "#333", boxSizing: "border-box", outline: "none", fontSize: "14px", transition: "0.2s" }}
                 onFocus={(e) => e.target.style.border = "1px solid #9c27b0"}
                 onBlur={(e) => e.target.style.border = "1px solid #e1bee7"}
               />
            </div>

            {/* Category Dropdown */}
            <select 
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              style={{ flex: "0 1 auto", padding: "10px 14px", borderRadius: "30px", border: "1px solid #e1bee7", background: "#faf5fb", color: "#333", fontSize: "14px", outline: "none", cursor: "pointer" }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id || cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Product Grid */}
        <main>
          {loading ? (
            <div style={{ textAlign: "center", padding: "100px", color: "#9c27b0", fontSize: "18px", fontWeight: 500 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "inline-block", marginBottom: "10px" }}>
                <ShoppingCart size={32} />
              </motion.div>
              <br />
              Loading Collection...
            </div>
          ) : (
            <motion.div layout style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(280px, 100%), 1fr))", gap: "clamp(20px, 4vw, 40px) clamp(16px, 3vw, 30px)" }}>
              <AnimatePresence>
                {filteredProducts.map(p => {
                  const cat = categories.find(c => c.id === p.category);
                  return (
                     <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4 }}
                      key={p._id}
                      style={{ display: "flex", flexDirection: "column", position: "relative" }}
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

                      {/* Product Image */}
                      <Link to={`/product/${p._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                        <div style={{ width: "100%", height: "320px", borderRadius: "12px", overflow: "hidden", background: "#f5f5f5", position: "relative" }}>
                          {p.status === "low_stock" && (
                            <div style={{ position: "absolute", top: "12px", left: "12px", background: "#9c27b0", color: "#fff", fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "20px", zIndex: 10 }}>
                              Few Left!
                            </div>
                          )}
                          {p.images?.[0] ? (
                            <motion.img 
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.4 }}
                              src={p.images[0]} 
                              alt={p.name} 
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                            />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "60px", color: "#e1bee7" }}>
                              {cat?.icon || "🎁"}
                            </div>
                          )}
                        </div>
                      </Link>

                      {/* Product Details (Left Aligned) */}
                      <div style={{ padding: "16px 4px 0", flex: 1, display: "flex", flexDirection: "column", textAlign: "left" }}>
                        <span style={{ fontSize: "12px", color: "#9c27b0", fontWeight: 600, textTransform: "uppercase", marginBottom: "6px", letterSpacing: "0.5px" }}>
                          {cat?.label || p.category}
                        </span>
                        
                        <Link to={`/product/${p._id}`} style={{ textDecoration: "none" }}>
                          <h3 
                            style={{ margin: "0 0 10px", fontSize: "16px", fontWeight: 500, color: "#222", lineHeight: 1.4, transition: "color 0.2s" }}
                            onMouseEnter={(e) => e.target.style.color = "#9c27b0"}
                            onMouseLeave={(e) => e.target.style.color = "#222"}
                          >
                            {p.name}
                          </h3>
                        </Link>

                        <div style={{ marginTop: "auto", fontSize: "18px", fontWeight: 700, color: "#111", marginBottom: "16px" }}>
                          ₹{(+p.price).toLocaleString()}
                        </div>

                        <motion.button 
                          whileHover={{ scale: 1.03, boxShadow: '0 6px 20px rgba(156,39,176,0.45)' }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => addToCart(p)}
                          style={{ 
                            width: "100%", 
                            padding: "12px", 
                            background: "linear-gradient(135deg, #9c27b0, #7b1fa2)",
                            color: "#fff", 
                            border: "none", 
                            borderRadius: "30px", 
                            fontWeight: 700, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            gap: "8px", 
                            cursor: "pointer",
                            boxShadow: "0 4px 14px rgba(156,39,176,0.35)",
                            transition: "all 0.25s ease"
                          }}
                        >
                          <ShoppingCart size={18} /> Add to cart
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div style={{ textAlign: "center", padding: "80px", color: "#666", fontSize: "18px" }}>
              No items found matching your filters.
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ShopPage;

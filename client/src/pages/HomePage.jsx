import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ReactTyped } from "react-typed";
import CountUp from 'react-countup';
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { Sparkles, ShoppingBag, Heart } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const API = "http://localhost:5000/api";

const HomePage = () => {
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [aboutInfo, setAboutInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Auto-play slideshow
  useEffect(() => {
    if (aboutInfo?.images?.length > 1) {
      const interval = setInterval(() => {
        setActiveImageIndex((prev) => (prev + 1) % aboutInfo.images.length);
      }, 3500); // Change image every 3.5 seconds
      return () => clearInterval(interval);
    }
  }, [aboutInfo]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, aboutRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/categories`),
          axios.get(`${API}/about`).catch(() => ({ data: null }))
        ]);
        setProducts(prodRes.data.filter(p => p.status === "active" || p.status === "low_stock"));
        setCategories(catRes.data);
        if (aboutRes?.data) setAboutInfo(aboutRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Could not load products. Please ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const navigate = useNavigate();

  const handleViewDetails = (product) => {
    navigate(`/product/${product._id}`);
  };

  const filteredProducts = activeCategory === "all" 
    ? products 
    : products.filter(p => p.category === activeCategory);

  // Animation variants
  const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <>
      <style>{`
        .store-container {
          --bg: #fff0f5;
          --text: #4a2c3a;
          --text-muted: #8c6b7a;
          --card-bg: rgba(255, 255, 255, 0.7);
          --primary: #ff4d6d;
          --primary-hover: #e03c5b;
          --secondary: #ffb3c1;
          --secondary-hover: #ffaebc;
          --border: rgba(255, 204, 213, 0.5);
          --hero-bg: linear-gradient(135deg, rgba(255, 204, 213, 0.8), rgba(255, 179, 193, 0.8));
          --shadow: 0 10px 30px rgba(255, 77, 109, 0.1);
          
          background-color: var(--bg);
          color: var(--text);
          font-family: 'Segoe UI', system-ui, sans-serif;
          transition: background-color 0.3s, color 0.3s;
        }

        @media (prefers-color-scheme: dark) {
          .store-container {
            --bg: #1a0f14;
            --text: #ffe8ef;
            --text-muted: #b38b9e;
            --card-bg: rgba(45, 24, 34, 0.7);
            --primary: #ff4d6d;
            --primary-hover: #ff758f;
            --secondary: #5e2436;
            --secondary-hover: #7a2e45;
            --border: rgba(74, 44, 58, 0.5);
            --hero-bg: linear-gradient(135deg, rgba(74, 25, 44, 0.8), rgba(45, 24, 34, 0.8));
            --shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
        }

        /* Glassmorphism */
        .glass {
          background: var(--card-bg);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid var(--border);
        }

        .store-hero {
          background: var(--hero-bg);
          padding: 80px 5%;
          text-align: center;
          border-radius: 0 0 50px 50px;
          margin-bottom: 60px;
          box-shadow: var(--shadow);
          position: relative;
          overflow: hidden;
        }

        .hero-title {
          font-size: 56px;
          margin: 0 0 20px;
          font-weight: 800;
          letter-spacing: -1px;
        }

        .hero-subtitle {
          font-size: 22px;
          opacity: 0.9;
          max-width: 650px;
          margin: 0 auto;
        }

        .section-title {
          font-size: 36px;
          margin: 0 0 30px;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .category-scroll {
          display: flex;
          gap: 15px;
          overflow-x: auto;
          padding: 10px 0 20px;
          scrollbar-width: none;
        }

        .category-scroll::-webkit-scrollbar { display: none; }

        .cat-card {
          padding: 16px 24px;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 700;
          font-size: 16px;
          color: var(--text);
          white-space: nowrap;
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          transition: all 0.3s;
        }

        .cat-card.active {
          border-color: var(--primary);
          background: var(--primary);
          color: #fff;
          box-shadow: 0 10px 25px rgba(255, 77, 109, 0.4);
        }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 30px;
          padding: 20px 0 60px;
        }

        .product-card {
          border-radius: 24px;
          overflow: hidden;
          box-shadow: var(--shadow);
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .product-img {
          width: 100%;
          height: 240px;
          object-fit: cover;
          background: var(--secondary);
          transition: transform 0.5s ease;
        }
        
        .product-img-placeholder {
          width: 100%;
          height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--secondary);
          font-size: 64px;
          transition: transform 0.5s ease;
        }

        .product-card:hover .product-img,
        .product-card:hover .product-img-placeholder {
          transform: scale(1.08);
        }

        .product-info {
          padding: 24px;
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--card-bg);
          z-index: 10;
        }

        .product-cat {
          font-size: 12px;
          color: var(--primary);
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .product-name {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 12px;
          line-height: 1.3;
        }

        .product-price {
          font-size: 24px;
          font-weight: 800;
          color: var(--primary);
          margin-top: auto;
          margin-bottom: 20px;
        }

        .product-actions {
          display: flex;
          gap: 10px;
        }

        .btn-primary, .btn-secondary {
          flex: 1;
          padding: 12px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary {
          background: var(--primary);
          color: #fff;
        }

        .btn-secondary {
          background: var(--secondary);
          color: var(--text);
        }

        /* Skeleton Loaders */
        .skeleton {
          background: linear-gradient(90deg, var(--border) 25%, var(--card-bg) 50%, var(--border) 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 8px;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Mobile breakpoints ── */
        @media (max-width: 768px) {
          .store-hero {
            padding: 60px 5% 50px !important;
            border-radius: 0 0 30px 30px !important;
            margin-bottom: 40px !important;
          }
          .hero-title {
            font-size: clamp(28px, 8vw, 48px) !important;
            letter-spacing: -0.5px !important;
            margin-bottom: 14px !important;
          }
          .hero-subtitle {
            font-size: clamp(15px, 3.5vw, 20px) !important;
          }
          .hero-cta {
            flex-direction: column !important;
            align-items: center !important;
          }
          .hero-cta a, .hero-cta button {
            width: 100% !important;
            max-width: 300px !important;
          }
          .section-title {
            font-size: clamp(22px, 6vw, 36px) !important;
          }
          .about-grid {
            grid-template-columns: 1fr !important;
          }
          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)) !important;
            gap: 20px !important;
          }
        }
        @media (max-width: 480px) {
          .store-hero {
            padding: 50px 4% 40px !important;
          }
          .hero-title {
            font-size: clamp(24px, 7vw, 36px) !important;
          }
          .products-grid {
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)) !important;
            gap: 16px !important;
          }
          .product-info {
            padding: 16px !important;
          }
          .product-name { font-size: 17px !important; }
          .product-price { font-size: 20px !important; }
          .hero-floating-emoji { display: none !important; }
        }
      `}</style>

      <div className="store-container">
        
        {/* Animated Hero Section */}
        <section className="store-hero">
          {/* Floating decorative elements – hidden on phones via CSS */}
          <motion.div className="hero-floating-emoji" animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }} style={{ position: 'absolute', top: '15%', left: '10%', fontSize: '48px' }}>🦄</motion.div>
          <motion.div className="hero-floating-emoji" animate={{ y: [0, 20, 0], rotate: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 5 }} style={{ position: 'absolute', bottom: '20%', right: '15%', fontSize: '56px' }}>🎈</motion.div>
          <motion.div className="hero-floating-emoji" animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 3 }} style={{ position: 'absolute', top: '25%', right: '25%', fontSize: '32px' }}>✨</motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hero-title"
          >
            Find the Perfect <br/>
            <span style={{ color: 'var(--primary)' }}>
              <ReactTyped
                strings={["Magical Gift", "Cute Toy", "Surprise", "Memory"]}
                typeSpeed={80}
                backSpeed={50}
                loop
              />
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="hero-subtitle"
          >
            Welcome to 4U Toys and Treats! Explore our curated collection of magical toys and adorable gifts for your loved ones. Handpicked with love and care!
          </motion.p>

          {!isLoggedIn && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="hero-cta" style={{ marginTop: '30px', display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <button className="btn-secondary" style={{ padding: '15px 30px', fontSize: '18px', background: 'var(--card-bg)' }}>Login</button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{ padding: '15px 30px', fontSize: '18px' }}>Sign Up</button>
              </Link>
            </motion.div>
          )}
        </section>

        <main style={{ padding: '0 5%', maxWidth: '1400px', margin: '0 auto' }}>

          {/* Loading States (Skeletons) */}
          {loading && (
            <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="products-grid">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <motion.div key={i} variants={fadeUp} className="product-card glass" style={{ height: '400px' }}>
                  <div className="skeleton" style={{ height: '240px', borderRadius: '0' }} />
                  <div style={{ padding: '24px' }}>
                    <div className="skeleton" style={{ height: '16px', width: '40%', marginBottom: '12px' }} />
                    <div className="skeleton" style={{ height: '24px', width: '80%', marginBottom: '20px' }} />
                    <div className="skeleton" style={{ height: '32px', width: '30%', marginBottom: '20px' }} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div className="skeleton" style={{ height: '44px', flex: 1, borderRadius: '12px' }} />
                      <div className="skeleton" style={{ height: '44px', flex: 1, borderRadius: '12px' }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#e63946' }}>
              <h2>Oops!</h2>
              <p>{error}</p>
            </div>
          )}

          {/* Main Content */}
          {!loading && !error && (
            <>
              {/* About the Shop Section */}
              {aboutInfo && (aboutInfo.description || aboutInfo.images?.length > 0 || aboutInfo.stats?.length > 0) && (
                <motion.div 
                  initial="hidden" 
                  whileInView="visible" 
                  viewport={{ once: true, margin: "-50px" }}
                  variants={fadeUp}
                  className="glass"
                  style={{ marginBottom: '60px', borderRadius: '30px', overflow: 'hidden', boxShadow: '0 15px 40px rgba(0,0,0,0.08)' }}
                >
                  <div className="about-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0' }}>
                    
                    {/* Left Column: Content & Graphs */}
                    <div style={{ padding: '50px 8%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h2 style={{ fontSize: '36px', marginBottom: '20px', color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Sparkles color="var(--primary)" size={32} /> About Us
                      </h2>
                      <p style={{ fontSize: '18px', lineHeight: 1.8, color: 'var(--text-muted)', marginBottom: '40px' }}>
                        {aboutInfo.description}
                      </p>

                      {/* Animated Horizontal Bar Graphs */}
                      {aboutInfo.stats?.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                          {aboutInfo.stats.map((stat, i) => {
                            // Calculate max value for relative width (defaulting to 100 if only 1 stat or smaller numbers)
                            const maxVal = Math.max(...aboutInfo.stats.map(s => s.value), 10);
                            const fillPercentage = Math.min((stat.value / maxVal) * 100, 100);

                            return (
                              <div key={i}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 700, fontSize: '16px' }}>
                                  <span style={{ color: 'var(--text)' }}>{stat.label}</span>
                                  <span style={{ color: 'var(--primary)', fontSize: '18px' }}>
                                    <CountUp end={stat.value} duration={2.5} separator="," enableScrollSpy scrollSpyOnce />
                                    {stat.suffix}
                                  </span>
                                </div>
                                <div style={{ height: '14px', background: 'var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${fillPercentage}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, delay: i * 0.2, ease: "easeOut" }}
                                    style={{ height: '100%', background: 'linear-gradient(90deg, var(--secondary), var(--primary))', borderRadius: '10px' }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right Column: Auto-changing Slideshow */}
                    {aboutInfo.images?.length > 0 && (
                      <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '400px', background: 'var(--secondary)', overflow: 'hidden' }}>
                        <AnimatePresence mode="popLayout">
                          <motion.img
                            key={activeImageIndex}
                            src={aboutInfo.images[activeImageIndex]}
                            alt="Shop"
                            initial={{ opacity: 0, scale: 1.05 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1.2, ease: "easeInOut" }}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </AnimatePresence>
                        
                        {/* Slide Indicators */}
                        <div style={{ position: 'absolute', bottom: '20px', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: '8px', zIndex: 10 }}>
                          {aboutInfo.images.map((_, i) => (
                            <div 
                              key={i} 
                              onClick={() => setActiveImageIndex(i)}
                              style={{ 
                                width: activeImageIndex === i ? '24px' : '8px', 
                                height: '8px', 
                                borderRadius: '4px', 
                                background: activeImageIndex === i ? '#fff' : 'rgba(255,255,255,0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                              }} 
                            />
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </motion.div>
              )}

              {/* AI Recommendation Section */}
              <motion.div 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
                style={{ marginBottom: '60px' }}
              >
                <h2 className="section-title">
                  <Sparkles color="var(--primary)" /> Recommended for you
                </h2>
                <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', paddingBottom: '20px', scrollbarWidth: 'none' }}>
                  {products.slice(0, 4).map((product, i) => {
                    const cat = categories.find(c => c.id === product.category);
                    return (
                      <motion.div 
                        key={`rec-${product._id}`}
                        whileHover={{ scale: 1.05 }}
                        className="glass"
                        style={{ minWidth: '280px', borderRadius: '20px', padding: '15px', display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
                        onClick={() => handleViewDetails(product)}
                      >
                        {product.images && product.images[0] ? (
                          <img src={product.images[0]} alt={product.name} style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                            {cat ? cat.icon : "🎁"}
                          </div>
                        )}
                        <div>
                          <h4 style={{ margin: '0 0 5px', fontSize: '16px' }}>{product.name}</h4>
                          <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>₹{(+product.price).toLocaleString()}</div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Categories */}
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <h2 className="section-title">Shop by Category</h2>
                <div className="category-scroll">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`cat-card glass ${activeCategory === "all" ? "active" : ""}`}
                    onClick={() => setActiveCategory("all")}
                  >
                    🌟 All Goodies
                  </motion.button>
                  {categories.map(cat => (
                    <motion.button 
                      key={cat._id} 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`cat-card glass ${activeCategory === cat.id ? "active" : ""}`}
                      onClick={() => setActiveCategory(cat.id)}
                    >
                      {cat.icon} {cat.label}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Products Grid */}
              <motion.div 
                variants={staggerContainer} 
                initial="hidden" 
                whileInView="visible" 
                viewport={{ once: true }} 
                className="products-grid"
              >
                {filteredProducts.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', opacity: 0.6 }}>
                    <h3>No magical items found in this category right now. 🦄</h3>
                  </div>
                ) : (
                  filteredProducts.map(product => {
                    const cat = categories.find(c => c.id === product.category);
                    return (
                      <motion.div 
                        key={product._id} 
                        variants={fadeUp}
                        whileHover={{ y: -10 }}
                        className="product-card glass"
                      >
                        {/* Wishlist Heart Icon overlay */}
                        <motion.button
                          whileHover={{ scale: 1.15, boxShadow: '0 6px 22px rgba(255,77,109,0.55)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleWishlist(product);
                          }}
                          style={{
                            position: "absolute",
                            top: "15px",
                            right: "15px",
                            zIndex: 20,
                            background: isInWishlist(product._id)
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

                        <div style={{ overflow: 'hidden' }}>
                          {product.images && product.images[0] ? (
                            <img src={product.images[0]} alt={product.name} className="product-img" />
                          ) : (
                            <div className="product-img-placeholder">{cat ? cat.icon : "🎁"}</div>
                          )}
                        </div>
                        
                        <div className="product-info">
                          <div className="product-cat">
                            {cat ? `${cat.icon} ${cat.label}` : product.category}
                          </div>
                          <h3 className="product-name">{product.name}</h3>
                          <div className="product-price">
                            ₹{(+product.price).toLocaleString("en-IN")}
                          </div>
                          
                          <div className="product-actions">
                            <Link 
                              to={`/product/${product._id}`}
                              className="btn-secondary"
                              style={{ textDecoration: 'none' }}
                            >
                              Details
                            </Link>
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              className="btn-primary" 
                              onClick={() => addToCart(product)}
                            >
                              <ShoppingBag size={18} /> Add
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </>
          )}
        </main>
      </div>
    </>
  );
};

export default HomePage;

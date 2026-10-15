import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Heart, ArrowLeft, Search, X, Glasses, CheckCircle, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';

const API = API_BASE_URL;

const scaleIn = {
  hidden:  { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

/**
 * Reusable Elevated Category Page Component
 */
const CategoryPageTemplate = ({ title, subtitle, emoji, filterKeyword, accentColor = '#FF3F9D' }) => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${API}/products`);
        const kw = filterKeyword.toLowerCase();
        const filtered = data.filter((p) =>
          (p.status === 'active' || p.status === 'low_stock' || !p.status) &&
          (
            p.category?.toLowerCase().includes(kw) ||
            p.name?.toLowerCase().includes(kw) ||
            p.subcategory?.toLowerCase().includes(kw) ||
            p.tags?.some((t) => t.toLowerCase().includes(kw))
          )
        );
        setProducts(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, [filterKeyword]);

  const filtered = products.filter((p) =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.quantity <= 0) {
      toast.error('This product is currently out of stock.');
      return;
    }
    if (!isLoggedIn) {
      toast.error('Please login to add items to cart! 🛍️');
      return;
    }
    setAddingId(product._id);
    addToCart(product);
    toast.success(`${product.name} added to cart! 🎉`);
    setTimeout(() => setAddingId(null), 1200);
  };

  const handleWishlist = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    const wished = isInWishlist(product._id);
    toggleWishlist(product);
    toast.success(wished ? 'Removed from wishlist' : 'Saved to wishlist! 💖');
  };

  return (
    <>
      <div style={{ height: 80 }} />

      {/* Hero Banner with Floating Emojis */}
      <section style={{
        background: 'linear-gradient(135deg, #2D1432 0%, #402044 50%, #562758 100%)',
        padding: 'clamp(48px, 9vw, 90px) 5% clamp(44px, 7vw, 76px)',
        textAlign: 'center',
        position: 'relative', overflow: 'hidden',
        color: '#FFFFFF',
      }}>
        {/* Glow Blobs */}
        <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(255, 99, 183, 0.25) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(128, 87, 232, 0.25) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }} />

        {/* Back Button */}
        <motion.button
          onClick={() => navigate(-1)}
          whileHover={{ x: -4, scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          style={{
            position: 'absolute', top: 24, left: '5%',
            background: 'rgba(255, 255, 255, 0.15)', border: '1px solid rgba(255, 255, 255, 0.25)',
            borderRadius: 'var(--radius-pill)', padding: '8px 18px',
            display: 'flex', alignItems: 'center', gap: 6,
            color: '#FFFFFF', fontWeight: 800, fontSize: 13,
            cursor: 'pointer', backdropFilter: 'blur(10px)', fontFamily: 'inherit',
          }}
        >
          <ArrowLeft size={15} /> {t('category.back', 'Back')}
        </motion.button>

        {/* Animated Emoji Charm */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ fontSize: 'clamp(52px, 8vw, 76px)', marginBottom: 14 }}
        >
          {emoji}
        </motion.div>

        {/* Category Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(30px, 5.5vw, 52px)',
            fontWeight: 900,
            margin: '0 0 14px',
            background: 'linear-gradient(135deg, #FFFFFF 30%, #FFD86F 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ fontSize: 'clamp(14px, 2vw, 17px)', color: 'rgba(255, 255, 255, 0.85)', maxWidth: 580, margin: '0 auto 28px', lineHeight: 1.6 }}
        >
          {subtitle}
        </motion.p>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ position: 'relative', maxWidth: 440, margin: '0 auto' }}
        >
          <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#FF3F9D', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder={t('category.searchIn', { category: title, defaultValue: `Search in ${title}…` })}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 42px 12px 44px',
              borderRadius: 'var(--radius-pill)',
              border: '1.5px solid rgba(255, 99, 183, 0.3)',
              background: 'rgba(255, 255, 255, 0.95)',
              color: 'var(--plum)', fontSize: 14,
              outline: 'none', fontFamily: 'inherit',
              boxSizing: 'border-box', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}
            >
              <X size={15} />
            </button>
          )}
        </motion.div>
      </section>

      {/* Products Workspace */}
      <div style={{ background: '#FFF9FC', minHeight: '55vh', padding: 'clamp(36px, 5vw, 56px) 5% clamp(60px, 8vw, 90px)' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>

          {/* Result Count */}
          {!loading && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <p style={{ fontSize: 14, color: 'var(--plum)', fontWeight: 700, margin: 0 }}>
                {t('category.showingItems', { count: filtered.length, defaultValue: `Showing ${filtered.length} items in this collection` })}
              </p>
              <Link to="/shop" style={{ textDecoration: 'none', fontSize: 13, fontWeight: 800, color: '#8057E8' }}>
                {t('category.viewAllCategories', 'View All Categories →')}
              </Link>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px, 100%), 1fr))', gap: 24 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ background: '#FFFFFF', borderRadius: '26px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(64, 32, 68, 0.05)' }}>
                  <div className="skeleton" style={{ height: 250 }} />
                  <div style={{ padding: 18 }}>
                    <div className="skeleton" style={{ height: 12, width: '40%', marginBottom: 10, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 18, width: '80%', marginBottom: 8, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 26, width: '35%', marginBottom: 14, borderRadius: 6 }} />
                    <div className="skeleton" style={{ height: 42, borderRadius: 100 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: '28px', border: '1.5px dashed rgba(255, 99, 183, 0.3)', maxWidth: 560, margin: '40px auto' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--plum)', marginBottom: 8 }}>
                {search ? t('category.noMatches', 'No matches found') : t('category.noProductsYet', 'No products in this collection yet')}
              </h3>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: 14, lineHeight: 1.6 }}>
                {search ? t('category.tryDifferent', 'Try a different search keyword.') : t('category.checkBackSoon', 'Check back soon — our curators are adding new magical treats!')}
              </p>
              <Link to="/shop">
                <button style={{
                  padding: '12px 28px',
                  background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                  color: '#fff', border: 'none', borderRadius: 'var(--radius-pill)',
                  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
                  cursor: 'pointer', boxShadow: '0 8px 20px rgba(255, 63, 157, 0.35)',
                }}>
                  {t('category.browseAll', 'Browse All Products')}
                </button>
              </Link>
            </div>
          ) : (
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px, 100%), 1fr))', gap: 24 }}
            >
              <AnimatePresence>
                {filtered.map((product) => {
                  const wished = isInWishlist(product._id);
                  const isOutOfStock = product.quantity <= 0;
                  const isLowStock = product.quantity > 0 && product.quantity <= 2;
                  const adding = addingId === product._id;

                  return (
                    <motion.div
                      key={product._id}
                      variants={scaleIn}
                      layout
                      whileHover={{ y: -8, transition: { duration: 0.25 } }}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '26px',
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(64, 32, 68, 0.07)',
                        border: '1.5px solid rgba(255, 99, 183, 0.18)',
                        display: 'flex', flexDirection: 'column',
                        position: 'relative',
                        transition: 'border-color 0.3s, box-shadow 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 63, 157, 0.55)';
                        e.currentTarget.style.boxShadow = '0 20px 45px rgba(255, 63, 157, 0.16)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(255, 99, 183, 0.18)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(64, 32, 68, 0.07)';
                      }}
                    >
                      {/* Top Badges */}
                      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {product.model3d && (
                          <div style={{
                            padding: '4px 10px', borderRadius: 'var(--radius-pill)',
                            background: 'linear-gradient(135deg, #8057E8, #A78BFA)',
                            color: '#fff', fontSize: 11, fontWeight: 800,
                            boxShadow: '0 4px 12px rgba(128, 87, 232, 0.35)',
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            <Glasses size={12} /> 3D AR
                          </div>
                        )}

                        {isOutOfStock ? (
                          <div style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'rgba(239, 68, 68, 0.92)', color: '#fff', fontSize: 11, fontWeight: 800 }}>
                            Out of Stock
                          </div>
                        ) : isLowStock ? (
                          <div style={{ padding: '4px 10px', borderRadius: 'var(--radius-pill)', background: 'linear-gradient(135deg, #FFD86F, #FFC043)', color: '#402044', fontSize: 11, fontWeight: 800 }}>
                            Only {product.quantity} Left!
                          </div>
                        ) : null}
                      </div>

                      {/* Wishlist Button */}
                      <motion.button
                        whileHover={{ scale: 1.15 }}
                        whileTap={{ scale: 0.88 }}
                        onClick={(e) => handleWishlist(e, product)}
                        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                        style={{
                          position: 'absolute', top: 12, right: 12, zIndex: 10,
                          width: 38, height: 38, borderRadius: '50%',
                          background: wished ? 'linear-gradient(135deg, #FF3F9D, #C9184A)' : 'rgba(255,255,255,0.92)',
                          border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 4px 14px rgba(64, 32, 68, 0.12)',
                          backdropFilter: 'blur(8px)',
                        }}
                      >
                        <Heart size={16} fill={wished ? '#fff' : 'none'} color={wished ? '#fff' : '#FF3F9D'} />
                      </motion.button>

                      {/* Product Image */}
                      <Link to={`/product/${product._id}`} style={{ display: 'block', overflow: 'hidden', height: 250, background: 'linear-gradient(135deg, #FFF0F7, #F3E8FF)', position: 'relative' }}>
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            loading="lazy"
                            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 16, transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)', display: 'block' }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
                            {emoji}
                          </div>
                        )}
                      </Link>

                      {/* Card Content */}
                      <div style={{ padding: '18px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#FF3F9D', marginBottom: 6 }}>
                          {product.category}
                        </span>

                        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', flexGrow: 1 }}>
                          <h3
                            style={{
                              fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--plum)',
                              lineHeight: 1.35, margin: '0 0 10px', transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#FF3F9D')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--plum)')}
                          >
                            {product.name}
                          </h3>
                        </Link>

                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: '#FF3F9D' }}>
                            ₹{(+product.price).toLocaleString('en-IN')}
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                            {product.quantity > 0 ? `${product.quantity} in stock` : 'Sold out'}
                          </span>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => navigate(`/product/${product._id}`)}
                            style={{
                              flex: 1, padding: '10px 0',
                              border: '1.5px solid rgba(255, 63, 157, 0.35)',
                              borderRadius: 'var(--radius-pill)',
                              background: 'transparent', color: '#FF3F9D',
                              fontWeight: 800, fontSize: 13, cursor: 'pointer',
                              fontFamily: 'inherit',
                            }}
                          >
                            {t('shop.details', 'Details')}
                          </button>

                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            disabled={isOutOfStock}
                            onClick={(e) => handleAdd(e, product)}
                            style={{
                              flex: 1.3, padding: '10px 0',
                              background: isOutOfStock
                                ? '#e5e7eb'
                                : adding
                                ? '#72E6B0'
                                : 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                              border: 'none', borderRadius: 'var(--radius-pill)',
                              color: isOutOfStock ? '#9ca3af' : adding ? '#064e3b' : '#fff',
                              fontWeight: 800, fontSize: 13,
                              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                              boxShadow: isOutOfStock ? 'none' : '0 6px 16px rgba(255, 63, 157, 0.35)',
                            }}
                          >
                            {adding ? <CheckCircle size={15} /> : <ShoppingBag size={15} />}
                            {isOutOfStock ? t('shop.soldOut', 'Sold Out') : adding ? t('shop.added', 'Added!') : t('shop.addToCart', 'Add to Cart')}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default CategoryPageTemplate;

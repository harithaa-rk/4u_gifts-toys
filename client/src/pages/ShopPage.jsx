import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag, Search, Heart, X, ChevronDown,
  Glasses, CheckCircle, Sparkles, Filter, SlidersHorizontal,
  ArrowUpDown, Eye, RotateCcw, PackageCheck, Zap
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';
import ARViewer from '../components/product/ARViewer';

const API = API_BASE_URL;

/* ── Animation Variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const scaleCard = {
  hidden: { opacity: 0, scale: 0.94, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Interactive 3D Product Card Component ── */
const ProductCard = ({ product, cat, addToCart, toggleWishlist, isInWishlist, isLoggedIn, onQuickAR }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const wished = isInWishlist(product._id);
  const [adding, setAdding] = useState(false);
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 2;

  const handleAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error(t('shop.outOfStock', 'This product is currently out of stock.'));
      return;
    }
    if (!isLoggedIn) {
      toast.error(t('auth.loginRequired', 'Please login to add items to cart! 🛍️'));
      return;
    }
    setAdding(true);
    addToCart(product);
    toast.success(`${product.name} ${t('shop.added', 'added to cart! 🎉')}`);
    setTimeout(() => setAdding(false), 1200);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast.success(wished ? 'Removed from wishlist' : 'Saved to wishlist! 💖');
  };

  return (
    <motion.div
      variants={scaleCard}
      layout
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
      style={{
        background: '#FFFFFF',
        borderRadius: '26px',
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(64, 32, 68, 0.07)',
        border: '1.5px solid rgba(255, 99, 183, 0.18)',
        display: 'flex',
        flexDirection: 'column',
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
      {/* Top Badges (Stock & AR) */}
      <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {product.model3d && (
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickAR(product);
            }}
            title={t('shop.quickAR', 'Click to view 3D interactive model!')}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--radius-pill)',
              background: 'linear-gradient(135deg, #8057E8, #A78BFA)',
              color: '#fff',
              fontSize: 11,
              fontWeight: 800,
              boxShadow: '0 4px 12px rgba(128, 87, 232, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Glasses size={12} /> {t('shop.arBadge', '3D AR')}
          </motion.button>
        )}

        {isOutOfStock ? (
          <div style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            background: 'rgba(239, 68, 68, 0.92)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)',
          }}>
            {t('shop.outOfStock', 'Out of Stock')}
          </div>
        ) : isLowStock ? (
          <div style={{
            padding: '4px 10px',
            borderRadius: 'var(--radius-pill)',
            background: 'linear-gradient(135deg, #FFD86F, #FFC043)',
            color: '#402044',
            fontSize: 11,
            fontWeight: 800,
            boxShadow: '0 4px 12px rgba(255, 216, 111, 0.4)',
          }}>
            {t('shop.onlyLeft', { count: product.quantity, defaultValue: `Only ${product.quantity} Left!` })}
          </div>
        ) : null}
      </div>

      {/* Wishlist Button */}
      <motion.button
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.88 }}
        onClick={handleWishlist}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 10,
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: wished ? 'linear-gradient(135deg, #FF3F9D, #C9184A)' : 'rgba(255,255,255,0.92)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(64, 32, 68, 0.12)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <Heart size={16} fill={wished ? '#fff' : 'none'} color={wished ? '#fff' : '#FF3F9D'} />
      </motion.button>

      {/* Product Image Link */}
      <Link
        to={`/product/${product._id}`}
        style={{
          display: 'block',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #FFF0F7, #F3E8FF)',
          height: 250,
          position: 'relative',
        }}
      >
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              padding: 16,
              transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'block',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
            {cat?.icon || '🎁'}
          </div>
        )}
      </Link>

      {/* Card Body */}
      <div style={{ padding: '18px 18px 16px', flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#FF3F9D', marginBottom: 6 }}>
          {cat ? `${cat.icon || '🛍️'} ${cat.label}` : product.category}
        </span>

        <Link to={`/product/${product._id}`} style={{ textDecoration: 'none', flexGrow: 1 }}>
          <h3
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 16,
              fontWeight: 800,
              color: 'var(--plum)',
              lineHeight: 1.35,
              margin: '0 0 10px',
              transition: 'color 0.2s',
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
            {product.quantity > 0 ? `${product.quantity} ${t('shop.inStock', 'in stock')}` : t('shop.soldOut', 'Sold out')}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(`/product/${product._id}`)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: '1.5px solid rgba(255, 63, 157, 0.35)',
              borderRadius: 'var(--radius-pill)',
              background: 'transparent',
              color: '#FF3F9D',
              fontWeight: 800,
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#FFF0F5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {t('shop.details', 'Details')}
          </button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={isOutOfStock}
            onClick={handleAdd}
            style={{
              flex: 1.3,
              padding: '10px 0',
              background: isOutOfStock
                ? '#e5e7eb'
                : adding
                ? '#72E6B0'
                : 'linear-gradient(135deg, #FF3F9D, #8057E8)',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              color: isOutOfStock ? '#9ca3af' : adding ? '#064e3b' : '#fff',
              fontWeight: 800,
              fontSize: 13,
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: isOutOfStock ? 'none' : '0 6px 16px rgba(255, 63, 157, 0.35)',
              transition: 'background 0.3s',
            }}
          >
            {adding ? <CheckCircle size={15} /> : <ShoppingBag size={15} />}
            {isOutOfStock ? t('shop.soldOut', 'Sold Out') : adding ? t('shop.added', 'Added!') : t('shop.addToCart', 'Add to Cart')}
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

/* ── Main Shop Page ── */
const ShopPage = () => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // URL query params & local filters
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [priceRange, setPriceRange] = useState('all'); // 'all' | 'under500' | '500-1000' | 'above1000'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [arOnly, setArOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');

  // Quick 3D AR Viewer Modal state
  const [active3DProduct, setActive3DProduct] = useState(null);

  // Sync search with searchParams
  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    if (searchParams.get('category')) {
      setActiveCategory(searchParams.get('category'));
    }
  }, [searchParams]);

  const handleSearchChange = (value) => {
    setSearch(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('search', value);
    } else {
      params.delete('search');
    }
    setSearchParams(params);
  };

  const handleCategorySelect = (catId) => {
    setActiveCategory(catId);
    const params = new URLSearchParams(searchParams);
    if (catId !== 'all') {
      params.set('category', catId);
    } else {
      params.delete('category');
    }
    setSearchParams(params);
  };

  // Fetch Real Data from MongoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/categories`),
        ]);
        setProducts(prodRes.data.filter((p) => p.status === 'active' || p.status === 'low_stock' || !p.status));
        setCategories(catRes.data);
      } catch (err) {
        console.error('Error fetching shop catalog:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        const matchCat =
          activeCategory === 'all' ||
          p.category === activeCategory ||
          p.category?.toLowerCase() === activeCategory?.toLowerCase();

        // Search filter
        const matchSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.category?.toLowerCase().includes(search.toLowerCase()) ||
          p.description?.toLowerCase().includes(search.toLowerCase());

        // Price range filter
        let matchPrice = true;
        const price = +p.price;
        if (priceRange === 'under500') matchPrice = price < 500;
        else if (priceRange === '500-1000') matchPrice = price >= 500 && price <= 1000;
        else if (priceRange === 'above1000') matchPrice = price > 1000;

        // Stock filter
        const matchStock = inStockOnly ? p.quantity > 0 : true;

        // AR 3D filter
        const matchAR = arOnly ? Boolean(p.model3d) : true;

        return matchCat && matchSearch && matchPrice && matchStock && matchAR;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, activeCategory, search, priceRange, inStockOnly, arOnly, sortBy]);

  // Statistics counters
  const totalStockCount = useMemo(() => products.filter((p) => p.quantity > 0).length, [products]);
  const totalARCount = useMemo(() => products.filter((p) => Boolean(p.model3d)).length, [products]);

  const hasActiveFilters =
    search !== '' ||
    activeCategory !== 'all' ||
    priceRange !== 'all' ||
    inStockOnly ||
    arOnly ||
    sortBy !== 'default';

  const resetAllFilters = () => {
    handleSearchChange('');
    setActiveCategory('all');
    setPriceRange('all');
    setInStockOnly(false);
    setArOnly(false);
    setSortBy('default');
    setSearchParams({});
  };

  return (
    <>
      {/* Top spacing for fixed header */}
      <div style={{ height: 80 }} />

      {/* ── Cinematic Hero Banner with Floating Charms ── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(135deg, #2D1432 0%, #402044 50%, #562758 100%)',
          padding: 'clamp(44px, 8vw, 84px) 5% clamp(40px, 6vw, 68px)',
          textAlign: 'center',
          color: '#FFFFFF',
        }}
      >
        {/* Glowing Background Radial Blobs */}
        <div
          style={{
            position: 'absolute',
            top: '-25%',
            left: '10%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(255, 99, 183, 0.28) 0%, transparent 70%)',
            filter: 'blur(50px)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '10%',
            width: '450px',
            height: '450px',
            background: 'radial-gradient(circle, rgba(128, 87, 232, 0.28) 0%, transparent 70%)',
            filter: 'blur(60px)',
            pointerEvents: 'none',
          }}
        />

        {/* Ambient Floating 3D Charms */}
        <motion.div
          animate={{ y: [0, -14, 0], rotate: [0, 8, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '15%', left: '7%', fontSize: 'clamp(32px, 4vw, 48px)', pointerEvents: 'none', opacity: 0.85 }}
        >
          🧸
        </motion.div>
        <motion.div
          animate={{ y: [0, 16, 0], rotate: [0, -10, 8, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          style={{ position: 'absolute', bottom: '20%', left: '12%', fontSize: 'clamp(28px, 3.5vw, 42px)', pointerEvents: 'none', opacity: 0.8 }}
        >
          🎀
        </motion.div>
        <motion.div
          animate={{ y: [0, -18, 0], rotate: [0, 12, -10, 0] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{ position: 'absolute', top: '20%', right: '8%', fontSize: 'clamp(34px, 4vw, 50px)', pointerEvents: 'none', opacity: 0.85 }}
        >
          ✨
        </motion.div>
        <motion.div
          animate={{ y: [0, 12, 0], rotate: [0, -8, 6, 0] }}
          transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
          style={{ position: 'absolute', bottom: '18%', right: '14%', fontSize: 'clamp(28px, 3vw, 40px)', pointerEvents: 'none', opacity: 0.8 }}
        >
          🌟
        </motion.div>

        {/* Hero Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.12 } } }}
          style={{ position: 'relative', zIndex: 2, maxWidth: 840, margin: '0 auto' }}
        >
          {/* Official Boutique Ribbon */}
          <motion.div variants={fadeUp} style={{ display: 'inline-block', marginBottom: 16 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 20px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255, 99, 183, 0.16)',
                border: '1px solid rgba(255, 99, 183, 0.35)',
                backdropFilter: 'blur(12px)',
                color: '#FF63B7',
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '1px',
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={14} color="#FF63B7" />
              <span>{t('shop.ribbon', '4U Toys & Treats • Boutique Catalog')}</span>
              <Sparkles size={14} color="#FF63B7" />
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={fadeUp}
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5.5vw, 56px)',
              fontWeight: 900,
              lineHeight: 1.15,
              margin: '0 0 16px',
              background: 'linear-gradient(135deg, #FFFFFF 30%, #FFD86F 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('shop.title', 'Discover Magical Gifts & 3D Toys')}
          </motion.h1>

          {/* Tagline */}
          <motion.p
            variants={fadeUp}
            style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 1.6,
              margin: '0 auto 28px',
              maxWidth: 640,
            }}
          >
            {t('shop.subtitle', 'Every piece is chosen with boundless love. Explore whimsical plushies, bespoke gift sets, and interactive 3D AR models.')}
          </motion.p>

          {/* Live Boutique Stats Badges */}
          <motion.div
            variants={fadeUp}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(8px)',
              }}
            >
              <PackageCheck size={14} color="#72E6B0" />
              <span>{loading ? '...' : products.length} {t('shop.goodies', 'Real Products')}</span>
            </div>

            <div
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Glasses size={14} color="#A78BFA" />
              <span>{loading ? '...' : totalARCount} {t('shop.arReadyOnly', '3D AR Ready')}</span>
            </div>

            <div
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-pill)',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(8px)',
              }}
            >
              <Zap size={14} color="#FFD86F" />
              <span>{t('hero.happinessGuarantee', '100% Happiness Guaranteed')}</span>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Main Catalog Workspace ── */}
      <div style={{ background: '#FFF9FC', minHeight: '65vh', padding: '0 5% clamp(60px, 8vw, 100px)' }}>
        <div style={{ maxWidth: 1360, margin: '0 auto' }}>

          {/* ── Category Pill Filter Carousel ── */}
          <div
            style={{
              padding: '24px 0 16px',
              display: 'flex',
              gap: 10,
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {/* All Category Pill */}
            <motion.button
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleCategorySelect('all')}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-pill)',
                border: `2px solid ${activeCategory === 'all' ? '#FF3F9D' : 'rgba(255, 99, 183, 0.25)'}`,
                background: activeCategory === 'all'
                  ? 'linear-gradient(135deg, #FF3F9D, #8057E8)'
                  : '#FFFFFF',
                color: activeCategory === 'all' ? '#FFFFFF' : 'var(--plum)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 800,
                fontSize: 14,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: activeCategory === 'all'
                  ? '0 8px 20px rgba(255, 63, 157, 0.35)'
                  : '0 2px 8px rgba(64, 32, 68, 0.05)',
                transition: 'all 0.25s',
              }}
            >
              <span>🌟</span>
              <span>{t('shop.allCategories', 'All Goodies')}</span>
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 10,
                  background: activeCategory === 'all' ? 'rgba(255,255,255,0.25)' : '#FFF0F7',
                  color: activeCategory === 'all' ? '#fff' : '#FF3F9D',
                  fontWeight: 900,
                }}
              >
                {products.length}
              </span>
            </motion.button>

            {/* Dynamic Real Categories */}
            {categories.map((cat) => {
              const catCount = products.filter(
                (p) => p.category === cat.id || p.category === cat.label || p.category?.toLowerCase() === cat.id?.toLowerCase()
              ).length;
              const isActive = activeCategory === cat.id || activeCategory === cat.label;

              return (
                <motion.button
                  key={cat._id || cat.id}
                  whileHover={{ y: -3, scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCategorySelect(cat.id)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 'var(--radius-pill)',
                    border: `2px solid ${isActive ? '#FF3F9D' : 'rgba(255, 99, 183, 0.22)'}`,
                    background: isActive
                      ? 'linear-gradient(135deg, #FF3F9D, #8057E8)'
                      : '#FFFFFF',
                    color: isActive ? '#FFFFFF' : 'var(--plum)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontWeight: 800,
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    boxShadow: isActive
                      ? '0 8px 20px rgba(255, 63, 157, 0.35)'
                      : '0 2px 8px rgba(64, 32, 68, 0.05)',
                    transition: 'all 0.25s',
                  }}
                >
                  <span>{cat.icon || '🎁'}</span>
                  <span>{cat.label}</span>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: isActive ? 'rgba(255,255,255,0.25)' : '#FFF0F7',
                      color: isActive ? '#fff' : '#FF3F9D',
                      fontWeight: 900,
                    }}
                  >
                    {catCount}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* ── Toolbar & Filter Controls ── */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1.5px solid rgba(255, 99, 183, 0.2)',
              borderRadius: '24px',
              padding: '16px 22px',
              boxShadow: '0 8px 26px rgba(64, 32, 68, 0.06)',
              margin: '12px 0 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Row 1: Search, Sort & Quick Count */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              {/* Product Count Indicator */}
              <div style={{ color: 'var(--plum)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>{t('shop.showing', 'Showing')}</span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    background: '#FFF0F7',
                    color: '#FF3F9D',
                    fontWeight: 900,
                  }}
                >
                  {filteredProducts.length}
                </span>
                <span>{t('shop.of', 'of')} {products.length} {t('shop.goodies', 'goodies')}</span>
                {search && (
                  <span style={{ color: 'var(--text-muted)' }}>
                    {t('shop.forQuery', 'for')} "<strong style={{ color: '#FF3F9D' }}>{search}</strong>"
                  </span>
                )}
              </div>

              {/* Search Box & Sort */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Search Input */}
                <div style={{ position: 'relative', minWidth: 220, maxWidth: 300 }}>
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#FF3F9D',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    type="text"
                    placeholder={t('shop.searchPlaceholder', 'Search toys & gifts…')}
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    aria-label="Search products"
                    style={{
                      width: '100%',
                      padding: '9px 36px 9px 38px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1.5px solid rgba(255, 99, 183, 0.25)',
                      background: '#FFF9FC',
                      color: 'var(--plum)',
                      fontSize: 14,
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#FF3F9D';
                      e.target.style.boxShadow = '0 0 0 3px rgba(255, 63, 157, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = 'rgba(255, 99, 183, 0.25)';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => handleSearchChange('')}
                      aria-label="Clear search"
                      style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        display: 'flex',
                      }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    aria-label="Sort products"
                    style={{
                      padding: '9px 36px 9px 14px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1.5px solid rgba(255, 99, 183, 0.25)',
                      background: '#FFF9FC',
                      color: 'var(--plum)',
                      fontSize: 14,
                      outline: 'none',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 700,
                      appearance: 'none',
                    }}
                  >
                    <option value="default">{t('shop.sortDefault', 'Sort: Featured')}</option>
                    <option value="price-asc">{t('shop.sortPriceAsc', 'Price: Low to High')}</option>
                    <option value="price-desc">{t('shop.sortPriceDesc', 'Price: High to Low')}</option>
                    <option value="name">{t('shop.sortName', 'Name: A to Z')}</option>
                  </select>
                  <ChevronDown
                    size={14}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#FF3F9D',
                      pointerEvents: 'none',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Row 2: Price Filters & Quick Feature Toggles */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: '1px solid rgba(255, 99, 183, 0.12)',
                paddingTop: 12,
                gap: 12,
              }}
            >
              {/* Price Range Pills */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginRight: 4 }}>
                  {t('shop.price', 'Price')}:
                </span>
                {[
                  { id: 'all', label: t('shop.priceAll', 'All Prices') },
                  { id: 'under500', label: t('shop.under500', 'Under ₹500') },
                  { id: '500-1000', label: t('shop.from500to1000', '₹500 - ₹1,000') },
                  { id: 'above1000', label: t('shop.above1000', 'Above ₹1,000') },
                ].map((item) => {
                  const isSelected = priceRange === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setPriceRange(item.id)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-pill)',
                        border: `1.5px solid ${isSelected ? '#FF3F9D' : 'rgba(255, 99, 183, 0.2)'}`,
                        background: isSelected ? '#FFF0F7' : 'transparent',
                        color: isSelected ? '#FF3F9D' : 'var(--plum)',
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s',
                      }}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {/* Toggles: In-Stock & 3D AR */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* In-Stock Toggle */}
                <button
                  onClick={() => setInStockOnly(!inStockOnly)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    border: `1.5px solid ${inStockOnly ? '#72E6B0' : 'rgba(255, 99, 183, 0.2)'}`,
                    background: inStockOnly ? 'rgba(114, 230, 176, 0.18)' : 'transparent',
                    color: inStockOnly ? '#065f46' : 'var(--plum)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'inherit',
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: inStockOnly ? '#10b981' : '#d1d5db',
                    }}
                  />
                  <span>{t('shop.inStockOnly', 'In Stock Only')}</span>
                </button>

                {/* 3D AR Only Toggle */}
                <button
                  onClick={() => setArOnly(!arOnly)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-pill)',
                    border: `1.5px solid ${arOnly ? '#8057E8' : 'rgba(255, 99, 183, 0.2)'}`,
                    background: arOnly ? 'rgba(128, 87, 232, 0.15)' : 'transparent',
                    color: arOnly ? '#8057E8' : 'var(--plum)',
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'inherit',
                  }}
                >
                  <Glasses size={13} color={arOnly ? '#8057E8' : 'var(--plum)'} />
                  <span>{t('shop.arReadyOnly', '3D AR Ready')} ({totalARCount})</span>
                </button>

                {/* Reset All Filters button */}
                {hasActiveFilters && (
                  <button
                    onClick={resetAllFilters}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1.5px solid rgba(255, 63, 157, 0.35)',
                      background: '#FFF0F7',
                      color: '#FF3F9D',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontFamily: 'inherit',
                    }}
                  >
                    <RotateCcw size={12} />
                    <span>{t('shop.resetAll', 'Reset All')}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Product Catalog Grid ── */}
          <main>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px, 100%), 1fr))', gap: 24 }}>
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: '26px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(64, 32, 68, 0.05)',
                    }}
                  >
                    <div className="skeleton" style={{ height: 250 }} />
                    <div style={{ padding: 18 }}>
                      <div className="skeleton" style={{ height: 12, width: '35%', marginBottom: 10, borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 20, width: '75%', marginBottom: 8, borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 26, width: '40%', marginBottom: 14, borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 42, borderRadius: 100 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <motion.div
                  layout
                  variants={stagger}
                  initial="hidden"
                  animate="visible"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px, 100%), 1fr))',
                    gap: 24,
                  }}
                >
                  <AnimatePresence>
                    {filteredProducts.map((p) => {
                      const cat = categories.find((c) => c.id === p.category || c.label === p.category);
                      return (
                        <ProductCard
                          key={p._id}
                          product={p}
                          cat={cat}
                          addToCart={addToCart}
                          toggleWishlist={toggleWishlist}
                          isInWishlist={isInWishlist}
                          isLoggedIn={isLoggedIn}
                          onQuickAR={(product) => setActive3DProduct(product)}
                        />
                      );
                    })}
                  </AnimatePresence>
                </motion.div>

                {/* Empty State */}
                {filteredProducts.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      textAlign: 'center',
                      padding: '80px 20px',
                      background: '#FFFFFF',
                      borderRadius: '28px',
                      border: '1.5px dashed rgba(255, 99, 183, 0.3)',
                      maxWidth: 600,
                      margin: '40px auto',
                    }}
                  >
                    <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--plum)', marginBottom: 10 }}>
                      {t('shop.noItemsFound', 'No magical goodies found')}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                      {t('shop.noItemsDesc', "We couldn't find any products matching your specific filters. Try loosening your search criteria or resetting filters.")}
                    </p>
                    <button
                      onClick={resetAllFilters}
                      style={{
                        padding: '12px 28px',
                        background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-pill)',
                        fontFamily: 'var(--font-display)',
                        fontWeight: 800,
                        fontSize: 15,
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(255, 63, 157, 0.35)',
                      }}
                    >
                      {t('shop.clearFilters', 'Clear All Filters')}
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ── Quick 3D AR Viewer Modal ── */}
      <AnimatePresence>
        {active3DProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(40, 16, 44, 0.85)',
              backdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setActive3DProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#FFFFFF',
                borderRadius: '32px',
                width: '100%',
                maxWidth: 680,
                maxHeight: '90vh',
                overflow: 'hidden',
                boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '20px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255, 99, 183, 0.15)',
                  background: 'linear-gradient(135deg, #FFF0F7, #FFFFFF)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #8057E8, #A78BFA)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Glasses size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--plum)', margin: 0 }}>
                      {active3DProduct.name}
                    </h3>
                    <span style={{ fontSize: 12, color: '#8057E8', fontWeight: 700 }}>
                      {t('shop.quickAR', 'Interactive 3D / AR View')}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setActive3DProduct(null)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: '#FFF0F7',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FF3F9D',
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              {/* 3D Model Body */}
              <div style={{ height: 420, position: 'relative', background: '#F8FAFC' }}>
                <ARViewer
                  model={active3DProduct.model3d}
                  images={active3DProduct.images || []}
                  poster={active3DProduct.images?.[0]}
                  productName={active3DProduct.name}
                />
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: '16px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#FFFFFF',
                  borderTop: '1px solid rgba(255, 99, 183, 0.15)',
                }}
              >
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: '#FF3F9D' }}>
                  ₹{(+active3DProduct.price).toLocaleString('en-IN')}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => {
                      const id = active3DProduct._id;
                      setActive3DProduct(null);
                      navigate(`/product/${id}`);
                    }}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 'var(--radius-pill)',
                      border: '1.5px solid rgba(255, 63, 157, 0.35)',
                      background: 'transparent',
                      color: '#FF3F9D',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {t('shop.details', 'View Details')}
                  </button>

                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        toast.error(t('auth.loginRequired', 'Please login to add items to cart! 🛍️'));
                        return;
                      }
                      addToCart(active3DProduct);
                      toast.success(`${active3DProduct.name} ${t('shop.added', 'added to cart! 🎉')}`);
                      setActive3DProduct(null);
                    }}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                      border: 'none',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(255, 63, 157, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ShoppingBag size={15} /> {t('shop.addToCart', 'Add to Cart')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ShopPage;

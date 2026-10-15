import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import {
  ShoppingBag, Heart, Sparkles, ArrowRight, Gift, Star,
  Shield, Package, Headphones, Eye, ChevronRight, CheckCircle,
  Glasses, Clock, Award
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../utils/constants';
import CountUp from 'react-countup';
import toast from 'react-hot-toast';
import VendingMachineHero from '../components/vendingMachine/VendingMachineHero';

const API = API_BASE_URL;

/* ── Animation Presets ── */
const fadeUp = {
  hidden:  { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] } },
};
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const scaleIn = {
  hidden:  { opacity: 0, scale: 0.92, y: 20 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
};

/* ── Interactive 3D Product Card ── */
const ProductCard = ({ product, cat, addToCart, toggleWishlist, isInWishlist, onView, isLoggedIn }) => {
  const { t } = useTranslation();
  const wished = isInWishlist(product._id);
  const [adding, setAdding] = useState(false);
  const isOutOfStock = product.quantity <= 0;
  const isLowStock = product.quantity > 0 && product.quantity <= 2;

  const handleAdd = (e) => {
    e.stopPropagation();
    if (isOutOfStock) {
      toast.error('This product is currently out of stock.');
      return;
    }
    if (!isLoggedIn) {
      toast.error('Please login to add items to cart! 🛍️');
      return;
    }
    setAdding(true);
    addToCart(product);
    toast.success(`${product.name} added to cart! 🎉`);
    setTimeout(() => setAdding(false), 1200);
  };

  return (
    <motion.div
      variants={scaleIn}
      whileHover={{ y: -10, transition: { duration: 0.25 } }}
      style={{
        background: '#FFFFFF',
        borderRadius: '28px',
        overflow: 'hidden',
        boxShadow: '0 12px 36px rgba(64, 32, 68, 0.08)',
        border: '1.5px solid rgba(255, 99, 183, 0.22)',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: 'pointer',
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
      onClick={() => onView(product)}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 63, 157, 0.5)';
        e.currentTarget.style.boxShadow = '0 20px 48px rgba(255, 63, 157, 0.16)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 99, 183, 0.22)';
        e.currentTarget.style.boxShadow = '0 12px 36px rgba(64, 32, 68, 0.08)';
      }}
    >
      {/* Top Badges (Stock & AR) */}
      <div style={{ position: 'absolute', top: 14, left: 14, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
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
          <div style={{
            padding: '4px 10px', borderRadius: 'var(--radius-pill)',
            background: 'rgba(239, 68, 68, 0.9)',
            color: '#fff', fontSize: 11, fontWeight: 800,
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
          }}>
            {t('shop.outOfStock', 'Out of Stock')}
          </div>
        ) : isLowStock ? (
          <div style={{
            padding: '4px 10px', borderRadius: 'var(--radius-pill)',
            background: 'linear-gradient(135deg, #FFD86F, #FFC043)',
            color: '#402044', fontSize: 11, fontWeight: 800,
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
        onClick={(e) => {
          e.stopPropagation();
          toggleWishlist(product);
          toast.success(wished ? 'Removed from wishlist' : 'Saved to wishlist! 💖');
        }}
        aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        style={{
          position: 'absolute', top: 14, right: 14, zIndex: 10,
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

      {/* Product Image Presentation */}
      <div style={{ overflow: 'hidden', background: 'linear-gradient(135deg, #FFF0F7, #F3E8FF)', height: 230, position: 'relative' }}>
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 14, transition: 'transform 0.5s ease', display: 'block' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64 }}>
            {cat?.icon || '🎁'}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
        <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', color: '#FF3F9D', marginBottom: 6 }}>
          {cat ? `${cat.icon} ${cat.label}` : product.category}
        </span>

        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--plum)', lineHeight: 1.35, marginBottom: 12, flexGrow: 1 }}>
          {product.name}
        </h3>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: '#FF3F9D' }}>
            ₹{(+product.price).toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
            {product.quantity > 0 ? `${product.quantity} in stock` : t('shop.outOfStock', 'Unavailable')}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onView(product); }}
            style={{
              flex: 1, padding: '11px 0',
              border: '1.5px solid rgba(255, 63, 157, 0.35)',
              borderRadius: 'var(--radius-pill)',
              background: 'transparent', color: '#FF3F9D',
              fontWeight: 800, fontSize: 13, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
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
              flex: 1.2, padding: '11px 0',
              background: isOutOfStock
                ? '#e5e7eb'
                : adding
                ? '#72E6B0'
                : 'linear-gradient(135deg, #FF3F9D, #8057E8)',
              border: 'none', borderRadius: 'var(--radius-pill)',
              color: isOutOfStock ? '#9ca3af' : adding ? '#064e3b' : '#fff',
              fontWeight: 800, fontSize: 13,
              cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
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

/* ── Interactive Gift Finder Card ── */
const SurpriseCard = ({ emoji, label, isSelected, onClick }) => (
  <motion.button
    whileHover={{ y: -6, scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    style={{
      padding: '20px 16px',
      borderRadius: '24px',
      border: `2px solid ${isSelected ? '#FF3F9D' : 'rgba(255, 99, 183, 0.25)'}`,
      background: isSelected
        ? 'linear-gradient(135deg, rgba(255,240,245,0.9), rgba(243,232,255,0.9))'
        : '#FFFFFF',
      cursor: 'pointer',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
      boxShadow: isSelected ? '0 10px 25px rgba(255, 63, 157, 0.25)' : '0 4px 16px rgba(64, 32, 68, 0.05)',
      transition: 'all 0.25s',
      fontFamily: 'inherit',
    }}
  >
    <span style={{ fontSize: 38 }}>{emoji}</span>
    <span style={{ fontSize: 13, fontWeight: 800, color: isSelected ? '#FF3F9D' : 'var(--plum)', textAlign: 'center', lineHeight: 1.3 }}>
      {label}
    </span>
  </motion.button>
);

/* ── Trust Feature Card ── */
const TrustCard = ({ icon, title, desc }) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -8, transition: { duration: 0.25 } }}
    style={{
      padding: 30,
      borderRadius: '28px',
      background: '#FFFFFF',
      border: '1.5px solid rgba(255, 99, 183, 0.2)',
      boxShadow: '0 10px 30px rgba(64, 32, 68, 0.06)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}
  >
    <div style={{
      width: 64, height: 64,
      background: 'linear-gradient(135deg, rgba(255,99,183,0.18), rgba(103,223,245,0.22))',
      borderRadius: 20,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 28,
      boxShadow: '0 6px 18px rgba(255,99,183,0.15)',
    }}>
      {icon}
    </div>
    <div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 800, color: 'var(--plum)', marginBottom: 8 }}>{title}</h3>
      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  </motion.div>
);

/* ══════════════════════════════════════════════
   MAIN HOME PAGE
══════════════════════════════════════════════ */
const HomePage = () => {
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [aboutInfo, setAboutInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeCategory, setActiveCategory] = useState('all');
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [selectedFor, setSelectedFor] = useState(null);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  // Slideshow timer
  useEffect(() => {
    if (!aboutInfo?.images?.length) return;
    const id = setInterval(() => setActiveImageIdx((p) => (p + 1) % aboutInfo.images.length), 3800);
    return () => clearInterval(id);
  }, [aboutInfo]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, catRes, aboutRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/categories`),
          axios.get(`${API}/about`).catch(() => ({ data: null })),
        ]);
        setProducts(prodRes.data.filter((p) => p.status === 'active' || p.status === 'low_stock' || !p.status));
        setCategories(catRes.data);
        if (aboutRes?.data) setAboutInfo(aboutRes.data);
      } catch (err) {
        setError('Could not load products. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter((p) => p.category === activeCategory);

  const handleGiftFinderFilter = () => {
    const params = new URLSearchParams();
    if (selectedFor) params.set('recipient', selectedFor);
    if (selectedOccasion) params.set('occasion', selectedOccasion);
    navigate(`/shop${params.toString() ? `?${params}` : ''}`);
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!emailInput || !emailInput.includes('@')) {
      toast.error('Please enter a valid email address.');
      return;
    }
    setNewsletterSubscribed(true);
    toast.success('Thank you for subscribing to 4U Toys & Gifts! 💌');
  };

  const RECIPIENTS = [
    { emoji: '👶', label: t('home.recipients.baby', 'Little Ones'), value: 'baby' },
    { emoji: '🧒', label: t('home.recipients.kids', 'Kids & Teens'), value: 'kids' },
    { emoji: '👩', label: t('home.recipients.mommy', 'Mommy'), value: 'mommy' },
    { emoji: '👨', label: t('home.recipients.father', 'Daddy'), value: 'father' },
    { emoji: '💑', label: t('home.recipients.couple', 'Couples'), value: 'couple' },
    { emoji: '🌟', label: t('home.recipients.anyone', 'Anyone Special'), value: 'anyone' },
  ];

  const OCCASIONS = [
    { emoji: '🎂', label: t('home.occasions.birthday', 'Birthday'), value: 'birthday' },
    { emoji: '👶', label: t('home.occasions.baby_shower', 'Baby Shower'), value: 'baby_shower' },
    { emoji: '💞', label: t('home.occasions.anniversary', 'Anniversary'), value: 'anniversary' },
    { emoji: '🪔', label: t('home.occasions.festival', 'Festival'), value: 'festival' },
    { emoji: '🙏', label: t('home.occasions.thank_you', 'Thank You'), value: 'thank_you' },
    { emoji: '💝', label: t('home.occasions.just_because', 'Just Because'), value: 'just_because' },
  ];

  return (
    <>
      {/* ══ TOP PADDING for fixed nav ══ */}
      <div style={{ height: 80 }} />

      {/* ══════════════════════════════════════════
          1. 3D CINEMATIC TOY VENDING MACHINE HERO
      ══════════════════════════════════════════ */}
      <VendingMachineHero />

      {/* ══════════════════════════════════════════
          2. GIFT FINDER: "Who Are You Surprising?"
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF0F7 100%)',
        padding: 'clamp(60px, 10vw, 100px) 5%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Soft background glow accents */}
        <div style={{ position: 'absolute', top: 0, right: '10%', width: 400, height: 400, background: 'radial-gradient(ellipse, rgba(167,139,250,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: '5%', width: 350, height: 350, background: 'radial-gradient(ellipse, rgba(255,99,183,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            style={{ textAlign: 'center', marginBottom: 52 }}
          >
            <motion.div variants={fadeUp}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 16px', borderRadius: 'var(--radius-pill)',
                background: 'linear-gradient(135deg, rgba(255,99,183,0.2), rgba(167,139,250,0.25))',
                color: 'var(--plum)', fontSize: 13, fontWeight: 800,
                textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14,
              }}>
                <Gift size={14} color="#FF3F9D" /> {t('home.giftFinder', 'Intelligent Gift Finder')}
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="section-heading" style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, color: 'var(--plum)' }}>
              {t('home.whoAreYouSurprising', 'Who Are You Surprising Today? 🎉')}
            </motion.h2>
            <motion.p variants={fadeUp} className="section-subheading" style={{ margin: '0 auto', maxWidth: 540 }}>
              {t('home.giftFinderDesc', 'Pick a recipient and occasion to explore curated gifts crafted to bring wonder and unforgettable smiles.')}
            </motion.p>
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            {/* Step 1: Recipients */}
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--plum)', marginBottom: 18, textAlign: 'center' }}>
              {t('home.step1', 'Step 1: Choose a Person')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14, maxWidth: 900, margin: '0 auto 40px' }}>
              {RECIPIENTS.map((r) => (
                <SurpriseCard
                  key={r.value}
                  emoji={r.emoji}
                  label={r.label}
                  isSelected={selectedFor === r.value}
                  onClick={() => setSelectedFor(selectedFor === r.value ? null : r.value)}
                />
              ))}
            </div>

            {/* Step 2: Occasions */}
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--plum)', marginBottom: 18, textAlign: 'center' }}>
              {t('home.step2', 'Step 2: For What Occasion?')}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 14, maxWidth: 900, margin: '0 auto 44px' }}>
              {OCCASIONS.map((o) => (
                <SurpriseCard
                  key={o.value}
                  emoji={o.emoji}
                  label={o.label}
                  isSelected={selectedOccasion === o.value}
                  onClick={() => setSelectedOccasion(selectedOccasion === o.value ? null : o.value)}
                />
              ))}
            </div>

            {/* CTA */}
            <div style={{ textAlign: 'center' }}>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleGiftFinderFilter}
                style={{
                  padding: '16px 42px',
                  background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                  color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-pill)',
                  fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: '0 10px 28px rgba(255, 63, 157, 0.4)',
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                }}
              >
                {t('home.findGiftsBtn', 'Find the Perfect Gifts')} <Sparkles size={18} />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          3. CATEGORY SHOWCASE
      ══════════════════════════════════════════ */}
      {!loading && categories.length > 0 && (
        <section style={{
          background: 'linear-gradient(180deg, #FFF0F7 0%, #FFFFFF 100%)',
          padding: 'clamp(60px, 10vw, 100px) 5%',
        }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
              style={{ marginBottom: 48 }}
            >
              <motion.div variants={fadeUp}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '6px 16px', borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255,99,183,0.18)', color: '#FF3F9D',
                  fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14,
                }}>
                  <Star size={14} /> {t('home.curatedCollections', 'Curated Collections')}
                </span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="section-heading" style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, color: 'var(--plum)' }}>
                {t('home.shopByCollection', 'Shop by Collection')}
              </motion.h2>
              <motion.p variants={fadeUp} className="section-subheading">
                {t('home.collectionDesc', 'From soft baby wonders to elegant home decor — discover our lovingly curated boutique collections.')}
              </motion.p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(190px, 100%), 1fr))',
                gap: 16,
              }}
            >
              {/* "All" button */}
              <motion.button
                variants={scaleIn}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => setActiveCategory('all')}
                style={{
                  padding: '26px 18px',
                  borderRadius: '26px',
                  border: `2px solid ${activeCategory === 'all' ? '#FF3F9D' : 'rgba(255, 99, 183, 0.25)'}`,
                  background: activeCategory === 'all'
                    ? 'linear-gradient(135deg, #FF3F9D, #8057E8)'
                    : '#FFFFFF',
                  color: activeCategory === 'all' ? '#fff' : 'var(--plum)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  boxShadow: activeCategory === 'all' ? '0 12px 28px rgba(255, 63, 157, 0.35)' : '0 4px 16px rgba(64, 32, 68, 0.05)',
                  transition: 'all 0.25s',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 34 }}>🌟</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800 }}>{t('home.allGoodies', 'All Goodies')}</span>
                <span style={{ fontSize: 12, opacity: 0.85 }}>{t('home.itemsCount', { count: products.length, defaultValue: `${products.length} items` })}</span>
              </motion.button>

              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat.id || p.category === cat.label).length;
                const isActive = activeCategory === cat.id;
                return (
                  <motion.button
                    key={cat._id}
                    variants={scaleIn}
                    whileHover={{ y: -6, scale: 1.02 }}
                    onClick={() => setActiveCategory(cat.id)}
                    style={{
                      padding: '26px 18px',
                      borderRadius: '26px',
                      border: `2px solid ${isActive ? '#FF3F9D' : 'rgba(255, 99, 183, 0.25)'}`,
                      background: isActive
                        ? 'linear-gradient(135deg, #FF3F9D, #8057E8)'
                        : '#FFFFFF',
                      color: isActive ? '#fff' : 'var(--plum)',
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                      boxShadow: isActive ? '0 12px 28px rgba(255, 63, 157, 0.35)' : '0 4px 16px rgba(64, 32, 68, 0.05)',
                      transition: 'all 0.25s',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 34 }}>{cat.icon}</span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, textAlign: 'center', lineHeight: 1.2 }}>
                      {cat.label}
                    </span>
                    <span style={{ fontSize: 12, opacity: 0.85 }}>{count} items</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          4. FEATURED PRODUCTS (Direct Real Data)
      ══════════════════════════════════════════ */}
      <section id="featured-products-section" style={{
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FFF0F7 100%)',
        padding: 'clamp(60px, 10vw, 100px) 5%',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 44, flexWrap: 'wrap', gap: 16 }}
          >
            <div>
              <motion.div variants={fadeUp}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '6px 16px', borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255,99,183,0.18)', color: '#FF3F9D',
                  fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14,
                }}>
                  <Sparkles size={14} /> {t('home.featuredBadge', 'Featured Collection')}
                </span>
              </motion.div>
              <motion.h2 variants={fadeUp} className="section-heading" style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, color: 'var(--plum)', marginBottom: 6 }}>
                {t('home.featuredTitle', "Little Things They'll Love")}
              </motion.h2>
              <motion.p variants={fadeUp} className="section-subheading" style={{ marginBottom: 0 }}>
                {t('home.featuredDesc', 'Authentic items from our live shop catalogue — hand-picked for your little wonders.')}
              </motion.p>
            </div>

            <motion.div variants={fadeUp}>
              <Link to="/shop">
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  style={{
                    padding: '12px 26px',
                    background: '#FFFFFF',
                    color: '#FF3F9D',
                    border: '2px solid #FF3F9D',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 4px 14px rgba(255, 63, 157, 0.2)',
                  }}
                >
                  {t('home.viewAllProducts', 'View All Products')} <ChevronRight size={16} />
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Loading Skeletons */}
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px,100%),1fr))', gap: 26 }}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: '28px', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', padding: 18 }}>
                  <div className="skeleton" style={{ height: 210, borderRadius: 20, marginBottom: 16 }} />
                  <div className="skeleton" style={{ height: 14, width: '40%', marginBottom: 12, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 20, width: '80%', marginBottom: 10, borderRadius: 6 }} />
                  <div className="skeleton" style={{ height: 28, width: '45%', marginBottom: 18, borderRadius: 6 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div className="skeleton" style={{ height: 40, flex: 1, borderRadius: 100 }} />
                    <div className="skeleton" style={{ height: 40, flex: 1, borderRadius: 100 }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>😔</div>
              <h3 style={{ color: 'var(--plum)', fontFamily: 'var(--font-display)', marginBottom: 8 }}>Unable to load catalogue</h3>
              <p style={{ color: 'var(--text-muted)' }}>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <motion.div
              variants={stagger}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(270px,100%),1fr))',
                gap: 26,
              }}
            >
              {filteredProducts.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--plum)' }}>No items in this collection yet</h3>
                  <p>Try exploring another collection or view all store products.</p>
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const cat = categories.find((c) => c.id === product.category || c.label === product.category);
                  return (
                    <ProductCard
                      key={product._id}
                      product={product}
                      cat={cat}
                      addToCart={addToCart}
                      toggleWishlist={toggleWishlist}
                      isInWishlist={isInWishlist}
                      isLoggedIn={isLoggedIn}
                      onView={(p) => navigate(`/product/${p._id}`)}
                    />
                  );
                })
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════
          5. ABOUT & BRAND STORY
      ══════════════════════════════════════════ */}
      {aboutInfo && (aboutInfo.description || aboutInfo.images?.length > 0 || aboutInfo.stats?.length > 0) && (
        <section style={{ background: '#FFF9FC', padding: 'clamp(60px, 10vw, 100px) 5%' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,380px),1fr))',
              gap: 'clamp(36px, 6vw, 70px)',
              alignItems: 'center',
            }}>
              {/* Text Side */}
              <motion.div
                initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
                variants={stagger}
              >
                <motion.div variants={fadeUp}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7,
                    padding: '6px 16px', borderRadius: 'var(--radius-pill)',
                    background: 'rgba(167,139,250,0.2)', color: '#8057E8',
                    fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14,
                  }}>
                    <Heart size={14} fill="#FF3F9D" color="#FF3F9D" /> Our Story & Passion
                  </span>
                </motion.div>
                <motion.h2 variants={fadeUp} className="section-heading" style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, color: 'var(--plum)' }}>
                  More Than Toys.<br />Little Moments of Magic.
                </motion.h2>
                {aboutInfo.description && (
                  <motion.p variants={fadeUp} style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-muted)', marginBottom: 32 }}>
                    {aboutInfo.description}
                  </motion.p>
                )}

                {/* Animated Stats */}
                {aboutInfo.stats?.length > 0 && (
                  <motion.div variants={stagger} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    {aboutInfo.stats.map((stat, i) => {
                      const max = Math.max(...aboutInfo.stats.map((s) => s.value), 10);
                      const pct = Math.min((stat.value / max) * 100, 100);
                      return (
                        <motion.div key={i} variants={fadeUp}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontWeight: 800, fontSize: 14 }}>
                            <span style={{ color: 'var(--plum)' }}>{stat.label}</span>
                            <span style={{ color: '#FF3F9D' }}>
                              <CountUp end={stat.value} duration={2.5} separator="," enableScrollSpy scrollSpyOnce />
                              {stat.suffix}
                            </span>
                          </div>
                          <div style={{ height: 10, background: 'rgba(255, 99, 183, 0.15)', borderRadius: 100, overflow: 'hidden' }}>
                            <motion.div
                              initial={{ width: 0 }}
                              whileInView={{ width: `${pct}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1.4, delay: i * 0.15, ease: 'easeOut' }}
                              style={{ height: '100%', background: 'linear-gradient(90deg, #FF63B7, #8057E8)', borderRadius: 100 }}
                            />
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </motion.div>

              {/* Image Slideshow */}
              {aboutInfo.images?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7 }}
                  style={{
                    position: 'relative',
                    borderRadius: '32px',
                    overflow: 'hidden',
                    height: 'clamp(280px, 45vw, 440px)',
                    boxShadow: '0 25px 60px rgba(64, 32, 68, 0.15)',
                    border: '2px solid rgba(255, 99, 183, 0.25)',
                  }}
                >
                  <AnimatePresence mode="popLayout">
                    <motion.img
                      key={activeImageIdx}
                      src={aboutInfo.images[activeImageIdx]}
                      alt="Our store"
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.1, ease: 'easeInOut' }}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </AnimatePresence>
                  {aboutInfo.images.length > 1 && (
                    <div style={{ position: 'absolute', bottom: 16, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 10 }}>
                      {aboutInfo.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIdx(i)}
                          aria-label={`Slide ${i + 1}`}
                          style={{
                            width: i === activeImageIdx ? 24 : 8,
                            height: 8,
                            borderRadius: 100,
                            background: i === activeImageIdx ? '#fff' : 'rgba(255,255,255,0.5)',
                            border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════
          6. TRUST & BOUTIQUE PERKS
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(180deg, #FFF9FC 0%, #FFF0F7 100%)',
        padding: 'clamp(60px, 10vw, 100px) 5%',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            style={{ textAlign: 'center', marginBottom: 52 }}
          >
            <motion.div variants={fadeUp}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '6px 16px', borderRadius: 'var(--radius-pill)',
                background: 'rgba(255,99,183,0.18)', color: '#FF3F9D',
                fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 14,
              }}>
                <Shield size={14} /> {t('home.guaranteeBadge', 'The 4U Guarantee')}
              </span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="section-heading" style={{ fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 900, color: 'var(--plum)' }}>
              {t('home.shoppingMadeMagical', 'Shopping Made Magical ✨')}
            </motion.h2>
            <motion.p variants={fadeUp} className="section-subheading" style={{ margin: '0 auto' }}>
              {t('home.guaranteeDesc', 'Every touchpoint, from 3D browsing to gift delivery, is engineered for trust and joy.')}
            </motion.p>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(240px,100%),1fr))', gap: 24 }}
          >
            <TrustCard icon="🔒" title={t('home.perks.securePaymentTitle', 'Secure Payment')} desc={t('home.perks.securePaymentDesc', 'Encrypted transactions with verified order processing and safety.')} />
            <TrustCard icon="📦" title={t('home.perks.trackOrdersTitle', 'Track Live Orders')} desc={t('home.perks.trackOrdersDesc', 'Stay updated at each milestone from packing to arrival.')} />
            <TrustCard icon="🎁" title={t('home.perks.wrappingTitle', 'Boutique Gift Wrapping')} desc={t('home.perks.wrappingDesc', 'Handcrafted presentation ready to enchant the recipient.')} />
            <TrustCard icon="🕶️" title={t('home.perks.arTitle', 'Augmented Reality AR')} desc={t('home.perks.arDesc', 'Inspect items in your living room with WebXR and 3D preview.')} />
            <TrustCard icon="⭐" title={t('home.perks.qualityTitle', 'Authentic Quality')} desc={t('home.perks.qualityDesc', 'Curated non-toxic, child-safe materials certified for pure fun.')} />
            <TrustCard icon="💬" title={t('home.perks.helpTitle', 'Personal Gifting Help')} desc={t('home.perks.helpDesc', 'Dedicated guidance to discover that one unforgettable gift.')} />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          7. CINEMATIC STORYTELLING BANNER
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(135deg, #402044 0%, #5c3563 50%, #402044 100%)',
        padding: 'clamp(70px, 12vw, 110px) 5%',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Luminous Glow Spots */}
        <div style={{ position: 'absolute', top: '-25%', right: '-5%', width: '45%', height: '150%', background: 'radial-gradient(ellipse, rgba(255,99,183,0.18) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-25%', left: '-5%', width: '40%', height: '120%', background: 'radial-gradient(ellipse, rgba(167,139,250,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1320, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%,380px),1fr))',
            gap: 52,
            alignItems: 'center',
          }}>
            {/* Story Text */}
            <motion.div
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 7,
                  padding: '7px 18px', borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255,99,183,0.2)', border: '1px solid rgba(255,99,183,0.4)',
                  fontSize: 13, fontWeight: 800, color: '#FF63B7',
                  letterSpacing: '0.4px', marginBottom: 20,
                }}>
                  <Gift size={14} /> {t('home.storyBanner.badge', 'From Our Gift Box')}
                </span>
              </motion.div>
              <motion.h2
                variants={fadeUp}
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(32px, 5vw, 54px)',
                  fontWeight: 900,
                  color: '#fff',
                  lineHeight: 1.15,
                  marginBottom: 20,
                }}
              >
                {t('home.storyBanner.titleLine1', 'From Our Little Gift Box')}<br />
                <span style={{ color: '#FF63B7' }}>{t('home.storyBanner.titleLine2', 'to Their Biggest Smile.')}</span>
              </motion.h2>
              <motion.p
                variants={fadeUp}
                style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', lineHeight: 1.75, marginBottom: 36, maxWidth: 480 }}
              >
                {t('home.storyBanner.desc', 'Every gift we carry is chosen with intention — to spark wonder, kindle creativity, and create magical moments that last a lifetime.')}
              </motion.p>
              <motion.div variants={fadeUp}>
                <Link to="/shop">
                  <motion.button
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    style={{
                      padding: '15px 38px',
                      background: 'linear-gradient(135deg, #FF63B7, #FF3F9D)',
                      color: '#402044',
                      border: 'none',
                      borderRadius: 'var(--radius-pill)',
                      fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 16,
                      cursor: 'pointer',
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      boxShadow: '0 10px 28px rgba(255, 99, 183, 0.4)',
                    }}
                  >
                    {t('home.storyBanner.startGifting', 'Start Gifting Today')} <Sparkles size={18} />
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Floating CSS 3D Planetary Orbit */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <div style={{ position: 'relative', width: 320, height: 320 }}>
                {/* Central Glowing Gift */}
                <motion.div
                  animate={{ y: [0, -14, 0], rotate: [0, 4, -4, 0] }}
                  transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                  style={{
                    position: 'absolute', top: '50%', left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 124, height: 124,
                    background: 'linear-gradient(135deg, #FF63B7, #FF3F9D)',
                    borderRadius: 28,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 58,
                    boxShadow: '0 20px 50px rgba(255, 63, 157, 0.4)',
                  }}
                >
                  🎁
                </motion.div>

                {/* Orbiting Boutique Charms */}
                {[
                  { emoji: '🧸', angle: 0,   r: 118, delay: 0 },
                  { emoji: '🎀', angle: 60,  r: 118, delay: 0.3 },
                  { emoji: '🌟', angle: 120, r: 118, delay: 0.6 },
                  { emoji: '💝', angle: 180, r: 118, delay: 0.9 },
                  { emoji: '🎪', angle: 240, r: 118, delay: 1.2 },
                  { emoji: '✨', angle: 300, r: 118, delay: 1.5 },
                ].map((obj, i) => {
                  const x = obj.r * Math.cos((obj.angle * Math.PI) / 180);
                  const y = obj.r * Math.sin((obj.angle * Math.PI) / 180);
                  return (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -10, 0], scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 3.5, delay: obj.delay, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        width: 50, height: 50,
                        marginTop: -25, marginLeft: -25,
                        transform: `translate(${x}px, ${y}px)`,
                        background: 'rgba(255,255,255,0.14)',
                        borderRadius: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24,
                        border: '1px solid rgba(255,255,255,0.25)',
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      {obj.emoji}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          8. NEWSLETTER & VIP CLUB
      ══════════════════════════════════════════ */}
      <section style={{
        background: 'linear-gradient(180deg, #FFF0F7 0%, #FFFFFF 100%)',
        padding: 'clamp(60px, 10vw, 100px) 5%',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            <motion.div variants={fadeUp} style={{ fontSize: 52, marginBottom: 16 }}>💌</motion.div>
            <motion.h2 variants={fadeUp} className="section-heading" style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: 'var(--plum)', marginBottom: 12 }}>
              {t('home.newsletter.title', 'Join the 4U Family')}
            </motion.h2>
            <motion.p variants={fadeUp} style={{ color: 'var(--text-muted)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
              {t('home.newsletter.desc', 'Receive updates on new 3D toy drops, seasonal gift guides, and exclusive offers straight to your inbox.')}
            </motion.p>

            {newsletterSubscribed ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  padding: '18px 28px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(114, 230, 176, 0.25)',
                  border: '1.5px solid #72E6B0',
                  color: '#064e3b',
                  fontWeight: 800,
                  fontSize: 16,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <CheckCircle size={20} color="#059669" /> {t('home.newsletter.subscribed', "Welcome to the family! We've sent you a welcome note.")}
              </motion.div>
            ) : (
              <motion.form
                variants={fadeUp}
                onSubmit={handleSubscribe}
                style={{ display: 'flex', gap: 10, maxWidth: 480, margin: '0 auto', flexWrap: 'wrap' }}
              >
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={t('home.newsletter.placeholder', 'your@email.com')}
                  style={{
                    flex: 1, minWidth: 220,
                    padding: '14px 22px',
                    borderRadius: 'var(--radius-pill)',
                    border: '1.5px solid rgba(255, 99, 183, 0.3)',
                    background: '#FFFFFF',
                    fontSize: 15, color: 'var(--plum)',
                    outline: 'none', fontFamily: 'inherit',
                    boxShadow: '0 4px 14px rgba(64, 32, 68, 0.04)',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#FF3F9D')}
                  onBlur={(e) => (e.target.style.borderColor = 'rgba(255, 99, 183, 0.3)')}
                />
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  type="submit"
                  style={{
                    padding: '14px 30px',
                    background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                    color: '#fff', border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 14,
                    cursor: 'pointer',
                    boxShadow: '0 8px 22px rgba(255, 63, 157, 0.35)',
                  }}
                >
                  {t('home.newsletter.subscribeBtn', 'Subscribe ✨')}
                </motion.button>
              </motion.form>
            )}
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default HomePage;

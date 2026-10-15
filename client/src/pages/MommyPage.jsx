import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, ShoppingBag, Heart, Sparkles, Gift, 
  Search, CheckCircle, RefreshCw, Star
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const MOMMY_CATEGORIES = [
  { id: 'all', label: 'All Mommy Treats 🌸' },
  { id: 'pamper', label: 'Pamper & Self-Care 🛁' },
  { id: 'keepsake', label: 'Handcrafted Keepsakes 💖' },
  { id: 'decor', label: 'Home & Floral Wonders 🌹' },
  { id: 'queen', label: 'Queen of Hearts Specials 👑' },
];

const MommyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isLoggedIn } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [addingId, setAddingId] = useState(null);

  // Fetch real authoritative catalogue items (Zero sample data)
  useEffect(() => {
    const fetchMommyCatalogue = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products`);
        if (Array.isArray(data)) {
          // Filter authentic products that match mommy, mother, gift, decor, luxury, women
          const mommyItems = data.filter((p) => {
            if (p.status === 'inactive') return false;
            const kw = ['mom', 'mother', 'gift', 'decor', 'luxury', 'plush', 'rose', 'flower', 'lamp', 'fancy'];
            const pCat = (p.category || '').toLowerCase();
            const pSub = (p.subcategory || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            const pTags = (p.tags || []).map((t) => t.toLowerCase());
            return kw.some(k => pCat.includes(k) || pSub.includes(k) || pName.includes(k) || pTags.some(t => t.includes(k)));
          });
          setProducts(mommyItems.length > 0 ? mommyItems : data.filter(p => p.status !== 'inactive'));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch mommy products:', err);
        toast.error('Unable to load Mommy collection.');
      } finally {
        setLoading(false);
      }
    };

    fetchMommyCatalogue();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'pamper') return p.price <= 600 || (p.tags && p.tags.includes('care'));
    if (activeCategory === 'keepsake') return p.price > 600 && p.price <= 1200;
    if (activeCategory === 'decor') return (p.category || '').toLowerCase().includes('decor') || (p.name || '').toLowerCase().includes('light');
    if (activeCategory === 'queen') return p.price > 1000;
    return true;
  });

  const handleAddToCart = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    if (prod.quantity <= 0) {
      toast.error('This product is currently out of stock.');
      return;
    }
    if (!isLoggedIn) {
      toast.error('Please login to add items to your cart! 🛍️');
      navigate('/login');
      return;
    }
    setAddingId(prod._id);
    addToCart(prod);
    toast.success(`${prod.name} added to cart! 🌸`);
    setTimeout(() => setAddingId(null), 1200);
  };

  const handleWishlist = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    const wished = isInWishlist(prod._id);
    toggleWishlist(prod);
    toast.success(wished ? 'Removed from wishlist' : 'Saved to wishlist for Mom! 💖');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFF1F2', paddingBottom: 80 }}>
      <div style={{ height: 80 }} />

      {/* ── LUXURIOUS RUBY RED HERO BANNER WITH FLOATING PETALS ── */}
      <section
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #FFE4E6 0%, #FECDD3 50%, #FFF1F2 100%)',
          padding: 'clamp(40px, 7vw, 80px) 5% clamp(30px, 5vw, 60px)',
          textAlign: 'center',
          overflow: 'hidden',
          borderBottom: '2px solid rgba(225, 29, 72, 0.25)',
        }}
      >
        {/* Floating Rose Petals / Hearts Animation */}
        <motion.div
          animate={{ y: [-10, 15, -10], rotate: [0, 20, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '15%', left: '8%', fontSize: '42px', opacity: 0.65, pointerEvents: 'none' }}
        >
          🌹
        </motion.div>
        <motion.div
          animate={{ y: [15, -10, 15], rotate: [0, -20, 0] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '25%', right: '10%', fontSize: '46px', opacity: 0.6, pointerEvents: 'none' }}
        >
          🌸
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 4 }}
          style={{ position: 'absolute', bottom: '15%', right: '18%', fontSize: '30px', opacity: 0.7, pointerEvents: 'none' }}
        >
          💖
        </motion.div>

        {/* FUNCTIONAL BACK NAVIGATION BUTTON */}
        <div style={{ maxWidth: 1200, margin: '0 auto 20px', display: 'flex', justifyContent: 'flex-start' }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 18px',
              borderRadius: 'var(--radius-pill)',
              background: '#FFFFFF',
              border: '1.5px solid rgba(225, 29, 72, 0.35)',
              color: '#BE123C',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(190, 18, 60, 0.08)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
          >
            <ArrowLeft size={16} />
            <span>{t('giftFlow.backToShopping', 'Back to Shopping')}</span>
          </button>
        </div>

        {/* Hero Identity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ maxWidth: 760, margin: '0 auto' }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 18px',
              borderRadius: 'var(--radius-pill)',
              background: '#FFFFFF',
              color: '#E11D48',
              fontSize: 12,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 14px rgba(225, 29, 72, 0.12)',
              marginBottom: 16,
              border: '1px solid rgba(225, 29, 72, 0.3)',
            }}
          >
            <Heart size={16} color="#E11D48" fill="#E11D48" />
            <span>Pampering Elegance for Every Mother</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5.5vw, 56px)',
              fontWeight: 900,
              color: '#881337',
              lineHeight: 1.15,
              margin: '0 0 16px',
            }}
          >
            Mommy’s Royal Collection <span style={{ color: '#E11D48' }}>& Rose Petals</span> 🌸
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              color: '#9F1239',
              maxWidth: 620,
              margin: '0 auto 28px',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            Handcrafted wonders, relaxing boutique gifts, and heartfelt keepsakes designed to celebrate the queen of the heart.
          </p>

          {/* Maternal Highlights */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            {[
              { icon: '🎀', label: 'Silk Ribbon Gift Wrap' },
              { icon: '💌', label: 'Free Handwritten Note' },
              { icon: '🌹', label: 'Rose Gold Boutique Accent' },
              { icon: '✨', label: 'Curated Self-Care' },
            ].map((b) => (
              <div
                key={b.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255, 255, 255, 0.88)',
                  backdropFilter: 'blur(8px)',
                  color: '#9F1239',
                  fontSize: 12,
                  fontWeight: 800,
                  border: '1px solid rgba(225, 29, 72, 0.3)',
                }}
              >
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CONTROLS & GRID ── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '30px 5% 0' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            mdFlexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {/* Categories */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, maxWidth: '100%' }}>
            {MOMMY_CATEGORIES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveCategory(m.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1.5px solid',
                  borderColor: activeCategory === m.id ? '#E11D48' : 'rgba(225, 29, 72, 0.25)',
                  background: activeCategory === m.id ? 'linear-gradient(135deg, #E11D48, #BE123C)' : '#FFFFFF',
                  color: activeCategory === m.id ? '#FFFFFF' : '#9F1239',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: activeCategory === m.id ? '0 4px 14px rgba(225, 29, 72, 0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
            <Search size={16} color="#E11D48" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gifts for Mom…"
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 'var(--radius-pill)',
                border: '1.5px solid rgba(225, 29, 72, 0.35)',
                background: '#FFFFFF',
                fontSize: 13,
                outline: 'none',
                color: '#881337',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            />
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: 16 }}>
              <RefreshCw size={36} color="#E11D48" />
            </motion.div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#881337', fontSize: 20, margin: 0 }}>
              Curating Mommy's Gift Hamper…
            </h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '28px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '2px dashed rgba(225, 29, 72, 0.3)',
              maxWidth: 500,
              margin: '40px auto',
            }}
          >
            <span style={{ fontSize: 52 }}>🌸</span>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#881337', fontSize: 22, margin: '14px 0 8px' }}>
              No items match this filter
            </h3>
            <p style={{ color: '#9F1239', fontSize: 14, margin: '0 0 20px' }}>
              Reset filters to browse all our authentic boutique offerings for mothers.
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('all'); }}
              style={{
                padding: '10px 22px',
                borderRadius: 'var(--radius-pill)',
                background: 'linear-gradient(135deg, #E11D48, #BE123C)',
                color: '#fff',
                border: 'none',
                fontWeight: 800,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 22,
            }}
          >
            {filteredProducts.map((prod) => {
              const isOut = prod.quantity <= 0;
              const isWished = isInWishlist(prod._id);
              const isAdding = addingId === prod._id;

              return (
                <motion.div
                  key={prod._id}
                  whileHover={{ y: -6 }}
                  transition={{ duration: 0.25 }}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '26px',
                    overflow: 'hidden',
                    border: '1.5px solid rgba(225, 29, 72, 0.25)',
                    boxShadow: '0 10px 28px rgba(190, 18, 60, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  <div
                    onClick={() => navigate(`/product/${prod._id}`)}
                    style={{
                      height: 220,
                      background: 'linear-gradient(180deg, #FFF1F2 0%, #FFE4E6 100%)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      overflow: 'hidden',
                    }}
                  >
                    {prod.images?.[0] ? (
                      <img
                        src={prod.images[0]}
                        alt={prod.name}
                        style={{ width: '85%', height: '85%', objectFit: 'contain', transition: 'transform 0.3s' }}
                      />
                    ) : (
                      <span style={{ fontSize: 64 }}>🎁</span>
                    )}

                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(6px)',
                        color: '#E11D48',
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Sparkles size={11} color="#E11D48" />
                      <span>For Mom</span>
                    </div>

                    <button
                      onClick={(e) => handleWishlist(e, prod)}
                      style={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: '#FFFFFF',
                        border: 'none',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Heart size={16} color={isWished ? '#E11D48' : '#BE123C'} fill={isWished ? '#E11D48' : 'none'} />
                    </button>
                  </div>

                  <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#E11D48', textTransform: 'uppercase', marginBottom: 4 }}>
                        {prod.category || 'Mommy’s Gift'}
                      </div>
                      <h4
                        onClick={() => navigate(`/product/${prod._id}`)}
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#881337',
                          margin: '0 0 6px',
                          cursor: 'pointer',
                          lineHeight: 1.3,
                        }}
                      >
                        {prod.name}
                      </h4>
                      <p style={{ color: '#9F1239', fontSize: 12, margin: '0 0 12px', lineHeight: 1.4, opacity: 0.85 }}>
                        {prod.description ? (prod.description.length > 60 ? prod.description.slice(0, 58) + '…' : prod.description) : 'Boutique treasure for mother.'}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                          <span style={{ fontSize: 11, color: '#9F1239' }}>Price: </span>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: '#E11D48' }}>
                            ₹{Number(prod.price).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: isOut ? '#fee2e2' : 'rgba(225, 29, 72, 0.15)',
                            color: isOut ? '#dc2626' : '#BE123C',
                          }}
                        >
                          {isOut ? 'Out of Stock' : `In Stock (${prod.quantity})`}
                        </span>
                      </div>

                      <button
                        disabled={isOut}
                        onClick={(e) => handleAddToCart(e, prod)}
                        style={{
                          width: '100%',
                          padding: '11px',
                          borderRadius: 'var(--radius-pill)',
                          background: isOut ? '#e5e7eb' : isAdding ? '#72E6B0' : 'linear-gradient(135deg, #E11D48, #BE123C)',
                          color: isOut ? '#9ca3af' : isAdding ? '#064e3b' : '#fff',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: isOut ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: isOut ? 'none' : '0 4px 14px rgba(225, 29, 72, 0.25)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isAdding ? <CheckCircle size={16} /> : <ShoppingBag size={16} />}
                        <span>{isAdding ? 'Added to Cart!' : isOut ? 'Out of Stock' : 'Add to Mom’s Cart'}</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MommyPage;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, ShoppingBag, Heart, Sparkles, ShieldCheck, 
  Baby, Search, Star, CheckCircle, RefreshCw, Eye, Gift
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const MILESTONES = [
  { id: 'all', label: 'All Baby Wonders 🍼' },
  { id: '0-6m', label: 'Newborns (0–6 Months) 👶' },
  { id: '6-12m', label: 'Explorers (6–12 Months) 🧸' },
  { id: 'toddler', label: 'Toddlers (1–3 Years) 🌈' },
  { id: 'nursery', label: 'Nursery & Plush Decor ☁️' },
];

const BabyPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { isLoggedIn } = useAuth();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeMilestone, setActiveMilestone] = useState('all');
  const [addingId, setAddingId] = useState(null);

  // Fetch real authoritative catalogue items (Zero sample data)
  useEffect(() => {
    const fetchBabyCatalogue = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products`);
        if (Array.isArray(data)) {
          // Filter authentic products that match baby, kids, soft toys, plush, infant
          const babyItems = data.filter((p) => {
            if (p.status === 'inactive') return false;
            const kw = ['baby', 'kid', 'plush', 'toy', 'infant', 'child', 'cute', 'soft', 'teddy'];
            const pCat = (p.category || '').toLowerCase();
            const pSub = (p.subcategory || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            const pTags = (p.tags || []).map((t) => t.toLowerCase());
            return kw.some(k => pCat.includes(k) || pSub.includes(k) || pName.includes(k) || pTags.some(t => t.includes(k)));
          });
          // If no specific baby items found in DB, show all active products so customer always has authentic items
          setProducts(babyItems.length > 0 ? babyItems : data.filter(p => p.status !== 'inactive'));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch baby products:', err);
        toast.error('Unable to load baby collection. Please check backend connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchBabyCatalogue();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeMilestone === 'all') return true;
    if (activeMilestone === '0-6m') return p.price <= 500 || (p.tags && p.tags.includes('infant'));
    if (activeMilestone === '6-12m') return (p.price > 500 && p.price <= 1000) || (p.category || '').toLowerCase().includes('toy');
    if (activeMilestone === 'toddler') return p.price > 800;
    if (activeMilestone === 'nursery') return (p.category || '').toLowerCase().includes('decor') || (p.name || '').toLowerCase().includes('plush');
    return true;
  });

  const handleAddToCart = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    if (prod.quantity <= 0) {
      toast.error('This baby item is currently out of stock.');
      return;
    }
    if (!isLoggedIn) {
      toast.error('Please login to add items to your cart! 🛍️');
      navigate('/login');
      return;
    }
    setAddingId(prod._id);
    addToCart(prod);
    toast.success(`${prod.name} added to cart! 🍼`);
    setTimeout(() => setAddingId(null), 1200);
  };

  const handleWishlist = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    const wished = isInWishlist(prod._id);
    toggleWishlist(prod);
    toast.success(wished ? 'Removed from wishlist' : 'Saved to baby wishlist! 💖');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F0F9FF', paddingBottom: 80 }}>
      {/* Spacer for sticky header */}
      <div style={{ height: 80 }} />

      {/* ── CUTE SOFT BLUE HERO BANNER WITH CLOUDS & STARS ── */}
      <section
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #E0F2FE 0%, #BAE6FD 50%, #F0F9FF 100%)',
          padding: 'clamp(40px, 7vw, 80px) 5% clamp(30px, 5vw, 60px)',
          textAlign: 'center',
          overflow: 'hidden',
          borderBottom: '2px solid rgba(56, 189, 248, 0.25)',
        }}
      >
        {/* Floating Clouds Background Elements */}
        <motion.div
          animate={{ x: [-20, 20, -20], y: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '15%',
            left: '6%',
            fontSize: 'clamp(40px, 6vw, 72px)',
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        >
          ☁️
        </motion.div>
        <motion.div
          animate={{ x: [20, -20, 20], y: [5, -5, 5] }}
          transition={{ repeat: Infinity, duration: 10, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '25%',
            right: '8%',
            fontSize: 'clamp(46px, 7vw, 84px)',
            opacity: 0.65,
            pointerEvents: 'none',
          }}
        >
          ☁️
        </motion.div>
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ repeat: Infinity, duration: 6 }}
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '12%',
            fontSize: '36px',
            opacity: 0.8,
            pointerEvents: 'none',
          }}
        >
          ⭐
        </motion.div>

        {/* ── FUNCTIONAL BACK BUTTON ── */}
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
              border: '1.5px solid rgba(56, 189, 248, 0.4)',
              color: '#0369A1',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(3, 105, 161, 0.08)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(-3px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
          >
            <ArrowLeft size={16} />
            <span>{t('giftFlow.backToShopping', 'Back to Shopping')}</span>
          </button>
        </div>

        {/* Hero Title & Identity */}
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
              color: '#0284C7',
              fontSize: 12,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.12)',
              marginBottom: 16,
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <Baby size={16} color="#0284C7" />
            <span>Soft, Cute & Baby-Safe Sanctuary</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5.5vw, 56px)',
              fontWeight: 900,
              color: '#0C4A6E',
              lineHeight: 1.15,
              margin: '0 0 16px',
            }}
          >
            Baby Wonderland <span style={{ color: '#0284C7' }}>& Soft Smiles</span> 🍼
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              color: '#0369A1',
              maxWidth: 620,
              margin: '0 auto 28px',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            {t('home.collectionDesc', 'Ultra-soft plushies, sensory development wonders, and certified non-toxic playmates for your little angels.')}
          </p>

          {/* Baby Safety Badges */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 20,
            }}
          >
            {[
              { icon: '🌿', label: '100% Non-Toxic' },
              { icon: '☁️', label: 'Cloud-Soft Fabrics' },
              { icon: '🛡️', label: 'BPA-Free Certified' },
              { icon: '🎁', label: 'Complimentary Gift Box' },
            ].map((b) => (
              <div
                key={b.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-pill)',
                  background: 'rgba(255, 255, 255, 0.85)',
                  backdropFilter: 'blur(8px)',
                  color: '#0369A1',
                  fontSize: 12,
                  fontWeight: 800,
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                }}
              >
                <span>{b.icon}</span>
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── SEARCH & MILESTONES CONTROLS ── */}
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
          {/* Milestone Filter Chips */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6, maxWidth: '100%' }}>
            {MILESTONES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMilestone(m.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1.5px solid',
                  borderColor: activeMilestone === m.id ? '#0284C7' : 'rgba(56, 189, 248, 0.25)',
                  background: activeMilestone === m.id ? 'linear-gradient(135deg, #0284C7, #38BDF8)' : '#FFFFFF',
                  color: activeMilestone === m.id ? '#FFFFFF' : '#0369A1',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: activeMilestone === m.id ? '0 4px 14px rgba(2, 132, 199, 0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 320,
            }}
          >
            <Search size={16} color="#0284C7" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search soft baby toys…"
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 'var(--radius-pill)',
                border: '1.5px solid rgba(56, 189, 248, 0.35)',
                background: '#FFFFFF',
                fontSize: 13,
                outline: 'none',
                color: '#0C4A6E',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            />
          </div>
        </div>

        {/* ── PRODUCTS GRID (Real Database Records Only) ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: 16 }}>
              <RefreshCw size={36} color="#0284C7" />
            </motion.div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#0C4A6E', fontSize: 20, margin: 0 }}>
              Opening Baby Nursery Shelves…
            </h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '28px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '2px dashed rgba(56, 189, 248, 0.3)',
              maxWidth: 500,
              margin: '40px auto',
            }}
          >
            <span style={{ fontSize: 52 }}>🍼</span>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#0C4A6E', fontSize: 22, margin: '14px 0 8px' }}>
              No items match your baby search
            </h3>
            <p style={{ color: '#0369A1', fontSize: 14, margin: '0 0 20px' }}>
              Try adjusting your milestone filter or search term to explore our full boutique collection.
            </p>
            <button
              onClick={() => { setSearch(''); setActiveMilestone('all'); }}
              style={{
                padding: '10px 22px',
                borderRadius: 'var(--radius-pill)',
                background: 'linear-gradient(135deg, #0284C7, #38BDF8)',
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
                    border: '1.5px solid rgba(56, 189, 248, 0.25)',
                    boxShadow: '0 10px 28px rgba(3, 105, 161, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  {/* Image Presentation */}
                  <div
                    onClick={() => navigate(`/product/${prod._id}`)}
                    style={{
                      height: 220,
                      background: 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)',
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
                      <span style={{ fontSize: 64 }}>🧸</span>
                    )}

                    {/* Baby Soft Badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(255, 255, 255, 0.92)',
                        backdropFilter: 'blur(6px)',
                        color: '#0284C7',
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Sparkles size={11} color="#0284C7" />
                      <span>Baby Safe</span>
                    </div>

                    {/* Wishlist Button */}
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
                      <Heart size={16} color={isWished ? '#EF4444' : '#0369A1'} fill={isWished ? '#EF4444' : 'none'} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', marginBottom: 4 }}>
                        {prod.category || 'Baby Nursery'}
                      </div>
                      <h4
                        onClick={() => navigate(`/product/${prod._id}`)}
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#0C4A6E',
                          margin: '0 0 6px',
                          cursor: 'pointer',
                          lineHeight: 1.3,
                        }}
                      >
                        {prod.name}
                      </h4>
                      <p style={{ color: '#0369A1', fontSize: 12, margin: '0 0 12px', lineHeight: 1.4, opacity: 0.85 }}>
                        {prod.description ? (prod.description.length > 60 ? prod.description.slice(0, 58) + '…' : prod.description) : 'Gentle, comforting wonder for baby.'}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                          <span style={{ fontSize: 11, color: '#0369A1' }}>Price: </span>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: '#0284C7' }}>
                            ₹{Number(prod.price).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: isOut ? '#fee2e2' : 'rgba(56, 189, 248, 0.2)',
                            color: isOut ? '#dc2626' : '#0369A1',
                          }}
                        >
                          {isOut ? 'Out of Stock' : `In Stock (${prod.quantity})`}
                        </span>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        disabled={isOut}
                        onClick={(e) => handleAddToCart(e, prod)}
                        style={{
                          width: '100%',
                          padding: '11px',
                          borderRadius: 'var(--radius-pill)',
                          background: isOut ? '#e5e7eb' : isAdding ? '#72E6B0' : 'linear-gradient(135deg, #0284C7, #38BDF8)',
                          color: isOut ? '#9ca3af' : isAdding ? '#064e3b' : '#fff',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: isOut ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: isOut ? 'none' : '0 4px 14px rgba(2, 132, 199, 0.25)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isAdding ? <CheckCircle size={16} /> : <ShoppingBag size={16} />}
                        <span>{isAdding ? 'Added to Cart!' : isOut ? 'Out of Stock' : 'Add to Baby Cart'}</span>
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

export default BabyPage;

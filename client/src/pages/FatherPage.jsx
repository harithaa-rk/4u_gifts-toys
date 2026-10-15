import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, ShoppingBag, Heart, Sparkles, Award, 
  Search, CheckCircle, RefreshCw, Smile, Zap
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';

const DAD_CATEGORIES = [
  { id: 'all', label: 'All Dad Wonders 🎩' },
  { id: 'gadget', label: 'Gadgets & Mechanical Puzzles 🧩' },
  { id: 'desk', label: 'Desk Toys & Collectibles 🏆' },
  { id: 'nostalgia', label: 'Retro & Nostalgic Hits 🕹️' },
  { id: 'bestdad', label: '#1 Super Dad Specials ⭐' },
];

const DAD_JOKES = [
  "Why don't eggs tell jokes? Because they'd crack each other up! 🥚😄",
  "What do you call a toy that can do karate? A chop stick! 🥋🥢",
  "I'm reading a book on anti-gravity... I just can't put it down! 🚀✨",
  "Why did the teddy bear say no to dessert? Because she was stuffed! 🧸🍰",
  "How does a penguin build its house? Igloos it together! 🐧❄️",
  "What did the left eye say to the right eye? Between you and me, something smells! 👀👃",
];

const FatherPage = () => {
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
  const [currentJokeIndex, setCurrentJokeIndex] = useState(0);

  // Fetch real authoritative catalogue items (Zero sample data)
  useEffect(() => {
    const fetchDadCatalogue = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE_URL}/products`);
        if (Array.isArray(data)) {
          // Filter authentic products that match father, dad, gadget, puzzle, car, robot, desk, toy
          const dadItems = data.filter((p) => {
            if (p.status === 'inactive') return false;
            const kw = ['dad', 'father', 'puzzle', 'gadget', 'car', 'robot', 'desk', 'toy', 'game', 'builder'];
            const pCat = (p.category || '').toLowerCase();
            const pSub = (p.subcategory || '').toLowerCase();
            const pName = (p.name || '').toLowerCase();
            const pTags = (p.tags || []).map((t) => t.toLowerCase());
            return kw.some(k => pCat.includes(k) || pSub.includes(k) || pName.includes(k) || pTags.some(t => t.includes(k)));
          });
          setProducts(dadItems.length > 0 ? dadItems : data.filter(p => p.status !== 'inactive'));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Failed to fetch father products:', err);
        toast.error('Unable to load Father collection.');
      } finally {
        setLoading(false);
      }
    };

    fetchDadCatalogue();
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'gadget') return p.price > 800 || (p.tags && p.tags.includes('gadget'));
    if (activeCategory === 'desk') return (p.category || '').toLowerCase().includes('decor') || (p.name || '').toLowerCase().includes('lamp');
    if (activeCategory === 'nostalgia') return p.price <= 600;
    if (activeCategory === 'bestdad') return p.price > 1000;
    return true;
  });

  const handleNextJoke = () => {
    setCurrentJokeIndex((prev) => (prev + 1) % DAD_JOKES.length);
  };

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
    toast.success(`${prod.name} added to cart! 🎩`);
    setTimeout(() => setAddingId(null), 1200);
  };

  const handleWishlist = (e, prod) => {
    e.preventDefault();
    e.stopPropagation();
    const wished = isInWishlist(prod._id);
    toggleWishlist(prod);
    toast.success(wished ? 'Removed from wishlist' : 'Saved to wishlist for Dad! 🎩');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FEF3C7', paddingBottom: 80 }}>
      <div style={{ height: 80 }} />

      {/* ── DARK BUTTER YELLOW & WARM AMBER HONEY HERO BANNER ── */}
      <section
        style={{
          position: 'relative',
          background: 'linear-gradient(180deg, #FDE68A 0%, #FCD34D 50%, #FEF3C7 100%)',
          padding: 'clamp(40px, 7vw, 80px) 5% clamp(30px, 5vw, 60px)',
          textAlign: 'center',
          overflow: 'hidden',
          borderBottom: '2px solid rgba(217, 119, 6, 0.25)',
        }}
      >
        {/* Playful Floating Badges */}
        <motion.div
          animate={{ rotate: [-8, 8, -8], y: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '15%', left: '8%', fontSize: '42px', opacity: 0.7, pointerEvents: 'none' }}
        >
          🎩
        </motion.div>
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: '22%', right: '10%', fontSize: '46px', opacity: 0.7, pointerEvents: 'none' }}
        >
          🏆
        </motion.div>
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
          style={{ position: 'absolute', bottom: '15%', left: '15%', fontSize: '32px', opacity: 0.6, pointerEvents: 'none' }}
        >
          ⚙️
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
              border: '1.5px solid rgba(217, 119, 6, 0.4)',
              color: '#B45309',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(180, 83, 9, 0.1)',
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
              color: '#B45309',
              fontSize: 12,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.15)',
              marginBottom: 16,
              border: '1px solid rgba(217, 119, 6, 0.3)',
            }}
          >
            <Award size={16} color="#B45309" />
            <span>Dark Butter Yellow Edition • Cool Dad Haven</span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5.5vw, 56px)',
              fontWeight: 900,
              color: '#78350F',
              lineHeight: 1.15,
              margin: '0 0 16px',
            }}
          >
            Daddy’s Wonder Lab <span style={{ color: '#D97706' }}>& Amber Toys</span> 🎩
          </h1>

          <p
            style={{
              fontSize: 'clamp(15px, 2vw, 18px)',
              color: '#92400E',
              maxWidth: 620,
              margin: '0 auto 24px',
              lineHeight: 1.6,
              fontWeight: 600,
            }}
          >
            Mechanical puzzles, retro nostalgia, desk marvels, and playful treasures that bring out the kid in every dad.
          </p>

          {/* DAD JOKE DISPENSER (Customer Joy Feature) */}
          <div
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: '#FFFFFF',
              padding: '14px 22px',
              borderRadius: '20px',
              border: '2px solid rgba(217, 119, 6, 0.3)',
              boxShadow: '0 8px 24px rgba(120, 53, 15, 0.08)',
              maxWidth: 580,
              margin: '0 auto 16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Smile size={16} color="#D97706" />
              <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#D97706', letterSpacing: '0.8px' }}>
                Dad Joke of the Moment
              </span>
            </div>
            <p style={{ fontStyle: 'italic', fontSize: 14, color: '#78350F', margin: '0 0 8px', fontWeight: 700 }}>
              "{DAD_JOKES[currentJokeIndex]}"
            </p>
            <button
              onClick={handleNextJoke}
              style={{
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                color: '#fff',
                border: 'none',
                padding: '5px 14px',
                borderRadius: 'var(--radius-pill)',
                fontSize: 11,
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <RefreshCw size={12} /> Another Laugh
            </button>
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
            {DAD_CATEGORIES.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveCategory(m.id)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1.5px solid',
                  borderColor: activeCategory === m.id ? '#D97706' : 'rgba(217, 119, 6, 0.25)',
                  background: activeCategory === m.id ? 'linear-gradient(135deg, #D97706, #B45309)' : '#FFFFFF',
                  color: activeCategory === m.id ? '#FFFFFF' : '#92400E',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: activeCategory === m.id ? '0 4px 14px rgba(217, 119, 6, 0.25)' : '0 2px 6px rgba(0,0,0,0.03)',
                  transition: 'all 0.2s',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 320 }}>
            <Search size={16} color="#D97706" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search gifts for Dad…"
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 'var(--radius-pill)',
                border: '1.5px solid rgba(217, 119, 6, 0.35)',
                background: '#FFFFFF',
                fontSize: 13,
                outline: 'none',
                color: '#78350F',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              }}
            />
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }} style={{ display: 'inline-block', marginBottom: 16 }}>
              <RefreshCw size={36} color="#D97706" />
            </motion.div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#78350F', fontSize: 20, margin: 0 }}>
              Opening Dad's Workshop…
            </h3>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '28px',
              padding: '60px 20px',
              textAlign: 'center',
              border: '2px dashed rgba(217, 119, 6, 0.3)',
              maxWidth: 500,
              margin: '40px auto',
            }}
          >
            <span style={{ fontSize: 52 }}>🎩</span>
            <h3 style={{ fontFamily: 'var(--font-display)', color: '#78350F', fontSize: 22, margin: '14px 0 8px' }}>
              No dad picks found
            </h3>
            <p style={{ color: '#92400E', fontSize: 14, margin: '0 0 20px' }}>
              Reset filters to browse all our authentic boutique collection.
            </p>
            <button
              onClick={() => { setSearch(''); setActiveCategory('all'); }}
              style={{
                padding: '10px 22px',
                borderRadius: 'var(--radius-pill)',
                background: 'linear-gradient(135deg, #D97706, #B45309)',
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
                    border: '1.5px solid rgba(217, 119, 6, 0.25)',
                    boxShadow: '0 10px 28px rgba(180, 83, 9, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                  }}
                >
                  <div
                    onClick={() => navigate(`/product/${prod._id}`)}
                    style={{
                      height: 220,
                      background: 'linear-gradient(180deg, #FEF3C7 0%, #FDE68A 100%)',
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
                      <span style={{ fontSize: 64 }}>🧩</span>
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
                        color: '#B45309',
                        fontSize: 10,
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        letterSpacing: '0.6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Sparkles size={11} color="#B45309" />
                      <span>Dad Favorite</span>
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
                      <Heart size={16} color={isWished ? '#D97706' : '#B45309'} fill={isWished ? '#D97706' : 'none'} />
                    </button>
                  </div>

                  <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: '#D97706', textTransform: 'uppercase', marginBottom: 4 }}>
                        {prod.category || 'Dad’s Wonder'}
                      </div>
                      <h4
                        onClick={() => navigate(`/product/${prod._id}`)}
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 16,
                          fontWeight: 800,
                          color: '#78350F',
                          margin: '0 0 6px',
                          cursor: 'pointer',
                          lineHeight: 1.3,
                        }}
                      >
                        {prod.name}
                      </h4>
                      <p style={{ color: '#92400E', fontSize: 12, margin: '0 0 12px', lineHeight: 1.4, opacity: 0.85 }}>
                        {prod.description ? (prod.description.length > 60 ? prod.description.slice(0, 58) + '…' : prod.description) : 'Engaging mechanical wonder for dad.'}
                      </p>
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                        <div>
                          <span style={{ fontSize: 11, color: '#92400E' }}>Price: </span>
                          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: '#D97706' }}>
                            ₹{Number(prod.price).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-pill)',
                            background: isOut ? '#fee2e2' : 'rgba(217, 119, 6, 0.15)',
                            color: isOut ? '#dc2626' : '#B45309',
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
                          background: isOut ? '#e5e7eb' : isAdding ? '#72E6B0' : 'linear-gradient(135deg, #D97706, #B45309)',
                          color: isOut ? '#9ca3af' : isAdding ? '#064e3b' : '#fff',
                          border: 'none',
                          fontWeight: 800,
                          fontSize: 13,
                          cursor: isOut ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          boxShadow: isOut ? 'none' : '0 4px 14px rgba(217, 119, 6, 0.25)',
                          transition: 'all 0.2s',
                        }}
                      >
                        {isAdding ? <CheckCircle size={16} /> : <ShoppingBag size={16} />}
                        <span>{isAdding ? 'Added to Cart!' : isOut ? 'Out of Stock' : 'Add to Dad’s Cart'}</span>
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

export default FatherPage;

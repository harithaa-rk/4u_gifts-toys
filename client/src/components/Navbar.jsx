import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, ShoppingCart, User, Gift, Settings, Package, LogOut, ShieldAlert, Heart, Menu, X, Sparkles, Globe } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './LanguageSelector';

const NAV_LINKS = [
  { name: 'Shop',        path: '/shop' },
  { name: 'Baby',        path: '/baby' },
  { name: 'Mommy',       path: '/mommy' },
  { name: 'Father',      path: '/father' },
  { name: 'Decor',       path: '/decor' },
  { name: 'Fancy Gifts', path: '/fancy' },
];

const Navbar = ({ onAdminClick }) => {
  const { t } = useTranslation();
  const { cartCount, openCart } = useCart();
  const { isLoggedIn, logout, currentUser } = useAuth();
  const { wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems.length;
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { name: t('nav.shop', 'Shop'),               path: '/shop' },
    { name: t('nav.baby', 'Baby'),               path: '/baby' },
    { name: t('nav.mommy', 'Mommy'),             path: '/mommy' },
    { name: t('nav.father', 'Father'),           path: '/father' },
    { name: t('nav.decor', 'Decor'),             path: '/decor' },
    { name: t('nav.fancyGifts', 'Fancy Gifts'),  path: '/fancy' },
  ];
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hidden, setHidden] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const accountRef = useRef(null);
  const searchRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsAccountOpen(false);
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setIsAccountOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setIsSearchOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync search with URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const val = params.get('search') || '';
    setSearchQuery(val);
    if (val) setIsSearchOpen(true);
  }, [location.search]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(latest > 120 && latest > prev);
    setScrolled(latest > 20);
  });

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    } else {
      setIsSearchOpen(!isSearchOpen);
    }
  };

  return (
    <>
      <style>{`
        .nav-root {
          position: fixed;
          top: 14px;
          left: 0; right: 0;
          margin: 0 auto;
          width: 92%;
          max-width: 1260px;
          z-index: var(--z-nav, 150);
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
        }
        .nav-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 10px 20px;
          border-radius: var(--radius-pill, 100px);
          background: rgba(255,252,247,0.82);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(247,184,208,0.35);
          box-shadow: 0 4px 24px rgba(53,36,61,0.08), 0 1px 4px rgba(53,36,61,0.04);
          transition: all 0.3s;
        }
        .nav-inner.scrolled {
          background: rgba(255,252,247,0.95);
          box-shadow: 0 8px 32px rgba(53,36,61,0.12);
        }
        /* Logo */
        .nav-logo {
          display: flex; align-items: center; gap: 9px;
          font-family: var(--font-display, 'Nunito', sans-serif);
          font-size: 20px; font-weight: 900;
          color: var(--plum, #35243D);
          text-decoration: none; flex-shrink: 0;
        }
        .nav-logo .logo-icon {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #F7B8D0, #E8749A);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 12px rgba(232,116,154,0.35);
          font-size: 18px;
        }
        .nav-logo span { color: var(--primary, #E8749A); }

        /* Nav links */
        .nav-links {
          display: flex; align-items: center; gap: 2px;
          flex: 1; justify-content: center;
        }
        .nav-link {
          position: relative; font-size: 14px; font-weight: 600;
          color: var(--text-muted, #7a5c8a); padding: 7px 14px;
          border-radius: var(--radius-pill, 100px);
          transition: color 0.2s; text-decoration: none;
        }
        .nav-link:hover { color: var(--plum, #35243D); }
        .nav-link.active { color: #fff; }
        .nav-link-pill {
          position: absolute; inset: 0; border-radius: var(--radius-pill, 100px);
          background: linear-gradient(135deg, var(--primary, #E8749A), var(--primary-dark, #C9184A));
          z-index: -1;
          box-shadow: 0 4px 14px rgba(232,116,154,0.35);
        }
        /* Actions */
        .nav-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

        .nav-icon-btn {
          width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; border: none; cursor: pointer;
          background: transparent; color: var(--text-muted, #7a5c8a);
          transition: all 0.2s; position: relative;
        }
        .nav-icon-btn:hover { background: var(--blush, #FFF0F5); color: var(--plum, #35243D); }

        .nav-cart-btn {
          width: 38px; height: 38px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 50%; border: none; cursor: pointer;
          background: linear-gradient(135deg, #E8749A, #C9184A);
          color: #fff; position: relative;
          box-shadow: 0 4px 14px rgba(232,116,154,0.4);
          transition: all 0.2s;
        }
        .nav-cart-btn:hover { transform: scale(1.1); box-shadow: 0 6px 20px rgba(232,116,154,0.5); }

        .nav-badge {
          position: absolute; top: -4px; right: -4px;
          width: 17px; height: 17px;
          background: var(--plum, #35243D); color: #fff;
          font-size: 10px; font-weight: 800;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          border: 1.5px solid #fff;
        }

        /* Search expandable */
        .nav-search-wrap {
          display: flex; align-items: center; overflow: hidden;
          border-radius: var(--radius-pill, 100px); transition: all 0.3s;
        }
        .nav-search-input {
          border: none; background: transparent; outline: none;
          font-family: var(--font-body, 'Inter', sans-serif);
          font-size: 14px; color: var(--plum, #35243D);
          width: 100%; margin-left: 8px;
        }

        /* Account dropdown */
        .account-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 220px; background: rgba(255,252,247,0.97);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--card-border, rgba(247,184,208,0.35));
          border-radius: var(--radius-lg, 24px);
          box-shadow: 0 16px 40px rgba(53,36,61,0.14);
          padding: 8px; display: flex; flex-direction: column; gap: 3px;
          z-index: 200;
        }
        .acct-header {
          padding: 10px 12px; border-bottom: 1px solid var(--border, rgba(220,210,255,0.4));
          margin-bottom: 4px;
        }
        .acct-header .name { font-weight: 700; font-size: 14px; color: var(--plum, #35243D); }
        .acct-header .sub  { font-size: 12px; color: var(--text-muted, #7a5c8a); margin-top: 2px; }
        .acct-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: var(--radius-md, 16px);
          background: transparent; border: none; cursor: pointer;
          font-size: 14px; font-weight: 500; text-align: left; width: 100%;
          color: var(--text, #35243D); transition: background 0.15s;
        }
        .acct-item:hover { background: var(--blush, #FFF0F5); }

        /* Mobile menu */
        .mobile-menu {
          position: fixed; inset: 0;
          background: var(--ivory, #FFFCF7);
          z-index: 300;
          display: flex; flex-direction: column;
          padding: 24px 5%;
          overflow-y: auto;
        }
        .mobile-nav-link {
          display: flex; align-items: center; gap: 12px;
          padding: 16px 20px; border-radius: var(--radius-lg, 24px);
          font-family: var(--font-display, 'Nunito', sans-serif);
          font-size: 20px; font-weight: 700; color: var(--plum, #35243D);
          text-decoration: none; transition: background 0.2s;
        }
        .mobile-nav-link:hover, .mobile-nav-link.active {
          background: var(--blush, #FFF0F5); color: var(--primary, #E8749A);
        }

        @media (max-width: 900px) {
          .nav-links { display: none; }
          .nav-root { width: 94%; top: 10px; }
        }
        @media (max-width: 480px) {
          .nav-logo { font-size: 17px; }
          .nav-logo .logo-icon { width: 32px; height: 32px; font-size: 15px; }
        }
      `}</style>

      {/* Main Nav */}
      <motion.div
        className="nav-root"
        variants={{ visible: { y: 0, opacity: 1 }, hidden: { y: '-130%', opacity: 0 } }}
        animate={hidden ? 'hidden' : 'visible'}
        transition={{ duration: 0.35, ease: 'easeInOut' }}
      >
        <div className={`nav-inner${scrolled ? ' scrolled' : ''}`}>

          {/* Logo */}
          <Link to="/" className="nav-logo" aria-label="4U Toys & Treats">
            <motion.img
              src="/logo.png"
              alt="4U Toys & Treats - We Sell Happiness..."
              style={{
                height: 46,
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
                filter: 'drop-shadow(0 2px 6px rgba(64,32,68,0.08))',
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="nav-links" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`nav-link${isActive ? ' active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.div
                      className="nav-link-pill"
                      layoutId="nav-active-pill"
                      transition={{ type: 'spring', bounce: 0.22, duration: 0.6 }}
                    />
                  )}
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="nav-actions">

            {/* Language Selector (Global, works logged in & logged out) */}
            <LanguageSelector variant="compact" />

            {/* Search */}
            <div ref={searchRef} style={{ position: 'relative' }}>
              <motion.div
                className="nav-search-wrap"
                animate={{ width: isSearchOpen ? Math.min(240, window.innerWidth * 0.5) : 38 }}
                style={{
                  background: isSearchOpen ? 'var(--blush)' : 'transparent',
                  border: isSearchOpen ? '1.5px solid var(--pink)' : '1.5px solid transparent',
                }}
              >
                <motion.button
                  className="nav-icon-btn"
                  style={{ background: 'transparent', border: 'none', flexShrink: 0, width: 38, height: 38 }}
                  onClick={handleSearchSubmit}
                  aria-label="Search"
                  whileTap={{ scale: 0.9 }}
                >
                  <Search size={18} />
                </motion.button>
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.input
                      className="nav-search-input"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      type="text"
                      placeholder={t('nav.searchPlaceholder', 'Search toys, gifts…')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSearchSubmit();
                        if (e.key === 'Escape') setIsSearchOpen(false);
                      }}
                      autoFocus
                      aria-label="Search products"
                    />
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Auth actions */}
            <AnimatePresence mode="wait">
              {isLoggedIn ? (
                <motion.div
                  key="auth"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ position: 'relative' }}
                  ref={accountRef}
                >
                  <motion.button
                    className="nav-icon-btn"
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    aria-label="My account"
                    aria-expanded={isAccountOpen}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    style={{ color: isAccountOpen ? 'var(--primary)' : undefined }}
                  >
                    <User size={20} />
                  </motion.button>
                  <AnimatePresence>
                    {isAccountOpen && (
                      <motion.div
                        className="account-dropdown"
                        initial={{ opacity: 0, y: 12, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="acct-header">
                          <div className="name">{currentUser?.name || t('nav.myAccount', 'My Account')}</div>
                          <div className="sub">{t('nav.welcomeBack', 'Welcome back! 🌸')}</div>
                        </div>
                        <button className="acct-item" onClick={() => { setIsAccountOpen(false); navigate('/orders'); }}>
                          <Package size={15} /> {t('nav.orderHistory', 'Order History')}
                        </button>
                        <button className="acct-item" onClick={() => { setIsAccountOpen(false); navigate('/profile'); }}>
                          <Settings size={15} /> {t('nav.profileSettings', 'Profile & Settings')}
                        </button>
                        <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
                        <button className="acct-item" style={{ color: 'var(--primary)' }} onClick={() => { setIsAccountOpen(false); onAdminClick(); }}>
                          <ShieldAlert size={15} /> {t('nav.adminDashboard', 'Admin Dashboard')}
                        </button>
                        <button className="acct-item" style={{ color: '#e63946' }} onClick={handleLogout}>
                          <LogOut size={15} /> {t('nav.logout', 'Log Out')}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <motion.div
                  key="guest"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', gap: 8 }}
                >
                  <Link to="/login">
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      style={{ padding: '7px 16px', background: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: '100px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      {t('nav.login', 'Log in')}
                    </motion.button>
                  </Link>
                  <Link to="/register" className="hide-mobile">
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      style={{ padding: '7px 16px', background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))', color: '#fff', border: 'none', borderRadius: '100px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', boxShadow: 'var(--shadow-pink)' }}
                    >
                      {t('nav.signup', 'Sign up')}
                    </motion.button>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>


            {/* Wishlist */}
            <motion.button
              className="nav-icon-btn"
              onClick={() => {
                if (!isLoggedIn) {
                  toast.error('Please login to view your wishlist 💖');
                  navigate('/login');
                } else {
                  navigate('/wishlist');
                }
              }}
              aria-label={`Wishlist (${wishlistCount} items)`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              style={{ color: wishlistCount > 0 && isLoggedIn ? 'var(--primary)' : undefined }}
            >
              <Heart size={20} fill={wishlistCount > 0 && isLoggedIn ? 'var(--primary)' : 'none'} />
              <AnimatePresence>
                {isLoggedIn && wishlistCount > 0 && (
                  <motion.span
                    className="nav-badge"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Cart */}
            <motion.button
              className="nav-cart-btn"
              onClick={openCart}
              aria-label={`Cart (${cartCount} items)`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <ShoppingCart size={19} />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    className="nav-badge"
                    initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                    style={{ background: '#fff', color: 'var(--primary-dark)' }}
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Hamburger — mobile only */}
            <motion.button
              className="nav-icon-btn"
              style={{ display: 'none' }}
              id="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
              whileTap={{ scale: 0.9 }}
            >
              <Menu size={22} />
            </motion.button>

            <style>{`
              @media (max-width: 900px) {
                #mobile-menu-toggle { display: flex !important; }
              }
            `}</style>

          </div>
        </div>
      </motion.div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)} style={{ display: 'flex', alignItems: 'center' }}>
                <img
                  src="/logo.png"
                  alt="4U Toys & Treats"
                  style={{ height: 40, width: 'auto', objectFit: 'contain' }}
                />
              </Link>
              <motion.button
                onClick={() => setIsMobileMenuOpen(false)}
                className="nav-icon-btn"
                whileTap={{ scale: 0.9 }}
                aria-label="Close menu"
              >
                <X size={24} />
              </motion.button>
            </div>

            {/* Links */}
            <nav style={{ flex: 1 }}>
              <motion.div
                variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
                initial="hidden"
                animate="visible"
              >
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <motion.div
                      key={link.path}
                      variants={{ hidden: { opacity: 0, x: 30 }, visible: { opacity: 1, x: 0 } }}
                    >
                      <Link
                        to={link.path}
                        className={`mobile-nav-link${isActive ? ' active' : ''}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {link.name}
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </nav>

            {/* Mobile Language Selector */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255, 99, 183, 0.2)' }}>
              <LanguageSelector variant="mobile" onSelect={() => setIsMobileMenuOpen(false)} />
            </div>

            {/* Mobile auth actions */}
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {isLoggedIn ? (
                <>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigate('/orders'); }}
                    style={{ padding: '14px', borderRadius: 'var(--radius-pill)', background: 'var(--blush)', color: 'var(--plum)', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <Package size={18} /> {t('nav.orderHistory', 'Order History')}
                  </button>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigate('/profile'); }}
                    style={{ padding: '14px', borderRadius: 'var(--radius-pill)', background: 'var(--blush)', color: 'var(--plum)', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <Settings size={18} /> {t('nav.profileSettings', 'Profile & Settings')}
                  </button>
                  <button onClick={() => { setIsMobileMenuOpen(false); navigate('/wishlist'); }}
                    style={{ padding: '14px', borderRadius: 'var(--radius-pill)', background: 'var(--blush)', color: 'var(--primary)', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <Heart size={18} /> {t('nav.wishlist', 'Wishlist')} {wishlistCount > 0 && `(${wishlistCount})`}
                  </button>
                  <button onClick={handleLogout}
                    style={{ padding: '14px', borderRadius: 'var(--radius-pill)', background: 'var(--blush)', color: '#e63946', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                    <LogOut size={18} /> {t('nav.logout', 'Log Out')}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-pill)', background: 'transparent', color: 'var(--primary)', border: '2px solid var(--primary)', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
                      {t('nav.login', 'Log in')}
                    </button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <button style={{ width: '100%', padding: '14px', borderRadius: 'var(--radius-pill)', background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))', color: '#fff', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: 'var(--shadow-pink)' }}>
                      {t('nav.signup', 'Create Account')}
                    </button>
                  </Link>
                </>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;

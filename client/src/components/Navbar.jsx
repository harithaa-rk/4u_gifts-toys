import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, ShoppingCart, User, Gift, Settings, Package, LogOut, ShieldAlert, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

const Navbar = ({ onAdminClick }) => {
  const { cartCount, openCart } = useCart();
  const { isLoggedIn, logout } = useAuth();
  const { wishlistItems } = useWishlist();
  const wishlistCount = wishlistItems.length;
  const navigate = useNavigate();
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [hidden, setHidden] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { scrollY } = useScroll();
  const settingsRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsSettingsOpen(false);
    navigate('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync search input with URL search parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchVal = params.get('search') || '';
    setSearchQuery(searchVal);
    if (searchVal) {
      setIsSearchOpen(true);
    }
  }, [location.search]);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious();
    if (latest > 100 && latest > previous) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  return (
    <motion.header
      variants={{
        visible: { y: 0, opacity: 1, scale: 1 },
        hidden: { y: "-150%", opacity: 0, scale: 0.95 }
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="main-header"
    >
      <style>{`
        .main-header {
          position: fixed;
          top: 20px;
          left: 0;
          right: 0;
          margin: 0 auto;
          width: 92%;
          max-width: 1200px;
          z-index: 100;
          background: var(--card-bg, rgba(255, 255, 255, 0.75));
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05);
          border-radius: 100px;
          padding: 10px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-sizing: border-box;
        }

        .header-logo {
          text-decoration: none;
          flex-shrink: 0;
        }

        .nav-container {
          display: flex;
          gap: 10px;
          align-items: center;
          transition: all 0.3s ease;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          flex-shrink: 0;
          transition: all 0.3s ease;
        }

        @media (max-width: 900px) {
          .main-header {
            flex-wrap: wrap !important;
            border-radius: 24px !important;
            padding: 12px 16px !important;
            gap: 12px 0px !important;
          }
          .header-logo {
            order: 1;
          }
          .header-actions {
            order: 2;
          }
          .nav-container {
            order: 3;
            width: 100%;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 4px 0;
            gap: 6px;
          }
          .nav-container::-webkit-scrollbar {
            display: none;
          }
          .nav-link-item {
            flex-shrink: 0;
          }
        }

        @media (max-width: 600px) {
          .header-actions {
            gap: 10px !important;
          }
          .header-actions button {
            padding: 6px 12px !important;
            font-size: 13px !important;
          }
          .header-logo div {
            font-size: 18px !important;
          }
        }
        @media (max-width: 480px) {
          .main-header {
            top: 10px !important;
            width: 96% !important;
            padding: 10px 14px !important;
          }
          .header-actions {
            gap: 8px !important;
          }
        }
      `}</style>

      {/* Logo */}
      <Link to="/" className="header-logo" style={{ textDecoration: 'none' }}>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Gift size={26} />
          </motion.div>
          4U Toys
        </motion.div>
      </Link>

      {/* Navigation Menu */}
      <nav className="nav-container">
        {[
          { name: 'Shop', path: '/shop' },
          { name: 'Baby', path: '/baby' },
          { name: 'Mommy', path: '/mommy' },
          { name: 'Father', path: '/father' },
          { name: 'Decor', path: '/decor' },
          { name: 'Fancy Gifts', path: '/fancy' },
        ].map((link) => {
          const isActive = location.pathname === link.path;
          return (
            <Link key={link.name} to={link.path} className="nav-link-item" style={{ textDecoration: 'none', position: 'relative' }}>
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  fontSize: '15px',
                  fontWeight: 600,
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  padding: '8px 16px',
                  transition: 'color 0.2s',
                  cursor: 'pointer'
                }}
              >
                {link.name}
              </div>
              {isActive && (
                <motion.div
                  layoutId="navbar-active-pill"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'var(--primary)',
                    borderRadius: '30px',
                    zIndex: 1,
                    boxShadow: '0 4px 15px rgba(244, 143, 177, 0.4)'
                  }}
                  transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Actions */}
      <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {/* Search */}
        <div style={{ position: 'relative' }}>
          <motion.div
            initial={false}
            animate={{ width: isSearchOpen ? "min(250px, 60vw)" : 40 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              background: isSearchOpen ? 'var(--bg)' : 'transparent',
              borderRadius: '20px',
              padding: isSearchOpen ? '5px 15px' : '5px',
              border: isSearchOpen ? '1px solid var(--border)' : '1px solid transparent',
              overflow: 'hidden'
            }}
          >
            <Search
              size={20}
              style={{ cursor: 'pointer', color: 'var(--text)' }}
              onClick={() => {
                if (isSearchOpen && searchQuery.trim() !== '') {
                  navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                } else {
                  setIsSearchOpen(!isSearchOpen);
                }
              }}
            />
            <AnimatePresence>
              {isSearchOpen && (
                <motion.input
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  type="text"
                  placeholder="Search magical gifts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
                    }
                  }}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    marginLeft: '10px',
                    width: '100%',
                    color: 'var(--text)'
                  }}
                  autoFocus
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>


        {/* Auth-gated actions */}
        <AnimatePresence mode="wait">
          {isLoggedIn ? (
            <motion.div key="authenticated" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

              {/* Settings Dropdown */}
              <div style={{ position: 'relative' }} ref={settingsRef}>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isSettingsOpen ? 'var(--primary)' : 'var(--text)', display: 'flex', alignItems: 'center', padding: '5px' }}
                >
                  <User size={24} />
                </motion.button>
                <AnimatePresence>
                  {isSettingsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      style={{ position: 'absolute', top: '120%', right: 0, width: '220px', background: 'var(--card-bg, rgba(255,255,255,0.9))', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', padding: '8px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 150 }}
                    >
                      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)' }}>My Account</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Welcome back! 👋</div>
                      </div>
                      <SettingsItem icon={<Package size={16} />} label="Order History" onClick={() => { setIsSettingsOpen(false); navigate('/orders'); }} />
                      <SettingsItem icon={<Settings size={16} />} label="Preferences" onClick={() => { setIsSettingsOpen(false); toast('Preferences coming soon!', { icon: '⚙️' }); }} />
                      <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                      <SettingsItem icon={<ShieldAlert size={16} />} label="Admin Dashboard" onClick={() => { setIsSettingsOpen(false); onAdminClick(); }} color="var(--primary)" />
                      <SettingsItem icon={<LogOut size={16} />} label="Log Out" color="#e63946" onClick={handleLogout} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div key="guest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{ padding: '8px 18px', background: 'transparent', color: 'var(--primary)', border: '1.5px solid var(--primary)', borderRadius: '30px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}
                >
                  Log in
                </motion.button>
              </Link>
              <Link to="/register" style={{ textDecoration: 'none' }}>
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  style={{ padding: '8px 18px', background: 'var(--primary)', color: '#fff', border: '1.5px solid var(--primary)', borderRadius: '30px', fontWeight: 600, fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(244,143,177,0.35)' }}
                >
                  Sign Up
                </motion.button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Wishlist Icon */}
        <motion.div
          whileHover={{ scale: 1.1, boxShadow: '0 6px 22px rgba(255,77,109,0.45)' }}
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            if (!isLoggedIn) {
              toast.error('Please login to view your wishlist! 💖', {
                style: {
                  borderRadius: '20px',
                  background: 'var(--card-bg, #fff)',
                  color: 'var(--text, #333)',
                  boxShadow: '0 10px 25px rgba(255, 77, 109, 0.2)',
                },
              });
              navigate('/login');
            } else {
              navigate('/wishlist');
            }
          }}
          style={{
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ff4d6d, #ff758f)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            boxShadow: '0 4px 14px rgba(255, 77, 109, 0.35)',
          }}
        >
          <Heart size={20} color="#fff" fill={isLoggedIn && wishlistCount > 0 ? '#fff' : 'none'} />
          <AnimatePresence>
            {isLoggedIn && wishlistCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#fff', color: '#ff4d6d', fontSize: '10px', fontWeight: 800, height: '18px', minWidth: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 2px 6px rgba(255,77,109,0.4)', border: '1.5px solid #ff4d6d' }}
              >
                {wishlistCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Cart Icon (Visible to Everyone) */}
        <motion.div
          whileHover={{ scale: 1.1, boxShadow: '0 6px 22px rgba(255,77,109,0.45)' }}
          whileTap={{ scale: 0.9 }}
          onClick={openCart}
          style={{
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #ff4d6d, #c9184a)',
            borderRadius: '50%',
            width: '42px',
            height: '42px',
            boxShadow: '0 4px 14px rgba(255, 77, 109, 0.35)',
          }}
        >
          <ShoppingCart size={20} color="#fff" />
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                style={{ position: 'absolute', top: '-5px', right: '-5px', background: '#fff', color: '#c9184a', fontSize: '10px', fontWeight: 800, height: '18px', minWidth: '18px', borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 2px 6px rgba(255,77,109,0.4)', border: '1.5px solid #ff4d6d' }}
              >
                {cartCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </motion.header>
  );
};

// Helper component for settings items
const SettingsItem = ({ icon, label, onClick, color = "var(--text)" }) => {
  return (
    <motion.button
      whileHover={{ backgroundColor: "var(--bg)", x: 4 }}
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 12px',
        background: 'transparent',
        border: 'none',
        borderRadius: '10px',
        color: color,
        fontWeight: 500,
        fontSize: '14px',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.2s'
      }}
    >
      {icon} {label}
    </motion.button>
  );
};

export default Navbar;

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Mail, MapPin, Phone, Heart, Sparkles } from 'lucide-react';

const InstagramIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
import Navbar from './Navbar';
import { useTranslation } from 'react-i18next';
import CartDrawer from './CartDrawer';
import FloatingActions from './FloatingActions';

const ADMIN_PASSWORD = 'A_4utoyshop';
const ADMIN_EMAIL    = '4u.toyshop.2026@gmail.com';

const StoreLayout = ({ children }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate  = useNavigate();

  const announcements = [
    t('announcements.msg1', '✨ A Little Magic in Every Gift'),
    t('announcements.msg2', '🎁 Discover Something Special Today'),
    t('announcements.msg3', '🌟 Find Your Next Favourite Toy'),
    t('announcements.msg4', '💝 Thoughtfully Curated — Just for You'),
  ];

  const [showAdminModal, setShowAdminModal]   = useState(false);
  const [password, setPassword]               = useState('');
  const [adminError, setAdminError]           = useState('');
  const [announcementIdx, setAnnouncementIdx] = useState(0);

  const handleAdminLogin = () => {
    setShowAdminModal(true);
    setPassword('');
    setAdminError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setShowAdminModal(false);
      setPassword('');
      setAdminError('');
      navigate('/admin/dashboard');
    } else {
      setAdminError(t('adminModal.incorrectPassword', 'Incorrect password. Please try again.'));
    }
  };

  // Rotate announcement bar
  useEffect(() => {
    const id = setInterval(() => {
      setAnnouncementIdx((i) => (i + 1) % announcements.length);
    }, 3500);
    return () => clearInterval(id);
  }, [announcements.length]);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* ── Announcement Bar ── */}
      <div style={{
        background: 'linear-gradient(90deg, var(--plum) 0%, #5c4069 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '9px 16px',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '0.3px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 200,
      }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={announcementIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            style={{ display: 'inline-block' }}
          >
            {announcements[announcementIdx]}
          </motion.span>
        </AnimatePresence>
      </div>

      <Navbar onAdminClick={handleAdminLogin} />

      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.28 }}
          style={{ flex: 1 }}
        >
          {children}
        </motion.main>
      </AnimatePresence>

      {/* ── Footer ── */}
      <footer style={{
        background: 'linear-gradient(180deg, var(--blush) 0%, var(--ivory) 100%)',
        borderTop: '1px solid var(--card-border)',
        padding: 'clamp(48px, 8vw, 80px) 5% clamp(24px, 4vw, 40px)',
        marginTop: 'auto',
      }}>
        <div style={{ maxWidth: 1320, margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'clamp(32px, 5vw, 48px)',
            marginBottom: 48,
          }}>

            {/* Brand */}
            <div style={{ gridColumn: 'span 1' }}>
              <Link to="/" style={{ display: 'inline-block', marginBottom: 16 }}>
                <img
                  src="/logo.png"
                  alt="4U Toys & Treats - We Sell Happiness..."
                  style={{ height: 46, width: 'auto', objectFit: 'contain' }}
                />
              </Link>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-muted)', maxWidth: 220 }}>
                {t('footer.tagline', 'Little wonders, endless smiles. Every gift holds a little magic. ✨')}
              </p>
              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                {[
                  { icon: <InstagramIcon size={18} />, href: '#', label: 'Instagram' },
                  { icon: <FacebookIcon size={18} />, href: '#', label: 'Facebook' },
                ].map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    style={{
                      width: 38, height: 38,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%',
                      background: 'rgba(247,184,208,0.25)',
                      color: 'var(--primary)',
                      border: '1px solid var(--card-border)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary)'; e.currentTarget.style.color = '#fff'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(247,184,208,0.25)'; e.currentTarget.style.color = 'var(--primary)'; }}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Shop */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--plum)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('nav.shop', 'Shop')}
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: t('shop.allCategories', 'All Products'), to: '/shop' },
                  { label: t('nav.baby', 'Baby Gifts'), to: '/baby' },
                  { label: t('nav.mommy', 'Mommy Collection'), to: '/mommy' },
                  { label: t('nav.father', "Father's Picks"), to: '/father' },
                  { label: t('nav.fancyGifts', 'Fancy Gifts'), to: '/fancy' },
                  { label: t('nav.decor', 'Decor'), to: '/decor' },
                ].map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      style={{ fontSize: 14, color: 'var(--text-muted)', transition: 'color 0.2s', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--plum)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('nav.myAccount', 'Account')}
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: t('nav.orders', 'My Orders'), to: '/orders' },
                  { label: t('nav.wishlist', 'Wishlist'), to: '/wishlist' },
                  { label: t('nav.login', 'Login'), to: '/login' },
                  { label: t('nav.signup', 'Create Account'), to: '/register' },
                ].map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      style={{ fontSize: 14, color: 'var(--text-muted)', transition: 'color 0.2s', textDecoration: 'none' }}
                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 800, color: 'var(--plum)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('footer.contactUs', 'Contact')}
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { icon: <Mail size={14} />, text: ADMIN_EMAIL },
                  { icon: <MapPin size={14} />, text: 'India' },
                ].map((item, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14, color: 'var(--text-muted)' }}>
                    <span style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }}>{item.icon}</span>
                    <span style={{ lineHeight: 1.5 }}>{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* Bottom bar */}
          <div style={{
            borderTop: '1px solid var(--card-border)',
            paddingTop: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}>
            <p style={{ fontSize: 13, color: 'var(--text-light)' }}>
              © {new Date().getFullYear()} 4U Toys & Gifts. Made with{' '}
              <Heart size={12} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--primary)' }} fill="var(--primary)" />{' '}
              for little ones.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: t('footer.privacyPolicy', 'Privacy Policy'), key: 'privacy' },
                { label: t('footer.terms', 'Terms'), key: 'terms' },
                { label: t('footer.returnsPolicy', 'Refund Policy'), key: 'refund' },
              ].map((item) => (
                <span key={item.key} style={{ fontSize: 13, color: 'var(--text-light)', cursor: 'pointer', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-light)'}
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer />
      <FloatingActions />

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(53,36,61,0.5)',
              backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2000,
            }}
            onClick={(e) => e.target === e.currentTarget && setShowAdminModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              style={{
                background: 'var(--ivory)',
                padding: 40,
                borderRadius: 'var(--radius-xl)',
                width: '90%', maxWidth: 400,
                textAlign: 'center',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--card-border)',
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>🔒</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 8, color: 'var(--plum)' }}>
                {t('adminModal.title', 'Admin Access')}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                {ADMIN_EMAIL}
              </p>
              <form onSubmit={handleSubmit}>
                <input
                  type="password"
                  placeholder={t('adminModal.placeholder', 'Enter password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%', padding: '14px 16px', fontSize: 15,
                    border: '1.5px solid var(--card-border)',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--white)',
                    color: 'var(--plum)', outline: 'none',
                    marginBottom: 12, boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
                {adminError && (
                  <p style={{ color: '#e63946', fontSize: 13, marginBottom: 14, fontWeight: 600 }}>
                    {adminError}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={() => setShowAdminModal(false)}
                    style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-pill)', background: 'var(--blush)', color: 'var(--plum)', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14 }}>
                    {t('adminModal.cancel', 'Cancel')}
                  </button>
                  <button type="submit"
                    style={{ flex: 1, padding: '12px', borderRadius: 'var(--radius-pill)', background: 'linear-gradient(135deg,var(--primary),var(--primary-dark))', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: 14, boxShadow: 'var(--shadow-pink)' }}>
                    {t('adminModal.login', 'Login')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoreLayout;

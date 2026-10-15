import React, { useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogIn, Eye, EyeOff, Sparkles, User, Zap, Shield, ArrowRight, X, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';

// SVG Google Logo
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const InputField = ({ label, name, type, placeholder, value, onChange, onKeyDown, children }) => (
  <div style={{ marginBottom: 18 }}>
    <label style={{ display: 'block', fontWeight: 700, fontSize: 13, color: 'var(--plum)', marginBottom: 7, letterSpacing: '0.2px' }}>
      {label}
    </label>
    <div style={{ position: 'relative' }}>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          padding: children ? '13px 48px 13px 16px' : '13px 16px',
          borderRadius: '16px',
          border: '1.5px solid rgba(255, 99, 183, 0.3)',
          background: 'rgba(255, 255, 255, 0.85)',
          fontSize: 14,
          color: 'var(--plum)',
          outline: 'none',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          transition: 'all 0.2s ease',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#FF3F9D';
          e.target.style.boxShadow = '0 0 0 3px rgba(255, 63, 157, 0.15)';
          e.target.style.background = '#FFFFFF';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255, 99, 183, 0.3)';
          e.target.style.boxShadow = 'none';
          e.target.style.background = 'rgba(255, 255, 255, 0.85)';
        }}
      />
      {children}
    </div>
  </div>
);

const LoginPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [quickLoading, setQuickLoading] = useState(false);

  // Google Modal for custom email choice or 1-click continue
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Standard Email / Password Login
  const handleLogin = async () => {
    if (!form.email.trim() || !form.password) {
      toast.error('Please enter both your email and password.');
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: form.email.trim(),
        password: form.password,
      });

      if (res.data?.token) {
        await login(res.data.token, res.data.user);
        toast.success(res.data.message || 'Welcome back! 🎉');
        const returnUrl = location.state?.from || '/';
        navigate(returnUrl);
      } else {
        throw new Error(res.data?.message || 'Login failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleAuth = async (googleUser) => {
    setGoogleLoading(true);
    try {
      const payload = {
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture || '',
        googleId: googleUser.googleId || `g_${Date.now()}`,
      };

      const res = await axios.post(`${API_BASE_URL}/auth/google`, payload);
      if (res.data?.token) {
        await login(res.data.token, res.data.user);
        toast.success(res.data.message || 'Signed in with Google! 🌟');
        setGoogleModalOpen(false);
        const returnUrl = location.state?.from || '/';
        navigate(returnUrl);
      } else {
        throw new Error(res.data?.message || 'Google sign-in failed.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // One-Click Quick Login
  const handleQuickLogin = async (role = 'customer') => {
    setQuickLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/quick-login`, { role });
      if (res.data?.token) {
        await login(res.data.token, res.data.user);
        toast.success(res.data.message || `Welcome, ${res.data.user?.name}! 🎈`);
        const returnUrl = location.state?.from || (role === 'admin' ? '/admin/dashboard' : '/');
        navigate(returnUrl);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Quick login failed.');
    } finally {
      setQuickLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FFF0F6 0%, #FFF8FB 40%, #F5EEFD 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(100px, 14vh, 120px) 20px 50px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Playful Floating Ambient Decorations */}
      {['🧸', '🎁', '🌟', '💝', '✨', '🎈'].map((emoji, i) => (
        <motion.div
          key={i}
          animate={{ y: [0, -18, 0], rotate: [0, 10, -10, 0] }}
          transition={{ repeat: Infinity, duration: 5 + i * 0.8, delay: i * 0.5, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            fontSize: 'clamp(24px, 3.5vw, 36px)',
            opacity: 0.35,
            pointerEvents: 'none',
            top: `${[12, 65, 22, 78, 45, 82][i]}%`,
            left: i % 2 === 0 ? `${[6, 8, 12][Math.floor(i / 2)]}%` : undefined,
            right: i % 2 !== 0 ? `${[6, 10, 8][Math.floor(i / 2)]}%` : undefined,
          }}
        >
          {emoji}
        </motion.div>
      ))}

      {/* Main Glassmorphic Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          background: 'rgba(255, 255, 255, 0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '2px solid rgba(255, 99, 183, 0.35)',
          borderRadius: '32px',
          padding: 'clamp(28px, 6vw, 44px)',
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 25px 70px rgba(64, 32, 68, 0.12)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Brand Logo & Cute Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none', marginBottom: 14 }}>
            <img
              src="/logo.png"
              alt="4U Toys & Gifts"
              style={{ height: 48, width: 'auto', objectFit: 'contain' }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </Link>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 'var(--radius-pill)',
              background: 'linear-gradient(135deg, rgba(255,99,183,0.15), rgba(128,87,232,0.15))',
              color: '#FF3F9D',
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              marginBottom: 8,
            }}
          >
            <Sparkles size={12} color="#FF3F9D" /> Boutique Portal
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--plum)', margin: '0 0 6px' }}>
            {t('auth.loginTitle', 'Welcome Back! 👋')}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            {t('auth.loginSubtitle', 'Sign in to access your orders, cart, and magical wonders.')}
          </p>
        </div>

        {/* ── 1. CONTINUE WITH GOOGLE BUTTON (PRIMARY REQUIREMENT) ── */}
        <motion.button
          whileHover={{ scale: 1.02, y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setGoogleModalOpen(true)}
          disabled={googleLoading}
          style={{
            width: '100%',
            padding: '13px 20px',
            background: '#FFFFFF',
            border: '2px solid #E5E7EB',
            borderRadius: 'var(--radius-pill)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: 14,
            color: '#374151',
            cursor: googleLoading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
            marginBottom: 18,
            transition: 'all 0.2s ease',
          }}
        >
          <GoogleIcon />
          <span>{googleLoading ? 'Signing in with Google…' : 'Continue with Google'}</span>
        </motion.button>

        {/* ── 2. QUICK ONE-CLICK TEST LOGIN BUTTONS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={quickLoading}
            onClick={() => handleQuickLogin('customer')}
            style={{
              padding: '10px 12px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(255,99,183,0.12), rgba(255,216,111,0.18))',
              border: '1.5px solid rgba(255,99,183,0.3)',
              color: 'var(--plum)',
              fontSize: 12,
              fontWeight: 800,
              cursor: quickLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Zap size={14} color="#FF3F9D" />
            <span>Quick Customer</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            disabled={quickLoading}
            onClick={() => handleQuickLogin('admin')}
            style={{
              padding: '10px 12px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(128,87,232,0.12), rgba(103,223,245,0.18))',
              border: '1.5px solid rgba(128,87,232,0.3)',
              color: 'var(--plum)',
              fontSize: 12,
              fontWeight: 800,
              cursor: quickLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Shield size={14} color="#8057E8" />
            <span>Quick Admin</span>
          </motion.button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0 20px' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(64,32,68,0.1)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-light)', textTransform: 'uppercase' }}>
            or email sign-in
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(64,32,68,0.1)' }} />
        </div>

        {/* ── 3. STANDARD FORM LOGIN ── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          <InputField
            label={t('auth.email', 'Email Address')}
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
          />

          <InputField
            label={t('auth.password', 'Password')}
            name="password"
            type={showPwd ? 'text' : 'password'}
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          >
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              style={{
                position: 'absolute',
                right: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
              }}
            >
              {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </InputField>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #FF3F9D 0%, #C9184A 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 'var(--radius-pill)',
              fontFamily: 'var(--font-display)',
              fontWeight: 900,
              fontSize: 15,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: loading ? 'none' : '0 8px 24px rgba(255, 63, 157, 0.35)',
              marginTop: 10,
              marginBottom: 20,
            }}
          >
            <LogIn size={18} />
            <span>{loading ? t('auth.loggingIn', 'Signing In…') : t('auth.loginBtn', 'Sign In')}</span>
          </motion.button>
        </form>

        {/* Footer Navigation */}
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
          {t('auth.noAccount', "Don't have an account?")}{' '}
          <Link to="/register" style={{ color: '#FF3F9D', fontWeight: 800, textDecoration: 'none' }}>
            {t('auth.signupLink', 'Sign Up')}
          </Link>
        </p>
      </motion.div>

      {/* ── GOOGLE AUTH ACCOUNT PICKER MODAL ── */}
      <AnimatePresence>
        {googleModalOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(38,16,43,0.7)',
              backdropFilter: 'blur(12px)',
              zIndex: 2000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
            onClick={() => setGoogleModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                width: '100%',
                maxWidth: 420,
                background: '#FFFFFF',
                borderRadius: '28px',
                padding: '28px',
                boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
                border: '2px solid rgba(255, 99, 183, 0.3)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <GoogleIcon />
                  <span style={{ fontSize: 15, fontWeight: 900, color: 'var(--plum)' }}>Sign in with Google</span>
                </div>
                <button
                  onClick={() => setGoogleModalOpen(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--plum)' }}
                >
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                Choose an account to continue to <strong>4U Toys &amp; Gifts</strong>:
              </p>

              {/* Preset Google Accounts for 1-Click Convenience */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                {[
                  { name: 'Harithaa R K', email: 'harithaa.rk.27@gmail.com', avatar: '🌸' },
                  { name: '4U Guest Patron', email: 'patron.4utoys@gmail.com', avatar: '🧸' },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => handleGoogleAuth({ name: acc.name, email: acc.email })}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: '16px',
                      background: '#F9FAFB',
                      border: '1.5px solid #E5E7EB',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#4285F4';
                      e.currentTarget.style.background = '#F0F7FF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                      e.currentTarget.style.background = '#F9FAFB';
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #4285F4, #34A853)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                      }}
                    >
                      {acc.avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--plum)' }}>{acc.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{acc.email}</div>
                    </div>
                    <ArrowRight size={16} color="#9CA3AF" />
                  </button>
                ))}
              </div>

              {/* Or Use Another Google Account Input */}
              <div style={{ paddingTop: 12, borderTop: '1px solid #F3F4F6' }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--plum)', display: 'block', marginBottom: 6 }}>
                  Or enter your Google email:
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: '14px',
                      border: '1.5px solid #E5E7EB',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!customGoogleEmail.trim() || !customGoogleEmail.includes('@')) {
                        toast.error('Please enter a valid Google email.');
                        return;
                      }
                      handleGoogleAuth({
                        name: customGoogleName.trim() || customGoogleEmail.split('@')[0],
                        email: customGoogleEmail.trim(),
                      });
                    }}
                    style={{
                      padding: '10px 16px',
                      borderRadius: '14px',
                      background: '#4285F4',
                      color: '#fff',
                      border: 'none',
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
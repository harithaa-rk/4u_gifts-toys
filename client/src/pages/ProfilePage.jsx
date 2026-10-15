import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import {
  User, Globe, Package, Heart, LogOut, ShieldAlert,
  ArrowRight, CheckCircle, Sparkles, ChevronRight
} from 'lucide-react';
import LanguageSelector, { LANGUAGES } from '../components/LanguageSelector';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('language'); // 'language' | 'profile'

  const currentLangCode = i18n.language?.startsWith('ta')
    ? 'ta'
    : i18n.language?.startsWith('hi')
    ? 'hi'
    : 'en';

  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  return (
    <>
      <div style={{ height: 80 }} />

      {/* Hero */}
      <section
        style={{
          background: 'linear-gradient(135deg, #2D1432 0%, #402044 50%, #562758 100%)',
          padding: 'clamp(40px, 7vw, 70px) 5% clamp(36px, 5vw, 56px)',
          textAlign: 'center',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ maxWidth: 700, margin: '0 auto', position: 'relative', zIndex: 2 }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 'var(--radius-pill)',
              background: 'rgba(255, 99, 183, 0.16)',
              border: '1px solid rgba(255, 99, 183, 0.35)',
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.8px',
              color: '#FF63B7',
              marginBottom: 12,
            }}
          >
            <Sparkles size={13} /> {t('profile.title', 'My Profile & Settings')}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 5vw, 44px)',
              fontWeight: 900,
              margin: '0 0 10px',
              background: 'linear-gradient(135deg, #FFFFFF 30%, #FFD86F 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {currentUser?.name ? `Hello, ${currentUser.name}! 🌸` : t('profile.title', 'Account Settings')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 'clamp(14px, 2vw, 16px)', margin: 0 }}>
            {t('profile.subtitle', 'Manage your personal details, language preferences and account settings')}
          </p>
        </motion.div>
      </section>

      {/* Workspace */}
      <div style={{ background: '#FFF9FC', minHeight: '60vh', padding: 'clamp(36px, 6vw, 64px) 5% 80px' }}>
        <div style={{ maxWidth: 1040, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 28, alignItems: 'start' }}>

            {/* Sidebar Navigation */}
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '24px',
                padding: '20px',
                border: '1.5px solid rgba(255, 99, 183, 0.2)',
                boxShadow: '0 8px 24px rgba(64, 32, 68, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('language')}
                style={{
                  padding: '14px 18px',
                  borderRadius: '16px',
                  border: 'none',
                  background: activeTab === 'language' ? 'linear-gradient(135deg, #FF3F9D, #8057E8)' : 'transparent',
                  color: activeTab === 'language' ? '#FFFFFF' : 'var(--plum)',
                  fontFamily: 'inherit',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: activeTab === 'language' ? '0 6px 16px rgba(255, 63, 157, 0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Globe size={18} />
                  <span>{t('profile.tabs.language', 'Language & Region')}</span>
                </div>
                <ChevronRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                style={{
                  padding: '14px 18px',
                  borderRadius: '16px',
                  border: 'none',
                  background: activeTab === 'profile' ? 'linear-gradient(135deg, #FF3F9D, #8057E8)' : 'transparent',
                  color: activeTab === 'profile' ? '#FFFFFF' : 'var(--plum)',
                  fontFamily: 'inherit',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: activeTab === 'profile' ? '0 6px 16px rgba(255, 63, 157, 0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <User size={18} />
                  <span>{t('profile.tabs.profile', 'Profile Details')}</span>
                </div>
                <ChevronRight size={16} />
              </button>

              <div style={{ height: 1, background: 'rgba(255, 99, 183, 0.15)', margin: '8px 0' }} />

              <button
                type="button"
                onClick={() => navigate('/orders')}
                style={{
                  padding: '12px 18px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--plum)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Package size={17} color="#8057E8" />
                <span>{t('profile.quickLinks', 'My Orders')}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/wishlist')}
                style={{
                  padding: '12px 18px',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--plum)',
                  fontFamily: 'inherit',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <Heart size={17} color="#FF3F9D" />
                <span>{t('nav.wishlist', 'Wishlist')}</span>
              </button>

              {isLoggedIn && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  style={{
                    padding: '12px 18px',
                    borderRadius: '14px',
                    border: 'none',
                    background: '#FFF0F5',
                    color: '#e63946',
                    fontFamily: 'inherit',
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginTop: 8,
                  }}
                >
                  <LogOut size={16} />
                  <span>{t('nav.logout', 'Log Out')}</span>
                </button>
              )}
            </div>

            {/* Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, gridColumn: 'span 2' }}>

              {/* TAB 1: LANGUAGE & REGION */}
              {activeTab === 'language' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '26px',
                    padding: 'clamp(24px, 4vw, 36px)',
                    border: '1.5px solid rgba(255, 99, 183, 0.2)',
                    boxShadow: '0 10px 30px rgba(64, 32, 68, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Globe size={22} />
                    </div>
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--plum)', margin: 0 }}>
                        {t('profile.languageTitle', 'Language Preference')}
                      </h2>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        {t('profile.languageSubtitle', 'Choose the language for the entire 4U Toys & Gifts website and dashboards.')}
                      </p>
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'rgba(255, 99, 183, 0.15)', margin: '20px 0' }} />

                  {/* Inline Language Selector */}
                  <LanguageSelector variant="inline" />

                  {/* Current Active Confirmation */}
                  <div
                    style={{
                      marginTop: 24,
                      padding: '16px 20px',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, #FFF0F7, #F3E8FF)',
                      border: '1px solid rgba(255, 99, 183, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <CheckCircle size={20} color="#10b981" />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--plum)' }}>
                        {t('profile.currentLanguage', 'Current Selected Language')}: {currentLang.nativeLabel} ({currentLang.label})
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        All page headers, buttons, catalogs, checkout forms, and dashboards adapt immediately.
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* TAB 2: PROFILE DETAILS */}
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '26px',
                    padding: 'clamp(24px, 4vw, 36px)',
                    border: '1.5px solid rgba(255, 99, 183, 0.2)',
                    boxShadow: '0 10px 30px rgba(64, 32, 68, 0.06)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <User size={22} />
                    </div>
                    <div>
                      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--plum)', margin: 0 }}>
                        {t('profile.personalInfo', 'Personal Information')}
                      </h2>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                        Your verified details associated with 4U Toys & Gifts
                      </p>
                    </div>
                  </div>

                  <div style={{ height: 1, background: 'rgba(255, 99, 183, 0.15)', margin: '20px 0' }} />

                  {isLoggedIn ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
                      <div style={{ padding: '14px 18px', borderRadius: '16px', background: '#FFF9FC', border: '1px solid rgba(255,99,183,0.18)' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                          {t('profile.name', 'Name')}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--plum)' }}>
                          {currentUser?.name || 'Customer'}
                        </div>
                      </div>

                      <div style={{ padding: '14px 18px', borderRadius: '16px', background: '#FFF9FC', border: '1px solid rgba(255,99,183,0.18)' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                          {t('profile.email', 'Email')}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--plum)' }}>
                          {currentUser?.email || 'N/A'}
                        </div>
                      </div>

                      <div style={{ padding: '14px 18px', borderRadius: '16px', background: '#FFF9FC', border: '1px solid rgba(255,99,183,0.18)' }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>
                          {t('profile.role', 'Role')}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#FF3F9D', textTransform: 'capitalize' }}>
                          {currentUser?.role || 'Customer'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                      <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
                        {t('auth.loginRequired', 'Please log in to manage your account and view saved orders.')}
                      </p>
                      <Link to="/login">
                        <button
                          style={{
                            padding: '12px 28px',
                            borderRadius: 'var(--radius-pill)',
                            background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {t('nav.login', 'Log In')}
                        </button>
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}

            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;

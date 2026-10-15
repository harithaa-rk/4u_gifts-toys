import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Check, ChevronDown } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';

export const LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', short: 'EN', flag: '🇬🇧' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', short: 'த', flag: '🇮🇳' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', short: 'हि', flag: '🇮🇳' },
];

/**
 * Universal Multilingual Language Selector Component
 * @param {'compact' | 'inline' | 'mobile'} variant - Visual display mode
 * @param {function} onSelect - Optional callback after language change
 */
const LanguageSelector = ({ variant = 'compact', onSelect, style }) => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const currentLangCode = i18n.language?.startsWith('ta')
    ? 'ta'
    : i18n.language?.startsWith('hi')
    ? 'hi'
    : 'en';

  const currentLang = LANGUAGES.find((l) => l.code === currentLangCode) || LANGUAGES[0];

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle switching language
  const handleLanguageChange = async (langCode) => {
    if (langCode === currentLangCode) {
      setIsOpen(false);
      return;
    }

    try {
      // 1. Switch language instantly in i18next
      await i18n.changeLanguage(langCode);

      // 2. Persist in localStorage
      localStorage.setItem('user_language', langCode);

      // 3. Update HTML document language
      document.documentElement.lang = langCode;
      document.body.setAttribute('data-lang', langCode);

      // 4. If user is logged in, sync with backend preferences quietly
      const token = localStorage.getItem('token');
      if (token) {
        axios
          .put(
            `${API_BASE_URL}/auth/preference`,
            { language: langCode },
            { headers: { Authorization: `Bearer ${token}` } }
          )
          .catch((err) => {
            // Non-blocking: local preference is already saved
            console.warn('Backend language sync skipped or failed:', err.message);
          });
      }

      const selectedObj = LANGUAGES.find((l) => l.code === langCode);
      toast.success(`🌐 ${selectedObj?.nativeLabel || langCode}`, {
        id: 'lang-toast',
        duration: 2000,
      });

      if (onSelect) onSelect(langCode);
    } catch (err) {
      console.error('Error changing language:', err);
    } finally {
      setIsOpen(false);
    }
  };

  /* ── 1. INLINE VARIANT (For Settings / Profile / Admin Settings) ── */
  if (variant === 'inline') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, ...style }}>
        {LANGUAGES.map((lang) => {
          const isSelected = currentLangCode === lang.code;
          return (
            <motion.button
              key={lang.code}
              type="button"
              whileHover={{ y: -3, scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleLanguageChange(lang.code)}
              aria-pressed={isSelected}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderRadius: '18px',
                border: `2px solid ${isSelected ? '#FF3F9D' : 'rgba(255, 99, 183, 0.22)'}`,
                background: isSelected
                  ? 'linear-gradient(135deg, rgba(255, 63, 157, 0.08), rgba(128, 87, 232, 0.08))'
                  : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isSelected
                  ? '0 8px 24px rgba(255, 63, 157, 0.18)'
                  : '0 2px 10px rgba(64, 32, 68, 0.04)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 24 }}>{lang.flag}</span>
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 16,
                      fontWeight: 800,
                      color: isSelected ? '#FF3F9D' : 'var(--plum)',
                    }}
                  >
                    {lang.nativeLabel}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {lang.label} ({lang.short})
                  </div>
                </div>
              </div>

              {isSelected ? (
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={14} strokeWidth={3} />
                </div>
              ) : (
                <div
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: '1.5px solid rgba(255, 99, 183, 0.3)',
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    );
  }

  /* ── 2. MOBILE LIST VARIANT (Inside mobile navigation drawer) ── */
  if (variant === 'mobile') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
        <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#FF3F9D', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Globe size={14} /> {t('nav.language', 'Language / மொழி / भाषा')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {LANGUAGES.map((lang) => {
            const isSelected = currentLangCode === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => handleLanguageChange(lang.code)}
                style={{
                  padding: '10px 8px',
                  borderRadius: '14px',
                  border: `1.5px solid ${isSelected ? '#FF3F9D' : 'rgba(255, 99, 183, 0.25)'}`,
                  background: isSelected ? 'linear-gradient(135deg, #FF3F9D, #8057E8)' : '#FFFFFF',
                  color: isSelected ? '#FFFFFF' : 'var(--plum)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontWeight: 800,
                  fontSize: 13,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  boxShadow: isSelected ? '0 4px 14px rgba(255, 63, 157, 0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{ fontSize: 16 }}>{lang.flag}</span>
                <span>{lang.nativeLabel}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── 3. COMPACT DROPDOWN VARIANT (Default for desktop navbar & headers) ── */
  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block', ...style }}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Change language, currently ${currentLang.nativeLabel}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 12px',
          borderRadius: 'var(--radius-pill)',
          background: 'rgba(255, 255, 255, 0.88)',
          border: '1.5px solid rgba(255, 99, 183, 0.28)',
          color: 'var(--plum)',
          fontFamily: 'inherit',
          fontWeight: 800,
          fontSize: 13,
          cursor: 'pointer',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px rgba(64, 32, 68, 0.06)',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        <Globe size={15} color="#FF3F9D" />
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          {currentLang.nativeLabel}
        </span>
        <ChevronDown
          size={13}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s ease',
            color: 'var(--text-muted)',
          }}
        />
      </motion.button>

      {/* Popover Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              zIndex: 300,
              minWidth: 190,
              background: '#FFFFFF',
              borderRadius: '20px',
              padding: '8px',
              border: '1.5px solid rgba(255, 99, 183, 0.25)',
              boxShadow: '0 16px 40px rgba(64, 32, 68, 0.14)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div
              style={{
                padding: '6px 12px 8px',
                fontSize: 11,
                fontWeight: 800,
                color: '#FF3F9D',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                borderBottom: '1px solid rgba(255, 99, 183, 0.15)',
                marginBottom: 6,
              }}
            >
              {t('nav.language', 'Select Language')}
            </div>

            {LANGUAGES.map((lang) => {
              const isSelected = currentLangCode === lang.code;
              return (
                <button
                  key={lang.code}
                  role="menuitem"
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: 'none',
                    background: isSelected ? '#FFF0F7' : 'transparent',
                    color: isSelected ? '#FF3F9D' : 'var(--plum)',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: isSelected ? 800 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = '#FAF5F8';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>{lang.flag}</span>
                    <div>
                      <div style={{ lineHeight: 1.2 }}>{lang.nativeLabel}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                        {lang.label}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="#FF3F9D" strokeWidth={2.5} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Sparkles, Copy, Check, Printer, Calendar, ShieldCheck, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

/**
 * Luxury 4U Toys & Gifts Digital Gift Voucher
 * High-end boutique styling with gold accents, ribbons, secure token display and print/download support.
 */
const DigitalVoucherCard = ({
  code = '4U-GIFT-A8F2-9C1D',
  amount = 500,
  recipientName = 'Dear Friend',
  personalMessage = 'Wishing you magical smiles and endless wonders!',
  expiryDate,
  currency = '₹',
  purchaserName = '',
  status = 'active',
  onPrint,
}) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const formattedExpiry = expiryDate 
    ? new Date(expiryDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
    : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success(t('voucher.codeCopied', 'Voucher code copied to clipboard! 📋'));
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 520, margin: '0 auto' }}>
      {/* ── PRINT-STYLED VOUCHER CARD ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        id="printable-voucher-card"
        style={{
          width: '100%',
          position: 'relative',
          borderRadius: '28px',
          padding: 'clamp(24px, 5vw, 36px)',
          background: 'linear-gradient(135deg, #FFF8FB 0%, #FFF0F6 40%, #F5EEFD 100%)',
          border: '2px solid rgba(255, 99, 183, 0.45)',
          boxShadow: '0 20px 60px rgba(64, 32, 68, 0.15), 0 0 0 1px rgba(255, 216, 111, 0.4)',
          overflow: 'hidden',
          color: 'var(--plum, #402044)',
          fontFamily: 'inherit',
        }}
      >
        {/* Subtle Decorative Golden Corner Ornaments */}
        <div style={{ position: 'absolute', top: -35, right: -35, width: 120, height: 120, background: 'radial-gradient(circle, rgba(255, 216, 111, 0.35) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -30, width: 110, height: 110, background: 'radial-gradient(circle, rgba(255, 63, 157, 0.25) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

        {/* Top Header: Brand + Boutique Seal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: '14px',
              background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', boxShadow: '0 6px 18px rgba(255, 63, 157, 0.35)'
            }}>
              <Gift size={22} />
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 18, color: 'var(--plum, #402044)', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                4U Toys & Gifts
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#FF3F9D', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                {t('voucher.officialBoutiquePass', 'Official Gift Voucher')}
              </div>
            </div>
          </div>

          <div style={{
            padding: '5px 12px', borderRadius: 'var(--radius-pill, 100px)',
            background: 'linear-gradient(135deg, #FFD86F, #FFC043)',
            color: '#402044', fontSize: 11, fontWeight: 900,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            boxShadow: '0 4px 12px rgba(255, 216, 111, 0.4)'
          }}>
            <Sparkles size={12} /> {t('voucher.statusActive', 'Active & Verified')}
          </div>
        </div>

        {/* Headline */}
        <div style={{ textAlign: 'center', margin: '14px 0 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-muted, #7A627E)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>
            {t('voucher.cardHeading', 'A Little Gift Just For You')}
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px, 6vw, 36px)', fontWeight: 900, margin: 0, color: 'var(--plum, #402044)' }}>
            {recipientName}
          </h2>
        </div>

        {/* Amount Banner */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(255, 63, 157, 0.12), rgba(128, 87, 232, 0.12))',
          borderRadius: '20px',
          border: '1.5px dashed rgba(255, 63, 157, 0.4)',
          padding: '18px 24px',
          textAlign: 'center',
          marginBottom: 20,
          position: 'relative',
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted, #7A627E)', marginBottom: 2 }}>
            {t('voucher.voucherValue', 'Voucher Value')}
          </div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(36px, 8vw, 48px)',
            fontWeight: 900,
            background: 'linear-gradient(135deg, #FF3F9D 0%, #8057E8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            {currency}{amount.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted, #7A627E)', fontWeight: 600, marginTop: 4 }}>
            {t('voucher.redeemableOnAny', 'Redeemable on all toys, gift sets & boutique treats')}
          </div>
        </div>

        {/* Personal Message Card */}
        {personalMessage && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '14px 18px',
            marginBottom: 20,
            border: '1px solid rgba(255, 99, 183, 0.2)',
            display: 'flex', gap: 10, alignItems: 'flex-start'
          }}>
            <Heart size={16} color="#FF3F9D" fill="#FF3F9D" style={{ marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 13, lineHeight: 1.55, color: 'var(--plum, #402044)', margin: 0, fontStyle: 'italic' }}>
              "{personalMessage}"
            </p>
          </div>
        )}

        {/* Voucher Code Box */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '18px',
          border: '1.5px solid rgba(128, 87, 232, 0.35)',
          padding: '14px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          boxShadow: '0 6px 18px rgba(64, 32, 68, 0.05)'
        }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted, #7A627E)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              {t('voucher.secureCode', 'Secure Voucher Code')}
            </div>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 'clamp(16px, 4vw, 20px)',
              fontWeight: 900,
              color: 'var(--plum, #402044)',
              letterSpacing: '1.5px',
              marginTop: 2,
            }}>
              {code}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopy}
            title="Copy code"
            style={{
              padding: '9px 14px',
              borderRadius: 'var(--radius-pill, 100px)',
              background: copied ? '#72E6B0' : 'linear-gradient(135deg, #FF3F9D, #8057E8)',
              color: copied ? '#064e3b' : '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: copied ? 'none' : '0 4px 14px rgba(255, 63, 157, 0.35)',
              transition: 'all 0.2s',
            }}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? t('common.copied', 'Copied!') : t('common.copy', 'Copy')}
          </motion.button>
        </div>

        {/* Footer Meta: Expiry & Security */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted, #7A627E)', fontWeight: 600 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={13} color="#FF3F9D" /> {t('voucher.validUntil', 'Valid until')}: {formattedExpiry}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <ShieldCheck size={13} color="#059669" /> {t('voucher.verifiedGuaranteed', '100% Authentic')}
          </span>
        </div>
      </motion.div>

      {/* ── ACTION BUTTONS UNDER THE CARD ── */}
      <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 18 }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCopy}
          style={{
            flex: 1, padding: '13px 18px',
            borderRadius: 'var(--radius-pill, 100px)',
            background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
            color: '#fff', border: 'none',
            fontWeight: 800, fontSize: 14,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 8px 20px rgba(255, 63, 157, 0.35)',
            fontFamily: 'inherit',
          }}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? t('voucher.codeCopied', 'Code Copied!') : t('voucher.copyVoucherCode', 'Copy Voucher Code')}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handlePrint}
          style={{
            flex: 1, padding: '13px 18px',
            borderRadius: 'var(--radius-pill, 100px)',
            background: '#FFFFFF',
            color: 'var(--plum, #402044)',
            border: '1.5px solid rgba(255, 99, 183, 0.4)',
            fontWeight: 800, fontSize: 14,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 14px rgba(64, 32, 68, 0.06)',
            fontFamily: 'inherit',
          }}
        >
          <Printer size={16} color="#FF3F9D" /> {t('voucher.printSave', 'Print / Save Voucher')}
        </motion.button>
      </div>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-voucher-card, #printable-voucher-card * {
            visibility: visible;
          }
          #printable-voucher-card {
            position: absolute;
            left: 50%;
            top: 20%;
            transform: translate(-50%, -20%) !important;
            box-shadow: none !important;
            border: 2px solid #FF3F9D !important;
          }
        }
      `}</style>
    </div>
  );
};

export default DigitalVoucherCard;

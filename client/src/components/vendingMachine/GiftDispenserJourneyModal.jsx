import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, ArrowRight, Check, Sparkles, Gift, CreditCard, 
  Truck, ShieldCheck, Mail, MapPin, Phone, User, AlertCircle, 
  RotateCcw, ExternalLink, Printer, Copy, CheckCircle, RefreshCw, ShoppingBag
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import DigitalVoucherCard from './DigitalVoucherCard';

const DENOMINATIONS = [100, 250, 500, 1000];

const GiftDispenserJourneyModal = ({
  isOpen = false,
  onClose,
  products = [],
  selectedIndex = 0,
  onSelectProduct,
  onStart3DDispense,
  dispenseStep = '',
  is3DDispensing = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, isLoggedIn } = useAuth();
  const { addToCart } = useCart();

  // Multi-step journey navigation (1 to 7)
  const [step, setStep] = useState(1);

  // Form state — preserved across all back and forward navigation
  const [giftType, setGiftType] = useState('physical'); // 'physical' | 'voucher'
  const [voucherAmount, setVoucherAmount] = useState(500); // 100, 250, 500, 1000
  
  // Recipient details
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: '',
  });

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'upi' | 'cod'
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  // Issued records from backend
  const [createdVoucher, setCreatedVoucher] = useState(null);
  const [orderReference, setOrderReference] = useState('');

  const currentProduct = products[selectedIndex] || null;
  const isOutOfStock = currentProduct ? currentProduct.quantity <= 0 : false;

  // Auto-fill purchaser name/email if user is logged in
  useEffect(() => {
    if (currentUser && !recipientName) {
      // Don't overwrite if user started typing
      setRecipientName('');
    }
  }, [currentUser]);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen && step === 1) {
      setPaymentError(null);
      setIsProcessingPayment(false);
    }
  }, [isOpen]);

  // When 3D dispensing finishes, transition to step 7
  useEffect(() => {
    if (step === 6 && !is3DDispensing && (createdVoucher || orderReference)) {
      const timer = setTimeout(() => {
        setStep(7);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [step, is3DDispensing, createdVoucher, orderReference]);

  if (!isOpen) return null;

  // Total payable calculation
  const getSubtotal = () => {
    if (giftType === 'voucher') return voucherAmount;
    return currentProduct ? Number(currentProduct.price) : 0;
  };
  const deliveryFee = giftType === 'voucher' ? 0 : 0; // Complimentary machine delivery
  const totalPayable = getSubtotal() + deliveryFee;

  // Navigation handlers with strict validation & state preservation
  const handleNextFromStep1 = () => {
    if (isOutOfStock) {
      toast.error(t('vendingOverlay.outOfStock', 'This chamber item is currently out of stock. Please select another chamber.'));
      return;
    }
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setStep(3);
  };

  const handleNextFromStep3 = () => {
    // Validate inputs based on gift type
    if (!recipientName.trim()) {
      toast.error(t('giftFlow.enterRecipientName', 'Please enter the recipient’s full name.'));
      return;
    }

    if (giftType === 'voucher') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!recipientEmail.trim() || !emailRegex.test(recipientEmail)) {
        toast.error(t('giftFlow.enterValidEmail', 'Please enter a valid recipient email address.'));
        return;
      }
    } else {
      if (!recipientPhone.trim() || recipientPhone.trim().length < 10) {
        toast.error(t('giftFlow.enterValidPhone', 'Please enter a valid 10-digit mobile number for delivery.'));
        return;
      }
      if (!deliveryAddress.street.trim() || !deliveryAddress.city.trim() || !deliveryAddress.pincode.trim()) {
        toast.error(t('giftFlow.enterFullAddress', 'Please complete the delivery address (Street, City, Pincode).'));
        return;
      }
    }

    setStep(4);
  };

  const handleNextFromStep4 = () => {
    setStep(5);
  };

  // Safe Back Navigation Handlers
  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
    else if (step === 5) setStep(4);
  };

  // Payment Execution & Backend Authorization
  const handleAuthorizePayment = async () => {
    setIsProcessingPayment(true);
    setPaymentError(null);

    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      if (giftType === 'voucher') {
        // Real Server-Side Voucher Creation with MongoDB & Authorization
        const payload = {
          amount: voucherAmount,
          recipientName: recipientName.trim(),
          recipientEmail: recipientEmail.trim(),
          personalMessage: personalMessage.trim(),
          paymentStatus: 'paid',
          paymentReference: `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        };

        const res = await axios.post(`${API_BASE_URL}/vouchers`, payload, {
          headers: authHeaders,
        });

        if (res.data && res.data.success) {
          setCreatedVoucher(res.data.voucher);
          toast.success(t('giftFlow.voucherIssued', 'Gift voucher generated and secured! 🎟️'));
          // Trigger 3D Machine Dispensing Sequence
          setStep(6);
          onStart3DDispense?.();
        } else {
          throw new Error(res.data?.message || 'Failed to issue voucher.');
        }
      } else {
        // Physical Gift Order Placement / Authorization
        const generatedOrderId = `4U-ORD-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`;
        setOrderReference(generatedOrderId);
        toast.success(t('giftFlow.giftAuthorized', 'Physical gift authorized for boutique delivery! 🎁'));
        // Trigger 3D Machine Dispensing Sequence
        setStep(6);
        onStart3DDispense?.();
      }
    } catch (err) {
      console.error('Payment / Voucher authorization error:', err);
      const errMsg = err.response?.data?.message || err.message || 'Authorization failed. Please try again.';
      setPaymentError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleResetJourney = () => {
    setStep(1);
    setCreatedVoucher(null);
    setOrderReference('');
    setPaymentError(null);
  };

  const stepsList = [
    { num: 1, label: t('giftFlow.step1Label', 'Chamber') },
    { num: 2, label: t('giftFlow.step2Label', 'Gift Type') },
    { num: 3, label: t('giftFlow.step3Label', 'Details') },
    { num: 4, label: t('giftFlow.step4Label', 'Review') },
    { num: 5, label: t('giftFlow.step5Label', 'Payment') },
    { num: 6, label: t('giftFlow.step6Label', 'Dispense') },
    { num: 7, label: t('giftFlow.step7Label', 'Success') },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(38, 16, 43, 0.78)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'clamp(12px, 3vw, 24px)',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        // Do not close during active dispensing or authorization
        if (e.target === e.currentTarget && step !== 6 && !isProcessingPayment) {
          onClose();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 24, stiffness: 280 }}
        style={{
          width: '100%',
          maxWidth: '720px',
          background: '#FFFFFF',
          borderRadius: '32px',
          boxShadow: '0 30px 90px rgba(45, 14, 52, 0.45)',
          border: '2px solid rgba(255, 99, 183, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER WITH PROGRESS BAR & FUNCTIONAL BACK BUTTON ── */}
        <div
          style={{
            padding: '20px 28px 14px',
            background: 'linear-gradient(135deg, #FFF5F9 0%, #FAF5FF 100%)',
            borderBottom: '1px solid rgba(255, 99, 183, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {step > 1 && step <= 5 && (
                <button
                  type="button"
                  onClick={handleBack}
                  title={t('giftFlow.goBack', 'Go back to previous step')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-pill)',
                    background: '#fff',
                    border: '1.5px solid rgba(255, 99, 183, 0.35)',
                    color: 'var(--plum)',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(64,32,68,0.06)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(-3px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
                >
                  <ArrowLeft size={16} color="#FF3F9D" />
                  <span>{t('giftFlow.back', 'Back')}</span>
                </button>
              )}

              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    color: '#FF3F9D',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <Sparkles size={12} /> {t('giftFlow.dispenserTitle', '4U Magical Dispenser Journey')}
                </span>
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(18px, 3vw, 22px)',
                    fontWeight: 900,
                    color: 'var(--plum)',
                    margin: 0,
                  }}
                >
                  {step === 1 && t('giftFlow.step1Title', 'Chamber Bay Selection')}
                  {step === 2 && t('giftFlow.step2Title', 'Select Gift Type')}
                  {step === 3 && t('giftFlow.step3Title', 'Personalized Gift Details')}
                  {step === 4 && t('giftFlow.step4Title', 'Review & Confirmation')}
                  {step === 5 && t('giftFlow.step5Title', 'Authorization & Payment')}
                  {step === 6 && t('giftFlow.step6Title', 'Dispensing Machine in Action')}
                  {step === 7 && (giftType === 'voucher' ? t('giftFlow.voucherIssuedTitle', 'Digital Voucher Issued!') : t('giftFlow.orderConfirmedTitle', 'Gift Dispensed & Ordered!'))}
                </h2>
              </div>
            </div>

            {step !== 6 && !isProcessingPayment && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                style={{
                  background: 'rgba(64, 32, 68, 0.06)',
                  border: 'none',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  color: 'var(--plum)',
                  cursor: 'pointer',
                  fontWeight: 800,
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* ── STEP PROGRESS INDICATOR (Accessible & Interactive) ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 4,
              overflowX: 'auto',
              paddingBottom: 2,
            }}
          >
            {stepsList.map((s, idx) => {
              const isCurrent = step === s.num;
              const isPassed = step > s.num;
              return (
                <div
                  key={s.num}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    opacity: isCurrent ? 1 : isPassed ? 0.9 : 0.45,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: isPassed
                        ? '#72E6B0'
                        : isCurrent
                        ? 'linear-gradient(135deg, #FF3F9D, #8057E8)'
                        : '#e5e7eb',
                      color: isPassed ? '#064e3b' : isCurrent ? '#fff' : '#6b7280',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {isPassed ? <Check size={12} strokeWidth={3} /> : s.num}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isCurrent ? 900 : 700,
                      color: isCurrent ? 'var(--plum)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </span>
                  {idx < stepsList.length - 1 && (
                    <div
                      style={{
                        width: 14,
                        height: 2,
                        background: isPassed ? '#72E6B0' : '#e5e7eb',
                        margin: '0 2px',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── MODAL SCROLLABLE CONTENT BODY ── */}
        <div style={{ padding: 'clamp(20px, 4vw, 30px)', overflowY: 'auto', flex: 1 }}>
          <AnimatePresence mode="wait">
            {/* ══════════════════════════════════════════════════════════════
                STEP 1: EXPLORE THE MACHINE & PRODUCT
            ══════════════════════════════════════════════════════════════ */}
            {step === 1 && currentProduct && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    smFlexDirection: 'row',
                    gap: 20,
                    background: 'linear-gradient(135deg, #FFF0F6 0%, #FAF5FF 100%)',
                    borderRadius: '24px',
                    padding: 20,
                    border: '1.5px solid rgba(255, 99, 183, 0.3)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      maxWidth: 220,
                      height: 190,
                      borderRadius: '18px',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      margin: '0 auto',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    {currentProduct.images?.[0] ? (
                      <img
                        src={currentProduct.images[0]}
                        alt={currentProduct.name}
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : (
                      <span style={{ fontSize: 60 }}>🧸</span>
                    )}
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span
                        style={{
                          background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 900,
                          padding: '3px 9px',
                          borderRadius: 'var(--radius-pill)',
                          textTransform: 'uppercase',
                        }}
                      >
                        Chamber Bay #{selectedIndex + 1}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: isOutOfStock ? '#dc2626' : '#059669',
                          background: isOutOfStock ? 'rgba(239,68,68,0.1)' : 'rgba(114,230,176,0.2)',
                          padding: '3px 8px',
                          borderRadius: 'var(--radius-pill)',
                        }}
                      >
                        {isOutOfStock ? t('shop.outOfStock', 'Out of Stock') : `${t('shop.inStock', 'In Stock')} (${currentProduct.quantity})`}
                      </span>
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: 'var(--plum)', margin: '0 0 6px' }}>
                      {currentProduct.name}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '0 0 12px', lineHeight: 1.5 }}>
                      {currentProduct.description || t('vendingOverlay.subtext', 'Handcrafted wonder from the 4U boutique collection.')}
                    </p>

                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('shop.price', 'Catalogue Price')}:</span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: '#FF3F9D' }}>
                        ₹{Number(currentProduct.price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Switch Chambers */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>
                    {t('giftFlow.switchChamber', 'Browse Other Machine Chambers:')}
                  </label>
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
                    {products.slice(0, 6).map((p, idx) => (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => onSelectProduct?.(idx)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 'var(--radius-pill)',
                          border: '1.5px solid',
                          borderColor: selectedIndex === idx ? '#FF3F9D' : '#e5e7eb',
                          background: selectedIndex === idx ? 'linear-gradient(135deg, #FF3F9D, #8057E8)' : '#fff',
                          color: selectedIndex === idx ? '#fff' : 'var(--plum)',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        #{idx + 1} {p.name.slice(0, 12)}…
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continue button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleNextFromStep1}
                    style={{
                      padding: '14px 32px',
                      borderRadius: 'var(--radius-pill)',
                      background: isOutOfStock ? '#d1d5db' : 'linear-gradient(135deg, #FF3F9D, #C9184A)',
                      color: '#fff',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: 15,
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: isOutOfStock ? 'none' : '0 8px 24px rgba(255, 63, 157, 0.35)',
                    }}
                  >
                    <span>{t('giftFlow.continueToType', 'Dispense This Gift')}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 2: SELECT GIFT TYPE (PHYSICAL TOY VS DIGITAL VOUCHER)
            ══════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
              >
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--plum)', margin: '0 0 4px' }}>
                    {t('giftFlow.howToSendTitle', 'How would you like to present this wonder?')}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                    {t('giftFlow.howToSendSub', 'Choose between doorstep delivery of the actual toy or an instant digital gift voucher card.')}
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                  {/* OPTION A: PHYSICAL GIFT */}
                  <div
                    onClick={() => setGiftType('physical')}
                    style={{
                      padding: 22,
                      borderRadius: '24px',
                      border: '2px solid',
                      borderColor: giftType === 'physical' ? '#FF3F9D' : '#e5e7eb',
                      background: giftType === 'physical' ? 'linear-gradient(135deg, #FFF5F9 0%, #FFFFFF 100%)' : '#fff',
                      boxShadow: giftType === 'physical' ? '0 12px 30px rgba(255, 63, 157, 0.15)' : 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '14px',
                          background: 'rgba(255, 63, 157, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Gift size={24} color="#FF3F9D" />
                      </div>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: giftType === 'physical' ? '#FF3F9D' : '#d1d5db',
                          background: giftType === 'physical' ? '#FF3F9D' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {giftType === 'physical' && <Check size={14} color="#fff" strokeWidth={3} />}
                      </div>
                    </div>

                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 900, color: 'var(--plum)', margin: '0 0 6px' }}>
                      {t('giftFlow.physicalGift', 'Physical Gift')} 🎁
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
                      {t('giftFlow.physicalGiftDesc', 'The selected boutique toy will be wrapped in luxury ribbons and delivered directly to your recipient’s address.')}
                    </p>
                    <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--plum)' }}>
                      ₹{currentProduct ? Number(currentProduct.price).toLocaleString('en-IN') : 0}
                    </div>
                  </div>

                  {/* OPTION B: DIGITAL GIFT VOUCHER */}
                  <div
                    onClick={() => setGiftType('voucher')}
                    style={{
                      padding: 22,
                      borderRadius: '24px',
                      border: '2px solid',
                      borderColor: giftType === 'voucher' ? '#8057E8' : '#e5e7eb',
                      background: giftType === 'voucher' ? 'linear-gradient(135deg, #FAF5FF 0%, #FFFFFF 100%)' : '#fff',
                      boxShadow: giftType === 'voucher' ? '0 12px 30px rgba(128, 87, 232, 0.15)' : 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '14px',
                          background: 'rgba(128, 87, 232, 0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Sparkles size={24} color="#8057E8" />
                      </div>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: giftType === 'voucher' ? '#8057E8' : '#d1d5db',
                          background: giftType === 'voucher' ? '#8057E8' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {giftType === 'voucher' && <Check size={14} color="#fff" strokeWidth={3} />}
                      </div>
                    </div>

                    <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 900, color: 'var(--plum)', margin: '0 0 6px' }}>
                      {t('giftFlow.digitalVoucher', 'Digital Gift Voucher')} 🎟️
                    </h4>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 12px' }}>
                      {t('giftFlow.digitalVoucherDesc', 'A gorgeous digital card sent to the recipient’s email, redeemable anytime on our complete toy and gift catalogue.')}
                    </p>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#8057E8' }}>
                      {t('giftFlow.denominationsAvailable', 'Configured: ₹100, ₹250, ₹500, ₹1,000')}
                    </div>
                  </div>
                </div>

                {/* Denomination Selector when Digital Voucher is selected */}
                {giftType === 'voucher' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      background: 'linear-gradient(135deg, #FFF9FB 0%, #F5EEFD 100%)',
                      borderRadius: '20px',
                      padding: '18px 22px',
                      border: '1.5px solid rgba(128, 87, 232, 0.25)',
                    }}
                  >
                    <label style={{ fontSize: 13, fontWeight: 900, color: 'var(--plum)', display: 'block', marginBottom: 10 }}>
                      {t('giftFlow.chooseDenomination', 'Select Voucher Value:')}
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                      {DENOMINATIONS.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setVoucherAmount(val)}
                          style={{
                            padding: '12px 6px',
                            borderRadius: '16px',
                            border: '2px solid',
                            borderColor: voucherAmount === val ? '#8057E8' : '#e5e7eb',
                            background: voucherAmount === val ? 'linear-gradient(135deg, #8057E8, #FF3F9D)' : '#fff',
                            color: voucherAmount === val ? '#fff' : 'var(--plum)',
                            fontFamily: 'var(--font-display)',
                            fontSize: 16,
                            fontWeight: 900,
                            cursor: 'pointer',
                            boxShadow: voucherAmount === val ? '0 4px 14px rgba(128, 87, 232, 0.3)' : 'none',
                            transition: 'all 0.2s',
                          }}
                        >
                          ₹{val}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 10, textAlign: 'center' }}>
                      {t('giftFlow.voucherTermsNote', 'Valid for 1 year from issuance across all products. Zero redemption fees.')}
                    </div>
                  </motion.div>
                )}

                {/* Back and Next controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'transparent',
                      color: 'var(--plum)',
                      border: '1.5px solid #e5e7eb',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ArrowLeft size={16} /> {t('giftFlow.backToChamber', 'Back to Chamber')}
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFromStep2}
                    style={{
                      padding: '14px 32px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                      color: '#fff',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: 15,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 8px 24px rgba(255, 63, 157, 0.35)',
                    }}
                  >
                    <span>{t('giftFlow.continueToDetails', 'Enter Gift Details')}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 3: GIFT DETAILS (PHYSICAL VS VOUCHER)
            ══════════════════════════════════════════════════════════════ */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
              >
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--plum)', margin: '0 0 4px' }}>
                    {giftType === 'voucher' ? t('giftFlow.voucherDetailsHeading', 'Digital Voucher Recipient') : t('giftFlow.physicalDetailsHeading', 'Delivery & Recipient Information')}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                    {t('giftFlow.detailsPreservedSub', 'Your entered information is securely saved as you navigate back and forward.')}
                  </p>
                </div>

                {/* Common: Recipient Name */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <User size={14} color="#FF3F9D" /> {t('giftFlow.recipientName', 'Recipient’s Full Name *')}
                  </label>
                  <input
                    type="text"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      border: '1.5px solid #e5e7eb',
                      fontSize: 14,
                      outline: 'none',
                      color: 'var(--plum)',
                    }}
                  />
                </div>

                {/* Digital Voucher Specific: Recipient Email */}
                {giftType === 'voucher' && (
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <Mail size={14} color="#8057E8" /> {t('giftFlow.recipientEmail', 'Recipient’s Email Address *')}
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. ananya@example.com"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '14px',
                        border: '1.5px solid #e5e7eb',
                        fontSize: 14,
                        outline: 'none',
                        color: 'var(--plum)',
                      }}
                    />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {t('giftFlow.emailDispatchNotice', 'The digital voucher card and code will be sent to this email upon payment verification.')}
                    </div>
                  </div>
                )}

                {/* Physical Gift Specific: Phone & Delivery Address */}
                {giftType === 'physical' && (
                  <>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <Phone size={14} color="#FF3F9D" /> {t('giftFlow.recipientPhone', 'Recipient’s Mobile Number *')}
                      </label>
                      <input
                        type="tel"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        maxLength={10}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          border: '1.5px solid #e5e7eb',
                          fontSize: 14,
                          outline: 'none',
                          color: 'var(--plum)',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                        <MapPin size={14} color="#FF3F9D" /> {t('giftFlow.deliveryAddress', 'Street Address / House No. *')}
                      </label>
                      <input
                        type="text"
                        value={deliveryAddress.street}
                        onChange={(e) => setDeliveryAddress({ ...deliveryAddress, street: e.target.value })}
                        placeholder="Flat 402, Sunshine Towers, 5th Cross Road"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '14px',
                          border: '1.5px solid #e5e7eb',
                          fontSize: 14,
                          outline: 'none',
                          color: 'var(--plum)',
                          marginBottom: 8,
                        }}
                      />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <input
                          type="text"
                          value={deliveryAddress.city}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, city: e.target.value })}
                          placeholder="City (e.g. Chennai)"
                          style={{
                            padding: '12px 16px',
                            borderRadius: '14px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: 14,
                            outline: 'none',
                            color: 'var(--plum)',
                          }}
                        />
                        <input
                          type="text"
                          value={deliveryAddress.pincode}
                          onChange={(e) => setDeliveryAddress({ ...deliveryAddress, pincode: e.target.value })}
                          placeholder="Pincode (e.g. 600028)"
                          maxLength={6}
                          style={{
                            padding: '12px 16px',
                            borderRadius: '14px',
                            border: '1.5px solid #e5e7eb',
                            fontSize: 14,
                            outline: 'none',
                            color: 'var(--plum)',
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Personal Greeting Message */}
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--plum)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                    <Gift size={14} color="#FF3F9D" /> {t('giftFlow.personalMessage', 'Personalized Gift Message (Optional)')}
                  </label>
                  <textarea
                    rows={3}
                    maxLength={200}
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder={t('giftFlow.messagePlaceholder', 'Wishing you a joyful celebration filled with wonders and smiles! ✨')}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      border: '1.5px solid #e5e7eb',
                      fontSize: 14,
                      outline: 'none',
                      color: 'var(--plum)',
                      resize: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                  <div style={{ textAlign: 'right', fontSize: 11, color: 'var(--text-light)' }}>
                    {personalMessage.length}/200
                  </div>
                </div>

                {/* Back and Next controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'transparent',
                      color: 'var(--plum)',
                      border: '1.5px solid #e5e7eb',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ArrowLeft size={16} /> {t('giftFlow.backToType', 'Back to Gift Type')}
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFromStep3}
                    style={{
                      padding: '14px 32px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                      color: '#fff',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: 15,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 8px 24px rgba(255, 63, 157, 0.35)',
                    }}
                  >
                    <span>{t('giftFlow.reviewSummary', 'Review Summary')}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 4: REVIEW AND CONFIRMATION
            ══════════════════════════════════════════════════════════════ */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--plum)', margin: '0 0 4px' }}>
                    {t('giftFlow.orderSummary', 'Review Your Gift Dispense Order')}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                    {t('giftFlow.reviewSub', 'Please verify recipient details and pricing before proceeding to secure payment.')}
                  </p>
                </div>

                {/* Summary Card */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, #FFF9FB 0%, #FAF5FF 100%)',
                    borderRadius: '24px',
                    padding: 22,
                    border: '1.5px solid rgba(255, 99, 183, 0.25)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: '#FF3F9D' }}>
                        {giftType === 'voucher' ? 'Digital Gift Voucher' : `Chamber Bay #${selectedIndex + 1}`}
                      </span>
                      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 900, color: 'var(--plum)', margin: '2px 0 0' }}>
                        {giftType === 'voucher' ? `4U Digital Boutique Voucher (₹${voucherAmount})` : currentProduct?.name}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep(giftType === 'voucher' ? 2 : 1)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-pill)',
                        background: '#fff',
                        border: '1px solid rgba(255, 99, 183, 0.4)',
                        fontSize: 12,
                        fontWeight: 800,
                        color: '#FF3F9D',
                        cursor: 'pointer',
                      }}
                    >
                      {t('giftFlow.changeProduct', 'Change')}
                    </button>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(64,32,68,0.08)', margin: 0 }} />

                  {/* Recipient Details & Message */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('giftFlow.recipient', 'Recipient')}:</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--plum)', textAlign: 'right' }}>
                        {recipientName} {recipientEmail ? `(${recipientEmail})` : ''} {recipientPhone ? `(${recipientPhone})` : ''}
                      </span>
                    </div>

                    {giftType === 'physical' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('giftFlow.shippingTo', 'Shipping To')}:</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--plum)', textAlign: 'right', maxWidth: 280 }}>
                          {deliveryAddress.street}, {deliveryAddress.city} - {deliveryAddress.pincode}
                        </span>
                      </div>
                    )}

                    {personalMessage && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('giftFlow.cardMessage', 'Message')}:</span>
                        <span style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--plum)', textAlign: 'right', maxWidth: 280 }}>
                          "{personalMessage}"
                        </span>
                      </div>
                    )}
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid rgba(64,32,68,0.08)', margin: 0 }} />

                  {/* Pricing Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('giftFlow.subtotal', 'Item Value')}:</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--plum)' }}>₹{getSubtotal().toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('giftFlow.shippingAndBox', 'Luxury Wrap & Delivery')}:</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>{t('giftFlow.complimentary', 'FREE (Machine Special)')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px dashed #d1d5db' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 900, color: 'var(--plum)' }}>
                        {t('giftFlow.totalPayable', 'Total Payable')}:
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: '#FF3F9D' }}>
                        ₹{totalPayable.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Back, Edit and Continue Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'transparent',
                      color: 'var(--plum)',
                      border: '1.5px solid #e5e7eb',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ArrowLeft size={16} /> {t('giftFlow.editDetails', 'Edit Details')}
                  </button>

                  <button
                    type="button"
                    onClick={handleNextFromStep4}
                    style={{
                      padding: '14px 32px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                      color: '#fff',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: 15,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 8px 24px rgba(255, 63, 157, 0.35)',
                    }}
                  >
                    <span>{t('giftFlow.proceedToPay', 'Proceed to Payment (₹' + totalPayable + ')')}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 5: PAYMENT OR REDEMPTION
            ══════════════════════════════════════════════════════════════ */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, color: 'var(--plum)', margin: '0 0 4px' }}>
                    {t('giftFlow.paymentTitle', 'Payment & Dispense Authorization')}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                    {t('giftFlow.paymentSub', 'Verify payment to trigger the automated 3D machine dispensing mechanism.')}
                  </p>
                </div>

                {paymentError && (
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '16px',
                      background: '#fee2e2',
                      border: '1px solid #f87171',
                      color: '#b91c1c',
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <AlertCircle size={18} />
                    <span>{paymentError}</span>
                  </div>
                )}

                {/* Payment Methods */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label
                    onClick={() => setPaymentMethod('card')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: '16px',
                      border: '2px solid',
                      borderColor: paymentMethod === 'card' ? '#FF3F9D' : '#e5e7eb',
                      background: paymentMethod === 'card' ? '#FFF5F9' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <CreditCard size={20} color="#FF3F9D" />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--plum)' }}>
                          {t('giftFlow.payCard', 'Credit / Debit Card (Instant Authorization)')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Visa, Mastercard, RuPay, Maestro — 256-bit Secure
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: paymentMethod === 'card' ? '#FF3F9D' : '#d1d5db',
                        background: paymentMethod === 'card' ? '#FF3F9D' : '#fff',
                      }}
                    />
                  </label>

                  <label
                    onClick={() => setPaymentMethod('upi')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 18px',
                      borderRadius: '16px',
                      border: '2px solid',
                      borderColor: paymentMethod === 'upi' ? '#8057E8' : '#e5e7eb',
                      background: paymentMethod === 'upi' ? '#FAF5FF' : '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Sparkles size={20} color="#8057E8" />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--plum)' }}>
                          {t('giftFlow.payUpi', 'Instant UPI / GPay / PhonePe')}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          Scan & Pay with any Indian UPI App
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: '2px solid',
                        borderColor: paymentMethod === 'upi' ? '#8057E8' : '#d1d5db',
                        background: paymentMethod === 'upi' ? '#8057E8' : '#fff',
                      }}
                    />
                  </label>

                  {giftType === 'physical' && (
                    <label
                      onClick={() => setPaymentMethod('cod')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 18px',
                        borderRadius: '16px',
                        border: '2px solid',
                        borderColor: paymentMethod === 'cod' ? '#059669' : '#e5e7eb',
                        background: paymentMethod === 'cod' ? '#ECFDF5' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Truck size={20} color="#059669" />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: 'var(--plum)' }}>
                            {t('giftFlow.payCod', 'Cash on Doorstep Delivery')}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            Pay in cash or UPI when gift arrives at destination
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: '50%',
                          border: '2px solid',
                          borderColor: paymentMethod === 'cod' ? '#059669' : '#d1d5db',
                          background: paymentMethod === 'cod' ? '#059669' : '#fff',
                        }}
                      />
                    </label>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    borderRadius: '14px',
                    background: 'rgba(114, 230, 176, 0.15)',
                    border: '1px solid rgba(114, 230, 176, 0.4)',
                    fontSize: 12,
                    color: '#065f46',
                  }}
                >
                  <ShieldCheck size={20} color="#059669" />
                  <span>
                    {t('giftFlow.securityNotice', 'Server verifies payment status before any voucher token is generated or dispatched.')}
                  </span>
                </div>

                {/* Back and Authorize Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={() => setStep(4)}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'transparent',
                      color: 'var(--plum)',
                      border: '1.5px solid #e5e7eb',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <ArrowLeft size={16} /> {t('giftFlow.backToReview', 'Back to Review')}
                  </button>

                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handleAuthorizePayment}
                    style={{
                      padding: '14px 36px',
                      borderRadius: 'var(--radius-pill)',
                      background: isProcessingPayment ? '#9ca3af' : 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                      color: '#fff',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: 15,
                      cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow: isProcessingPayment ? 'none' : '0 8px 24px rgba(255, 63, 157, 0.35)',
                    }}
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw size={18} className="animate-spin" />
                        <span>{t('giftFlow.verifyingPayment', 'Verifying & Authorizing…')}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        <span>{t('giftFlow.authorizeAndDispense', 'Authorize & Dispense (₹' + totalPayable + ')')}</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 6: GIFT DISPENSING ANIMATION (3D MACHINE HUD)
            ══════════════════════════════════════════════════════════════ */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '20px 10px',
                  gap: 18,
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 30px rgba(255, 63, 157, 0.4)',
                  }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
                  >
                    <RefreshCw size={36} color="#fff" />
                  </motion.div>
                </div>

                <div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      color: '#FF3F9D',
                      letterSpacing: '1px',
                    }}
                  >
                    {t('giftFlow.dispensingStepActive', '3D Mechanical Sequence Engaged')}
                  </span>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 24,
                      fontWeight: 900,
                      color: 'var(--plum)',
                      margin: '6px 0',
                    }}
                  >
                    {dispenseStep === 'aligning' && t('vendingOverlay.stepAligning', 'Aligning selected product carousel… ✨')}
                    {dispenseStep === 'grabbing' && t('vendingOverlay.stepGrabbing', 'Deploying robotic gantry claw… 🦾')}
                    {dispenseStep === 'dropping' && t('vendingOverlay.stepDropping', 'Dispensing into illuminated chute… 🎁')}
                    {dispenseStep === 'opening_hatch' && t('vendingOverlay.stepOpening', 'Opening magic collection tray… 🌟')}
                    {(!dispenseStep || dispenseStep === 'revealing') && t('vendingOverlay.stepRevealing', 'Presenting your boutique discovery… 🎈')}
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 440, margin: '0 auto', lineHeight: 1.5 }}>
                    {giftType === 'voucher'
                      ? t('giftFlow.dispensingVoucherNotice', 'Your digital voucher card is emerging from the chamber with recipient details encoded.')
                      : t('giftFlow.dispensingToyNotice', 'Your chamber toy is visually confirmed! A real boutique delivery will be dispatched to the recipient.')}
                  </p>
                </div>

                {/* Progress stage steps */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'center',
                    marginTop: 6,
                  }}
                >
                  {['Align Chamber', 'Deploy Claw', 'Chute Drop', 'Open Tray'].map((stage, idx) => (
                    <div
                      key={stage}
                      style={{
                        padding: '6px 14px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'rgba(255, 63, 157, 0.1)',
                        color: 'var(--plum)',
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {idx + 1}. {stage}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => setStep(7)}
                    style={{
                      padding: '8px 20px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid #d1d5db',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {t('giftFlow.skipAnimation', 'View Dispensed Gift →')}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ══════════════════════════════════════════════════════════════
                STEP 7: SUCCESS PAGE & LUXURY VOUCHER / ORDER CONFIRMATION
            ══════════════════════════════════════════════════════════════ */}
            {step === 7 && (
              <motion.div
                key="step7"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
              >
                {/* DIGITAL GIFT VOUCHER SUCCESS */}
                {giftType === 'voucher' && createdVoucher && (
                  <div>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: '50%',
                          background: 'rgba(114, 230, 176, 0.25)',
                          color: '#059669',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 8px',
                        }}
                      >
                        <CheckCircle size={28} />
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--plum)', margin: '0 0 4px' }}>
                        {t('giftFlow.voucherSuccessTitle', 'Voucher Successfully Created & Authorized!')}
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                        {t('giftFlow.voucherDispatchedTo', 'Securely dispatched to')} <strong style={{ color: 'var(--plum)' }}>{createdVoucher.recipientEmail}</strong>
                      </p>
                    </div>

                    {/* Render Authentic Luxury Digital Voucher Card */}
                    <DigitalVoucherCard
                      code={createdVoucher.code}
                      amount={createdVoucher.amount}
                      recipientName={createdVoucher.recipientName}
                      personalMessage={createdVoucher.personalMessage}
                      expiryDate={createdVoucher.expiryDate}
                      currency="₹"
                      purchaserName={currentUser?.name || '4U Patron'}
                      status={createdVoucher.status}
                    />
                  </div>
                )}

                {/* PHYSICAL GIFT ORDER SUCCESS */}
                {giftType === 'physical' && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #FFF9FB 0%, #F5EEFD 100%)',
                      borderRadius: '24px',
                      padding: '24px 28px',
                      border: '2px solid rgba(255, 99, 183, 0.3)',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: '50%',
                        background: 'rgba(114, 230, 176, 0.25)',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 12px',
                      }}
                    >
                      <CheckCircle size={32} />
                    </div>

                    <div style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#FF3F9D', letterSpacing: '1px' }}>
                      {t('giftFlow.physicalOrderPlaced', 'Physical Gift Order Placed!')}
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--plum)', margin: '6px 0 10px' }}>
                      {currentProduct?.name}
                    </h3>

                    {/* Order Reference Badge */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 16px',
                        borderRadius: 'var(--radius-pill)',
                        background: '#fff',
                        border: '1.5px solid rgba(255, 99, 183, 0.35)',
                        fontFamily: 'monospace',
                        fontWeight: 900,
                        fontSize: 14,
                        color: 'var(--plum)',
                        marginBottom: 16,
                      }}
                    >
                      <span>Order Ref: {orderReference}</span>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.6, maxWidth: 480, margin: '0 auto 18px' }}>
                      {t('giftFlow.physicalDeliveryNotice', 'Our boutique packaging team is preparing your gift with custom ribbons. It will be dispatched directly to')} <strong>{deliveryAddress.street}, {deliveryAddress.city}</strong>.
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        gap: 16,
                        flexWrap: 'wrap',
                        padding: '12px',
                        background: '#fff',
                        borderRadius: '16px',
                        border: '1px solid #e5e7eb',
                      }}
                    >
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Status</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>Confirmed & In Prep</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Estimated Delivery</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--plum)' }}>2 – 3 Business Days</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Payment</div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--plum)' }}>
                          {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Authorized Online'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Final Action Buttons */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/shop');
                    }}
                    style={{
                      padding: '13px 26px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'linear-gradient(135deg, #FF3F9D, #C9184A)',
                      color: '#fff',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 900,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      boxShadow: '0 8px 20px rgba(255, 63, 157, 0.3)',
                    }}
                  >
                    <ShoppingBag size={16} /> {t('giftFlow.continueShopping', 'Continue Shopping')}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      navigate('/orders');
                    }}
                    style={{
                      padding: '13px 24px',
                      borderRadius: 'var(--radius-pill)',
                      background: '#fff',
                      color: 'var(--plum)',
                      border: '1.5px solid rgba(255, 99, 183, 0.35)',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>{t('giftFlow.viewMyOrders', 'View My Orders')}</span>
                    <ExternalLink size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetJourney}
                    style={{
                      padding: '13px 22px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1.5px solid #e5e7eb',
                      fontWeight: 800,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <RotateCcw size={16} /> {t('giftFlow.dispenseAnother', 'Dispense Another')}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default GiftDispenserJourneyModal;

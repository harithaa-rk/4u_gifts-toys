import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../utils/constants';
import { 
  ShieldCheck, Lock, Smartphone, CreditCard, 
  Building2, Wallet, CheckCircle2, AlertCircle, 
  ChevronRight, Key, X, Sparkles, ExternalLink, RefreshCw,
  Copy, QrCode 
} from 'lucide-react';

const RazorpaySimulatorModal = ({
  isOpen,
  onClose,
  amount,
  orderId,
  customerInfo = {},
  onSuccess,
  onFailure
}) => {
  const [selectedMethod, setSelectedMethod] = useState('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [customUpiId, setCustomUpiId] = useState('customer@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  
  // Real Razorpay Key setup fields
  const [newKeyId, setNewKeyId] = useState('');
  const [newKeySecret, setNewKeySecret] = useState('');
  const [savingKeys, setSavingKeys] = useState(false);

  // Admin Payment Configuration (Default: Haritha Kumar)
  const [adminConfig, setAdminConfig] = useState({
    upiId: 'haritha610kumar@okicici',
    payeeName: 'Haritha Kumar',
    qrImageUrl: '/admin_upi_qr.jpg',
    gpayPhone: '+91 98765 43210',
  });
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    let isMounted = true;
    axios.get(`${API_BASE_URL}/payment/settings`)
      .then(res => {
        if (isMounted && res.data?.settings) {
          setAdminConfig(prev => ({
            ...prev,
            ...res.data.settings,
            upiId: res.data.settings.upiId || 'haritha610kumar@okicici',
            payeeName: res.data.settings.payeeName || 'Haritha Kumar',
            qrImageUrl: res.data.settings.qrImageUrl || '/admin_upi_qr.jpg',
          }));
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [isOpen]);

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(adminConfig.upiId);
    setCopiedUpi(true);
    toast.success('Admin UPI ID copied! 📋', { duration: 2000 });
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const dynamicUpiUri = `upi://pay?pa=${encodeURIComponent(adminConfig.upiId)}&pn=${encodeURIComponent(adminConfig.payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`4U_ToyStore_${Date.now()}`)}`;

  if (!isOpen) return null;

  const formattedAmount = (Number(amount) || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Handle simulated payment completion
  const handleSimulatePayment = async () => {
    setIsProcessing(true);
    try {
      await new Promise((res) => setTimeout(res, 800));
      const simulatedPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      if (onSuccess) {
        await onSuccess({
          razorpay_payment_id: simulatedPaymentId,
          razorpay_order_id: orderId || `order_${Date.now()}`,
          razorpay_signature: `sig_sandbox_${Date.now()}`,
          method: selectedMethod,
        });
      }
    } catch (err) {
      console.error('Payment callback error:', err);
      toast.error('Could not complete payment processing.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle simulated failure
  const handleSimulateFailure = () => {
    toast.error('Payment declined by issuing bank (Simulated Test Decline)', {
      icon: '❌',
      duration: 3500,
    });
    if (onFailure) {
      onFailure({ error: 'Bank declined transaction' });
    }
    onClose();
  };

  // Save real Razorpay keys to database
  const handleSaveRealKeys = async (e) => {
    e.preventDefault();
    if (!newKeyId.trim().startsWith('rzp_')) {
      toast.error('Razorpay Key ID must start with "rzp_test_" or "rzp_live_"');
      return;
    }
    setSavingKeys(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(`${API_BASE_URL}/payment/settings`, {
        razorpayKeyId: newKeyId.trim(),
        razorpayKeySecret: newKeySecret.trim(),
        razorpayEnabled: true,
      }, { headers });

      toast.success('Real Razorpay API Keys saved successfully! 🚀', { duration: 4000 });
      setShowKeyConfig(false);
      onClose();
      toast('Click "Pay with Razorpay" again to launch official Razorpay popup!', { icon: '✨', duration: 5000 });
    } catch (err) {
      console.error('Error saving keys:', err);
      toast.error(err.response?.data?.message || 'Failed to save Razorpay keys.');
    } finally {
      setSavingKeys(false);
    }
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(12, 35, 64, 0.75)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        style={{
          width: '100%',
          maxWidth: '470px',
          background: '#ffffff',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.35)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '92vh',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Razorpay Signature Navy Header */}
        <div style={{ background: '#0c2340', color: '#ffffff', padding: '20px 24px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div 
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: '#0d6efd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  color: '#ffffff',
                  fontSize: '18px',
                  boxShadow: '0 4px 12px rgba(13, 110, 253, 0.4)',
                }}
              >
                ₹
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '16px', letterSpacing: '0.2px' }}>Razorpay</span>
                  <span 
                    style={{
                      fontSize: '10px',
                      background: 'rgba(13, 110, 253, 0.25)',
                      color: '#93c5fd',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid rgba(147, 197, 253, 0.3)',
                    }}
                  >
                    Verified Gateway
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>
                  4U Toys & Gifts Boutique Store
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>
          </div>

          <div 
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.6px', color: '#94a3b8', display: 'block', fontWeight: 700 }}>
                Amount to Pay
              </span>
              <span style={{ fontSize: '26px', fontWeight: 900, color: '#34d399', letterSpacing: '-0.5px' }}>
                ₹{formattedAmount}
              </span>
            </div>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(16, 185, 129, 0.18)',
                color: '#6ee7b7',
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '20px',
                border: '1px solid rgba(110, 231, 183, 0.3)',
                fontWeight: 700,
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399' }} />
              <span>Razorpay Sandbox</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Method Selector Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', background: '#f1f5f9', padding: '4px', borderRadius: '16px' }}>
            {[
              { id: 'upi', label: 'UPI / QR', icon: <Smartphone size={16} color="#2563eb" /> },
              { id: 'card', label: 'Cards', icon: <CreditCard size={16} color="#059669" /> },
              { id: 'netbanking', label: 'NetBank', icon: <Building2 size={16} color="#7c3aed" /> },
              { id: 'wallet', label: 'Wallets', icon: <Wallet size={16} color="#d97706" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedMethod(tab.id)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px 4px',
                  borderRadius: '12px',
                  border: 'none',
                  background: selectedMethod === tab.id ? '#ffffff' : 'transparent',
                  color: selectedMethod === tab.id ? '#0c2340' : '#64748b',
                  fontWeight: selectedMethod === tab.id ? 800 : 600,
                  fontSize: '11px',
                  cursor: 'pointer',
                  boxShadow: selectedMethod === tab.id ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.2s',
                  gap: '4px',
                }}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB 1: UPI Options with Admin Haritha Kumar QR */}
          {selectedMethod === 'upi' && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '18px', border: '1.5px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Haritha Kumar Official Google Pay QR Card */}
              <div 
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
                  border: '1.5px solid #e2e8f0',
                  textAlign: 'center',
                }}
              >
                {/* Payee Profile Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div 
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #4285F4, #34A853)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '14px',
                      boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
                    }}
                  >
                    H
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a' }}>
                      {adminConfig.payeeName}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                      Verified Merchant Account
                    </div>
                  </div>
                </div>

                {/* QR Code Container */}
                <div style={{ position: 'relative', display: 'inline-block', padding: '10px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                  <img
                    src={adminConfig.qrImageUrl || '/admin_upi_qr.jpg'}
                    alt="Haritha Kumar Google Pay QR Code"
                    style={{
                      width: '180px',
                      height: '180px',
                      objectFit: 'contain',
                      borderRadius: '10px',
                      display: 'block',
                      margin: '0 auto',
                    }}
                    onError={(e) => {
                      // Fallback to dynamic QR if static image path fails
                      e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(dynamicUpiUri)}`;
                    }}
                  />
                </div>

                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginTop: '10px' }}>
                  Scan to pay with any UPI app
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '6px' }}>
                  {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(name => (
                    <span key={name} style={{ fontSize: '10px', background: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '6px', fontWeight: 700 }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Copyable Admin UPI ID */}
              <div 
                style={{
                  background: '#ffffff',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  border: '1px solid #cbd5e1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700 }}>
                    Store UPI ID
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                    {adminConfig.upiId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  style={{
                    background: copiedUpi ? '#dcfce7' : '#eff6ff',
                    color: copiedUpi ? '#16a34a' : '#2563eb',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {copiedUpi ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                  <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Direct Deep-link Button for Mobile */}
              <a
                href={dynamicUpiUri}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '13px',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                }}
              >
                <Smartphone size={16} />
                <span>Open Google Pay / UPI App Directly</span>
                <ExternalLink size={13} />
              </a>

            </div>
          )}

          {/* TAB 2: Card Options */}
          {selectedMethod === 'card' && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Card Number (Pre-filled Test Card)
                </label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '13px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Valid Thru (MM/YY)
                  </label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    CVV
                  </label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: '13px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Supported: Visa, Mastercard, RuPay, Maestro, Amex
              </div>
            </div>
          )}

          {/* TAB 3: NetBanking */}
          {selectedMethod === 'netbanking' && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Select NetBanking Institution
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setSelectedBank(b)}
                    style={{
                      padding: '10px',
                      borderRadius: '10px',
                      border: selectedBank === b ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                      background: selectedBank === b ? '#f5f3ff' : '#ffffff',
                      color: selectedBank === b ? '#5b21b6' : '#334155',
                      fontWeight: selectedBank === b ? 800 : 600,
                      fontSize: '12px',
                      textAlign: 'left',
                      cursor: 'pointer',
                    }}
                  >
                    🏛️ {b}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Wallets */}
          {selectedMethod === 'wallet' && (
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Paytm Wallet (Instant)', 'Amazon Pay Balance', 'PhonePe Wallet'].map((w) => (
                <div 
                  key={w}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#334155',
                  }}
                >
                  <span>👛 {w}</span>
                  <span style={{ color: '#059669', fontWeight: 800, fontSize: '11px' }}>Available ✓</span>
                </div>
              ))}
            </div>
          )}

          {/* Main Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            <button
              type="button"
              onClick={handleSimulatePayment}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #0c2340 0%, #0d6efd 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(13, 110, 253, 0.3)',
                transition: 'all 0.2s',
              }}
            >
              {isProcessing ? (
                <>
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}>
                    <RefreshCw size={18} />
                  </motion.div>
                  <span>Verifying Payment with Razorpay...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={18} color="#34d399" />
                  <span>Pay ₹{formattedAmount} via Razorpay</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSimulateFailure}
              disabled={isProcessing}
              style={{
                width: '100%',
                padding: '8px',
                background: 'none',
                border: 'none',
                color: '#e11d48',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <AlertCircle size={14} />
              <span>Simulate Bank Decline / Cancel</span>
            </button>
          </div>

          {/* Collapsible Section for Real Razorpay Keys */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <button
              type="button"
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'none',
                border: 'none',
                fontSize: '12px',
                fontWeight: 700,
                color: '#475569',
                cursor: 'pointer',
                padding: '4px 0',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={14} color="#f59e0b" />
                <span>Want Real Razorpay Gateway? Enter API Keys</span>
              </span>
              <ChevronRight 
                size={16} 
                style={{ 
                  transform: showKeyConfig ? 'rotate(90deg)' : 'none', 
                  transition: 'transform 0.2s' 
                }} 
              />
            </button>

            {showKeyConfig && (
              <form 
                onSubmit={handleSaveRealKeys} 
                style={{ 
                  marginTop: '10px', 
                  padding: '12px', 
                  background: '#fffbeb', 
                  borderRadius: '14px', 
                  border: '1px solid #fde68a',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                <div style={{ fontSize: '11px', color: '#92400e', lineHeight: 1.5 }}>
                  Get keys from your <a href="https://dashboard.razorpay.com/app/keys" target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 800 }}>Razorpay Dashboard</a>:
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#78350f', display: 'block', marginBottom: '4px' }}>
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="rzp_test_..."
                    value={newKeyId}
                    onChange={(e) => setNewKeyId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #d97706',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', fontWeight: 800, color: '#78350f', display: 'block', marginBottom: '4px' }}>
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    placeholder="Enter Secret"
                    value={newKeySecret}
                    onChange={(e) => setNewKeySecret(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: '1px solid #d97706',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingKeys}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f59e0b',
                    color: '#ffffff',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: savingKeys ? 'not-allowed' : 'pointer',
                  }}
                >
                  {savingKeys ? 'Saving...' : 'Save & Switch to Official Gateway'}
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Footer */}
        <div 
          style={{
            background: '#f8fafc',
            borderTop: '1px solid #f1f5f9',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: '#94a3b8',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={12} color="#10b981" /> 256-Bit SSL Encrypted
          </span>
          <span style={{ fontWeight: 800, color: '#64748b' }}>Secured by Razorpay</span>
        </div>
      </motion.div>
    </div>
  );
};

export default RazorpaySimulatorModal;

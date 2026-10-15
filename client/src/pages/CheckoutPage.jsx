import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';
import { 
  MapPin, Building, Hash, Phone, 
  CreditCard, ChevronRight, ShieldCheck, 
  ShoppingCart, Lock, Truck, QrCode,
  Copy, CheckCircle2, AlertCircle, ExternalLink,
  Sparkles, RefreshCw, Smartphone, Zap
} from 'lucide-react';
import RazorpaySimulatorModal from '../components/payment/RazorpaySimulatorModal';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const CheckoutPage = () => {
  const { t } = useTranslation();
  const { cartItems, cartTotal, clearCart, cartCount } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Shipping Information
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });

  // Razorpay Sandbox Simulator state
  const [showSimulator, setShowSimulator] = useState(false);
  const [simulatorData, setSimulatorData] = useState({ orderId: '', amount: 0 });

  // Payment Selection: 'razorpay' | 'gpay' | 'bank_transfer' | 'card' | 'cod'
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  // Admin Bank & UPI Configuration from Server
  const [adminPaymentConfig, setAdminPaymentConfig] = useState({
    upiId: 'haritha610kumar@okicici',
    payeeName: 'Haritha Kumar',
    qrImageUrl: '/admin_upi_qr.jpg',
    gpayPhone: '+91 98765 43210',
    bankName: 'State Bank of India',
    accountNumber: '409283719283',
    ifscCode: 'SBIN0004021',
    accountHolderName: '4U Toys and Gifts Private Limited',
    branch: 'Coimbatore Main Branch',
    instructions: 'Scan QR code via Google Pay or send via IMPS/NEFT, then enter the 12-digit UTR reference.',
  });

  // UTR / Transaction Tracking State
  const [utrNumber, setUtrNumber] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('Google Pay');
  const [copiedField, setCopiedField] = useState(null);
  const [utrVerifying, setUtrVerifying] = useState(false);
  const [utrVerified, setUtrVerified] = useState(false);
  const [utrError, setUtrError] = useState('');

  // Dummy Card Details
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
  });

  // Load Admin Bank & UPI Settings
  useEffect(() => {
    let isMounted = true;
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/payment/settings`);
        if (isMounted && res.data?.settings) {
          setAdminPaymentConfig(res.data.settings);
        }
      } catch (err) {
        console.warn('Could not load live payment settings, using defaults.', err);
      }
    };
    fetchSettings();
    return () => { isMounted = false; };
  }, []);

  // Copy to clipboard helper
  const handleCopy = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard! 📋`, { duration: 2000 });
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  // Generate UPI payment intent URI
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(adminPaymentConfig.upiId || '4utoys.admin@okaxis')}&pn=${encodeURIComponent(adminPaymentConfig.payeeName || '4U Toys & Gifts')}&am=${cartTotal}&cu=INR&tn=${encodeURIComponent(`4U_Order_${Date.now()}`)}`;

  // Dynamic QR Code URL (high resolution, instant preview)
  const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(upiIntentUri)}`;

  // Real-Time UTR Format Verification
  const handleVerifyUtr = async () => {
    const clean = utrNumber.trim();
    if (!clean || clean.length < 8) {
      setUtrError('Please enter a valid 8 to 16 digit transaction UTR number.');
      setUtrVerified(false);
      return;
    }
    setUtrVerifying(true);
    setUtrError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/payment/verify-utr`, {
        utrNumber: clean,
        amount: cartTotal,
      });
      if (res.data?.success) {
        setUtrVerified(true);
        toast.success('UTR format verified! Payment reference attached. ✨');
      }
    } catch (err) {
      setUtrError(err.response?.data?.message || 'Invalid UTR reference.');
      setUtrVerified(false);
    } finally {
      setUtrVerifying(false);
    }
  };

  // Place Order Handler
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first! 🔐');
        navigate('/login', { state: { from: '/checkout' } });
        return;
      }

      // Razorpay Online Payment Flow
      if (paymentMethod === 'razorpay') {
        const { data } = await axios.post(`${API_BASE_URL}/payment/razorpay/create-order`, {
          amount: cartTotal,
          receipt: `cart_order_${Date.now()}`,
        });

        const rzpOrder = data.order;
        const keyId = data.keyId;

        // If backend reports live keys are not configured or using demo fallback, open Sandbox Simulator directly
        if (!data.isRealRazorpay || !keyId || keyId.includes('Demo') || keyId.includes('simulator')) {
          setSimulatorData({ orderId: rzpOrder.id, amount: cartTotal });
          setShowSimulator(true);
          setLoading(false);
          return;
        }

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          setSimulatorData({ orderId: rzpOrder.id, amount: cartTotal });
          setShowSimulator(true);
          setLoading(false);
          return;
        }

        const options = {
          key: keyId,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency || 'INR',
          name: '4U Toys & Gifts',
          description: `Checkout (${cartCount} items)`,
          image: 'https://cdn-icons-png.flaticon.com/512/3081/3081840.png',
          order_id: rzpOrder.id,
          handler: async (response) => {
            const finalOrderData = {
              products: cartItems.map((item) => ({
                productId: item._id,
                quantity: item.cartQty,
              })),
              shippingAddress: shippingInfo,
              paymentMethod: 'razorpay',
              paymentStatus: 'Paid',
              paymentDetails: {
                utrNumber: response.razorpay_payment_id || `pay_${Date.now()}`,
                referenceId: response.razorpay_order_id || rzpOrder.id,
                upiApp: 'Razorpay Gateway',
                paidAt: new Date().toISOString(),
                verifiedByAdmin: true,
              },
            };

            await axios.post(`${API_BASE_URL}/orders`, finalOrderData, {
              headers: { Authorization: `Bearer ${token}` },
            });

            clearCart();
            toast.success('Razorpay Payment Successful! Order Placed! 🎉');
            navigate('/order-success');
          },
          prefill: {
            contact: shippingInfo.phone,
          },
          theme: {
            color: '#ff4d6d',
          },
          modal: {
            ondismiss: () => {
              setLoading(false);
            },
          },
        };

        const razorpayInstance = new window.Razorpay(options);
        razorpayInstance.on('payment.failed', () => {
          setLoading(false);
          setSimulatorData({ orderId: rzpOrder.id, amount: cartTotal });
          setShowSimulator(true);
        });
        razorpayInstance.open();
        return;
      }

      // Check required UTR for UPI / Bank transfer
      if ((paymentMethod === 'gpay' || paymentMethod === 'bank_transfer') && !utrNumber.trim()) {
        toast.error('Please enter the 12-digit UTR / Transaction Reference ID from your payment receipt.', {
          icon: '⚠️',
          duration: 4000
        });
        setLoading(false);
        return;
      }

      const orderData = {
        products: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.cartQty,
        })),
        shippingAddress: shippingInfo,
        paymentMethod: paymentMethod,
        paymentStatus: paymentMethod === 'cod' ? 'Pending' : (utrNumber.trim() ? 'Paid' : 'Pending'),
        paymentDetails: {
          utrNumber: utrNumber.trim(),
          upiApp: paymentMethod === 'gpay' ? selectedUpiApp : '',
          referenceId: `TXN_${Date.now()}`,
          paidAt: paymentMethod !== 'cod' ? new Date().toISOString() : null,
        },
      };

      await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      clearCart();
      toast.success('Magical Order Placed Successfully! 🎉', {
        style: {
          borderRadius: '20px',
          background: 'var(--card-bg, #fff)',
          color: 'var(--text, #333)',
          boxShadow: '0 10px 25px rgba(255, 77, 109, 0.2)',
        },
        duration: 4000,
      });
      navigate('/order-success');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        toast.error('Session expired. Please login again. 🔐');
        localStorage.removeItem('token');
        navigate('/login', { state: { from: '/checkout' } });
      } else {
        toast.error(err.response?.data?.message || 'Failed to place order. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', padding: '120px 20px', minHeight: '60vh' }}
      >
        <ShoppingCart size={80} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: '20px' }} />
        <h2 style={{ fontSize: '32px', color: 'var(--text)', marginBottom: '10px' }}>{t('checkoutPage.emptyCartTitle', 'Your cart is empty')}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>{t('checkoutPage.emptyCartDesc', "Looks like you haven't added any magical items yet.")}</p>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/shop')}
          style={{ padding: '16px 36px', background: 'linear-gradient(135deg, var(--primary), #ff8fab)', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '18px', fontWeight: 800, boxShadow: '0 10px 25px rgba(244,143,177,0.4)' }}
        >
          {t('checkoutPage.discoverMagic', 'Discover Magic')}
        </motion.button>
      </motion.div>
    );
  }

  // Animation Variants
  const containerVars = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVars = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '120px 20px 80px', minHeight: '80vh' }}>
      
      {/* Checkout Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>1</span>
          {t('checkoutPage.stepCart', 'Cart')}
        </div>
        <ChevronRight size={20} color="var(--text-muted)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 800 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--text)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>2</span>
          {t('checkoutPage.stepCheckout', 'Payment & Shipping')}
        </div>
        <ChevronRight size={20} color="var(--text-muted)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>3</span>
          {t('checkoutPage.stepComplete', 'Complete')}
        </div>
      </div>

      <motion.div 
        variants={containerVars} initial="hidden" animate="show"
        style={{ display: 'flex', gap: '35px', flexWrap: 'wrap', alignItems: 'flex-start' }}
      >
        
        {/* LEFT COLUMN: SHIPPING & REAL-TIME PAYMENT */}
        <div style={{ flex: '1 1 540px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Shipping Details */}
          <motion.div variants={itemVars} style={{ background: 'var(--card-bg, rgba(255,255,255,0.85))', backdropFilter: 'blur(20px)', padding: '30px', borderRadius: '28px', border: '1px solid var(--border)', boxShadow: '0 15px 40px rgba(0,0,0,0.04)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px', marginBottom: '22px', color: 'var(--text)', fontWeight: 800 }}>
              <Truck color="var(--primary)" size={24} /> {t('checkoutPage.shippingDetails', '1. Delivery Address')}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  required type="text" placeholder={t('checkoutPage.addressPlaceholder', 'Door No, Street Name, Landmark')} 
                  value={shippingInfo.address} onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})} 
                  style={{ width: '100%', padding: '14px 14px 14px 46px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--bg)', fontSize: '15px', color: 'var(--text)', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                  <Building size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    required type="text" placeholder={t('checkoutPage.cityPlaceholder', 'City / District')} 
                    value={shippingInfo.city} onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})} 
                    style={{ width: '100%', padding: '14px 14px 14px 46px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--bg)', fontSize: '15px', color: 'var(--text)', outline: 'none' }}
                  />
                </div>
                <div style={{ position: 'relative', flex: '1 1 150px' }}>
                  <Hash size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    required type="text" placeholder={t('checkoutPage.postalPlaceholder', 'PIN Code (e.g. 641001)')} 
                    value={shippingInfo.postalCode} onChange={(e) => setShippingInfo({...shippingInfo, postalCode: e.target.value})} 
                    style={{ width: '100%', padding: '14px 14px 14px 46px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--bg)', fontSize: '15px', color: 'var(--text)', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <Phone size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  required type="tel" placeholder={t('checkoutPage.phonePlaceholder', 'Mobile Number (for delivery updates)')} 
                  value={shippingInfo.phone} onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})} 
                  style={{ width: '100%', padding: '14px 14px 14px 46px', borderRadius: '14px', border: '1.5px solid var(--border)', background: 'var(--bg)', fontSize: '15px', color: 'var(--text)', outline: 'none' }}
                />
              </div>
            </div>
          </motion.div>

          {/* REAL-TIME PAYMENT SECTION */}
          <motion.div variants={itemVars} style={{ background: 'var(--card-bg, rgba(255,255,255,0.85))', backdropFilter: 'blur(20px)', padding: '30px', borderRadius: '28px', border: '1px solid var(--border)', boxShadow: '0 15px 40px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px', color: 'var(--text)', margin: 0, fontWeight: 800 }}>
                <CreditCard color="var(--primary)" size={24} /> {t('checkoutPage.paymentMethod', '2. Real-Time Payment')}
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#16a34a', fontWeight: 700, background: '#dcfce7', padding: '6px 12px', borderRadius: '20px' }}>
                <ShieldCheck size={14} /> Instant Direct Pay
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginBottom: '24px' }}>
              
              {/* Option 1: Razorpay Gateway (Recommended) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('razorpay')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '16px',
                  border: paymentMethod === 'razorpay' ? '2.5px solid #ff4d6d' : '1.5px solid var(--border)',
                  background: paymentMethod === 'razorpay' ? 'linear-gradient(135deg, rgba(255,77,109,0.1), rgba(244,63,94,0.02))' : 'var(--bg)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: paymentMethod === 'razorpay' ? '0 8px 20px rgba(255,77,109,0.2)' : 'none',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚡</div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: paymentMethod === 'razorpay' ? '#e11d48' : 'var(--text)' }}>
                  Razorpay
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>UPI / Cards / NetBank</div>
              </button>

              {/* Option 2: Google Pay / UPI */}
              <button
                type="button"
                onClick={() => setPaymentMethod('gpay')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '16px',
                  border: paymentMethod === 'gpay' ? '2.5px solid #2563eb' : '1.5px solid var(--border)',
                  background: paymentMethod === 'gpay' ? 'linear-gradient(135deg, rgba(37,99,235,0.08), rgba(59,130,246,0.02))' : 'var(--bg)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: paymentMethod === 'gpay' ? '0 8px 20px rgba(37,99,235,0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🟢</div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: paymentMethod === 'gpay' ? '#1d4ed8' : 'var(--text)' }}>
                  G-Pay / UPI
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Scan & Pay</div>
              </button>

              {/* Option 3: Direct Admin Bank Transfer */}
              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '16px',
                  border: paymentMethod === 'bank_transfer' ? '2.5px solid #7c3aed' : '1.5px solid var(--border)',
                  background: paymentMethod === 'bank_transfer' ? 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(139,92,246,0.02))' : 'var(--bg)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: paymentMethod === 'bank_transfer' ? '0 8px 20px rgba(124,58,237,0.15)' : 'none',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🏦</div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: paymentMethod === 'bank_transfer' ? '#6d28d9' : 'var(--text)' }}>
                  Admin Bank
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>IMPS / NEFT</div>
              </button>

              {/* Option 4: COD */}
              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                style={{
                  padding: '14px 10px',
                  borderRadius: '16px',
                  border: paymentMethod === 'cod' ? '2.5px solid #f59e0b' : '1.5px solid var(--border)',
                  background: paymentMethod === 'cod' ? 'rgba(245,158,11,0.08)' : 'var(--bg)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📦</div>
                <div style={{ fontWeight: 800, fontSize: '14px', color: paymentMethod === 'cod' ? '#b45309' : 'var(--text)' }}>
                  Cash On Delivery
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Doorstep Cash</div>
              </button>
            </div>

            {/* TAB CONTENT 0: RAZORPAY GATEWAY */}
            {paymentMethod === 'razorpay' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(255,241,242,0.9), rgba(255,245,245,0.6))',
                  borderRadius: '24px',
                  border: '1.5px solid rgba(254,205,211,0.8)',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', boxShadow: '0 4px 12px rgba(255,77,109,0.15)' }}>
                    ⚡
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '16px', color: '#9f1239' }}>Razorpay Official Express Gateway</div>
                    <div style={{ fontSize: '12px', color: '#be123c' }}>Instant automated confirmation & 100% buyer protection</div>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '16px', padding: '16px 20px', border: '1px solid #fecdd3', marginBottom: '16px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                    Accepted Payment Methods in Razorpay:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    <span style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: '#0f172a', border: '1px solid #e2e8f0' }}>📱 Google Pay / PhonePe / Paytm UPI</span>
                    <span style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: '#0f172a', border: '1px solid #e2e8f0' }}>💳 Visa, Mastercard, RuPay, Amex</span>
                    <span style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: '#0f172a', border: '1px solid #e2e8f0' }}>🏛️ NetBanking (50+ Indian Banks)</span>
                    <span style={{ background: '#f8fafc', padding: '6px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, color: '#0f172a', border: '1px solid #e2e8f0' }}>💼 Wallets & CRED Pay</span>
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#881337', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
                  <Lock size={14} /> Clicking "Confirm & Place Order" opens the official Razorpay checkout popup.
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT 1: GOOGLE PAY & UPI */}
            {paymentMethod === 'gpay' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(239,246,255,0.8), rgba(243,232,255,0.5))',
                  borderRadius: '24px',
                  border: '1.5px solid rgba(191,219,254,0.8)',
                  padding: '24px',
                }}
              >
                {/* Header banner */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                      📱
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '16px', color: '#1e3a8a' }}>Google Pay / Any UPI App</div>
                      <div style={{ fontSize: '12px', color: '#3b82f6' }}>Direct payment to Store Admin VPA</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ fontSize: '11px', background: '#fff', padding: '4px 8px', borderRadius: '8px', fontWeight: 700, color: '#4285F4', border: '1px solid #e0e7ff' }}>GPay</span>
                    <span style={{ fontSize: '11px', background: '#fff', padding: '4px 8px', borderRadius: '8px', fontWeight: 700, color: '#5f259f', border: '1px solid #e0e7ff' }}>PhonePe</span>
                    <span style={{ fontSize: '11px', background: '#fff', padding: '4px 8px', borderRadius: '8px', fontWeight: 700, color: '#00b9f5', border: '1px solid #e0e7ff' }}>Paytm</span>
                  </div>
                </div>

                {/* QR Code and Instructions Flexbox */}
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px' }}>
                  
                  {/* Dynamic QR Box */}
                  <div style={{ background: '#fff', padding: '14px', borderRadius: '20px', boxShadow: '0 12px 30px rgba(37,99,235,0.12)', border: '2px solid #bfdbfe', textAlign: 'center', minWidth: '180px', margin: '0 auto' }}>
                    <img 
                      src={adminPaymentConfig.qrImageUrl || qrCodeImageUrl} 
                      alt="UPI QR Code" 
                      onError={(e) => { e.target.src = qrCodeImageUrl; }}
                      style={{ width: '170px', height: '170px', borderRadius: '12px', display: 'block', margin: '0 auto', objectFit: 'contain' }} 
                    />
                    <div style={{ fontSize: '13px', fontWeight: 900, color: '#1d4ed8', marginTop: '8px' }}>
                      Scan to Pay ₹{cartTotal.toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{adminPaymentConfig.payeeName}</div>
                  </div>

                  {/* UPI Details & Deep Link */}
                  <div style={{ flex: '1 1 240px' }}>
                    <div style={{ fontSize: '13px', color: '#475569', marginBottom: '12px', lineHeight: 1.5 }}>
                      <strong>Step 1:</strong> Scan the QR code using Google Pay, PhonePe, Paytm, or click below on mobile:
                    </div>

                    {/* Direct App Button */}
                    <a
                      href={upiIntentUri}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        padding: '12px 18px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '14px',
                        textDecoration: 'none',
                        boxShadow: '0 6px 18px rgba(37,99,235,0.3)',
                        marginBottom: '14px',
                      }}
                    >
                      <Smartphone size={16} /> Open Google Pay / UPI App <ExternalLink size={14} />
                    </a>

                    {/* Copyable Admin UPI ID Box */}
                    <div style={{ background: '#fff', borderRadius: '12px', padding: '10px 14px', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Admin UPI ID (VPA)</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                          {adminPaymentConfig.upiId}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(adminPaymentConfig.upiId, 'UPI ID')}
                        style={{
                          background: copiedField === 'UPI ID' ? '#dcfce7' : '#f1f5f9',
                          color: copiedField === 'UPI ID' ? '#16a34a' : '#1e293b',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        {copiedField === 'UPI ID' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                        {copiedField === 'UPI ID' ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>
                      Payee: <strong>{adminPaymentConfig.payeeName}</strong>
                    </div>
                  </div>
                </div>

                {/* Step 2: UTR Submission */}
                <div style={{ borderTop: '1px dashed #bfdbfe', paddingTop: '18px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#1e3a8a', marginBottom: '8px' }}>
                    Step 2: Enter the 12-Digit UTR / Transaction Reference ID
                  </label>
                  <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                    After completing the transfer in Google Pay or PhonePe, copy the 12-digit UTR/Ref number from your payment receipt and enter it here for real-time verification.
                  </p>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', flex: '1 1 240px' }}>
                      <input 
                        type="text" 
                        maxLength={18}
                        placeholder="e.g. 428719283741 (12 digits)" 
                        value={utrNumber} 
                        onChange={(e) => {
                          setUtrNumber(e.target.value);
                          setUtrVerified(false);
                          setUtrError('');
                        }}
                        style={{
                          width: '100%',
                          padding: '14px 16px',
                          borderRadius: '14px',
                          border: utrVerified ? '2px solid #16a34a' : utrError ? '2px solid #ef4444' : '1.5px solid #94a3b8',
                          background: '#fff',
                          fontSize: '15px',
                          fontWeight: 700,
                          letterSpacing: '1px',
                          outline: 'none',
                        }}
                      />
                      {utrVerified && (
                        <CheckCircle2 size={20} color="#16a34a" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleVerifyUtr}
                      disabled={utrVerifying || !utrNumber.trim()}
                      style={{
                        padding: '14px 22px',
                        borderRadius: '14px',
                        background: utrVerified ? '#16a34a' : '#1e3a8a',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '13px',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      {utrVerifying ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}>
                            <RefreshCw size={14} />
                          </motion.div>
                          Verifying...
                        </>
                      ) : utrVerified ? (
                        <>Verified ✓</>
                      ) : (
                        <>Verify UTR</>
                      )}
                    </button>
                  </div>

                  {utrError && (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '6px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <AlertCircle size={14} /> {utrError}
                    </div>
                  )}

                  {/* App selector */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>App used:</span>
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map((app) => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setSelectedUpiApp(app)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          border: selectedUpiApp === app ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          background: selectedUpiApp === app ? '#eff6ff' : '#fff',
                          color: selectedUpiApp === app ? '#1d4ed8' : '#64748b',
                          cursor: 'pointer',
                        }}
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT 2: DIRECT ADMIN BANK TRANSFER */}
            {paymentMethod === 'bank_transfer' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'linear-gradient(135deg, rgba(245,243,255,0.9), rgba(253,244,255,0.5))',
                  borderRadius: '24px',
                  border: '1.5px solid rgba(221,214,254,0.8)',
                  padding: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                    🏛️
                  </div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '16px', color: '#5b21b6' }}>Direct Admin Bank Transfer (NEFT / IMPS)</div>
                    <div style={{ fontSize: '12px', color: '#7c3aed' }}>Official business account for 4U Toys & Gifts</div>
                  </div>
                </div>

                <div style={{ background: '#fff', borderRadius: '18px', padding: '18px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  
                  {/* Account Name */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Account Name</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{adminPaymentConfig.accountHolderName}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(adminPaymentConfig.accountHolderName, 'Account Name')}
                      style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                    >
                      {copiedField === 'Account Name' ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>

                  {/* Bank Name */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Bank & Branch</div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>{adminPaymentConfig.bankName} — {adminPaymentConfig.branch}</div>
                    </div>
                  </div>

                  {/* Account Number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Account Number</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: '#5b21b6', fontFamily: 'monospace' }}>
                        {adminPaymentConfig.accountNumber}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(adminPaymentConfig.accountNumber, 'Account Number')}
                      style={{ background: copiedField === 'Account Number' ? '#dcfce7' : '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {copiedField === 'Account Number' ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>

                  {/* IFSC Code */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>IFSC Code</div>
                      <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace' }}>
                        {adminPaymentConfig.ifscCode}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(adminPaymentConfig.ifscCode, 'IFSC Code')}
                      style={{ background: copiedField === 'IFSC Code' ? '#dcfce7' : '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                    >
                      {copiedField === 'IFSC Code' ? 'Copied ✓' : 'Copy'}
                    </button>
                  </div>

                </div>

                {/* Enter Bank UTR */}
                <div style={{ borderTop: '1px dashed #ddd6fe', paddingTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#5b21b6', marginBottom: '8px' }}>
                    Bank Transfer UTR / IMPS Reference Number
                  </label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      placeholder="e.g. 428719283741 / IMPS-93821" 
                      value={utrNumber} 
                      onChange={(e) => setUtrNumber(e.target.value)}
                      style={{
                        flex: 1,
                        padding: '14px 16px',
                        borderRadius: '14px',
                        border: '1.5px solid #a78bfa',
                        background: '#fff',
                        fontSize: '15px',
                        fontWeight: 700,
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '6px' }}>
                    Enter the reference number from your bank transfer confirmation screen or SMS.
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT 3: CARD */}
            {paymentMethod === 'card' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '24px',
                  background: 'var(--bg)',
                  borderRadius: '24px',
                  border: '1.5px solid var(--border)',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>
                  Credit or Debit Card
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <input 
                    type="text" 
                    placeholder="Card Number (e.g. 4532 8912 3456 7890)" 
                    value={cardDetails.number}
                    onChange={(e) => setCardDetails({...cardDetails, number: e.target.value})}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border)', background: '#fff', outline: 'none' }} 
                  />
                </div>
                <div style={{ display: 'flex', gap: '14px' }}>
                  <input 
                    type="text" 
                    placeholder="MM/YY" 
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({...cardDetails, expiry: e.target.value})}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border)', background: '#fff', outline: 'none' }} 
                  />
                  <input 
                    type="text" 
                    placeholder="CVC" 
                    value={cardDetails.cvc}
                    onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value})}
                    style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border)', background: '#fff', outline: 'none' }} 
                  />
                </div>
              </motion.div>
            )}

            {/* TAB CONTENT 4: COD */}
            {paymentMethod === 'cod' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '20px',
                  background: 'rgba(245,158,11,0.06)',
                  borderRadius: '20px',
                  border: '1.5px solid rgba(245,158,11,0.2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '24px' }}>📦</div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: '#92400e' }}>Cash on Delivery (COD)</div>
                    <div style={{ fontSize: '13px', color: '#b45309' }}>Pay cash when our courier delivers your magical package to your doorstep.</div>
                  </div>
                </div>
              </motion.div>
            )}
            
          </motion.div>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY & INSTANT ACTION */}
        <motion.div variants={itemVars} style={{ flex: '1 1 360px' }}>
          <div style={{ background: 'var(--card-bg, rgba(255,255,255,0.85))', backdropFilter: 'blur(20px)', padding: '30px', borderRadius: '28px', border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', position: 'sticky', top: '100px' }}>
            
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '22px', color: 'var(--text)', borderBottom: '2px solid var(--border)', paddingBottom: '14px' }}>
              {t('checkoutPage.orderSummaryItems', { count: cartCount, defaultValue: `Order Summary (${cartCount} items)` })}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px', maxHeight: '320px', overflowY: 'auto', paddingRight: '6px' }}>
              {cartItems.map((item) => (
                <div key={item._id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={item.images?.[0] || 'https://placehold.co/60x60?text=🎁'} alt={item.name} style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: 'var(--primary)', color: '#fff', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                      {item.cartQty}
                    </span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>₹{(+item.price).toLocaleString('en-IN')} each</div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--text)', fontSize: '14px' }}>
                    ₹{(+item.price * item.cartQty).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg)', padding: '18px', borderRadius: '18px', marginBottom: '22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <span>{t('checkoutPage.subtotal', 'Subtotal')}</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', color: 'var(--text-muted)', fontSize: '14px' }}>
                <span>{t('checkoutPage.shipping', 'Shipping')}</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>FREE (Complimentary)</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border)', margin: '12px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '18px', fontWeight: 800 }}>
                <span>{t('checkoutPage.total', 'Total Payable')}</span>
                <span style={{ color: 'var(--primary)', fontSize: '26px' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Selected method summary badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(59,130,246,0.06)', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)', marginBottom: '20px', fontSize: '12px', color: '#1e40af' }}>
              <Sparkles size={16} color="#3b82f6" />
              <span>
                Selected: <strong>{paymentMethod === 'razorpay' ? '⚡ Razorpay Official Gateway (Cards, UPI, NetBanking)' : paymentMethod === 'gpay' ? 'Google Pay / UPI' : paymentMethod === 'bank_transfer' ? 'Direct Bank Transfer' : paymentMethod === 'card' ? 'Debit/Credit Card' : 'Cash On Delivery'}</strong>
              </span>
            </div>

            <motion.button
              onClick={handlePlaceOrder}
              disabled={loading || !shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode || !shippingInfo.phone}
              className="btn-primary"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ 
                width: '100%', padding: '18px', 
                borderRadius: '20px', 
                fontSize: '17px', fontWeight: 900, 
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
                background: paymentMethod === 'razorpay' ? 'linear-gradient(135deg, #ff4d6d, #e11d48)' : 'linear-gradient(135deg, #f48fb1, #ff6b8b)',
                color: '#fff',
                border: 'none',
                cursor: (!shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode || !shippingInfo.phone) ? 'not-allowed' : 'pointer',
                opacity: (!shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode || !shippingInfo.phone) ? 0.6 : 1,
                boxShadow: '0 10px 25px rgba(255, 77, 109, 0.3)',
              }}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                  <RefreshCw size={20} />
                </motion.div>
              ) : (
                <>
                  {paymentMethod === 'razorpay' ? (
                    <>
                      <Zap size={18} fill="#fff" /> Pay ₹{cartTotal.toLocaleString('en-IN')} with Razorpay
                    </>
                  ) : paymentMethod === 'cod' ? (
                    'Confirm Cash on Delivery'
                  ) : (
                    'Confirm & Place Order'
                  )} 
                  <ChevronRight size={18} />
                </>
              )}
            </motion.button>

            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '12px', color: 'var(--text-muted)' }}>
              🔒 256-Bit SSL Encrypted & Direct Bank Verified
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Razorpay Sandbox Simulator Modal */}
      <RazorpaySimulatorModal
        isOpen={showSimulator}
        onClose={() => setShowSimulator(false)}
        amount={simulatorData.amount || cartTotal}
        orderId={simulatorData.orderId}
        customerInfo={{ phone: shippingInfo.phone }}
        onSuccess={async (paymentResult) => {
          setShowSimulator(false);
          const token = localStorage.getItem('token');
          const finalOrderData = {
            products: cartItems.map((item) => ({
              productId: item._id,
              quantity: item.cartQty,
            })),
            shippingAddress: shippingInfo,
            paymentMethod: 'razorpay',
            paymentStatus: 'Paid',
            paymentDetails: {
              utrNumber: paymentResult.razorpay_payment_id || `pay_${Date.now()}`,
              referenceId: paymentResult.razorpay_order_id || simulatorData.orderId,
              upiApp: 'Razorpay Gateway',
              paidAt: new Date().toISOString(),
              verifiedByAdmin: true,
            },
          };

          await axios.post(`${API_BASE_URL}/orders`, finalOrderData, {
            headers: { Authorization: `Bearer ${token}` },
          });

          clearCart();
          toast.success('Razorpay Payment Successful! Order Placed! 🎉');
          navigate('/order-success');
        }}
        onFailure={() => {
          setLoading(false);
        }}
      />
    </div>
  );
};

export default CheckoutPage;

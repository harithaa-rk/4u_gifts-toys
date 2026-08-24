import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../utils/constants';
import { 
  MapPin, Building, Hash, Phone, 
  CreditCard, ChevronRight, ShieldCheck, 
  ShoppingCart, Lock, Truck
} from 'lucide-react';

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart, cartCount } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Shipping & Payment State
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    postalCode: '',
    phone: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login first! 🔐');
        navigate('/login');
        return;
      }

      const orderData = {
        products: cartItems.map((item) => ({
          productId: item._id,
          quantity: item.cartQty,
        })),
        shippingAddress: shippingInfo,
        paymentMethod: paymentMethod, // optional tracking
      };

      await axios.post(`${API_BASE_URL}/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      clearCart();
      toast.success('Order placed successfully! 🎉', {
        style: {
          borderRadius: '20px',
          background: 'var(--card-bg, #fff)',
          color: 'var(--text, #333)',
          boxShadow: '0 10px 25px rgba(255, 77, 109, 0.2)',
        },
      });
      navigate('/order-success');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 401) {
        toast.error('Session expired. Please login again. 🔐');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        toast.error('Failed to place order. Please try again.');
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
        <h2 style={{ fontSize: '32px', color: 'var(--text)', marginBottom: '10px' }}>Your cart is empty</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '30px' }}>Looks like you haven't added any magical items yet.</p>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/shop')}
          style={{ padding: '16px 36px', background: 'linear-gradient(135deg, var(--primary), #ff8fab)', color: '#fff', border: 'none', borderRadius: '30px', cursor: 'pointer', fontSize: '18px', fontWeight: 800, boxShadow: '0 10px 25px rgba(244,143,177,0.4)' }}
        >
          Discover Magic
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '120px 20px 80px', minHeight: '80vh' }}>
      
      {/* Checkout Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '50px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>1</span>
          Cart
        </div>
        <ChevronRight size={20} color="var(--text-muted)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text)', fontWeight: 800 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--text)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>2</span>
          Checkout
        </div>
        <ChevronRight size={20} color="var(--text-muted)" />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>3</span>
          Complete
        </div>
      </div>

      <motion.div 
        variants={containerVars} initial="hidden" animate="show"
        style={{ display: 'flex', gap: '40px', flexWrap: 'wrap', alignItems: 'flex-start' }}
      >
        
        {/* LEFT COLUMN: FORMS */}
        <div style={{ flex: '1 1 500px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Shipping Section */}
          <motion.div variants={itemVars} style={{ background: 'var(--card-bg, rgba(255,255,255,0.75))', backdropFilter: 'blur(20px)', padding: '35px', borderRadius: '30px', border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', marginBottom: '25px', color: 'var(--text)' }}>
              <Truck color="var(--primary)" /> Shipping Details
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ position: 'relative' }}>
                <MapPin size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  required type="text" placeholder="Full Street Address" 
                  value={shippingInfo.address} onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})} 
                  style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '2px solid var(--border)', background: 'var(--bg)', fontSize: '16px', color: 'var(--text)', outline: 'none', transition: 'all 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                  <Building size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    required type="text" placeholder="City" 
                    value={shippingInfo.city} onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})} 
                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '2px solid var(--border)', background: 'var(--bg)', fontSize: '16px', color: 'var(--text)', outline: 'none', transition: 'all 0.3s' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
                <div style={{ position: 'relative', flex: '1 1 150px' }}>
                  <Hash size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    required type="text" placeholder="Postal Code" 
                    value={shippingInfo.postalCode} onChange={(e) => setShippingInfo({...shippingInfo, postalCode: e.target.value})} 
                    style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '2px solid var(--border)', background: 'var(--bg)', fontSize: '16px', color: 'var(--text)', outline: 'none', transition: 'all 0.3s' }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                  />
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <Phone size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                <input 
                  required type="tel" placeholder="Phone Number" 
                  value={shippingInfo.phone} onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})} 
                  style={{ width: '100%', padding: '16px 16px 16px 48px', borderRadius: '16px', border: '2px solid var(--border)', background: 'var(--bg)', fontSize: '16px', color: 'var(--text)', outline: 'none', transition: 'all 0.3s' }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                  onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                />
              </div>
            </div>
          </motion.div>

          {/* Payment Section */}
          <motion.div variants={itemVars} style={{ background: 'var(--card-bg, rgba(255,255,255,0.75))', backdropFilter: 'blur(20px)', padding: '35px', borderRadius: '30px', border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '24px', color: 'var(--text)', margin: 0 }}>
                <CreditCard color="var(--primary)" /> Payment Method
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg)', padding: '6px 12px', borderRadius: '20px' }}>
                <Lock size={12} /> Secure Checkout
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {/* Card Option */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', border: paymentMethod === 'card' ? '2px solid var(--primary)' : '2px solid var(--border)', borderRadius: '16px', cursor: 'pointer', background: paymentMethod === 'card' ? 'rgba(255, 77, 109, 0.05)' : 'transparent', transition: 'all 0.2s' }}>
                <input type="radio" name="payment" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text)' }}>Credit / Debit Card</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Visa, MasterCard, Amex</div>
                </div>
                <div style={{ display: 'flex', gap: '5px' }}>
                  <div style={{ width: '36px', height: '24px', background: '#1a1f36', borderRadius: '4px' }}></div>
                  <div style={{ width: '36px', height: '24px', background: '#ff5f00', borderRadius: '4px' }}></div>
                </div>
              </label>

              {/* COD Option */}
              <label style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', border: paymentMethod === 'cod' ? '2px solid var(--primary)' : '2px solid var(--border)', borderRadius: '16px', cursor: 'pointer', background: paymentMethod === 'cod' ? 'rgba(255, 77, 109, 0.05)' : 'transparent', transition: 'all 0.2s' }}>
                <input type="radio" name="payment" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} style={{ width: '20px', height: '20px', accentColor: 'var(--primary)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text)' }}>Cash on Delivery (COD)</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Pay when your magical order arrives</div>
                </div>
              </label>
            </div>
            
            {/* Dummy Card Form if Card selected */}
            <AnimatePresence>
              {paymentMethod === 'card' && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, marginTop: 0 }} 
                  animate={{ height: 'auto', opacity: 1, marginTop: '20px' }} 
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ padding: '20px', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: '15px' }}>
                      <input type="text" placeholder="Card Number" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: '#fff', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '15px' }}>
                      <input type="text" placeholder="MM/YY" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: '#fff', outline: 'none' }} />
                      <input type="text" placeholder="CVC" style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: '#fff', outline: 'none' }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
          </motion.div>
        </div>

        {/* RIGHT COLUMN: ORDER SUMMARY */}
        <motion.div variants={itemVars} style={{ flex: '1 1 350px' }}>
          <div style={{ background: 'var(--card-bg, rgba(255,255,255,0.75))', backdropFilter: 'blur(20px)', padding: '35px', borderRadius: '30px', border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)', position: 'sticky', top: '100px' }}>
            
            <h3 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '25px', color: 'var(--text)', borderBottom: '2px solid var(--border)', paddingBottom: '15px' }}>
              Order Summary ({cartCount} item{cartCount > 1 ? 's' : ''})
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px', maxHeight: '350px', overflowY: 'auto', paddingRight: '10px' }}>
              {cartItems.map((item) => (
                <div key={item._id} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <img src={item.images?.[0] || 'https://placehold.co/60x60?text=🎁'} alt={item.name} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--primary)', color: '#fff', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                      {item.cartQty}
                    </span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '4px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>₹{(+item.price).toLocaleString('en-IN')} each</div>
                  </div>
                  <div style={{ fontWeight: 800, color: 'var(--text)' }}>
                    ₹{(+item.price * item.cartQty).toLocaleString('en-IN')}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--bg)', padding: '20px', borderRadius: '20px', marginBottom: '25px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '15px' }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '15px' }}>
                <span>Shipping</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>Free</span>
              </div>
              <div style={{ height: '1px', background: 'var(--border)', margin: '15px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '20px', fontWeight: 800 }}>
                <span>Total</span>
                <span style={{ color: 'var(--primary)', fontSize: '28px' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(74, 222, 128, 0.1)', padding: '15px', borderRadius: '16px', marginBottom: '25px', color: '#16a34a', fontSize: '13px', fontWeight: 600 }}>
              <ShieldCheck size={24} />
              <span>Your payment is secure and encrypted.</span>
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
                fontSize: '18px', fontWeight: 800, 
                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px'
              }}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1 }}>
                  <ShoppingCart />
                </motion.div>
              ) : (
                <>Place Magical Order <ChevronRight size={20} /></>
              )}
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;

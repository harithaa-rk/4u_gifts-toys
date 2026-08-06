import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const CartDrawer = () => {
  const { isCartOpen, closeCart, cartItems, updateQuantity, removeFromCart, cartTotal, cartCount } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to place an order 🔐');
      closeCart();
      navigate('/login');
      return;
    }
    closeCart();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            style={{
              position: 'fixed', inset: 0,
              backgroundColor: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 999,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '100%', maxWidth: '420px',
              backgroundColor: 'var(--card-bg, #fff)',
              zIndex: 1000,
              boxShadow: '-20px 0 60px rgba(0,0,0,0.15)',
              display: 'flex', flexDirection: 'column',
              borderRadius: '24px 0 0 24px',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '24px 20px',
              borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, var(--primary) 0%, #ff8fab 100%)',
              borderRadius: '24px 0 0 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShoppingBag size={22} color="#fff" />
                <h2 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 800 }}>
                  Your Cart
                </h2>
                {cartCount > 0 && (
                  <span style={{
                    background: 'rgba(255,255,255,0.3)',
                    color: '#fff',
                    borderRadius: '20px',
                    padding: '2px 10px',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}>
                    {cartCount} item{cartCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button onClick={closeCart} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                borderRadius: '50%', width: '36px', height: '36px',
                cursor: 'pointer', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {cartItems.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '60px' }}>
                  <ShoppingBag size={56} style={{ opacity: 0.15, marginBottom: '16px' }} />
                  <p style={{ fontSize: '18px', fontWeight: 600 }}>Your cart is empty</p>
                  <p style={{ fontSize: '14px' }}>Add some products to get started!</p>
                  <motion.button
                    whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                    onClick={() => { closeCart(); navigate('/shop'); }}
                    style={{
                      marginTop: '20px', padding: '12px 28px',
                      background: 'var(--primary)', color: '#fff',
                      border: 'none', borderRadius: '30px',
                      fontWeight: 700, cursor: 'pointer', fontSize: '15px',
                    }}
                  >
                    Shop Now
                  </motion.button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {cartItems.map((item) => (
                    <motion.div
                      key={item._id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 40 }}
                      style={{
                        display: 'flex', gap: '14px',
                        background: 'var(--bg)',
                        borderRadius: '16px',
                        padding: '14px',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <img
                        src={item.images?.[0] || 'https://placehold.co/80x80?text=🎁'}
                        alt={item.name}
                        style={{ width: '76px', height: '76px', objectFit: 'cover', borderRadius: '12px', flexShrink: 0 }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </h4>
                        <p style={{ margin: '0 0 10px', color: 'var(--primary)', fontWeight: 800, fontSize: '16px' }}>
                          ₹{(+item.price).toLocaleString('en-IN')}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => updateQuantity(item._id, -1)}
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', padding: '5px 8px', display: 'flex', alignItems: 'center' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontWeight: 700, minWidth: '20px', textAlign: 'center', fontSize: '15px' }}>{item.cartQty}</span>
                          <button
                            onClick={() => updateQuantity(item._id, 1)}
                            style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', padding: '5px 8px', display: 'flex', alignItems: 'center' }}
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeFromCart(item._id)}
                            style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div style={{ padding: '20px', borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', color: 'var(--text-muted)' }}>
                  <span>{cartCount} item{cartCount > 1 ? 's' : ''}</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                  <span>Total</span>
                  <span style={{ color: 'var(--primary)' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCheckout}
                  className="btn-primary"
                  style={{
                    width: '100%', padding: '18px',
                    borderRadius: '16px',
                    fontSize: '17px', fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  }}
                >
                  Proceed to Checkout <ArrowRight size={20} />
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;

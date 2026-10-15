import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag, ArrowRight, Trash2, Gift } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const CartDrawer = () => {
  const { t } = useTranslation();
  const {
    isCartOpen, closeCart,
    cartItems, updateQuantity, removeFromCart,
    cartTotal, cartCount,
  } = useCart();
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
              backgroundColor: 'rgba(53,36,61,0.45)',
              backdropFilter: 'blur(6px)',
              zIndex: 999,
            }}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0,
              width: '100%', maxWidth: 420,
              background: 'var(--ivory, #FFFCF7)',
              zIndex: 1000,
              boxShadow: '-20px 0 60px rgba(53,36,61,0.18)',
              display: 'flex', flexDirection: 'column',
              borderRadius: '24px 0 0 24px',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '22px 22px',
              borderBottom: '1px solid var(--card-border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              borderRadius: '24px 0 0 0',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShoppingBag size={21} color="#fff" />
                <h2 style={{ margin: 0, color: '#fff', fontSize: 19, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                  {t('cart.title', 'Your Cart')}
                </h2>
                {cartCount > 0 && (
                  <span style={{
                    background: 'rgba(255,255,255,0.25)',
                    color: '#fff',
                    borderRadius: 100, padding: '2px 10px',
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {cartCount} {cartCount > 1 ? t('cart.items', 'items') : t('cart.item', 'item')}
                  </span>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={closeCart}
                aria-label="Close cart"
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none',
                  borderRadius: '50%', width: 36, height: 36,
                  cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <AnimatePresence>
                {cartItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: 60 }}
                  >
                    <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.25 }}>🛍️</div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--plum)', marginBottom: 8 }}>
                      {t('cart.emptyTitle', 'Your cart is empty')}
                    </p>
                    <p style={{ fontSize: 14 }}>
                      {t('cart.emptyDesc', 'Add some magical items to get started!')}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                      onClick={() => { closeCart(); navigate('/shop'); }}
                      style={{
                        marginTop: 24, padding: '12px 28px',
                        background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                        color: '#fff', border: 'none',
                        borderRadius: 'var(--radius-pill)',
                        fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer', fontSize: 15,
                        boxShadow: 'var(--shadow-pink)',
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <Gift size={16} /> {t('cart.exploreShop', 'Shop Now')}
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
                    initial="hidden"
                    animate="visible"
                    style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
                  >
                    {cartItems.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                        exit={{ opacity: 0, x: 40 }}
                        style={{
                          display: 'flex', gap: 14,
                          background: 'var(--white)',
                          borderRadius: 'var(--radius-lg)',
                          padding: 14,
                          border: '1px solid var(--card-border)',
                          boxShadow: 'var(--shadow-sm)',
                        }}
                      >
                        {/* Image */}
                        <div style={{ width: 76, height: 76, borderRadius: 12, overflow: 'hidden', flexShrink: 0, background: 'var(--blush)' }}>
                          {item.images?.[0] ? (
                            <img
                              src={item.images[0]}
                              alt={item.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                              🎁
                            </div>
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            margin: '0 0 4px',
                            fontSize: 14, fontWeight: 700,
                            color: 'var(--plum)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            fontFamily: 'var(--font-display)',
                          }}>
                            {item.name}
                          </h4>
                          <p style={{ margin: '0 0 10px', color: 'var(--primary-dark)', fontWeight: 800, fontSize: 16, fontFamily: 'var(--font-display)' }}>
                            ₹{(+item.price).toLocaleString('en-IN')}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* Qty controls */}
                            {[
                              { icon: <Minus size={12} />, action: () => updateQuantity(item._id, -1) },
                            ].map((c, i) => (
                              <motion.button key={i}
                                whileTap={{ scale: 0.85 }}
                                onClick={c.action}
                                style={{ background: 'var(--blush)', border: '1px solid var(--card-border)', borderRadius: 8, cursor: 'pointer', padding: '5px 9px', display: 'flex', alignItems: 'center', color: 'var(--plum)' }}
                              >
                                {c.icon}
                              </motion.button>
                            ))}
                            <span style={{ fontWeight: 800, minWidth: 24, textAlign: 'center', fontSize: 15, color: 'var(--plum)', fontFamily: 'var(--font-display)' }}>
                              {item.cartQty}
                            </span>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => updateQuantity(item._id, 1)}
                              style={{ background: 'var(--blush)', border: '1px solid var(--card-border)', borderRadius: 8, cursor: 'pointer', padding: '5px 9px', display: 'flex', alignItems: 'center', color: 'var(--plum)' }}
                            >
                              <Plus size={12} />
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.85 }}
                              onClick={() => removeFromCart(item._id)}
                              style={{ background: 'none', border: 'none', color: '#e63946', cursor: 'pointer', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}
                            >
                              <Trash2 size={14} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div style={{
                padding: '20px 22px',
                borderTop: '1px solid var(--card-border)',
                background: 'var(--white)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>{cartCount} {cartCount > 1 ? t('cart.items', 'items') : t('cart.item', 'item')}</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18, fontSize: 20, fontWeight: 900, color: 'var(--plum)', fontFamily: 'var(--font-display)' }}>
                  <span>{t('cart.total', 'Total')}</span>
                  <span style={{ color: 'var(--primary-dark)' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.97 }}
                  onClick={handleCheckout}
                  style={{
                    width: '100%', padding: '16px',
                    background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                    color: '#fff', border: 'none',
                    borderRadius: 'var(--radius-pill)',
                    fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: 'var(--shadow-pink)',
                  }}
                >
                  {t('cart.checkout', 'Proceed to Checkout')} <ArrowRight size={19} />
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

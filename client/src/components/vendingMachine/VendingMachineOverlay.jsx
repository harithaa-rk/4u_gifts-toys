import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShoppingBag, ArrowRight, Eye, RefreshCw, CheckCircle, AlertCircle, Heart, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import GiftDispenserJourneyModal from './GiftDispenserJourneyModal';

const VendingMachineOverlay = ({
  products = [],
  selectedIndex = 0,
  onSelectProduct,
  isDispensing = false,
  dispenseStep = '',
  onStartDispense,
  dispensedProduct = null,
  onResetDispense,
  onCameraChange,
  cameraMode = 'hero',
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isLoggedIn } = useAuth();
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);

  const selectedProduct = products[selectedIndex] || null;
  const isOutOfStock = selectedProduct ? selectedProduct.quantity <= 0 : false;

  // Keyboard accessibility (keys 1-6 select chambers)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isDispensing) return;
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= products.length) {
        onSelectProduct?.(num - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [products.length, isDispensing, onSelectProduct]);

  const handleAddToCart = (prod) => {
    if (!prod) return;
    if (prod.quantity <= 0) {
      toast.error('This item is currently out of stock.');
      return;
    }
    if (!isLoggedIn) {
      toast.error('Please login to add items to your cart! 🛍️');
      navigate('/login');
      return;
    }
    addToCart(prod);
    setAddedSuccess(true);
    toast.success(`${prod.name} added to cart! 🎉`);
    setTimeout(() => setAddedSuccess(false), 2000);
  };

  const handleBuyNow = (prod) => {
    if (!prod) return;
    if (prod.quantity <= 0) {
      toast.error('This item is currently out of stock.');
      return;
    }
    if (!isLoggedIn) {
      toast.error('Please login to proceed to checkout! 🛍️');
      navigate('/login');
      return;
    }
    addToCart(prod);
    navigate('/checkout');
  };

  const stepLabels = {
    aligning: t('vendingOverlay.stepAligning', 'Aligning selected product carousel… ✨'),
    grabbing: t('vendingOverlay.stepGrabbing', 'Deploying robotic gantry claw… 🦾'),
    dropping: t('vendingOverlay.stepDropping', 'Dispensing into illuminated chute… 🎁'),
    opening_hatch: t('vendingOverlay.stepOpening', 'Opening magic collection tray… 🌟'),
    revealing: t('vendingOverlay.stepRevealing', 'Presenting your boutique discovery… 🎈'),
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 'clamp(90px, 12vh, 110px) clamp(20px, 4vw, 48px) 30px',
        zIndex: 10,
      }}
    >
      {/* ── TOP SECTION: CINEMATIC HEADLINE & CTAS ── */}
      <div
        style={{
          maxWidth: '560px',
          pointerEvents: 'auto',
          background: 'rgba(255, 252, 247, 0.88)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          padding: '26px 30px',
          borderRadius: 'var(--radius-xl)',
          border: '1.5px solid rgba(255, 99, 183, 0.35)',
          boxShadow: '0 25px 60px rgba(64, 32, 68, 0.1)',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '5px 14px',
            borderRadius: 'var(--radius-pill)',
            background: 'linear-gradient(135deg, rgba(255,99,183,0.2), rgba(167,139,250,0.25))',
            color: 'var(--plum)',
            fontSize: 12,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.8px',
            marginBottom: 12,
          }}
        >
          <Sparkles size={14} color="#FF3F9D" /> {t('vendingOverlay.badge', '3D Surprise Toy Machine')}
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(28px, 4.2vw, 44px)',
            fontWeight: 900,
            color: 'var(--plum)',
            lineHeight: 1.15,
            margin: '0 0 10px',
            letterSpacing: '-0.5px',
          }}
        >
          {t('vendingOverlay.heading1', 'Your Next Little Wonder')}{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #FF3F9D 0%, #8057E8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {t('vendingOverlay.heading2', 'Awaits.')}
          </span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(14px, 1.6vw, 16px)',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            margin: '0 0 20px',
          }}
        >
          {t('vendingOverlay.subtext', 'Step into a world of toys, surprises, and unforgettable gifts. Click any chamber inside the machine or press dispense to see it in action.')}
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              const el = document.getElementById('featured-products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              padding: '13px 26px',
              borderRadius: 'var(--radius-pill)',
              background: 'linear-gradient(135deg, #FF3F9D, #C9184A)',
              color: '#fff',
              border: 'none',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(255, 63, 157, 0.35)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {t('vendingOverlay.exploreToys', 'Explore the Toys')} <ArrowRight size={16} />
          </button>

          <button
            disabled={isDispensing || !selectedProduct || isOutOfStock}
            onClick={() => setJourneyOpen(true)}
            style={{
              padding: '13px 26px',
              borderRadius: 'var(--radius-pill)',
              background: isOutOfStock ? '#f3f4f6' : '#fff',
              color: isOutOfStock ? '#9ca3af' : 'var(--plum)',
              border: '1.5px solid var(--card-border)',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 14,
              cursor: isDispensing || isOutOfStock ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: 'var(--shadow-sm)',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) => !isOutOfStock && (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <Sparkles size={16} color={isOutOfStock ? '#9ca3af' : '#FF3F9D'} />
            {isDispensing
              ? t('vendingOverlay.dispensing', 'Dispensing…')
              : isOutOfStock
              ? t('shop.outOfStock', 'Out of Stock')
              : t('vendingOverlay.dispenseProduct', 'Dispense Product')}
          </button>
        </div>
      </div>

      {/* ── CAMERA VIEW CONTROLS (Top Right) ── */}
      <div
        style={{
          position: 'absolute',
          top: 'clamp(90px, 12vh, 110px)',
          right: 'clamp(20px, 4vw, 48px)',
          display: 'flex',
          gap: 8,
          pointerEvents: 'auto',
          background: 'rgba(255, 252, 247, 0.88)',
          backdropFilter: 'blur(16px)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-pill)',
          border: '1.5px solid rgba(255, 99, 183, 0.35)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {[
          { id: 'hero', label: t('vendingOverlay.camFull', 'Full Machine') },
          { id: 'interior', label: t('vendingOverlay.camChamber', 'Chamber Peek') },
          { id: 'categories', label: t('vendingOverlay.camTop', 'Top Angles') },
        ].map((mode) => (
          <button
            key={mode.id}
            onClick={() => onCameraChange?.(mode.id)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: cameraMode === mode.id ? 'linear-gradient(135deg, #FF3F9D, #8057E8)' : 'transparent',
              color: cameraMode === mode.id ? '#fff' : 'var(--plum)',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* ── DISPENSING PROGRESS HUD ── */}
      <AnimatePresence>
        {isDispensing && !dispensedProduct && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'rgba(64, 32, 68, 0.92)',
              color: '#fff',
              padding: '24px 38px',
              borderRadius: 'var(--radius-xl)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.35)',
              backdropFilter: 'blur(20px)',
              textAlign: 'center',
              pointerEvents: 'auto',
              minWidth: 320,
              border: '1.5px solid rgba(255, 99, 183, 0.4)',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              style={{ display: 'inline-block', marginBottom: 14 }}
            >
              <RefreshCw size={32} color="#67DFF5" />
            </motion.div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 900, margin: '0 0 6px' }}>
              Vending Magic in Progress
            </h3>
            <p style={{ fontSize: 14, color: '#FFD86F', margin: 0 }}>
              {stepLabels[dispenseStep] || 'Preparing selected catalogue item…'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM DOCK: INTERACTIVE MACHINE CONTROLLER & REAL PRODUCT DOCK ── */}
      {selectedProduct && (
        <div
          style={{
            pointerEvents: 'auto',
            background: 'rgba(255, 252, 247, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: 'var(--radius-xl)',
            border: '1.5px solid rgba(255, 99, 183, 0.35)',
            padding: '16px 24px',
            boxShadow: '0 25px 60px rgba(64, 32, 68, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* Status LCD with real product information */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: isOutOfStock ? '#ef4444' : '#72E6B0',
                boxShadow: isOutOfStock ? '0 0 10px #ef4444' : '0 0 10px #72E6B0',
                flexShrink: 0,
              }}
            />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-light)', letterSpacing: '0.6px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                Chamber Bay #{selectedIndex + 1}
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-pill)',
                    background: isOutOfStock ? 'rgba(239,68,68,0.15)' : 'rgba(114,230,176,0.25)',
                    color: isOutOfStock ? '#dc2626' : '#059669',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  {isOutOfStock ? 'Out of Stock' : `In Stock (${selectedProduct.quantity} left)`}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 17, fontWeight: 900, color: 'var(--plum)' }}>
                {selectedProduct.name} — <span style={{ color: '#FF3F9D' }}>₹{selectedProduct.price}</span>
              </div>
            </div>
          </div>

          {/* Quick Chamber Selector Tabs for Real Products */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', overflowX: 'auto', padding: '4px 0' }}>
            {products.slice(0, 6).map((prod, idx) => (
              <button
                key={prod._id}
                onClick={() => onSelectProduct?.(idx)}
                disabled={isDispensing}
                title={`${prod.name} (₹${prod.price})`}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1.5px solid',
                  borderColor: selectedIndex === idx ? '#FF3F9D' : 'var(--card-border)',
                  background: selectedIndex === idx ? 'linear-gradient(135deg, #FF3F9D, #8057E8)' : '#fff',
                  color: selectedIndex === idx ? '#fff' : 'var(--plum)',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isDispensing ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  boxShadow: selectedIndex === idx ? '0 4px 12px rgba(255, 63, 157, 0.3)' : 'none',
                }}
              >
                #{idx + 1} {prod.name.length > 14 ? prod.name.slice(0, 12) + '…' : prod.name}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setJourneyOpen(true)}
              disabled={isDispensing || isOutOfStock}
              style={{
                padding: '12px 26px',
                borderRadius: 'var(--radius-pill)',
                background: isOutOfStock ? '#e5e7eb' : 'linear-gradient(135deg, #FF3F9D, #8057E8)',
                color: isOutOfStock ? '#9ca3af' : '#fff',
                border: 'none',
                fontFamily: 'var(--font-display)',
                fontWeight: 900,
                fontSize: 15,
                cursor: isDispensing || isOutOfStock ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: isOutOfStock ? 'none' : '0 8px 20px rgba(255, 63, 157, 0.35)',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => !isDispensing && !isOutOfStock && (e.currentTarget.style.transform = 'scale(1.03)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              <Sparkles size={18} />
              {isDispensing ? 'Vending in Action…' : isOutOfStock ? 'Out of Stock' : 'Get This Product'}
            </button>
          </div>
        </div>
      )}

      {/* ── 7-STEP GIFT DISPENSER & VOUCHER JOURNEY MODAL ── */}
      <GiftDispenserJourneyModal
        isOpen={journeyOpen}
        onClose={() => setJourneyOpen(false)}
        products={products}
        selectedIndex={selectedIndex}
        onSelectProduct={onSelectProduct}
        onStart3DDispense={onStartDispense}
        dispenseStep={dispenseStep}
        is3DDispensing={isDispensing}
      />

      {/* ── DISPENSED PRODUCT REVEAL MODAL (Uses Real Database Record) ── */}
      <AnimatePresence>
        {!journeyOpen && dispensedProduct && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(64, 32, 68, 0.72)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              zIndex: 100,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              pointerEvents: 'auto',
            }}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', damping: 20, stiffness: 260 }}
              style={{
                background: '#fff',
                borderRadius: '32px',
                padding: 'clamp(28px, 5vw, 40px)',
                width: '100%',
                maxWidth: 480,
                boxShadow: '0 30px 90px rgba(64, 32, 68, 0.4)',
                border: '1.5px solid rgba(255, 99, 183, 0.3)',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  background: 'linear-gradient(135deg, #FFD86F, #67DFF5)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 14px',
                  boxShadow: '0 8px 20px rgba(103, 223, 245, 0.4)',
                }}
              >
                <Sparkles size={28} color="#402044" />
              </div>

              <div style={{ fontSize: 12, fontWeight: 800, color: '#FF3F9D', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 6 }}>
                {t('vendingOverlay.unboxedTitle', 'Magical Toy Dispensed!')}
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 900, color: 'var(--plum)', margin: '0 0 8px' }}>
                {dispensedProduct.name}
              </h2>

              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                {dispensedProduct.description || 'Authentic handcrafted piece from our 4U Toys & Gifts boutique collection.'}
              </p>

              {/* Real Product Image Presentation */}
              <div
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: '20px',
                  background: 'linear-gradient(135deg, #FFF0F5, #F3E8FF)',
                  overflow: 'hidden',
                  marginBottom: 18,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255, 99, 183, 0.2)',
                }}
              >
                {dispensedProduct.images?.[0] ? (
                  <img
                    src={dispensedProduct.images[0]}
                    alt={dispensedProduct.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: 72 }}>🎁</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 10, marginBottom: 20 }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{t('shop.price', 'Price')}:</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: '#FF3F9D' }}>
                  ₹{(+dispensedProduct.price).toLocaleString('en-IN')}
                </span>
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-pill)',
                    background: dispensedProduct.quantity > 0 ? 'rgba(114,230,176,0.25)' : 'rgba(239,68,68,0.15)',
                    color: dispensedProduct.quantity > 0 ? '#059669' : '#dc2626',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {dispensedProduct.quantity > 0
                    ? `${t('shop.inStock', 'In Stock')} (${dispensedProduct.quantity})`
                    : t('shop.outOfStock', 'Out of Stock')}
                </span>
              </div>

              {/* Actions directly wired to real e-commerce functionality */}
              <div style={{ display: 'flex', gap: 10, flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={dispensedProduct.quantity <= 0}
                    onClick={() => handleAddToCart(dispensedProduct)}
                    style={{
                      flex: 1,
                      padding: '13px',
                      borderRadius: 'var(--radius-pill)',
                      background: addedSuccess ? '#72E6B0' : 'linear-gradient(135deg, #FF3F9D, #C9184A)',
                      color: addedSuccess ? '#064e3b' : '#fff',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: dispensedProduct.quantity <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 6px 18px rgba(255, 63, 157, 0.3)',
                    }}
                  >
                    {addedSuccess ? <CheckCircle size={18} /> : <ShoppingBag size={18} />}
                    {addedSuccess ? t('shop.added', 'Added!') : t('shop.addToCart', 'Add to Cart')}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    disabled={dispensedProduct.quantity <= 0}
                    onClick={() => handleBuyNow(dispensedProduct)}
                    style={{
                      flex: 1,
                      padding: '13px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'linear-gradient(135deg, #8057E8, #A78BFA)',
                      color: '#fff',
                      border: 'none',
                      fontFamily: 'var(--font-display)',
                      fontWeight: 800,
                      fontSize: 15,
                      cursor: dispensedProduct.quantity <= 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      boxShadow: '0 6px 18px rgba(128, 87, 232, 0.3)',
                    }}
                  >
                    <Zap size={18} /> {t('vendingOverlay.buyNow', 'Buy Now')}
                  </motion.button>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  {dispensedProduct._id && (
                    <button
                      onClick={() => navigate(`/product/${dispensedProduct._id}`)}
                      style={{
                        flex: 1,
                        padding: '11px',
                        borderRadius: 'var(--radius-pill)',
                        background: 'var(--blush)',
                        color: 'var(--plum)',
                        border: '1px solid var(--card-border)',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {t('vendingOverlay.viewItem', 'View Details')}
                    </button>
                  )}

                  <button
                    onClick={() => onResetDispense?.()}
                    style={{
                      flex: 1,
                      padding: '11px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: 'pointer',
                    }}
                  >
                    {t('vendingOverlay.dispenseAnother', 'Dispense Another')}
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

export default VendingMachineOverlay;

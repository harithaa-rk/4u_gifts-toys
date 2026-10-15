import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../utils/constants';
import VendingMachineScene from './VendingMachineScene';
import VendingMachineOverlay from './VendingMachineOverlay';
import { Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

const VendingMachineHero = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isDispensing, setIsDispensing] = useState(false);
  const [dispenseStep, setDispenseStep] = useState('');
  const [dispensedProduct, setDispensedProduct] = useState(null);
  const [cameraMode, setCameraMode] = useState('hero');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const containerRef = useRef(null);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebGLSupported(false);
    } catch {
      setWebGLSupported(false);
    }
  }, []);

  // Fetch Authoritative Products from Real Backend (Zero Sample Data)
  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE_URL}/products`);
      if (Array.isArray(res.data)) {
        // Filter active products
        const activeItems = res.data.filter((p) => p.status === 'active' || p.status === 'low_stock' || !p.status);
        setProducts(activeItems);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error('Failed to load products for 3D vending machine:', err);
      setError('Unable to connect to the product catalogue. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Track scroll position across the hero container
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const totalH = rect.height;
      const scrolled = Math.max(0, -rect.top);
      const progress = Math.min(1, scrolled / totalH);
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleStartDispense = () => {
    if (isDispensing || products.length === 0) return;
    const currentProd = products[selectedIndex];
    if (currentProd && currentProd.quantity <= 0) return;

    setIsDispensing(true);
    setDispenseStep('aligning');
    setDispensedProduct(null);
  };

  const handleDispenseComplete = (product) => {
    setIsDispensing(false);
    setDispenseStep('');
    setDispensedProduct(product || products[selectedIndex] || null);
  };

  const handleResetDispense = () => {
    setDispensedProduct(null);
    setIsDispensing(false);
    setDispenseStep('');
    setCameraMode('hero');
  };

  return (
    <section
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: 'clamp(780px, 98vh, 1080px)',
        minHeight: '750px',
        overflow: 'hidden',
        background: 'linear-gradient(180deg, #FFF0F7 0%, #FFF5F8 60%, #FFFFFF 100%)',
      }}
    >
      {/* ── 1. LOADING STATE ── */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #FFF0F7 0%, #F3E8FF 100%)',
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: '4px solid rgba(255, 63, 157, 0.2)',
              borderTopColor: '#FF3F9D',
              animation: 'spin 1s linear infinite',
              marginBottom: 20,
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--plum)', fontSize: 22, fontWeight: 900, margin: '0 0 6px' }}>
            Opening 4U Toys & Gifts Showroom…
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Connecting to authentic boutique catalogue
          </p>
        </div>
      )}

      {/* ── 2. ERROR STATE (Honest connection error with retry) ── */}
      {!loading && error && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #FFF0F5, #FFF)',
            zIndex: 20,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: '#fee2e2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <AlertCircle size={32} />
          </div>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--plum)', fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>
            Catalogue Connection Required
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 460, margin: '0 0 24px', lineHeight: 1.6 }}>
            {error}
          </p>
          <button
            onClick={fetchProducts}
            style={{
              padding: '12px 28px',
              borderRadius: 'var(--radius-pill)',
              background: 'linear-gradient(135deg, #FF3F9D, #8057E8)',
              color: '#fff',
              border: 'none',
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 15,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 8px 24px rgba(255, 63, 157, 0.35)',
            }}
          >
            <RefreshCw size={16} /> Retry Connection
          </button>
        </div>
      )}

      {/* ── 3. EMPTY CATALOGUE STATE ── */}
      {!loading && !error && products.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            zIndex: 20,
          }}
        >
          <span style={{ fontSize: 64, marginBottom: 16 }}>🧸</span>
          <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--plum)', fontSize: 24, fontWeight: 900, margin: '0 0 8px' }}>
            Catalogue Being Stocked
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 420 }}>
            Our magical toy shelves are currently being updated. Please check back shortly or explore our gift finder.
          </p>
        </div>
      )}

      {/* ── 4. 3D WEBGL VENDING MACHINE SCENE (Real Catalogue Data) ── */}
      {!loading && !error && products.length > 0 && webGLSupported && (
        <VendingMachineScene
          products={products}
          selectedIndex={selectedIndex}
          onSelectProduct={(idx) => setSelectedIndex(idx)}
          isDispensing={isDispensing}
          onDispenseStep={(step) => setDispenseStep(step)}
          onDispenseComplete={handleDispenseComplete}
          cameraMode={cameraMode}
          scrollProgress={scrollProgress}
        />
      )}

      {/* ── 5. ACCESSIBLE UI & E-COMMERCE CONTROLLER OVERLAY ── */}
      {!loading && !error && products.length > 0 && (
        <VendingMachineOverlay
          products={products}
          selectedIndex={selectedIndex}
          onSelectProduct={(idx) => setSelectedIndex(idx)}
          isDispensing={isDispensing}
          dispenseStep={dispenseStep}
          onStartDispense={handleStartDispense}
          dispensedProduct={dispensedProduct}
          onResetDispense={handleResetDispense}
          cameraMode={cameraMode}
          onCameraChange={(mode) => setCameraMode(mode)}
        />
      )}
    </section>
  );
};

export default VendingMachineHero;

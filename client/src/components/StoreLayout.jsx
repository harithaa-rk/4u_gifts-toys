import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './Navbar';
import CartDrawer from './CartDrawer';
import FloatingActions from './FloatingActions';

const ADMIN_EMAIL = "4u.toyshop.2026@gmail.com";
const ADMIN_PASSWORD = "A_4utoyshop";

const StoreLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [password, setPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  const handleAdminLogin = () => {
    setShowAdminModal(true);
    setPassword("");
    setAdminError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setShowAdminModal(false);
      setPassword("");
      setAdminError("");
      navigate("/admin/dashboard");
    } else {
      setAdminError("Incorrect password. Please try again.");
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflowX: 'hidden' }}>
      <Navbar onAdminClick={handleAdminLogin} />
      
      {/* Page Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          style={{ minHeight: 'calc(100vh - 80px)' }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <CartDrawer />
      <FloatingActions />

      {/* Admin Login Modal */}
      {showAdminModal && (
        <div className="admin-modal" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="admin-modal-content"
            style={{
              background: 'var(--card-bg, #fff)',
              padding: '40px',
              borderRadius: '24px',
              width: '90%',
              maxWidth: '400px',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid var(--border, #eee)',
            }}
          >
            <h2 style={{ margin: '0 0 10px', fontSize: '28px', color: 'var(--text)' }}>Admin Access 🔒</h2>
            <p style={{ color: 'var(--text-muted, #666)', marginBottom: '20px' }}>
              Email: <b>{ADMIN_EMAIL}</b>
            </p>
            
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                placeholder="Enter secret password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '16px',
                  margin: '20px 0',
                  border: '2px solid var(--border, #ccc)',
                  borderRadius: '12px',
                  background: 'var(--bg, #f9f9f9)',
                  color: 'var(--text, #333)',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
                autoFocus
              />
              
              {adminError && <div style={{ color: '#e63946', marginBottom: '15px', fontSize: '14px', fontWeight: 600 }}>{adminError}</div>}
              
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAdminModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--secondary, #eee)', color: 'var(--text)', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'var(--primary, #ff4d6d)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Login
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StoreLayout;

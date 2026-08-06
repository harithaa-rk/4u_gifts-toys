import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const OrderSuccessPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', padding: '20px', textAlign: 'center' }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      >
        <CheckCircle size={100} color="#4ade80" style={{ marginBottom: '20px' }} />
      </motion.div>
      <h1 style={{ fontSize: '36px', marginBottom: '10px', color: 'var(--text)' }}>Order Placed!</h1>
      <p style={{ fontSize: '18px', color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '40px' }}>
        Thank you for shopping with 4U Toys. Your magical order is being processed and will be on its way soon!
      </p>
      <div style={{ display: 'flex', gap: '15px' }}>
        <button
          onClick={() => navigate('/orders')}
          style={{ padding: '14px 28px', background: 'var(--card-bg)', color: 'var(--text)', border: '2px solid var(--border)', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          View Orders
        </button>
        <button
          onClick={() => navigate('/shop')}
          className="btn-primary"
          style={{ padding: '14px 28px', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderSuccessPage;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, Search, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '../utils/constants';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const { data } = await axios.get(`${API_BASE_URL}/orders/my`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(data);
      } catch (err) {
        console.error("Failed to fetch orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [navigate]);

  const filteredOrders = orders.filter(o => {
    const q = search.toLowerCase();
    const matchesId = o._id.toLowerCase().includes(q);
    const matchesProduct = o.products.some(p => (p.productId?.name || "").toLowerCase().includes(q));
    return !q || matchesId || matchesProduct;
  });

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Pending': return <Clock size={16} />;
      case 'Processing': return <Package size={16} />;
      case 'Shipped': return <Truck size={16} />;
      case 'Delivered': return <CheckCircle size={16} />;
      default: return <XCircle size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending': return { bg: '#fff8e1', text: '#f57f17' };
      case 'Processing': return { bg: '#e3f2fd', text: '#1976d2' };
      case 'Shipped': return { bg: '#f3e5f5', text: '#7b1fa2' };
      case 'Delivered': return { bg: '#e8f5e9', text: '#2e7d32' };
      default: return { bg: '#ffebee', text: '#c62828' };
    }
  };

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, ease: "linear", duration: 1.5 }}>
        <Package size={40} color="var(--primary)" />
      </motion.div>
    </div>
  );

  const containerVars = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVars = { hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '120px 20px 80px', minHeight: '80vh' }}>
      
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', gap: '20px' }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: 0, fontSize: '32px', color: 'var(--text)' }}>
          <Package size={36} color="var(--primary)" /> Magical Orders
        </h1>
        
        <div style={{ position: 'relative', minWidth: '300px' }}>
          <Search size={20} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Search by Order ID or Product..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '30px', border: '2px solid var(--border)', background: 'var(--card-bg, rgba(255,255,255,0.7))', backdropFilter: 'blur(10px)', fontSize: '15px', color: 'var(--text)', outline: 'none', transition: 'border-color 0.3s' }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
          />
        </div>
      </motion.div>
      
      {filteredOrders.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center', padding: '80px 20px', background: 'var(--card-bg, rgba(255,255,255,0.6))', backdropFilter: 'blur(20px)', borderRadius: '30px', border: '1px solid var(--border)', boxShadow: '0 20px 50px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>🛍️</div>
          <h2 style={{ color: 'var(--text)', marginBottom: '10px' }}>No orders found</h2>
          <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '30px' }}>
            {search ? "We couldn't find any orders matching your search." : "You haven't placed any magical orders yet."}
          </p>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/shop')} 
            className="btn-primary"
            style={{ padding: '14px 32px', borderRadius: '30px', fontSize: '16px', fontWeight: 800, border: 'none', cursor: 'pointer' }}
          >
            Start Shopping
          </motion.button>
        </motion.div>
      ) : (
        <motion.div variants={containerVars} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          {filteredOrders.map((order) => {
            const statusColors = getStatusColor(order.status);
            return (
              <motion.div 
                variants={itemVars} 
                key={order._id} 
                style={{ background: 'var(--card-bg, rgba(255,255,255,0.8))', backdropFilter: 'blur(20px)', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 10px 40px rgba(0,0,0,0.04)', transition: 'transform 0.3s', position: 'relative', overflow: 'hidden' }}
                whileHover={{ y: -4, boxShadow: '0 15px 50px rgba(0,0,0,0.08)' }}
              >
                {/* Top Highlight Bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: `linear-gradient(90deg, var(--primary), ${statusColors.text})` }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px dashed var(--border)', paddingBottom: '20px', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Order ID</div>
                    <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '16px', color: 'var(--text)' }}>#{order._id.slice(-8).toUpperCase()}</div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Date Placed</div>
                    <div style={{ fontWeight: 700, color: 'var(--text)' }}>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: statusColors.bg, color: statusColors.text, padding: '6px 12px', borderRadius: '20px', fontWeight: 800, fontSize: '13px' }}>
                      {getStatusIcon(order.status)} {order.status}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'flex-end', flex: '1 1 100px' }}>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount</div>
                    <div style={{ fontWeight: 800, fontSize: '22px', color: 'var(--primary)' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                  {order.products.map((item, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'var(--bg)', padding: '15px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                      <div style={{ position: 'relative' }}>
                        <img src={item.productId?.images?.[0] || 'https://placehold.co/60x60?text=🎁'} alt="product" style={{ width: '65px', height: '65px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }} />
                        <div style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--primary)', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, border: '2px solid #fff' }}>
                          {item.quantity}
                        </div>
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '15px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.productId?.name || 'Magical Product'}
                        </div>
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Qty: {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

export default OrdersPage;

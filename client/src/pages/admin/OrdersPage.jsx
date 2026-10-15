import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, Search, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../utils/constants';
import LanguageSelector from '../../components/LanguageSelector';

const AdminOrdersPage = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }
        const { data } = await axios.get(`${API_BASE_URL}/orders/admin?page=${page}&limit=10`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(data.orders);
        setTotalPages(data.totalPages);
      } catch (err) {
        console.error("Failed to fetch admin orders", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [page, navigate]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: 'var(--plum)' }}>
      {t('common.loading', 'Loading orders...')}
    </div>
  );

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: 16 }}>
        <h1 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '15px', fontSize: 24, fontWeight: 900, color: 'var(--plum)' }}>
          <Package size={30} color="var(--primary)" /> {t('admin.orders', 'All Orders')}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <LanguageSelector variant="compact" />
          <Link to="/admin/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, background: '#f5f2ef', color: '#333', fontSize: 13, fontWeight: 700 }}>
            <ArrowLeft size={14} /> {t('admin.dashboard', 'Dashboard')}
          </Link>
        </div>
      </div>
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>{t('orders.noOrdersTitle', 'No orders found.')}</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg)' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>{t('orders.orderId', 'Order ID')}</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Customer</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>{t('orders.date', 'Date')}</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>{t('orders.total', 'Total')}</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Payment Info</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>Payment Status</th>
                  <th style={{ padding: '16px 20px', fontWeight: 700 }}>{t('orders.status', 'Delivery Status')}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const method = order.paymentMethod?.toLowerCase() || 'card';
                  const methodLabel = method === 'gpay' ? '🟢 Google Pay' : method === 'bank_transfer' ? '🏦 Bank Transfer' : method === 'cod' ? '📦 Cash on Delivery' : '💳 Card';
                  const utr = order.paymentDetails?.utrNumber;

                  return (
                    <tr key={order._id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '13px' }}>{order._id}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 600 }}>{order.userId?.name || 'Customer'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.userId?.email || ''}</div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '16px 20px', fontWeight: 'bold', color: 'var(--primary)' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                      
                      {/* Payment Method & UTR */}
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{methodLabel}</div>
                        {utr ? (
                          <div style={{ fontSize: '12px', color: '#1d4ed8', background: '#eff6ff', padding: '2px 6px', borderRadius: '6px', marginTop: '4px', display: 'inline-block', fontFamily: 'monospace' }}>
                            UTR: {utr}
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>No UTR</div>
                        )}
                      </td>

                      {/* Payment Status Dropdown / Badge */}
                      <td style={{ padding: '16px 20px' }}>
                        <select
                          value={order.paymentStatus || 'Pending'}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            try {
                              const token = localStorage.getItem('token');
                              await axios.put(`${API_BASE_URL}/orders/admin/${order._id}/payment`, { paymentStatus: newStatus }, {
                                headers: { Authorization: `Bearer ${token}` }
                              });
                              setOrders(prev => prev.map(o => o._id === order._id ? { ...o, paymentStatus: newStatus } : o));
                            } catch (err) {
                              alert('Failed to update payment status');
                            }
                          }}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1.5px solid var(--border)',
                            background: order.paymentStatus === 'Paid' ? '#dcfce7' : '#fef3c7',
                            color: order.paymentStatus === 'Paid' ? '#15803d' : '#b45309',
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="Paid">✓ Paid</option>
                          <option value="Pending">⏳ Pending</option>
                          <option value="Failed">✗ Failed</option>
                          <option value="Refunded">↩ Refunded</option>
                        </select>
                      </td>

                      {/* Order Delivery Status */}
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ 
                          padding: '6px 12px', 
                          borderRadius: '20px', 
                          fontSize: '12px', 
                          fontWeight: 700,
                          background: order.status === 'Pending' ? '#fef3c7' : '#dcfce7',
                          color: order.status === 'Pending' ? '#d97706' : '#15803d'
                        }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px', alignItems: 'center' }}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 700 }}
            >
              {t('common.back', 'Previous')}
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 700, color: 'var(--plum)' }}>
              Page {page} of {totalPages}
            </span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 700 }}
            >
              {t('common.next', 'Next')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrdersPage;

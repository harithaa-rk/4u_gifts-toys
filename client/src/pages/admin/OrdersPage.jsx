import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Package, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../utils/constants';

const AdminOrdersPage = () => {
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

  if (loading) return <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading orders...</div>;

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Package size={32} color="var(--primary)" /> All Orders
      </h1>
      
      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--card-bg)', borderRadius: '24px', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '18px', color: 'var(--text-muted)' }}>No orders found.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto', background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg)' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Order ID</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Date</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Total</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace' }}>{order._id}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ fontWeight: 600 }}>{order.userId?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{order.userId?.email || ''}</div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '16px 20px', fontWeight: 'bold', color: 'var(--primary)' }}>₹{order.totalAmount?.toLocaleString('en-IN')}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ 
                        padding: '6px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: 600,
                        background: order.status === 'Pending' ? '#fef3c7' : '#dcfce7',
                        color: order.status === 'Pending' ? '#d97706' : '#15803d'
                      }}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '30px' }}>
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}
            >
              Previous
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrdersPage;

// frontend/src/pages/MyFoodOrders.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const STATUS_STYLES = {
  Pending:   { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', icon: '⏳' },
  Confirmed: { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e', icon: '✅' },
  Delivered: { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc', icon: '🎉' },
  Cancelled: { bg: 'rgba(239,68,68,0.15)',  color: '#f87171', icon: '❌' },
};

const MyFoodOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get(`${API}/food/orders/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>📦 My Food Orders</h1>
        <Link to="/food-shop" style={{ marginLeft: 'auto', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e', borderRadius: 10, padding: '0.4rem 1rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
          🛒 Shop More
        </Link>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>Loading orders…</div>}

      {!loading && orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.03)', borderRadius: 18, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <p style={{ color: 'rgba(255,255,255,0.4)' }}>No orders yet. <Link to="/food-shop" style={{ color: '#a5b4fc' }}>Shop now →</Link></p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {orders.map(order => {
          const s = STATUS_STYLES[order.status] || STATUS_STYLES.Pending;
          return (
            <div key={order.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ margin: '0 0 0.3rem', color: '#fff', fontSize: '1rem', fontWeight: 700 }}>
                  🛍️ {order.product_name}
                </h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem' }}>
                  Qty: {order.quantity} · ₹{order.total_price.toLocaleString('en-IN')}
                </p>
                <p style={{ margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
                  📍 {order.delivery_address}
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {s.icon} {order.status}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.76rem' }}>
                  {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyFoodOrders;

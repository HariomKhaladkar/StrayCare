// frontend/src/components/AdminFoodOrders.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const STATUSES = ['Pending', 'Confirmed', 'Delivered', 'Cancelled'];
const STATUS_STYLES = {
  Pending:   { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  Confirmed: { bg: 'rgba(34,197,94,0.15)',  color: '#22c55e' },
  Delivered: { bg: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
  Cancelled: { bg: 'rgba(239,68,68,0.15)',  color: '#f87171' },
};

const AdminFoodOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');

  const token = localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${API}/admin/food/orders`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setOrders(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      await axios.put(`${API}/admin/food/orders/${orderId}/status`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) { alert('Failed to update status'); }
    finally { setUpdating(null); }
  };

  const filtered = filterStatus === 'All' ? orders : orders.filter(o => o.status === filterStatus);

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: orders.filter(o => o.status === s).length }), {});

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1.5rem' }}>
      <h1 style={{ color: '#fff', fontWeight: 800, marginBottom: '0.5rem' }}>🛒 Food Order Management</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>Manage and update food order delivery status.</p>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {[['All', orders.length, '#6366f1'], ...STATUSES.map(s => [s, counts[s] || 0, STATUS_STYLES[s]?.color || '#fff'])].map(([label, count, color]) => (
          <button key={label} onClick={() => setFilterStatus(label)} style={{
            background: filterStatus === label ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${filterStatus === label ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
            borderRadius: 12, padding: '0.6rem 1rem', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 90,
          }}>
            <span style={{ color: typeof color === 'string' ? color : '#fff', fontWeight: 800, fontSize: '1.3rem' }}>{count}</span>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.76rem', marginTop: 2 }}>{label}</span>
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>Loading orders…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.35)' }}>
          No {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} orders found.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
        {filtered.map(order => {
          const s = STATUS_STYLES[order.status] || STATUS_STYLES.Pending;
          return (
            <div key={order.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '1.1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>#{order.id}</span>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '0.95rem', fontWeight: 700 }}>{order.product_name}</h3>
                </div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                  👤 {order.buyer_name} · {order.buyer_email}
                  {order.buyer_phone && ` · 📱 ${order.buyer_phone}`}
                </p>
                <p style={{ margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>
                  📍 {order.delivery_address}
                </p>
                <p style={{ margin: '0.3rem 0 0', color: 'rgba(255,255,255,0.35)', fontSize: '0.76rem' }}>
                  Qty: {order.quantity} · ₹{order.total_price.toLocaleString('en-IN')} ·{' '}
                  {order.ordered_at ? new Date(order.ordered_at).toLocaleDateString('en-IN') : '—'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700 }}>
                  {order.status}
                </span>
                <select
                  value={order.status}
                  disabled={updating === order.id}
                  onChange={e => updateStatus(order.id, e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff', borderRadius: 8, padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem',
                  }}
                >
                  {STATUSES.map(s => <option key={s} value={s} style={{ background: '#1e1b4b' }}>{s}</option>)}
                </select>
                {updating === order.id && <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>Updating…</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminFoodOrders;

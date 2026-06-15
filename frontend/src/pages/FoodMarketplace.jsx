// frontend/src/pages/FoodMarketplace.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { usePlatform } from '../hooks/usePlatform';
import API_BASE_URL from '../api';

const API = API_BASE_URL;
const CATEGORIES = ['All', 'Dry Food', 'Wet Food', 'Treats', 'Supplements'];
const CAT_ICONS = { 'Dry Food': '🌾', 'Wet Food': '🥩', 'Treats': '🦴', 'Supplements': '💊' };

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
  padding: '0.5rem 0.75rem', color: '#fff', fontSize: '0.88rem', boxSizing: 'border-box',
};

const FoodMarketplace = () => {
  const { isMobile } = usePlatform();
  const [products, setProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: '', quantity: 1 });
  const [ordering, setOrdering] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');

  useEffect(() => {
    axios.get(`${API}/food/products`).then(r => setProducts(r.data)).catch(() => {}).finally(() => setLoading(false));
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (user) setForm(prev => ({ ...prev, name: user.name || '', email: user.email || '' }));
  }, []);

  const filtered = activeCategory === 'All' ? products : products.filter(p => p.category === activeCategory);
  const cartItems = Object.entries(cart).map(([id, qty]) => ({ product: products.find(p => p.id === parseInt(id)), qty })).filter(i => i.product && i.qty > 0);
  const cartTotal = cartItems.reduce((sum, i) => sum + i.product.price * i.qty, 0);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const addToCart = (product) => setCart(prev => ({ ...prev, [product.id]: (prev[product.id] || 0) + 1 }));
  const updateQty = (id, delta) => setCart(prev => {
    const next = (prev[id] || 0) + delta;
    if (next <= 0) { const { [id]: _, ...rest } = prev; return rest; }
    return { ...prev, [id]: next };
  });

  const openCheckout = (product) => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setCheckoutProduct(product);
    setForm(prev => ({ ...prev, quantity: cart[product.id] || 1 }));
    setSuccess(null); setError('');
  };

  const handleOrder = async (e) => {
    e.preventDefault();
    if (!checkoutProduct) return;
    setOrdering(true); setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/food/order`, {
        product_id: checkoutProduct.id, quantity: form.quantity,
        buyer_name: form.name, buyer_email: form.email,
        buyer_phone: form.phone, delivery_address: form.address,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccess(`🎉 Order placed for "${checkoutProduct.name}"!`);
      setCart(prev => { const { [checkoutProduct.id]: _, ...rest } = prev; return rest; });
      setTimeout(() => { setCheckoutProduct(null); setSuccess(null); }, 4000);
    } catch (err) { setError(err.response?.data?.detail || 'Order failed.'); }
    finally { setOrdering(false); }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: isMobile ? '1rem' : '2rem 1.5rem', paddingBottom: isMobile ? '6rem' : '2rem' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: 'clamp(1.8rem,5vw,2.8rem)', fontWeight: 800, background: 'linear-gradient(135deg,#22c55e,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: '0.5rem' }}>🛒 Animal Food Shop</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '1rem' }}>Quality food for stray animals. Every purchase supports the community.</p>
        {!isMobile && (
          <Link to="/my-food-orders" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 10, padding: '0.4rem 1rem', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>📦 My Orders</Link>
        )}
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.75rem', justifyContent: 'center' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{ background: activeCategory === cat ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.05)', border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.1)', color: activeCategory === cat ? '#fff' : 'rgba(255,255,255,0.6)', borderRadius: 999, padding: '0.4rem 1.1rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
            {CAT_ICONS[cat] || '🛒'} {cat}
          </button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>Loading products…</div>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🛒</div>
          <p style={{ margin: 0 }}>No products found in this category.</p>
        </div>
      )}

      {/* Product Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '1rem' }}>
        {filtered.map(product => {
          const inCart = cart[product.id] || 0;
          return (
            <div key={product.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.3)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <div style={{ position: 'relative', height: 180 }}>
                <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(0,0,0,0.65)', color: '#fff', borderRadius: 999, padding: '3px 9px', fontSize: '0.72rem', fontWeight: 700 }}>{CAT_ICONS[product.category] || ''} {product.category}</span>
                {inCart > 0 && <span style={{ position: 'absolute', top: 10, right: 10, background: '#6366f1', color: '#fff', borderRadius: 999, padding: '3px 9px', fontSize: '0.72rem', fontWeight: 700 }}>🛒 ×{inCart}</span>}
              </div>
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '0.92rem', fontWeight: 700 }}>{product.name}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.48)', fontSize: '0.78rem', flex: 1 }}>{product.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#22c55e', fontWeight: 800, fontSize: '1rem' }}>₹{product.price.toLocaleString('en-IN')}</span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>{product.stock} left</span>
                </div>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.28)', fontSize: '0.72rem' }}>by {product.seller_name}</p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <button onClick={() => addToCart(product)} style={{ flex: 1, background: 'rgba(99,102,241,0.18)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 9, padding: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>+ Cart</button>
                  <button onClick={() => openCheckout(product)} style={{ flex: 1, background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', borderRadius: 9, padding: '0.4rem', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>Buy Now</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)} style={{ position: 'fixed', bottom: 90, right: 24, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 999, padding: '0.75rem 1.5rem', cursor: 'pointer', fontWeight: 700, boxShadow: '0 8px 30px rgba(99,102,241,0.5)', zIndex: 1000, fontSize: '0.9rem' }}>
          🛒 Cart ({cartCount}) · ₹{cartTotal.toLocaleString('en-IN')}
        </button>
      )}

      {/* Cart Sidebar */}
      {cartOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }} onClick={() => setCartOpen(false)}>
          <div style={{ width: 360, background: 'rgba(15,10,30,0.98)', height: '100%', padding: '1.5rem', overflowY: 'auto', borderLeft: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>🛒 Your Cart</h2>
              <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            {cartItems.length === 0 ? <p style={{ color: 'rgba(255,255,255,0.3)' }}>Cart is empty.</p> : (
              <>
                {cartItems.map(({ product, qty }) => (
                  <div key={product.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                    <img src={product.image_url} alt={product.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{product.name}</p>
                      <p style={{ margin: 0, color: '#22c55e', fontSize: '0.82rem' }}>₹{(product.price * qty).toLocaleString('en-IN')}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button onClick={() => updateQty(product.id, -1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'none', color: '#fff', cursor: 'pointer' }}>−</button>
                      <span style={{ color: '#fff', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{qty}</span>
                      <button onClick={() => updateQty(product.id, 1)} style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.2)', background: 'none', color: '#fff', cursor: 'pointer' }}>+</button>
                    </div>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 700, marginBottom: '1rem' }}>
                    <span>Total:</span><span style={{ color: '#22c55e' }}>₹{cartTotal.toLocaleString('en-IN')}</span>
                  </div>
                  {cartItems.map(({ product }) => (
                    <button key={product.id} onClick={() => { setCartOpen(false); openCheckout(product); }} style={{ width: '100%', background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', borderRadius: 10, padding: '0.6rem', cursor: 'pointer', fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                      Checkout: {product.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutProduct && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '1rem' }} onClick={() => setCheckoutProduct(null)}>
          <div style={{ background: 'rgba(15,10,30,0.99)', borderRadius: 20, border: '1px solid rgba(99,102,241,0.25)', padding: '2rem', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ margin: 0, color: '#fff', fontSize: '1.1rem' }}>Order: {checkoutProduct.name}</h2>
              <button onClick={() => setCheckoutProduct(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>
            {success ? (
              <div style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 12, padding: '1.25rem', color: '#22c55e', textAlign: 'center', fontWeight: 600 }}>{success}</div>
            ) : (
              <form onSubmit={handleOrder} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[['name','Full Name *','text',true],['email','Email *','email',true],['phone','Phone','tel',false],['address','Delivery Address *','text',true]].map(([key, label, type, req]) => (
                  <div key={key}>
                    <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>{label}</label>
                    {key === 'address' ? (
                      <textarea rows={2} required={req} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
                    ) : (
                      <input type={type} required={req} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} style={inputStyle} />
                    )}
                  </div>
                ))}
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', display: 'block', marginBottom: '0.3rem' }}>Quantity *</label>
                  <input type="number" min="1" max={checkoutProduct.stock} required value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: parseInt(e.target.value) || 1 }))} style={inputStyle} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(34,197,94,0.08)', borderRadius: 10 }}>
                  <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>Total:</span>
                  <span style={{ color: '#22c55e', fontWeight: 800, fontSize: '1rem' }}>₹{((checkoutProduct.price || 0) * (form.quantity || 1)).toLocaleString('en-IN')}</span>
                </div>
                {error && <div style={{ background: 'rgba(239,68,68,0.12)', borderRadius: 8, padding: '0.6rem', color: '#f87171', fontSize: '0.85rem' }}>{error}</div>}
                <button type="submit" disabled={ordering} style={{ background: ordering ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', color: '#fff', borderRadius: 12, padding: '0.75rem', cursor: ordering ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.95rem' }}>
                  {ordering ? 'Placing Order…' : '✅ Place Order'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FoodMarketplace;

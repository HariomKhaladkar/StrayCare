// frontend/src/components/NotificationBell.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const TYPE_ICONS = {
  new_case:      '🚨',
  case_accepted: '✅',
  case_rejected: '❌',
  case_update:   '📋',
  info:          'ℹ️',
};

const POLL_INTERVAL_MS = 30000; // 30 seconds

const NotificationBell = ({ role }) => {
  // role: "user" | "ngo"
  const [data, setData]       = useState({ unread_count: 0, notifications: [] });
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef           = useRef(null);
  const navigate              = useNavigate();

  const endpoint = role === 'ngo' ? '/ngo/notifications/me' : '/notifications/me';
  const readEndpoint = role === 'ngo' ? '/ngo/notifications/read' : '/notifications/read';
  const tokenKey = role === 'ngo' ? 'ngo_token' : 'token';

  const fetchNotifications = useCallback(() => {
    const token = localStorage.getItem(tokenKey);
    if (!token) return;
    axios.get(`${API}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => setData(r.data)).catch(() => {});
  }, [endpoint, tokenKey]);

  // Poll on mount and every 30s
  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen(prev => !prev);
    // Mark as read when opening
    if (!open && data.unread_count > 0) {
      const token = localStorage.getItem(tokenKey);
      axios.put(`${API}${readEndpoint}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(() => setData(prev => ({
        ...prev,
        unread_count: 0,
        notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
      }))).catch(() => {});
    }
  };

  const handleNotifClick = (notif) => {
    setOpen(false);
    if (notif.case_id) {
      navigate(`/cases/${notif.case_id}`);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        title="Notifications"
        style={{
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '50%',
          width: 38, height: 38,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', position: 'relative',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
      >
        🔔
        {data.unread_count > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#ef4444', color: '#fff',
            borderRadius: '50%', minWidth: 18, height: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.65rem', fontWeight: 800, padding: '0 3px',
            border: '2px solid #0f0b1e',
          }}>
            {data.unread_count > 9 ? '9+' : data.unread_count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'fixed',
          top: 'auto',
          right: 8,
          left: 8,
          marginTop: 8,
          maxHeight: 'calc(100dvh - 160px)',
          background: 'rgba(15, 10, 30, 0.97)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          zIndex: 9999,
          backdropFilter: 'blur(16px)',
        }}>
          {/* Header */}
          <div style={{
            padding: '0.9rem 1.1rem',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              🔔 Notifications
            </span>
            {data.notifications.length > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>
                {data.notifications.length} total
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', maxHeight: 360 }}>
            {data.notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔕</div>
                No notifications yet
              </div>
            ) : (
              data.notifications.map(notif => (
                <div
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  style={{
                    padding: '0.75rem 1.1rem',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    cursor: notif.case_id ? 'pointer' : 'default',
                    background: notif.is_read ? 'transparent' : 'rgba(99,102,241,0.08)',
                    transition: 'background 0.15s',
                    display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
                  }}
                  onMouseEnter={e => { if (notif.case_id) e.currentTarget.style.background = 'rgba(99,102,241,0.15)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = notif.is_read ? 'transparent' : 'rgba(99,102,241,0.08)'; }}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 2 }}>
                    {TYPE_ICONS[notif.type] || '🔔'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      margin: 0, color: notif.is_read ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.85)',
                      fontSize: '0.82rem', lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}>
                      {notif.message}
                    </p>
                    {notif.created_at && (
                      <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.72rem' }}>
                        {new Date(notif.created_at).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  {!notif.is_read && (
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%', background: '#6366f1',
                      flexShrink: 0, marginTop: 6,
                    }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

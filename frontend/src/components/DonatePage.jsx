import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import styles from "./DonatePage.module.css";
import { usePlatform } from "../hooks/usePlatform";

// ── Load Razorpay SDK ──────────────────────────────
const loadRazorpay = () =>
  new Promise((resolve) => {
    if (document.getElementById("rz-sdk")) return resolve(true);
    const s = document.createElement("script");
    s.id = "rz-sdk";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });

const API = process.env.REACT_APP_API_BASE_URL || "";
const QUICK_AMOUNTS = [100, 250, 500, 1000];

// ── Build a UPI deep-link URL ──────────────────────
const buildUpiLink = (upiId, name, amount, note = "StrayCare Donation") => {
  const pa = encodeURIComponent(upiId);
  const pn = encodeURIComponent(name);
  const am = encodeURIComponent(amount || "0");
  const tn = encodeURIComponent(note);
  return `upi://pay?pa=${pa}&pn=${pn}&am=${am}&cu=INR&tn=${tn}`;
};

// ── QR code URL via Google Charts API (no API key needed) ──
const buildQrUrl = (data, size = 140) =>
  `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encodeURIComponent(data)}&choe=UTF-8`;


// ── NGO Card ──────────────────────────────────────
const NGOCard = ({ ngo, onToast }) => {
  const { isMobile } = usePlatform();
  const [amount, setAmount] = useState("");
  const [showQr, setShowQr] = useState(false);

  const parsedAmount = parseFloat(amount);
  const validAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  // ── Razorpay (UPI mode) ──
  const handleRazorpayUpi = useCallback(async () => {
    if (!validAmount) { alert("Please enter a valid donation amount."); return; }
    const loaded = await loadRazorpay();
    if (!loaded) { alert("Razorpay SDK failed to load. Please check your internet connection."); return; }

    try {
      const { data } = await axios.post(`${API}/donations/create-order`, {
        amount: parsedAmount,
        ngo_id: ngo.id,
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "StrayCare",
        description: `Donation to ${ngo.name}`,
        order_id: data.order_id,
        // Note: Razorpay's display config blocks (UPI-only mode) requires a
        // paid plan. We open standard checkout — UPI is always available there.
        handler: async (response) => {
          try {
            await axios.post(`${API}/donations/verify`, {
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            onToast(`🎉 ₹${parsedAmount} donated to ${ngo.name}! Thank you ❤️`);
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {},
        theme: { color: "#059669" },
      };

      new window.Razorpay(options).open();
    } catch (err) {
      console.error("Donation Error:", err);
      const detail = err?.response?.data?.detail || err?.message || "Unknown error";
      const status = err?.response?.status || "Network Error";
      alert(`Payment order failed [${status}]: ${detail}`);
    }
  }, [validAmount, parsedAmount, ngo, onToast]);

  // ── Razorpay (all methods) ──
  const handleRazorpayCard = useCallback(async () => {
    if (!validAmount) { alert("Please enter a valid donation amount."); return; }
    const loaded = await loadRazorpay();
    if (!loaded) { alert("Razorpay SDK failed to load."); return; }

    try {
      const { data } = await axios.post(`${API}/donations/create-order`, {
        amount: parsedAmount,
        ngo_id: ngo.id,
      });

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "StrayCare",
        description: `Donation to ${ngo.name}`,
        order_id: data.order_id,
        handler: async (response) => {
          try {
            await axios.post(`${API}/donations/verify`, {
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            onToast(`🎉 ₹${parsedAmount} donated to ${ngo.name}! Thank you ❤️`);
          } catch {
            alert("Payment verification failed. Please contact support.");
          }
        },
        prefill: {},
        theme: { color: "#6366f1" },
      };
      new window.Razorpay(options).open();
    } catch (err) {
      console.error("Donation Error:", err);
      const detail = err?.response?.data?.detail || err?.message || "Unknown error";
      const status = err?.response?.status || "Network Error";
      alert(`Payment order failed [${status}]: ${detail}`);
    }
  }, [validAmount, parsedAmount, ngo, onToast]);

  // ── Direct UPI deep-link ──
  const handleDirectUpi = useCallback(() => {
    if (!validAmount) { alert("Please enter a valid donation amount."); return; }
    const link = buildUpiLink(ngo.upi_id, ngo.name, parsedAmount);
    window.location.href = link;
    setTimeout(() => setShowQr(true), 800); // show QR as fallback after 800ms
  }, [validAmount, parsedAmount, ngo]);

  // ── QR toggle without deeplink (non-mobile) ──
  const handleShowQr = () => {
    if (!validAmount) { alert("Please enter a valid donation amount first."); return; }
    setShowQr((prev) => !prev);
  };

  const emojiForNgo = (name) => {
    const n = name.toLowerCase();
    if (n.includes("rescue")) return "🐕";
    if (n.includes("cat") || n.includes("feline")) return "🐱";
    if (n.includes("bird") || n.includes("aves")) return "🦜";
    return "🏥";
  };

  return (
    <div className={styles.card}>
      {/* Header */}
      <div className={styles.cardHeader}>
        <div className={styles.avatarRing}>
          {emojiForNgo(ngo.name)}
        </div>
        <div>
          <p className={styles.ngoName}>{ngo.name}</p>
          <p className={styles.ngoEmail}>{ngo.email}</p>
        </div>
      </div>

      {/* 30-day donations */}
      <div className={styles.statsRow}>
        <span className={styles.statsLabel}>💚 Raised (last 30 days)</span>
        <span className={styles.statsAmount}>₹{(ngo.total_donations_last_30_days || 0).toLocaleString("en-IN")}</span>
      </div>

      {/* Amount input */}
      <div className={styles.amountRow}>
        <span className={styles.currencyLabel}>₹</span>
        <input
          className={styles.amountInput}
          type="number"
          min="1"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setShowQr(false); }}
        />
      </div>

      {/* Quick-pick amounts */}
      <div className={styles.quickAmounts}>
        {QUICK_AMOUNTS.map((q) => (
          <button
            key={q}
            className={`${styles.quickBtn} ${amount === String(q) ? styles.active : ""}`}
            onClick={() => { setAmount(String(q)); setShowQr(false); }}
          >
            ₹{q}
          </button>
        ))}
      </div>

      {/* Action buttons */}
      <div className={styles.buttons}>
        <button className={styles.btnUpi} onClick={handleRazorpayUpi}>
          📱 Donate via UPI (Razorpay)
        </button>

        {ngo.upi_id && (
          <button className={styles.btnDirectUpi} onClick={handleDirectUpi}>
            ⚡ Pay Direct UPI ({ngo.upi_id})
          </button>
        )}

        <button className={styles.btnCard} onClick={handleRazorpayCard}>
          💳 Card / Net Banking / Wallet
        </button>

        {ngo.upi_id && !isMobile && (
          <button className={styles.btnDirectUpi} onClick={handleShowQr} style={{ opacity: 0.8 }}>
            {showQr ? "🔼 Hide QR Code" : "📷 Scan QR to Pay"}
          </button>
        )}
      </div>

      {/* QR Code section */}
      {showQr && ngo.upi_id && (
        <div className={styles.qrSection}>
          <div className={styles.qrBox}>
            <img
              src={buildQrUrl(buildUpiLink(ngo.upi_id, ngo.name, parsedAmount || 0))}
              alt={`UPI QR for ${ngo.name}`}
            />
          </div>
          <p className={styles.qrCaption}>Scan with any UPI app &nbsp;·&nbsp; GPay, PhonePe, BHIM</p>
          <div className={styles.upiIdBadge}>{ngo.upi_id}</div>
        </div>
      )}
    </div>
  );
};


// ── Main Page ─────────────────────────────────────
const DonatePage = () => {
  const { isMobile } = usePlatform();
  const [ngos, setNgos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/donations/ngos`)
      .then((res) => setNgos(res.data))
      .catch((err) => { console.error("NGO fetch error:", err); setNgos([]); })
      .finally(() => setLoading(false));
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }, []);

  return (
    <div className={styles.page} style={{ minHeight: isMobile ? 'auto' : '100vh', padding: isMobile ? '1.5rem 1rem 6rem' : '3rem 1.5rem 5rem' }}>
      {/* Hero */}
      <div className={styles.hero} style={{ marginBottom: isMobile ? '1.5rem' : '3rem' }}>
        <span className={styles.heroIcon}>🐾</span>
        <h1 className={styles.heroTitle}>Support Our Partner NGOs</h1>
        <p className={styles.heroSubtitle}>
          Every contribution helps rescue, heal, and rehome stray animals across India.
        </p>
      </div>

      {/* NGO grid */}
      {loading ? (
        <p className={styles.empty}><span>⏳</span>Loading NGOs...</p>
      ) : ngos.length === 0 ? (
        <p className={styles.empty}><span>🔍</span>No verified NGOs found yet.</p>
      ) : (
        <div className={styles.grid}>
          {ngos.map((ngo) => (
            <NGOCard key={ngo.id} ngo={ngo} onToast={showToast} />
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
};

export default DonatePage;

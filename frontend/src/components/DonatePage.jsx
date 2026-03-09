import React, { useState, useEffect } from "react";
import axios from "axios";

// Load Razorpay SDK dynamically
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const API = process.env.REACT_APP_API_BASE_URL || "";

const DonatePage = () => {
  const [ngos, setNgos] = useState([]);

  useEffect(() => {
    axios
      .get(`${API}/donations/ngos`)
      .then((res) => setNgos(res.data))
      .catch((err) => {
        console.error("NGO fetch error:", err);
        setNgos([]);
      });
  }, []);

  const handleDonate = async (ngoId, ngoName) => {
    const amount = prompt(`How much do you want to donate to ${ngoName}? (₹)`);

    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }

    const loaded = await loadRazorpayScript();
    if (!loaded) {
      alert("Razorpay SDK failed to load.");
      return;
    }

    try {
      const orderRes = await axios.post(`${API}/donations/create-order`, {
        amount: parseFloat(amount),
        ngo_id: ngoId,
      });

      const { order_id, amount: amt } = orderRes.data;

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID,
        amount: amt,
        currency: "INR",
        name: "StrayCare",
        description: `Donation to ${ngoName}`,
        order_id: order_id,
        handler: async function (response) {
          try {
            await axios.post(`${API}/donations/verify`, {
              payment_id: response.razorpay_payment_id,
              order_id: response.razorpay_order_id,
              signature: response.razorpay_signature,
            });
            alert("🎉 Donation Successful! Thank you ❤️");
            window.location.reload();
          } catch (err) {
            console.error("Verification error:", err);
            alert("Payment verified failed. Contact support.");
          }
        },
        prefill: { name: "", email: "" },
        theme: { color: "#2563eb" },
      };

      const paymentObj = new window.Razorpay(options);
      paymentObj.open();
    } catch (err) {
      console.error("Donation Error:", err);
      alert("Donation failed. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ textAlign: "center" }}>Support Our Partner NGOs ❤️</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem" }}>
        {ngos.length ? ngos.map((ngo) => (
          <div key={ngo.id} style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: 16, background: "#fff" }}>
            <h2 style={{ fontWeight: 700 }}>{ngo.name}</h2>
            <p style={{ color: "#6b7280" }}>{ngo.email}</p>
            <div style={{ marginTop: 12 }}>
              <strong>Raised (30d): </strong> ₹{ngo.total_donations_last_30_days || 0}
            </div>
            <button onClick={() => handleDonate(ngo.id, ngo.name)} style={{
              marginTop: 12, width: "100%", padding: 12, background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer"
            }}>
              Donate Now
            </button>
          </div>
        )) : <p>Loading NGOs...</p>}
      </div>
    </div>
  );
};

export default DonatePage;

import React, { useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus, Eye, EyeOff, Gift, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../utils/constants";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", otp: "" });
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, form);
      toast.success(res.data.message || "OTP sent to your email!");
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!form.otp) {
      toast.error("Please enter the OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email: form.email,
        otp: form.otp,
      });
      toast.success("Account verified! Please log in. 🎉");
      navigate("/login");
    } catch (err) {
      toast.error("OTP verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #fff0f6, #fce4ec, #f3e5f5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "100px 20px 40px",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.6)",
          borderRadius: "28px",
          padding: "48px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 25px 60px rgba(244, 143, 177, 0.2)"
        }}
      >
        {/* Logo */}
        <Link to="/" style={{ textDecoration: "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px", color: "var(--primary, #e91e8c)", fontWeight: 800, fontSize: "20px" }}>
            <Gift size={24} /> 4U Toys and Treats
          </div>
        </Link>

        {/* Step Indicator */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: "4px", borderRadius: "2px", background: s <= step ? "var(--primary, #e91e8c)" : "#e0e0e0", transition: "background 0.4s" }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <h1 style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: 800, color: "#1a1a1a" }}>Create Account</h1>
              <p style={{ margin: "0 0 28px", color: "#888", fontSize: "15px" }}>Join us & start gifting magic! 🎁</p>

              {/* Name */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "14px", color: "#444", marginBottom: "6px" }}>Full Name</label>
                <input
                  name="name"
                  placeholder="Your name"
                  value={form.name}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "13px 16px", borderRadius: "14px", border: "1.5px solid #e0e0e0", fontSize: "15px", outline: "none", boxSizing: "border-box", background: "#fafafa", transition: "0.2s" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--primary, #e91e8c)"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "14px", color: "#444", marginBottom: "6px" }}>Email</label>
                <input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  style={{ width: "100%", padding: "13px 16px", borderRadius: "14px", border: "1.5px solid #e0e0e0", fontSize: "15px", outline: "none", boxSizing: "border-box", background: "#fafafa", transition: "0.2s" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--primary, #e91e8c)"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: "28px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "14px", color: "#444", marginBottom: "6px" }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={handleChange}
                    style={{ width: "100%", padding: "13px 48px 13px 16px", borderRadius: "14px", border: "1.5px solid #e0e0e0", fontSize: "15px", outline: "none", boxSizing: "border-box", background: "#fafafa", transition: "0.2s" }}
                    onFocus={(e) => e.target.style.borderColor = "var(--primary, #e91e8c)"}
                    onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  />
                  <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#999", display: "flex" }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleRegister}
                disabled={loading}
                style={{ width: "100%", padding: "15px", background: loading ? "#ccc" : "linear-gradient(135deg, var(--primary, #e91e8c), #ab47bc)", color: "#fff", border: "none", borderRadius: "16px", fontWeight: 700, fontSize: "16px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: loading ? "none" : "0 8px 25px rgba(233, 30, 140, 0.3)", marginBottom: "20px" }}
              >
                <UserPlus size={20} /> {loading ? "Sending OTP..." : "Create Account"}
              </motion.button>

              <p style={{ textAlign: "center", color: "#888", fontSize: "14px", margin: 0 }}>
                Already have an account?{" "}
                <Link to="/login" style={{ color: "var(--primary, #e91e8c)", fontWeight: 700, textDecoration: "none" }}>Sign In</Link>
              </p>
            </motion.div>
          ) : (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div style={{ width: "60px", height: "60px", background: "linear-gradient(135deg, #fce4ec, #f3e5f5)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                <ShieldCheck size={28} color="var(--primary, #e91e8c)" />
              </div>
              <h1 style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: 800, color: "#1a1a1a" }}>Verify OTP</h1>
              <p style={{ margin: "0 0 8px", color: "#888", fontSize: "15px" }}>We sent a code to</p>
              <p style={{ margin: "0 0 28px", color: "#1a1a1a", fontWeight: 700, fontSize: "15px" }}>{form.email}</p>

              <div style={{ marginBottom: "28px" }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "14px", color: "#444", marginBottom: "6px" }}>Enter OTP</label>
                <input
                  name="otp"
                  placeholder="6-digit code"
                  value={form.otp}
                  onChange={handleChange}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  style={{ width: "100%", padding: "13px 16px", borderRadius: "14px", border: "1.5px solid #e0e0e0", fontSize: "24px", outline: "none", boxSizing: "border-box", background: "#fafafa", transition: "0.2s", textAlign: "center", letterSpacing: "8px" }}
                  onFocus={(e) => e.target.style.borderColor = "var(--primary, #e91e8c)"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                  maxLength={6}
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleVerify}
                disabled={loading}
                style={{ width: "100%", padding: "15px", background: loading ? "#ccc" : "linear-gradient(135deg, var(--primary, #e91e8c), #ab47bc)", color: "#fff", border: "none", borderRadius: "16px", fontWeight: 700, fontSize: "16px", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", boxShadow: loading ? "none" : "0 8px 25px rgba(233, 30, 140, 0.3)", marginBottom: "20px" }}
              >
                <ShieldCheck size={20} /> {loading ? "Verifying..." : "Verify & Continue"}
              </motion.button>

              <button onClick={() => setStep(1)} style={{ width: "100%", padding: "12px", background: "transparent", border: "none", color: "#888", fontSize: "14px", cursor: "pointer" }}>
                ← Go back
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
import React, { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { LogIn, Eye, EyeOff, Gift } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../utils/constants";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      toast.error("Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, form);
      login(res.data.token);   // ← updates AuthContext & localStorage
      toast.success("Welcome back! 🎉");
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Please try again.");
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

        <h1 style={{ margin: "0 0 8px", fontSize: "28px", fontWeight: 800, color: "#1a1a1a" }}>Welcome back</h1>
        <p style={{ margin: "0 0 32px", color: "#888", fontSize: "15px" }}>Sign in to access your cart & account.</p>

        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: "14px", color: "#444", marginBottom: "6px" }}>Email</label>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
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
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              style={{ width: "100%", padding: "13px 48px 13px 16px", borderRadius: "14px", border: "1.5px solid #e0e0e0", fontSize: "15px", outline: "none", boxSizing: "border-box", background: "#fafafa", transition: "0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "var(--primary, #e91e8c)"}
              onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#999", display: "flex" }}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            background: loading ? "#ccc" : "linear-gradient(135deg, var(--primary, #e91e8c), #ab47bc)",
            color: "#fff",
            border: "none",
            borderRadius: "16px",
            fontWeight: 700,
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            boxShadow: loading ? "none" : "0 8px 25px rgba(233, 30, 140, 0.3)",
            marginBottom: "20px"
          }}
        >
          <LogIn size={20} /> {loading ? "Signing in..." : "Sign In"}
        </motion.button>

        <p style={{ textAlign: "center", color: "#888", fontSize: "14px", margin: 0 }}>
          Don't have an account?{" "}
          <Link to="/register" style={{ color: "var(--primary, #e91e8c)", fontWeight: 700, textDecoration: "none" }}>
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
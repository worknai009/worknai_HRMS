import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaUserTie,
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaBuilding,
  FaCircleNotch
} from "react-icons/fa";

import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  /* ---------------- HANDLERS (Logic is same) ---------------- */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return toast.warning("Please fill all fields");
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      const { user, token } = res.data;

      if (!token || !user) {
        throw new Error("Invalid response from server");
      }

      // 🔒 STRICT HR CHECK
      if (user.role !== "Admin") {
        toast.error("Access denied. HR Admin credentials required.");
        return;
      }

      // Save Data
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      toast.success(`Welcome HR ${user.name.split(" ")[0]} 👨‍💼`);
      navigate("/hr/dashboard");

    } catch (err) {
      const msg = err.response?.data?.message || "Invalid HR credentials";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="hr-login-page">
      {/* Background Decor (Kept subtle animation) */}
      <div className="bg-circle c1"></div>
      <div className="bg-circle c2"></div>

      <div className="hr-card slide-in">
        
        {/* Header */}
        <div className="hr-header">
          <div className="icon-wrapper">
            <div className="hr-icon">
              <FaUserTie />
            </div>
            {/* Added spinning ring for modern feel with old colors */}
            <div className="icon-ring"></div>
          </div>
          <h2>HR Admin Portal</h2>
          <p>Secure access for HR & Managers</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="hr-form">
          <div className="input-group">
            <label>Official Email</label>
            <div className="hr-input-wrapper">
              <FaEnvelope className="field-icon" />
              <input
                type="email"
                name="email"
                placeholder="hr@company.com"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="hr-input-wrapper">
              <FaLock className="field-icon" />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button className="hr-btn" disabled={loading}>
            {loading ? <><FaCircleNotch className="spin" /> Verifying...</> : "Login as HR"}
          </button>
        </form>

        {/* Footer */}
        <div className="hr-footer">
          <p>
            Are you a Company Owner?
            <Link to="/company-login">
              <FaBuilding /> Owner Login <FaArrowRight size={11} />
            </Link>
          </p>
        </div>
      </div>

      {/* ---------------- STYLES (Fixed Overflow & Old Colors) ---------------- */}
      <style>{`
        /* Page Background - Restored Old Gradient */
        .hr-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg,#fff7ed,#ffedd5);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          padding: 20px;
        }

        /* Decorative Background Blobs (Subtle modern touch) */
        .bg-circle {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.4;
          z-index: 0;
        }
        .c1 { width: 400px; height: 400px; background: #fb923c; top: -100px; left: -100px; }
        .c2 { width: 300px; height: 300px; background: #fde68a; bottom: -50px; right: -50px; }

        /* Card Container - Restored solid white and sizes */
        .hr-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border-radius: 22px;
          padding: 48px 38px;
          box-shadow: 0 25px 60px rgba(234,88,12,.15);
          z-index: 10;
          position: relative;
        }

        /* Animation */
        .slide-in { animation: slideUpFade 0.6s ease-out; }
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Header Section */
        .hr-header { text-align: center; margin-bottom: 32px; }
        .icon-wrapper { position: relative; width: 80px; height: 80px; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; }

        /* Restored Old Icon Gradient */
        .hr-icon {
          width: 68px; height: 68px;
          background: linear-gradient(135deg,#fb923c,#ea580c);
          color: #fff;
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          font-size: 30px;
          z-index: 2;
          box-shadow: 0 12px 25px rgba(234,88,12,.35);
        }

        /* Spinning Ring with old color scheme */
        .icon-ring {
          position: absolute; width: 100%; height: 100%;
          border: 2px dashed #fde68a;
          border-radius: 24px;
          animation: spinSlow 15s linear infinite;
          z-index: 1;
        }
        @keyframes spinSlow { to { transform: rotate(360deg); } }

        .hr-header h2 { margin: 0; font-size: 1.7rem; font-weight: 800; color: #1f2937; }
        .hr-header p { color: #6b7280; font-size: .9rem; margin-top: 6px; }

        /* Form Styling */
        .hr-form { display: flex; flex-direction: column; gap: 20px; }
        .input-group label { display: block; font-size: 0.85rem; font-weight: 600; color: #374151; margin-bottom: 6px; margin-left: 5px; }
        .hr-input-wrapper { position: relative; }

        /* Restored Icon Color */
        .field-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #fb923c; font-size: 1rem; z-index: 2; }

        /* ----- THE FIX FOR INPUTS STICKING OUT ----- */
        .hr-input-wrapper input {
          width: 100%;
          box-sizing: border-box; /* ✅ This fixes the overflow issue */
          padding: 15px 15px 15px 46px;
          border-radius: 14px;
          /* Restored Old Colors */
          border: 1.6px solid #fde68a;
          background: #fffaf5;
          font-size: .95rem;
          outline: none;
          transition: .25s;
          color: #1f2937;
        }

        .hr-input-wrapper input:focus {
          border-color: #ea580c;
          box-shadow: 0 0 0 4px rgba(234,88,12,.15);
          background: #fff;
        }

        /* Button - Restored Old Gradient & Shadow */
        .hr-btn {
          margin-top: 8px;
          padding: 15px;
          background: linear-gradient(135deg,#fb923c,#ea580c);
          color: #fff;
          border: none;
          border-radius: 14px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: .3s;
          box-shadow: 0 12px 25px rgba(234,88,12,.35);
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }

        .hr-btn:hover { filter: brightness(1.05); transform: translateY(-2px); }
        .hr-btn:disabled { background: #fed7aa; box-shadow: none; cursor: not-allowed; transform: none; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* Footer - Restored Old Style */
        .hr-footer { margin-top: 30px; text-align: center; font-size: .9rem; color: #6b7280; }
        .hr-footer a { display: inline-flex; align-items: center; gap: 6px; margin-left: 6px; color: #ea580c; font-weight: 700; text-decoration: none; transition: 0.2s;}
        .hr-footer a:hover { text-decoration: underline; }

        /* Responsive */
        @media (max-width: 480px) {
          .hr-login-page { padding: 0; background: #fff; }
          .bg-circle { display: none; }
          .hr-card { 
            box-shadow: none; border-radius: 0; padding: 30px 25px; 
            max-width: 100%; min-height: 100vh; 
            display: flex; flex-direction: column; justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaUserShield,
  FaLock,
  FaFingerprint,
  FaCircleNotch,
  FaKey
} from "react-icons/fa";

import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= LOGIN LOGIC ================= */
  const handleLogin = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      return toast.warning("Credentials required for Root Access");
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/super-admin-login", {
        email,
        password
      });

      const { user, token } = res.data;

      if (!user || user.role !== "SuperAdmin") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Unauthorized: Root privileges missing");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      toast.success("ROOT SESSION INITIALIZED");
      navigate("/superadmin/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Access Denied");
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="sa-login-page">
      {/* Background Ambience */}
      <div className="ambient-glow g1"></div>
      <div className="ambient-glow g2"></div>

      <div className="sa-card slide-up">
        
        {/* HEADER */}
        <div className="sa-header">
          <div className="icon-frame">
            <FaUserShield className="main-icon" />
          </div>
          <h2>SUPER ADMIN</h2>
          <p>Master Control Console</p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="sa-form">
          <div className="input-group">
            <label>ROOT IDENTITY</label>
            <div className="sa-input-wrapper">
              <FaFingerprint className="field-icon" />
              <input
                type="email"
                placeholder="admin@master-system.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>ACCESS KEY</label>
            <div className="sa-input-wrapper">
              <FaLock className="field-icon" />
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="sa-btn" disabled={loading}>
            {loading ? (
              <><FaCircleNotch className="spin" /> VERIFYING...</>
            ) : (
              <><FaKey /> UNLOCK SYSTEM</>
            )}
          </button>
        </form>

        <div className="sa-footer">
          <p>SECURE ENVIRONMENT • IP LOGGED</p>
        </div>
      </div>

      {/* ================= STYLES ================= */}
      <style>{`
        /* 1. Page Background - Deep Navy Blue (Premium) */
        .sa-login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a; /* Slate 900 */
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
          padding: 20px;
        }

        /* 2. Ambient Gold Glows */
        .ambient-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.25;
          z-index: 0;
        }
        .g1 { width: 500px; height: 500px; background: #fbbf24; top: -150px; left: -100px; } /* Amber */
        .g2 { width: 400px; height: 400px; background: #3b82f6; bottom: -100px; right: -100px; } /* Blue */

        /* 3. Card Design - Glassmorphism + Dark Tint */
        .sa-card {
          width: 100%;
          max-width: 420px;
          background: rgba(30, 41, 59, 0.7); /* Slate 800 with opacity */
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          padding: 45px 38px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          z-index: 10;
          position: relative;
        }

        /* Animation */
        .slide-up { animation: slideUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1); }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* 4. Header Section */
        .sa-header { text-align: center; margin-bottom: 35px; }

        .icon-frame {
          width: 72px; height: 72px;
          margin: 0 auto 18px;
          background: linear-gradient(135deg, #f59e0b, #d97706); /* Gold Gradient */
          border-radius: 18px;
          display: flex; align-items: center; justify-content: center;
          font-size: 32px;
          color: #fff;
          box-shadow: 0 0 25px rgba(245, 158, 11, 0.4); /* Gold Glow */
          position: relative;
        }

        .icon-frame::after {
          content: ''; position: absolute; inset: -3px;
          border-radius: 22px;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }

        .sa-header h2 {
          margin: 0; font-size: 1.5rem; font-weight: 800; 
          color: #f1f5f9; letter-spacing: 1px;
        }
        .sa-header p {
          margin-top: 6px; font-size: 0.8rem; 
          color: #94a3b8; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;
        }

        /* 5. Form Styles */
        .sa-form { display: flex; flex-direction: column; gap: 20px; }
        
        .input-group label {
          display: block; font-size: 0.7rem; font-weight: 700; 
          color: #cbd5e1; margin-bottom: 8px; margin-left: 4px;
          letter-spacing: 1px;
        }
        
        .sa-input-wrapper { position: relative; }

        .field-icon { 
          position: absolute; left: 16px; top: 50%; 
          transform: translateY(-50%); 
          color: #64748b; font-size: 1rem; 
          transition: 0.3s;
          z-index: 2;
        }

        /* INPUT FIX: box-sizing included */
        .sa-input-wrapper input {
          width: 100%;
          box-sizing: border-box; /* ✅ FIXED OVERFLOW */
          padding: 14px 15px 14px 45px;
          border-radius: 10px;
          border: 1px solid #334155;
          background: #0f172a; /* Very Dark Blue input bg */
          color: #e2e8f0;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.3s;
          font-family: 'Inter', sans-serif;
        }

        .sa-input-wrapper input:focus {
          border-color: #f59e0b; /* Gold Border on Focus */
          background: #1e293b;
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
        }
        
        .sa-input-wrapper input:focus + .field-icon { color: #f59e0b; }

        /* 6. Button - Gold/Amber Gradient */
        .sa-btn {
          margin-top: 12px;
          padding: 15px;
          background: linear-gradient(135deg, #f59e0b, #b45309);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: 0.3s;
          box-shadow: 0 10px 25px rgba(180, 83, 9, 0.3);
          letter-spacing: 1px;
        }

        .sa-btn:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 15px 35px rgba(180, 83, 9, 0.4);
          filter: brightness(1.1);
        }

        .sa-btn:disabled { 
          background: #475569; color: #94a3b8; 
          cursor: not-allowed; transform: none; box-shadow: none; 
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* 7. Footer */
        .sa-footer {
          margin-top: 30px;
          text-align: center;
          font-size: 0.65rem;
          color: #64748b;
          font-weight: 600;
          letter-spacing: 1.5px;
          border-top: 1px solid rgba(255,255,255,0.05);
          padding-top: 20px;
        }

        /* 8. Mobile Responsive */
        @media (max-width: 480px) {
          .sa-login-page { padding: 0; background: #0f172a; }
          .ambient-glow { display: none; }
          .sa-card { 
            box-shadow: none; border: none; border-radius: 0; 
            padding: 30px 24px; max-width: 100%; height: 100vh;
            display: flex; flex-direction: column; justify-content: center;
            background: #0f172a;
          }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminLogin;
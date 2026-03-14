import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaUserShield,
  FaLock,
  FaFingerprint,
  FaCircleNotch,
  FaKey,
  FaEye,
  FaEyeSlash,
  FaSignInAlt
} from "react-icons/fa";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Common/Footer";


const normalizeRole = (role = "") => String(role).trim().toUpperCase().replace(/\s+/g, "_");

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    const em = email.trim();
    if (!em || !password) return toast.warning("Credentials required");

    setLoading(true);
    try {
      const res = await API.post("/auth/super-admin-login", { email: em, password });
      const { user, token } = res.data || {};

      if (!token || !user) throw new Error("Invalid server response");

      const role = normalizeRole(user.role);
      if (role !== "SUPERADMIN" && role !== "SUPER_ADMIN") {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        toast.error("Unauthorized");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      setUser(user);

      toast.success("ROOT SESSION INITIALIZED");
      navigate("/superadmin/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Access Denied");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="auth-hero-section">
        <div className="card shadow-glow animate-fade-in">
          <div className="head">
            <div className="pro-icon-container">
              <div className="pro-icon-box">
                <FaUserShield className="auth-portal-icon" />
              </div>
              <div className="pro-icon-ring"></div>
              <div className="pro-icon-glow"></div>
            </div>
            <h2>ROOT ACCESS</h2>
            <p>Secure Control Console</p>
          </div>

          <form onSubmit={handleLogin} className="form">
            <div className="fg">
              <label>ROOT IDENTITY</label>
              <div className="inp">
                <FaFingerprint className="fi" />
                <input
                  type="email"
                  placeholder="admin@master-system.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="fg">
              <label>ACCESS KEY</label>
              <div className="inp">
                <FaLock className="fi" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="eye"
                  onClick={() => setShowPass((s) => !s)}
                  disabled={loading}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button className="btn master-btn" disabled={loading}>
              {loading ? (
                <>
                  <FaCircleNotch className="spin" /> VERIFYING...
                </>
              ) : (
                <>
                  <FaSignInAlt /> UNLOCK SYSTEM
                </>
              )}
            </button>

            <div className="foot">SECURE ENVIRONMENT • IP LOGGED</div>
          </form>
        </div>
      </div>

      <Footer />

      <style>{`
        .page {
          min-height: 100vh;
          width: 100%;
          background: transparent;
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #fff;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
          padding-top: 80px; /* Accounts for fixed navbar */
        }

        .auth-hero-section {
          flex: 1;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          box-sizing: border-box;
          /* justify-content is omitted; card uses margin: auto to center without cutting off */
        }

        /* Fixed background captures the whole screen forever */
        .page::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at top left, #0a0f2b 0%, #050714 50%, #080d1e 100%);
          z-index: -1;
          pointer-events: none;
        }

        .card {
          width: 94%; 
          max-width: 440px; 
          background: rgba(8, 13, 30, 0.75); 
          border-radius: 28px;
          padding: 40px 30px; 
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(80, 150, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
          margin: auto; /* Robust centering in flex hero */
          animation: slideUp 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }

        .head { text-align: center; margin-bottom: 25px; }
        
        .pro-icon-container {
          position: relative;
          width: 65px;
          height: 65px;
          margin: 0 auto 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pro-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(80, 200, 255, 0.1), rgba(167, 139, 250, 0.1));
          border: 1px solid rgba(80, 200, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          backdrop-filter: blur(10px);
        }

        .auth-portal-icon {
          font-size: 24px;
          color: #50c8ff;
          filter: drop-shadow(0 0 8px rgba(80, 200, 255, 0.5));
        }

        .pro-icon-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px dashed rgba(80, 200, 255, 0.2);
          border-radius: 18px;
          animation: spinRing 20s linear infinite;
        }

        @keyframes spinRing { to { transform: rotate(360deg); } }

        .head h2 { 
          margin: 0; 
          font-size: 1.6rem; 
          font-weight: 900; 
          background: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 1px;
        }
        .head p { 
          margin-top: 4px; 
          font-size: 0.8rem; 
          color: rgba(255, 255, 255, 0.5); 
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .form { display: flex; flex-direction: column; gap: 12px; }
        .fg label { 
          display: block; 
          font-size: 0.7rem; 
          font-weight: 900; 
          color: rgba(255, 255, 255, 0.4); 
          margin-bottom: 6px;
          letter-spacing: 1px;
        }
        
        .inp { position: relative; }
        .fi {
          position: absolute; 
          left: 14px; 
          top: 50%; 
          transform: translateY(-50%);
          color: #50c8ff; 
          font-size: 1rem;
          opacity: 0.8;
          z-index: 2;
        }
        .inp input {
          width: 100%; 
          box-sizing: border-box;
          padding: 12px 12px 12px 42px; 
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1); 
          font-size: 0.95rem;
          background: rgba(255, 255, 255, 0.04); 
          color: #fff;
          outline: none; 
          transition: 0.3s;
        }
        .inp input:focus {
          border-color: #50c8ff;
          background: rgba(80, 200, 255, 0.05);
          box-shadow: 0 0 15px rgba(80, 200, 255, 0.15);
        }

        .eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }

        .master-btn {
          margin-top: 5px; 
          padding: 13px; 
          border-radius: 12px; 
          border: none;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
          color: #fff; 
          font-weight: 900; 
          font-size: 1rem; 
          cursor: pointer; 
          transition: 0.3s;
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .master-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .master-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .spin { animation: spinRing 1s linear infinite; }

        .foot {
          margin-top: 15px; 
          text-align: center; 
          font-size: 0.7rem; 
          color: rgba(255, 255, 255, 0.3);
          font-weight: 800;
          letter-spacing: 1px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 10px;
        }

        /* Tablet & Mobile Scaling */
        @media (max-width: 768px) {
          .page { min-height: calc(100vh - 70px); }
          .auth-hero-section { padding: 40px 15px; }
          .card { padding: 30px 20px; border-radius: 20px; width: 90%; }
          .head h2 { font-size: 1.4rem; }
        }

        @media (max-width: 480px) {
          .auth-hero-section { padding: 20px 10px; }
          .card { padding: 25px 15px; width: 95%; max-width: 360px; }
          .pro-icon-container { width: 55px; height: 55px; margin-bottom: 8px; }
          .pro-icon-box { width: 42px; height: 42px; }
          .auth-portal-icon { font-size: 18px; }
          .head h2 { font-size: 1.25rem; }
          .head p { font-size: 0.75rem; }
          .inp input { padding: 10px 10px 10px 40px; font-size: 0.9rem; }
          .master-btn { padding: 12px; font-size: 0.9rem; }
        }

        /* 320px Optimized View - Force it to stay centered & fully show */
        @media(max-width: 335px), (max-height: 500px) {
          .page { padding: 80px 5px 5px; min-height: 100vh; justify-content: flex-start; }
          .auth-hero-section { padding: 10px 5px; }
          .card { 
            padding: 15px 12px; 
            border-radius: 16px; 
            margin: auto; 
            max-width: 290px;
          }
          .head { margin-bottom: 8px; }
          .head h2 { font-size: 1.1rem; }
          .head p { font-size: 0.72rem; margin-top: 2px; }
          .pro-icon-container { width: 40px; height: 40px; margin-bottom: 6px; }
          .pro-icon-box { width: 32px; height: 32px; border-radius: 8px; }
          .auth-portal-icon { font-size: 14px; }
          .pro-icon-ring { display: none; }
          .form { gap: 8px; }
          .inp input { padding: 9px 9px 9px 38px; font-size: 0.8rem; border-radius: 8px; }
          .master-btn { padding: 10px; font-size: 0.8rem; border-radius: 8px; margin-top: 4px; }
          .foot { margin-top: 10px; padding-top: 8px; font-size: 0.65rem; }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminLogin;

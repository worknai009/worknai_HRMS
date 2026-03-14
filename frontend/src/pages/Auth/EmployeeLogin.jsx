  import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaUserCircle,
  FaSignInAlt
} from "react-icons/fa";
import { loginUser } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

import Footer from "../../components/Common/Footer";

const normalizeRole = (role = "") => {
  const r = String(role || "").trim().toLowerCase();
  if (!r) return "";
  if (r === "companyowner" || r === "companyadmin") return "CompanyAdmin";
  if (r === "hr" || r === "hradmin" || r === "admin") return "Admin";
  if (r === "employee") return "Employee";
  if (r === "superadmin" || r === "super-admin") return "SuperAdmin";
  return role;
};

const extractAuth = (res) => {
  const d = res?.data;
  const token = d?.token || d?.accessToken || d?.data?.token || d?.data?.accessToken;
  const user = d?.user || d?.data?.user || d?.profile || d?.data?.profile;
  return { token, user };
};

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.warning("Please enter email & password");

    setLoading(true);
    try {
      const res = await loginUser(form);
      const { user, token } = extractAuth(res);
      if (!token || !user) throw new Error("Invalid server response");

      const role = normalizeRole(user.role);
      login({ token, user: { ...user, role } });

      toast.success(`Welcome ${(user?.name || "User").split(" ")[0]} 🌱`);

      // ✅ Role-based redirect
      if (role === "SuperAdmin") navigate("/superadmin/dashboard");
      else if (role === "CompanyAdmin") navigate("/company/dashboard");
      else if (role === "Admin") navigate("/hr/dashboard");
      else navigate("/employee/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid employee credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="employee-login-page">
      <div className="auth-hero-section">
        <div className="employee-card slide-in">
          <div className="employee-header">
            <div className="pro-icon-container">
              <div className="pro-icon-box">
                <FaUserCircle className="pro-icon" />
              </div>
              <div className="pro-icon-ring"></div>
              <div className="pro-icon-glow"></div>
            </div>
            <h2>Employee Portal</h2>
            <p>Secure • Smart • Professional</p>
          </div>

          <form onSubmit={handleLogin} className="employee-form">
            <div className="emp-input">
              <FaEnvelope className="emp-icon" />
              <input type="email" name="email" placeholder="Work email" onChange={handleChange} value={form.email} required />
            </div>

            <div className="emp-input">
              <FaLock className="emp-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                onChange={handleChange}
                value={form.password}
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button className="emp-btn" disabled={loading}>
              {loading ? <><FaSignInAlt /> Signing you in...</> : <><FaSignInAlt /> Login to Work</>}
            </button>
          </form>

          <div className="employee-footer">
            <p>
              New here?
              <Link to="/register">
                Register <FaArrowRight size={11} />
              </Link>
            </p>

            <p className="hr-link">
              HR / Admin?
              <Link to="/admin-login"> Login here</Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        .employee-login-page {
          min-height: 100vh;
          width: 100%;
          background: #050714;
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #fff;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .auth-hero-section {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 100px 20px 40px;
          box-sizing: border-box;
        }

        /* Fixed background captures the whole screen forever */
        .employee-login-page::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at top left, #0a0f2b 0%, #050714 50%, #080d1e 100%);
          z-index: -1;
          pointer-events: none;
        }

        .employee-card {
          width: 100%; 
          max-width: 420px; 
          background: rgba(8, 13, 30, 0.75); 
          border-radius: 28px;
          padding: 40px 30px; 
          box-sizing: border-box;
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(80, 150, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
          margin: auto;
          animation: slideUp 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }

        .employee-header { text-align: center; margin-bottom: 25px; }
        
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

        .pro-icon {
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

        .employee-header h2 { 
          margin: 0; 
          font-size: 1.6rem; 
          font-weight: 900; 
          background: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }
        .employee-header p { 
          margin-top: 4px; 
          font-size: 0.8rem; 
          color: rgba(255, 255, 255, 0.5); 
          font-weight: 600;
        }

        .employee-form { display: flex; flex-direction: column; gap: 12px; }
        .emp-input { position: relative; }
        .emp-icon {
          position: absolute; 
          left: 14px; 
          top: 50%; 
          transform: translateY(-50%);
          color: #50c8ff; 
          font-size: 1rem;
          opacity: 0.8;
        }
        .emp-input input {
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
        .emp-input input:focus {
          border-color: #50c8ff;
          background: rgba(80, 200, 255, 0.05);
          box-shadow: 0 0 15px rgba(80, 200, 255, 0.15);
        }

        .password-toggle {
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

        .emp-btn {
          margin-top: 5px; 
          padding: 13px; 
          border-radius: 12px; 
          border: none;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
          color: #fff; 
          font-weight: 800; 
          font-size: 1rem; 
          cursor: pointer; 
          transition: 0.3s;
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .emp-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }

        .employee-footer { margin-top: 15px; text-align: center; }
        .employee-footer p {
          font-size: 0.8rem; 
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 4px;
        }
        .employee-footer a {
          margin-left: 6px; 
          color: #a78bfa; 
          font-weight: 800; 
          text-decoration: none;
          display: inline-flex; 
          align-items: center; 
          gap: 6px;
        }

        @media(max-width: 500px) {
          .auth-hero-section { padding: 80px 15px 40px; }
          .employee-card { 
            width: 100%;
            max-width: 100%;
            padding: 25px 20px; 
            border-radius: 20px; 
            margin: auto; 
          }
          .employee-header { margin-bottom: 8px; }
          .employee-header h2 { font-size: 1.1rem; }
          .employee-header p { font-size: 0.72rem; margin-top: 2px; }
          .pro-icon-container { width: 40px; height: 40px; margin-bottom: 6px; }
          .pro-icon-box { width: 32px; height: 32px; border-radius: 8px; }
          .pro-icon { font-size: 14px; }
          .pro-icon-ring { display: none; }
          .employee-form { gap: 8px; }
          .emp-input input { padding: 9px 9px 9px 35px; font-size: 0.8rem; border-radius: 8px; }
          .emp-icon { font-size: 0.85rem; left: 12px; }
          .emp-btn { padding: 10px; font-size: 0.8rem; border-radius: 8px; margin-top: 4px; }
          .employee-footer { margin-top: 10px; }
          .employee-footer p, .employee-footer a { font-size: 0.7rem; }
        }

        /* Footer Overrides for Auth Pages */
        @media(max-width: 600px) {
          .main-footer { padding-top: 40px !important; }
          .footer-container { gap: 30px !important; }
          .footer-column h4 { margin-bottom: 20px !important; font-size: 1.1rem !important; }
          .footer-bottom { padding: 25px 15px !important; gap: 15px !important; }
          .footer-bottom p { margin: 0 10px !important; font-size: 0.8rem !important; }
        }
      `}</style>
    </div>
  );
};

export default EmployeeLogin;

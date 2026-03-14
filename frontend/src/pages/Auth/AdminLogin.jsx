import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaUserTie,
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaBuilding,
  FaCircleNotch,
  FaEye,
  FaEyeSlash,
  FaSignInAlt
} from "react-icons/fa";
import { loginUser, clearAuthStorage } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/Common/Footer";


const canonRole = (role = "") => {
  const r = String(role || "").trim().toLowerCase();
  if (!r) return "";
  if (["companyowner", "companyadmin", "company_admin", "company-admin"].includes(r)) return "CompanyAdmin";
  if (["hr", "hradmin", "hr_admin", "hr-admin", "admin", "manager"].includes(r)) return "Admin";
  if (["employee"].includes(r)) return "Employee";
  if (["superadmin", "super-admin", "super_admin", "root"].includes(r)) return "SuperAdmin";
  return role;
};

const extractAuth = (res) => {
  const d = res?.data;
  const token = d?.token || d?.accessToken || d?.data?.token || d?.data?.accessToken;
  const user = d?.user || d?.data?.user || d?.profile || d?.data?.profile;
  return { token, user };
};

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.warning("Please fill all fields");

    setLoading(true);
    try {
      // ✅ very important: remove old session before new login
      clearAuthStorage();

      const res = await loginUser(form);
      const { user, token } = extractAuth(res);

      if (!token || !user) throw new Error("Invalid response from server");

      const role = canonRole(user.role);

      if (role !== "Admin") {
        clearAuthStorage();
        toast.error("Access denied. HR/Admin credentials required.");
        return;
      }

      login({ token, user: { ...user, role } });

      const first = (user?.name || "HR").split(" ")[0];
      toast.success(`Welcome HR ${first} 👨‍💼`);
      navigate("/hr/dashboard");
    } catch (err) {
      const msg = err?.response?.data?.message || "Invalid HR credentials";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-login-page">
      <div className="bg-circle c1"></div>
      <div className="bg-circle c2"></div>

      <div className="auth-hero-section">
        <div className="hr-card slide-in">
          <div className="hr-header">
            <div className="pro-icon-container">
              <div className="pro-icon-box">
                <FaUserTie className="auth-portal-icon" />
              </div>
              <div className="pro-icon-ring"></div>
              <div className="pro-icon-glow"></div>
            </div>
            <h2>HR Admin Portal</h2>
            <p>Secure access for HR & Managers</p>
          </div>

          <form onSubmit={handleLogin} className="hr-form">
            <div className="form-item">
              <label><FaEnvelope /> Official Email</label>
              <div className="hr-input-wrapper">
                <input type="email" name="email" placeholder="hr@company.com" onChange={handleChange} value={form.email} required />
              </div>
            </div>

            <div className="form-item">
              <label><FaLock /> Password</label>
              <div className="hr-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
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
            </div>

            <button className="hr-btn" disabled={loading}>
              {loading ? (
                <>
                  <FaCircleNotch className="spin" /> Verifying...
                </>
              ) : (
                <><FaSignInAlt /> Login to HR Portal</>
              )}
            </button>
          </form>

          <div className="hr-footer">
            <p>
              Are you a Company Owner?
              <Link to="/company-login">
                <FaBuilding /> Owner Login <FaArrowRight size={11} />
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
      <style>{`
        .hr-login-page {
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
        .hr-login-page::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at top left, #0a0f2b 0%, #050714 50%, #080d1e 100%);
          z-index: -1;
          pointer-events: none;
        }

        .hr-card {
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
          margin: auto; /* Robust centering in flex hero */
          animation: slideUp 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }

        .hr-header { text-align: center; margin-bottom: 25px; }
        
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
          color: #a78bfa;
          filter: drop-shadow(0 0 8px rgba(167, 139, 250, 0.5));
        }

        .pro-icon-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px dashed rgba(167, 139, 250, 0.2);
          border-radius: 18px;
          animation: spinRing 20s linear infinite;
        }

        @keyframes spinRing { to { transform: rotate(360deg); } }

        .hr-header h2 { 
          margin: 0; 
          font-size: 1.6rem; 
          font-weight: 900; 
          background: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }
        .hr-header p { 
          margin-top: 4px; 
          font-size: 0.8rem; 
          color: rgba(255, 255, 255, 0.5); 
          font-weight: 600;
        }

        .hr-form { display: flex; flex-direction: column; gap: 12px; }
        .form-item label { 
          display: flex; 
          align-items: center; 
          gap: 6px; 
          font-size: 0.85rem; 
          color: rgba(255,255,255,0.6); 
          margin-bottom: 6px;
          font-weight: 600;
        }
        
        .hr-input-wrapper { position: relative; }
        
        .hr-input-wrapper input {
          width: 100%; 
          box-sizing: border-box;
          padding: 12px 12px 12px 14px; 
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1); 
          font-size: 0.95rem;
          background: rgba(255, 255, 255, 0.04); 
          color: #fff;
          outline: none; 
          transition: 0.3s;
        }
        .hr-input-wrapper input:focus {
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

        .hr-btn {
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
        .hr-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .hr-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .spin { animation: spinRing 1s linear infinite; }

        .hr-footer { margin-top: 15px; text-align: center; }
        .hr-footer p {
          font-size: 0.8rem; 
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 4px;
        }
        .hr-footer a {
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
          .hr-card { 
            width: 100%;
            max-width: 100%;
            padding: 25px 20px; 
            border-radius: 20px; 
            margin: auto; 
          }
          .hr-header { margin-bottom: 8px; }
          .hr-header h2 { font-size: 1.1rem; }
          .hr-header p { font-size: 0.72rem; margin-top: 2px; }
          .pro-icon-container { width: 40px; height: 40px; margin-bottom: 6px; }
          .pro-icon-box { width: 32px; height: 32px; border-radius: 8px; }
          .auth-portal-icon { font-size: 14px; }
          .pro-icon-ring { display: none; }
          .hr-form { gap: 8px; }
          .hr-input-wrapper input { padding: 9px 12px; font-size: 0.8rem; border-radius: 8px; }
          .hr-btn { padding: 10px; font-size: 0.8rem; border-radius: 8px; margin-top: 4px; }
          .hr-footer { margin-top: 10px; }
          .hr-footer p, .hr-footer a { font-size: 0.7rem; }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;

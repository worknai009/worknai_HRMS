import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaBuilding,
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
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

const CompanyLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.warning("Please enter email and password");

    setLoading(true);
    try {
      const res = await loginUser(form);
      const { user, token } = extractAuth(res);
      if (!token || !user) throw new Error("Invalid server response");

      const role = normalizeRole(user.role);

      // 🔐 STRICT BUSINESS OWNER CHECK (CompanyAdmin/CompanyOwner)
      if (role !== "CompanyAdmin") {
        toast.error("Access denied. Business Owner account required.");
        return;
      }

      login({ token, user: { ...user, role } });

      toast.success(`Welcome ${(user?.name || "Owner").split(" ")[0]} 👔`);
      navigate("/company/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Invalid business credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="company-login-page">
      <div className="auth-hero-section">
        <div className="company-card float-in">
          <div className="company-header">
            <div className="pro-icon-container">
              <div className="pro-icon-box">
                <FaBuilding className="auth-portal-icon" />
              </div>
              <div className="pro-icon-ring"></div>
              <div className="pro-icon-glow"></div>
            </div>
            <h2>Business Owner Portal</h2>
            <p>Manage your company, HR & workforce</p>
          </div>

          <form onSubmit={handleLogin} className="company-form">
            <div className="company-input">
              <FaEnvelope className="field-icon" />
              <input type="email" name="email" placeholder="Owner email address" onChange={handleChange} value={form.email} required />
            </div>

            <div className="company-input">
              <FaLock className="field-icon" />
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

            <button className="company-btn" disabled={loading}>
              {loading ? <><FaSignInAlt /> Verifying Access...</> : <><FaSignInAlt /> Login to Dashboard</>}
            </button>
          </form>

          <div className="company-footer">
            <p>
              Are you an HR Admin?
              <Link to="/admin-login">
                HR Login <FaArrowRight size={11} />
              </Link>
            </p>

            <div className="security-note">
              <FaShieldAlt /> Secure Business Access
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        .company-login-page {
          min-height: 100vh;
          width: 100%;
          background: #050714;
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
        .company-login-page::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at top left, #0a0f2b 0%, #050714 50%, #080d1e 100%);
          z-index: -1;
          pointer-events: none;
        }

        .company-card {
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

        .company-header { text-align: center; margin-bottom: 25px; }
        
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
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.1), rgba(37, 99, 235, 0.1));
          border: 1px solid rgba(96, 165, 250, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          backdrop-filter: blur(10px);
        }

        .auth-portal-icon {
          font-size: 24px;
          color: #60a5fa;
          filter: drop-shadow(0 0 8px rgba(96, 165, 250, 0.5));
        }

        .pro-icon-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px dashed rgba(96, 165, 250, 0.2);
          border-radius: 18px;
          animation: spinRing 20s linear infinite;
        }

        @keyframes spinRing { to { transform: rotate(360deg); } }

        .company-header h2 { 
          margin: 0; 
          font-size: 1.6rem; 
          font-weight: 900; 
          background: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.5px;
        }
        .company-header p { 
          margin-top: 4px; 
          font-size: 0.8rem; 
          color: rgba(255, 255, 255, 0.5); 
          font-weight: 600;
        }

        .company-form { display: flex; flex-direction: column; gap: 12px; }
        .company-input { position: relative; }
        .field-icon {
          position: absolute; 
          left: 14px; 
          top: 50%; 
          transform: translateY(-50%);
          color: #50c8ff; 
          font-size: 1rem;
          opacity: 0.8;
          z-index: 2;
        }
        .company-input input {
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
        .company-input input:focus {
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

        .company-btn {
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
        .company-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .company-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .company-footer { margin-top: 15px; text-align: center; }
        .company-footer p {
          font-size: 0.8rem; 
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 4px;
        }
        .company-footer a {
          margin-left: 6px; 
          color: #a78bfa; 
          font-weight: 800; 
          text-decoration: none;
          display: inline-flex; 
          align-items: center; 
          gap: 6px;
        }
        .security-note {
          margin-top: 10px; 
          font-size: 0.75rem; 
          color: rgba(255, 255, 255, 0.4);
          display: flex; 
          justify-content: center; 
          align-items: center; 
          gap: 6px;
          font-weight: 700;
        }

        /* 320px Optimized View - Force it to stay centered & fully show */
        @media(max-width: 335px), (max-height: 600px) {
          .company-login-page { padding: 80px 5px 5px; }
          .company-card { 
            padding: 15px 12px; 
            border-radius: 16px; 
            margin: auto; 
            max-width: 290px;
          }
          .company-header { margin-bottom: 8px; }
          .company-header h2 { font-size: 1.1rem; }
          .company-header p { font-size: 0.72rem; margin-top: 2px; }
          .pro-icon-container { width: 40px; height: 40px; margin-bottom: 6px; }
          .pro-icon-box { width: 32px; height: 32px; border-radius: 8px; }
          .auth-portal-icon { font-size: 14px; }
          .pro-icon-ring { display: none; }
          .company-form { gap: 8px; }
          .company-input input { padding: 9px 9px 9px 38px; font-size: 0.8rem; border-radius: 8px; }
          .company-btn { padding: 10px; font-size: 0.8rem; border-radius: 8px; margin-top: 4px; }
          .company-footer { margin-top: 10px; }
          .company-footer p, .company-footer a { font-size: 0.7rem; }
          .security-note { margin-top: 8px; font-size: 0.65rem; }
        }
      `}</style>
    </div>
  );
};

export default CompanyLogin;

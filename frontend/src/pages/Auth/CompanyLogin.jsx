import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaBuilding, FaEnvelope, FaLock, FaArrowRight, FaShieldAlt } from "react-icons/fa";
import { loginUser } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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
      <div className="company-card float-in">
        <div className="company-header">
          <div className="company-icon">
            <FaBuilding />
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
            <input type="password" name="password" placeholder="Password" onChange={handleChange} value={form.password} required />
          </div>

          <button className="company-btn" disabled={loading}>
            {loading ? "Verifying Access..." : "Login to Dashboard"}
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

      <style>{`
        .company-login-page {
          min-height: 100vh; display:flex; align-items:center; justify-content:center;
          background: linear-gradient(135deg,#eff6ff,#e0f2fe); padding: 20px;
        }
        .company-card{
          width:100%; max-width:460px; background:#fff; border-radius:24px;
          padding: 50px 40px; box-shadow: 0 30px 70px rgba(37,99,235,.18);
          transition: transform .35s ease, box-shadow .35s ease;
        }
        .company-card:hover{ transform: translateY(-6px); box-shadow: 0 40px 90px rgba(37,99,235,.22); }
        .float-in{ animation: floatIn .7s ease; }
        @keyframes floatIn { from{opacity:0; transform: translateY(30px);} to{opacity:1; transform: translateY(0);} }

        .company-header{ text-align:center; margin-bottom:34px; }
        .company-icon{
          width:72px; height:72px; border-radius:22px;
          background: linear-gradient(135deg,#60a5fa,#2563eb);
          color:#fff; display:flex; align-items:center; justify-content:center;
          margin: 0 auto 14px; font-size:32px; box-shadow: 0 14px 30px rgba(37,99,235,.35);
        }
        .company-header h2{ margin:0; font-size:1.75rem; font-weight:900; color:#0f172a; }
        .company-header p{ margin-top:6px; font-size:.95rem; color:#475569; }

        .company-form{ display:flex; flex-direction:column; gap: 18px; }
        .company-input{ position:relative; }
        .field-icon{
          position:absolute; left:16px; top:50%; transform: translateY(-50%);
          color:#3b82f6; font-size:.95rem;
        }
        .company-input input{
          width:100%; box-sizing:border-box;
          padding: 16px 16px 16px 48px; border-radius:14px;
          border: 1.7px solid #dbeafe; font-size:.95rem;
          background:#f8fbff; outline:none; transition:.25s;
        }
        .company-input input:focus{
          background:#fff; border-color:#2563eb;
          box-shadow: 0 0 0 4px rgba(37,99,235,.15);
        }
        .company-btn{
          margin-top: 10px; padding: 16px; border-radius: 14px; border:none;
          background: linear-gradient(135deg,#60a5fa,#2563eb);
          color:#fff; font-weight:900; font-size:1rem; cursor:pointer; transition:.3s;
          box-shadow: 0 14px 32px rgba(37,99,235,.4);
        }
        .company-btn:hover{ transform: translateY(-2px); filter: brightness(1.05); }
        .company-btn:disabled{ background:#bfdbfe; box-shadow:none; cursor:not-allowed; }

        .company-footer{ margin-top: 30px; text-align:center; font-size:.9rem; color:#475569; }
        .company-footer a{
          margin-left:6px; color:#2563eb; font-weight:900; text-decoration:none;
          display:inline-flex; align-items:center; gap:6px;
        }
        .security-note{
          margin-top: 16px; font-size:.75rem; color:#64748b;
          display:flex; justify-content:center; align-items:center; gap:6px;
          font-weight:700;
        }

        @media (max-width:480px){
          .company-card{ padding: 36px 22px; border-radius:0; box-shadow:none; }
          .company-login-page{ padding:0; background:#fff; }
        }
      `}</style>
    </div>
  );
};

export default CompanyLogin;

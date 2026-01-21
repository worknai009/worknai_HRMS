import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { FaEnvelope, FaLock, FaArrowRight, FaLeaf } from "react-icons/fa";
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

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

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
      <div className="employee-card slide-in">
        <div className="employee-header">
          <div className="employee-icon">
            <FaLeaf />
          </div>
          <h2>Employee Portal</h2>
          <p>Simple • Secure • Smart Work Access</p>
        </div>

        <form onSubmit={handleLogin} className="employee-form">
          <div className="emp-input">
            <FaEnvelope className="emp-icon" />
            <input type="email" name="email" placeholder="Work email" onChange={handleChange} value={form.email} required />
          </div>

          <div className="emp-input">
            <FaLock className="emp-icon" />
            <input type="password" name="password" placeholder="Password" onChange={handleChange} value={form.password} required />
          </div>

          <button className="emp-btn" disabled={loading}>
            {loading ? "Signing you in..." : "Login to Work"}
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

      <style>{`
        .employee-login-page {
          min-height: 100vh; display:flex; justify-content:center; align-items:center;
          background: linear-gradient(135deg,#ecfdf5,#d1fae5); padding: 20px;
        }
        .employee-card {
          width: 100%; max-width: 430px; background:#fff; border-radius: 24px;
          padding: 46px 38px; box-shadow: 0 28px 70px rgba(16,185,129,.25);
          transition:.35s;
        }
        .employee-card:hover { transform: translateY(-6px); box-shadow: 0 40px 90px rgba(16,185,129,.3); }
        .slide-in { animation: slideUp .6s ease; }
        @keyframes slideUp { from{opacity:0; transform: translateY(25px);} to{opacity:1; transform: translateY(0);} }

        .employee-header { text-align:center; margin-bottom: 32px; }
        .employee-icon {
          width: 70px; height: 70px; border-radius: 22px;
          background: linear-gradient(135deg,#34d399,#10b981);
          color:#fff; display:flex; align-items:center; justify-content:center;
          margin: 0 auto 14px; font-size:30px; box-shadow: 0 14px 30px rgba(16,185,129,.4);
        }
        .employee-header h2 { margin:0; font-size:1.7rem; font-weight:900; color:#064e3b; }
        .employee-header p { margin-top:6px; font-size:.95rem; color:#065f46; }

        .employee-form { display:flex; flex-direction: column; gap: 18px; }
        .emp-input{ position:relative; }
        .emp-icon{
          position:absolute; left:16px; top:50%; transform: translateY(-50%);
          color:#10b981; font-size:.95rem;
        }
        .emp-input input{
          width:100%; box-sizing:border-box;
          padding: 16px 16px 16px 48px; border-radius:14px;
          border: 1.6px solid #d1fae5; font-size:.95rem;
          background:#f0fdf4; outline:none; transition:.25s;
        }
        .emp-input input:focus{
          background:#fff; border-color:#10b981;
          box-shadow: 0 0 0 4px rgba(16,185,129,.18);
        }
        .emp-btn{
          margin-top: 10px; padding: 16px; border-radius:14px; border:none;
          background: linear-gradient(135deg,#34d399,#10b981);
          color:#fff; font-weight:900; font-size:1rem; cursor:pointer; transition:.3s;
          box-shadow: 0 14px 32px rgba(16,185,129,.45);
        }
        .emp-btn:hover{ transform: translateY(-2px); filter: brightness(1.05); }
        .emp-btn:disabled{ background:#a7f3d0; box-shadow:none; cursor:not-allowed; }

        .employee-footer{ margin-top: 26px; text-align:center; font-size:.9rem; color:#065f46; }
        .employee-footer a{
          margin-left:6px; color:#10b981; font-weight:900; text-decoration:none;
          display:inline-flex; align-items:center; gap:6px;
        }
        .hr-link{ margin-top: 10px; font-size:.85rem; }

        @media(max-width:480px){
          .employee-card{ padding: 34px 22px; border-radius:0; box-shadow:none; }
          .employee-login-page{ padding:0; background:#fff; }
        }
      `}</style>
    </div>
  );
};

export default EmployeeLogin;

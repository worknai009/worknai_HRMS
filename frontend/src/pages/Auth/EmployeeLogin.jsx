import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaEnvelope,
  FaLock,
  FaArrowRight,
  FaLeaf
} from "react-icons/fa";

import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  /* ---------------- Handlers ---------------- */
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return toast.warning("Please enter email & password");
    }

    setLoading(true);
    try {
      const res = await API.post("/auth/login", form);
      const { user, token } = res.data;

      if (!token || !user) {
        throw new Error("Invalid server response");
      }

      localStorage.setItem("token", token);
      setUser(user);

      toast.success(`Welcome ${user.name.split(" ")[0]} 🌱`);

      // ✅ Role-based redirect
      if (user.role === "Admin") {
        navigate("/hr/dashboard");
      } else {
        navigate("/employee/dashboard");
      }

    } catch (err) {
      const msg =
        err.response?.data?.message || "Invalid employee credentials";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="employee-login-page">
      <div className="employee-card slide-in">

        {/* Header */}
        <div className="employee-header">
          <div className="employee-icon">
            <FaLeaf />
          </div>
          <h2>Employee Portal</h2>
          <p>Simple • Secure • Smart Work Access</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="employee-form">
          <div className="emp-input">
            <FaEnvelope className="emp-icon" />
            <input
              type="email"
              name="email"
              placeholder="Work email"
              onChange={handleChange}
              required
            />
          </div>

          <div className="emp-input">
            <FaLock className="emp-icon" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
          </div>

          <button className="emp-btn" disabled={loading}>
            {loading ? "Signing you in..." : "Login to Work"}
          </button>
        </form>

        {/* Footer */}
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

      {/* ---------------- CSS ---------------- */}
      <style>{`
        .employee-login-page {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          background: linear-gradient(135deg,#ecfdf5,#d1fae5);
          padding: 20px;
        }

        .employee-card {
          width: 100%;
          max-width: 430px;
          background: #ffffff;
          border-radius: 24px;
          padding: 46px 38px;
          box-shadow: 0 28px 70px rgba(16,185,129,.25);
          transition: .35s;
        }

        .employee-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 40px 90px rgba(16,185,129,.3);
        }

        .slide-in {
          animation: slideUp .6s ease;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(25px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .employee-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .employee-icon {
          width: 70px;
          height: 70px;
          border-radius: 22px;
          background: linear-gradient(135deg,#34d399,#10b981);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          font-size: 30px;
          box-shadow: 0 14px 30px rgba(16,185,129,.4);
        }

        .employee-header h2 {
          margin: 0;
          font-size: 1.7rem;
          font-weight: 800;
          color: #064e3b;
        }

        .employee-header p {
          margin-top: 6px;
          font-size: .95rem;
          color: #065f46;
        }

        .employee-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .emp-input {
          position: relative;
        }

        .emp-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #10b981;
          font-size: .95rem;
        }

        .emp-input input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border-radius: 14px;
          border: 1.6px solid #d1fae5;
          font-size: .95rem;
          background: #f0fdf4;
          outline: none;
          transition: .25s;
          box-sizing: border-box;
        }

        .emp-input input:focus {
          background: #ffffff;
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16,185,129,.18);
        }

        .emp-btn {
          margin-top: 10px;
          padding: 16px;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg,#34d399,#10b981);
          color: #ffffff;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: .3s;
          box-shadow: 0 14px 32px rgba(16,185,129,.45);
        }

        .emp-btn:hover {
          transform: translateY(-2px);
          filter: brightness(1.05);
        }

        .emp-btn:disabled {
          background: #a7f3d0;
          box-shadow: none;
          cursor: not-allowed;
        }

        .employee-footer {
          margin-top: 30px;
          text-align: center;
          font-size: .9rem;
          color: #065f46;
        }

        .employee-footer a {
          margin-left: 6px;
          color: #10b981;
          font-weight: 700;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .hr-link {
          margin-top: 10px;
          font-size: .85rem;
        }

        @media (max-width: 480px) {
          .employee-card {
            padding: 34px 22px;
            border-radius: 0;
            box-shadow: none;
          }
          .employee-login-page {
            padding: 0;
            background: #ffffff;
          }
        }
      `}</style>
    </div>
  );
};

export default EmployeeLogin;

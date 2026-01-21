import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { FaUserShield, FaLock, FaFingerprint, FaCircleNotch, FaKey, FaEye, FaEyeSlash } from "react-icons/fa";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";

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
      <div className="card">
        <div className="head">
          <div className="ic">
            <FaUserShield />
          </div>
          <h2>Super Admin</h2>
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

          <button className="btn" disabled={loading}>
            {loading ? (
              <>
                <FaCircleNotch className="spin" /> VERIFYING...
              </>
            ) : (
              <>
                <FaKey /> UNLOCK SYSTEM
              </>
            )}
          </button>

          <div className="foot">SECURE ENVIRONMENT • IP LOGGED</div>
        </form>
      </div>

      <style>{`
        :root{
          --bg:#f8fafc;--card:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0;
          --shadow:0 18px 55px rgba(15,23,42,.10);
          --primary:#2563eb;--primary2:#1d4ed8;
        }
        .page{min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);padding:18px;font-family:'Inter',sans-serif;color:var(--text)}
        .card{width:100%;max-width:420px;background:var(--card);border:1px solid var(--border);border-radius:22px;box-shadow:var(--shadow);padding:34px}
        .head{text-align:center;margin-bottom:22px}
        .ic{
          width:64px;height:64px;border-radius:18px;margin:0 auto 14px;
          background:linear-gradient(135deg,var(--primary),#60a5fa);color:#fff;
          display:flex;align-items:center;justify-content:center;font-size:28px;
          box-shadow:0 18px 35px rgba(37,99,235,.18);
        }
        .head h2{margin:0;font-size:1.35rem;font-weight:900}
        .head p{margin:6px 0 0;color:var(--muted);font-weight:700;font-size:.9rem}
        .form{display:flex;flex-direction:column;gap:16px}
        .fg label{display:block;margin-bottom:8px;color:#475569;font-weight:900;font-size:.72rem;letter-spacing:1px}
        .inp{position:relative}
        .fi{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#94a3b8}
        .inp input{
          width:100%;box-sizing:border-box;padding:14px 44px 14px 44px;border-radius:14px;
          border:1px solid var(--border);outline:none;font-size:.95rem;background:#fff;
        }
        .inp input:focus{border-color:rgba(37,99,235,.45);box-shadow:0 0 0 4px rgba(37,99,235,.12)}
        .eye{
          position:absolute;right:10px;top:50%;transform:translateY(-50%);
          border:none;background:transparent;color:#94a3b8;cursor:pointer;padding:8px;border-radius:10px
        }
        .eye:hover{background:#f1f5f9;color:var(--primary)}
        .btn{
          margin-top:4px;border:none;border-radius:14px;padding:14px;
          background:var(--primary);color:#fff;font-weight:900;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:10px;
          transition:.2s;box-shadow:0 18px 35px rgba(37,99,235,.18);
          letter-spacing:.7px;
        }
        .btn:hover{background:var(--primary2);transform:translateY(-1px)}
        .btn:disabled{background:#94a3b8;cursor:not-allowed;transform:none;box-shadow:none}
        .spin{animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .foot{
          margin-top:6px;text-align:center;color:var(--muted);font-weight:800;font-size:.72rem;
          letter-spacing:1px;padding-top:12px;border-top:1px solid #f1f5f9;
        }
        @media(max-width:480px){
          .page{padding:0}
          .card{border-radius:0;min-height:100vh;max-width:100%;box-shadow:none;border:none;display:flex;flex-direction:column;justify-content:center}
        }
      `}</style>
    </div>
  );
};

export default SuperAdminLogin;

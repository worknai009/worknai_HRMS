// frontend/src/context/AuthContext.jsx
import React, { createContext, useEffect, useMemo, useState, useContext } from "react";
import { clearAuthStorage } from "../services/api";
import { safeJsonParse, isTokenExpired, buildUserFromToken } from "../utils/authUtils";

const AuthContext = createContext();

const canonRole = (role = "") => {
  const r = String(role || "").trim().toLowerCase();
  if (!r) return "";

  // Super Admin
  if (["superadmin", "super-admin", "super_admin", "root"].includes(r)) return "SuperAdmin";

  // Company Owner
  if (["companyadmin", "company-admin", "company_admin", "companyowner", "company-owner"].includes(r)) {
    return "CompanyAdmin";
  }

  // HR / Admin
  if (["admin", "hr", "hradmin", "hr-admin", "hr_admin", "manager"].includes(r)) return "Admin";

  // Employee
  if (["employee", "emp"].includes(r)) return "Employee";

  // fallback
  return role;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const bootstrap = () => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    if (isTokenExpired(token)) {
      clearAuthStorage();
      setUser(null);
      setLoading(false);
      return;
    }

    const parsedUser = storedUser ? safeJsonParse(storedUser) : null;

    // ✅ IMPORTANT: user from storage should override token payload if conflict
    const fromToken = buildUserFromToken(token, {});
    const merged = { ...fromToken, ...(parsedUser || {}) };

    const normalized = { ...merged, role: canonRole(merged?.role) };
    localStorage.setItem("user", JSON.stringify(normalized));
    setUser(normalized);
    setLoading(false);
  };

  useEffect(() => {
    bootstrap();

    const onStorage = (e) => {
      if (e.key === "logout_event") {
        setUser(null);
        return;
      }
      if (e.key === "token" || e.key === "user") {
        bootstrap();
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = ({ token, user }) => {
    if (token) localStorage.setItem("token", token);

    // ✅ IMPORTANT: server response user should override token payload if conflict
    const fromToken = token ? buildUserFromToken(token, {}) : {};
    const merged = { ...fromToken, ...(user || {}) };

    if (merged) {
      const normalized = { ...merged, role: canonRole(merged.role) };
      localStorage.setItem("user", JSON.stringify(normalized));
      setUser(normalized);
    } else {
      setUser(null);
    }
  };

  const logout = (redirectTo = "/") => {
    clearAuthStorage();
    setUser(null);
    window.location.assign(redirectTo);
  };

  const value = useMemo(() => ({ user, setUser, login, logout, loading }), [user, loading]);

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        width: "100vw",
        background: "radial-gradient(circle at top left, #0f172a, #050714)",
        display: "grid",
        placeItems: "center",
        color: "#fff",
        fontFamily: "'Inter', sans-serif"
      }}>
        <div style={{ textAlign: "center" }}>
          <div className="pro-loader">
            <div className="loader-ring"></div>
            <div className="loader-ring-outer"></div>
            <div className="loader-check">W</div>
          </div>
          <div style={{
            marginTop: 24,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: "uppercase",
            fontSize: 14,
            background: "linear-gradient(90deg, #50c8ff, #a78bfa, #e879f9)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "pulse 2s ease-in-out infinite"
          }}>
            Authenticating
          </div>
          <div style={{ opacity: 0.4, fontSize: 11, fontWeight: 700, marginTop: 8, letterSpacing: 1 }}>
            SECURE ACCESS GATEWAY
          </div>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.7; transform: scale(0.98); }
          }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
          
          .pro-loader { position: relative; width: 80px; height: 80px; margin: 0 auto; display: grid; place-items: center; }
          .loader-ring {
            position: absolute; inset: 0;
            border: 3px solid transparent;
            border-top-color: #50c8ff;
            border-radius: 50%;
            animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
          }
          .loader-ring-outer {
            position: absolute; inset: -8px;
            border: 2px dashed rgba(167, 139, 250, 0.3);
            border-radius: 50%;
            animation: spin-rev 8s linear infinite;
          }
          .loader-check {
            font-size: 24px; font-weight: 950; color: #50c8ff; 
            text-shadow: 0 0 15px rgba(80, 200, 255, 0.5);
            font-family: 'Outfit', sans-serif;
          }
        `}</style>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

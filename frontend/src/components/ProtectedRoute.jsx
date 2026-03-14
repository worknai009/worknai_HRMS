// frontend/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const canonRole = (role = "") => {
  const r = String(role || "").trim().toLowerCase();
  if (!r) return "";

  if (["superadmin", "super-admin", "super_admin", "root"].includes(r)) return "SuperAdmin";
  if (["companyadmin", "company-admin", "company_admin", "companyowner", "company-owner"].includes(r))
    return "CompanyAdmin";
  if (["admin", "hr", "hradmin", "hr-admin", "hr_admin", "manager"].includes(r)) return "Admin";
  if (["employee", "emp"].includes(r)) return "Employee";

  return role;
};

const ProtectedRoute = ({ allowedRoles, redirectUnauthorizedTo = "/unauthorized" }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const token = localStorage.getItem("token");

  if (loading) {
    return (
      <div style={{ height: "100vh", background: "#050714", display: "grid", placeItems: "center", color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spin-dash" style={{ width: 40, height: 40, border: "3px solid rgba(80, 200, 255, 0.1)", borderTopColor: "#50c8ff", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }}></div>
          <div style={{ fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", fontSize: 13, background: "linear-gradient(90deg, #50c8ff, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Initialising Access</div>
          <div style={{ opacity: 0.5, fontSize: 11, fontWeight: 700, marginTop: 4 }}>Securing your environment...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ✅ token hai but user null -> show restoring (instead of letting route open blindly)
  if (!user) {
    return (
      <div style={{ height: "100vh", background: "#050714", display: "grid", placeItems: "center", color: "#fff" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spin-dash" style={{ width: 40, height: 40, border: "3px solid rgba(167, 139, 250, 0.1)", borderTopColor: "#a78bfa", borderRadius: "50%", margin: "0 auto 16px", animation: "spin 0.8s linear infinite" }}></div>
          <div style={{ fontWeight: 900, letterSpacing: 1, textTransform: "uppercase", fontSize: 13, background: "linear-gradient(90deg, #a78bfa, #e879f9)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Restoring Session</div>
          <div style={{ opacity: 0.5, fontSize: 11, fontWeight: 700, marginTop: 4 }}>Synchronizing profile data...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = canonRole(user.role);
    const allow = allowedRoles.map(canonRole);
    if (!allow.includes(userRole)) {
      return <Navigate to={redirectUnauthorizedTo} replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;

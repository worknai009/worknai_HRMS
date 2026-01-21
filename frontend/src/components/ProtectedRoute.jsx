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
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800 }}>Loading Access…</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>Please wait</div>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // ✅ token hai but user null -> show restoring (instead of letting route open blindly)
  if (!user) {
    return (
      <div style={{ height: "100vh", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 800 }}>Restoring session…</div>
          <div style={{ opacity: 0.7, fontSize: 12 }}>Refreshing user profile</div>
        </div>
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

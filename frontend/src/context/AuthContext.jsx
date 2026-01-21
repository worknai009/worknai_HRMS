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

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

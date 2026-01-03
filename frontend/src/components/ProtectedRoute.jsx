import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
        Loading Access...
      </div>
    );
  }

  // Not logged in -> Redirect to Home
  if (!user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Role Check
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If role doesn't match, send to home instead of login loop
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div style={{ 
      minHeight: "100vh", background: "radial-gradient(circle at top left, #0f172a, #050714)", 
      display: "grid", placeItems: "center", padding: 20, color: "#fff" 
    }}>
      <div style={{
        maxWidth: 500,
        width: "100%",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 28,
        padding: 40,
        boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
        background: "rgba(13, 17, 34, 0.8)",
        backdropFilter: "blur(20px)",
        textAlign: "center"
      }}>
        <div style={{ 
          width: 60, height: 60, borderRadius: "50%", background: "rgba(239, 68, 68, 0.1)", 
          display: "grid", placeItems: "center", margin: "0 auto 20px", color: "#ef4444", fontSize: 24,
          border: "1px solid rgba(239,68,68,0.2)"
        }}>
          ⚠️
        </div>
        <h2 style={{ 
          margin: 0, fontSize: 28, fontWeight: 900, 
          background: "linear-gradient(90deg, #fff, rgba(255,255,255,0.7))", 
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" 
        }}>Access Denied</h2>
        <p style={{ opacity: 0.5, marginTop: 12, fontSize: 15, fontWeight: 600, lineHeight: 1.6 }}>
          You don’t have the required permissions to view this terminal. Please re-authenticate with an authorized role.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", marginTop: 30 }}>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              padding: "12px 24px",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff",
              background: "rgba(255,255,255,0.05)",
              fontWeight: 800,
              fontSize: 14,
              transition: "0.3s"
            }}
          >
            Terminal Home
          </Link>

          <Link
           to="/admin-login"
            style={{
              textDecoration: "none",
              padding: "12px 24px",
              borderRadius: 14,
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              color: "#fff",
              fontWeight: 900,
              fontSize: 14,
              boxShadow: "0 10px 20px rgba(59, 130, 246, 0.3)",
              transition: "0.3s"
            }}
          >
            Secure Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

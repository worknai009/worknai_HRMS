import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 20 }}>
      <div style={{
        maxWidth: 520,
        width: "100%",
        border: "1px solid rgba(0,0,0,0.08)",
        borderRadius: 18,
        padding: 18,
        boxShadow: "0 12px 30px rgba(0,0,0,0.06)",
        background: "#fff"
      }}>
        <h2 style={{ margin: 0, letterSpacing: -0.2 }}>Unauthorized</h2>
        <p style={{ opacity: 0.75, marginTop: 6 }}>
          You don’t have access to this page. Please login with the correct role.
        </p>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
          <Link
            to="/"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              color: "#111",
              background: "#fff",
              fontWeight: 700
            }}
          >
            Go Home
          </Link>

          <Link
           to="/admin-login"
            style={{
              textDecoration: "none",
              padding: "10px 14px",
              borderRadius: 12,
              background: "#111",
              color: "#fff",
              fontWeight: 800,
              border: "1px solid rgba(0,0,0,0.12)",
            }}
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

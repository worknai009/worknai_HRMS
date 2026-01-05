import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaUserShield,
  FaBuilding,
  FaUserTie,
  FaUserCircle,
  FaHandshake,
  FaSignOutAlt,
  FaShieldAlt,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // 1. Scroll Effect Logic
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 2. ✅ AUTO LOGOUT ON REFRESH LOGIC
  // Jaise hi user page refresh karega ya tab band karega, logout trigger hoga.
  useEffect(() => {
    const handleRefresh = () => {
      if (user) {
        logout(); // Context se logout function call karein
      }
    };

    // 'beforeunload' event tab fire hota hai jab page refresh ya close ho raha ho
    window.addEventListener("beforeunload", handleRefresh);

    return () => {
      window.removeEventListener("beforeunload", handleRefresh);
    };
  }, [user, logout]);

  const isActive = (path) => (location.pathname === path ? "active" : "");

  // ✅ Helper function to close menu on mobile when a link is clicked
  const closeMenu = () => setMenuOpen(false);

  const goDashboard = () => {
    closeMenu(); // Close menu first
    if (!user) return;
    if (user.role === "SuperAdmin") navigate("/superadmin/dashboard");
    else if (user.role === "CompanyAdmin") navigate("/company/dashboard");
    else if (user.role === "Admin") navigate("/hr/dashboard");
    else navigate("/employee/dashboard");
  };

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        {/* LOGO */}
        <Link to="/" className="logo" onClick={closeMenu}>
          <div className="logo-icon">
            <FaShieldAlt />
          </div>
          <span>
            SMART<span>HRMS</span>
          </span>
        </Link>

        {/* MENU ITEMS */}
        <ul className={`menu ${menuOpen ? "open" : ""}`}>
          <li>
            <Link className={isActive("/")} to="/" onClick={closeMenu}>
              Home
            </Link>
          </li>
          <li>
            <Link
              className={isActive("/features")}
              to="/features"
              onClick={closeMenu}
            >
              Features
            </Link>
          </li>
          <li>
            <Link
              className={isActive("/services")}
              to="/services"
              onClick={closeMenu}
            >
              Services
            </Link>
          </li>
          <li>
            <Link
              className={isActive("/about")}
              to="/about"
              onClick={closeMenu}
            >
              About
            </Link>
          </li>
          <li>
            <Link
              className={isActive("/contact")}
              to="/contact"
              onClick={closeMenu}
            >
              Contact
            </Link>
          </li>

          {/* ✅ MOBILE ONLY: Partner Link inside Menu */}
          <li className="mobile-partner-item">
            <Link
              to="/partner-with-us"
              onClick={closeMenu}
              className="mobile-partner-link"
            >
              <FaHandshake /> Partner With Us
            </Link>
          </li>
        </ul>

        {/* RIGHT ACTIONS */}
        <div className="actions">
          {/* ✅ DESKTOP ONLY: Partner Button */}
          <Link to="/partner-with-us" className="partner-btn desktop-only">
            <FaHandshake /> Partner
          </Link>

          {user ? (
            <div className="user-actions">
              <button className="dashboard-btn" onClick={goDashboard}>
                <FaUserCircle /> <span className="dash-text">Dashboard</span>
              </button>
              <button
                className="logout-btn"
                onClick={() => {
                  logout();
                  closeMenu();
                }}
                title="Logout"
              >
                <FaSignOutAlt />
              </button>
            </div>
          ) : (
            <div className="login-dropdown">
              <span className="login-trigger">Login</span>
              <div className="dropdown-content">
                <Link to="/employee-login" onClick={closeMenu}>
                  <FaUserCircle /> Employee
                </Link>
                <Link to="/admin-login" onClick={closeMenu}>
                  <FaUserTie /> HR Admin
                </Link>
                <Link to="/company-login" onClick={closeMenu}>
                  <FaBuilding /> Company
                </Link>
                <div className="divider" />
                <Link to="/super-admin-login" onClick={closeMenu}>
                  <FaUserShield /> Super Admin
                </Link>
              </div>
            </div>
          )}

          {/* HAMBURGER TOGGLE */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* ================= CSS STYLES ================= */}
      <style>{`
        /* --- 1. BASE NAVBAR STYLES --- */
        .navbar {
          position: fixed;
          top: 0;
          width: 100%;
          height: 80px;
          z-index: 1000;
          transition: all 0.3s ease;
          background: transparent;
        }

        .navbar.scrolled {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          height: 70px;
        }

        .nav-container {
          max-width: 1400px;
          margin: auto;
          height: 100%;
          padding: 0 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* --- 2. LOGO --- */
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 1.5rem;
          text-decoration: none;
          color: #0f172a;
          letter-spacing: -0.5px;
          z-index: 1001; /* Ensure logo is above mobile menu */
        }

        .logo-icon {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff;
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.3);
        }

        .logo span span { color: #2563eb; }

        /* --- 3. DESKTOP MENU --- */
        .menu {
          display: flex;
          gap: 30px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .menu a {
          text-decoration: none;
          font-weight: 600;
          color: #64748b;
          transition: 0.2s;
          font-size: 0.95rem;
          position: relative;
        }

        .menu a:hover,
        .menu a.active {
          color: #2563eb;
        }

        .mobile-partner-item { display: none; } /* Hidden on desktop */

        /* --- 4. ACTIONS & BUTTONS --- */
        .actions {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        /* Partner Button (Desktop) */
        .partner-btn {
          border: 1.5px solid #2563eb;
          padding: 8px 20px;
          border-radius: 50px;
          text-decoration: none;
          color: #2563eb;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: 0.2s;
          font-size: 0.9rem;
        }
        .partner-btn:hover {
          background: #eff6ff;
          transform: translateY(-1px);
        }

        /* User Dashboard Buttons */
        .user-actions { display: flex; align-items: center; gap: 10px; }

        .dashboard-btn {
          background: #0f172a;
          color: #fff;
          border: none;
          padding: 9px 18px;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          gap: 8px;
          align-items: center;
          font-size: 0.9rem;
          transition: 0.2s;
        }
        .dashboard-btn:hover { background: #1e293b; transform: translateY(-1px); }

        .logout-btn {
          background: #fee2e2;
          color: #dc2626;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.2s;
        }
        .logout-btn:hover { background: #fecaca; }

        /* --- 5. LOGIN DROPDOWN --- */
        .login-dropdown {
          position: relative;
          z-index: 1002;
        }

        .login-trigger {
          background: #2563eb;
          color: #fff;
          padding: 9px 24px;
          border-radius: 50px;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.9rem;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
          transition: 0.2s;
          display: inline-block;
        }
        .login-trigger:hover { background: #1d4ed8; transform: translateY(-1px); }

        .dropdown-content {
          position: absolute;
          top: 140%; /* Spacing from button */
          right: 0;
          background: #fff;
          min-width: 220px;
          border-radius: 14px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all 0.2s ease-in-out;
          padding: 8px;
          border: 1px solid #f1f5f9;
        }

        /* Show dropdown on hover */
        .login-dropdown:hover .dropdown-content {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-content a {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 12px 15px;
          font-weight: 600;
          text-decoration: none;
          color: #475569;
          border-radius: 10px;
          font-size: 0.9rem;
          transition: 0.2s;
        }

        .dropdown-content a:hover {
          background: #f8fafc;
          color: #2563eb;
        }

        .divider {
          height: 1px;
          background: #e2e8f0;
          margin: 6px 0;
        }

        /* --- 6. HAMBURGER ICON --- */
        .hamburger {
          display: none;
          font-size: 1.6rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #1e293b;
          z-index: 1002;
        }

        /* ================= MOBILE RESPONSIVE STYLES ================= */
        @media (max-width: 1024px) {
          .hamburger { display: block; }
          .desktop-only { display: none !important; } /* Hide Desktop Partner Btn */
          
          .mobile-partner-item { display: block; margin-top: 15px; } /* Show in menu */
          .mobile-partner-link {
             background: #eff6ff;
             color: #2563eb !important;
             padding: 12px 20px !important;
             border-radius: 12px;
             display: flex;
             align-items: center;
             justify-content: center;
             gap: 8px;
             text-align: center;
          }

          .menu {
            position: fixed;
            top: 0;
            right: 0;
            background: #ffffff;
            width: 280px;
            height: 100vh;
            flex-direction: column;
            padding: 100px 30px 40px; /* Top padding clears logo area */
            gap: 20px;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -10px 0 30px rgba(0,0,0,0.05);
            z-index: 999; /* Below Hamburger/Logo */
          }

          .menu.open {
            transform: translateX(0);
          }

          .menu a {
            font-size: 1.1rem;
            display: block;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 10px;
          }
          
          .dash-text { display: none; } /* Hide text on small mobile, show icon only */
          .dashboard-btn { padding: 10px; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;

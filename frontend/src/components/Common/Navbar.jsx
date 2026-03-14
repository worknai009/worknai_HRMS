import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import worknaiLogo from "../../assets/worknai logo.png";
import {
  FaBars,
  FaTimes,
  FaUserCircle,
  FaHandshake,
  FaSignOutAlt,
  FaChevronDown,
} from "react-icons/fa";

import { useAuth } from "../../context/AuthContext";
import { PUBLIC_NAV, ROLE_NAV } from "../../config/navConfig";

// Helper to determine if we show the Role Menu or Public Menu
const isDashboardPath = (pathname) => {
  const p = pathname || "";
  return (
    p.startsWith("/superadmin") ||
    p.startsWith("/super-admin") ||
    p.startsWith("/company") ||
    p.startsWith("/hr") ||
    p.startsWith("/employee")
  );
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Scroll Effect Logic
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setMenuOpen(false);
    setRoleMenuOpen(false);
  }, [location.pathname]);

  // ✅ Prevent Background Scroll when menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    // Cleanup on unmount
    return () => { document.body.style.overflow = "unset"; };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const goDashboard = () => {
    closeMenu();
    if (!user) return;
    if (user.role === "SuperAdmin") navigate("/superadmin/dashboard");
    else if (user.role === "CompanyAdmin") navigate("/company/dashboard");
    else if (user.role === "Admin") navigate("/hr/dashboard");
    else navigate("/employee/dashboard");
  };

  const showRoleNav = !!user && isDashboardPath(location.pathname);

  const roleLinks = useMemo(() => {
    if (!user?.role) return [];
    return ROLE_NAV[user.role] || [];
  }, [user?.role]);

  // ✅ Combine Public Nav with Careers and Partner Links explicitly
  const publicLinks = [
    { label: "Home", to: "/" },
    { label: "Features", to: "/features" },
    { label: "Services", to: "/services" },
    { label: "About", to: "/about" },
    { label: "Free Demo", to: "/contact" },
    { label: "Partner", to: "/partner-with-us" },
    { label: "Careers", to: "/careers" }
  ];


  // If on a dashboard page, show role links in mobile menu, else show public links
  const mobileMenuLinks = showRoleNav ? roleLinks : publicLinks;
  const desktopTopLinks = publicLinks;

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="nav-container">
        {/* LOGO */}
        <Link to="/" className="logo" onClick={closeMenu}>
          <img src={worknaiLogo} alt="WorknAI HRMS Logo" className="logo-img" />
          <span className="logo-text">
            WorknAi <span>HRMS</span>
          </span>
        </Link>

        {/* MOBILE OVERLAY / BACKDROP */}
        {menuOpen && (
          <div className="nav-overlay" onClick={closeMenu} />
        )}

        {/* DESKTOP MENU (Public) */}
        {/* MOBILE MENU DROPDOWN */}
        <ul className={`menu ${menuOpen ? "open" : ""}`}>
          {(menuOpen && showRoleNav ? roleLinks : desktopTopLinks).map((item) => (
            <li key={item.to}>
              <Link className={isActive(item.to)} to={item.to} onClick={closeMenu}>
                {item.label}
              </Link>
            </li>
          ))}

        </ul>

        {/* RIGHT ACTIONS */}
        <div className="actions">
          {/* Desktop Partner */}
          {!user && (
            <Link to="/partner-with-us" className="partner-btn desktop-only">
              <FaHandshake /> Partner
            </Link>
          )}

          {user ? (
            <div className="user-actions">
              {showRoleNav && (
                <div className="roleMenuWrap">
                  <button
                    className="roleMenuBtn"
                    onClick={() => setRoleMenuOpen((v) => !v)}
                    type="button"
                  >
                    Menu <FaChevronDown />
                  </button>

                  {roleMenuOpen && (
                    <div className="roleMenu">
                      {roleLinks.map((x) => (
                        <Link key={x.to} to={x.to} className="roleItem" onClick={() => setRoleMenuOpen(false)}>
                          {x.icon ? React.createElement(x.icon) : null}
                          <span>{x.label}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button className="dashboard-btn" onClick={goDashboard}>
                <FaUserCircle /> <span className="dash-text">Dashboard</span>
              </button>

            </div>
          ) : (
            <>
              <div className="login-dropdown">
                <span className="login-trigger">Login</span>
                <div className="dropdown-content">
                  <Link to="/employee-login" onClick={closeMenu}><FaUserCircle /> Employee</Link>
                  <Link to="/admin-login" onClick={closeMenu}><FaUserCircle /> HR Admin</Link>
                  <Link to="/company-login" onClick={closeMenu}><FaUserCircle /> Company</Link>
                  <div className="divider" />
                  <Link to="/super-admin-login" onClick={closeMenu}><FaUserCircle /> Super Admin</Link>
                </div>
              </div>
            </>
          )}

          {/* HAMBURGER */}
          <button
            className={`hamburger ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle Menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      <style>{`
      /* ================= NAVBAR ================= */

        .navbar {
          position: fixed;
          top: 0;
          width: 100%;
          height: 70px;
          --nav-h: 70px; /* CSS Variable for sync */
          z-index: 1000;
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          background: rgba(5, 7, 20, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: none;
        }

        .navbar.scrolled {
          background: rgba(5, 7, 20, 0.97);
          height: 60px;
          --nav-h: 60px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(80, 200, 255, 0.06);
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

        /* Logo styles */
        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          color: #ffffff;
          position: relative;
          z-index: 1010; /* Ensure logo is above overlay */
        }

        .logo-img {
          width: 44px;
          height: 44px;
          object-fit: contain;
          border-radius: 10px;
          filter: drop-shadow(0 0 10px rgba(80, 200, 255, 0.35));
          transition: filter 0.3s;
        }

        .logo:hover .logo-img {
          filter: drop-shadow(0 0 18px rgba(140, 80, 255, 0.55));
        }

        .logo-text {
          font-weight: 900;
          font-size: 1.45rem;
          letter-spacing: -0.5px;
          white-space: nowrap;
          background: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .logo-text span {
          background: linear-gradient(90deg, #a78bfa, #e879f9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .menu {
          display: flex;
          gap: 32px;
          list-style: none;
          margin: 0;
          padding: 0;
          align-items: center;
        }

        .menu a {
          text-decoration: none;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.65);
          transition: 0.3s;
          font-size: 0.85rem; /* Smaller text on desktop */
          display: inline-flex;
          align-items: center;
          gap: 7px; /* Compact gap */
          letter-spacing: 0.02em;
          padding: 6px 0;
        }

        .menu a .mIcon {
          font-size: 0.88rem; /* Smaller icons on desktop */
          color: rgba(80, 200, 255, 0.8);
          transition: 0.3s;
        }

        .menu a:hover .mIcon {
          color: #50c8ff;
          transform: translateY(-1px);
        }

        .menu a:hover {
          color: #50c8ff;
          text-shadow: 0 0 12px rgba(80, 200, 255, 0.4);
        }

        .menu a.active { 
          color: #a78bfa;
          text-shadow: 0 0 12px rgba(167, 139, 250, 0.4);
        }

        .actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .partner-btn {
          border: 1.5px solid rgba(80, 200, 255, 0.4);
          padding: 9px 22px;
          border-radius: 50px;
          text-decoration: none;
          color: #50c8ff;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: 0.3s;
          font-size: 0.9rem;
        }

        .partner-btn:hover {
          background: rgba(80, 200, 255, 0.08);
          border-color: #50c8ff;
          box-shadow: 0 0 20px rgba(80, 200, 255, 0.2);
          color: #fff;
        }

        .dashboard-btn {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: #fff;
          border: none;
          padding: 10px 22px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          gap: 8px;
          align-items: center;
          transition: 0.3s;
          box-shadow: 0 8px 20px -4px rgba(80, 130, 255, 0.4);
        }

        .dashboard-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -4px rgba(140, 80, 255, 0.5);
        }

        .logout-btn {
          background: rgba(255,255,255,0.04);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.15);
          width: 44px;
          height: 44px;
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.3s;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.35);
        }

        .roleMenuWrap { position: relative; }

        .roleMenuBtn {
          background: rgba(80, 200, 255, 0.06);
          border: 1px solid rgba(80, 200, 255, 0.18);
          color: #fff;
          padding: 10px 16px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: 0.3s;
        }

        .roleMenu {
          position: absolute;
          top: calc(var(--nav-h) - 10px); /* Positioned exactly relative to navbar height */
          right: 0;
          width: 250px;
          background: #080d1e;
          border-radius: 18px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(80,200,255,0.07);
          padding: 10px;
          border: 1px solid rgba(80,200,255,0.07);
          backdrop-filter: blur(20px);
        }

        .roleItem {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          border-radius: 12px;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 600;
          transition: 0.2s;
        }

        .roleItem:hover {
          background: rgba(80, 200, 255, 0.08);
          color: #50c8ff;
        }

        .login-dropdown { 
          position: relative; 
          z-index: 1010; /* Keep above overlay when menu is open */
        }

        .login-trigger {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
          color: #fff;
          padding: 10px 28px;
          border-radius: 50px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.3s;
          box-shadow: 0 8px 20px -4px rgba(80, 130, 255, 0.45);
        }

        .login-trigger:hover { 
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -4px rgba(140, 80, 255, 0.55);
        }

        .dropdown-content {
          position: absolute;
          top: calc(var(--nav-h) - 10px); /* Attached to navbar bottom */
          right: 0;
          background: #080d1e;
          min-width: 240px;
          border-radius: 18px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(80,200,255,0.07);
          opacity: 0;
          visibility: hidden;
          transform: translateY(15px);
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          padding: 10px;
          border: 1px solid rgba(80,200,255,0.07);
          backdrop-filter: blur(24px);
        }

        .login-dropdown:hover .dropdown-content {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-content a {
          display: flex;
          gap: 12px;
          align-items: center;
          padding: 14px 16px;
          font-weight: 600;
          text-decoration: none;
          color: rgba(255, 255, 255, 0.7);
          border-radius: 12px;
          font-size: 0.92rem;
          transition: 0.2s;
        }

        .dropdown-content a:hover {
          background: rgba(167, 139, 250, 0.1);
          color: #a78bfa;
        }

        .divider {
          height: 1px;
          background: rgba(80,200,255,0.07);
          margin: 8px 0;
        }

        .hamburger {
          display: none;
          font-size: 1.8rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #ffffff;
          position: relative;
          z-index: 1010; /* Match logo z-index */
          transition: 0.3s;
        }

        .hamburger.active {
          color: #a78bfa;
        }

        /* MOBILE OVERLAY */
        .nav-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 900; /* Below navbar contents */
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @media (max-width: 1024px) {
          .hamburger { display: block; }

          .menu {
            position: fixed;
            top: var(--nav-h); /* Dynamically follows navbar height */
            right: 0;
            width: 300px;
            height: calc(100dvh - var(--nav-h)); 
            max-height: calc(100dvh - var(--nav-h));
            background: rgba(5, 7, 20, 0.98);
            flex-direction: column;
            padding: 30px 24px 100px;
            gap: 8px;
            transform: translateX(100%);
            transition: transform 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            box-shadow: -15px 0 40px rgba(0,0,0,0.6);
            backdrop-filter: blur(30px);
            z-index: 1000;
            display: flex;
            overflow-y: auto !important;
          }

          .menu.open { transform: translateX(0); }

          .menu a {
            font-size: 1.05rem; /* Reduced from 1.25rem for mobile */
            width: 100%;
            padding: 14px 0;
            border-bottom: 1px solid rgba(80, 200, 255, 0.05);
            color: rgba(255, 255, 255, 0.9);
            justify-content: center; 
            text-align: center;
            font-weight: 800;
          }

          .menu a .mIcon {
            color: #50c8ff;
            font-size: 1rem; /* Compact icon size */
            filter: drop-shadow(0 0 10px rgba(80, 200, 255, 0.2));
          }

          .menu a.active {
            color: #fff;
            background: linear-gradient(90deg, transparent, rgba(80, 200, 255, 0.1), transparent);
            border-bottom: 2px solid #50c8ff;
            text-shadow: 0 0 15px rgba(80, 200, 255, 0.6);
          }

          .desktop-only { display: none; }
          .logo-text { font-size: 1.25rem; }
          .logo-img { width: 38px; height: 38px; }
          .dash-text { display: none; }
          .dashboard-btn { padding: 12px; }
        }

        @media (max-width: 485px) {
          .nav-container { padding: 0 12px; }
          .logo { gap: 6px; }
          .logo-text { font-size: 1.1rem; }
          .logo-img { width: 34px; height: 34px; }
          .actions { gap: 12px; }
          .login-trigger { padding: 8px 18px; font-size: 0.9rem; }
          .hamburger { font-size: 1.6rem; }
          .menu { width: 100%; }
        }

        @media (max-width: 380px) {
          .nav-container { padding: 0 8px; }
          .logo-text { font-size: 0.95rem; }
          .logo-img { width: 28px; height: 28px; }
          .login-trigger { padding: 7px 14px; font-size: 0.8rem; }
          .actions { gap: 8px; }
          .hamburger { font-size: 1.4rem; }
        }

        @media (max-width: 340px) {
          .nav-container { padding: 0 6px; }
          .logo-text { font-size: 0.85rem; }
          .logo-img { width: 24px; height: 24px; }
          .logo-text span { display: none; } /* Hide 'HRMS' specifically for 320px */
          .login-trigger { padding: 6px 12px; font-size: 0.75rem; }
          .actions { gap: 6px; }
          .hamburger { font-size: 1.3rem; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
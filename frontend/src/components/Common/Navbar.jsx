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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path) => (location.pathname === path ? "active" : "");

  const goDashboard = () => {
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
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <div className="logo-icon">
            <FaShieldAlt />
          </div>
          <span>
            SMART<span>HRMS</span>
          </span>
        </Link>

        {/* DESKTOP MENU */}
        <ul className={`menu ${menuOpen ? "open" : ""}`}>
          <li><Link className={isActive("/")} to="/">Home</Link></li>
          <li><Link className={isActive("/features")} to="/features">Features</Link></li>
          <li><Link className={isActive("/services")} to="/services">Services</Link></li>
          <li><Link className={isActive("/about")} to="/about">About</Link></li>
          <li><Link className={isActive("/contact")} to="/contact">Contact</Link></li>
        </ul>

        {/* RIGHT ACTIONS */}
        <div className="actions">
          <Link to="/partner-with-us" className="partner">
            <FaHandshake /> Partner
          </Link>

          {user ? (
            <div className="user-actions">
              <button className="dashboard-btn" onClick={goDashboard}>
                <FaUserCircle /> Dashboard
              </button>
              <button className="logout-btn" onClick={logout}>
                <FaSignOutAlt />
              </button>
            </div>
          ) : (
            <div className="login-dropdown">
              <span>Login</span>
              <div className="dropdown">
                <Link to="/employee-login"><FaUserCircle /> Employee</Link>
                <Link to="/admin-login"><FaUserTie /> HR Admin</Link>
                <Link to="/company-login"><FaBuilding /> Company</Link>
                <div className="divider" />
                <Link to="/super-admin-login"><FaUserShield /> Super Admin</Link>
              </div>
            </div>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* ================= STYLES ================= */}
      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          width: 100%;
          height: 80px;
          z-index: 1000;
          transition: 0.3s ease;
          background: transparent;
        }

        .navbar.scrolled {
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
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

        /* LOGO */
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 1.4rem;
          text-decoration: none;
          color: #1e293b;
        }

        .logo-icon {
          background: #1a73e8;
          color: #fff;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo span span {
          color: #1a73e8;
        }

        /* MENU */
        .menu {
          display: flex;
          gap: 30px;
          list-style: none;
        }

        .menu a {
          text-decoration: none;
          font-weight: 600;
          color: #64748b;
          transition: 0.2s;
        }

        .menu a:hover,
        .menu a.active {
          color: #1a73e8;
        }

        /* ACTIONS */
        .actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .partner {
          border: 1.5px solid #1a73e8;
          padding: 8px 16px;
          border-radius: 50px;
          text-decoration: none;
          color: #1a73e8;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .user-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .dashboard-btn {
          background: #eff6ff;
          color: #1a73e8;
          border: none;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          gap: 6px;
          align-items: center;
        }

        .logout-btn {
          background: #fee2e2;
          color: #dc2626;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          cursor: pointer;
        }

        /* LOGIN DROPDOWN */
        .login-dropdown {
          position: relative;
          font-weight: 700;
          cursor: pointer;
        }

        .login-dropdown span {
          background: #0f172a;
          color: #fff;
          padding: 10px 18px;
          border-radius: 12px;
        }

        .dropdown {
          position: absolute;
          top: 55px;
          right: 0;
          background: #fff;
          min-width: 220px;
          border-radius: 14px;
          box-shadow: 0 15px 40px rgba(0,0,0,0.15);
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: 0.25s;
          padding: 8px;
        }

        .login-dropdown:hover .dropdown {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown a {
          display: flex;
          gap: 10px;
          align-items: center;
          padding: 12px;
          font-weight: 600;
          text-decoration: none;
          color: #475569;
          border-radius: 10px;
        }

        .dropdown a:hover {
          background: #f1f5f9;
          color: #1a73e8;
        }

        .divider {
          height: 1px;
          background: #e5e7eb;
          margin: 6px 0;
        }

        /* HAMBURGER */
        .hamburger {
          display: none;
          font-size: 1.6rem;
          background: none;
          border: none;
          cursor: pointer;
        }

        /* MOBILE */
        @media (max-width: 1024px) {
          .menu {
            position: fixed;
            top: 80px;
            right: 0;
            background: #fff;
            width: 260px;
            height: calc(100vh - 80px);
            flex-direction: column;
            padding: 40px 30px;
            gap: 25px;
            transform: translateX(100%);
            transition: 0.3s;
            box-shadow: -10px 0 30px rgba(0,0,0,0.05);
          }

          .menu.open {
            transform: translateX(0);
          }

          .hamburger {
            display: block;
          }

          .partner {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;

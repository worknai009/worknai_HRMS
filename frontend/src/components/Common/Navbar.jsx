import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaUserCircle,
  FaHandshake,
  FaSignOutAlt,
  FaShieldAlt,
  FaChevronDown,
  FaBriefcase // ✅ Added Icon for Careers
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

  // ✅ Combine Public Nav with Careers Link explicitly
  const publicLinks = [
    ...PUBLIC_NAV,
    { label: "Careers", to: "/careers", icon: FaBriefcase }
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
          <div className="logo-icon">
            <FaShieldAlt />
          </div>
          <span>
            SMART<span>HRMS</span>
          </span>
        </Link>

        {/* DESKTOP MENU (Public) */}
        <ul className={`menu ${menuOpen ? "open" : ""}`}>
          {/* On Mobile, if dashboard, show Dashboard Links. On Desktop, show Public Links */}
          {(menuOpen && showRoleNav ? roleLinks : desktopTopLinks).map((item) => (
            <li key={item.to}>
              <Link className={isActive(item.to)} to={item.to} onClick={closeMenu}>
                {"icon" in item && item.icon && menuOpen ? (
                  <span className="mIcon">{React.createElement(item.icon)}</span>
                ) : null}
                {item.label}
              </Link>
            </li>
          ))}

          {/* MOBILE ONLY: Partner Link inside Menu */}
          <li className="mobile-partner-item">
            <Link to="/partner-with-us" onClick={closeMenu} className="mobile-partner-link">
              <FaHandshake /> Partner With Us
            </Link>
          </li>
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
              {/* ✅ Desktop role-menu dropdown (only in dashboard area) */}
              {showRoleNav ? (
                <div className="roleMenuWrap">
                  <button
                    className="roleMenuBtn"
                    onClick={() => setRoleMenuOpen((v) => !v)}
                    type="button"
                  >
                    Menu <FaChevronDown />
                  </button>

                  {roleMenuOpen ? (
                    <div className="roleMenu">
                      {roleLinks.map((x) => (
                        <Link key={x.to} to={x.to} className="roleItem" onClick={() => setRoleMenuOpen(false)}>
                          {x.icon ? React.createElement(x.icon) : null}
                          <span>{x.label}</span>
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <button className="dashboard-btn" onClick={goDashboard}>
                <FaUserCircle /> <span className="dash-text">Dashboard</span>
              </button>

              <button
                className="logout-btn"
                onClick={() => logout("/")}
                title="Logout"
              >
                <FaSignOutAlt />
              </button>
            </div>
          ) : (
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
          )}

          {/* HAMBURGER */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      <style>{`
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

        .logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 800;
          font-size: 1.5rem;
          text-decoration: none;
          color: #0f172a;
          letter-spacing: -0.5px;
          z-index: 1001;
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

        .menu {
          display: flex;
          gap: 26px;
          list-style: none;
          margin: 0;
          padding: 0;
          align-items: center;
        }
        .menu a {
          text-decoration: none;
          font-weight: 700;
          color: #64748b;
          transition: 0.2s;
          font-size: 0.95rem;
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .menu a:hover,
        .menu a.active { color: #2563eb; }
        .mIcon{ display:inline-flex; align-items:center; opacity:0.9; }

        .actions {
          display: flex;
          align-items: center;
          gap: 15px;
          position: relative;
        }

        .partner-btn {
          border: 1.5px solid #2563eb;
          padding: 8px 20px;
          border-radius: 50px;
          text-decoration: none;
          color: #2563eb;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: 0.2s;
          font-size: 0.9rem;
        }
        .partner-btn:hover { background: #eff6ff; transform: translateY(-1px); }

        .user-actions { display: flex; align-items: center; gap: 10px; }

        .dashboard-btn {
          background: #0f172a;
          color: #fff;
          border: none;
          padding: 9px 18px;
          border-radius: 12px;
          font-weight: 800;
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

        /* Role Menu */
        .roleMenuWrap { position: relative; }
        .roleMenuBtn{
          background: #fff;
          border: 1px solid rgba(0,0,0,0.12);
          padding: 9px 12px;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 800;
          display:flex;
          align-items:center;
          gap: 8px;
        }
        .roleMenu{
          position: absolute;
          top: 120%;
          right: 0;
          width: 240px;
          background: #fff;
          border: 1px solid rgba(0,0,0,0.08);
          border-radius: 14px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.12);
          padding: 8px;
          z-index: 1100;
        }
        .roleItem{
          display:flex;
          align-items:center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 12px;
          text-decoration:none;
          color:#0f172a;
          font-weight: 700;
        }
        .roleItem:hover{ background: #f8fafc; color:#2563eb; }

        /* Login dropdown */
        .login-dropdown { position: relative; z-index: 1002; }
        .login-trigger {
          background: #2563eb;
          color: #fff;
          padding: 9px 24px;
          border-radius: 50px;
          font-weight: 900;
          cursor: pointer;
          font-size: 0.9rem;
          box-shadow: 0 4px 10px rgba(37, 99, 235, 0.25);
          transition: 0.2s;
          display: inline-block;
        }
        .login-trigger:hover { background: #1d4ed8; transform: translateY(-1px); }

        .dropdown-content {
          position: absolute;
          top: 140%;
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
          font-weight: 700;
          text-decoration: none;
          color: #475569;
          border-radius: 10px;
          font-size: 0.9rem;
          transition: 0.2s;
        }
        .dropdown-content a:hover { background: #f8fafc; color: #2563eb; }
        .divider { height: 1px; background: #e2e8f0; margin: 6px 0; }

        .hamburger {
          display: none;
          font-size: 1.6rem;
          background: none;
          border: none;
          cursor: pointer;
          color: #1e293b;
          z-index: 1002;
        }

        .mobile-partner-item { display: none; }

        @media (max-width: 1024px) {
          .hamburger { display: block; }
          .desktop-only { display: none !important; }
          .roleMenuWrap { display: none; } /* Hide desktop role dropdown on mobile */

          .mobile-partner-item { display: block; margin-top: 15px; }
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
            width: 300px;
            height: 100vh;
            flex-direction: column;
            padding: 100px 30px 40px;
            gap: 18px;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: -10px 0 30px rgba(0,0,0,0.05);
            z-index: 999;
            align-items: flex-start;
          }
          .menu.open { transform: translateX(0); }

          .menu a {
            font-size: 1.05rem;
            display: block;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 10px;
            width: 100%;
          }
          .dash-text { display: none; }
          .dashboard-btn { padding: 10px; }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaShieldAlt,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaArrowUp
} from 'react-icons/fa';

const Footer = () => {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <footer className="main-footer">
      <div className="footer-container">

        {/* BRAND */}
        <div className="footer-brand">
          <div className="brand-logo">
            <FaShieldAlt />
            <span>SMART<span>HRMS</span></span>
          </div>

          <p className="brand-desc">
            AI-powered biometric HRMS platform designed for
            secure attendance, workforce automation, and
            payroll excellence across modern enterprises.
          </p>

          <div className="social-links">
            <a href="#"><FaLinkedin /></a>
            <a href="#"><FaTwitter /></a>
            <a href="#"><FaFacebook /></a>
            <a href="#"><FaInstagram /></a>
          </div>
        </div>

        {/* LINKS */}
        <div className="footer-links">
          <h4>Platform</h4>
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/services">Services</Link>
          <Link to="/about">About Us</Link>
        </div>

        <div className="footer-links">
          <h4>Support</h4>
          <Link to="/contact">Contact</Link>
          <Link to="/register">Partner Program</Link>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms & Conditions</a>
        </div>

        {/* CONTACT */}
        <div className="footer-contact">
          <h4>Corporate Office</h4>
          <p><FaMapMarkerAlt /> Digital Park, Maharashtra, India</p>
          <p><FaPhoneAlt /> +91 98765 43210</p>
          <p><FaEnvelope /> skhandagle1233@gmail.com</p>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        <p>© 2025 SmartHRMS SaaS India. All rights reserved.</p>
        <button onClick={scrollToTop}><FaArrowUp /></button>
      </div>

      {/* STYLES */}
      <style>{`
        .main-footer {
          background: linear-gradient(180deg, #f8fafc, #eef2ff);
          color: #334155;
          padding: 70px 0 0;
          font-family: 'Inter', sans-serif;
        }

        .footer-container {
          width: 90%;
          max-width: 1300px;
          margin: auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1.5fr;
          gap: 40px;
          padding-bottom: 50px;
        }

        /* BRAND */
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.8rem;
          font-weight: 900;
          color: #0f172a;
        }
        .brand-logo svg { color: #2563eb; }
        .brand-logo span span { color: #2563eb; }

        .brand-desc {
          margin: 20px 0;
          font-size: 0.95rem;
          line-height: 1.7;
          color: #475569;
        }

        .social-links {
          display: flex;
          gap: 14px;
        }
        .social-links a {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #e0e7ff;
          color: #1e3a8a;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: 0.25s;
        }
        .social-links a:hover {
          background: #2563eb;
          color: #fff;
          transform: translateY(-3px);
        }

        /* LINKS */
        .footer-links h4,
        .footer-contact h4 {
          font-size: 1rem;
          font-weight: 800;
          margin-bottom: 18px;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        .footer-links a {
          display: block;
          margin-bottom: 10px;
          color: #475569;
          text-decoration: none;
          font-size: 0.95rem;
          transition: 0.2s;
        }
        .footer-links a:hover {
          color: #2563eb;
          padding-left: 5px;
        }

        /* CONTACT */
        .footer-contact p {
          display: flex;
          gap: 10px;
          align-items: center;
          margin-bottom: 14px;
          font-size: 0.95rem;
          color: #475569;
        }
        .footer-contact svg {
          color: #2563eb;
        }

        /* BOTTOM */
        .footer-bottom {
          background: #e0e7ff;
          padding: 18px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 90%;
          max-width: 1300px;
          margin: auto;
          border-radius: 16px 16px 0 0;
        }

        .footer-bottom p {
          font-size: 0.85rem;
          color: #334155;
          margin: 0;
          font-weight: 500;
        }

        .footer-bottom button {
          background: #2563eb;
          border: none;
          width: 42px;
          height: 42px;
          border-radius: 12px;
          color: #fff;
          cursor: pointer;
          transition: 0.3s;
        }
        .footer-bottom button:hover {
          background: #1e40af;
          transform: scale(1.08);
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .footer-container {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 600px) {
          .footer-container {
            grid-template-columns: 1fr;
            text-align: center;
          }
          .brand-logo,
          .social-links,
          .footer-contact p {
            justify-content: center;
          }
          .footer-bottom {
            flex-direction: column;
            gap: 15px;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;

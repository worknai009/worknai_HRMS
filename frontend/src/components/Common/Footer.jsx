import React from 'react';
import { Link } from 'react-router-dom';
import worknaiLogo from "../../assets/worknai logo.png";
import {
  FaShieldAlt,
  FaLinkedin,
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
            <img src={worknaiLogo} alt="WorknAI Logo" className="footer-logo-img" />
            <span className="logo-text">WorknAi <span>HRMS</span></span>
          </div>

          <p className="brand-desc">
            Advanced AI-powered biometric HRMS platform designed for
            secure attendance, workforce automation, and
            payroll excellence.
          </p>

          <div className="social-links">
            <a href="https://www.linkedin.com/in/worknai-technical-8830973b6?utm_source=share_via&utm_content=profile&utm_medium=member_android" target="_blank" rel="noreferrer"><FaLinkedin /></a>
            <a href="https://www.instagram.com/worknai_institute_center?igsh=M2h4dmpicXp1OTBz" target="_blank" rel="noreferrer"><FaInstagram /></a>
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
          <Link to="/partner-with-us">Partner Program</Link>
          <span style={{ cursor: 'pointer', color: '#475569' }}>Privacy Policy</span>
          <span style={{ cursor: 'pointer', color: '#475569' }}>Terms & Conditions</span>
        </div>

        {/* CONTACT */}
        <div className="footer-contact">
          <h4>Corporate Office</h4>
          <p><FaMapMarkerAlt /> WorknAi Technology, Office No. 312, Sai Millennium, Punawale, Pune 411062</p>
          <p><FaPhoneAlt /> +91 9923400442</p>
          <p><FaEnvelope /> info@worknai.online</p>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="footer-bottom">
        <p>© 2025 WorknAi Technologies India Pvt Ltd. All rights reserved.</p>
        <button onClick={scrollToTop}><FaArrowUp /></button>
      </div>

      <style>{`

.main-footer {
  background: #050714; /* Matched to Navbar */
  color: #e5e7eb;
  padding: 100px 0 0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
  position: relative;
  overflow: hidden;
}

/* Elegant Glow Accents - SYNCED WITH HOME */
.main-footer::before {
  content: "";
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle at center, rgba(139, 92, 246, 0.15), transparent 70%);
  top: -250px;
  right: -200px;
  z-index: 0;
}

.main-footer::after {
  content: "";
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle at center, rgba(236, 72, 153, 0.1), transparent 70%);
  bottom: -200px;
  left: -150px;
  z-index: 0;
}

.footer-container {
  position: relative;
  z-index: 2;
  width: 90%;
  max-width: 1400px;
  margin: auto;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1.5fr;
  gap: 60px;
  padding-bottom: 70px;
}

/* BRAND */
.footer-logo-img {
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 0 10px rgba(80, 200, 255, 0.35));
}

.brand-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.8rem;
  font-weight: 900;
  color: #ffffff;
  letter-spacing: -1px;
}

.logo-text {
  font-weight: 900;
  font-size: 1.6rem;
  letter-spacing: -0.5px;
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

.brand-desc {
  margin: 28px 0;
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(255,255,255,0.6);
  max-width: 420px;
}

/* SOCIAL ICONS - LUXE GLASS */
.social-links {
  display: flex;
  gap: 18px;
}
.social-links a {
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  text-decoration: none;
  backdrop-filter: blur(10px);
}
.social-links a:nth-child(1) {
  color: #50c8ff; /* Sync with brand Cyan */
  border-color: rgba(80, 200, 255, 0.4);
  background: rgba(80, 200, 255, 0.08);
}
.social-links a:nth-child(2) {
  color: #e4405f;
  border-color: rgba(228, 64, 95, 0.4);
  background: rgba(228, 64, 95, 0.08);
}

.social-links a:hover {
  transform: translateY(-8px) rotate(5deg);
}

.social-links a:nth-child(1):hover {
  background: #0077b5;
  border-color: #0077b5;
  color: #fff;
  box-shadow: 0 15px 35px rgba(0, 119, 181, 0.4);
}
.social-links a:nth-child(2):hover {
  background: #e4405f;
  border-color: #e4405f;
  color: #fff;
  box-shadow: 0 15px 35px rgba(228, 64, 95, 0.4);
}

/* HEADINGS */
.footer-links h4,
.footer-contact h4 {
  font-size: 1.1rem;
  font-weight: 800;
  margin-bottom: 25px;
  color: #ffffff;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  position: relative;
}

.footer-links h4::after,
.footer-contact h4::after {
  content: "";
  position: absolute;
  left: 0;
  bottom: -10px;
  width: 40px;
  height: 4px;
  border-radius: 10px;
  background: linear-gradient(90deg, #50c8ff, #a78bfa);
}

/* LINKS */
.footer-links a,
.footer-links span {
  display: block;
  margin-bottom: 16px;
  color: rgba(255,255,255,0.5);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.footer-links a:hover {
  color: #50c8ff;
  transform: translateX(8px);
}

/* CONTACT */
.footer-contact p {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 20px;
  font-size: 1rem;
  color: rgba(255,255,255,0.6);
  line-height: 1.7;
}
.footer-contact svg {
  color: #50c8ff;
  margin-top: 5px;
  font-size: 1.1rem;
}

/* BOTTOM BAR */
.footer-bottom {
  background: rgba(255,255,255,0.02);
  padding: 30px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 90%;
  max-width: 1400px;
  margin: auto;
  border-radius: 40px 40px 0 0;
  border: 1px solid rgba(255,255,255,0.05);
  border-bottom: none;
  backdrop-filter: blur(20px);
  position: relative;
}

.footer-bottom p {
  font-size: 0.95rem;
  color: rgba(255,255,255,0.4);
  margin: 0 2rem;
  font-weight: 500;
}

.footer-bottom button {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  border: none;
  width: 52px;
  height: 52px;
  border-radius: 18px;
  color: #fff;
  cursor: pointer;
  position: absolute;
  right: 2rem;
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 10px 25px rgba(80, 200, 255, 0.3);
}
.footer-bottom button:hover {
  transform: translateY(-5px) scale(1.1);
  background: linear-gradient(135deg, #a78bfa, #e879f9);
  box-shadow: 0 15px 35px rgba(167, 139, 250, 0.4);
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .footer-container {
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }
}

@media (max-width: 600px) {
  .footer-container {
    grid-template-columns: 1fr;
    text-align: center;
    padding-bottom: 50px;
  }

  .brand-logo,
  .social-links {
    justify-content: center;
  }

  .footer-contact p {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
  }

  .footer-contact p svg {
    margin-top: 0;
  }

  .footer-links h4::after,
  .footer-contact h4::after {
    left: 50%;
    transform: translateX(-50%);
  }

  .footer-bottom {
    flex-direction: column;
    gap: 20px;
    padding: 30px 16px;
    text-align: center;
    border-radius: 24px 24px 0 0;
  }
  .footer-bottom button { 
    position: static; 
    margin: 0 auto; 
    order: -1; /* Button above text looks better on mobile */
  }
  .footer-bottom p { 
    margin: 0; 
    font-size: 0.85rem; 
  }
}

`}</style>
    </footer>
  );
};

export default Footer;
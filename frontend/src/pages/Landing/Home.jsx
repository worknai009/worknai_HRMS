import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaFingerprint, FaShieldAlt, FaChartLine, FaMobileAlt, 
  FaArrowRight, FaBuilding, FaUserCheck, FaUsers, 
  FaCloudUploadAlt, FaLock, FaUserShield, FaCheckCircle, 
  FaGlobeAmericas, FaMapMarkerAlt, FaFileInvoiceDollar, FaAward
} from 'react-icons/fa';

const Home = () => {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Netflix-style splash logic
    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="netflix-splash">
        <div className="splash-content">
          <h1 className="main-logo">SMART<span>HRMS</span></h1>
          <div className="progress-container">
            <div className="progress-fill"></div>
          </div>
          <p className="loading-text">SECURING YOUR WORKFORCE...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-wrapper">
      {/* --- HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-content animate-up">
          <div className="trust-badge"><FaShieldAlt/> ISO 27001 Certified Security</div>
          <h1>Enterprise Grade <span>Biometric</span> Management System</h1>
          <p>
            The most trusted AI-powered SaaS platform for workforce automation. 
            SmartHRMS empowers corporations worldwide with real-time data integrity.
          </p>
          <div className="hero-btns">
            <Link to="/register" className="btn-primary-lg">Launch Now <FaArrowRight/></Link>
            <Link to="/contact" className="btn-outline-lg">Book Demo</Link>
          </div>
        </div>
        <div className="hero-visual animate-fade">
          <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80" alt="Office Visual" className="main-img" />
          <div className="floating-stat card-1"><FaUserCheck/> 99.9% Accuracy</div>
          <div className="floating-stat card-2"><FaLock/> AES-256 Encrypted</div>
        </div>
      </section>

      {/* --- STATS RIBBON --- */}
      <div className="stats-ribbon">
          <div className="stat-item"><h3>1.2M+</h3><p>Active Users</p></div>
          <div className="stat-item"><h3>₹500Cr+</h3><p>Payroll Processed</p></div>
          <div className="stat-item"><h3>0.01s</h3><p>Sync Speed</p></div>
      </div>

      {/* --- CORE CAPABILITIES (Trust) --- */}
      <section className="trust-section">
        <div className="container">
          <div className="centered-header">
            <h2>Why Organizations <span>Scale</span> with Us</h2>
            <p>Move beyond manual registers. Embrace high-precision accountability.</p>
          </div>
          <div className="trust-grid">
            <div className="trust-card">
              <FaFingerprint className="blue-t"/>
              <h4>Neural Face-Link</h4>
              <p>AI that ensures 100% presence verification for every single punch-in.</p>
            </div>
            <div className="trust-card">
              <FaMapMarkerAlt className="red-t"/>
              <h4>Hyper Geofence</h4>
              <p>Lock attendance to specific GPS coordinates with sub-meter accuracy.</p>
            </div>
            <div className="trust-card">
              <FaUserShield className="purple-t"/>
              <h4>Legal Ready</h4>
              <p>Automated PF, ESI, and Tax calculations following local labour laws.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- SHOWCASE --- */}
      <section className="product-showcase">
        <div className="showcase-container">
          <div className="showcase-text">
            <h2>Workflow on <span>Autopilot</span></h2>
            <ul className="premium-list">
              <li><FaCheckCircle/> Automated Overtime Logic</li>
              <li><FaCheckCircle/> Real-time WFH Tracking</li>
              <li><FaCheckCircle/> Multi-Level Approvals</li>
            </ul>
            <Link to="/features" className="explore-link">Full Feature Suite <FaArrowRight/></Link>
          </div>
          <div className="showcase-img">
            <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" alt="Analytics" />
          </div>
        </div>
      </section>

      {/* --- GLOBAL BANNER --- */}
      <section className="global-presence">
          <div className="content">
            <h2>Trusted by <span>Enterprise</span> Leaders</h2>
            <div className="btn-row">
              <Link to="/contact" className="btn-white">Talk to Experts</Link>
              <Link to="/register" className="btn-transparent">Start Free Trial</Link>
            </div>
          </div>
      </section>

      <footer className="footer-main">
        <div className="footer-grid">
           <div className="footer-brand">
              <h3>SMART<span>HRMS</span></h3>
              <p>Leading AI Biometric SaaS for the modern Indian workforce.</p>
           </div>
           <div className="footer-links">
              <h4>Solutions</h4>
              <Link to="/features">Attendance</Link>
              <Link to="/features">Payroll</Link>
           </div>
        </div>
        <div className="footer-bottom">
           © 2025 SmartHRMS SaaS India. ISO Certified.
        </div>
      </footer>

      <style>{`
        /* GLOBAL & RESPONSIVE REPAIR */
        .home-wrapper { font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; width: 100%; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

        /* SPLASH */
        .netflix-splash { height: 100vh; background: #fff; display: flex; justify-content: center; align-items: center; position: fixed; inset: 0; z-index: 10000; }
        .splash-content { text-align: center; width: 80%; max-width: 320px; }
        .main-logo { font-size: clamp(2rem, 8vw, 3.5rem); font-weight: 900; color: #1a73e8; letter-spacing: -2px; }
        .main-logo span { color: #34a853; }
        .progress-container { height: 4px; background: #f0f0f0; border-radius: 10px; overflow: hidden; margin-top: 15px; }
        .progress-fill { height: 100%; background: #1a73e8; animation: progress 2.3s linear forwards; }
        @keyframes progress { from { width: 0; } to { width: 100%; } }

        /* HERO - RESPONSIVE GRID */
        .hero-section { 
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
          padding: clamp(80px, 10vh, 120px) 6%; 
          gap: 40px; 
          align-items: center; 
          background: radial-gradient(circle at top right, #f8faff, #fff); 
        }
        .hero-content h1 { font-size: clamp(2.5rem, 6vw, 4rem); line-height: 1.1; font-weight: 900; margin-bottom: 20px; }
        .hero-content h1 span { color: #1a73e8; }
        .hero-content p { font-size: clamp(1rem, 2vw, 1.25rem); color: #475569; margin-bottom: 35px; }
        
        .hero-btns { display: flex; flex-wrap: wrap; gap: 15px; }
        .btn-primary-lg, .btn-outline-lg { padding: 16px 32px; border-radius: 14px; font-weight: 800; text-decoration: none; text-align: center; flex: 1; min-width: 160px; }
        .btn-primary-lg { background: #1a73e8; color: #fff; box-shadow: 0 10px 20px rgba(26, 115, 232, 0.2); }
        .btn-outline-lg { border: 2px solid #e2e8f0; color: #1e293b; }

        .hero-visual { position: relative; width: 100%; }
        .main-img { width: 100%; border-radius: 24px; box-shadow: 0 30px 60px rgba(0,0,0,0.1); }
        .floating-stat { position: absolute; background: #fff; padding: 12px 20px; border-radius: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-weight: 800; font-size: 0.8rem; white-space: nowrap; }
        .card-1 { top: 10%; left: -20px; color: #16a34a; }
        .card-2 { bottom: 10%; right: -10px; color: #1a73e8; }

        /* STATS RIBBON */
        .stats-ribbon { background: #0f172a; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); padding: 40px 6%; gap: 20px; color: #fff; text-align: center; }
        .stat-item h3 { font-size: 2rem; color: #38bdf8; margin: 0; }
        .stat-item p { font-size: 0.75rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; margin-top: 5px; }

        /* TRUST SECTION */
        .trust-section { padding: 80px 6%; }
        .trust-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 30px; }
        .trust-card { padding: 35px; background: #fff; border-radius: 24px; border: 1px solid #f1f5f9; transition: 0.3s; }
        .trust-card h4 { margin: 15px 0 10px; font-size: 1.25rem; }

        /* SHOWCASE */
        .product-showcase { padding: 80px 6%; background: #f8faff; }
        .showcase-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 50px; align-items: center; }
        .premium-list { list-style: none; padding: 0; margin: 25px 0; }
        .premium-list li { display: flex; align-items: center; gap: 12px; font-weight: 700; margin-bottom: 12px; }

        /* BANNER */
        .global-presence { background: #1a73e8; padding: 80px 6%; color: #fff; text-align: center; border-radius: 0; }
        .btn-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; margin-top: 30px; }
        .btn-white { background: #fff; color: #1a73e8; padding: 15px 30px; border-radius: 12px; font-weight: 800; text-decoration: none; }
        .btn-transparent { border: 2px solid #fff; color: #fff; padding: 15px 30px; border-radius: 12px; font-weight: 800; text-decoration: none; }

        /* FOOTER */
        .footer-main { background: #020617; color: #94a3b8; padding: 60px 6% 30px; }
        .footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; margin-bottom: 40px; }
        .footer-brand h3 { color: #fff; margin-bottom: 15px; }
        .footer-links a { display: block; color: #94a3b8; text-decoration: none; margin-bottom: 10px; font-size: 0.9rem; }

        /* MOBILE OVERRIDES */
        @media (max-width: 768px) {
          .hero-section { text-align: center; padding-top: 60px; }
          .hero-btns { justify-content: center; }
          .floating-stat { display: none; } /* Hide cards on mobile for clean look */
          .hero-visual { order: -1; margin-bottom: 20px; }
          .btn-row { flex-direction: column; }
          .footer-grid { text-align: center; }
        }
      `}</style>
    </div>
  );
};

export default Home;
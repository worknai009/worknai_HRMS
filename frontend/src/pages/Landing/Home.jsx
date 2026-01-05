import React from "react";
import { Link } from "react-router-dom";
import {
  FaFingerprint,
  FaShieldAlt,
  FaChartLine,
  FaArrowRight,
  FaUserCheck,
  FaLock,
  FaMapMarkerAlt,
  FaRobot,
  FaHandshake,
  FaBuilding,
} from "react-icons/fa";

const Home = () => {
  return (
    <div className="home-wrapper">
      {/* --- 1. HERO SECTION --- */}
      <section className="hero-section">
        <div className="hero-content animate-up">
          <div className="trust-badge">
            <FaShieldAlt /> ISO 27001 Certified Security
          </div>
          <h1>
            Where <span>AI Meets</span> Your Work Life
          </h1>
          <p>
            <strong>WorknAI HRMS</strong> replaces outdated manual systems with
            Neural Face Recognition and Predictive Payroll Analytics. Experience
            the future of automation today.
          </p>

          <div className="hero-btns">
            <Link to="/register" className="btn-primary-lg">
              Get Started Free <FaArrowRight />
            </Link>
            <Link to="/partner-with-us" className="btn-outline-lg">
              Partner With Us
            </Link>
          </div>
        </div>

        <div className="hero-visual animate-fade">
          <img
            src="https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=800&q=80"
            alt="AI Dashboard"
            className="main-img"
          />
          <div className="floating-stat card-1">
            <FaUserCheck /> Live Face Detection
          </div>
          <div className="floating-stat card-2">
            <FaLock /> Bank-Grade Security
          </div>
        </div>
      </section>

      {/* --- 2. STATS RIBBON --- */}
      <div className="stats-ribbon">
        <div className="stat-item">
          <h3>100%</h3>
          <p>Touchless Attendance</p>
        </div>
        <div className="stat-item">
          <h3>0.05s</h3>
          <p>Face Match Speed</p>
        </div>
        <div className="stat-item">
          <h3>250+</h3>
          <p>Enterprise Clients</p>
        </div>
      </div>

      {/* --- 3. CORE INTELLIGENCE MODULES --- */}
      <section className="ai-features">
        <div className="container">
          <div className="centered-header">
            <h2>
              Core <span>Intelligence</span> Modules
            </h2>
            <p>WorknAI doesn't just track data; it understands it.</p>
          </div>

          <div className="features-grid">
            <div className="feature-box">
              <div className="icon-wrapper blue">
                <FaFingerprint />
              </div>
              <h3>Biometric Neural Engine</h3>
              <p>
                Advanced anti-spoofing AI that distinguishes between a real face
                and a photo/video instantly.
              </p>
            </div>
            <div className="feature-box">
              <div className="icon-wrapper purple">
                <FaRobot />
              </div>
              <h3>Automated Payroll Bot</h3>
              <p>
                Calculates salary, taxes (TDS), PF, and overtime in real-time
                without human intervention.
              </p>
            </div>
            <div className="feature-box">
              <div className="icon-wrapper green">
                <FaMapMarkerAlt />
              </div>
              <h3>Smart Geofencing</h3>
              <p>
                GPS tracking that automatically marks attendance when an
                employee enters the office radius.
              </p>
            </div>
            <div className="feature-box">
              <div className="icon-wrapper red">
                <FaChartLine />
              </div>
              <h3>Predictive Analytics</h3>
              <p>
                Get insights on employee retention risks and productivity trends
                before they happen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- 4. PARTNER SECTION --- */}
      <section className="partner-section">
        <div className="container partner-grid">
          <div className="partner-text">
            <span className="subtitle">GROW WITH US</span>
            <h2>
              Become a <span>Strategic Partner</span>
            </h2>
            <p>
              Are you an HR Consultancy, System Integrator, or Business
              Consultant? Partner with WorknAI to offer world-class HRMS
              solutions to your clients.
            </p>

            <div className="benefit-list">
              <div className="benefit-item">
                <FaHandshake className="b-icon" />
                <div>
                  <h4>High Commission Models</h4>
                  <p>Earn recurring revenue on every license sold.</p>
                </div>
              </div>
              <div className="benefit-item">
                <FaBuilding className="b-icon" />
                <div>
                  <h4>White Label Options</h4>
                  <p>Present the solution under your own brand identity.</p>
                </div>
              </div>
            </div>

            <Link to="/partner-with-us" className="btn-primary-lg">
              Join Partner Program <FaArrowRight />
            </Link>
          </div>

          <div className="partner-visual">
            <img
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80"
              alt="Business Partnership"
            />
            <div className="overlay-badge">
              <span>50+</span> Active Partners
            </div>
          </div>
        </div>
      </section>

      {/* --- 5. GLOBAL BANNER (GOLD TEXT) --- */}
      <section className="global-presence">
        <div className="content">
          <h2>Ready to Transform Your Organization?</h2>
          <p>Join the AI Revolution with WorknAI Technologies India Pvt Ltd.</p>
          <div className="btn-row">
            <Link to="/contact" className="btn-white">
              Talk to Sales
            </Link>
            <Link to="/partner-with-us" className="btn-transparent">
              Partner With Us
            </Link>
          </div>
        </div>
      </section>

      {/* --- STYLES --- */}
      <style>{`
        .home-wrapper { font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; width: 100%; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

        /* HERO SECTION */
        .hero-section { 
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); 
          padding: 120px 6% 80px; gap: 50px; align-items: center; 
          background: radial-gradient(circle at top right, #f0f9ff, #fff); 
        }

        .hero-content h1 { font-size: clamp(2.5rem, 5vw, 4rem); line-height: 1.1; font-weight: 900; margin-bottom: 20px; color: #0f172a; }
        .hero-content h1 span { color: #2563eb; background: -webkit-linear-gradient(45deg, #2563eb, #9333ea); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-content p { font-size: 1.1rem; color: #475569; margin-bottom: 35px; line-height: 1.6; }
        
        .trust-badge { display: inline-flex; align-items: center; gap: 8px; background: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 30px; font-weight: 700; margin-bottom: 20px; font-size: 0.85rem; }

        .hero-btns { display: flex; flex-wrap: wrap; gap: 15px; }
        .btn-primary-lg { background: #2563eb; color: #fff; padding: 15px 30px; border-radius: 12px; font-weight: 700; text-decoration: none; display: flex; align-items: center; gap: 8px; transition: 0.3s; }
        .btn-primary-lg:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(37,99,235,0.3); }
        
        .btn-outline-lg { border: 2px solid #2563eb; color: #2563eb; padding: 14px 28px; border-radius: 12px; font-weight: 700; text-decoration: none; transition: 0.3s; background: white; }
        .btn-outline-lg:hover { background: #eff6ff; transform: translateY(-3px); }

        .hero-visual { position: relative; }
        .main-img { width: 100%; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); }
        .floating-stat { position: absolute; background: #fff; padding: 12px 20px; border-radius: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 8px; }
        .card-1 { top: 15%; left: -20px; color: #16a34a; }
        .card-2 { bottom: 15%; right: -10px; color: #2563eb; }

        /* STATS RIBBON */
        .stats-ribbon { background: #0f172a; display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); padding: 40px 6%; gap: 20px; color: #fff; text-align: center; }
        .stat-item h3 { font-size: 2.2rem; color: #38bdf8; margin: 0; font-weight: 800; }
        .stat-item p { font-size: 0.8rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 5px; }

        /* FEATURES SECTION */
        .ai-features { padding: 80px 0; background: #fff; }
        .centered-header { text-align: center; margin-bottom: 60px; }
        .centered-header h2 { font-size: 2.5rem; font-weight: 800; color: #0f172a; margin-bottom: 10px; }
        .centered-header h2 span { color: #2563eb; }
        .centered-header p { color: #64748b; font-size: 1.1rem; }

        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 30px; }
        .feature-box { background: #f8fafc; padding: 35px; border-radius: 20px; border: 1px solid #e2e8f0; transition: 0.3s; }
        .feature-box:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); border-color: #3b82f6; }
        
        .icon-wrapper { width: 60px; height: 60px; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 20px; }
        .blue { background: #eff6ff; color: #2563eb; }
        .purple { background: #faf5ff; color: #9333ea; }
        .green { background: #f0fdf4; color: #16a34a; }
        .red { background: #fef2f2; color: #ef4444; }

        /* PARTNER SECTION */
        .partner-section { padding: 100px 0; background: #f1f5f9; }
        .partner-grid { display: grid; grid-template-columns: 1fr 1fr; align-items: center; gap: 60px; }
        .subtitle { font-size: 0.9rem; font-weight: 800; color: #2563eb; letter-spacing: 1px; margin-bottom: 10px; display: block; }
        .partner-text h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; color: #0f172a; }
        .benefit-list { margin: 30px 0; }
        .benefit-item { display: flex; gap: 15px; margin-bottom: 20px; }
        .b-icon { font-size: 1.5rem; color: #2563eb; margin-top: 5px; }
        .benefit-item h4 { margin: 0 0 5px; font-weight: 700; color: #1e293b; }
        .benefit-item p { margin: 0; color: #64748b; font-size: 0.95rem; }
        
        .partner-visual { position: relative; }
        .partner-visual img { width: 100%; border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .overlay-badge { position: absolute; bottom: 30px; left: -30px; background: #fff; padding: 15px 25px; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.15); font-weight: 700; color: #1e293b; display: flex; align-items: center; gap: 10px; }
        .overlay-badge span { color: #2563eb; font-size: 1.5rem; font-weight: 800; }

        /* GLOBAL BANNER SECTION */
        .global-presence { 
            background: #0f172a; 
            padding: 80px 6%; 
            text-align: center; 
        }

        /* Gold Gradient Text */
        .global-presence h2 { 
            font-size: 2.5rem; font-weight: 800; margin-bottom: 15px; 
            background: linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            color: #D4AF37;
        }

        .global-presence p { font-size: 1.2rem; color: #E2E8F0; font-weight: 500; margin-bottom: 30px; }

        .btn-row { display: flex; justify-content: center; gap: 15px; margin-top: 30px; flex-wrap: wrap; }

        .btn-white { background: #fff; color: #0f172a; padding: 15px 30px; border-radius: 12px; font-weight: 800; text-decoration: none; transition: 0.3s; }
        .btn-white:hover { transform: scale(1.05); }

        .btn-transparent { 
            border: 2px solid #BF953F; color: #BF953F; padding: 13px 30px; 
            border-radius: 12px; font-weight: 800; text-decoration: none; transition: 0.3s; 
        }
        .btn-transparent:hover { background: rgba(191, 149, 63, 0.1); color: #fff; border-color: #fff; }

        /* ANIMATIONS */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-up { animation: fadeUp 0.8s ease-out forwards; }
        .animate-fade { animation: fadeIn 1s ease-out forwards; }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .hero-section, .partner-grid { grid-template-columns: 1fr; text-align: center; padding-top: 60px; }
          .hero-btns { justify-content: center; width: 100%; }
          .hero-btns a { width: 100%; justify-content: center; }
          .floating-stat { display: none; }
          .partner-visual { order: -1; margin-bottom: 30px; }
          .benefit-item { text-align: left; }
          .overlay-badge { left: 50%; transform: translateX(-50%); bottom: -20px; width: 80%; justify-content: center; }
          .btn-row { flex-direction: column; }
        }
      `}</style>
    </div>
  );
};

export default Home;

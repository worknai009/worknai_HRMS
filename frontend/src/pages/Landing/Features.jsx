import React from 'react';
import { 
  FaFingerprint, FaMapMarkedAlt, FaFileInvoice, FaMobile, 
  FaCogs, FaChartPie, FaBolt, FaLock, FaSync, FaShieldAlt, 
  FaArrowRight, FaCheckCircle, FaInfoCircle // ✅ Saare missing icons add kar diye hain
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Features = () => {
  return (
    <div className="features-page">
      {/* --- HERO SECTION --- */}
      <section className="feat-hero">
        <div className="container">
          <div className="hero-wrap animate-up">
            <span className="feat-badge">PLATFORM CAPABILITIES</span>
            <h1>Powerful Features for <span>Infinite</span> Growth</h1>
            <p>
              SmartHRMS combines artificial intelligence with human-centric design 
              to provide tools that don't just track work, but improve it.
            </p>
          </div>
        </div>
      </section>

      {/* --- FEATURE DEEP DIVE (BIG SECTIONS) --- */}
      <section className="deep-dive">
        <div className="container">
          
          {/* Feature 1: AI Biometrics */}
          <div className="dive-row">
            <div className="dive-text">
              <div className="icon-circle blue"><FaFingerprint/></div>
              <h2>Advanced <span>AI Biometric</span> Verification</h2>
              <p>
                Say goodbye to proxy attendance. Our system analyzes 128 unique facial landmarks 
                to verify identity with 99.9% accuracy, even in low-light conditions.
              </p>
              <ul className="feat-list">
                <li>Anti-Spoofing Technology</li>
                <li>Liveness Detection (Prevents Photo-Punches)</li>
                {/* ✅ FIXED ERROR: String wrapper use kiya hai taaki syntax error na aaye */}
               <li>Instant Recognition {`(< 0.5s)`}</li>
              </ul>
            </div>
            <div className="dive-visual animate-fade">
              <img src="https://images.unsplash.com/photo-1555664424-778a1e5e1b48?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="AI Biometrics" />
            </div>
          </div>

          {/* Feature 2: Geo-Fencing */}
          <div className="dive-row reverse">
            <div className="dive-text">
              <div className="icon-circle red"><FaMapMarkedAlt/></div>
              <h2>Dynamic <span>Geo-Fencing</span> Security</h2>
              <p>
                Define virtual boundaries around your multiple office branches. 
                Employees can only punch in when they are physically present inside the designated zone.
              </p>
              <ul className="feat-list">
                <li>Multi-Branch Location Support</li>
                <li>GPS Coordinate Tracking</li>
                <li>Custom Radius Definition (50m - 500m)</li>
              </ul>
            </div>
            <div className="dive-visual animate-fade">
              <img src="https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="GPS Tracking" />
            </div>
          </div>

          {/* Feature 3: Smart Payroll */}
          <div className="dive-row">
            <div className="dive-text">
              <div className="icon-circle green"><FaFileInvoice/></div>
              <h2>Integrated <span>Payroll</span> Automation</h2>
              <p>
                Directly link attendance logs to salary processing. Calculate overtime, 
                late marks, and leave deductions automatically every month.
              </p>
              <ul className="feat-list">
                <li>Statutory Compliance (PF/ESI)</li>
                <li>Custom Allowance Management</li>
                <li>One-Click Payslip Generation</li>
              </ul>
            </div>
            <div className="dive-visual animate-fade">
              <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Payroll Data" />
            </div>
          </div>

        </div>
      </section>

      {/* --- GRID: ADDITIONAL HIGHLIGHTS --- */}
      <section className="more-features">
        <div className="container">
          <div className="section-header">
            <h2>Small Details, <span>Big Impact</span></h2>
            <p>Every tool you need to manage your workforce professionally.</p>
          </div>
          <div className="feat-grid">
            <div className="small-feat">
              <FaMobile className="s-icon"/>
              <h4>Mobile Portal</h4>
              <p>Dedicated access for employees to view history and apply for leaves.</p>
            </div>
            <div className="small-feat">
              <FaSync className="s-icon"/>
              <h4>Real-time Sync</h4>
              <p>Data updates instantly across SuperAdmin and HR dashboards.</p>
            </div>
            <div className="small-feat">
              <FaChartPie className="s-icon"/>
              <h4>Analytics Pro</h4>
              <p>Visual charts and reports to track company performance trends.</p>
            </div>
            <div className="small-feat">
              <FaLock className="s-icon"/>
              <h4>Data Encryption</h4>
              <p>AES-256 bit encryption ensures employee data is always private.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- TECH STACK BANNER --- */}
      <section className="tech-banner">
          <div className="container text-center">
              <h3><FaBolt className="gold-text"/> Built on Industry Standard Cloud Infrastructure</h3>
              <div className="stack-icons">
                  <span>MERN STACK</span> • <span>AWS S3</span> • <span>FACE-API.JS</span> • <span>MONGODB ATLAS</span>
              </div>
          </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="feat-footer">
          <div className="cta-box animate-up">
              <h2>Experience the <span>Next-Gen</span> HRMS</h2>
              <p>Take the first step towards an automated organization today.</p>
              <div className="btn-row">
                  <Link to="/contact" className="btn-solid">Contact Sales <FaArrowRight/></Link>
                  <Link to="/register" className="btn-outline">Register Now</Link>
              </div>
          </div>
      </section>

      <style>{`
        .features-page { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; overflow-x: hidden; color: #0f172a; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

        /* Hero Section */
        .feat-hero { padding: 120px 0 60px; text-align: center; background: radial-gradient(circle at top right, #f8faff, #fff); }
        .feat-badge { background: #eff6ff; color: #1a73e8; padding: 8px 18px; border-radius: 50px; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; }
        .feat-hero h1 { font-size: 3.5rem; font-weight: 900; margin: 25px 0; letter-spacing: -2px; }
        .feat-hero h1 span { color: #1a73e8; }
        .feat-hero p { font-size: 1.25rem; color: #64748b; max-width: 700px; margin: 0 auto; line-height: 1.6; }

        /* Deep Dive Rows */
        .deep-dive { padding: 100px 0; }
        .dive-row { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; margin-bottom: 120px; }
        .dive-row.reverse { direction: rtl; }
        .dive-row.reverse .dive-text { direction: ltr; }
        
        .icon-circle { width: 60px; height: 60px; border-radius: 18px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin-bottom: 25px; }
        .icon-circle.blue { background: #e0eafc; color: #1a73e8; }
        .icon-circle.red { background: #fee2e2; color: #dc2626; }
        .icon-circle.green { background: #dcfce7; color: #16a34a; }

        .dive-text h2 { font-size: 2.5rem; margin-bottom: 20px; font-weight: 800; }
        .dive-text h2 span { color: #1a73e8; }
        .dive-text p { font-size: 1.1rem; color: #475569; line-height: 1.7; margin-bottom: 25px; }
        
        .feat-list { list-style: none; padding: 0; }
        .feat-list li { display: flex; align-items: center; gap: 12px; font-weight: 700; color: #1e293b; margin-bottom: 12px; font-size: 0.95rem; }
        .feat-list li::before { content: '✓'; color: #10b981; font-weight: 900; }

        .dive-visual img { width: 100%; border-radius: 40px; box-shadow: 0 40px 80px rgba(0,0,0,0.08); transition: 0.5s; }
        .dive-visual img:hover { transform: scale(1.02); }

        /* More Features Grid */
        .more-features { padding: 100px 0; background: #f8fafc; }
        .section-header { text-align: center; margin-bottom: 70px; }
        .section-header h2 { font-size: 2.5rem; font-weight: 800; }
        .section-header h2 span { color: #1a73e8; }
        
        .feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
        .small-feat { padding: 40px; background: #fff; border-radius: 24px; border: 1px solid #eef2f6; transition: 0.3s; }
        .small-feat:hover { border-color: #1a73e8; transform: translateY(-10px); }
        .s-icon { font-size: 2rem; color: #1a73e8; margin-bottom: 20px; }
        .small-feat h4 { margin-bottom: 10px; font-size: 1.2rem; }
        .small-feat p { color: #64748b; font-size: 0.9rem; line-height: 1.5; }

        /* Tech Banner */
        .tech-banner { padding: 60px 0; background: #0f172a; color: #fff; }
        .tech-banner h3 { font-size: 1.5rem; margin-bottom: 20px; }
        .gold-text { color: #f59e0b; margin-right: 10px; }
        .stack-icons { font-weight: 800; color: #94a3b8; letter-spacing: 2px; font-size: 0.8rem; }

        /* CTA Footer */
        .feat-footer { padding: 120px 0; background: #fff; text-align: center; }
        .cta-box { background: #f8fafc; padding: 80px 40px; border-radius: 40px; max-width: 900px; margin: 0 auto; border: 1px solid #eef2f6; }
        .cta-box h2 { font-size: 3rem; font-weight: 900; margin-bottom: 20px; }
        .cta-box h2 span { color: #1a73e8; }
        .btn-row { display: flex; justify-content: center; gap: 20px; margin-top: 40px; }
        .btn-solid { background: #1a73e8; color: #fff; padding: 18px 40px; border-radius: 16px; font-weight: 800; text-decoration: none; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
        .btn-outline { border: 2px solid #e2e8f0; color: #1e293b; padding: 18px 40px; border-radius: 16px; font-weight: 800; text-decoration: none; transition: 0.3s; }

        @media (max-width: 1024px) {
          .dive-row { grid-template-columns: 1fr; gap: 50px; text-align: center; }
          .feat-hero h1 { font-size: 2.8rem; }
          .dive-visual { order: -1; }
          .dive-row.reverse { direction: ltr; }
          .btn-row { flex-direction: column; }
          .cta-box { border-radius: 0; padding: 60px 20px; }
        }
      `}</style>
    </div>
  );
};

export default Features;
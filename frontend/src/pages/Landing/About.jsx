import React from 'react';
import { 
  FaHistory, FaRocket, FaEye, FaMicrochip, FaShieldAlt, 
  FaUsers, FaAward, FaHandshake, FaGlobe, FaLightbulb 
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="about-wrapper">
      {/* --- HERO SECTION: MISSION & VISION --- */}
      <section className="about-hero">
        <div className="container">
          <div className="hero-content animate-up">
            <span className="premium-badge">OUR JOURNEY</span>
            <h1>Digitizing Human Capital with <span>AI Precision</span></h1>
            <p>
              SmartHRMS was born out of a simple vision: To eliminate the friction between 
              workforce management and modern technology. We are not just a software; 
              we are the digital backbone of high-performing organizations.
            </p>
          </div>
        </div>
      </section>

      {/* --- CORE STATS: TRUST SIGNALS --- */}
      <div className="about-stats-ribbon">
          <div className="stat-node"><strong>2018</strong><p>Year Founded</p></div>
          <div className="stat-node"><strong>500+</strong><p>Global Clients</p></div>
          <div className="stat-node"><strong>150+</strong><p>AI Engineers</p></div>
          <div className="stat-node"><strong>Zero</strong><p>Data Breaches</p></div>
      </div>

      {/* --- OUR IDENTITY (IMAGE + TEXT) --- */}
      <section className="identity-section">
        <div className="grid-container">
          <div className="image-side animate-fade">
             <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Our Team Working" />
          </div>
          <div className="text-side">
             <h2>Driven by <span>Integrity</span> & Innovation</h2>
             <p>
               At SmartHRMS, we believe that every second of work matters. Our team of data scientists and 
               HR experts work tirelessly to ensure that our biometric algorithms provide the 
               highest level of accuracy in the SaaS industry.
             </p>
             <div className="values-list">
                <div className="val-item"><FaCheckCircle className="green-icon"/> <span>Biometric Excellence</span></div>
                <div className="val-item"><FaCheckCircle className="green-icon"/> <span>Data Sovereignty</span></div>
                <div className="val-item"><FaCheckCircle className="green-icon"/> <span>User-Centric Design</span></div>
             </div>
          </div>
        </div>
      </section>

      {/* --- THE THREE PILLARS (MISSION/VISION/VALUES) --- */}
      <section className="pillars-section">
        <div className="container">
          <div className="pillar-grid">
            <div className="pillar-card animate-up">
              <FaRocket className="pillar-icon blue-i"/>
              <h3>Our Mission</h3>
              <p>To empower 10,000+ organizations by 2030 with seamless, transparent, and AI-driven HR operations.</p>
            </div>
            <div className="pillar-card animate-up" style={{animationDelay: '0.2s'}}>
              <FaEye className="pillar-icon purple-i"/>
              <h3>Our Vision</h3>
              <p>To become the world's most trusted biometric SaaS ecosystem, redefining how humans interact with workplace data.</p>
            </div>
            <div className="pillar-card animate-up" style={{animationDelay: '0.4s'}}>
              <FaLightbulb className="pillar-icon gold-i"/>
              <h3>Core Values</h3>
              <p>Innovation, Transparency, and Security are the three DNA strands of every line of code we write.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- TECH ARCHITECTURE (ADVANCED SECTION) --- */}
      <section className="tech-section">
          <div className="tech-container">
             <div className="tech-text">
                <h2 id="face1">The Technology Behind the <span>Face-AI</span></h2>
                <p>
                  Our system uses 128-point facial landmarking. This means we don't store 
                  your actual photo; we store a mathematical descriptor that is 
                  impossible to reverse-engineer. Security isn't an option; it's our foundation.
                </p>
                <div className="tech-features">
                   <div className="t-feat"><FaShieldAlt/> AES-256 Cloud Encryption</div>
                   <div className="t-feat"><FaMicrochip/> Real-time Liveness Detection</div>
                   <div className="t-feat"><FaGlobe/> Multi-Region Data Hosting</div>
                </div>
             </div>
             <div className="tech-visual">
                <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Cyber Security" />
             </div>
          </div>
      </section>

      {/* --- CTA: FINAL TOUCH --- */}
      <section className="about-footer">
          <div className="footer-content">
            <h2>Building the <span>Future</span> Together</h2>
            <p>Join the revolution and bring SmartHRMS to your organization today.</p>
            <div className="btn-group">
                <Link to="/contact" className="btn-main">Become a Partner</Link>
                <Link to="/register" className="btn-light">Free Product Tour</Link>
            </div>
          </div>
      </section>

      <style>{`
        .about-wrapper { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; color: #1e293b; overflow-x: hidden; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

        /* HERO */
        .about-hero { padding: 120px 0 80px; background: radial-gradient(circle at bottom left, #f1f5f9, #fff); text-align: center; }
        .premium-badge { background: #e0e7ff; color: #4338ca; padding: 8px 20px; border-radius: 50px; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; }
        .about-hero h1 { font-size: 3.8rem; font-weight: 900; margin: 25px 0; letter-spacing: -2px; line-height: 1.1; }
        .about-hero h1 span { color: #1a73e8; }
        .about-hero p { max-width: 800px; margin: 0 auto; font-size: 1.25rem; color: #64748b; line-height: 1.6; }

        /* STATS */
        .about-stats-ribbon { background: #0f172a; display: flex; justify-content: space-around; padding: 60px 5%; color: #fff; text-align: center; }
        .stat-node strong { font-size: 2.2rem; color: #38bdf8; display: block; }
        .stat-node p { margin-top: 5px; color: #94a3b8; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }

        /* IDENTITY */
        .identity-section { padding: 100px 5%; }
        .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .image-side img { width: 100%; border-radius: 40px; box-shadow: 0 30px 60px rgba(0,0,0,0.1); }
        .text-side h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 25px; }
        .text-side h2 span { color: #1a73e8; }
        .text-side p { font-size: 1.1rem; line-height: 1.7; color: #475569; margin-bottom: 30px; }
        .values-list { display: flex; flex-direction: column; gap: 15px; }
        .val-item { display: flex; align-items: center; gap: 12px; font-weight: 700; color: #1e293b; }
        .green-icon { color: #10b981; }

        #face1{
        color: #FFD700;
        }
        /* PILLARS */
        .pillars-section { padding: 100px 0; background: #f8fafc; }
        .pillar-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 30px; }
        .pillar-card { background: #fff; padding: 50px 40px; border-radius: 32px; border: 1px solid #eef2f6; text-align: center; transition: 0.3s; }
        .pillar-card:hover { transform: translateY(-10px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
        .pillar-icon { font-size: 3rem; margin-bottom: 30px; }
        .blue-i { color: #1a73e8; } .purple-i { color: #7c3aed; } .gold-i { color: #f59e0b; }
        .pillar-card h3 { font-size: 1.5rem; margin-bottom: 15px; color: #0f172a; }
        .pillar-card p { color: #64748b; line-height: 1.6; }

        /* TECH SECTION */
        .tech-section { padding: 100px 5%; }
        .tech-container { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; align-items: center; background: #0f172a; border-radius: 40px; padding: 80px; color: #fff; }
        .tech-text h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 20px; }
        .tech-text h2 span { color: #38bdf8; }
        .tech-text p { font-size: 1.1rem; color: #94a3b8; line-height: 1.7; margin-bottom: 40px; }
        .tech-features { display: grid; grid-template-columns: 1fr; gap: 20px; }
        .t-feat { display: flex; align-items: center; gap: 15px; font-weight: 600; color: #e2e8f0; }
        .t-feat svg { color: #38bdf8; }
        .tech-visual img { width: 100%; border-radius: 24px; box-shadow: 0 0 40px rgba(56, 189, 248, 0.2); }

        /* ABOUT FOOTER */
        .about-footer { padding: 120px 5%; text-align: center; background: radial-gradient(circle at top, #f8faff, #fff); }
        .about-footer h2 { font-size: 3rem; font-weight: 900; margin-bottom: 20px; }
        .about-footer h2 span { color: #1a73e8; }
        .about-footer p { font-size: 1.2rem; color: #64748b; margin-bottom: 40px; }
        .btn-group { display: flex; justify-content: center; gap: 20px; }
        .btn-main { background: #1a73e8; color: #fff; padding: 18px 40px; border-radius: 15px; font-weight: 800; text-decoration: none; transition: 0.3s; }
        .btn-main:hover { background: #1557b0; transform: scale(1.05); }
        .btn-light { border: 2px solid #e2e8f0; color: #1e293b; padding: 18px 40px; border-radius: 15px; font-weight: 800; text-decoration: none; }

        @media (max-width: 1024px) {
          .grid-container, .tech-container { grid-template-columns: 1fr; text-align: center; }
          .tech-container { padding: 40px; }
          .about-hero h1 { font-size: 2.8rem; }
          .btn-group { flex-direction: column; }
          .stat-node strong { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
};

// Add this helper if not already present globally
const FaCheckCircle = ({className}) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.248-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path>
  </svg>
);

export default About;
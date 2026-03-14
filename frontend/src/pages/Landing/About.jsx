import React from 'react';
import {
  FaHistory, FaRocket, FaEye, FaMicrochip, FaShieldAlt,
  FaUsers, FaAward, FaHandshake, FaGlobe, FaLightbulb
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import aiPrecisionImg from '../../assets/Digitizing Human Capital with AI Precision.png';

const About = () => {
  return (
    <div className="about-wrapper">
      {/* Background Blobs for Depth */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>

      {/* --- HERO SECTION --- */}
      <section className="about-hero animate-fade">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-text animate-up">
              <span className="premium-badge">OUR JOURNEY</span>
              <h1>Digitizing Human Capital with <span>AI Precision</span></h1>
              <p>
                WorknAi HRMS was born out of a simple vision: To eliminate the friction between
                workforce management and modern technology. We are not just a software;
                we are the digital backbone of high-performing organizations.
              </p>
            </div>
            <div className="hero-visual animate-up" style={{ animationDelay: '0.2s' }}>
              <img src={aiPrecisionImg} alt="AI Precision" />
              <div className="glow-effect"></div>
            </div>
          </div>
        </div>
      </section>

      {/* --- CORE STATS --- */}
      <div className="about-stats-ribbon">
        <div className="stat-node"><strong>2018</strong><p>Year Founded</p></div>
        <div className="stat-node"><strong>500+</strong><p>Global Clients</p></div>
        <div className="stat-node"><strong>150+</strong><p>AI Engineers</p></div>
        <div className="stat-node"><strong>Zero</strong><p>Data Breaches</p></div>
      </div>

      {/* --- OUR IDENTITY --- */}
      <section className="identity-section">
        <div className="container">
          <div className="grid-container">
            <div className="image-side animate-fade">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Our Team Working" />
            </div>
            <div className="text-side">
              <h2>Driven by <span>Integrity</span> & Innovation</h2>
              <p>
                At WorknAi HRMS, we believe that every second of work matters. Our team of data scientists and
                HR experts work tirelessly to ensure that our biometric algorithms provide the
                highest level of accuracy in the SaaS industry.
              </p>
              <div className="values-list">
                <div className="val-item"><FaCheckCircle className="accent-icon" /> <span>Biometric Excellence</span></div>
                <div className="val-item"><FaCheckCircle className="accent-icon" /> <span>Data Sovereignty</span></div>
                <div className="val-item"><FaCheckCircle className="accent-icon" /> <span>User-Centric Design</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- THE THREE PILLARS --- */}
      <section className="pillars-section">
        <div className="container">
          <div className="pillar-grid">
            <div className="pillar-card animate-up">
              <div className="icon-wrapper blue-bg"><FaRocket className="pillar-icon" /></div>
              <h3>Our Mission</h3>
              <p>To empower 10,000+ organizations by 2030 with seamless, transparent, and AI-driven HR operations.</p>
            </div>
            <div className="pillar-card animate-up" style={{ animationDelay: '0.2s' }}>
              <div className="icon-wrapper purple-bg"><FaEye className="pillar-icon" /></div>
              <h3>Our Vision</h3>
              <p>To become the world's most trusted biometric SaaS ecosystem, redefining how humans interact with workplace data.</p>
            </div>
            <div className="pillar-card animate-up" style={{ animationDelay: '0.4s' }}>
              <div className="icon-wrapper gold-bg"><FaLightbulb className="pillar-icon" /></div>
              <h3>Core Values</h3>
              <p>Innovation, Transparency, and Security are the three DNA strands of every line of code we write.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- TECH ARCHITECTURE --- */}
      <section className="tech-section">
        <div className="container">
          <div className="tech-container glass-card">
            <div className="tech-text">
              <h2>The Technology Behind the <span>Face-AI</span></h2>
              <p>
                Our system uses 128-point facial landmarking. This means we don't store
                your actual photo; we store a mathematical descriptor that is
                impossible to reverse-engineer. Security isn't an option; it's our foundation.
              </p>
              <div className="tech-features">
                <div className="t-feat"><FaShieldAlt /> AES-256 Cloud Encryption</div>
                <div className="t-feat"><FaMicrochip /> Real-time Liveness Detection</div>
                <div className="t-feat"><FaGlobe /> Multi-Region Data Hosting</div>
              </div>
            </div>
            <div className="tech-visual">
              <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Cyber Security" />
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA: FINAL TOUCH --- */}
      <section className="about-footer">
        <div className="footer-content">
          <h2>Building the <span>Future</span> Together</h2>
          <p>Join the revolution and bring WorknAi HRMS to your organization today.</p>
          <div className="btn-group">
            <Link to="/contact" className="btn-main">Become a Partner</Link>
            <Link to="/register" className="btn-light">Free Product Tour</Link>
          </div>
        </div>
      </section>

      <style>{`
        .about-wrapper { 
          background: #0c0f24; 
          font-family: 'Plus Jakarta Sans', sans-serif; 
          padding-bottom: 60px; 
          overflow-x: hidden; 
          padding-top: 70px; 
          color: #fff; 
          position: relative; 
        }

        @media (max-width: 1024px) {
          .about-wrapper {
            padding-top: 60px;
          }
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; position: relative; z-index: 1; }

        /* Background Blobs */
        .blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.15;
          pointer-events: none;
          animation: float 20s infinite alternate;
        }
        .blob-1 { width: 500px; height: 500px; background: #a78bfa; top: -100px; right: -100px; animation-delay: 0s; }
        .blob-2 { width: 400px; height: 400px; background: #50c8ff; bottom: -50px; left: -50px; animation-delay: -5s; }
        .blob-3 { width: 300px; height: 300px; background: #e879f9; top: 40%; left: 30%; animation-delay: -10s; }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, 40px) scale(1.1); }
          100% { transform: translate(-20px, 20px) scale(0.9); }
        }

        /* HERO */
        .about-hero { padding: 60px 0 40px; position: relative; }
        .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .premium-badge { 
          background: rgba(167, 139, 250, 0.1); 
          color: #a78bfa; 
          padding: 10px 24px; 
          border-radius: 50px; 
          font-weight: 800; 
          font-size: 0.75rem; 
          letter-spacing: 2px;
          border: 1px solid rgba(167, 139, 250, 0.2);
          display: inline-block;
          margin-bottom: 20px;
        }
        .hero-text h1 { font-size: clamp(2.5rem, 5vw, 3.8rem); font-weight: 900; margin-bottom: 25px; letter-spacing: -2px; line-height: 1.1; }
        .hero-text h1 span { 
          background: linear-gradient(135deg, #a78bfa 0%, #50c8ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-text p { font-size: 1.25rem; color: rgba(255, 255, 255, 0.6); line-height: 1.6; }
        
        .hero-visual { position: relative; }
        .hero-visual img { width: 100%; height: auto; border-radius: 40px; position: relative; z-index: 2; transform: perspective(1000px) rotateY(-5deg); transition: 0.5s; }
        .hero-visual:hover img { transform: perspective(1000px) rotateY(0deg); }
        .glow-effect { position: absolute; inset: -10%; background: radial-gradient(circle, rgba(167, 139, 250, 0.2) 0%, transparent 70%); z-index: 1; border-radius: 50%; }

        /* STATS */
        .about-stats-ribbon { background: rgba(255, 255, 255, 0.03); backdrop-filter: blur(10px); display: flex; justify-content: space-around; padding: 60px 5%; border-top: 1px solid rgba(255, 255, 255, 0.05); border-bottom: 1px solid rgba(255, 255, 255, 0.05); text-align: center; position: relative; z-index: 1; }
        .stat-node strong { font-size: 2.2rem; color: #50c8ff; display: block; margin-bottom: 5px; }
        .stat-node p { margin: 0; color: rgba(255, 255, 255, 0.5); font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        /* IDENTITY */
        .identity-section { padding: 60px 0; position: relative; }
        .grid-container { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .image-side img { width: 100%; border-radius: 40px; border: 1px solid rgba(255, 255, 255, 0.1); box-shadow: 0 30px 60px rgba(0,0,0,0.3); }
        .text-side h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 25px; }
        .text-side h2 span { 
          background: linear-gradient(135deg, #a78bfa 0%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .text-side p { font-size: 1.1rem; line-height: 1.7; color: rgba(255, 255, 255, 0.6); margin-bottom: 30px; }
        .values-list { display: flex; flex-direction: column; gap: 20px; }
        .val-item { display: flex; align-items: center; gap: 15px; font-weight: 700; color: #fff; }
        .accent-icon { color: #50c8ff; font-size: 1.2rem; }

        /* PILLARS */
        .pillars-section { padding: 60px 0; }
        .pillar-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 40px; }
        .pillar-card { 
          background: rgba(255, 255, 255, 0.03); 
          backdrop-filter: blur(12px);
          padding: 60px 40px; 
          border-radius: 32px; 
          border: 1px solid rgba(255, 255, 255, 0.08); 
          text-align: center; 
          transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
        }
        .pillar-card:hover { transform: translateY(-12px) scale(1.02); background: rgba(255, 255, 255, 0.05); border-color: rgba(167, 139, 250, 0.3); box-shadow: 0 25px 50px rgba(0,0,0,0.3); }
        
        .icon-wrapper { width: 80px; height: 80px; border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 30px; font-size: 2.2rem; }
        .blue-bg { background: rgba(80, 200, 255, 0.1); color: #50c8ff; } 
        .purple-bg { background: rgba(167, 139, 250, 0.1); color: #a78bfa; } 
        .gold-bg { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        
        .pillar-card h3 { font-size: 1.6rem; margin-bottom: 15px; color: #fff; font-weight: 800; }
        .pillar-card p { color: rgba(255, 255, 255, 0.5); line-height: 1.6; font-size: 1rem; }

        /* TECH SECTION */
        .tech-section { padding: 60px 0; }
        .tech-container { 
          display: grid; 
          grid-template-columns: 1.2fr 0.8fr; 
          gap: 60px; 
          align-items: center; 
          background: rgba(255, 255, 255, 0.02); 
          backdrop-filter: blur(15px);
          border-radius: 40px; 
          padding: 80px; 
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .tech-text h2 { font-size: 2.6rem; font-weight: 900; margin-bottom: 25px; letter-spacing: -1px; }
        .tech-text h2 span { color: #50c8ff; }
        .tech-text p { font-size: 1.15rem; color: rgba(255, 255, 255, 0.5); line-height: 1.7; margin-bottom: 40px; }
        .tech-features { display: flex; flex-direction: column; gap: 20px; }
        .t-feat { display: flex; align-items: center; gap: 15px; font-weight: 700; color: #fff; font-size: 1rem; }
        .t-feat svg { color: #a78bfa; font-size: 1.2rem; }
        .tech-visual img { width: 100%; border-radius: 28px; box-shadow: 0 0 50px rgba(80, 200, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.1); }

        /* ABOUT FOOTER */
        .about-footer { padding: 80px 0; text-align: center; position: relative; }
        .about-footer h2 { font-size: 3.2rem; font-weight: 900; margin-bottom: 25px; letter-spacing: -2px; }
        .about-footer h2 span { 
          background: linear-gradient(135deg, #a78bfa 0%, #50c8ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .about-footer p { font-size: 1.3rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 45px; }
        .btn-group { display: flex; justify-content: center; gap: 25px; }
        
        .btn-main { 
          background: linear-gradient(135deg, #a78bfa 0%, #50c8ff 100%); 
          color: #fff; padding: 20px 45px; border-radius: 18px; font-weight: 900; text-decoration: none; 
          transition: 0.4s; box-shadow: 0 15px 35px rgba(167, 139, 250, 0.25);
        }
        .btn-main:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 20px 45px rgba(167, 139, 250, 0.4); }
        
        .btn-light { 
          border: 2px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.02); 
          color: #fff; padding: 20px 45px; border-radius: 18px; font-weight: 900; text-decoration: none; 
          transition: 0.4s; backdrop-filter: blur(10px);
        }
        .btn-light:hover { background: rgba(255, 255, 255, 0.05); border-color: rgba(255, 255, 255, 0.3); transform: translateY(-5px); }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .container { padding: 0 40px; }
          .hero-grid, .grid-container, .tech-container { grid-template-columns: 1fr; text-align: center; gap: 50px; }
          .hero-text { order: 1; }
          .hero-visual { order: 2; margin: 0 auto; max-width: 600px; }
          .hero-visual img { transform: none; }
          .text-side { order: 1; display: flex; flex-direction: column; align-items: center; }
          .image-side { order: 2; max-width: 600px; margin: 0 auto; }
          .tech-text { order: 1; }
          .tech-visual { order: 2; max-width: 500px; margin: 0 auto; }
          .tech-container { padding: 60px 40px; }
          .hero-text h1 { font-size: 3rem; }
          
          /* Pillar Grid Adjustment for 1024px */
          .pillar-grid { grid-template-columns: 1fr; max-width: 800px; margin: 0 auto; gap: 30px; }
          .pillar-card { padding: 40px; }
        }

        @media (max-width: 992px) {
          .about-stats-ribbon { grid-template-columns: 1fr 1fr; display: grid; gap: 30px; padding: 40px 20px; }
          .stat-node strong { font-size: 1.8rem; }
          .values-list { align-items: center; }
          .tech-features { align-items: center; }
        }

        @media (max-width: 768px) {
          .about-hero { padding: 60px 0 40px; }
          .hero-text h1 { font-size: 2.5rem; }
          .hero-text p { font-size: 1.1rem; }
          .identity-section, .pillars-section, .about-footer { padding: 60px 0; }
          .text-side h2 { font-size: 2rem; }
          .tech-text h2 { font-size: 2rem; }
          .about-footer { padding: 60px 20px 100px; }
          .about-footer h2 { font-size: 2.5rem; }
          .about-footer p { font-size: 1.1rem; margin-bottom: 35px; }
          .btn-group { flex-direction: column; align-items: center; gap: 20px; }
          .btn-main, .btn-light { 
            width: 100%; 
            max-width: 340px; 
            padding: 18px 30px; 
            font-size: 1.1rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        @media (max-width: 480px) {
          .container { padding: 0 20px; }
          .hero-text h1 { font-size: 2rem; letter-spacing: -1px; }
          .premium-badge { padding: 8px 18px; font-size: 0.7rem; }
          .about-stats-ribbon { gap: 20px; }
          .stat-node strong { font-size: 1.5rem; }
          .identity-section { padding: 40px 0; }
          .text-side h2 { font-size: 1.8rem; }
          .text-side p { font-size: 1rem; }
          .tech-container { padding: 40px 20px; border-radius: 30px; }
          .tech-text h2 { font-size: 1.6rem; }
          .tech-text p { font-size: 1rem; }
          .about-footer h2 { font-size: 2rem; }
          .about-footer p { font-size: 1rem; }
        }

        @media (max-width: 360px) {
          .hero-text h1 { font-size: 1.8rem; }
          .stat-node strong { font-size: 1.3rem; }
          .pillar-card { padding: 30px 20px; }
          .about-footer h2 { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
};

// Add this helper if not already present globally
const FaCheckCircle = ({ className }) => (
  <svg className={className} stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
    <path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.248-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.628 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z"></path>
  </svg>
);

export default About;
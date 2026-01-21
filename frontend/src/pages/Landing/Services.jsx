import React from 'react';
import { 
  FaFingerprint, FaCalculator, FaSatellite, FaMobileAlt, 
  FaFileInvoiceDollar, FaUserLock, FaCloud, FaClock, FaArrowRight, FaHandshake
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import aiFaceImg from '../../assets/AI-Face-detection-for attedace.jpeg';

const Services = () => {
  return (
    <div className="services-wrapper">
      
      {/* --- HERO SECTION --- */}
      <section className="services-hero">
        <div className="container">
          <div className="hero-flex">
            <div className="hero-text animate-up">
                <span className="service-badge">CORE MODULES</span>
                <h1>End-to-End <span>Smart HRMS</span> Solutions</h1>
                <p>
                  From fast onboarding to automated exit management, SmartHRMS provides a comprehensive suite of AI-powered tools 
                  to streamline your entire employee lifecycle.
                </p>
                
                {/* 1. BUTTONS: Same Design Style with Animation */}
                <div className="cta-actions">
                    <div className="button-group">
                      <Link to="/contact" className="btn-main">
                        Request Service Catalog <FaArrowRight className="btn-icon"/>
                      </Link>
                      <Link to="/partner-with-us" className="btn-secondary">
                        Partner With Us <FaHandshake className="btn-icon"/>
                      </Link>
                    </div>
                    <div className="uptime-pill">🟢 99.9% Uptime Guaranteed</div>
                </div>

            </div>
            <div className="hero-visual animate-fade">
                {/* Relevant Dashboard/Tech Image */}
                <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Smart HRMS Dashboard" />
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. ECOSYSTEM GRID: Changed Color for Visibility --- */}
      <section className="grid-section">
        <div className="container">
          <div className="centered-header">
             <h2>Our Professional <span>Ecosystem</span></h2>
             <p>Scalable modules designed for modern businesses. Activate only what you need.</p>
          </div>

          <div className="service-main-grid">
         {/* Service 1: Biometric - 3. NEW AI FACE IMAGE */}
<div className="service-card animate-up">
    <div className="img-holder">
        {/* Use the imported variable inside curly brackets {} */}
        <img src={aiFaceImg} alt="AI Face Scan Tech" />
    </div>
    <div className="card-content">
        <FaFingerprint className="s-icon blue"/>
        <h3>AI Face Attendance</h3>
        <p>Next-gen proprietary biometric engine that verifies identity instantly with advanced anti-spoofing technology.</p>
    </div>
</div>
             {/* Service 2: Payroll */}
             <div className="service-card animate-up" style={{animationDelay:'0.1s'}}>
                <div className="img-holder">
                    <img src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" alt="Payroll Calculation" />
                </div>
                <div className="card-content">
                    <FaCalculator className="s-icon green"/>
                    <h3>One-Click Payroll</h3>
                    <p>Automated salary processing with built-in compliance for PF, ESI, TDS, and dynamic bonus structures.</p>
                </div>
             </div>

             {/* Service 3: Geofencing */}
             <div className="service-card animate-up" style={{animationDelay:'0.2s'}}>
                <div className="img-holder">
                    <img src="https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" alt="GPS Tracking" />
                </div>
                <div className="card-content">
                    <FaSatellite className="s-icon red"/>
                    <h3>GPS Geo-Fencing</h3>
                    <p>Create virtual office boundaries. Attendance is only marked when employees are physically within the approved radius.</p>
                </div>
             </div>

             {/* Service 4: Analytics */}
             <div className="service-card animate-up" style={{animationDelay:'0.3s'}}>
                <div className="img-holder">
                    <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60" alt="Analytics Dashboard" />
                </div>
                <div className="card-content">
                    <FaFileInvoiceDollar className="s-icon purple"/>
                    <h3>Smart Analytics</h3>
                    <p>Real-time actionable insights on absenteeism, overtime trends, and workforce productivity costs.</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- FEATURE HIGHLIGHT --- */}
      <section className="feature-highlight">
          <div className="container">
              <div className="highlight-flex">
                  <div className="highlight-visual animate-fade">
                      <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Remote Work Team" />
                  </div>
                  <div className="highlight-text">
                      <h2>Built for the <span>Hybrid</span> Workplace</h2>
                      <p>Whether your team is in HQ, working from home, or on the field, Smart HRMS keeps everyone synchronized.</p>
                      <ul className="check-list">
                          <li><FaUserLock/> Secure Encrypted Data Handling</li>
                          <li><FaClock/> Real-time Shift & Break Management</li>
                          <li><FaCloud/> 24/7 Cloud Access from Anywhere</li>
                          <li><FaMobileAlt/> Responsive Mobile Employee Portal</li>
                      </ul>
                  </div>
              </div>
          </div>
      </section>

      {/* --- SERVICE FLOW --- */}
      <section className="service-process">
          <div className="container">
              <h2>Simplified Onboarding <span>Process</span></h2>
              <div className="process-grid">
                  <div className="process-node">
                      <div className="node-number">01</div>
                      <h4>Setup Company</h4>
                      <p>Register your organization and define office locations and policies.</p>
                  </div>
                  <div className="process-node">
                      <div className="node-number">02</div>
                      <h4>Add Employees</h4>
                      <p>Bulk import staff data and register their biometric face IDs.</p>
                  </div>
                  <div className="process-node">
                      <div className="node-number">03</div>
                      <h4>Go Live</h4>
                      <p>Start tracking attendance and processing payroll immediately.</p>
                  </div>
              </div>
          </div>
      </section>

      {/* --- 4. FINAL CTA WITH TWO BUTTONS --- */}
      <section className="final-cta">
          <div className="cta-card">
              <h2 id="id12">Ready for an <span>Efficiency</span> Boost?</h2>
              <h4 id="id8">Experience the most robust Smart HRMS in the Indian SaaS market.</h4>
              
              <div className="cta-buttons-row">
                <Link to="/contact" className="btn-white-lg">
                    Book Service Demo <FaArrowRight/>
                </Link>
                <Link to="/partner-with-us" className="btn-outline-lg">
                    Partner With Us <FaHandshake/>
                </Link>
              </div>
          </div>
      </section>

      <style>{`
        .services-wrapper { font-family: 'Plus Jakarta Sans', sans-serif; background: #fff; overflow-x: hidden; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }

        /* ANIMATIONS */
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-up { animation: fadeUp 0.8s ease-out forwards; opacity: 0; }
        .animate-fade { animation: fadeIn 1s ease-out forwards; opacity: 0; }

        /* HERO SECTION */
        .services-hero { padding: 80px 0; background: radial-gradient(circle at top right, #f0f9ff, #fff); }
        .hero-flex { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 60px; align-items: center; }
        .service-badge { background: #e0f2fe; color: #0284c7; padding: 6px 15px; border-radius: 50px; font-weight: 800; font-size: 0.75rem; letter-spacing: 1px; }
        
        .hero-text h1 { font-size: 3.5rem; font-weight: 900; margin: 20px 0; line-height: 1.1; letter-spacing: -1px; color: #0f172a; }
        .hero-text h1 span { color: #0284c7; } 
        .hero-text p { font-size: 1.15rem; color: #64748b; line-height: 1.6; margin-bottom: 30px; }
        
        /* CTA ACTIONS - Buttons */
        .cta-actions { display: flex; flex-direction: column; gap: 20px; align-items: flex-start; margin-top: 20px; }
        .button-group { display: flex; gap: 15px; flex-wrap: wrap; }

        .btn-main { 
            background: #0284c7; color: #fff; padding: 15px 30px; border-radius: 12px; 
            font-weight: 700; text-decoration: none; transition: 0.3s; 
            box-shadow: 0 4px 14px rgba(2,132,199,0.3); display: flex; align-items: center; gap: 8px;
        }
            
        .btn-main:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(2,132,199,0.4); background: #0369a1; }
        
        /* Secondary Button (Partner) - Matches design but outline style */
        .btn-secondary { 
            background: white; color: #0284c7; border: 2px solid #0284c7; 
            padding: 13px 28px; border-radius: 12px; font-weight: 700; 
            text-decoration: none; transition: 0.3s; display: flex; align-items: center; gap: 8px;
        }
        .btn-secondary:hover { background: #e0f2fe; transform: translateY(-3px); box-shadow: 0 4px 10px rgba(0,0,0,0.05); }

        .uptime-pill { font-size: 0.85rem; font-weight: 700; color: #166534; background: #dcfce7; padding: 8px 15px; border-radius: 30px; display: inline-block; }
        
        .hero-visual img { width: 100%; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.15); transform: rotate(2deg); transition: 0.5s; }
        .hero-visual:hover img { transform: rotate(0deg) scale(1.02); }

        /* === GRID SECTION (CHANGED BG COLOR) === */
        .grid-section { 
            padding: 80px 0; 
            background: #f8fafc; /* Light Grey-Blue for Contrast */
        }
        .centered-header { text-align: center; margin-bottom: 60px; }
        .centered-header h2 { font-size: 2.5rem; font-weight: 800; color: #0f172a; }
        .centered-header h2 span { color: #0284c7; }
        .centered-header p { color: #475569; margin-top: 10px; font-size: 1.1rem; }
        
        .service-main-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 30px; }
        
        .service-card { 
            background: #fff; border-radius: 20px; overflow: hidden; 
            border: 1px solid #e2e8f0; transition: 0.3s; 
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); 
        }
        .service-card:hover { transform: translateY(-10px); border-color: #38bdf8; box-shadow: 0 20px 40px -10px rgba(2, 132, 199, 0.15); }
        
        .img-holder { height: 180px; overflow: hidden; }
        .img-holder img { width: 100%; height: 100%; object-fit: cover; transition: 0.5s; }
        .service-card:hover .img-holder img { transform: scale(1.1); }
        
        .card-content { padding: 25px; }
        .s-icon { font-size: 1.8rem; margin-bottom: 15px; }
        .s-icon.blue { color: #0284c7; } .s-icon.green { color: #10b981; } .s-icon.red { color: #ef4444; } .s-icon.purple { color: #7c3aed; }
        
        /* Text Visibility Fixed */
        .card-content h3 { margin-bottom: 10px; color: #0f172a; font-size: 1.3rem; font-weight: 700; }
        .card-content p { color: #334155; line-height: 1.6; font-size: 0.95rem; }

        /* FEATURE HIGHLIGHT */
        .feature-highlight { padding: 80px 0; background: #fff; }
        .highlight-flex { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; align-items: center; }
        .highlight-visual img { width: 100%; border-radius: 24px; box-shadow: 0 20px 40px -10px rgba(0,0,0,0.1); }
        .highlight-text h2 { font-size: 2.2rem; font-weight: 800; margin-bottom: 20px; color: #0f172a; }
        .highlight-text h2 span { color: #0284c7; }
        .check-list { list-style: none; padding: 0; margin-top: 25px; }
        .check-list li { display: flex; align-items: center; gap: 12px; font-weight: 600; color: #334155; margin-bottom: 12px; }
        .check-list svg { color: #0284c7; font-size: 1.1rem; }

        /* PROCESS SECTION */
        .service-process { padding: 80px 0; text-align: center; background: #f1f5f9; }
        .service-process h2 { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin-bottom: 50px; }
        .service-process span { color: #0284c7; }
        .process-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 30px; }
        .node-number { font-size: 3rem; font-weight: 900; color: #cbd5e1; line-height: 1; margin-bottom: 10px; transition: 0.3s; }
        .process-node:hover .node-number { color: #0284c7; transform: scale(1.1); }
        .process-node h4 { font-size: 1.2rem; margin-bottom: 8px; color: #0f172a; }
        .process-node p { color: #64748b; font-size: 0.95rem; }

        /* FINAL CTA - UPDATED with 2 Buttons */
        .final-cta { padding: 80px 20px; }
        .cta-card { background: #0f172a; padding: 60px 40px; border-radius: 30px; text-align: center; color: #fff; box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25); }
        .cta-card h2 { font-size: 2.5rem; font-weight: 800; margin-bottom: 15px; }
        .cta-card h2 span { color: #38bdf8; }
        
        .cta-buttons-row { display: flex; justify-content: center; gap: 20px; margin-top: 30px; flex-wrap: wrap; }
        #id12{
       color: #B8860B;
        }
       #id8{
       color: #fff;;
       }
        .btn-white-lg { 
            background: #fff; color: #0f172a; padding: 16px 35px; border-radius: 12px; 
            font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; 
            gap: 10px; transition: 0.3s; 
        }
        .btn-white-lg:hover { transform: scale(1.05); box-shadow: 0 10px 20px rgba(255,255,255,0.1); }

        .btn-outline-lg { 
            background: transparent; color: #fff; border: 2px solid #fff; padding: 14px 33px; 
            border-radius: 12px; font-weight: 700; text-decoration: none; display: inline-flex; 
            align-items: center; gap: 10px; transition: 0.3s; 
        }
        .btn-outline-lg:hover { background: rgba(255,255,255,0.1); transform: scale(1.05); }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .hero-flex, .highlight-flex, .process-grid { grid-template-columns: 1fr; text-align: center; gap: 40px; }
          .hero-text h1 { font-size: 2.5rem; }
          .cta-actions { align-items: center; }
          .button-group { justify-content: center; }
          .hero-visual { order: -1; margin-bottom: 30px; }
          .highlight-visual { order: -1; }
          .check-list { display: inline-block; text-align: left; }
        }

        @media (max-width: 600px) {
            .button-group { flex-direction: column; width: 100%; }
            .btn-main, .btn-secondary { width: 100%; text-align: center; justify-content: center; }
            .cta-buttons-row { flex-direction: column; width: 100%; }
            .btn-white-lg, .btn-outline-lg { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
};

export default Services;
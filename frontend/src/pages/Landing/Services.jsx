import React, { useState, useRef } from 'react';
import {
  FaFingerprint, FaCalculator, FaSatellite, FaMobileAlt,
  FaFileInvoiceDollar, FaUserLock, FaCloud, FaClock, FaArrowRight, FaHandshake,
  FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import aiFaceImg from '../../assets/AI-Face-detection-for attedace.jpeg';
import serviceImg from '../../assets/service.png';

const serviceCards = [
  {
    id: 1,
    img: aiFaceImg,
    icon: <FaFingerprint />,
    iconClass: 'blue',
    title: 'AI Face Attendance',
    desc: 'Next-gen proprietary biometric engine that verifies identity instantly with advanced anti-spoofing technology.',
  },
  {
    id: 2,
    img: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=80',
    icon: <FaCalculator />,
    iconClass: 'green',
    title: 'One-Click Payroll',
    desc: 'Automated salary processing with built-in compliance for PF, ESI, TDS, and dynamic bonus structures.',
  },
  {
    id: 3,
    img: 'https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=80',
    icon: <FaSatellite />,
    iconClass: 'red',
    title: 'GPS Geo-Fencing',
    desc: 'Create virtual office boundaries. Attendance is only marked when employees are physically within the approved radius.',
  },
  {
    id: 4,
    img: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=900&q=80',
    icon: <FaFileInvoiceDollar />,
    iconClass: 'purple',
    title: 'Smart Analytics',
    desc: 'Real-time actionable insights on absenteeism, overtime trends, and workforce productivity costs.',
  },
];

const n = serviceCards.length;

// Returns the position label for a card relative to active index
// pos: -2 → far left (hidden), -1 → left peek, 0 → active, 1 → right peek, 2 → far right (hidden)
function getPos(cardIndex, activeIndex) {
  let diff = cardIndex - activeIndex;
  // Wrap around
  if (diff > n / 2) diff -= n;
  if (diff < -n / 2) diff += n;
  return diff;
}

const Services = () => {
  const [active, setActive] = useState(0);
  const touchStartX = useRef(null);

  const prev = () => setActive((a) => (a - 1 + n) % n);
  const next = () => setActive((a) => (a + 1) % n);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) { diff > 0 ? next() : prev(); }
    touchStartX.current = null;
  };

  return (
    <div className="services-wrapper">

      {/* HERO */}
      <section className="services-hero">
        <div className="hero-blobs">
          <div className="blob b1-s" />
          <div className="blob b2-s" />
        </div>
        <div className="hero-overlay" />
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
          <div className="hero-flex">
            <div className="hero-text animate-up">
              <span className="service-badge">CORE MODULES</span>
              <h1>End-to-End <span className="gradient-text">WorknAI HRMS</span> Solutions</h1>
              <p>From fast onboarding to automated exit management, WorknAI provides a comprehensive suite of AI-powered tools to streamline your entire employee lifecycle.</p>
              <div className="button-group">
                <Link to="/contact" className="btn-main">Get Started Today <FaArrowRight /></Link>
                <Link to="/partner-with-us" className="btn-secondary">Partner With Us <FaHandshake /></Link>
              </div>
            </div>
            <div className="hero-visual animate-fade">
              <div className="media-frame">
                <img src={serviceImg} alt="WorknAI Dashboard" />
                <div className="frame-glow" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COVERFLOW CAROUSEL */}
      <section className="grid-section">
        <div className="container">
          <div className="centered-header">
            <h2>Our Professional <span>Ecosystem</span></h2>
            <p>Scalable modules designed for modern businesses. Activate only what you need.</p>
          </div>
        </div>

        <div
          className="coverflow-stage"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Prev arrow */}
          <button className="cf-nav cf-prev" onClick={prev}><FaChevronLeft /></button>

          {/* Cards */}
          <div className="cf-track">
            {serviceCards.map((card, i) => {
              const pos = getPos(i, active);
              if (Math.abs(pos) > 1) return null; // only render -1, 0, +1

              let cls = 'cf-card';
              if (pos === -1) cls += ' cf-left';
              else if (pos === 1) cls += ' cf-right';
              else cls += ' cf-active';

              return (
                <div
                  key={card.id}
                  className={cls}
                  onClick={() => {
                    if (pos === -1) prev();
                    else if (pos === 1) next();
                  }}
                >
                  {/* Image top */}
                  <div className="cf-img">
                    <img src={card.img} alt={card.title} />
                    <div className="cf-img-fade" />
                  </div>

                  {/* Content — only shown on active */}
                  <div className="cf-body">
                    <div className={`cf-icon ${card.iconClass}`}>{card.icon}</div>
                    <h3 className="cf-title">{card.title}</h3>
                    <p className="cf-desc">{card.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Next arrow */}
          <button className="cf-nav cf-next" onClick={next}><FaChevronRight /></button>
        </div>

        {/* Dots */}
        <div className="cf-dots">
          {serviceCards.map((_, i) => (
            <button
              key={i}
              className={`cf-dot ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
              aria-label={`Go to card ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* FEATURE HIGHLIGHT */}
      <section className="feature-highlight">
        <div className="container">
          <div className="highlight-flex">
            <div className="highlight-visual animate-fade">
              <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Remote Work Team" />
            </div>
            <div className="highlight-text">
              <h2>Built for the <span>Hybrid</span> Workplace</h2>
              <p>Whether your team is in HQ, working from home, or on the field, WorknAI HRMS keeps everyone synchronized.</p>
              <ul className="check-list">
                <li><FaUserLock /> Secure Encrypted Data Handling</li>
                <li><FaClock /> Real-time Shift &amp; Break Management</li>
                <li><FaCloud /> 24/7 Cloud Access from Anywhere</li>
                <li><FaMobileAlt /> Responsive Mobile Employee Portal</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="service-process">
        <div className="container">
          <div className="process-header">
            <span className="process-badge">HOW IT WORKS</span>
            <h2>Simplified Onboarding <span>Process</span></h2>
            <p className="process-sub">Get your entire organization up and running in three simple steps.</p>
          </div>
          <div className="process-grid">
            <div className="process-node node-blue">

              <div className="node-icon-wrap blue-g">
                <FaUserLock size={28} />
              </div>
              <h4>Setup Company</h4>
              <p>Register your organization and define office locations and policies in minutes.</p>
              <div className="node-tag">~5 minutes</div>
            </div>
            <div className="process-arrow"><FaArrowRight /></div>
            <div className="process-node node-purple">

              <div className="node-icon-wrap purple-g">
                <FaMobileAlt size={28} />
              </div>
              <h4>Add Employees</h4>
              <p>Bulk import staff data and register their biometric face IDs seamlessly.</p>
              <div className="node-tag">Bulk import</div>
            </div>
            <div className="process-arrow"><FaArrowRight /></div>
            <div className="process-node node-green">

              <div className="node-icon-wrap green-g">
                <FaCloud size={28} />
              </div>
              <h4>Go Live</h4>
              <p>Start tracking attendance and processing payroll immediately on day one.</p>
              <div className="node-tag">Instant activation</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="final-cta">
        <div className="cta-card">
          <h2>Ready for an <span className="gradient-text">Efficiency</span> Boost?</h2>
          <h4>Experience the most robust WorknAI HRMS in the Indian SaaS market.</h4>
          <div className="cta-buttons-row">
            <Link to="/contact" className="btn-white-lg">Book Service Demo <FaArrowRight /></Link>
            <Link to="/partner-with-us" className="btn-outline-lg">Partner With Us <FaHandshake /></Link>
          </div>
        </div>
      </section>

      <style>{`
        * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
        .services-wrapper { 
          font-family: 'Inter', sans-serif; 
          background: #050714; 
          color: #fff; 
          overflow-x: hidden; 
          padding-top: 70px; 
        }

        @media (max-width: 1024px) {
          .services-wrapper {
            padding-top: 60px;
          }
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

        .gradient-text { background: linear-gradient(90deg,#50c8ff 0%,#a78bfa 55%,#e879f9 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; display: inline-block; }

        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .animate-up { animation: fadeUp 0.8s cubic-bezier(0.16,1,0.3,1) forwards; opacity:0; }
        .animate-fade { animation: fadeIn 1.2s ease-out forwards; opacity:0; }

        /* HERO */
        .services-hero { padding:20px 0 30px; position:relative; min-height:auto; display:flex; align-items:center; background:#050714; overflow:hidden; }
        .hero-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(5,7,20,0.8) 0%,rgba(5,7,20,0.5) 50%,rgba(5,7,20,0.7) 100%); z-index:1; }
        .hero-blobs { position:absolute; inset:0; z-index:0; overflow:hidden; }
        .blob { position:absolute; border-radius:50%; filter:blur(80px); opacity:0.15; }
        .b1-s { width:400px; height:400px; background:#50c8ff; top:-100px; left:-100px; }
        .b2-s { width:350px; height:350px; background:#a78bfa; bottom:-50px; right:-50px; }
        .hero-flex { display:grid; grid-template-columns:1.1fr 0.9fr; gap:60px; align-items:center; }
        .service-badge { background:rgba(80,200,255,0.1); color:#50c8ff; padding:8px 18px; border-radius:50px; font-weight:800; font-size:0.83rem; letter-spacing:1.5px; border:1px solid rgba(80,200,255,0.2); display:inline-block; margin-bottom:12px; }
        .hero-text h1 { font-size:clamp(1.6rem,3.2vw,2.5rem); font-weight:900; margin:10px 0; line-height:1.15; letter-spacing:-0.02em; color:#fff; }
        .hero-text p { font-size:0.9rem; color:rgba(255,255,255,0.85); line-height:1.65; margin-bottom:24px; max-width:600px; }
        .button-group { display:flex; gap:16px; flex-wrap:wrap; }
        .btn-main { background:linear-gradient(135deg,#3b82f6,#8b5cf6); color:#fff; padding:14px 32px; border-radius:12px; font-weight:700; font-size:1rem; text-decoration:none; transition:0.3s; display:inline-flex; align-items:center; gap:10px; box-shadow:0 4px 24px rgba(124,58,237,0.4); border:none; position:relative; }
        .btn-main:hover { transform:translateY(-2px); box-shadow:0 10px 30px rgba(124,58,237,0.5); }
        .btn-secondary { background:rgba(255,255,255,0.08); color:#fff; border:1px solid rgba(255,255,255,0.25); padding:14px 32px; border-radius:12px; font-weight:600; font-size:1rem; text-decoration:none; transition:0.3s; display:inline-flex; align-items:center; gap:10px; backdrop-filter:blur(8px); }
        .btn-secondary:hover { background:rgba(255,255,255,0.12); transform:translateY(-2px); }
        .media-frame { position:relative; border-radius:24px; overflow:hidden; border:1px solid rgba(255,255,255,0.1); }
        .media-frame img { width:100%; display:block; filter:brightness(0.9); }
        .frame-glow { position:absolute; inset:0; box-shadow:inset 0 0 80px rgba(0,0,0,0.4); pointer-events:none; }

        /* GRID SECTION */
        .grid-section { padding:60px 0 40px; background:rgba(255,255,255,0.01); border-top:1px solid rgba(255,255,255,0.05); border-bottom:1px solid rgba(255,255,255,0.05); }
        .centered-header { text-align:center; max-width:700px; margin:0 auto 60px; }
        .centered-header h2 { font-size:clamp(1.6rem,3vw,2.2rem); font-weight:900; color:#fff; margin-bottom:12px; }
        .centered-header h2 span { color:#a78bfa; }
        .centered-header p { color:rgba(255,255,255,0.6); font-size:0.95rem; line-height:1.6; }

        /* ======= COVERFLOW ======= */
        .coverflow-stage {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          perspective: 1400px;
          height: 520px;
          overflow: visible;
        }

        .cf-track {
          position: relative;
          width: 100%;
          max-width: 1100px;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* BASE CARD */
        .cf-card {
          position: absolute;
          width: 380px;
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 30px 70px rgba(0,0,0,0.6);
          transition: all 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          cursor: pointer;
          background: rgba(10, 12, 30, 0.9);
          backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
        }

        /* Active (center) card */
        .cf-card.cf-active {
          transform: translateX(0) scale(1) rotateY(0deg);
          z-index: 10;
          cursor: default;
          border-color: rgba(80, 200, 255, 0.3);
          box-shadow: 0 40px 90px rgba(0,0,0,0.7), 0 0 40px rgba(80,200,255,0.15);
          width: 420px;
        }

        /* Left side card */
        .cf-card.cf-left {
          transform: translateX(-440px) scale(0.82) rotateY(12deg);
          z-index: 5;
          filter: brightness(0.72);
          border-color: rgba(255,255,255,0.08);
        }
        .cf-card.cf-left:hover {
          filter: brightness(0.88);
        }

        /* Right side card */
        .cf-card.cf-right {
          transform: translateX(440px) scale(0.82) rotateY(-12deg);
          z-index: 5;
          filter: brightness(0.72);
          border-color: rgba(255,255,255,0.08);
        }
        .cf-card.cf-right:hover {
          filter: brightness(0.88);
        }

        /* Card image */
        .cf-img {
          position: relative;
          height: 220px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .cf-img img {
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.6s ease;
        }
        .cf-card.cf-active:hover .cf-img img { transform: scale(1.05); }
        .cf-img-fade {
          position: absolute; inset: 0;
          background: linear-gradient(to bottom, transparent 50%, rgba(10,12,30,0.95) 100%);
        }

        /* Card body (text content) */
        .cf-body {
          padding: 28px 30px 32px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        /* Icon */
        .cf-icon {
          width: 48px; height: 48px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem;
        }
        .cf-icon.blue   { background:rgba(96,165,250,0.15); color:#60a5fa; border:1px solid rgba(96,165,250,0.3); }
        .cf-icon.green  { background:rgba(52,211,153,0.15); color:#34d399; border:1px solid rgba(52,211,153,0.3); }
        .cf-icon.red    { background:rgba(248,113,113,0.15); color:#f87171; border:1px solid rgba(248,113,113,0.3); }
        .cf-icon.purple { background:rgba(167,139,250,0.15); color:#a78bfa; border:1px solid rgba(167,139,250,0.3); }

        .cf-title { font-size: 1.35rem; font-weight: 900; color: #fff; letter-spacing: -0.5px; margin: 0; }
        .cf-desc  { font-size: 0.95rem; color: rgba(255,255,255,0.65); line-height: 1.65; margin: 0; }

        /* Side cards show full content, slightly muted */
        .cf-card.cf-left  .cf-body,
        .cf-card.cf-right .cf-body {
          opacity: 1;
        }

        /* Nav arrows */
        .cf-nav {
          position: absolute;
          top: 50%; transform: translateY(-50%);
          width: 52px; height: 52px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          font-size: 1.2rem;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          z-index: 20;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        .cf-nav:hover { background:rgba(80,200,255,0.15); border-color:#50c8ff; color:#50c8ff; box-shadow:0 0 20px rgba(80,200,255,0.25); }
        .cf-prev { left: 12px; }
        .cf-next { right: 12px; }

        /* Dots */
        .cf-dots { display:flex; justify-content:center; gap:10px; margin-top:40px; padding-bottom:20px; }
        .cf-dot { width:10px; height:10px; border-radius:50%; border:none; background:rgba(255,255,255,0.2); cursor:pointer; transition:all 0.3s ease; padding:0; }
        .cf-dot.active { background:#50c8ff; width:28px; border-radius:6px; box-shadow:0 0 12px rgba(80,200,255,0.5); }

        /* FEATURE HIGHLIGHT */
        .feature-highlight { padding:60px 0; background:#050714; }
        .highlight-flex { display:grid; grid-template-columns:1fr 1fr; gap:80px; align-items:center; }
        .highlight-visual img { width:100%; border-radius:24px; border:1px solid rgba(255,255,255,0.1); box-shadow:0 30px 60px rgba(0,0,0,0.5); }
        .highlight-text h2 { font-size:clamp(1.4rem,2.8vw,2rem); font-weight:850; margin-bottom:20px; color:#fff; }
        .highlight-text h2 span { color:#a78bfa; }
        .highlight-text p { color:rgba(255,255,255,0.7); line-height:1.7; }
        .check-list { list-style:none; padding:0; margin-top:25px; }
        .check-list li { display:flex; align-items:center; gap:12px; font-weight:600; color:rgba(255,255,255,0.8); margin-bottom:12px; font-size:0.95rem; }
        .check-list svg { color:#a78bfa; font-size:1.1rem; }

        /* PROCESS */
        .service-process { padding: 60px 0; text-align: center; background: rgba(255,255,255,0.01); overflow: hidden; }

        .process-header { margin-bottom: 60px; }
        .process-badge { background: rgba(167,139,250,0.12); color: #a78bfa; padding: 8px 20px; border-radius: 50px; font-weight: 800; font-size: 0.8rem; letter-spacing: 2px; border: 1px solid rgba(167,139,250,0.25); display: inline-block; margin-bottom: 16px; }
        .service-process h2 { font-size: clamp(1.6rem,3vw,2.2rem); font-weight: 900; color: #fff; margin-bottom: 16px; }
        .service-process h2 span { color: #a78bfa; }
        .process-sub { color: rgba(255,255,255,0.55); font-size: 1rem; max-width: 520px; margin: 0 auto; line-height: 1.6; }

        .process-grid { display: grid; grid-template-columns: 1fr auto 1fr auto 1fr; gap: 0; align-items: center; }

        .process-node {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 28px;
          padding: 44px 32px 36px;
          position: relative;
          transition: all 0.45s cubic-bezier(0.175,0.885,0.32,1.275);
          backdrop-filter: blur(12px);
          overflow: hidden;
          text-align: center;
        }
        .process-node::before {
          content: '';
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.4s ease;
          border-radius: 28px;
        }
        .node-blue::before  { background: radial-gradient(circle at top, rgba(96,165,250,0.12), transparent 65%); }
        .node-purple::before{ background: radial-gradient(circle at top, rgba(167,139,250,0.12), transparent 65%); }
        .node-green::before { background: radial-gradient(circle at top, rgba(52,211,153,0.12), transparent 65%); }
        .process-node:hover::before { opacity: 1; }

        .process-node:hover { transform: translateY(-14px) scale(1.03); background: rgba(255,255,255,0.06); box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
        .node-blue:hover  { border-color: rgba(96,165,250,0.4); box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(96,165,250,0.2); }
        .node-purple:hover{ border-color: rgba(167,139,250,0.4); box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.2); }
        .node-green:hover { border-color: rgba(52,211,153,0.4); box-shadow: 0 30px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(52,211,153,0.2); }



        /* Icon circle */
        .node-icon-wrap {
          width: 68px; height: 68px;
          border-radius: 20px;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 22px;
          position: relative; z-index: 2;
          transition: 0.4s;
        }
        .process-node:hover .node-icon-wrap { transform: scale(1.1) rotate(-4deg); }
        .blue-g   { background: rgba(96,165,250,0.15);  color: #60a5fa; border: 1px solid rgba(96,165,250,0.35); box-shadow: 0 8px 24px rgba(96,165,250,0.2); }
        .purple-g { background: rgba(167,139,250,0.15); color: #a78bfa; border: 1px solid rgba(167,139,250,0.35); box-shadow: 0 8px 24px rgba(167,139,250,0.2); }
        .green-g  { background: rgba(52,211,153,0.15);  color: #34d399; border: 1px solid rgba(52,211,153,0.35); box-shadow: 0 8px 24px rgba(52,211,153,0.2); }

        .process-node h4 { font-size: 1.3rem; font-weight: 900; margin-bottom: 12px; color: #fff; letter-spacing: -0.3px; position: relative; z-index: 2; }
        .process-node p { color: rgba(255,255,255,0.65); font-size: 0.95rem; line-height: 1.7; position: relative; z-index: 2; margin-bottom: 20px; }

        .node-tag {
          display: inline-flex; align-items: center;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 5px 14px; border-radius: 30px;
          font-size: 0.78rem; font-weight: 700;
          color: rgba(255,255,255,0.5);
          letter-spacing: 0.5px;
          position: relative; z-index: 2;
        }

        /* Arrow connector */
        .process-arrow {
          display: flex; align-items: center; justify-content: center;
          color: rgba(255,255,255,0.2);
          font-size: 1.6rem;
          padding: 0 8px;
          flex-shrink: 0;
        }

        /* CTA */
        .final-cta { padding:60px 24px; background:#050714; }
        .cta-card { background:linear-gradient(135deg,#11112a 0%,#1a1145 40%,#170d30 100%); padding:60px 40px; border-radius:30px; text-align:center; color:#fff; border:1px solid rgba(167,139,250,0.2); box-shadow:0 0 60px rgba(124,58,237,0.1); position:relative; overflow:hidden; }
        .cta-card::before { content:""; position:absolute; inset:-40%; background:radial-gradient(circle,rgba(56,189,248,0.15),transparent 70%); animation:slowPulse 8s infinite linear; }
        @keyframes slowPulse { 0% { transform:rotate(0deg); } 100% { transform:rotate(360deg); } }
        .cta-card h2 { font-size:clamp(1.4rem,2.8vw,2rem); font-weight:850; margin-bottom:14px; position:relative; z-index:2; }
        .cta-card h4 { font-size:0.95rem; font-weight:400; color:rgba(255,255,255,0.7); margin-bottom:30px; position:relative; z-index:2; }
        .cta-buttons-row { display:flex; justify-content:center; gap:20px; margin-top:30px; flex-wrap:wrap; position:relative; z-index:2; }
        .btn-white-lg { background:#fff; color:#000; padding:14px 36px; border-radius:50px; font-weight:700; text-decoration:none; display:inline-flex; align-items:center; gap:10px; transition:0.3s; box-shadow:0 4px 20px rgba(255,255,255,0.15); }
        .btn-white-lg:hover { transform:translateY(-3px); box-shadow:0 10px 30px rgba(255,255,255,0.25); }
        .btn-outline-lg { background:transparent; color:#fff; border:1px solid rgba(255,255,255,0.25); padding:14px 36px; border-radius:50px; font-weight:600; text-decoration:none; display:inline-flex; align-items:center; gap:10px; transition:0.3s; }
        .btn-outline-lg:hover { background:rgba(255,255,255,0.08); border-color:rgba(255,255,255,0.4); transform:translateY(-3px); }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .container { padding: 0 40px; }
          .hero-flex { gap: 40px; }
          .coverflow-stage { height: 480px; }
          .cf-card { width: 340px; }
          .cf-card.cf-active { width: 380px; }
          .cf-card.cf-left { transform: translateX(-320px) scale(0.85) rotateY(15deg); }
          .cf-card.cf-right { transform: translateX(320px) scale(0.85) rotateY(-15deg); }
        }

        @media (max-width: 992px) {
          .services-hero { padding: 60px 0; }
          .hero-flex, .highlight-flex { grid-template-columns: 1fr; text-align: center; gap: 50px; }
          .hero-text { order: 1; display: flex; flex-direction: column; align-items: center; }
          .hero-text p { margin-left: auto; margin-right: auto; }
          .hero-visual { order: 2; max-width: 600px; margin: 0 auto; }
          .highlight-text { order: 1; }
          .highlight-visual { order: 2; max-width: 600px; margin: 0 auto; }
          .check-list { display: inline-block; text-align: left; }
          .process-grid { grid-template-columns: 1fr; gap: 24px; max-width: 450px; margin: 0 auto; }
          .process-arrow { transform: rotate(90deg); margin: 10px 0; opacity: 0.5; }
        }

        @media (max-width: 768px) {
          .services-hero { padding: 40px 0; }
          .hero-text h1 { font-size: 2.2rem; }
          .coverflow-stage { height: 440px; }
          .cf-card { width: 300px; }
          .cf-card.cf-active { width: 330px; }
          .cf-card.cf-left { transform: translateX(-240px) scale(0.8) rotateY(12deg); }
          .cf-card.cf-right { transform: translateX(240px) scale(0.8) rotateY(-12deg); }
          .cf-img { height: 180px; }
          .cf-body { padding: 20px; }
          .cf-title { font-size: 1.2rem; }
          .cf-desc { font-size: 0.88rem; }
          .feature-highlight { padding: 60px 0; }
          .service-process { padding: 60px 0; }
          .final-cta { padding: 60px 20px; }
          .cta-card { padding: 40px 24px; border-radius: 40px; }
        }

        @media (max-width: 580px) {
          .coverflow-stage { height: 420px; perspective: 1000px; }
          .cf-card { width: 260px; }
          .cf-card.cf-active { width: 290px; }
          .cf-card.cf-left { transform: translateX(-160px) scale(0.75) rotateY(10deg); opacity: 0.4; }
          .cf-card.cf-right { transform: translateX(160px) scale(0.75) rotateY(-10deg); opacity: 0.4; }
          .cf-prev { left: 5px; }
          .cf-next { right: 5px; }
          .cf-nav { width: 40px; height: 40px; font-size: 1rem; }
        }

        @media (max-width: 480px) {
          .container { padding: 0 20px; }
          .hero-text h1 { font-size: 1.8rem; }
          .hero-text p { font-size: 0.85rem; }
          .button-group { flex-direction: column; width: 100%; gap: 12px; }
          .btn-main, .btn-secondary { width: 100%; justify-content: center; padding: 12px 24px; font-size: 0.95rem; }
          .centered-header h2 { font-size: 1.6rem; }
          .centered-header p { font-size: 0.85rem; }
          .coverflow-stage { height: 400px; }
          .cf-card.cf-active { width: 260px; }
          .cf-card.cf-left, .cf-card.cf-right { display: none; }
          .cf-img { height: 160px; }
          .process-node { padding: 32px 24px; border-radius: 24px; }
          .process-node h4 { font-size: 1.1rem; }
          .process-node p { font-size: 0.85rem; }
          .cta-card h2 { font-size: 1.6rem; }
          .cta-card h4 { font-size: 0.85rem; }
          .cta-buttons-row { flex-direction: column; width: 100%; gap: 12px; }
          .btn-white-lg, .btn-outline-lg { width: 100%; justify-content: center; height: 54px; padding: 0 24px; font-size: 1rem; }
          .node-icon-wrap { width: 56px; height: 56px; }
        }

        @media (max-width: 360px) {
          .hero-text h1 { font-size: 1.6rem; }
          .cta-card h2 { font-size: 1.4rem; }
          .cta-card { padding: 30px 16px; }
        }
      `}</style>
    </div>
  );
};

export default Services;
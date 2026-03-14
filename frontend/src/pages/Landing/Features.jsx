import React from 'react';
import {
  FaFingerprint, FaMapMarkedAlt, FaFileInvoice, FaMobile,
  FaCogs, FaChartPie, FaBolt, FaLock, FaSync, FaShieldAlt,
  FaArrowRight, FaCheckCircle, FaInfoCircle, FaCalendarCheck,
  FaUserEdit, FaDesktop, FaBell, FaLayerGroup, FaAws, FaDatabase, FaEye
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import worknaiLogo from "../../assets/worknai logo.png";
import faceDetectionImg from "../../assets/AI-Face-detection-for attedace.png";
import gpsTrackingImg from "../../assets/gps tracking.png";
import payrollDataImg from "../../assets/Payroll data.png";

const Features = () => {
  const fadeUp = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
  };

  const blobAnim = {
    x: [0, 80, 0, -40, 0],
    y: [0, -40, 80, 20, 0],
    scale: [1, 1.1, 0.95, 1.05, 1],
    transition: { duration: 20, repeat: Infinity, ease: "linear" }
  };

  const magneticProps = {
    whileHover: { scale: 1.05, y: -2 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 10 }
  };

  return (
    <div className="features-page">
      {/* Animated accent blobs - Same as Home */}
      <motion.div style={{
        position: 'absolute', width: 340, height: 340, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(80,200,255,0.15) 0%, transparent 70%)',
        top: '5%', left: '-5%', zIndex: 0, filter: 'blur(60px)',
      }} animate={blobAnim} />

      <motion.div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)',
        bottom: '10%', right: '-10%', zIndex: 0, filter: 'blur(80px)',
      }} animate={blobAnim} />

      {/* --- HERO SECTION --- */}
      <section className="feat-hero">
        {/* Full-bleed office background - Sync with Home */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url('https://images.unsplash.com/photo-1497215842964-222b430dc094?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.2,
          zIndex: 0,
        }} />

        {/* Darker gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(5,7,20,0.8) 0%, rgba(5,7,20,0.4) 50%, rgba(5,7,20,0.7) 100%)',
          zIndex: 1,
        }} />

        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <motion.div
            className="hero-wrap"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.span className="feat-badge" variants={fadeUp}>PLATFORM CAPABILITIES</motion.span>
            <motion.h1 variants={fadeUp}>Powerful Features for <span className="gradient-text">Infinite</span> Growth</motion.h1>
            <motion.p variants={fadeUp}>
              WorknAi HRMS combines artificial intelligence with human-centric design
              to provide tools that don't just track work, but improve it.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* --- FEATURE DEEP DIVE (BIG SECTIONS) --- */}
      <section className="deep-dive">
        <div className="container">

          {/* Feature 1: AI Biometrics */}
          <motion.div
            className="dive-row"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.div className="dive-text" variants={fadeUp}>
              <div className="icon-circle blue"><FaFingerprint /></div>
              <h2>Advanced <span className="gradient-text">AI Biometric</span> Verification</h2>
              <p>
                Say goodbye to proxy attendance. Our system analyzes 128 unique facial landmarks
                to verify identity with 99.9% accuracy, even in low-light conditions.
              </p>
              <ul className="feat-list">
                <li>Anti-Spoofing Technology</li>
                <li>Liveness Detection (Prevents Photo-Punches)</li>
                <li>Instant Recognition {`(< 0.5s)`}</li>
              </ul>
            </motion.div>
            <motion.div className="dive-visual" variants={fadeUp}>
              <img src={faceDetectionImg} alt="AI Biometrics" />
            </motion.div>
          </motion.div>

          {/* Feature 2: Geo-Fencing */}
          <motion.div
            className="dive-row reverse"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.div className="dive-text" variants={fadeUp}>
              <div className="icon-circle red"><FaMapMarkedAlt /></div>
              <h2>Dynamic <span className="gradient-text">Geo-Fencing</span> Security</h2>
              <p>
                Define virtual boundaries around your multiple office branches.
                Employees can only punch in when they are physically present inside the designated zone.
              </p>
              <ul className="feat-list">
                <li>Multi-Branch Location Support</li>
                <li>GPS Coordinate Tracking</li>
                <li>Custom Radius Definition (50m - 500m)</li>
              </ul>
            </motion.div>
            <motion.div className="dive-visual" variants={fadeUp}>
              <img src={gpsTrackingImg} alt="GPS Tracking" />
            </motion.div>
          </motion.div>

          {/* Feature 3: Smart Payroll */}
          <motion.div
            className="dive-row"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.div className="dive-text" variants={fadeUp}>
              <div className="icon-circle green"><FaFileInvoice /></div>
              <h2>Integrated <span className="gradient-text">Payroll</span> Automation</h2>
              <p>
                Directly link attendance logs to salary processing. Calculate overtime,
                late marks, and leave deductions automatically every month.
              </p>
              <ul className="feat-list">
                <li>Statutory Compliance (PF/ESI)</li>
                <li>Custom Allowance Management</li>
                <li>One-Click Payslip Generation</li>
              </ul>
            </motion.div>
            <motion.div className="dive-visual" variants={fadeUp}>
              <img src={payrollDataImg} alt="Payroll Data" />
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* --- SLIDER: ADDITIONAL HIGHLIGHTS --- */}
      <section className="more-features">
        <div className="container">
          <motion.div
            className="section-header"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={stagger}
          >
            <h2>Small Details, <span className="gradient-text">Big Impact</span></h2>
            <p>Every tool you need to manage your workforce professionally.</p>
          </motion.div>
        </div>
        <div className="marquee-wrapper">
          <div className="marquee-track">
            {[0, 1].map((setIdx) => (
              <div className="marquee-set" key={setIdx} aria-hidden={setIdx === 1}>
                {[
                  { icon: <FaMobile />, title: "Mobile Portal", desc: "Employee access for history & leaves.", color: "#50c8ff" },
                  { icon: <FaSync />, title: "Real-time Sync", desc: "Instant data across all dashboards.", color: "#a78bfa" },
                  { icon: <FaChartPie />, title: "Analytics Pro", desc: "Visual charts & performance trends.", color: "#f43f5e" },
                  { icon: <FaLock />, title: "Data Encryption", desc: "AES-256 bit data protection.", color: "#fbbf24" },
                  { icon: <FaCalendarCheck />, title: "Leave & Holidays", desc: "Multi-level leave approval workflows.", color: "#10b981" },
                  { icon: <FaDesktop />, title: "Asset Management", desc: "Track hardware & software licenses.", color: "#3b82f6" },
                  { icon: <FaUserEdit />, title: "Self-Service ESS", desc: "Profiles, documents & tasks portal.", color: "#8b5cf6" },
                  { icon: <FaBell />, title: "Instant Alerts", desc: "Push notifications & reminders.", color: "#f87171" }
                ].map((f, i) => (
                  <div className="slide-card" key={i} style={{ "--accent-color": f.color }}>
                    <div className="s-icon">{f.icon}</div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- TECH STACK BANNER --- */}
      <section className="tech-banner">
        <div className="container text-center">
          <motion.div
            className="tech-card"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h3><FaBolt className="gold-text" /> Built on Industry Standard Cloud Infrastructure</h3>
            <div className="stack-icons">
              {[
                { name: 'MERN STACK', icon: <FaLayerGroup /> },
                { name: 'AWS S3', icon: <FaAws /> },
                { name: 'FACE-API.JS', icon: <FaEye /> },
                { name: 'MONGODB ATLAS', icon: <FaDatabase /> }
              ].map((tech, i) => (
                <motion.span
                  key={i}
                  whileHover={{ scale: 1.1, y: -4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="tech-badge"
                >
                  {tech.icon} {tech.name}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="feat-footer">
        <div className="container">
          <motion.div
            className="cta-box"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="footer-brand-logo">
              <img src={worknaiLogo} alt="WorknAI Logo" />
              <span className="gradient-text">WorknAi</span>
            </div>
            <h2>Experience the <span className="gradient-text">Next-Gen</span> HRMS</h2>
            <p>Take the first step towards an automated organization today.</p>
            <div className="btn-row">
              <motion.div {...magneticProps}>
                <Link to="/contact" className="btn-solid">Contact Sales <FaArrowRight /></Link>
              </motion.div>
              <motion.div {...magneticProps}>
                <Link to="/register" className="btn-outline">Register Now</Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <style>{`
/* =====================
   GLOBAL
===================== */
.features-page {
  font-family: 'Plus Jakarta Sans', sans-serif;
  background: #050714;
  overflow-x: hidden;
  color: #fff;
  position: relative;
  padding-top: 70px; /* Navbar space */
}

@media (max-width: 1024px) {
  .features-page {
    padding-top: 60px;
  }
}

.container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 2;
}

.gradient-text {
  background: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* =====================
   HERO
===================== */
.feat-hero {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 60px 0 40px; /* Reduced from 100px */
  text-align: center;
  position: relative;
  overflow: hidden;
  min-height: auto;
}

.feat-badge {
  background: rgba(80, 200, 255, 0.1);
  color: #50c8ff;
  padding: 10px 20px;
  border-radius: 50px;
  font-weight: 800;
  font-size: .83rem;
  letter-spacing: 1.5px;
  border: 1px solid rgba(80, 200, 255, 0.2);
  display: inline-block;
  margin-bottom: 20px;
}

.hero-wrap h1 {
  font-size: clamp(2.2rem, 5vw, 4rem);
  font-weight: 900;
  margin: 10px 0 24px;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.hero-wrap p {
  font-size: 1.1rem;
  color: rgba(255,255,255,0.7);
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
}

/* =====================
   DEEP DIVE
===================== */
.deep-dive {
  padding: 60px 0; /* Reduced from 120px */
}

.dive-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
  margin-bottom: 80px; /* Reduced from 120px */
}

.dive-row.reverse {
  direction: rtl;
}

.dive-row.reverse .dive-text {
  direction: ltr;
}

.icon-circle {
  width: 70px;
  height: 70px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
  margin-bottom: 24px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
}

.icon-circle.blue { background: rgba(80, 200, 255, 0.1); color: #50c8ff; border: 1px solid rgba(80,200,255,0.2); }
.icon-circle.red { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239,68,68,0.2); }
.icon-circle.green { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16,185,129,0.2); }

.dive-text h2 {
  font-size: clamp(1.8rem, 3.5vw, 2.8rem);
  margin-bottom: 20px;
  font-weight: 900;
  line-height: 1.15;
  letter-spacing: -0.02em;
}

.dive-text p {
  font-size: 1rem;
  color: rgba(255,255,255,0.6);
  line-height: 1.7;
  margin-bottom: 32px;
}

.feat-list {
  list-style: none;
  padding: 0;
}

.feat-list li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 12px;
  font-size: 1.05rem;
}

.feat-list li::before {
  content: '✓';
  color: #34d399;
  font-weight: 900;
  font-size: 1.3rem;
}

.dive-visual img {
  width: 100%;
  border-radius: 40px;
  box-shadow: 0 40px 100px rgba(0,0,0,0.6);
  border: 1px solid rgba(255,255,255,0.05);
  transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.dive-visual:hover img {
  transform: scale(1.02);
}

/* =====================
   FEATURE MARQUEE
===================== */
.more-features {
  padding: 80px 0; /* Reduced from 140px */
  background: radial-gradient(circle at center, rgba(80,200,255,0.03) 0%, transparent 70%);
  border-top: 1px solid rgba(255,255,255,0.05);
}

.section-header {
  text-align: center;
  margin-bottom: 80px;
}

.section-header h2 {
  font-size: clamp(2rem, 4vw, 3rem);
  font-weight: 900;
  margin-bottom: 16px;
  letter-spacing: -0.02em;
}

.section-header p {
  color: rgba(255,255,255,0.6);
  font-size: 1.1rem;
}

.marquee-wrapper {
  width: 100%;
  overflow: hidden;
  padding: 40px 0;
  position: relative;
}

.marquee-track {
  display: flex;
  width: max-content;
  animation: scroll 45s linear infinite;
}

.marquee-track:hover {
  animation-play-state: paused;
}

.marquee-set {
  display: flex;
  gap: 30px;
  padding-right: 30px;
}

@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.slide-card {
  width: 320px;
  padding: 40px 30px;
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(12px);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.slide-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at top right, var(--accent-color), transparent 70%);
  opacity: 0;
  transition: opacity 0.5s ease;
}

.slide-card:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-10px);
  border-color: var(--accent-color);
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4), 0 0 30px rgba(var(--accent-rgb), 0.2);
}

.slide-card:hover::after {
  opacity: 0.05;
}

.s-icon {
  font-size: 3rem;
  color: var(--accent-color, #50c8ff);
  margin-bottom: 24px;
  background: linear-gradient(135deg, var(--accent-color), #fff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 12px var(--accent-color));
}

.slide-card h4 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 12px;
  color: #fff;
}

.slide-card p {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}

/* =====================
   TECH BANNER
===================== */
.tech-banner {
  padding: 80px 0 40px; /* Reduced from 120px 0 80px */
  background: linear-gradient(180deg, rgba(5,7,20,0) 0%, rgba(80,200,255,0.03) 100%);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.tech-card {
  background: rgba(255, 255, 255, 0.02);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 40px;
  padding: 60px 40px;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  overflow: hidden;
  box-shadow: 0 40px 80px rgba(0, 0, 0, 0.5);
}

.tech-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 0% 0%, rgba(80,200,255,0.1), transparent 50%),
              radial-gradient(circle at 100% 100%, rgba(232,121,249,0.1), transparent 50%);
  pointer-events: none;
}

.tech-banner h3 {
  font-size: 1.8rem;
  font-weight: 850;
  margin-bottom: 40px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  letter-spacing: -0.01em;
}

.gold-text {
  color: #fbbf24;
  filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.5));
}

.stack-icons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.stack-icons span {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 12px 30px;
  border-radius: 16px;
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: 2px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.4s ease;
}

.stack-icons span svg {
  font-size: 1.3rem;
  color: #50c8ff;
}

.stack-icons span:hover {
  background: rgba(80, 200, 255, 0.08);
  border-color: rgba(80, 200, 255, 0.3);
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.3);
}

/* =====================
   CTA BOX
===================== */
.feat-footer {
  padding: 80px 0; /* Reduced from 160px */
  position: relative;
}

.cta-box {
  background: linear-gradient(145deg, rgba(15,20,40,0.8), rgba(5,7,20,0.95));
  padding: 100px 40px;
  border-radius: 60px;
  max-width: 1100px;
  margin: 0 auto;
  border: 1px solid rgba(80, 200, 255, 0.15);
  backdrop-filter: blur(30px);
  text-align: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 50px 100px rgba(0,0,0,0.6), 0 0 40px rgba(80,200,255,0.05);
}

.cta-box::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(80,200,255,0.05) 0%, transparent 50%);
  pointer-events: none;
}

.footer-brand-logo {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-bottom: 30px;
}

.footer-brand-logo img {
  width: 50px;
  filter: drop-shadow(0 0 15px rgba(80,200,255,0.4));
}

.footer-brand-logo span {
  font-weight: 950;
  font-size: 2rem;
  letter-spacing: -1px;
}

.cta-box h2 {
  font-size: clamp(2.2rem, 5vw, 4rem);
  font-weight: 950;
  margin-bottom: 24px;
  line-height: 1.05;
  letter-spacing: -0.04em;
}

.cta-box p {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 48px;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.btn-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 30px;
  flex-wrap: wrap;
}

.btn-solid {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff;
  padding: 0 50px;
  height: 72px;
  border-radius: 22px;
  font-weight: 900;
  text-decoration: none;
  font-size: 1.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  box-shadow: 0 20px 40px rgba(59, 130, 246, 0.4);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  border: none;
}

.btn-outline {
  border: 2px solid rgba(255,255,255,0.15);
  color: #fff;
  padding: 0 50px;
  height: 72px;
  border-radius: 22px;
  font-weight: 900;
  text-decoration: none;
  font-size: 1.25rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  background: rgba(255,255,255,0.03);
  backdrop-filter: blur(10px);
}

.btn-solid:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 25px 50px rgba(59, 130, 246, 0.5);
  filter: brightness(1.1);
}

.btn-outline:hover {
  background: rgba(255,255,255,0.08);
  border-color: #fff;
  transform: translateY(-5px);
}

/* =====================
   RESPONSIVE
===================== */
@media (max-width: 1200px) {
  .container { padding: 0 40px; }
  .cta-box { margin: 0 20px; }
}

@media (max-width: 1024px) {
  .deep-dive { padding: 80px 0; }
  .feat-hero { padding: 60px 0 40px; }
}

@media (max-width: 992px) {
  .dive-row {
    grid-template-columns: 1fr;
    text-align: center;
    gap: 50px;
    margin-bottom: 80px;
  }
  .dive-row.reverse { direction: ltr; }
  .dive-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    order: 1;
  }
  .dive-visual { order: 2; }
  .feat-list li { justify-content: center; }
  .btn-row {
    flex-direction: column;
    gap: 20px;
  }
  .btn-solid, .btn-outline {
    width: 100%;
    max-width: 400px;
  }
}

@media (max-width: 768px) {
  .feat-hero { min-height: auto; padding: 40px 0 20px; }
  .hero-wrap h1 { font-size: 2.8rem; }
  .hero-wrap p { font-size: 1rem; }
  .deep-dive { padding: 40px 0; }
  .dive-row { margin-bottom: 40px; }
  .more-features { padding: 40px 0; }
  .cta-box { padding: 60px 24px; border-radius: 40px; }
  .cta-box h2 { font-size: 2.5rem; }
  .footer-brand-logo span { font-size: 1.6rem; }
  .tech-card { padding: 40px 20px; }
  .tech-banner h3 { font-size: 1.4rem; flex-direction: column; gap: 8px; }
}

@media (max-width: 480px) {
  .container { padding: 0 20px; }
  .hero-wrap h1 { font-size: 2.2rem; }
  .dive-text h2 { font-size: 1.8rem; }
  .slide-card { width: 280px; padding: 30px 20px; }
  .s-icon { font-size: 2.5rem; }
  .cta-box h2 { font-size: 2rem; }
  .cta-box p { font-size: 1rem; }
  .btn-solid, .btn-outline { height: 60px; font-size: 1.1rem; }
  .stack-icons span { padding: 10px 20px; font-size: 0.75rem; }
}

@media (max-width: 360px) {
  .hero-wrap h1 { font-size: 1.8rem; }
  .cta-box { padding: 60px 16px; }
  .cta-box h2 { font-size: 1.6rem; }
}
      `}</style>
    </div>
  );
};

export default Features;
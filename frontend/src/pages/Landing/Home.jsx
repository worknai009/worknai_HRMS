import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import officeBg from "../../assets/office.png";
import introVideo from "../../assets/worknai logo video.mp4";
import showcaseVideo2 from "../../assets/worknai.mp4";
import serviceProduction from "../../assets/service.png";
import "./Home.css";

import {
  FaShieldAlt,
  FaFingerprint,
  FaRobot,
  FaMapMarkerAlt,
  FaChartLine,
  FaUserCheck,
  FaLock,
  FaHeadset,
  FaCogs,
  FaCheckCircle,
  FaArrowRight,
  FaLinkedin,
  FaInstagram,
  FaEnvelope,
  FaPhoneAlt,
  FaBuilding,
} from "react-icons/fa";

const Home = () => {
  // ✅ NEW images (purane nahi)
  const IMAGES = {
    hero:
      "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1600&q=90",
    services: serviceProduction,
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.7, ease: "easeOut" } },
  };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } }
  };

  const magneticProps = {
    whileHover: { scale: 1.05, y: -2 },
    whileTap: { scale: 0.95 },
    transition: { type: "spring", stiffness: 400, damping: 10 }
  };

  const floatY = {
    animate: {
      y: [0, -10, 0],
      transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const blobAnim = {
    x: [0, 100, 0, -50, 0],
    y: [0, -50, 100, 30, 0],
    scale: [1, 1.2, 0.9, 1.1, 1],
    transition: { duration: 25, repeat: Infinity, ease: "linear" }
  };

  const blobAnim2 = {
    x: [0, -80, 50, 120, 0],
    y: [0, 150, -60, -80, 0],
    scale: [1, 0.8, 1.1, 0.9, 1],
    transition: { duration: 30, repeat: Infinity, ease: "linear" }
  };

  const floatYSlow = {
    animate: {
      y: [0, -12, 0],
      transition: { duration: 4.2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const stats = [
    { title: "Touchless Attendance", desc: "Face-based punch with smart checks" },
    { title: "Payroll & Compliance", desc: "Salary, leave & attendance alignment" },
    { title: "Leave / WFH Workflow", desc: "Approvals + history in one place" },
    { title: "Actionable Analytics", desc: "Dashboards that support decisions" },
  ];

  const modules = [
    {
      icon: <FaFingerprint />,
      title: "AI Face Attendance",
      desc: "Fast, consistent attendance with a modern biometric experience—built for real teams, real shifts.",
      tone: "blue",
    },
    {
      icon: <FaRobot />,
      title: "Smart Payroll Automation",
      desc: "Auto-ready payroll with working days, late/early, leave impact, and clear monthly summaries.",
      tone: "purple",
    },
    {
      icon: <FaMapMarkerAlt />,
      title: "Location-Aware Controls",
      desc: "Optional location validation for office & field teams—reduce misuse with transparent rules.",
      tone: "green",
    },
    {
      icon: <FaChartLine />,
      title: "HR & Workforce Insights",
      desc: "Track productivity signals, attendance trends, and team patterns using simple dashboards.",
      tone: "red",
    },
    {
      icon: <FaCogs />,
      title: "Process Ready Workflows",
      desc: "Onboarding, approvals, employee records, and HR operations—clean and scalable structure.",
      tone: "slate",
    },
    {
      icon: <FaHeadset />,
      title: "Support That Moves Fast",
      desc: "Implementation + guidance for HR teams so rollout is smooth and adoption stays strong.",
      tone: "amber",
    },
  ];

  const services = [
    {
      icon: <FaBuilding />,
      title: "HRMS Setup & Rollout",
      desc: "We help you configure roles, policies, attendance rules, and department structure.",
    },
    {
      icon: <FaUserCheck />,
      title: "Training & Adoption",
      desc: "Short training for HR + employees, so the system becomes a habit (not a headache).",
    },
    {
      icon: <FaLock />,
      title: "Security-First Practices",
      desc: "Data protection mindset, access control, and secure operations for modern organizations.",
    },
  ];

  const steps = [
    {
      title: "Configure Company",
      desc: "Set departments, shifts, roles, and policies in a clean admin flow.",
      tone: "violet",
    },
    {
      title: "Add Employees",
      desc: "Create HR and employees, assign roles, and start capturing attendance.",
      tone: "rose",
    },
    {
      title: "Run Operations",
      desc: "Approve leave/WFH, monitor attendance, and generate payroll-ready summaries.",
      tone: "amber",
    },
  ];

  return (



    <div className="home">
      {/* HERO */}
      <section className="hero">
        {/* Full-bleed office background - kept as subtle atmosphere */}
        <div className="hero-bg-office" style={{ backgroundImage: `url(${officeBg})` }} />

        {/* Darker gradient overlay */}
        <div className="hero-overlay" />

        {/* Animated accent blobs */}
        <motion.div className="hero-blob b1" animate={blobAnim} />
        <motion.div className="hero-blob b2" animate={blobAnim2} />

        {/* Hero content */}
        <div className="hero-container">
          <motion.div
            className="hero-content"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div className="trust-badge" variants={fadeUp}>
              <FaShieldAlt className="badge-icon" />
              <span>Security-focused HRMS for modern workplaces</span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
            >
              Work smarter with{' '}
              <span className="gradient-text hero-gradient-animate" style={{ fontWeight: 900 }}>WorknAi HRMS</span>
              <br />
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.7, ease: 'easeOut' }}
                className="hero-subtitle"
              >
                Attendance • Payroll • HR Operations
              </motion.span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="hero-desc"
            >
              WorknAi helps organizations replace scattered spreadsheets and manual processes with a
              clean HRMS experience—face attendance, approvals, employee records, and insights in one place.
            </motion.p>

            <motion.div className="cta-group" variants={fadeUp}>
              <motion.div {...magneticProps}>
                <Link to="/register" className="hero-cta-btn">
                  Get Started <FaArrowRight />
                </Link>
              </motion.div>
              <motion.div {...magneticProps}>
                <Link to="/contact" className="btn ghost-lg ghost-custom">
                  Talk to Sales
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>



          {/* Feature cards row */}
          <motion.div
            className="features-showcase"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
          >
            {[
              { icon: <FaFingerprint />, label: 'Biometric', val: 'Face Attendance', color: '#50c8ff' },
              { icon: <FaLock />, label: 'Security', val: 'Secure Access', color: '#a78bfa' },
              { icon: <FaChartLine />, label: 'Analytics', val: 'Live Insights', color: '#e879f9' },
              { icon: <FaRobot />, label: 'Engine', val: 'AI Accuracy 99%+', color: '#50c8ff' },
            ].map((f, i) => (
              <motion.div key={i}
                className="hero-feature-card"
                whileHover={{ y: -6, scale: 1.04 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <div className="hfc-icon" style={{
                  background: `${f.color}22`,
                  color: f.color,
                }}>{f.icon}</div>
                <div className="hfc-text">
                  <div className="hfc-label">{f.label}</div>
                  <div className="hfc-value">{f.val}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURE RIBBON: PRO-LUXE */}
      <section className="ribbon-luxe">
        <div className="container">
          <motion.div
            className="ribbon-grid"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              { title: "Touchless Attendance", sub: "Face-based punch with smart checks", cls: "v-cyan" },
              { title: "Payroll & Compliance", sub: "Salary, leave & attendance alignment", cls: "v-violet" },
              { title: "Leave / WFH Workflow", sub: "Approvals + history in one place", cls: "v-fuchsia" },
              { title: "Actionable Analytics", sub: "Dashboards that support decisions", cls: "v-cyan" }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className={`r-item ${item.cls}`}
                variants={fadeUp}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="r-glow"></div>
                <h3>{item.title}</h3>
                <p>{item.sub}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* MODULES */}
      <section className="section">
        <div className="container">
          <motion.div
            className="section-head"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp}>
              Core <span className="gradient-text">Platform</span> Modules
            </motion.h2>
            <motion.p variants={fadeUp}>
              Everything you need for attendance + HR operations + payroll readiness—built for real usage.
            </motion.p>
          </motion.div>

          <motion.div
            className="modules-grid"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.15 }}
            variants={stagger}
          >
            {modules.map((m) => (
              <motion.div
                className="card"
                key={m.title}
                variants={fadeUp}
                whileHover={{ y: -12, scale: 1.03 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={`card-glow ${m.tone}`}></div>
                <div className="card-shine"></div>
                <div className="card-content">
                  <div className={`icon ${m.tone}`}>{m.icon}</div>
                  <h3>{m.title}</h3>
                  <p>{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="section showcase-section">
        <div className="container">
          <div className="showcase-content">
            {/* Right: Code/Content */}
            <motion.div
              className="showcase-right"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="kicker">PRODUCT TOUR</span>
              <h2>Experience the <span className="gradient-text">next evolution</span> of HRMS</h2>
              <p>
                Watch how WorknAi simplifies complex HR tasks. From AI-powered face attendance to
                automated payroll processing, we've built every feature with speed and
                simplicity in mind.
              </p>
              <div className="code-block">
                <div className="code-header">
                  <div className="dots">
                    <span></span><span></span><span></span>
                  </div>
                  <span className="file-name">WorknAi_Engine.js</span>
                </div>
                <div className="code-content">
                  <pre>
                    <code>{`// AI Face Recognition Init
const hrms = new WorknAi({
  accuracy: "99.9%",
  security: "Enterprise-Grade",
  realtime: true
});

// Process Attendance
await hrms.verifyFace(employeeData);
console.log("Attendance Secured!");`}
                    </code>
                  </pre>
                </div>
              </div>
            </motion.div>

            {/* Left: Video */}
            <motion.div
              className="showcase-left"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="video-container">
                <video
                  src={introVideo}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="showcase-video"
                />
                <div className="video-overlay-glow"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section showcase-section">
        <div className="container">
          <div className="showcase-content">
            {/* Left: Content */}
            <motion.div
              className="showcase-right"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <span className="kicker">MODULE HIGHLIGHT</span>
              <h2>Automated <span>Payroll</span> Ready Data</h2>
              <p>
                Our system transforms attendance logs into precise payroll inputs automatically.
                Say goodbye to manual calculations and hello to 100% compliance with
                your local labor laws.
              </p>

              <div className="stats-mini-grid">
                {[
                  { label: "Processing Time", val: "10 mins", color: "#a78bfa" },
                  { label: "Data Accuracy", val: "99.9%", color: "#f472b6" },
                ].map((s, i) => (
                  <div key={i} className="stat-mini">
                    <strong style={{ color: s.color }}>{s.val}</strong>
                    <span>{s.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right: Video */}
            <motion.div
              className="showcase-left"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="video-container">
                <video
                  src={showcaseVideo2}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="showcase-video"
                />
                <div className="video-overlay-glow"></div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section soft">
        <div className="container">
          <motion.div
            className="two-col"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.div className="left" variants={fadeUp}>
              <span className="kicker">SERVICES</span>
              <h2>
                Implementation that feels <span className="gradient-text">simple</span>
              </h2>
              <p>
                We support teams during rollout—configuration, training, and best practices so HR can run fast.
              </p>

              <div className="list">
                {services.map((x) => (
                  <motion.div
                    className="li"
                    key={x.title}
                    whileHover={{ y: -4 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <div className="li-ic">{x.icon}</div>
                    <div>
                      <h4>{x.title}</h4>
                      <p>{x.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="btn-row">
                <motion.div {...magneticProps}>
                  <Link to="/services" className="btn primary-pill">
                    View Services <FaArrowRight className="a-ic" />
                  </Link>
                </motion.div>
                <motion.div {...magneticProps}>
                  <Link to="/about" className="btn ghost-pill">
                    About WorknAi
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            <motion.div className="right" variants={fadeUp}>
              <motion.div
                className="media-card"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div className="glass-shine"></div>
                <motion.img
                  src={IMAGES.services}
                  alt="Team discussing implementation"
                  loading="lazy"
                  decoding="async"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
                <div className="media-badge">
                  <FaShieldAlt className="t-violet" />
                  <div>
                    <strong>Trust & Security</strong>
                    <span>Role-based access + secure workflows</span>
                  </div>
                </div>
              </motion.div>

              <div className="contact-strip">
                <div className="c-item">
                  <FaEnvelope />
                  <span>worknai009@gmail.com</span>
                </div>
                <div className="c-item">
                  <FaPhoneAlt />
                  <span>+91 9923400442</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section">
        <div className="container">
          <motion.div
            className="section-head"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            <motion.h2 variants={fadeUp}>
              How it <span className="gradient-text">works</span>
            </motion.h2>
            <motion.p variants={fadeUp}>
              A clean setup → smooth daily usage → payroll-ready data. No confusion.
            </motion.p>
          </motion.div>

          <motion.div
            className="steps"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.2 }}
            variants={stagger}
          >
            {steps.map((st, idx) => (
              <motion.div
                className={`step ${st.tone}`}
                key={st.title}
                variants={fadeUp}
              >
                <div className="num">{String(idx + 1).padStart(2, "0")}</div>
                <h3>{st.title}</h3>
                <p>{st.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* QUICK LINKS */}
      <section className="section quick">
        <div className="container">
          <div className="quick-grid">
            <motion.div className="quick-left" variants={stagger}>
              <h2>
                Explore <span className="gradient-text">WorknAi</span>
              </h2>
              <p>
                Quick navigation—same links as footer, plus contact and social profiles for easy access.
              </p>

              <div className="quick-actions">
                <div className="blobs-container">
                  <motion.div className="blob b1-q" animate={blobAnim} />
                  <motion.div className="blob b2-q" animate={blobAnim2} />
                </div>

                <motion.div {...magneticProps}>
                  <Link to="/features" className="qbtn">
                    <span>Platform Features</span>
                    <FaArrowRight />
                  </Link>
                </motion.div>
                <motion.div {...magneticProps}>
                  <Link to="/services" className="qbtn">
                    <span>Services</span>
                    <FaArrowRight />
                  </Link>
                </motion.div>
                <motion.div {...magneticProps}>
                  <Link to="/about" className="qbtn">
                    <span>About Us</span>
                    <FaArrowRight />
                  </Link>
                </motion.div>
                <motion.div {...magneticProps}>
                  <Link to="/contact" className="qbtn">
                    <span>Contact</span>
                    <FaArrowRight />
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            <div className="quick-right">
              <motion.div
                className="quick-card"
                variants={fadeUp}
                whileHover={{ y: -6 }}
              >
                <h4>Partner Program</h4>
                <p>HR consultancies & business partners—grow with us.</p>
                <Link to="/partner-with-us" className="btn primary-pill wfull">
                  Join Partner Program <FaArrowRight />
                </Link>
              </motion.div>

              <motion.div
                className="quick-card"
                variants={fadeUp}
                whileHover={{ y: -6 }}
              >
                <h4>Corporate Office</h4>
                <p className="muted">
                  WorknAi Technologies India Pvt Ltd
                  <br />
                  Office No. 312, Sai Millennium, Punawale, Pune 411062
                </p>

                <div className="social">
                  <a
                    href="https://www.linkedin.com/in/worknai-technical-8830973b6?utm_source=share_via&utm_content=profile&utm_medium=member_android"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="LinkedIn"
                  >
                    <FaLinkedin />
                  </a>
                  <a
                    href="https://www.instagram.com/worknai_institute_center?igsh=MW5zOXZwY3o3anVjNw=="
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                  >
                    <FaInstagram />
                  </a>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="cta">
        <div className="container">
          <motion.div
            className="cta-inner"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <div className="blobs-container">
              <motion.div className="blob b1-c" animate={blobAnim} />
              <motion.div className="blob b2-c" animate={blobAnim2} />
            </div>

            <div className="cta-content">
              <h2>Ready to transform <span className="gradient-text">HR operations?</span></h2>
              <p>Switch to an HRMS that feels modern—fast workflows, clean dashboards, and smoother payroll cycles.</p>

              <div className="btn-row center">
                <motion.div {...magneticProps}>
                  <Link to="/register" className="btn white-pill">
                    Start Now <FaArrowRight className="a-ic" />
                  </Link>
                </motion.div>
                <motion.div {...magneticProps}>
                  <Link to="/contact" className="btn ghost-white">
                    Request a Demo
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>


    </div>

  );
};

export default Home;

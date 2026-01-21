import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
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
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
    services:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1600&q=80",
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const fadeIn = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.7, ease: "easeOut" } },
  };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };

  const floatY = {
    animate: {
      y: [0, -10, 0],
      transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" },
    },
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
    },
    {
      title: "Add Employees",
      desc: "Create HR and employees, assign roles, and start capturing attendance.",
    },
    {
      title: "Run Operations",
      desc: "Approve leave/WFH, monitor attendance, and generate payroll-ready summaries.",
    },
  ];

  return (
    <div className="home">
      {/* HERO */}
      <section className="hero">
        <div className="bg-shapes" aria-hidden="true">
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="grid" />
        </div>

        <div className="container hero-grid">
          <motion.div
            className="hero-left"
            variants={stagger}
            initial="hidden"
            animate="show"
          >
            <motion.div className="trust" variants={fadeUp}>
              <FaShieldAlt />
              <span>Security-focused HRMS for modern workplaces</span>
            </motion.div>

            <motion.h1 variants={fadeUp}>
              Work smarter with <span>WorknAI HRMS</span>
              <br />
              Attendance • Payroll • HR Operations
            </motion.h1>

            <motion.p variants={fadeUp}>
              WorknAI helps organizations replace scattered spreadsheets and manual processes with a
              clean HRMS experience—face attendance, approvals, employee records, and insights in one place.
            </motion.p>

            <motion.div className="cta-row" variants={fadeUp}>
              <Link to="/register" className="btn primary">
                Get Started <FaArrowRight />
              </Link>
              <Link to="/contact" className="btn ghost">
                Talk to Sales
              </Link>
              <Link to="/partner-with-us" className="btn outline">
                Partner With Us
              </Link>
            </motion.div>

            <motion.div className="mini-points" variants={fadeUp}>
              <div className="mp">
                <FaCheckCircle />
                <span>Clean UI + mobile-friendly</span>
              </div>
              <div className="mp">
                <FaCheckCircle />
                <span>Workflow-based approvals</span>
              </div>
              <div className="mp">
                <FaCheckCircle />
                <span>Role-based access control</span>
              </div>
            </motion.div>
          </motion.div>

          <motion.div
            className="hero-right"
            variants={fadeIn}
            initial="hidden"
            animate="show"
          >
            <motion.div
              className="hero-card"
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <motion.img
                src={IMAGES.hero}
                alt="Modern HR team collaboration"
                className="hero-img"
                loading="lazy"
                decoding="async"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />

              {/* floating badges */}
              <motion.div className="hero-float f1" variants={floatY} animate="animate">
                <FaFingerprint />
                <span>Face Attendance</span>
              </motion.div>

              <motion.div className="hero-float f2" variants={floatYSlow} animate="animate">
                <FaLock />
                <span>Secure Access</span>
              </motion.div>

              <motion.div className="hero-float f3" variants={floatY} animate="animate">
                <FaChartLine />
                <span>Live Insights</span>
              </motion.div>

              <div className="hero-overlay" aria-hidden="true" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATS */}
      <section className="ribbon">
        <div className="container ribbon-grid">
          {stats.map((s) => (
            <motion.div
              className="r-item"
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -4 }}
            >
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </motion.div>
          ))}
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
              Core <span>Platform</span> Modules
            </motion.h2>
            <motion.p variants={fadeUp}>
              Everything you need for attendance + HR operations + payroll readiness—built for real usage.
            </motion.p>
          </motion.div>

          <motion.div
            className="grid"
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
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <div className={`icon ${m.tone}`}>{m.icon}</div>
                <h3>{m.title}</h3>
                <p>{m.desc}</p>
              </motion.div>
            ))}
          </motion.div>
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
                Implementation that feels <span>simple</span>
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
                <Link to="/services" className="btn primary">
                  View Services <FaArrowRight />
                </Link>
                <Link to="/about" className="btn ghost">
                  About WorknAI
                </Link>
              </div>
            </motion.div>

            <motion.div className="right" variants={fadeUp}>
              <motion.div
                className="media"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <motion.img
                  src={IMAGES.services}
                  alt="Team discussing implementation"
                  loading="lazy"
                  decoding="async"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                />
                <div className="media-badge">
                  <FaShieldAlt />
                  <div>
                    <strong>Trust & Security</strong>
                    <span>Role-based access + secure workflows</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                className="note"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45 }}
              >
                <FaEnvelope />
                <span>Support: worknai009@gmail.com</span>
              </motion.div>

              <motion.div
                className="note"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: 0.08 }}
              >
                <FaPhoneAlt />
                <span>Call: +91 9923400442</span>
              </motion.div>
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
              How it <span>works</span>
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
                className="step"
                key={st.title}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
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
            <motion.div
              className="quick-left"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            >
              <h2>
                Explore <span>WorknAI</span>
              </h2>
              <p>
                Quick navigation—same links as footer, plus contact and social profiles for easy access.
              </p>

              <div className="quick-actions">
                <Link to="/features" className="qbtn">
                  Platform Features <FaArrowRight />
                </Link>
                <Link to="/services" className="qbtn">
                  Services <FaArrowRight />
                </Link>
                <Link to="/about" className="qbtn">
                  About Us <FaArrowRight />
                </Link>
                <Link to="/contact" className="qbtn">
                  Contact <FaArrowRight />
                </Link>
              </div>
            </motion.div>

            <div className="quick-right">
              <motion.div
                className="quick-card"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                whileHover={{ y: -6 }}
              >
                <h4>Partner Program</h4>
                <p>HR consultancies & business partners—grow with us.</p>
                <Link to="/partner-with-us" className="btn outline wfull">
                  Join Partner Program <FaArrowRight />
                </Link>
              </motion.div>

              <motion.div
                className="quick-card"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.55, ease: "easeOut", delay: 0.06 }}
                whileHover={{ y: -6 }}
              >
                <h4>Corporate Office</h4>
                <p className="muted">
                  WorknAI Technologies India Pvt Ltd
                  <br />
                  Office No. 312, Sai Millennium, Punawale, Pune 411062
                </p>

                <div className="social">
                  <a
                    href="https://www.linkedin.com/company/worknai-technologies-india-pvt-ltd-pune/"
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
        <div className="container cta-inner">
          <h2>Ready to transform HR operations?</h2>
          <p>Switch to an HRMS that feels modern—fast workflows, clean dashboards, and smoother payroll cycles.</p>
          <div className="cta-row center">
            <Link to="/register" className="btn white">
              Start Now <FaArrowRight />
            </Link>
            <Link to="/contact" className="btn gold">
              Request a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* STYLES */}
      <style>{`
        .home{
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          overflow-x:hidden;
          color:#0f172a;
        }
        .container{max-width:1200px;margin:0 auto;padding:0 20px;}

        :root{
          --bg:#ffffff;
          --soft:#f8fafc;
          --soft2:#eef2ff;
          --dark:#0f172a;
          --muted:#475569;
          --muted2:#64748b;
          --line:#e2e8f0;
          --p:#2563eb;
          --p2:#9333ea;
          --gold:#BF953F;
        }

        /* HERO */
        .hero{
          position:relative;
          background: radial-gradient(circle at top right, #eff6ff 0%, #ffffff 55%);
          padding:110px 0 70px;
        }

        /* ✅ animated background blobs */
        .bg-shapes .blob{
          position:absolute;
          filter: blur(45px);
          opacity:0.35;
          border-radius:999px;
          animation: blobMove 10s ease-in-out infinite;
        }
        .bg-shapes .b1{
          width:420px;height:420px; background:#93c5fd;
          top:-120px; left:-120px;
          animation-delay: 0s;
        }
        .bg-shapes .b2{
          width:520px;height:520px; background:#c4b5fd;
          bottom:-200px; right:-180px;
          animation-delay: 1.3s;
        }
        @keyframes blobMove{
          0%{ transform: translate(0,0) scale(1); }
          50%{ transform: translate(20px,-18px) scale(1.05); }
          100%{ transform: translate(0,0) scale(1); }
        }

        .bg-shapes .grid{
          position:absolute; inset:0;
          background-image: linear-gradient(to right, rgba(15,23,42,0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(15,23,42,0.05) 1px, transparent 1px);
          background-size: 56px 56px;
          mask-image: radial-gradient(circle at 40% 20%, rgba(0,0,0,0.9), rgba(0,0,0,0));
          pointer-events:none;
          opacity:0.6;
        }

        .hero-grid{
          position:relative;
          display:grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap:46px;
          align-items:center;
        }

        .trust{
          display:inline-flex;
          gap:10px;
          align-items:center;
          background:#dbeafe;
          color:#1e40af;
          padding:8px 14px;
          border-radius:999px;
          font-weight:800;
          font-size:0.9rem;
          border:1px solid rgba(37,99,235,0.2);
          width:fit-content;
        }

        .hero-left h1{
          margin:18px 0 14px;
          font-size: clamp(2.4rem, 4.4vw, 3.9rem);
          line-height:1.08;
          font-weight:950;
          letter-spacing:-0.02em;
        }
        .hero-left h1 span{
          background: linear-gradient(45deg, var(--p), var(--p2));
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
        }
        .hero-left p{
          margin:0 0 22px;
          font-size:1.05rem;
          color:var(--muted);
          line-height:1.7;
          max-width:56ch;
        }

        .cta-row{
          display:flex; flex-wrap:wrap; gap:12px;
          align-items:center;
          margin: 18px 0 18px;
        }
        .btn{
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          padding:13px 18px;
          border-radius:14px;
          text-decoration:none;
          font-weight:900;
          transition: transform .2s ease, box-shadow .2s ease, background .2s ease, color .2s ease, border-color .2s ease;
          border:1px solid transparent;
          cursor:pointer;
          user-select:none;
          white-space:nowrap;
        }
        .btn.primary{
          background: var(--p);
          color:#fff;
          box-shadow: 0 18px 35px rgba(37,99,235,0.22);
        }
        .btn.primary:hover{ transform: translateY(-2px); box-shadow: 0 24px 45px rgba(37,99,235,0.28); }
        .btn.ghost{
          background: rgba(255,255,255,0.7);
          color: var(--dark);
          border-color: rgba(15,23,42,0.12);
        }
        .btn.ghost:hover{ transform: translateY(-2px); border-color: rgba(15,23,42,0.2); }
        .btn.outline{
          background:#fff;
          color: var(--p);
          border-color: rgba(37,99,235,0.35);
        }
        .btn.outline:hover{ transform: translateY(-2px); background:#eff6ff; }

        .mini-points{
          display:flex; flex-wrap:wrap; gap:14px;
          margin-top: 8px;
        }
        .mp{
          display:flex; align-items:center; gap:8px;
          font-weight:800;
          color:#1f2937;
          background: rgba(255,255,255,0.6);
          border:1px solid rgba(15,23,42,0.10);
          padding:8px 12px;
          border-radius:999px;
          font-size:0.9rem;
        }
        .mp svg{ color:#16a34a; }

        .hero-card{
          position:relative;
          border-radius:24px;
          overflow:hidden;
          box-shadow: 0 30px 70px rgba(2,6,23,0.16);
          border:1px solid rgba(15,23,42,0.10);
          background:#fff;
        }
        .hero-img{
          width:100%;
          height:520px;
          object-fit:cover;
          display:block;
          transform-origin:center;
        }
        .hero-overlay{
          position:absolute;
          inset:0;
          background: linear-gradient(180deg, rgba(15,23,42,0.00) 40%, rgba(15,23,42,0.18) 100%);
          pointer-events:none;
        }

        .hero-float{
          position:absolute;
          display:flex; align-items:center; gap:10px;
          background: rgba(255,255,255,0.92);
          border:1px solid rgba(15,23,42,0.10);
          padding:10px 12px;
          border-radius:14px;
          font-weight:900;
          box-shadow: 0 16px 40px rgba(2,6,23,0.10);
          backdrop-filter: blur(10px);
          font-size:0.95rem;
        }
        .hero-float svg{ color: var(--p); }
        .hero-float.f1{ top:16px; left:16px; }
        .hero-float.f2{ bottom:16px; right:16px; }
        .hero-float.f3{ top:40%; right:16px; }

        /* RIBBON */
        .ribbon{
          background: var(--dark);
          color:#fff;
          padding: 26px 0;
        }
        .ribbon-grid{
          display:grid;
          grid-template-columns: repeat(4, minmax(0,1fr));
          gap:14px;
        }
        .r-item{
          padding:16px 14px;
          border:1px solid rgba(148,163,184,0.18);
          border-radius:16px;
          background: rgba(2,6,23,0.2);
        }
        .r-item h3{ margin:0 0 6px; font-size:1.02rem; font-weight:950; color:#e2e8f0; }
        .r-item p{ margin:0; color:#94a3b8; font-weight:700; font-size:0.92rem; line-height:1.4; }

        /* SECTIONS */
        .section{ padding: 84px 0; background: var(--bg); }
        .section.soft{ background: linear-gradient(180deg, #ffffff, var(--soft2)); }
        .section-head{ text-align:center; margin-bottom: 44px; }
        .section-head h2{
          font-size: clamp(1.9rem, 3.2vw, 2.6rem);
          font-weight:950;
          margin:0 0 10px;
          letter-spacing:-0.02em;
        }
        .section-head h2 span{ color: var(--p); }
        .section-head p{
          margin:0 auto;
          max-width: 64ch;
          color: var(--muted2);
          font-weight:700;
          line-height:1.7;
        }

        .grid{
          display:grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap:18px;
        }
        .card{
          background: rgba(248,250,252,0.9);
          border:1px solid var(--line);
          border-radius:22px;
          padding:22px;
          box-shadow: 0 14px 30px rgba(2,6,23,0.05);
        }
        .card h3{ margin:10px 0 6px; font-size:1.1rem; font-weight:950; }
        .card p{ margin:0; color: var(--muted); font-weight:650; line-height:1.65; }

        .icon{
          width:54px;height:54px;border-radius:16px;
          display:flex;align-items:center;justify-content:center;
          font-size:1.35rem;
          border:1px solid rgba(15,23,42,0.08);
        }
        .icon.blue{ background:#eff6ff; color:#2563eb; }
        .icon.purple{ background:#faf5ff; color:#9333ea; }
        .icon.green{ background:#f0fdf4; color:#16a34a; }
        .icon.red{ background:#fef2f2; color:#ef4444; }
        .icon.slate{ background:#f1f5f9; color:#0f172a; }
        .icon.amber{ background:#fffbeb; color:#b45309; }

        /* TWO COL */
        .two-col{
          display:grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap:28px;
          align-items:start;
        }
        .kicker{
          display:inline-block;
          font-weight:950;
          color: var(--p);
          letter-spacing: 1px;
          font-size:0.9rem;
        }
        .left h2{
          margin:10px 0 10px;
          font-size: clamp(1.8rem, 3.1vw, 2.5rem);
          font-weight:950;
          letter-spacing:-0.02em;
        }
        .left h2 span{ color: var(--p2); }
        .left p{
          margin:0 0 18px;
          color: var(--muted);
          font-weight:700;
          line-height:1.7;
          max-width: 60ch;
        }
        .list{ display:flex; flex-direction:column; gap:14px; margin: 18px 0; }
        .li{
          display:flex; gap:12px; align-items:flex-start;
          background: rgba(255,255,255,0.75);
          border:1px solid rgba(15,23,42,0.10);
          border-radius:18px;
          padding:14px;
        }
        .li-ic{
          width:42px;height:42px;border-radius:14px;
          display:flex;align-items:center;justify-content:center;
          background:#eff6ff; color: var(--p);
          border:1px solid rgba(37,99,235,0.18);
          flex:0 0 auto;
        }
        .li h4{ margin:0 0 4px; font-weight:950; }
        .li p{ margin:0; color: var(--muted2); font-weight:700; }

        .btn-row{ display:flex; gap:12px; flex-wrap:wrap; margin-top: 10px; }

        .media{
          position:relative;
          border-radius:24px;
          overflow:hidden;
          border:1px solid rgba(15,23,42,0.10);
          box-shadow: 0 22px 55px rgba(2,6,23,0.10);
          background:#fff;
        }
        .media img{ width:100%; height:360px; object-fit:cover; display:block; }
        .media-badge{
          position:absolute;
          left:14px; bottom:14px;
          display:flex; gap:10px; align-items:flex-start;
          background: rgba(255,255,255,0.92);
          border:1px solid rgba(15,23,42,0.10);
          padding:12px 12px;
          border-radius:16px;
          max-width: 340px;
          backdrop-filter: blur(10px);
        }
        .media-badge svg{ color: var(--p); margin-top:2px; }
        .media-badge strong{ display:block; font-weight:950; }
        .media-badge span{ display:block; color: var(--muted2); font-weight:700; margin-top:2px; }

        .note{
          display:flex; align-items:center; gap:10px;
          margin-top:12px;
          background: rgba(255,255,255,0.75);
          border:1px solid rgba(15,23,42,0.10);
          padding:12px 14px;
          border-radius:16px;
          font-weight:850;
          color: var(--dark);
        }
        .note svg{ color: var(--p); }

        /* STEPS */
        .steps{
          display:grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap:18px;
        }
        .step{
          border-radius:22px;
          border:1px solid var(--line);
          background: #fff;
          padding:20px;
          box-shadow: 0 16px 35px rgba(2,6,23,0.06);
        }
        .step .num{
          width:46px;height:46px;border-radius:16px;
          display:flex;align-items:center;justify-content:center;
          background: rgba(37,99,235,0.10);
          color: var(--p);
          font-weight:950;
          border:1px solid rgba(37,99,235,0.18);
        }
        .step h3{ margin:10px 0 6px; font-weight:950; }
        .step p{ margin:0; color: var(--muted); font-weight:700; line-height:1.65; }

        /* QUICK */
        .section.quick{
          background: linear-gradient(180deg, var(--soft), #ffffff);
        }
        .quick-grid{
          display:grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap:18px;
          align-items:start;
        }
        .quick-left h2{
          margin:0 0 8px;
          font-size: clamp(1.8rem, 3.1vw, 2.4rem);
          font-weight:950;
          letter-spacing:-0.02em;
        }
        .quick-left h2 span{ color: var(--p); }
        .quick-left p{
          margin:0 0 16px;
          color: var(--muted2);
          font-weight:700;
          line-height:1.7;
          max-width: 62ch;
        }
        .quick-actions{
          display:grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap:12px;
          margin-top:14px;
        }
        .qbtn{
          display:flex; align-items:center; justify-content:space-between;
          text-decoration:none;
          padding:14px 14px;
          border-radius:18px;
          border:1px solid rgba(15,23,42,0.12);
          background: rgba(255,255,255,0.78);
          font-weight:950;
          color: var(--dark);
          transition: transform .2s ease, border-color .2s ease, background .2s ease;
        }
        .qbtn:hover{
          transform: translateY(-3px);
          border-color: rgba(37,99,235,0.35);
          background: #fff;
        }

        .quick-right{
          display:flex;
          flex-direction:column;
          gap:12px;
        }
        .quick-card{
          border-radius:22px;
          border:1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.78);
          padding:18px;
          box-shadow: 0 16px 35px rgba(2,6,23,0.06);
        }
        .quick-card h4{ margin:0 0 6px; font-weight:950; }
        .quick-card p{ margin:0 0 12px; color: var(--muted2); font-weight:700; line-height:1.65; }
        .quick-card .muted{ color: var(--muted); }
        .wfull{ width:100%; }

        .social{
          display:flex; gap:10px;
        }
        .social a{
          width:42px;height:42px;border-radius:14px;
          display:flex;align-items:center;justify-content:center;
          background:#e0e7ff;
          border:1px solid rgba(37,99,235,0.18);
          color:#1e40af;
          transition: transform .2s ease, background .2s ease, color .2s ease;
        }
        .social a:hover{
          transform: translateY(-2px);
          background: var(--p);
          color:#fff;
        }

        /* CTA */
        .cta{
          background: var(--dark);
          padding: 74px 0;
          text-align:center;
        }
        .cta-inner h2{
          margin:0 0 10px;
          font-size: clamp(1.9rem, 3.2vw, 2.7rem);
          font-weight:950;
          background: linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
        }
        .cta-inner p{
          margin:0 auto 18px;
          max-width: 72ch;
          color:#e2e8f0;
          font-weight:650;
          line-height:1.7;
        }
        .cta-row.center{ justify-content:center; }

        .btn.white{
          background:#fff;
          color: var(--dark);
          border-color: rgba(255,255,255,0.30);
        }
        .btn.white:hover{ transform: translateY(-2px); }

        .btn.gold{
          background: rgba(191,149,63,0.14);
          color:#FCF6BA;
          border-color: rgba(191,149,63,0.45);
        }
        .btn.gold:hover{
          transform: translateY(-2px);
          background: rgba(191,149,63,0.22);
          border-color: rgba(252,246,186,0.65);
        }

        /* RESPONSIVE */
        @media (max-width: 1024px){
          .hero-grid{ grid-template-columns: 1fr; }
          .hero-img{ height: 420px; }
          .ribbon-grid{ grid-template-columns: repeat(2, minmax(0,1fr)); }
          .grid{ grid-template-columns: repeat(2, minmax(0,1fr)); }
          .two-col{ grid-template-columns: 1fr; }
          .quick-grid{ grid-template-columns: 1fr; }
        }
        @media (max-width: 640px){
          .hero{ padding: 92px 0 54px; }
          .hero-img{ height: 360px; }
          .hero-float.f3{ display:none; }
          .ribbon-grid{ grid-template-columns: 1fr; }
          .grid{ grid-template-columns: 1fr; }
          .steps{ grid-template-columns: 1fr; }
          .quick-actions{ grid-template-columns: 1fr; }
          .btn{ width: 100%; }
          .cta-row{ width:100%; }
        }
      `}</style>
    </div>
  );
};

export default Home;

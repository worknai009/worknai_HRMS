import React, { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import API from "../../services/api";
import ApplicationModal from "../../components/Modals/ApplicationModal";
import {
  FaSearch,
  FaMapMarkerAlt,
  FaBriefcase,
  FaBuilding,
  FaCheckCircle,
  FaSpinner,
  FaFilter,
  FaClock,
  FaRupeeSign,
  FaArrowRight,
  FaTimes,
  FaSortAmountDown,
  FaBolt,
  FaRocket,
  FaHeart,
  FaUsers,
  FaLaptopCode,
  FaQuoteLeft,
} from "react-icons/fa";
import { toast } from "react-toastify";
import careerImg from "../../assets/career.png";
import ruturajImg from "../../assets/ruturaj.png";
import rudrakshaImg from "../../assets/rudraksha.png";
import rutujaImg from "../../assets/rutuja.png";
import gauravImg from "../../assets/gaurav.png";
import sakshiImg from "../../assets/sakshi.png";
import samikshaImg from "../../assets/samiksha.png";
import prernaImg from "../../assets/prerna.png";
import nishigandhaImg from "../../assets/nishigandha.png";
import maheshImg from "../../assets/mahesh.png";
import sagarImg from "../../assets/sagar.png";
import rushikaImg from "../../assets/rushika.png";
import pruthvrajImg from "../../assets/pruthvraj.png";
import renukaImg from "../../assets/renuka.png";
import divyaImg from "../../assets/divya.png";
import shubhamImg from "../../assets/shubham.png";

// Helper: Relative time
const timeAgo = (iso) => {
  if (!iso) return "Recently";
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return "Recently";
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
};

// Start color helper
const stageColor = (s = "") => {
  const key = String(s || "").toLowerCase();
  if (key.includes("reject")) return "danger";
  if (key.includes("hire")) return "success";
  if (key.includes("offer")) return "info";
  if (key.includes("interview")) return "warn";
  if (key.includes("screen")) return "purple";
  return "blue";
};

const Careers = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const storiesList = [
    { src: nishigandhaImg, name: "Nishigandha", text: "Worknai offers a fantastic environment to innovate and excel." },
    { src: maheshImg, name: "Mahesh", text: "The culture of collaboration here is truly inspiring." },
    { src: renukaImg, name: "Renuka", text: "A place where passion meets purpose and growth is inevitable." },
    { src: gauravImg, name: "Gaurav", text: "Amazing team and incredibly impactful projects." },
    { src: sakshiImg, name: "Sakshi", text: "Work-life balance and career growth are unmatched." },
    { src: ruturajImg, name: "Ruturaj", text: "A great place for constant innovation and growth!" },
    { src: prernaImg, name: "Prerna", text: "Proud to be part of such a talented and driven team." },
    { src: rudrakshaImg, name: "Rudraksha", text: "The culture here brings out the best in everyone." },
    { src: divyaImg, name: "Divya", text: "Truly grateful for the mentorship and growth I've found here." },
    { src: sagarImg, name: "Sagar", text: "Innovative projects and a supportive team make work exciting." },
    { src: rutujaImg, name: "Rutuja", text: "I love the flexible and supportive environment." },
    { src: pruthvrajImg, name: "Pruthvraj", text: "Every day brings new challenges and learning opportunities." },
    { src: samikshaImg, name: "Samiksha", text: "Every day is a new learning opportunity here." },
    { src: shubhamImg, name: "Shubham", text: "A great environment for professional and personal development." },
    { src: rushikaImg, name: "Rushika", text: "I've had immense opportunities to learn and grow here." },


  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % storiesList.length);
    }, 7000); // cycle every 7 seconds
    return () => clearInterval(timer);
  }, [storiesList.length]);

  // URL Params
  const { companyId } = useParams();
  const [searchParams] = useSearchParams();
  const queryCompanyId = searchParams.get("companyId");
  const targetCompanyId = companyId || queryCompanyId;

  // Track status
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusForm, setStatusForm] = useState({ email: "", applicationId: "" });
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusResult, setStatusResult] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    types: new Set(),
    remoteOnly: false,
    dept: new Set(),
    sort: "newest",
  });

  useEffect(() => {
    fetchPublicJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetCompanyId]);

  const fetchPublicJobs = async () => {
    try {
      setLoading(true);
      const url = targetCompanyId
        ? `/recruitment/public/jobs?companyId=${targetCompanyId}`
        : `/recruitment/public/jobs`;

      const res = await API.get(url);
      const arr = Array.isArray(res.data) ? res.data : [];
      setJobs(arr);
    } catch (error) {
      console.error("Failed to load jobs", error);
      toast.error("Could not load job openings.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Apply success -> open track modal with autofill
  const handleApplied = (payload) => {
    if (!payload?.trackId) return;
    setStatusForm({ email: payload.email || "", applicationId: payload.trackId });
    setStatusResult(null);
    setShowStatusModal(true);
  };

  // ✅ When Track modal opens -> try autofill from localStorage (last applied)
  useEffect(() => {
    if (!showStatusModal) return;
    try {
      const saved = JSON.parse(localStorage.getItem("last_application_track") || "null");
      if (saved?.trackId) {
        setStatusForm((p) => ({
          email: p.email || saved.email || "",
          applicationId: p.applicationId || saved.trackId || "",
        }));
      }
    } catch (_) { }
  }, [showStatusModal]);

  const handleCheckStatus = async (e) => {
    e.preventDefault();
    try {
      setStatusLoading(true);
      const res = await API.post("/recruitment/public/check-status", statusForm);
      setStatusResult(res.data);
    } catch (e2) {
      toast.error(e2.response?.data?.message || "Invalid details or Application not found.");
      setStatusResult(null);
    } finally {
      setStatusLoading(false);
    }
  };

  const departments = useMemo(() => {
    const set = new Set();
    jobs.forEach((j) => {
      const d = String(j.department || "").trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    let list = jobs.filter((job) => {
      const title = String(job.title || "").toLowerCase();
      const dept = String(job.department || "").toLowerCase();
      const loc = String(job.location || "").toLowerCase();
      const company = String(job.companyId?.name || job.companyId?.companyName || "").toLowerCase();

      const matchesTerm =
        !term ||
        title.includes(term) ||
        dept.includes(term) ||
        loc.includes(term) ||
        company.includes(term);

      if (!matchesTerm) return false;

      // type
      if (filters.types.size > 0) {
        if (!filters.types.has(String(job.employmentType || ""))) return false;
      }

      // remoteOnly
      if (filters.remoteOnly) {
        const isRemote = loc.includes("remote") || loc.includes("work from home") || loc.includes("wfh");
        if (!isRemote) return false;
      }

      // dept
      if (filters.dept.size > 0) {
        if (!filters.dept.has(String(job.department || ""))) return false;
      }

      return true;
    });

    // sort
    list.sort((a, b) => {
      const da = new Date(a.createdAt || 0).getTime();
      const db = new Date(b.createdAt || 0).getTime();
      if (filters.sort === "oldest") return da - db;
      return db - da;
    });

    return list;
  }, [jobs, searchTerm, filters]);

  const toggleSet = (key, value) => {
    setFilters((p) => {
      const next = new Set(p[key]);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return { ...p, [key]: next };
    });
  };

  const resetFilters = () => {
    setFilters({ types: new Set(), remoteOnly: false, dept: new Set(), sort: "newest" });
  };

  return (
    <div className="career-page">
      {/* HERO SECTION */}
      <div className="career-hero">
        <div className="hero-glow" />
        <div className="hero-noise" />
        <div className="hero-container container">
          <div className="hero-left">
            <div className="hero-pill">
              <FaBolt /> We are hiring top talent
            </div>

            <h1 className="hero-title">
              Build Your <span className="highlight">Future</span> With Us
            </h1>
            <p className="hero-subtitle">
              Join a team of innovators and creators. Explore exciting career opportunities
              and help us shape the future of technology.
            </p>

            <div className="hero-actions">
              <div className="search-bar">
                <FaSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Search jobs, departments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {!!searchTerm && (
                  <button className="clear-search" onClick={() => setSearchTerm("")}>
                    <FaTimes />
                  </button>
                )}
              </div>

              <button
                className="track-btn"
                onClick={() => {
                  setStatusResult(null);
                  setShowStatusModal(true);
                }}
              >
                <FaCheckCircle /> Track Application
              </button>
            </div>
          </div>

          <div className="hero-right">
            <div className="hero-img-wrap">
              <img src={careerImg} alt="Careers" className="hero-img" />
              <div className="img-glow" />
            </div>
          </div>
        </div>
      </div>

      {/* WHY JOIN US */}
      <section className="section benefits-section">
        <div className="container">
          <div className="sec-head text-center">
            <h3>Why Join Us?</h3>
            <p className="sub">Perks that make work feel like play.</p>
          </div>
          <div className="benefits-grid">
            <div className="b-card">
              <div className="b-icon"><FaRocket /></div>
              <h4>Fast Growth</h4>
              <p>Accelerate your career with rapid advancement opportunities.</p>
            </div>
            <div className="b-card">
              <div className="b-icon"><FaHeart /></div>
              <h4>Health & Wellness</h4>
              <p>Comprehensive health insurance and wellness programs.</p>
            </div>
            <div className="b-card">
              <div className="b-icon"><FaUsers /></div>
              <h4>Great Culture</h4>
              <p>Collaborative, inclusive, and fun work environment.</p>
            </div>
            <div className="b-card">
              <div className="b-icon"><FaLaptopCode /></div>
              <h4>Remote Options</h4>
              <p>Flexible work-from-home policies for better balance.</p>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section test-section">
        <div className="container">
          <div className="sec-head text-center">
            <h3>Employee Stories</h3>
            <p className="sub">Hear what our team has to say.</p>
          </div>
          <div className="neat-slider-container">
            {storiesList.map((story, idx) => {
              const total = storiesList.length;
              let offset = idx - activeIndex;
              if (offset < -Math.floor(total / 2)) offset += total;
              if (offset > Math.floor(total / 2)) offset -= total;

              let positionClass = "slide-hidden";
              if (offset === 0) positionClass = "slide-center";
              else if (offset === -1) positionClass = "slide-left";
              else if (offset === 1) positionClass = "slide-right";

              return (
                <div key={idx} className={`neat-slide-card ${positionClass}`}>
                  <img src={story.src} alt={`Story of ${story.name}`} className="neat-slide-img" />
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* OPEN POSITIONS MAIN */}
      <div className="main-layout container" id="jobs">
        {/* FILTERS SIDEBAR */}
        <aside className="filters-sidebar">
          <div className="filter-card">
            <div className="filter-head">
              <div className="fh-left">
                <FaFilter /> Filters
              </div>
              <button className="link-btn" onClick={resetFilters}>Reset</button>
            </div>

            <div className="filter-group">
              <div className="filter-title">Type</div>
              {["Full-time", "Part-time", "Contract", "Intern"].map((t) => (
                <label className="check-row" key={t}>
                  <input
                    type="checkbox"
                    checked={filters.types.has(t)}
                    onChange={() => toggleSet("types", t)}
                  />
                  <span>{t}</span>
                </label>
              ))}
            </div>

            <div className="filter-group">
              <div className="filter-title">Department</div>
              {departments.length === 0 ? (
                <div className="muted">No departments</div>
              ) : (
                departments.map((d) => (
                  <label className="check-row" key={d}>
                    <input
                      type="checkbox"
                      checked={filters.dept.has(d)}
                      onChange={() => toggleSet("dept", d)}
                    />
                    <span>{d}</span>
                  </label>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* JOB LIST */}
        <div className="jobs-section">
          <div className="section-header">
            <h2 className="fade-in">Open Positions ({filteredJobs.length})</h2>
            <div className="sort-box">
              <span className="sort-label">Sort by:</span>
              <select value={filters.sort} onChange={(e) => setFilters(p => ({ ...p, sort: e.target.value }))}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loader glass">
              <FaSpinner className="spin" /> Loading roles...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="empty-state">
              <div className="empty-badge">No results</div>
              <h3>No matching jobs found.</h3>
              <button className="btn-outline" onClick={resetFilters}>Reset Filters</button>
            </div>
          ) : (
            <div className="jobs-grid">
              {filteredJobs.map((job, idx) => {
                const company = job.companyId?.name || job.companyId?.companyName || "Company";
                return (
                  <div key={job._id} className="job-card-public animate-up" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="card-body">
                      <div className="card-top">
                        <div className="company-logo">{company.charAt(0)}</div>
                        <div>
                          <h3 className="job-title">{job.title}</h3>
                          <div className="company-name">{company} • Verified</div>
                        </div>
                        <span className="type-badge">{job.employmentType}</span>
                      </div>

                      <div className="tags-row">
                        <span className="tag"><FaBriefcase /> {job.experience || "Fresher"}</span>
                        {job.passingYear && <span className="tag" style={{ borderColor: 'rgba(251, 191, 36, 0.4)', background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24' }}>🎓 Batch {job.passingYear}</span>}
                        <span className="tag"><FaMapMarkerAlt /> {job.location || "Remote"}</span>
                        <span className="tag"><FaRupeeSign /> {job.salaryRange || "Competitive"}</span>
                      </div>

                      {/* Skills Tags */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="tags-row" style={{ marginTop: 6 }}>
                          {job.skills.slice(0, 3).map((sk, skIdx) => (
                            <span key={skIdx} className="tag" style={{ background: 'rgba(80, 200, 255, 0.1)', color: '#50c8ff', borderColor: 'rgba(80, 200, 255, 0.2)' }}>
                              {sk}
                            </span>
                          ))}
                          {job.skills.length > 3 && <span className="tag" style={{ fontSize: '0.75rem' }}>+{job.skills.length - 3}</span>}
                        </div>
                      )}

                      <div className="job-desc">
                        {(job.description || "").substring(0, 140)}...
                      </div>
                    </div>

                    <div className="card-footer">
                      <span className="post-time"><FaClock /> {timeAgo(job.createdAt)}</span>
                      <button className="apply-btn-sm" onClick={() => setSelectedJob(job)}>
                        Apply Now <FaArrowRight />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* APPLY MODAL */}
      {selectedJob && (
        <ApplicationModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onApplied={handleApplied}
        />
      )}

      {/* TRACK MODAL */}
      {showStatusModal && (
        <div className="modal-overlay" onMouseDown={() => { setShowStatusModal(false); setStatusResult(null); }}>
          <div className="modal-box animate-pop" onMouseDown={e => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <h3>Track Your Application</h3>
                <div className="modal-sub">Check stats and interview updates</div>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="close-btn"><FaTimes /></button>
            </div>

            <form onSubmit={handleCheckStatus}>
              <div className="form-group">
                <label>Email Address</label>
                <input required type="email" value={statusForm.email} onChange={(e) => setStatusForm({ ...statusForm, email: e.target.value })} placeholder="you@example.com" />
              </div>
              <div className="form-group">
                <label>Track ID / App ID</label>
                <input required value={statusForm.applicationId} onChange={(e) => setStatusForm({ ...statusForm, applicationId: e.target.value })} placeholder="APP-123456-78" />
              </div>
              <button type="submit" className="btn-primary full-width" disabled={statusLoading}>
                {statusLoading ? <FaSpinner className="spin" /> : "Check Status"}
              </button>
            </form>

            {statusResult && (
              <div className="status-result active-res">
                <div className="st-head">
                  <div className="st-title">{statusResult.jobTitle}</div>
                  <span className={`st-badge ${stageColor(statusResult.stage)}`}>{statusResult.stage}</span>
                </div>

                <div className="st-grid">
                  <div className="st-row">
                    <span className="st-lbl">Last Update:</span>
                    <span className="st-val">{new Date(statusResult.updatedAt).toLocaleDateString()}</span>
                  </div>
                  <div className="st-msg">
                    {statusResult.feedback}
                  </div>

                  {/* Interview Details */}
                  {statusResult.interview && (
                    <div className="interview-box">
                      <div className="ib-head">📅 Interview Scheduled</div>
                      <div className="ib-row"><b>Time:</b> {new Date(statusResult.interview.scheduledAt).toLocaleString()}</div>
                      <div className="ib-row"><b>Mode:</b> {statusResult.interview.mode}</div>
                      <div className="ib-row"><b>Location/Link:</b> {statusResult.interview.location}</div>
                      {statusResult.interview.notes && (
                        <div className="ib-row"><b>Note:</b> {statusResult.interview.notes}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        /* Global & Reset */
        .career-page, .career-page * { box-sizing: border-box; }
        .career-page { 
          font-family: 'Inter', sans-serif; 
          background: #050714; 
          color: #ffffff; 
          min-height: 100vh; 
          padding-top: 80px; /* Space for fixed navbar */
          padding-bottom: 60px; 
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 16px; width: 100%; }
        .text-center { text-align: center; }
        
        /* HERO */
        .career-hero {
          background: #050714; 
          color: white; 
          padding: 80px 16px 120px;
          position: relative; 
          overflow: hidden; 
          text-align: center;
          border-bottom-left-radius: 60px; 
          border-bottom-right-radius: 60px;
        }

        .hero-glow {
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 80%;
          height: 100%;
          background: radial-gradient(circle, rgba(80, 200, 255, 0.15) 0%, transparent 70%);
          pointer-events: none;
          z-index: 0;
        }

        .hero-noise {
          position: absolute;
          inset: 0;
          background-image: url("https://grainy-gradients.vercel.app/noise.svg");
          opacity: 0.15;
          pointer-events: none;
          z-index: 1;
        }

        .hero-container { 
          display: flex; 
          flex-direction: row;
          flex-wrap: nowrap;
          align-items: stretch; 
          justify-content: space-between; 
          gap: 40px; 
          position: relative; 
          z-index: 2; 
          text-align: left;
        }

        .hero-left { 
          flex: 1; 
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        
        .hero-right { 
          flex: 1; 
          display: flex; 
          justify-content: flex-end; 
          align-items: stretch;
        }

        .hero-img-wrap {
          position: relative;
          width: 100%;
          max-width: 500px;
          display: flex;
          height: auto;
          align-items: center;
        }

        .hero-img {
          width: 100%;
          height: auto;
          max-height: 100%;
          object-fit: contain;
          border-radius: 40px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .img-glow {
          position: absolute;
          inset: -30px;
          background: radial-gradient(circle, rgba(80, 200, 255, 0.25) 0%, transparent 70%);
          z-index: -1;
        }

        .highlight { 
          background: linear-gradient(90deg, #50c8ff, #a78bfa, #e879f9); 
          -webkit-background-clip: text; 
          -webkit-text-fill-color: transparent; 
          font-weight: 900;
        }

        .hero-title { 
          font-size: clamp(2.5rem, 5vw, 4.2rem); 
          font-weight: 800; 
          margin-bottom: 24px; 
          letter-spacing: -2px; 
          line-height: 1.1;
        }
        .hero-subtitle { 
          font-size: 1.3rem; 
          color: rgba(255, 255, 255, 0.7); 
          max-width: 600px; 
          margin: 0 0 40px; 
          line-height: 1.6; 
        }
        
        .hero-pill { 
           display: inline-flex; align-items: center; gap: 8px; 
           background: rgba(80, 200, 255, 0.1); 
           padding: 8px 16px; border-radius: 30px; 
           font-size: 0.8rem; font-weight: 700; 
           margin-bottom: 30px;
           border: 1px solid rgba(80, 200, 255, 0.2);
           color: #50c8ff;
           text-transform: uppercase;
           letter-spacing: 1px;
           width: fit-content;
        }

        .hero-actions { display: flex; justify-content: flex-start; gap: 16px; flex-wrap: wrap; }
        
        .search-bar { 
           background: rgba(255, 255, 255, 0.05); 
           padding: 0 24px; 
           border-radius: 30px; 
           display: flex; align-items: center; 
           width: 100%; max-width: 500px; 
           height: 60px;
           box-sizing: border-box;
           box-shadow: 0 20px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05); 
           border: 1px solid rgba(255, 255, 255, 0.1);
           backdrop-filter: blur(20px);
           transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
           position: relative;
        }
        .search-bar:focus-within {
          border-color: #50c8ff;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 20px 45px rgba(80, 200, 255, 0.15);
          transform: translateY(-2px);
        }
        .search-bar input { 
          background: transparent; border: none; outline: none; 
          padding: 12px; flex: 1; font-weight: 500; 
          font-size: 1.05rem; color: white;
          min-width: 0;
          text-overflow: ellipsis;
        }
        .search-bar input::placeholder { color: rgba(255, 255, 255, 0.4); }
        .search-icon { color: #50c8ff; font-size: 1.4rem; filter: drop-shadow(0 0 10px rgba(80, 200, 255, 0.3)); }
        .clear-search { background: none; border: none; color: rgba(255, 255, 255, 0.3); cursor: pointer; padding: 5px; transition: 0.2s; }
        .clear-search:hover { color: #f87171; transform: scale(1.1); }
        
        .track-btn {
           background: rgba(255, 255, 255, 0.04); 
           color: white; 
           border: 1px solid rgba(255, 255, 255, 0.08);
           padding: 0 32px; 
           border-radius: 30px; 
           height: 60px;
           box-sizing: border-box;
           font-weight: 700; 
           cursor: pointer; 
           display: flex; align-items: center; gap: 12px;
           transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
           backdrop-filter: blur(20px);
           font-size: 1rem;
        }
        .track-btn:hover { 
          background: rgba(80, 200, 255, 0.08); 
          transform: translateY(-2px); 
          border-color: rgba(80, 200, 255, 0.4);
          box-shadow: 0 15px 30px rgba(80, 200, 255, 0.1);
        }
        .track-btn:active { transform: translateY(0); }
        .track-btn svg { font-size: 1.2rem; color: #50c8ff; filter: drop-shadow(0 0 8px rgba(80, 200, 255, 0.3)); }

        /* SECTIONS */
        .section { padding: 60px 0; }
        .sec-head h3 { font-size: 2.25rem; font-weight: 800; margin-bottom: 10px; color: #ffffff; letter-spacing: -0.5px; }
        .sec-head .sub { color: rgba(255, 255, 255, 0.6); font-size: 1.1rem; margin-bottom: 40px; }

        /* BENEFITS */
        .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
        .b-card { 
          background: rgba(255, 255, 255, 0.03); 
          padding: 32px 24px; 
          border-radius: 24px; 
          border: 1px solid rgba(255, 255, 255, 0.08); 
          text-align: center; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          backdrop-filter: blur(12px);
        }
        .b-card:hover { 
          transform: translateY(-8px); 
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(80, 200, 255, 0.3);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }
        .b-icon { font-size: 2.5rem; color: #50c8ff; margin-bottom: 20px; filter: drop-shadow(0 0 10px rgba(80, 200, 255, 0.3)); }
        .b-card h4 { font-size: 1.25rem; font-weight: 700; margin-bottom: 12px; color: #ffffff; }
        .b-card p { color: rgba(255, 255, 255, 0.6); font-size: 0.95rem; line-height: 1.6; }

        /* MAIN LAYOUT */
        .main-layout { display: flex; gap: 40px; padding-top: 20px; align-items: flex-start; }
        .filters-sidebar { width: 280px; flex-shrink: 0; position: sticky; top: 100px; display: none; }
        @media (min-width: 1024px) { .filters-sidebar { display: block; } }
        
        .filter-card { 
          background: rgba(255, 255, 255, 0.03); 
          padding: 24px; 
          border-radius: 24px; 
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(12px);
        }
        .filter-head { 
          display: flex; justify-content: space-between; align-items: center; 
          margin-bottom: 20px; font-weight: 800; color: #ffffff;
        }
        .link-btn { background: none; border: none; color: #50c8ff; font-weight: 700; cursor: pointer; font-size: 0.9rem; }
        .filter-group { margin-bottom: 24px; }
        .filter-title { 
          font-size: 0.75rem; text-transform: uppercase; 
          letter-spacing: 1.5px; color: rgba(255, 255, 255, 0.4); 
          font-weight: 800; margin-bottom: 12px; 
        }
        .check-row { 
          display: flex; align-items: center; gap: 10px; 
          margin-bottom: 12px; font-size: 0.95rem; 
          color: rgba(255, 255, 255, 0.7); cursor: pointer; 
          transition: 0.2s;
        }
        .check-row:hover { color: #ffffff; }
        .check-row input { accent-color: #50c8ff; width: 16px; height: 16px; }
        
        /* JOBS */
        .jobs-section { flex: 1; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .section-header h2 { font-size: 1.75rem; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .sort-box { display: flex; align-items: center; gap: 10px; font-size: 0.95rem; color: rgba(255, 255, 255, 0.6); }
        .sort-box select { 
          background: rgba(255, 255, 255, 0.05); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          padding: 6px 12px; border-radius: 10px; 
          color: white; font-weight: 600;
        }
        .sort-box select option { background: #080d1e; color: white; }

        .jobs-grid { display: grid; gap: 20px; }
        .job-card-public { 
          background: rgba(255, 255, 255, 0.03); 
          border: 1px solid rgba(255, 255, 255, 0.08); 
          border-radius: 24px; 
          overflow: hidden; 
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); 
          display: flex; flex-direction: column; 
          backdrop-filter: blur(12px);
        }
        .job-card-public:hover { 
          border-color: rgba(80, 200, 255, 0.4); 
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 15px 40px rgba(0,0,0,0.4); 
          transform: translateY(-4px); 
        }
        
        .card-body { padding: 24px; flex: 1; }
        .card-top { display: flex; align-items: flex-start; gap: 16px; margin-bottom: 16px; }
        .company-logo { 
          width: 48px; height: 48px; border-radius: 14px; 
          background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
          color: white; display: grid; place-items: center; 
          font-weight: 800; font-size: 1.4rem; 
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }
        .job-title { font-size: 1.3rem; font-weight: 800; color: #ffffff; margin-bottom: 4px; letter-spacing: -0.3px; }
        .company-name { font-size: 0.95rem; color: rgba(255, 255, 255, 0.6); font-weight: 600; }
        .type-badge { 
          margin-left: auto; 
          background: rgba(80, 200, 255, 0.1); 
          padding: 6px 14px; border-radius: 30px; 
          font-size: 0.75rem; font-weight: 800; 
          color: #50c8ff; white-space: nowrap; 
          border: 1px solid rgba(80, 200, 255, 0.2);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .tags-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
        .tag { 
          display: inline-flex; align-items: center; gap: 6px; 
          font-size: 0.85rem; 
          background: rgba(255, 255, 255, 0.05); 
          padding: 6px 12px; border-radius: 10px; 
          color: rgba(255, 255, 255, 0.8); 
          border: 1px solid rgba(255, 255, 255, 0.1); 
          font-weight: 500;
        }
        .job-desc { color: rgba(255, 255, 255, 0.65); font-size: 0.95rem; line-height: 1.6; }
        
        .card-footer { 
          padding: 16px 24px; 
          background: rgba(255, 255, 255, 0.02); 
          border-top: 1px solid rgba(255, 255, 255, 0.05); 
          display: flex; justify-content: space-between; align-items: center; 
        }
        .post-time { font-size: 0.85rem; color: rgba(255, 255, 255, 0.4); display: flex; align-items: center; gap: 6px; font-weight: 500; }
        
        .apply-btn-sm { 
          background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
          color: white; padding: 10px 20px; 
          border-radius: 14px; 
          font-weight: 800; border: none; 
          cursor: pointer; display: flex; align-items: center; gap: 8px; 
          font-size: 0.95rem; transition: 0.3s; 
          box-shadow: 0 8px 20px -5px rgba(59, 130, 246, 0.5);
        }
        .apply-btn-sm:hover { 
          transform: translateY(-2px); 
          box-shadow: 0 12px 25px -5px rgba(139, 92, 246, 0.6);
        }
        .apply-btn-sm:active { transform: translateY(0); }

       
        
        /* ============================= */
/* NEAT 3-CARD CAROUSEL FX       */
/* ============================= */

.test-section {
  background: rgba(5, 7, 20, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
}

.neat-slider-container {
  position: relative;
  width: 100%;
  max-width: 1000px;
  height: 520px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px 0;
}

.neat-slide-card {
  position: absolute;
  width: 340px;
  height: 480px;
  border-radius: 20px;
  background: transparent;
  transition: all 1.2s cubic-bezier(0.25, 1, 0.5, 1);
  overflow: hidden;
  display: flex;
}

.neat-slide-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 20px;
}

/* Position Classes */
.slide-center {
  transform: translateX(0) scale(1.0);
  opacity: 1;
  z-index: 3;
  filter: blur(0px) grayscale(0%);
}

.slide-left {
  transform: translateX(-80%) scale(0.8);
  opacity: 0.5;
  z-index: 2;
  filter: grayscale(60%) blur(2px);
}

.slide-right {
  transform: translateX(80%) scale(0.8);
  opacity: 0.5;
  z-index: 2;
  filter: grayscale(60%) blur(2px);
}

        /* POSITION CLASSES */
        .slide-hidden {
          transform: translateX(0) scale(0.5);
          opacity: 0;
          z-index: 1;
          pointer-events: none;
        }
        
        /* MODAL STYLES */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px;
        }
        .modal-box {
          background: #080d1e; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px;
          width: 100%; max-width: 500px; padding: 30px; box-shadow: 0 25px 50px rgba(0,0,0,0.6);
          text-align: left;
        }
        .animate-pop { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes popIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; }}
        .modal-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .modal-head h3 { font-size: 1.5rem; font-weight: 800; margin-bottom: 4px; }
        .modal-sub { color: rgba(255, 255, 255, 0.6); font-size: 0.95rem; }
        .close-btn { 
          background: rgba(255, 255, 255, 0.05); border: none; border-radius: 50%; width: 32px; height: 32px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; color: #fff; cursor: pointer; transition: 0.2s;
        }
        .close-btn:hover { background: rgba(255, 255, 255, 0.1); color: #f87171; }
        .form-group { margin-bottom: 20px; text-align: left; }
        .form-group label { display: block; font-size: 0.9rem; font-weight: 600; color: rgba(255, 255, 255, 0.8); margin-bottom: 8px; }
        .form-group input { 
          width: 100%; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 12px 16px; border-radius: 12px; color: #fff; font-size: 1rem; outline: none; transition: 0.2s;
        }
        .form-group input:focus { border-color: #50c8ff; background: rgba(80, 200, 255, 0.05); }
        .btn-primary.full-width {
          width: 100%; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff; border: none;
          padding: 14px; border-radius: 12px; font-weight: 700; font-size: 1rem; cursor: pointer;
          display: flex; justify-content: center; align-items: center; gap: 8px; transition: 0.3s;
        }
        .btn-primary.full-width:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(59, 130, 246, 0.4); }
        
        /* STATUS RESULT */
        .status-result { 
          margin-top: 30px; 
          background: rgba(255, 255, 255, 0.05); 
          padding: 24px; border-radius: 20px; 
          animation: slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1); 
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        @keyframes slideDown { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; }}
        
        .st-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); padding-bottom: 16px; }
        .st-title { font-weight: 800; font-size: 1.1rem; color: #ffffff; }
        .st-badge { 
          font-size: 0.7rem; padding: 4px 10px; 
          border-radius: 30px; font-weight: 900; 
          text-transform: uppercase; 
          letter-spacing: 0.5px;
        }
        .st-badge.blue { background: rgba(80, 200, 255, 0.15); color: #50c8ff; border: 1px solid rgba(80, 200, 255, 0.3); }
        .st-badge.warn { background: rgba(251, 191, 36, 0.15); color: #fbbf24; border: 1px solid rgba(251, 191, 36, 0.3); }
        .st-badge.success { background: rgba(52, 211, 153, 0.15); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.3); }
        .st-badge.danger { background: rgba(248, 113, 113, 0.15); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.3); }
        .st-badge.info { background: rgba(167, 139, 250, 0.15); color: #a78bfa; border: 1px solid rgba(167, 139, 250, 0.3); }
        .st-badge.purple { background: rgba(232, 121, 249, 0.15); color: #e879f9; border: 1px solid rgba(232, 121, 249, 0.3); }
        
        .st-row { display: flex; justify-content: space-between; font-size: 0.95rem; margin-bottom: 10px; }
        .st-lbl { color: rgba(255, 255, 255, 0.5); font-weight: 600; } .st-val { font-weight: 700; color: #ffffff; }
        .st-msg { 
          background: rgba(255, 255, 255, 0.05); 
          padding: 14px; border-radius: 12px; 
          font-size: 0.95rem; color: rgba(255, 255, 255, 0.85); 
          border: 1px solid rgba(85, 85, 85, 0.1); margin-top: 12px;
          line-height: 1.5;
        }
        
        .interview-box { 
          margin-top: 16px; 
          background: rgba(251, 191, 36, 0.05); 
          border: 1px solid rgba(251, 191, 36, 0.2); 
          padding: 16px; border-radius: 12px; 
        }
        .ib-head { font-weight: 800; color: #fbbf24; margin-bottom: 12px; font-size: 0.95rem; }
        .ib-row { font-size: 0.9rem; color: rgba(255, 255, 255, 0.85); margin-bottom: 6px; }
        .ib-row b { color: #fbbf24; }
        
        @media (max-width: 1024px) {
           .hero-container { gap: 30px; }
           .hero-title { font-size: 3rem; }
           .hero-subtitle { font-size: 1.1rem; }
           .neat-slide-card { width: 300px; height: 420px; }
           .neat-slider-container { height: 460px; }
        }

        @media (max-width: 768px) {
           .section { padding: 50px 0; }
           .sec-head .sub { margin-bottom: 30px; }
           
           .hero-container { 
             flex-direction: column; 
             text-align: center; 
             padding-top: 20px;
           }
           .hero-left { 
             flex: none; 
             margin-bottom: 30px; 
             display: flex;
             flex-direction: column;
             align-items: center;
           }
           .hero-right { 
             display: flex; 
             justify-content: center; 
             width: 100%; 
             align-items: center;
             margin-top: 20px;
           }
           .hero-img-wrap { 
             max-width: 250px; 
             margin: 0 auto;
           }
           .hero-actions { 
             justify-content: center; 
             width: 100%;
             max-width: 500px;
             margin: 0 auto;
           }
           .hero-subtitle { 
             margin: 0 auto 30px; 
             font-size: 1rem;
             max-width: 90%;
           }
           .hero-title { 
             font-size: 2.2rem; 
             margin-bottom: 16px;
           }
           .career-hero { 
             padding: 100px 16px 50px; 
             border-bottom-left-radius: 40px; 
             border-bottom-right-radius: 40px; 
           }
           .main-layout { flex-direction: column; gap: 30px; }
           .filters-sidebar { display: none; }
           
           .neat-slider-container { height: 400px; }
           .neat-slide-card { width: 260px; height: 360px; }
           .slide-left { transform: translateX(-45%) scale(0.75); }
           .slide-right { transform: translateX(45%) scale(0.75); }
        }

        @media (max-width: 480px) {
           .section { padding: 40px 0; }
           .sec-head h3 { font-size: 1.8rem; }
           .sec-head .sub { font-size: 0.95rem; margin-bottom: 24px; }
           
           .career-page { padding-top: 70px; }
           .hero-title { font-size: 1.8rem; letter-spacing: -1px; }
           .hero-pill { font-size: 0.7rem; padding: 6px 12px; margin-bottom: 20px; }
           .hero-actions { 
             flex-direction: column; 
             align-items: stretch; 
             gap: 16px;
           }
           .search-bar { 
             max-width: 100%;
             width: 100%;
             height: 56px;
             padding: 0 16px;
             border-radius: 16px;
           }
           .search-bar input { padding: 8px; font-size: 0.95rem; }
           .track-btn { 
             width: 100%; 
             height: 56px;
             justify-content: center; 
             padding: 0;
             border-radius: 16px;
             font-size: 1rem;
           }
           
           .neat-slider-container { height: 310px; }
           .neat-slide-card { width: 220px; height: 290px; }
           .slide-left { transform: translateX(-25%) scale(0.7); opacity: 0.2; }
           .slide-right { transform: translateX(25%) scale(0.7); opacity: 0.2; }

           .card-top { flex-direction: column; gap: 10px; align-items: flex-start; }
           .company-name { font-size: 0.85rem; }
           .type-badge { margin-left: 0; margin-top: 4px; }
           .apply-btn-sm { width: 100%; justify-content: center; padding: 12px; }
           .career-hero { padding: 50px 15px 30px; }
           
           .section-header { flex-direction: column; align-items: flex-start; gap: 16px; margin-bottom: 24px; }
           .section-header h2 { font-size: 1.4rem; }
        }
      `}</style>
    </div>
  );
};

export default Careers;

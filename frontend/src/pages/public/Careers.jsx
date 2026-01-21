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
        <div className="hero-content">
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
                placeholder="Search job title, department..."
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
                        {job.passingYear && <span className="tag" style={{ borderColor: '#fbbf24', background: '#fffbeb', color: '#b45309' }}>🎓 Batch {job.passingYear}</span>}
                        <span className="tag"><FaMapMarkerAlt /> {job.location || "Remote"}</span>
                        <span className="tag"><FaRupeeSign /> {job.salaryRange || "Competitive"}</span>
                      </div>

                      {/* Skills Tags */}
                      {job.skills && job.skills.length > 0 && (
                        <div className="tags-row" style={{ marginTop: 6 }}>
                          {job.skills.slice(0, 3).map((sk, skIdx) => (
                            <span key={skIdx} className="tag" style={{ background: '#e0f2fe', color: '#0369a1', borderColor: '#bae6fd' }}>
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

      {/* TESTIMONIALS */}
      <section className="section test-section">
        <div className="container">
          <div className="sec-head text-center">
            <h3>Employee Stories</h3>
            <p className="sub">Hear what our team has to say.</p>
          </div>
          <div className="test-grid">
            <div className="t-card">
              <FaQuoteLeft className="quote-icon" />
              <p>"The best place to grow your career. The mentorship here is outstanding."</p>
              <div className="t-user">
                <div className="t-av">S</div>
                <div>
                  <div className="t-name">Sarah Jenkins</div>
                  <div className="t-role">Product Designer</div>
                </div>
              </div>
            </div>
            <div className="t-card">
              <FaQuoteLeft className="quote-icon" />
              <p>"I love the flexibility and the challenging problems we get to solve every day."</p>
              <div className="t-user">
                <div className="t-av">M</div>
                <div>
                  <div className="t-name">Mike Ross</div>
                  <div className="t-role">Senior Engineer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
        .career-page { font-family: 'Inter', sans-serif; background: #f8fafc; color: #0f172a; min-height: 100vh; padding-bottom: 60px; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
        .text-center { text-align: center; }
        
        /* HERO */
        .career-hero {
          background: #0f172a; color: white; padding: 80px 16px 100px;
          position: relative; overflow: hidden; text-align: center;
          border-bottom-left-radius: 40px; border-bottom-right-radius: 40px;
        }
        .highlight { background: linear-gradient(90deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .hero-title { font-size: 3rem; font-weight: 800; margin-bottom: 16px; letter-spacing: -1px; }
        .hero-subtitle { font-size: 1.1rem; opacity: 0.8; max-width: 600px; margin: 0 auto 32px; line-height: 1.6; }
        .hero-pill { 
           display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.1); 
           padding: 6px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; margin-bottom: 24px;
           border: 1px solid rgba(255,255,255,0.15);
        }
        .hero-actions { display: flex; justify-content: center; gap: 12px; flex-wrap: wrap; }
        .search-bar { 
           background: white; padding: 6px 12px; border-radius: 12px; display: flex; align-items: center; 
           width: 100%; max-width: 400px; box-shadow: 0 10px 25px rgba(0,0,0,0.2); 
        }
        .search-bar input { border: none; outline: none; padding: 8px; flex: 1; font-weight: 600; font-size: 0.95rem; }
        .search-icon { color: #64748b; }
        .clear-search { background: none; border: none; color: #94a3b8; cursor: pointer; }
        
        .track-btn {
           background: rgba(255,255,255,0.15); color: white; border: 1px solid rgba(255,255,255,0.2);
           padding: 10px 18px; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 8px;
           transition: 0.2s;
        }
        .track-btn:hover { background: rgba(255,255,255,0.25); transform: translateY(-2px); }

        /* SECTIONS */
        .section { padding: 60px 0; }
        .sec-head h3 { font-size: 1.8rem; font-weight: 800; margin-bottom: 8px; color: #1e293b; }
        .sec-head .sub { color: #64748b; font-size: 1rem; margin-bottom: 40px; }

        /* BENEFITS */
        .benefits-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px; }
        .b-card { background: white; padding: 24px; border-radius: 16px; border: 1px solid #e2e8f0; text-align: center; transition: 0.2s; }
        .b-card:hover { transform: translateY(-4px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .b-icon { font-size: 2rem; color: #3b82f6; margin-bottom: 16px; }
        .b-card h4 { font-size: 1.1rem; font-weight: 700; margin-bottom: 8px; }
        .b-card p { color: #64748b; font-size: 0.9rem; line-height: 1.5; }

        /* MAIN LAYOUT */
        .main-layout { display: flex; gap: 32px; padding-top: 40px; align-items: flex-start; }
        .filters-sidebar { width: 260px; flex-shrink: 0; position: sticky; top: 100px; display: none; }
        @media (min-width: 900px) { .filters-sidebar { display: block; } }
        
        .filter-card { background: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; }
        .filter-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; font-weight: 700; }
        .link-btn { background: none; border: none; color: #3b82f6; font-weight: 600; cursor: pointer; }
        .filter-group { margin-bottom: 20px; }
        .filter-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 700; margin-bottom: 10px; }
        .check-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 0.9rem; color: #475569; cursor: pointer; }
        
        /* JOBS */
        .jobs-section { flex: 1; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .section-header h2 { font-size: 1.5rem; font-weight: 800; color: #1e293b; }
        .sort-box { display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: #64748b; }
        .sort-box select { border: 1px solid #cbd5e1; padding: 4px 8px; border-radius: 6px; }

        .jobs-grid { display: grid; gap: 16px; }
        .job-card-public { background: white; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; transition: 0.2s; display: flex; flex-direction: column; }
        .job-card-public:hover { border-color: #3b82f6; box-shadow: 0 4px 20px rgba(59,130,246,0.1); transform: translateY(-2px); }
        
        .card-body { padding: 20px; flex: 1; }
        .card-top { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
        .company-logo { width: 42px; height: 42px; border-radius: 10px; background: #3b82f6; color: white; display: grid; place-items: center; font-weight: 800; font-size: 1.2rem; }
        .job-title { font-size: 1.1rem; font-weight: 700; color: #0f172a; margin-bottom: 2px; }
        .company-name { font-size: 0.85rem; color: #64748b; font-weight: 500; }
        .type-badge { margin-left: auto; background: #f1f5f9; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 600; color: #475569; white-space: nowrap; }
        
        .tags-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
        .tag { display: inline-flex; align-items: center; gap: 5px; font-size: 0.8rem; background: #f8fafc; padding: 4px 8px; border-radius: 6px; color: #64748b; border: 1px solid #e2e8f0; }
        .job-desc { color: #475569; font-size: 0.9rem; line-height: 1.5; }
        
        .card-footer { padding: 12px 20px; background: #f8fafc; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
        .post-time { font-size: 0.8rem; color: #94a3b8; display: flex; align-items: center; gap: 5px; }
        .apply-btn-sm { background: #0f172a; color: white; padding: 8px 16px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; transition: 0.2s; }
        .apply-btn-sm:hover { background: #1e293b; }

        /* TESTIMONIALS */
        .test-section { background: white; border-top: 1px solid #e2e8f0; }
        .test-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
        .t-card { background: #f8fafc; padding: 24px; border-radius: 16px; position: relative; }
        .quote-icon { color: #cbd5e1; font-size: 1.5rem; margin-bottom: 12px; }
        .t-card p { font-size: 1rem; font-style: italic; color: #334155; margin-bottom: 16px; }
        .t-user { display: flex; align-items: center; gap: 12px; }
        .t-av { width: 40px; height: 40px; border-radius: 50%; background: #94a3b8; display: grid; place-items: center; color: white; font-weight: 700; }
        .t-name { font-weight: 700; font-size: 0.95rem; color: #0f172a; }
        .t-role { font-size: 0.8rem; color: #64748b; }

        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; backdrop-filter: blur(5px); padding: 16px; }
        .modal-box { background: white; width: 100%; max-width: 480px; padding: 24px; border-radius: 20px; box-shadow: 0 20px 50px rgba(0,0,0,0.2); }
        .animate-pop { animation: popIn 0.2s ease-out; }
        @keyframes popIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; }}
        
        .modal-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .modal-head h3 { margin: 0; font-size: 1.25rem; color: #0f172a; }
        .modal-sub { font-size: 0.85rem; color: #64748b; margin-top: 4px; }
        .close-btn { background: none; border: none; font-size: 1.2rem; color: #94a3b8; cursor: pointer; }
        
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 6px; }
        .form-group input { width: 100%; padding: 10px; border-radius: 10px; border: 1px solid #cbd5e1; font-size: 0.95rem; }
        .btn-primary { background: #3b82f6; color: white; border: none; padding: 12px; border-radius: 10px; font-weight: 700; width: 100%; cursor: pointer; font-size: 1rem; }
        .btn-primary:hover { background: #2563eb; }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        
        /* STATUS RESULT */
        .status-result { margin-top: 24px; background: #f1f5f9; padding: 16px; border-radius: 12px; animation: slideDown 0.3s ease; }
        @keyframes slideDown { from { transform: translateY(-10px); opacity: 0; } to { transform: translateY(0); opacity: 1; }}
        
        .st-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; }
        .st-title { font-weight: 700; font-size: 1rem; color: #0f172a; }
        .st-badge { font-size: 0.75rem; padding: 2px 8px; border-radius: 6px; font-weight: 700; text-transform: uppercase; }
        .st-badge.blue { background: #dbeafe; color: #1e40af; }
        .st-badge.warn { background: #fef3c7; color: #92400e; }
        .st-badge.success { background: #dcfce7; color: #166534; }
        .st-badge.danger { background: #fee2e2; color: #991b1b; }
        
        .st-row { display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 8px; }
        .st-lbl { color: #64748b; } .st-val { font-weight: 600; color: #334155; }
        .st-msg { background: white; padding: 10px; border-radius: 8px; font-size: 0.9rem; color: #334155; border: 1px solid #e2e8f0; margin-top: 8px; }
        
        .interview-box { margin-top: 12px; background: #fff7ed; border: 1px solid #ffedd5; padding: 12px; border-radius: 8px; }
        .ib-head { font-weight: 700; color: #c2410c; margin-bottom: 8px; font-size: 0.9rem; }
        .ib-row { font-size: 0.85rem; color: #431407; margin-bottom: 4px; }
        
        @media (max-width: 768px) {
           .hero-title { font-size: 2rem; }
           .main-layout { flex-direction: column; }
           .filters-sidebar { display: none; } /* Could add a mobile filter drawer */
        }
      `}</style>
    </div>
  );
};

export default Careers;

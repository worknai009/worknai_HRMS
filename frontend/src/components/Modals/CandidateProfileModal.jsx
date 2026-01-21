import React from "react";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaIdBadge,
  FaFilePdf,
  FaHistory,
  FaMoneyBillWave,
  FaCalendarAlt,
  FaCircle,
} from "react-icons/fa";
import API from "../../services/api";

const CandidateProfileModal = ({ app, onClose }) => {
  if (!app) return null;

  const getCandidate = (a) => a?.candidateId || a?.candidate || {};
  const getTrackId = (a) =>
    a?.trackId ||
    a?.timeline?.find?.((t) => t?.meta?.trackId)?.meta?.trackId ||
    "";

  // Helper to format currency
  const fmtMoney = (val) => {
    if (!val) return "—";
    return Number(val).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
  };

  const getFileBaseUrl = () => {
    const base = (API?.defaults?.baseURL || "").replace(/\/+$/, "");
    return base.replace(/\/api$/i, "");
  };

  const buildFileUrl = (relPath) => {
    if (!relPath) return "";
    const root = getFileBaseUrl();
    const clean = String(relPath).replace(/^\/+/, "");
    return `${root}/${clean}`;
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const c = getCandidate(app);
  const trackId = getTrackId(app);
  const resumeUrl = buildFileUrl(c?.resumeFile?.url);

  const stageColors = {
    Applied: "blue",
    Screened: "purple",
    "Interview-1": "orange",
    "Interview-2": "orange",
    Offered: "cyan",
    Hired: "green",
    Rejected: "red",
  };
  const themeColor = stageColors[app.stage] || "blue";

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className={`modal fade-in theme-${themeColor}`} onMouseDown={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="modal-header">
          <div className="header-content">
            <div className="avatar">
              {(c?.name || "?").charAt(0).toUpperCase()}
            </div>
            <div className="header-text">
              <h2>{c?.name || "Candidate Profile"}</h2>
              <div className="badges">
                <span className="badge job">{app?.jobId?.title || "Unknown Role"}</span>
                <span className="badge stage">{app.stage || "Applied"}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="close-btn" title="Close">
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="grid-layout">

            {/* LEFT COLUMN: INFO */}
            <div className="column info-col">
              <div className="section-card">
                <h4 className="section-title"><FaUser /> Personal Details</h4>

                <div className="info-list">
                  <div className="info-item">
                    <div className="icon-box"><FaEnvelope /></div>
                    <div>
                      <label>Email</label>
                      <div className="val">{c?.email || "—"}</div>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="icon-box"><FaPhone /></div>
                    <div>
                      <label>Mobile</label>
                      <div className="val">{c?.mobile || "—"}</div>
                    </div>
                  </div>

                  {trackId && (
                    <div className="info-item">
                      <div className="icon-box"><FaIdBadge /></div>
                      <div>
                        <label>Track ID</label>
                        <div className="val mono">{trackId}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="section-card">
                <h4 className="section-title"><FaBriefcase /> Professional</h4>

                <div className="info-grid">
                  <div className="mini-stat">
                    <label>Experience</label>
                    <div className="stat-val">{c?.totalExperience || 0} Yrs</div>
                  </div>
                  <div className="mini-stat">
                    <label>Notice Period</label>
                    <div className="stat-val">{c?.noticePeriodDays || 0} Days</div>
                  </div>
                </div>

                <div className="salary-box">
                  <div className="salary-row">
                    <span>Current CTC</span>
                    <strong>{fmtMoney(c?.currentCTC)}</strong>
                  </div>
                  <div className="salary-row">
                    <span>Expected CTC</span>
                    <strong>{fmtMoney(c?.expectedCTC)}</strong>
                  </div>
                </div>

                <div className="action-area">
                  {resumeUrl ? (
                    <a href={resumeUrl} target="_blank" rel="noreferrer" className="btn-resume">
                      <FaFilePdf /> View Resume
                    </a>
                  ) : (
                    <div className="no-doc">No Resume Available</div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: TIMELINE */}
            <div className="column timeline-col">
              <div className="section-card full-height">
                <h4 className="section-title"><FaHistory /> Application Timeline</h4>

                <div className="timeline-container">
                  {(app.timeline || []).slice().reverse().map((t, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-marker">
                        <div className="line"></div>
                        <div className="dot"><FaCircle /></div>
                      </div>
                      <div className="timeline-content">
                        <div className="t-header">
                          <span className="t-action">{t?.action || "Updated"}</span>
                          <span className="t-date">{fmtDate(t?.at)}</span>
                        </div>
                        {t?.meta && Object.keys(t.meta).length > 0 && (
                          <div className="t-meta">
                            {Object.entries(t.meta).slice(0, 3).map(([k, v]) => (
                              <span key={k} className="meta-tag">
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  <div className="timeline-item start">
                    <div className="timeline-marker">
                      <div className="dot start-dot"><FaCalendarAlt /></div>
                    </div>
                    <div className="timeline-content">
                      <div className="t-header">
                        <span className="t-action">Applied</span>
                        <span className="t-date">{fmtDate(app.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style>{`
        /* VARIABLES */
        .theme-blue { --accent: #3b82f6; --bg-grad: linear-gradient(135deg, #eff6ff, #dbeafe); }
        .theme-purple { --accent: #8b5cf6; --bg-grad: linear-gradient(135deg, #f5f3ff, #ede9fe); }
        .theme-orange { --accent: #f97316; --bg-grad: linear-gradient(135deg, #fff7ed, #ffedd5); }
        .theme-cyan { --accent: #06b6d4; --bg-grad: linear-gradient(135deg, #ecfeff, #cffafe); }
        .theme-green { --accent: #10b981; --bg-grad: linear-gradient(135deg, #ecfdf5, #d1fae5); }
        .theme-red { --accent: #ef4444; --bg-grad: linear-gradient(135deg, #fef2f2, #fee2e2); }

        .overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.65);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; backdrop-filter: blur(8px); padding: 20px;
        }

        .modal {
          background: #fff; width: 100%; max-width: 900px;
          border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          overflow: hidden; max-height: 90vh; display: flex; flex-direction: column;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* HEADER */
        .modal-header {
          background: var(--bg-grad); padding: 24px;
          display: flex; justify-content: space-between; align-items: flex-start;
          border-bottom: 1px solid rgba(0,0,0,0.05);
        }
        .header-content { display: flex; gap: 20px; align-items: center; }
        .avatar {
          width: 64px; height: 64px; border-radius: 20px;
          background: #fff; color: var(--accent);
          font-size: 28px; font-weight: 800;
          display: grid; place-items: center;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }
        .header-text h2 { margin: 0; font-size: 24px; color: #0f172a; font-weight: 800; }
        .badges { display: flex; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
        .badge {
          font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 8px;
          text-transform: uppercase; letter-spacing: 0.5px;
        }
        .badge.job { background: rgba(255,255,255,0.6); color: #475569; border: 1px solid rgba(0,0,0,0.05); }
        .badge.stage { background: var(--accent); color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

        .close-btn {
          background: rgba(255,255,255,0.5); border: none; width: 40px; height: 40px;
          border-radius: 12px; cursor: pointer; color: #64748b;
          display: grid; place-items: center; transition: 0.2s;
        }
        .close-btn:hover { background: #fff; color: #ef4444; transform: rotate(90deg); }

        /* BODY */
        .modal-body { padding: 24px; overflow-y: auto; background: #f8fafc; flex: 1; }
        .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        
        .section-card {
           background: #fff; border-radius: 16px; padding: 20px;
           box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
           border: 1px solid #e2e8f0; margin-bottom: 20px;
        }
        .section-card:last-child { margin-bottom: 0; }
        .full-height { height: 100%; box-sizing: border-box; }

        .section-title {
          margin: 0 0 16px; font-size: 14px; text-transform: uppercase;
          color: #64748b; font-weight: 800; letter-spacing: 0.5px;
          display: flex; align-items: center; gap: 8px;
          border-bottom: 2px solid #f1f5f9; padding-bottom: 8px;
        }

        /* INFO LIST */
        .info-list { display: flex; flex-direction: column; gap: 16px; }
        .info-item { display: flex; align-items: center; gap: 14px; }
        .icon-box {
          width: 36px; height: 36px; border-radius: 10px; background: #f1f5f9;
          color: #64748b; display: grid; place-items: center; font-size: 14px;
        }
        .info-item label { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; display: block; }
        .info-item .val { font-size: 14px; color: #0f172a; font-weight: 600; }
        .val.mono { font-family: monospace; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 13px; }

        /* STATS GRID */
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
        .mini-stat { background: #f8fafc; padding: 10px; border-radius: 12px; border: 1px solid #f1f5f9; text-align: center; }
        .mini-stat label { font-size: 11px; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px; }
        .stat-val { font-size: 15px; color: #0f172a; font-weight: 800; }

        /* SALARY */
        .salary-box { background: linear-gradient(to right, #f8fafc, #fff); border: 1px dashed #cbd5e1; border-radius: 12px; padding: 12px; }
        .salary-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
        .salary-row:last-child { margin-bottom: 0; }
        .salary-row span { color: #64748b; }
        .salary-row strong { color: #0f172a; font-weight: 700; }

        /* ACTIONS */
        .action-area { margin-top: 16px; }
        .btn-resume {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          width: 100%; padding: 12px; background: #0f172a; color: #fff;
          border-radius: 12px; font-weight: 700; text-decoration: none;
          transition: 0.2s; box-sizing: border-box;
        }
        .btn-resume:hover { background: #334155; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); }
        .no-doc { text-align: center; padding: 12px; border: 1px dashed #cbd5e1; border-radius: 12px; color: #94a3b8; font-size: 13px; }

        /* TIMELINE */
        .timeline-container { position: relative; padding-left: 10px; }
        .timeline-item { display: flex; gap: 16px; padding-bottom: 24px; position: relative; }
        .timeline-item:last-child { padding-bottom: 0; }
        
        .timeline-marker { position: relative; display: flex; flex-direction: column; align-items: center; width: 20px; }
        .dot {
          width: 12px; height: 12px; border-radius: 50%; background: #e2e8f0;
          color: white; display: grid; place-items: center; z-index: 2;
          font-size: 0; /* hide icon inside small dots */
        }
        .timeline-item:first-child .dot { background: var(--accent); width: 16px; height: 16px; box-shadow: 0 0 0 4px rgba(0,0,0,0.05); }
        .start-dot { width: 24px; height: 24px; background: #cbd5e1; font-size: 10px; }
        
        .line {
          position: absolute; top: 16px; bottom: -24px; width: 2px; background: #e2e8f0; z-index: 1;
        }
        .timeline-item:last-child .line { display: none; }
        .timeline-item.start .line { display: none; }

        .timeline-content { flex: 1; background: #fff; }
        .t-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .t-action { font-weight: 700; color: #0f172a; font-size: 14px; }
        .t-date { font-size: 11px; color: #94a3b8; font-weight: 600; }
        .t-meta { display: flex; flex-wrap: wrap; gap: 6px; }
        .meta-tag { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 11px; color: #64748b; border: 1px solid #e2e8f0; }

        @media (max-width: 768px) {
          .modal { max-height: 100vh; border-radius: 0; }
          .grid-layout { grid-template-columns: 1fr; }
          .header-text h2 { font-size: 20px; }
          .section-card.full-height { height: auto; }
        }
      `}</style>
    </div>
  );
};

export default CandidateProfileModal;

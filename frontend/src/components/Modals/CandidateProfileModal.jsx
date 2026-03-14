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
        /* VARIABLES - Adjusted for Dark Theme */
        .theme-blue { --accent: #50c8ff; --accent-soft: rgba(80, 200, 255, 0.1); --bg-grad: linear-gradient(135deg, rgba(80, 200, 255, 0.1), rgba(13, 17, 34, 0.9)); }
        .theme-purple { --accent: #a78bfa; --accent-soft: rgba(167, 139, 250, 0.1); --bg-grad: linear-gradient(135deg, rgba(167, 139, 250, 0.1), rgba(13, 17, 34, 0.9)); }
        .theme-orange { --accent: #fb923c; --accent-soft: rgba(251, 146, 60, 0.1); --bg-grad: linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(13, 17, 34, 0.9)); }
        .theme-cyan { --accent: #22d3ee; --accent-soft: rgba(34, 211, 238, 0.1); --bg-grad: linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(13, 17, 34, 0.9)); }
        .theme-green { --accent: #34d399; --accent-soft: rgba(52, 211, 153, 0.1); --bg-grad: linear-gradient(135deg, rgba(52, 211, 153, 0.1), rgba(13, 17, 34, 0.9)); }
        .theme-red { --accent: #f87171; --accent-soft: rgba(248, 113, 113, 0.1); --bg-grad: linear-gradient(135deg, rgba(248, 113, 113, 0.1), rgba(13, 17, 34, 0.9)); }

        .overlay {
          position: fixed; inset: 0; background: rgba(5, 7, 20, 0.85);
          display: flex; align-items: center; justify-content: center;
          z-index: 9999; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 20px;
        }

        .modal {
          background: rgba(13, 17, 34, 0.85); width: 100%; max-width: 900px;
          border-radius: 28px; border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.6);
          overflow: hidden; max-height: 90vh; display: flex; flex-direction: column;
          animation: slideUp 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          color: #fff;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* HEADER */
        .modal-header {
          background: var(--bg-grad); padding: 30px;
          display: flex; justify-content: space-between; align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .header-content { display: flex; gap: 24px; align-items: center; }
        .avatar {
          width: 70px; height: 70px; border-radius: 22px;
          background: var(--accent); color: #fff;
          font-size: 32px; font-weight: 900;
          display: grid; place-items: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        .header-text h2 { 
          margin: 0; font-size: 26px; font-weight: 900;
          background: linear-gradient(90deg, #fff, rgba(255,255,255,0.7));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .badges { display: flex; gap: 10px; margin-top: 10px; flex-wrap: wrap; }
        .badge {
          font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 10px;
          text-transform: uppercase; letter-spacing: 1px;
        }
        .badge.job { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.1); }
        .badge.stage { background: var(--accent); color: #fff; box-shadow: 0 0 20px var(--accent-soft); }

        .close-btn {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); width: 44px; height: 44px;
          border-radius: 14px; cursor: pointer; color: rgba(255,255,255,0.6);
          display: grid; place-items: center; transition: 0.3s;
        }
        .close-btn:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: #ef4444; transform: rotate(90deg); }

        /* BODY */
        .modal-body { padding: 30px; overflow-y: auto; background: transparent; flex: 1; }
        .grid-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        
        .section-card {
           background: rgba(255, 255, 255, 0.03); border-radius: 20px; padding: 24px;
           border: 1px solid rgba(255, 255, 255, 0.08); margin-bottom: 24px;
           backdrop-filter: blur(10px);
        }
        .section-card:last-child { margin-bottom: 0; }
        .full-height { height: 100%; box-sizing: border-box; }

        .section-title {
          margin: 0 0 20px; font-size: 12px; text-transform: uppercase;
          color: rgba(255,255,255,0.5); font-weight: 900; letter-spacing: 1.5px;
          display: flex; align-items: center; gap: 10px;
          border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 12px;
        }
        .section-title svg { color: var(--accent); font-size: 14px; }

        /* INFO LIST */
        .info-list { display: flex; flex-direction: column; gap: 18px; }
        .info-item { display: flex; align-items: center; gap: 16px; }
        .icon-box {
          width: 40px; height: 40px; border-radius: 12px; background: rgba(255, 255, 255, 0.05);
          color: var(--accent); display: grid; place-items: center; font-size: 16px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .info-item label { font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 800; text-transform: uppercase; display: block; letter-spacing: 0.5px; }
        .info-item .val { font-size: 15px; color: #fff; font-weight: 700; margin-top: 2px; }
        .val.mono { font-family: 'JetBrains Mono', monospace; color: var(--accent); background: rgba(80, 200, 255, 0.05); padding: 4px 10px; border-radius: 8px; font-size: 14px; border: 1px solid rgba(80, 200, 255, 0.1); }

        /* STATS GRID */
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
        .mini-stat { background: rgba(255, 255, 255, 0.02); padding: 14px; border-radius: 16px; border: 1px solid rgba(255, 255, 255, 0.05); text-align: center; }
        .mini-stat label { font-size: 10px; color: rgba(255,255,255,0.4); font-weight: 800; display: block; margin-bottom: 6px; text-transform: uppercase; }
        .stat-val { font-size: 18px; color: #fff; font-weight: 900; }

        /* SALARY */
        .salary-box { background: rgba(255, 255, 255, 0.02); border: 1px dashed rgba(255, 255, 255, 0.15); border-radius: 16px; padding: 16px; }
        .salary-row { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
        .salary-row:last-child { margin-bottom: 0; }
        .salary-row span { color: rgba(255,255,255,0.5); font-weight: 600; }
        .salary-row strong { color: #fff; font-weight: 800; }

        /* ACTIONS */
        .action-area { margin-top: 20px; }
        .btn-resume {
          display: flex; align-items: center; justify-content: center; gap: 12px;
          width: 100%; padding: 16px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: #fff;
          border-radius: 16px; font-weight: 800; text-decoration: none;
          transition: 0.3s; box-sizing: border-box; box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
        }
        .btn-resume:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(59, 130, 246, 0.5); filter: brightness(1.1); }
        .no-doc { text-align: center; padding: 16px; border: 1px dashed rgba(255,255,255,0.15); border-radius: 16px; color: rgba(255,255,255,0.3); font-size: 14px; font-weight: 600; }

        /* TIMELINE */
        .timeline-container { position: relative; padding-left: 15px; }
        .timeline-item { display: flex; gap: 20px; padding-bottom: 28px; position: relative; }
        .timeline-item:last-child { padding-bottom: 0; }
        
        .timeline-marker { position: relative; display: flex; flex-direction: column; align-items: center; width: 24px; }
        .dot {
          width: 12px; height: 12px; border-radius: 50%; background: rgba(255, 255, 255, 0.1);
          color: white; display: grid; place-items: center; z-index: 2;
          font-size: 0; 
        }
        .timeline-item:first-child .dot { background: var(--accent); width: 16px; height: 16px; box-shadow: 0 0 20px var(--accent-soft); }
        .start-dot { width: 28px; height: 28px; background: rgba(255, 255, 255, 0.05); font-size: 12px; border: 1px solid rgba(255, 255, 255, 0.1); }
        
        .line {
          position: absolute; top: 16px; bottom: -28px; width: 2px; background: rgba(255, 255, 255, 0.08); z-index: 1;
        }
        .timeline-item:last-child .line { display: none; }
        .timeline-item.start .line { display: none; }

        .timeline-content { flex: 1; }
        .t-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
        .t-action { font-weight: 800; color: #fff; font-size: 15px; }
        .t-date { font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 700; text-transform: uppercase; }
        .t-meta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
        .meta-tag { background: rgba(255,255,255,0.03); padding: 4px 10px; border-radius: 8px; font-size: 11px; color: rgba(255,255,255,0.6); border: 1px solid rgba(255,255,255,0.08); font-weight: 600; }

        @media (max-width: 768px) {
          .overlay { padding: 0; }
          .modal { 
            height: 100vh; max-height: 100vh; border-radius: 0; 
            border: none;
          }
          .grid-layout { grid-template-columns: 1fr; }
          .modal-header { padding: 20px; flex-direction: column; position: relative; gap: 16px; }
          .header-content { flex-direction: column; align-items: flex-start; text-align: left; }
          .header-text h2 { font-size: 22px; }
          .close-btn { position: absolute; top: 16px; right: 20px; }
          .badges { margin-top: 8px; }
        }
      `}</style>
    </div>
  );
};

export default CandidateProfileModal;

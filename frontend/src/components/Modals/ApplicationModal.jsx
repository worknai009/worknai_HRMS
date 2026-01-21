import React, { useMemo, useRef, useState } from "react";
import {
  FaTimes,
  FaFileUpload,
  FaPaperPlane,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaTrash,
  FaCopy,
  FaArrowRight,
} from "react-icons/fa";
import { toast } from "react-toastify";
import API from "../../services/api";

const bytesToSize = (bytes = 0) => {
  const b = Number(bytes || 0);
  if (!Number.isFinite(b) || b <= 0) return "0 KB";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(b) / Math.log(1024)), sizes.length - 1);
  const v = b / Math.pow(1024, i);
  return `${v.toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const isPdfOrDoc = (file) => {
  if (!file) return false;
  const name = String(file.name || "").toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".doc") || name.endsWith(".docx");
};

const safeCopy = async (text) => {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (_) { }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  } catch (_) {
    return false;
  }
};

const ApplicationModal = ({ job, onClose, onApplied }) => {
  const fileRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ✅ success state (Track ID visible inside modal)
  const [submitted, setSubmitted] = useState(null); // { trackId, email }

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    totalExperience: "",
    currentCTC: "",
    expectedCTC: "",
    noticePeriodDays: "",
    file: null,
  });

  const companyName = useMemo(() => {
    if (job?.companyId && typeof job.companyId === "object")
      return job.companyId?.name || job.companyId?.companyName || "Company";
    return job?.companyName || "Company";
  }, [job]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const setFile = (file) => {
    if (!file) return;
    if (!isPdfOrDoc(file)) return toast.warning("Resume must be PDF / DOC / DOCX");
    if (Number(file.size || 0) > 8 * 1024 * 1024) return toast.warning("Resume file must be under 8MB");
    setFormData((p) => ({ ...p, file }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name?.trim()) return toast.warning("Enter your name");
    if (!formData.email?.trim()) return toast.warning("Enter your email");
    if (!formData.mobile?.trim()) return toast.warning("Enter your mobile");
    if (!String(formData.totalExperience || "").trim()) return toast.warning("Enter total experience");
    if (!formData.file) return toast.warning("Please upload your resume");

    setLoading(true);

    const data = new FormData();
    data.append("jobId", job?._id);

    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("mobile", formData.mobile);
    data.append("passingYear", formData.passingYear || "");

    data.append("totalExperience", formData.totalExperience);
    data.append("currentCTC", formData.currentCTC);
    data.append("expectedCTC", formData.expectedCTC);
    data.append("noticePeriodDays", formData.noticePeriodDays);

    data.append("files", formData.file);

    try {
      const res = await API.post("/recruitment/public/apply", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const trackId = res.data?.trackId || res.data?.applicationId;

      // ✅ show inside modal
      const payload = { trackId, email: formData.email };
      setSubmitted(payload);

      // ✅ store for Track modal autofill
      try {
        localStorage.setItem("last_application_track", JSON.stringify(payload));
      } catch (_) { }

      // toast also (optional)
      toast.success(
        <div style={{ lineHeight: 1.35 }}>
          <div style={{ fontWeight: 900, fontSize: 14 }}>Application Submitted ✅</div>
          <div style={{ marginTop: 6 }}>
            <span style={{ opacity: 0.8 }}>Track ID:</span>{" "}
            <b style={{ letterSpacing: 0.3 }}>{trackId}</b>
          </div>
          <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
            Track ID saved on this device.
          </div>
        </div>,
        { autoClose: 8000 }
      );
    } catch (error) {
      console.error("Apply Error:", error);
      toast.error(error.response?.data?.message || "Failed to apply. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const closeAll = () => {
    setSubmitted(null);
    onClose?.();
  };

  return (
    <div
      className="app-modal-overlay"
      onMouseDown={(e) => {
        if (e.target?.classList?.contains("app-modal-overlay")) closeAll();
      }}
    >
      <div className="app-modal animate-pop" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <div className="brand-line">
              <span className="dot" />
              <span className="brand">{companyName}</span>
              <span className="sep">•</span>
              <span className="role">{job?.title || "Job"}</span>
            </div>
            <h3>{submitted ? "Application Submitted" : "Apply Now"}</h3>
            <p className="sub-text">
              {submitted
                ? "Save your Track ID. You can track status anytime."
                : "Fill details and upload your resume. We’ll get back to you if you match the role."}
            </p>
          </div>
          <button onClick={closeAll} className="close-btn" aria-label="Close">
            <FaTimes />
          </button>
        </div>

        {/* ✅ SUCCESS VIEW */}
        {submitted ? (
          <div className="success-wrap">
            <div className="success-card">
              <div className="ok-badge">
                <FaCheckCircle /> Submitted
              </div>

              <div className="track-block">
                <div className="track-label">Your Track ID</div>
                <div className="track-id">{submitted.trackId}</div>

                <div className="track-actions">
                  <button
                    type="button"
                    className="btn-soft"
                    onClick={async () => {
                      const ok = await safeCopy(submitted.trackId);
                      if (ok) toast.success("Track ID copied ✅");
                      else toast.error("Copy failed");
                    }}
                  >
                    <FaCopy /> Copy
                  </button>

                  <button
                    type="button"
                    className="btn-primary"
                    onClick={() => {
                      // ✅ open Track modal on Careers page
                      onApplied?.(submitted);
                      onClose?.();
                    }}
                  >
                    Track Status <FaArrowRight />
                  </button>
                </div>

                <div className="mini-note">
                  Email: <b>{submitted.email}</b>
                </div>
              </div>

              <button type="button" className="btn-outline" onClick={closeAll}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="app-form">
            <div className="section-title">
              <FaCheckCircle />
              <span>Basic Details</span>
            </div>

            <div className="form-grid">
              <div className="input-group">
                <FaUser className="icon" />
                <input
                  name="name"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>

              <div className="input-group">
                <FaEnvelope className="icon" />
                <input
                  name="email"
                  type="email"
                  placeholder="Email Address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                />
              </div>

              <div className="input-group">
                <FaPhone className="icon" />
                <input
                  name="mobile"
                  placeholder="Phone Number"
                  required
                  value={formData.mobile}
                  onChange={handleChange}
                  autoComplete="tel"
                />
              </div>

              <div className="input-group">
                <FaBriefcase className="icon" />
                <input
                  name="totalExperience"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Total Experience (Years)"
                  required
                  value={formData.totalExperience}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 16 }}>
              <FaCheckCircle />
              <span>Compensation & Notice</span>
            </div>

            <div className="form-row-3">
              <div className="input-group">
                <FaMoneyBillWave className="icon" />
                <input
                  name="currentCTC"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Current CTC (LPA)"
                  value={formData.currentCTC}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <FaMoneyBillWave className="icon" />
                <input
                  name="expectedCTC"
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Expected CTC (LPA)"
                  value={formData.expectedCTC}
                  onChange={handleChange}
                />
              </div>
              <div className="input-group">
                <FaClock className="icon" />
                <input
                  name="noticePeriodDays"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Notice Period (Days)"
                  value={formData.noticePeriodDays}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="section-title" style={{ marginTop: 16 }}>
              <FaCheckCircle />
              <span>Resume</span>
            </div>

            <div
              className={`file-upload-box ${dragOver ? "drag" : ""}`}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              {!formData.file ? (
                <>
                  <div className="upload-icon-wrap">
                    <FaFileUpload size={22} />
                  </div>
                  <div className="upload-text">
                    <div className="big">Drop your resume here</div>
                    <div className="small">or click to upload (PDF/DOC/DOCX, up to 8MB)</div>
                  </div>
                </>
              ) : (
                <div className="file-chip">
                  <div className="file-left">
                    <div className="file-badge">CV</div>
                    <div>
                      <div className="file-name">{formData.file.name}</div>
                      <div className="file-meta">{bytesToSize(formData.file.size)}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="file-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFormData((p) => ({ ...p, file: null }));
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                    title="Remove"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.doc,.docx"
                hidden
                onChange={handleFileChange}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" />
                  Submitting...
                </span>
              ) : (
                <>
                  Submit Application <FaPaperPlane />
                </>
              )}
            </button>

            <div className="privacy-note">
              By submitting, you agree to share your information for recruitment processing.
            </div>
          </form>
        )}
      </div>

      <style>{`
        .app-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(2, 6, 23, 0.72);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000;
          padding: 18px;
          backdrop-filter: blur(10px);
        }

        .app-modal {
          width: 100%;
          max-width: 740px;
          background: rgba(255,255,255,0.92);
          border: 1px solid rgba(255,255,255,0.35);
          border-radius: 22px;
          padding: 26px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.35);
          overflow: hidden;
          position: relative;
        }

        .app-modal::before{
          content:"";
          position:absolute; inset:-120px;
          background: radial-gradient(circle at 20% 10%, rgba(56,189,248,0.35), transparent 55%),
                      radial-gradient(circle at 85% 30%, rgba(129,140,248,0.30), transparent 55%),
                      radial-gradient(circle at 30% 95%, rgba(16,185,129,0.18), transparent 55%);
          filter: blur(18px);
          z-index: 0;
        }

        .modal-head { position: relative; z-index: 1; display:flex; justify-content:space-between; gap:14px; padding-bottom: 14px; border-bottom: 1px solid rgba(15,23,42,0.08); }
        .modal-head h3 { margin: 10px 0 6px; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.3px; }
        .sub-text { margin: 0; color:#475569; font-size: 13px; font-weight: 600; max-width: 520px; }

        .brand-line{ display:flex; align-items:center; gap:10px; font-size: 12px; font-weight: 800; color:#334155; }
        .dot{ width:10px; height:10px; border-radius:50%; background: linear-gradient(135deg, #38bdf8, #818cf8); box-shadow: 0 8px 18px rgba(59,130,246,0.25); }
        .brand{ padding: 6px 10px; border-radius: 999px; background: rgba(15,23,42,0.06); }
        .sep{ opacity:0.6; }
        .role{ opacity:0.9; }

        .close-btn {
          position: relative; z-index: 2;
          width: 42px; height: 42px;
          border-radius: 14px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.75);
          cursor: pointer;
          color: #334155;
          display:grid; place-items:center;
          transition: 0.18s ease;
        }
        .close-btn:hover { transform: translateY(-1px); background: white; border-color: rgba(59,130,246,0.25); color: #0f172a; }

        .app-form{ position: relative; z-index: 1; margin-top: 16px; }

        .section-title{
          display:flex; align-items:center; gap:10px;
          font-weight: 900;
          color:#0f172a;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.9px;
          opacity: 0.9;
          margin: 12px 0;
        }
        .section-title svg{ color:#3b82f6; }

        .form-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .form-row-3 { display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

        .input-group { position: relative; }
        .input-group .icon {
          position:absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          font-size: 14px;
        }
        .input-group input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid rgba(15,23,42,0.12);
          border-radius: 14px;
          outline: none;
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          background: rgba(255,255,255,0.75);
          transition: 0.18s ease;
          box-sizing: border-box;
        }
        .input-group input::placeholder{ color:#94a3b8; font-weight: 700; }
        .input-group input:focus{
          border-color: rgba(59,130,246,0.55);
          box-shadow: 0 0 0 4px rgba(59,130,246,0.12);
          background: white;
        }

        .file-upload-box{
          border: 1.5px dashed rgba(15,23,42,0.20);
          border-radius: 18px;
          padding: 16px;
          background: rgba(255,255,255,0.68);
          cursor: pointer;
          transition: 0.2s ease;
          display:flex; gap: 12px; align-items: center;
        }
        .file-upload-box:hover{
          border-color: rgba(59,130,246,0.65);
          transform: translateY(-1px);
          box-shadow: 0 10px 22px rgba(2,6,23,0.08);
          background: rgba(255,255,255,0.9);
        }
        .file-upload-box.drag{
          border-color: rgba(16,185,129,0.85);
          box-shadow: 0 0 0 5px rgba(16,185,129,0.12);
        }
        .upload-icon-wrap{
          width: 44px; height: 44px;
          border-radius: 16px;
          display:grid; place-items:center;
          background: linear-gradient(135deg, rgba(56,189,248,0.22), rgba(129,140,248,0.18));
          border: 1px solid rgba(59,130,246,0.18);
          color: #2563eb;
        }
        .upload-text .big{ font-weight: 900; color:#0f172a; }
        .upload-text .small{ font-size: 12px; color:#64748b; font-weight: 700; margin-top: 3px; }

        .file-chip{
          width:100%;
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 16px;
          border: 1px solid rgba(15,23,42,0.10);
          background: rgba(255,255,255,0.88);
        }
        .file-left{ display:flex; align-items:center; gap: 10px; }
        .file-badge{
          width: 44px; height: 44px;
          border-radius: 16px;
          display:grid; place-items:center;
          font-weight: 1000;
          color: white;
          background: linear-gradient(135deg, #0f172a, #334155);
          box-shadow: 0 12px 20px rgba(2,6,23,0.20);
        }
        .file-name{ font-weight: 900; color:#0f172a; max-width: 460px; overflow:hidden; text-overflow: ellipsis; white-space: nowrap; }
        .file-meta{ font-size: 12px; color:#64748b; font-weight: 800; }

        .file-remove{
          width: 40px; height: 40px;
          border-radius: 14px;
          border: 1px solid rgba(239,68,68,0.25);
          background: rgba(254,226,226,0.6);
          color: #b91c1c;
          cursor:pointer;
          display:grid; place-items:center;
          transition: 0.18s ease;
        }
        .file-remove:hover{ background: rgba(254,226,226,0.95); transform: translateY(-1px); }

        .submit-btn{
          width: 100%;
          margin-top: 14px;
          padding: 14px 16px;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          font-weight: 1000;
          font-size: 15px;
          color: white;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #2563eb 140%);
          box-shadow: 0 14px 30px rgba(2,6,23,0.18);
          display:flex; align-items:center; justify-content:center; gap: 10px;
          transition: 0.18s ease;
        }
        .submit-btn:hover{ transform: translateY(-2px); box-shadow: 0 18px 42px rgba(2,6,23,0.24); }
        .submit-btn:disabled{ opacity: 0.75; cursor: not-allowed; transform:none; }

        .btn-loading{ display:flex; align-items:center; gap: 10px; }
        .spinner{
          width: 16px; height:16px; border-radius:50%;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: rgba(255,255,255,0.95);
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin{ to { transform: rotate(360deg); } }

        .privacy-note{
          margin-top: 10px;
          font-size: 12px;
          color: #64748b;
          font-weight: 700;
          text-align: center;
        }

        /* SUCCESS UI */
        .success-wrap{ position: relative; z-index: 1; margin-top: 16px; }
        .success-card{
          background: rgba(255,255,255,0.85);
          border: 1px solid rgba(15,23,42,0.08);
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 14px 30px rgba(2,6,23,0.08);
        }
        .ok-badge{
          display:inline-flex; align-items:center; gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(16,185,129,0.12);
          border: 1px solid rgba(16,185,129,0.20);
          color: #15803d;
          font-weight: 1000;
          font-size: 12px;
        }
        .track-block{ margin-top: 14px; }
        .track-label{ font-size: 12px; font-weight: 1000; color:#334155; text-transform: uppercase; letter-spacing: 0.8px; }
        .track-id{
          margin-top: 8px;
          padding: 12px 14px;
          border-radius: 16px;
          background: rgba(15,23,42,0.06);
          border: 1px solid rgba(15,23,42,0.10);
          font-weight: 1000;
          font-size: 18px;
          letter-spacing: 0.6px;
          color: #0f172a;
          text-align:center;
        }
        .track-actions{
          margin-top: 12px;
          display:flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .btn-soft{
          padding: 10px 14px;
          border-radius: 14px;
          border: 1px solid rgba(15,23,42,0.12);
          background: rgba(255,255,255,0.85);
          font-weight: 1000;
          cursor:pointer;
          display:flex; align-items:center; gap: 10px;
        }
        .btn-soft:hover{ transform: translateY(-1px); }
        .btn-primary{
          padding: 10px 14px;
          border-radius: 14px;
          border:none;
          color: white;
          font-weight: 1000;
          cursor:pointer;
          display:flex; align-items:center; gap: 10px;
          background: linear-gradient(135deg, #0f172a, #1e293b 60%, #2563eb 150%);
          box-shadow: 0 14px 26px rgba(2,6,23,0.16);
        }
        .btn-primary:hover{ transform: translateY(-1px); }
        .btn-outline{
          width:100%;
          margin-top: 14px;
          padding: 11px 14px;
          border-radius: 14px;
          border: 1px solid rgba(15,23,42,0.14);
          background: white;
          font-weight: 1000;
          cursor:pointer;
        }
        .mini-note{ margin-top: 10px; font-size: 12px; color:#64748b; font-weight: 800; text-align:center; }

        .animate-pop { animation: popUp 0.26s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes popUp { from { opacity: 0; transform: translateY(10px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }

        @media (max-width: 780px){
          .app-modal{ padding: 18px; }
          .form-grid{ grid-template-columns: 1fr; }
          .form-row-3{ grid-template-columns: 1fr; }
          .file-name{ max-width: 220px; }
        }
      `}</style>
    </div>
  );
};

export default ApplicationModal;

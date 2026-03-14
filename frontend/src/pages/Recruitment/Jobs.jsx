import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import { toast } from "react-toastify";
import {
  FaBriefcase, FaMapMarkerAlt, FaPlus, FaEdit, FaTrash,
  FaShareAlt, FaTimes, FaGlobe, FaRupeeSign, FaClock, FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";

import Pagination from "../../components/Pagination";

const Jobs = () => {
  const { user } = useAuth();
  const isHR = ["Admin", "CompanyAdmin", "SuperAdmin"].includes(user?.role);

  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);

  const [form, setForm] = useState({
    title: "", department: "", location: "",
    employmentType: "Full-time", openings: 1,
    description: "", status: "Open",
    experience: "Fresher", passingYear: "", salaryRange: ""
  });

  const pager = useClientPagination(jobs);
  const { paginatedItems } = pager;

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await API.get("/recruitment/jobs");
      setJobs(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await API.put(`/recruitment/job/${editingJob._id}`, form);
        toast.success("Job Updated ✅");
      } else {
        await API.post("/recruitment/job", form);
        toast.success("Job Created 🚀");
      }
      setShowModal(false);
      setEditingJob(null);
      resetForm();
      fetchJobs();
    } catch (e) {
      toast.error(e.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try { await API.delete(`/recruitment/job/${id}`); toast.success("Deleted"); fetchJobs(); } catch (e) { toast.error("Delete failed"); }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setForm({
      title: job.title, department: job.department, location: job.location,
      employmentType: job.employmentType, openings: job.openings,
      description: job.description, status: job.status,
      experience: job.experience || "Fresher",
      passingYear: job.passingYear || "",
      salaryRange: job.salaryRange || ""
    });
    setShowModal(true);
  };

  const handleShare = (job) => {
    const url = `${window.location.origin}/careers/${user.companyId}?jobId=${job._id}`;
    navigator.clipboard.writeText(url);
    toast.info("Link Copied! 📋");
  };

  const resetForm = () => {
    setForm({ title: "", department: "", location: "", employmentType: "Full-time", openings: 1, description: "", status: "Open", experience: "Fresher", passingYear: "", salaryRange: "" });
  };

  return (
    <div className="page-container page-anim">
      <div className="header">
        <div>
          <h2>Job Openings</h2>
          <p>Manage recruitment posts. Active jobs appear on the Career Page.</p>
        </div>
        {isHR && (
          <button className="btn-primary" onClick={() => { setEditingJob(null); resetForm(); setShowModal(true); }}>
            <FaPlus /> Post New Job
          </button>
        )}
      </div>

      {loading ? (
        <div className="loader">Loading jobs...</div>
      ) : paginatedItems.length === 0 ? (
        <div className="empty-state">No jobs posted yet.</div>
      ) : (
        <div className="job-grid">
          {paginatedItems.map((job) => (
            <div key={job._id} className={`job-card ${job.status === 'Closed' ? 'closed' : ''}`}>
              <div className="card-top">
                <div>
                  <span className={`badge ${job.status.toLowerCase()}`}>
                    {job.status === 'Open' && <FaGlobe />} {job.status}
                  </span>
                  <h3 className="job-title">{job.title}</h3>
                  <div className="job-meta">
                    <span><FaBriefcase /> {job.department || "General"}</span>
                    <span><FaMapMarkerAlt /> {job.location || "Remote"}</span>
                  </div>
                </div>
                {isHR && (
                  <div className="menu-actions">
                    <button onClick={() => handleEdit(job)} className="icon-btn edit"><FaEdit /></button>
                    <button onClick={() => handleDelete(job._id)} className="icon-btn delete"><FaTrash /></button>
                  </div>
                )}
              </div>

              <div className="card-body">
                <div className="mini-tags">
                  <span><FaClock /> {job.experience}</span>
                  {job.salaryRange && <span><FaRupeeSign /> {job.salaryRange}</span>}
                </div>
                <p>{(job.description || "").substring(0, 80)}...</p>
                <div className="stats-row">
                  <div className="stat"><span className="label">Openings</span><span className="val">{job.openings}</span></div>
                  <div className="stat"><span className="label">Type</span><span className="val">{job.employmentType}</span></div>
                </div>
              </div>

              <div className="card-foot">
                <button onClick={() => handleShare(job)} className="btn-outline"><FaShareAlt /> Copy Apply Link</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {!loading && jobs.length > 0 && (
        <Pagination pager={pager} />
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box animate-pop">
            <div className="modal-head">
              <h3>{editingJob ? "Edit Job" : "Post New Job"}</h3>
              <button onClick={() => setShowModal(false)} className="close-btn"><FaTimes /></button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Job Title</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior React Dev" />
              </div>
              <div className="form-row">
                <div className="form-group"><label>Department</label><input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
                <div className="form-group"><label>Type</label><select value={form.employmentType} onChange={e => setForm({ ...form, employmentType: e.target.value })}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Intern</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Experience</label><input value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 0-2 Years" /></div>
                <div className="form-group"><label>Salary Range</label><input value={form.salaryRange} onChange={e => setForm({ ...form, salaryRange: e.target.value })} placeholder="e.g. 5-8 LPA" /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Passing Year</label><input value={form.passingYear} onChange={e => setForm({ ...form, passingYear: e.target.value })} /></div>
                <div className="form-group"><label>Openings</label><input type="number" min="1" value={form.openings} onChange={e => setForm({ ...form, openings: e.target.value })} /></div>
              </div>
              <div className="form-group"><label>Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
              <div className="form-group"><label>Description</label><textarea rows="4" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              {editingJob && (
                <div className="form-group"><label>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="Open">Open</option><option value="Closed">Closed</option></select></div>
              )}
              <button type="submit" className="btn-primary full-width">{editingJob ? "Update Job" : "Post Job"}</button>
            </form>
          </div>
        </div>
      )}
      <style>{`
        :root {
          --brand-grad: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          --text-dim: rgba(255, 255, 255, 0.5);
          --border-glass: rgba(255, 255, 255, 0.08);
        }

        .page-container { 
          padding: 30px; 
          max-width: 1400px; 
          margin: 0 auto; 
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background: radial-gradient(circle at 50% 50%, #0f172a, #050714);
          color: #fff;
        }
        .page-anim { animation: fadeIn 0.4s ease-out; }
        
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 40px; 
          flex-wrap: wrap; 
          gap: 20px;
          padding: 24px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-glass);
          border-radius: 24px;
          backdrop-filter: blur(10px);
        }
        .header h2 { 
          margin: 0; 
          font-size: 2rem; 
          font-weight: 900;
          background: var(--brand-grad);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -1px;
        }
        .header p { 
          margin: 8px 0 0; 
          color: var(--text-dim); 
          font-size: 0.95rem; 
          font-weight: 500;
        }
        
        .btn-primary { 
          background: var(--brand-grad); 
          color: white; 
          padding: 16px 32px; 
          height: 54px;
          border-radius: 18px; 
          border: none; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          gap: 12px; 
          font-weight: 950; 
          transition: 0.3s cubic-bezier(0.165, 0.84, 0.44, 1); 
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
          text-transform: uppercase;
          font-size: 1rem;
          letter-spacing: 1px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }
        .btn-primary:hover { 
          transform: translateY(-3px); 
          box-shadow: 0 15px 35px rgba(139, 92, 246, 0.5);
          filter: brightness(1.1);
        }

        .btn-outline { 
          background: rgba(255, 255, 255, 0.05); 
          border: 1px solid var(--border-glass); 
          color: #fff; 
          padding: 12px; 
          border-radius: 14px; 
          cursor: pointer; 
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-size: 13px; 
          font-weight: 700; 
          width: 100%; 
          justify-content: center; 
          transition: 0.3s; 
        }
        .btn-outline:hover { 
          background: rgba(80, 200, 255, 0.1); 
          border-color: #50c8ff; 
          color: #50c8ff;
        }

        .job-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); 
          gap: 24px; 
        }
        .job-card { 
          background: rgba(13, 17, 34, 0.6); 
          border: 1px solid var(--border-glass); 
          border-radius: 28px; 
          padding: 30px; 
          display: flex; 
          flex-direction: column; 
          transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); 
          position: relative; 
          backdrop-filter: blur(20px);
        }
        .job-card:hover { 
          transform: translateY(-8px); 
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4); 
          border-color: rgba(80, 200, 255, 0.3); 
        }
        .job-card.closed { opacity: 0.6; grayscale: 50%; }

        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
        .job-title { 
          margin: 12px 0; 
          font-size: 1.4rem; 
          color: #fff; 
          font-weight: 800; 
          letter-spacing: -0.5px;
        }
        .job-meta { display: flex; gap: 16px; font-size: 13px; color: var(--text-dim); font-weight: 600; }
        .badge { 
          font-size: 10px; 
          padding: 5px 12px; 
          border-radius: 100px; 
          font-weight: 900; 
          text-transform: uppercase; 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          letter-spacing: 1px;
        }
        .badge.open { background: rgba(34, 197, 94, 0.1); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.2); }
        .badge.closed { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }
        
        .mini-tags { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
        .mini-tags span { 
          display: inline-flex; 
          align-items: center; 
          gap: 6px; 
          font-size: 11px; 
          font-weight: 800; 
          color: #50c8ff; 
          background: rgba(80, 200, 255, 0.05); 
          padding: 6px 14px; 
          border-radius: 100px; 
          text-transform: uppercase;
        }
        
        .card-body { flex: 1; margin-bottom: 24px; }
        .card-body p { color: var(--text-dim); line-height: 1.6; font-size: 0.95rem; }
        
        .stats-row { 
          display: flex; 
          gap: 24px; 
          border-top: 1px solid var(--border-glass); 
          padding-top: 20px; 
          margin-top: 15px;
        }
        .stat { display: flex; flex-direction: column; gap: 4px; }
        .stat .label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 900; letter-spacing: 1px; }
        .stat .val { font-size: 0.95rem; font-weight: 700; color: #fff; }

        .menu-actions { display: flex; gap: 10px; }
        .icon-btn { 
          width: 38px; 
          height: 38px; 
          border-radius: 12px; 
          border: 1px solid var(--border-glass); 
          background: rgba(255, 255, 255, 0.03); 
          cursor: pointer; 
          color: var(--text-dim); 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transition: 0.3s; 
        }
        .icon-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; transform: rotate(15deg); }
        .icon-btn.edit:hover { background: rgba(34, 197, 94, 0.1); color: #4ade80; border-color: #4ade80; }
        .icon-btn.delete:hover { background: rgba(239, 68, 68, 0.15); color: #f87171; border-color: #f87171; }

        .modal-overlay { 
          position: fixed; inset: 0; background: rgba(5, 7, 20, 0.85); 
          display: flex; align-items: flex-start; justify-content: center; 
          z-index: 1000; padding: 40px 10px; backdrop-filter: blur(12px); 
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }
        .modal-box { 
          background: rgba(13, 17, 34, 0.95); 
          width: 95%; max-width: 580px; 
          padding: 0; 
          border-radius: 28px; 
          box-shadow: 0 50px 100px rgba(0, 0, 0, 0.6); 
          border: 1px solid var(--border-glass);
          overflow: hidden;
          margin: auto;
        }
        .modal-head { 
          display: flex; justify-content: space-between; align-items: center; 
          padding: 24px 30px;
          border-bottom: 1px solid var(--border-glass);
          background: rgba(255, 255, 255, 0.02);
        }
        .modal-head h3 { 
          margin: 0; font-size: 1.25rem; font-weight: 900; 
          background: var(--brand-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .close-btn { 
          width: 34px; height: 34px; border-radius: 50%; 
          background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass);
          cursor: pointer; color: #fff; display: flex; align-items: center; justify-content: center; 
          transition: 0.3s;
        }
        .close-btn:hover { transform: rotate(90deg); color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        
        form { padding: 30px; }
        .form-group { margin-bottom: 24px; display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 11px; font-weight: 900; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
        .form-group input, .form-group select, .form-group textarea { 
          width: 100%; 
          padding: 14px 18px; 
          background: rgba(255, 255, 255, 0.03); 
          border: 1px solid var(--border-glass); 
          border-radius: 14px; 
          font-size: 14px; 
          color: #fff;
          font-weight: 600;
          box-sizing: border-box; 
          transition: 0.3s;
        }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { 
          outline: none; border-color: #50c8ff; background: rgba(80, 200, 255, 0.05); 
        }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        
        .full-width { width: 100%; margin-top: 10px; }
        .loader { 
          display: flex; align-items: center; justify-content: center; height: 300px;
          font-size: 1.1rem; font-weight: 700; color: #50c8ff;
        }
        .empty-state { 
          text-align: center; padding: 100px 40px; 
          color: var(--text-dim); border: 2px dashed var(--border-glass); 
          border-radius: 28px; margin-top: 20px; 
          background: rgba(255, 255, 255, 0.01); 
        }

        @media (max-width: 768px) {
          .job-grid { grid-template-columns: 1fr; }
          .header { flex-direction: column; align-items: stretch; text-align: center; }
          .btn-primary { justify-content: center; }
        }

        @media (max-width: 640px) {
          .form-row { grid-template-columns: 1fr; gap: 0; }
          .page-container { padding: 15px; }
          .job-card { padding: 20px; }
        }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
        .animate-pop { animation: popIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1); }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

        /* Pagination overrides */
        .pagination-container { margin-top: 40px; justify-content: center; gap: 10px; }
        .page-btn { 
          background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-glass);
          color: #fff; width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; transition: 0.3s;
        }
        .page-btn:hover { background: rgba(80, 200, 255, 0.1); border-color: #50c8ff; }
        .page-btn.active { background: var(--brand-grad); border: none; font-weight: 900; }
      `}</style>
    </div>
  );
};

export default Jobs;
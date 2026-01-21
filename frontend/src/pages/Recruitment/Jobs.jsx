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
        .page-container { padding: 24px; max-width: 1200px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .page-anim { animation: fadeIn 0.4s ease-out; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .header h2 { margin: 0; font-size: 24px; color: #1e293b; font-weight: 800; }
        .header p { margin: 4px 0 0; color: #64748b; font-size: 14px; }
        
        .btn-primary { background: #0f172a; color: white; padding: 12px 24px; border-radius: 12px; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 700; transition: 0.2s; }
        .btn-primary:hover { background: #334155; transform: translateY(-1px); }
        .btn-outline { background: white; border: 1px solid #cbd5e1; color: #475569; padding: 10px 16px; border-radius: 10px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600; width: 100%; justify-content: center; transition: 0.2s; }
        .btn-outline:hover { background: #f8fafc; border-color: #94a3b8; color: #0f172a; }

        .job-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .job-card { background: white; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; display: flex; flex-direction: column; transition: 0.2s; position: relative; }
        .job-card:hover { transform: translateY(-4px); box-shadow: 0 12px 24px -4px rgba(0, 0, 0, 0.08); border-color: #cbd5e1; }
        .job-card.closed { opacity: 0.7; background: #f8fafc; }

        .card-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .job-title { margin: 8px 0; font-size: 18px; color: #0f172a; font-weight: 700; }
        .job-meta { display: flex; gap: 12px; font-size: 13px; color: #64748b; margin-top: 6px; }
        .badge { font-size: 11px; padding: 4px 10px; border-radius: 20px; font-weight: 700; text-transform: uppercase; display: inline-flex; align-items: center; gap: 6px; }
        .badge.open { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
        .badge.closed { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
        
        .mini-tags { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
        .mini-tags span { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: #475569; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; }
        
        .card-body { flex: 1; margin-bottom: 16px; }
        .stats-row { display: flex; gap: 20px; border-top: 1px dashed #e2e8f0; padding-top: 12px; }
        .stat { display: flex; flex-direction: column; }
        .stat .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; font-weight: 700; }
        .stat .val { font-size: 14px; font-weight: 700; color: #334155; }

        .menu-actions { display: flex; gap: 8px; }
        .icon-btn { width: 34px; height: 34px; border-radius: 10px; border: 1px solid #e2e8f0; background: white; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .icon-btn:hover { background: #f1f5f9; color: #0f172a; }

        .modal-overlay { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(4px); }
        .modal-box { background: white; width: 100%; max-width: 550px; padding: 24px; border-radius: 20px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); max-height: 90vh; overflow-y: auto; }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .modal-head h3 { margin: 0; font-size: 20px; font-weight: 700; }
        .close-btn { background: none; border: none; font-size: 22px; cursor: pointer; color: #94a3b8; }
        
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 600; color: #334155; }
        .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 12px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; box-sizing: border-box; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .full-width { width: 100%; margin-top: 10px; }
        .loader { text-align: center; padding: 40px; color: #64748b; font-size: 1.1rem; }
        .empty-state { text-align: center; padding: 60px; color: #64748b; border: 1px dashed #cbd5e1; border-radius: 16px; margin-top: 20px; background: white; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-pop { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default Jobs;
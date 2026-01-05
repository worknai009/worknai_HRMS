import React, { useState, useEffect, useMemo } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import {
  FaUserShield,
  FaPlus,
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaTimes,
  FaSpinner,
  FaEdit,
  FaCheckCircle,
} from "react-icons/fa";

const HRManagement = () => {
  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    designation: "HR Manager",
  });

  /* ================= FETCH DATA ================= */
  const fetchHRs = async () => {
    try {
      setLoading(true);
      const res = await API.get("/company/hrs");
      setHrs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Failed to load HR list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRs();
  }, []);

  /* ================= HANDLERS ================= */

  // Open Modal for Creating New HR
  const handleOpenCreate = () => {
    setFormData({
      name: "",
      email: "",
      password: "",
      mobile: "",
      designation: "HR Manager",
    });
    setIsEditMode(false);
    setSelectedId(null);
    setShowModal(true);
  };

  // Open Modal for Editing Existing HR
  const handleOpenEdit = (hr) => {
    setFormData({
      name: hr.name,
      email: hr.email,
      password: "", // Leave blank to keep existing
      mobile: hr.mobile,
      designation: hr.designation,
    });
    setIsEditMode(true);
    setSelectedId(hr._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);

      if (isEditMode) {
        // UPDATE LOGIC
        await API.put(`/company/update-user/${selectedId}`, formData);
        toast.success("HR Details Updated Successfully! ✅");
      } else {
        // CREATE LOGIC
        await API.post("/company/register-hr", formData);
        toast.success("HR Account Created Successfully! 🚀");
      }

      setShowModal(false);
      fetchHRs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Operation Failed");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= FILTER ================= */
  const filteredHRs = useMemo(() => {
    return hrs.filter(
      (hr) =>
        hr.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hr.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hrs, searchTerm]);

  /* ================= UI RENDER ================= */
  return (
    <div className="hr-page">
      {/* HEADER SECTION */}
      <header className="page-header">
        <div className="title-group">
          <div className="icon-box">
            <FaUserShield />
          </div>
          <div>
            <h1>HR Management</h1>
            <p>Manage access control for your HR team.</p>
          </div>
        </div>
        <button className="btn-add" onClick={handleOpenCreate}>
          <FaPlus /> Add New HR
        </button>
      </header>

      {/* CONTROLS */}
      <div className="controls-row">
        <div className="search-box">
          <FaSearch className="icon" />
          <input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="count-badge">Total: {hrs.length}</div>
      </div>

      {/* GRID LAYOUT */}
      <div className="hr-grid">
        {loading ? (
          <div className="state-msg">
            <FaSpinner className="spin" /> Loading HRs...
          </div>
        ) : filteredHRs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaUserShield />
            </div>
            <h3>No HR Admins Found</h3>
            <p>Click "Add New HR" to create your first admin.</p>
          </div>
        ) : (
          filteredHRs.map((hr) => (
            <div key={hr._id} className="hr-card slide-up">
              <div className="card-top">
                <div className="avatar">{hr.name?.charAt(0).toUpperCase()}</div>
                <div className="info">
                  <h3>{hr.name}</h3>
                  <span className="badge">{hr.designation}</span>
                </div>
              </div>

              <div className="card-body">
                <div className="info-row">
                  <FaEnvelope /> {hr.email}
                </div>
                <div className="info-row">
                  <FaPhone /> {hr.mobile || "N/A"}
                </div>
              </div>

              <div className="card-footer">
                <span className="status-pill active">
                  <FaCheckCircle /> Active
                </span>
                <button className="btn-edit" onClick={() => handleOpenEdit(hr)}>
                  <FaEdit /> Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content zoom-in">
            <div className="modal-header">
              <h3>{isEditMode ? "Edit Details" : "Create HR Admin"}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Email (Login ID)</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Mobile Number</label>
                <input
                  required
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>
                  {isEditMode ? "New Password (Optional)" : "Password"}
                </label>
                <input
                  type="password"
                  placeholder={
                    isEditMode
                      ? "Leave blank to keep current"
                      : "Create a strong password"
                  }
                  required={!isEditMode}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <FaSpinner className="spin" />
                ) : isEditMode ? (
                  "Save Changes"
                ) : (
                  "Create Account"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        :root {
          --primary: #2563eb;
          --primary-dark: #1d4ed8;
          --bg: #f8fafc;
          --card-bg: #ffffff;
          --text-main: #1e293b;
          --text-sec: #64748b;
          --border: #e2e8f0;
          --success-bg: #dcfce7;
          --success-text: #166534;
        }

        .hr-page {
          padding: 30px;
          background: var(--bg);
          min-height: 100vh;
          font-family: 'Segoe UI', sans-serif;
        }

        /* HEADER */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: var(--card-bg);
          padding: 20px 25px;
          border-radius: 16px;
          border: 1px solid var(--border);
          box-shadow: 0 2px 4px rgba(0,0,0,0.02);
        }
        .title-group {
          display: flex;
          gap: 15px;
          align-items: center;
        }
        .icon-box {
          width: 50px;
          height: 50px;
          background: #eff6ff;
          color: var(--primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .title-group h1 { margin: 0; font-size: 1.5rem; color: var(--text-main); }
        .title-group p { margin: 0; color: var(--text-sec); font-size: 0.9rem; }

        .btn-add {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: 0.2s;
        }
        .btn-add:hover { background: var(--primary-dark); transform: translateY(-2px); }

        /* CONTROLS */
        .controls-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          gap: 15px;
        }
        .search-box {
          flex: 1;
          max-width: 400px;
          background: var(--card-bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          padding: 0 15px;
          transition: 0.2s;
        }
        .search-box:focus-within { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
        .search-box input {
          width: 100%;
          border: none;
          padding: 12px;
          outline: none;
          font-size: 0.95rem;
        }
        .search-box .icon { color: var(--text-sec); }
        
        .count-badge {
          background: var(--card-bg);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
          color: var(--text-sec);
        }

        /* GRID */
        .hr-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 25px;
        }

        .hr-card {
          background: var(--card-bg);
          border-radius: 16px;
          border: 1px solid var(--border);
          padding: 25px;
          transition: 0.3s;
          display: flex;
          flex-direction: column;
        }
        .hr-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px -5px rgba(0,0,0,0.05);
          border-color: var(--primary);
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid var(--border);
        }
        .avatar {
          width: 50px;
          height: 50px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.3rem;
          font-weight: 700;
        }
        .info h3 { margin: 0; font-size: 1.1rem; color: var(--text-main); }
        .badge {
          display: inline-block;
          font-size: 0.75rem;
          background: #eff6ff;
          color: var(--primary);
          padding: 2px 8px;
          border-radius: 6px;
          margin-top: 4px;
          font-weight: 600;
        }

        .card-body { margin-bottom: 20px; flex: 1; }
        .info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--text-sec);
          margin-bottom: 10px;
          font-size: 0.9rem;
        }
        .info-row svg { color: var(--primary); opacity: 0.7; }

        .card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .status-pill.active {
          background: var(--success-bg);
          color: var(--success-text);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        /* Edit Button */
        .btn-edit {
          background: white;
          border: 1px solid var(--border);
          color: var(--primary);
          padding: 6px 12px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: 0.2s;
        }
        .btn-edit:hover { background: #eff6ff; border-color: var(--primary); }

        /* MODAL */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: var(--card-bg);
          padding: 30px;
          border-radius: 20px;
          width: 90%;
          max-width: 450px;
          box-shadow: 0 25px 50px -10px rgba(0,0,0,0.2);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
        }
        .modal-header h3 { margin: 0; font-size: 1.3rem; color: var(--text-main); }
        .close-btn { background: none; border: none; font-size: 1.2rem; cursor: pointer; color: var(--text-sec); }
        .close-btn:hover { color: #ef4444; }

        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-size: 0.9rem; color: var(--text-main); margin-bottom: 6px; font-weight: 500; }
        .form-group input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 1rem;
          outline: none;
          box-sizing: border-box;
          transition: 0.2s;
        }
        .form-group input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

        .submit-btn {
          width: 100%;
          padding: 12px;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          margin-top: 10px;
          transition: 0.2s;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .submit-btn:hover { background: var(--primary-dark); }
        
        .spin { animation: spin 1s infinite linear; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .slide-up { animation: slideUp 0.4s ease-out forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .zoom-in { animation: zoomIn 0.3s ease-out forwards; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .page-header { flex-direction: column; align-items: flex-start; gap: 15px; }
          .btn-add { width: 100%; justify-content: center; }
          .controls-row { flex-direction: column; align-items: stretch; }
          .search-box { max-width: 100%; }
          .count-badge { text-align: center; }
        }
      `}</style>
    </div>
  );
};

export default HRManagement;

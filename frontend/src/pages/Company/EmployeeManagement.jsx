import React, { useState, useEffect, useMemo } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import {
  FaUsers,
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaEdit,
  FaTimes,
  FaSpinner,
  FaCircle,
} from "react-icons/fa";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State for Editing
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    mobile: "",
    designation: "",
  });

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // ✅ Correct Endpoint for Employees
      const res = await API.get("/company/employees");
      setEmployees(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleOpenEdit = (emp) => {
    setFormData({
      name: emp.name,
      email: emp.email,
      password: "",
      mobile: emp.mobile,
      designation: emp.designation,
    });
    setSelectedId(emp._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      await API.put(`/company/update-user/${selectedId}`, formData);
      toast.success("Employee Details Updated! ✅");
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || "Update Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  return (
    <div className="emp-page">
      <header className="page-header">
        <div className="title-group">
          <div className="icon-wrap blue">
            <FaUsers />
          </div>
          <div>
            <h1>Employee Directory</h1>
            <p>Manage all registered employees.</p>
          </div>
        </div>
      </header>

      <div className="controls-row">
        <div className="search-box">
          <FaSearch className="icon" />
          <input
            placeholder="Search employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="count-badge">Total: {employees.length}</div>
      </div>

      <div className="emp-grid">
        {loading ? (
          <div className="state-msg">Loading Employees...</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="state-msg">No Employees Found.</div>
        ) : (
          filteredEmployees.map((emp) => (
            <div key={emp._id} className="emp-card">
              <div className="card-top">
                <img
                  src={getImageUrl(user.profileImage)}
                  alt="Profile"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `${window.location.origin}/uploads/default-avatar.jpg`;
                  }}
                />
                <div className="info">
                  <h3>{emp.name}</h3>
                  <span className="badge">{emp.designation}</span>
                </div>
              </div>
              <div className="card-details">
                <div>
                  <FaEnvelope /> {emp.email}
                </div>
                <div>
                  <FaPhone /> {emp.mobile}
                </div>
              </div>
              <div className="card-footer">
                <span className="status-pill active">
                  <FaCircle size={8} /> Active
                </span>
                <button
                  className="btn-edit"
                  onClick={() => handleOpenEdit(emp)}
                >
                  <FaEdit /> Edit
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content zoom-in">
            <div className="modal-header">
              <h3>Edit Employee</h3>
              <button onClick={() => setShowModal(false)}>
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
                <label>Email</label>
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
                <label>Designation</label>
                <input
                  required
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Mobile</label>
                <input
                  required
                  value={formData.mobile}
                  onChange={(e) =>
                    setFormData({ ...formData, mobile: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Reset Password</label>
                <input
                  type="password"
                  placeholder="Enter new password to reset"
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
                {submitting ? <FaSpinner className="spin" /> : "Update Details"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .emp-page { padding: 30px; background: #f8fafc; min-height: 100vh; font-family: 'Segoe UI', sans-serif; }
        .page-header { display: flex; margin-bottom: 30px; background: white; padding: 20px; border-radius: 16px; border: 1px solid #e2e8f0; }
        .title-group { display: flex; gap: 15px; align-items: center; }
        .icon-wrap.blue { width: 50px; height: 50px; background: #eff6ff; color: #3b82f6; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; }
        
        .controls-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .search-box { background: white; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; padding: 0 15px; width: 300px; }
        .search-box input { border: none; padding: 12px; outline: none; flex: 1; }
        .count-badge { background: #e2e8f0; padding: 8px 15px; border-radius: 20px; font-weight: 700; color: #475569; }

        .emp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 25px; }
        .emp-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; padding: 25px; transition: 0.3s; }
        .emp-card:hover { transform: translateY(-5px); border-color: #3b82f6; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
        
        .card-top { display: flex; align-items: center; gap: 15px; margin-bottom: 20px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
        .avatar-img { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0; }
        .badge { background: #f1f5f9; color: #475569; font-size: 0.75rem; padding: 2px 8px; border-radius: 6px; }
        
        .card-details div { display: flex; align-items: center; gap: 10px; color: #64748b; margin-bottom: 8px; }
        
        .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
        .status-pill.active { background: #f0fdf4; color: #16a34a; padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; display: flex; align-items: center; gap: 5px; }
        
        .btn-edit { background: white; border: 1px solid #e2e8f0; color: #2563eb; padding: 6px 12px; border-radius: 8px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; transition: 0.2s; }
        .btn-edit:hover { background: #eff6ff; border-color: #2563eb; }

        /* Reuse Modal Styles from HRManagement */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .modal-content { background: white; padding: 30px; border-radius: 20px; width: 90%; max-width: 450px; box-shadow: 0 25px 50px rgba(0,0,0,0.2); }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-size: 0.9rem; margin-bottom: 5px; color: #334155; }
        .form-group input { width: 100%; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; outline: none; box-sizing: border-box; }
        .submit-btn { width: 100%; padding: 12px; background: #2563eb; color: white; border: none; border-radius: 10px; font-weight: 700; margin-top: 10px; cursor: pointer; }
        .spin { animation: spin 1s infinite linear; } @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default EmployeeManagement;

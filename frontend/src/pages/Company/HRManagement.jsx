// src/pages/Company/HRManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
  FaUserShield,
  FaPlus,
  FaSearch,
  FaEnvelope,
  FaPhone,
  FaTimes
} from 'react-icons/fa';

const HRManagement = () => {
  const { user } = useAuth();

  const [hrs, setHrs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    designation: 'HR Manager'
  });

  /* ================= FETCH HRs ================= */
  const fetchHRs = async () => {
    try {
      setLoading(true);
      const res = await API.get('/company/hrs'); // ✅ FIXED
      setHrs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load HR list');
      setHrs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHRs();
  }, []);

  /* ================= FILTER ================= */
  const filteredHRs = useMemo(() => {
    return hrs.filter(hr =>
      hr.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hr.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hrs, searchTerm]);

  /* ================= CREATE HR ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);

      await API.post('/company/register-hr', { // ✅ FIXED
        ...formData
      });

      toast.success('HR Admin created successfully');
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        mobile: '',
        designation: 'HR Manager'
      });
      fetchHRs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create HR');
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div className="hr-page">
      {/* HEADER */}
      <header className="hr-header">
        <div>
          <h1><FaUserShield /> HR Management</h1>
          <p>Manage HR access for your company</p>
        </div>

        <button className="add-btn" onClick={() => setShowModal(true)}>
          <FaPlus /> Add HR
        </button>
      </header>

      {/* SEARCH */}
      <div className="search-bar">
        <FaSearch />
        <input
          placeholder="Search HR by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <span>Total: {hrs.length}</span>
      </div>

      {/* GRID */}
      <div className="hr-grid">
        {loading ? (
          <div className="loader">Loading HRs...</div>
        ) : filteredHRs.length === 0 ? (
          <div className="empty">No HR accounts found</div>
        ) : (
          filteredHRs.map(hr => (
            <div key={hr._id} className="hr-card">
              <div className="avatar">
                {hr.name?.charAt(0).toUpperCase()}
              </div>

              <h3>{hr.name}</h3>
              <span className="tag">{hr.designation}</span>

              <div className="info">
                <div><FaEnvelope /> {hr.email}</div>
                <div><FaPhone /> {hr.mobile}</div>
              </div>

              <span className="status active">ACTIVE</span>
            </div>
          ))
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal">
          <div className="modal-card">
            <header>
              <h3>Create HR Admin</h3>
              <button onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </header>

            <form onSubmit={handleSubmit}>
              <input
                placeholder="Full Name"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />

              <input
                type="email"
                placeholder="Email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />

              <input
                type="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />

              <input
                placeholder="Mobile"
                value={formData.mobile}
                onChange={e => setFormData({ ...formData, mobile: e.target.value })}
              />

              <button type="submit" disabled={submitting}>
                {submitting ? 'Creating...' : 'Create HR'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        .hr-page{padding:30px;background:#f8fafc;min-height:100vh}
        .hr-header{display:flex;justify-content:space-between;align-items:center}
        .add-btn{background:#2563eb;color:#fff;border:none;padding:10px 18px;border-radius:10px}
        .search-bar{margin:20px 0;display:flex;gap:12px;align-items:center}
        .search-bar input{flex:1;padding:10px;border-radius:10px;border:1px solid #e2e8f0}
        .hr-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
        .hr-card{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:20px;text-align:center}
        .avatar{width:56px;height:56px;border-radius:50%;background:#2563eb;color:#fff;
          display:flex;align-items:center;justify-content:center;font-size:22px;margin:auto}
        .tag{display:inline-block;margin:8px 0;font-size:.8rem;color:#2563eb}
        .info{font-size:.85rem;color:#475569}
        .status.active{margin-top:10px;display:inline-block;background:#dcfce7;color:#166534;
          padding:4px 12px;border-radius:20px;font-size:.75rem;font-weight:700}
        .modal{position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center}
        .modal-card{background:#fff;padding:24px;border-radius:16px;width:100%;max-width:420px}
        .modal-card header{display:flex;justify-content:space-between}
        form{display:grid;gap:12px;margin-top:10px}
        form input{padding:10px;border-radius:8px;border:1px solid #e2e8f0}
        form button{background:#2563eb;color:#fff;border:none;padding:10px;border-radius:10px}
      `}</style>
    </div>
  );
};

export default HRManagement;

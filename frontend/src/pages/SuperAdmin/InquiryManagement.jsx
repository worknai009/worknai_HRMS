// src/pages/SuperAdmin/InquiryManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import {
  FaClipboardList, FaSearch, FaFilter, FaSync,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaTrash, FaEdit, FaSave, FaBan,
  FaSpinner
} from 'react-icons/fa';

const InquiryManagement = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Edit Modal State
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { fetchInquiries(); }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await API.get('/superadmin/dashboard-data'); // Ensure this endpoint returns { inquiries: [] } or adjust if using dedicated inquiries endpoint
      // Adjusting based on common patterns, if you have a specific endpoint for inquiries list use that
      // Assuming res.data might be the array directly or inside an object
      const data = res.data.inquiries || (Array.isArray(res.data) ? res.data : []); 
      setInquiries(data);
    } catch (err) {
      console.error("Fetch Inquiries Error:", err);
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, action) => {
    if (!window.confirm("⚠️ Confirm Action? This cannot be undone.")) return;
    try {
      await API.delete(`/superadmin/inquiry/${id}`);
      toast.success(action === 'delete' ? 'Inquiry Archived' : 'Inquiry Rejected');
      fetchInquiries();
    } catch { toast.error('Action failed'); }
  };

  const handleEdit = (inq) => {
    setSelected(inq);
    setEditForm({
      companyName: inq.companyName,
      email: inq.email,
      mobile: inq.mobile,
      address: inq.address || ""
    });
    setShowEdit(true);
  };

  const submitEdit = async () => {
    try {
      await API.put(`/superadmin/inquiry/${selected._id}`, editForm);
      toast.success("Inquiry Updated ✅");
      setShowEdit(false);
      fetchInquiries();
    } catch { toast.error("Update Failed"); }
  };

  const filteredData = useMemo(() => {
    return inquiries.filter((item) => {
      const company = (item.companyName || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const status = (item.status || 'Pending');
      
      const matchesSearch = company.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'All' ? true : status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [inquiries, searchTerm, filterStatus]);

  return (
    <div className="inq-page">
      <div className="ambient-bg"></div>

      {/* HEADER */}
      <header className="page-header">
        <div className="title">
          <div className="icon-box"><FaClipboardList/></div>
          <div><h1>Inquiry Pipeline</h1><p>Manage incoming partnership requests.</p></div>
        </div>
        <button className="btn-sync" onClick={fetchInquiries} title="Refresh Data">
          <FaSync className={loading ? "spin" : ""} />
        </button>
      </header>

      {/* CONTROLS */}
      <div className="controls-container">
        <div className="search-grp">
          <FaSearch className="icon"/>
          <input 
            placeholder="Search by company or email..." 
            value={searchTerm} 
            onChange={e => setSearchTerm(e.target.value)} 
          />
        </div>
        <div className="filter-grp">
          <FaFilter className="icon"/>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* GRID */}
      <div className="grid">
        {loading ? (
          <div className="loader-state"><FaSpinner className="spin" /> Loading Inquiries...</div>
        ) : filteredData.length === 0 ? (
          <div className="empty-state">No inquiries found matching your criteria.</div>
        ) : (
          filteredData.map(inq => (
            <div key={inq._id} className="card slide-up">
              <div className="card-top">
                <div className="icon-comp">{(inq.companyName || "C").charAt(0).toUpperCase()}</div>
                <div className="info">
                  <h3>{inq.companyName}</h3>
                  <span>{inq.contactPerson}</span>
                </div>
                <span className={`badge ${inq.status.toLowerCase()}`}>{inq.status}</span>
              </div>
              
              <div className="card-body">
                <p><FaEnvelope/> {inq.email}</p>
                <p><FaPhone/> {inq.mobile}</p>
                <p className={!inq.address ? "missing" : ""}><FaMapMarkerAlt/> {inq.address || "No address provided"}</p>
              </div>

              <div className="card-foot">
                <button className="btn edit" onClick={() => handleEdit(inq)}><FaEdit/> Edit</button>
                {inq.status === 'Pending' && (
                  <button className="btn reject" onClick={() => handleDelete(inq._id, 'reject')}><FaBan/> Reject</button>
                )}
                <button className="btn archive" onClick={() => handleDelete(inq._id, 'delete')}><FaTrash/> Archive</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* EDIT MODAL */}
      {showEdit && (
        <div className="modal-overlay">
            <div className="modal-glass zoom-in">
                <div className="modal-header">
                  <h3>Edit Inquiry</h3>
                  <button onClick={() => setShowEdit(false)} className="close-btn"><FaBan/></button>
                </div>
                
                <div className="form-stack">
                    <div className="form-group">
                      <label>Company Name</label>
                      <input value={editForm.companyName} onChange={e=>setEditForm({...editForm, companyName:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Mobile</label>
                      <input value={editForm.mobile} onChange={e=>setEditForm({...editForm, mobile:e.target.value})} />
                    </div>
                    <div className="form-group">
                      <label>Address</label>
                      <textarea rows="2" value={editForm.address} onChange={e=>setEditForm({...editForm, address:e.target.value})} />
                    </div>
                </div>
                
                <div className="modal-btns">
                    <button className="btn-ghost" onClick={()=>setShowEdit(false)}>Cancel</button>
                    <button className="btn-primary" onClick={submitEdit}><FaSave/> Save Changes</button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        :root { 
          --bg: #0f172a; 
          --card: #1e293b; 
          --text: #f8fafc; 
          --text-dim: #94a3b8; 
          --accent: #f59e0b; 
          --border: rgba(255,255,255,0.1); 
        }
        
        .inq-page { 
          padding: 30px; 
          background: var(--bg); 
          min-height: 100vh; 
          font-family: 'Inter', sans-serif; 
          color: var(--text); 
        }
        
        /* HEADER */
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .title { display: flex; gap: 15px; align-items: center; }
        .icon-box { 
          width: 50px; height: 50px; 
          background: linear-gradient(135deg, #f59e0b, #d97706); 
          border-radius: 12px; display: flex; align-items: center; justify-content: center; 
          font-size: 1.5rem; color: white; box-shadow: 0 4px 15px rgba(245, 158, 11, 0.3);
        }
        .title h1 { margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: 0.5px; } 
        .title p { margin: 0; color: var(--text-dim); font-size: 0.9rem; }
        
        .btn-sync { 
          background: var(--card); border: 1px solid var(--border); 
          padding: 10px; width: 45px; height: 45px; border-radius: 12px; 
          cursor: pointer; color: var(--accent); font-size: 1.2rem; transition: 0.3s; 
          display: flex; align-items: center; justify-content: center;
        }
        .btn-sync:hover { background: rgba(255,255,255,0.05); color: white; border-color: var(--accent); }

        /* CONTROLS */
        .controls-container { 
          display: flex; gap: 20px; margin-bottom: 30px; 
          background: var(--card); padding: 20px; border-radius: 16px; 
          border: 1px solid var(--border); box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        .search-grp, .filter-grp { 
          flex: 1; background: rgba(0,0,0,0.3); 
          padding: 12px 15px; border-radius: 10px; border: 1px solid var(--border); 
          display: flex; gap: 10px; align-items: center; transition: 0.2s;
        }
        .search-grp:focus-within, .filter-grp:focus-within { border-color: var(--accent); }
        
        .search-grp input, .filter-grp select { 
          background: none; border: none; outline: none; width: 100%; 
          font-size: 1rem; color: white; 
        }
        .filter-grp select option { background: #1e293b; } 
        .icon { color: var(--text-dim); }

        /* GRID */
        .grid { 
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px; 
        }
        
        .card { 
          background: var(--card); border-radius: 16px; padding: 25px; 
          border: 1px solid var(--border); transition: 0.3s; 
          display: flex; flex-direction: column; 
        }
        .card:hover { border-color: var(--accent); transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        
        .card-top { 
          display: flex; gap: 15px; align-items: center; margin-bottom: 20px; 
          padding-bottom: 15px; border-bottom: 1px solid var(--border); position: relative; 
        }
        .icon-comp { 
          width: 45px; height: 45px; background: rgba(255,255,255,0.05); 
          border-radius: 12px; display: flex; align-items: center; justify-content: center; 
          font-weight: 800; font-size: 1.2rem; color: var(--accent); 
        }
        .info h3 { margin: 0; font-size: 1.1rem; color: white; } 
        .info span { color: var(--text-dim); font-size: 0.85rem; }
        
        .badge { 
          position: absolute; right: 0; top: 0; font-size: 0.7rem; 
          padding: 4px 8px; border-radius: 6px; font-weight: 700; text-transform: uppercase; 
        }
        .badge.pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; } 
        .badge.approved { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .badge.rejected { background: rgba(239, 68, 68, 0.2); color: #ef4444; }

        .card-body { flex: 1; margin-bottom: 20px; } 
        .card-body p { 
          display: flex; gap: 10px; align-items: center; margin-bottom: 10px; 
          color: #cbd5e1; font-size: 0.9rem; 
        } 
        .card-body svg { color: var(--accent); opacity: 0.7; }
        .missing { color: var(--text-dim); font-style: italic; }

        .card-foot { 
          display: flex; justify-content: flex-end; gap: 10px; 
          border-top: 1px solid var(--border); padding-top: 15px; 
        }
        .btn { 
          padding: 8px 14px; border-radius: 8px; border: none; font-weight: 600; 
          cursor: pointer; display: flex; gap: 6px; align-items: center; font-size: 0.85rem; transition: 0.2s;
        }
        .edit { background: rgba(255,255,255,0.1); color: white; } 
        .edit:hover { background: white; color: #0f172a; }
        .reject { background: rgba(239, 68, 68, 0.15); color: #ef4444; } 
        .reject:hover { background: #ef4444; color: white; }
        .archive { background: transparent; color: var(--text-dim); border: 1px solid var(--border); } 
        .archive:hover { border-color: var(--text-dim); color: white; }
        
        .loader-state, .empty-state { 
          text-align: center; color: var(--text-dim); grid-column: 1/-1; 
          padding: 60px; background: var(--card); border-radius: 16px; 
          font-size: 1.1rem; border: 1px dashed var(--border);
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* MODAL */
        .modal-overlay { 
          position: fixed; inset: 0; background: rgba(0,0,0,0.85); 
          display: flex; align-items: center; justify-content: center; 
          z-index: 1000; backdrop-filter: blur(5px); 
        }
        .modal-glass { 
          background: #1e293b; border: 1px solid var(--border); 
          padding: 30px; border-radius: 20px; width: 90%; max-width: 450px; 
          box-shadow: 0 25px 60px rgba(0,0,0,0.6); 
        }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .modal-header h3 { margin: 0; color: white; font-size: 1.4rem; }
        .close-btn { background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 1.2rem; }
        
        .form-stack { display: flex; flex-direction: column; gap: 15px; }
        .form-group label { display: block; color: var(--text-dim); font-size: 0.85rem; margin-bottom: 5px; }
        .form-group input, .form-group textarea { 
          background: rgba(0,0,0,0.3); border: 1px solid var(--border); 
          padding: 12px; border-radius: 8px; color: white; outline: none; 
          width: 100%; box-sizing: border-box; font-family: inherit; font-size: 1rem;
        }
        .form-group input:focus, .form-group textarea:focus { border-color: var(--accent); }

        .modal-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 30px; }
        .btn-ghost { 
          background: transparent; color: var(--text-dim); border: 1px solid var(--border); 
          padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 600;
        }
        .btn-ghost:hover { color: white; border-color: white; }
        .btn-primary { 
          background: var(--accent); color: #0f172a; border: none; 
          padding: 10px 24px; border-radius: 8px; font-weight: 700; 
          cursor: pointer; display: flex; gap: 8px; align-items: center; 
        }
        .btn-primary:hover { filter: brightness(1.1); }

        .slide-up { animation: slideUp 0.4s ease-out forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .zoom-in { animation: zoomIn 0.3s ease-out forwards; }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

        @media(max-width: 600px) { 
          .controls-container { flex-direction: column; } 
          .search-grp, .filter-grp { width: 100%; box-sizing: border-box; }
        }
      `}</style>
    </div>
  );
};

export default InquiryManagement;
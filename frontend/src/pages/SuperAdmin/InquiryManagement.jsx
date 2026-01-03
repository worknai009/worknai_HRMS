import React, { useState, useEffect, useMemo } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import {
  FaClipboardList, FaSearch, FaFilter, FaSync,
  FaEnvelope, FaPhone, FaMapMarkerAlt, FaTrash, FaEdit, FaSave, FaBan
} from 'react-icons/fa';

const InquiryManagement = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Edit Modal
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { fetchInquiries(); }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const res = await API.get('/superadmin/inquiries');
      setInquiries(Array.isArray(res.data) ? res.data : []);
    } catch { toast.error('Sync failed'); } 
    finally { setLoading(false); }
  };

  const handleDelete = async (id, action) => {
    if (!window.confirm("⚠️ Confirm Action?")) return;
    try {
      await API.delete(`/superadmin/inquiry/${id}`);
      toast.success(action === 'delete' ? 'Archived' : 'Rejected');
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
      toast.success("Updated ✅");
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

      <header className="page-header">
        <div className="title">
          <div className="icon-box"><FaClipboardList/></div>
          <div><h1>Inquiry Pipeline</h1><p>Incoming Requests</p></div>
        </div>
        <button className="btn-sync" onClick={fetchInquiries}><FaSync/></button>
      </header>

      <div className="controls-glass">
        <div className="search-grp">
          <FaSearch className="icon"/>
          <input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="filter-grp">
          <FaFilter className="icon"/>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="grid">
        {loading ? <div className="loader">Loading...</div> :
         filteredData.length === 0 ? <div className="loader">No inquiries found.</div> : 
          filteredData.map(inq => (
            <div key={inq._id} className="card slide-up">
              <div className="card-top">
                <div className="icon-comp">{(inq.companyName || "C").charAt(0)}</div>
                <div className="info"><h3>{inq.companyName}</h3><span>{inq.contactPerson}</span></div>
                <span className={`badge ${inq.status.toLowerCase()}`}>{inq.status}</span>
              </div>
              
              <div className="card-body">
                <p><FaEnvelope/> {inq.email}</p>
                <p><FaPhone/> {inq.mobile}</p>
                <p className={!inq.address ? "missing" : ""}><FaMapMarkerAlt/> {inq.address || "No address"}</p>
              </div>

              <div className="card-foot">
                <button className="btn edit" onClick={() => handleEdit(inq)}><FaEdit/> Edit</button>
                {inq.status === 'Pending' && <button className="btn reject" onClick={() => handleDelete(inq._id, 'reject')}><FaBan/> Reject</button>}
                <button className="btn archive" onClick={() => handleDelete(inq._id, 'delete')}><FaTrash/> Archive</button>
              </div>
            </div>
          ))
        }
      </div>

      {showEdit && (
        <div className="modal-overlay">
            <div className="modal-glass">
                <h3>Edit Inquiry</h3>
                <div className="form-stack">
                    <label>Company</label><input value={editForm.companyName} onChange={e=>setEditForm({...editForm, companyName:e.target.value})} />
                    <label>Email</label><input value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} />
                    <label>Mobile</label><input value={editForm.mobile} onChange={e=>setEditForm({...editForm, mobile:e.target.value})} />
                    <label>Address</label><input value={editForm.address} onChange={e=>setEditForm({...editForm, address:e.target.value})} />
                </div>
                <div className="modal-btns">
                    <button className="btn-ghost" onClick={()=>setShowEdit(false)}>Cancel</button>
                    <button className="btn-primary" onClick={submitEdit}><FaSave/> Save</button>
                </div>
            </div>
        </div>
      )}

      <style>{`
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --text-dim: #94a3b8; --accent: #f59e0b; --border: rgba(255,255,255,0.1); }
        .inq-page { padding: 30px; background: var(--bg); min-height: 100vh; font-family: 'Inter', sans-serif; color: var(--text); }
        
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .title { display: flex; gap: 15px; align-items: center; }
        .icon-box { width: 50px; height: 50px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: white; }
        .title h1 { margin: 0; font-size: 1.5rem; font-weight: 800; } .title p { margin: 0; color: var(--text-dim); font-size: 0.9rem; }
        
        .btn-sync { background: var(--card); border: 1px solid var(--border); padding: 10px 15px; border-radius: 10px; cursor: pointer; color: var(--accent); font-size: 1.2rem; transition: 0.3s; }
        .btn-sync:hover { transform: rotate(180deg); color: white; }

        .controls-glass { display: flex; gap: 20px; margin-bottom: 30px; background: var(--card); padding: 15px; border-radius: 16px; border: 1px solid var(--border); }
        .search-grp, .filter-grp { flex: 1; background: rgba(0,0,0,0.3); padding: 10px 15px; border-radius: 10px; border: 1px solid var(--border); display: flex; gap: 10px; align-items: center; }
        .search-grp input, .filter-grp select { background: none; border: none; outline: none; width: 100%; font-size: 1rem; color: white; }
        .filter-grp select option { background: #1e293b; } .icon { color: var(--text-dim); }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        
        .card { background: var(--card); border-radius: 16px; padding: 25px; border: 1px solid var(--border); transition: 0.3s; display: flex; flex-direction: column; }
        .card:hover { border-color: var(--accent); transform: translateY(-5px); }
        
        .card-top { display: flex; gap: 15px; align-items: center; margin-bottom: 20px; position: relative; }
        .icon-comp { width: 45px; height: 45px; background: rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; color: var(--accent); }
        .info h3 { margin: 0; font-size: 1.1rem; color: white; } .info span { color: var(--text-dim); font-size: 0.85rem; }
        .badge { position: absolute; right: 0; top: 0; font-size: 0.65rem; padding: 4px 8px; border-radius: 6px; font-weight: 700; text-transform: uppercase; }
        .badge.pending { background: rgba(245, 158, 11, 0.2); color: #f59e0b; } .badge.approved { background: rgba(16, 185, 129, 0.2); color: #10b981; }

        .card-body { flex: 1; margin-bottom: 20px; } .card-body p { display: flex; gap: 10px; align-items: center; margin-bottom: 10px; color: #cbd5e1; font-size: 0.9rem; } .card-body svg { color: var(--accent); opacity: 0.7; }

        .card-foot { display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border); padding-top: 15px; }
        .btn { padding: 8px 14px; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: flex; gap: 6px; align-items: center; font-size: 0.8rem; }
        .edit { background: rgba(255,255,255,0.1); color: white; } .edit:hover { background: white; color: #0f172a; }
        .reject { background: rgba(239, 68, 68, 0.15); color: #ef4444; } .reject:hover { background: #ef4444; color: white; }
        .archive { background: transparent; color: var(--text-dim); border: 1px solid var(--border); } .archive:hover { border-color: var(--text-dim); color: white; }
        
        .loader { text-align: center; color: var(--text-dim); grid-column: 1/-1; padding: 50px; background: var(--card); border-radius: 16px; }

        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(5px); }
        .modal-glass { background: #1e293b; border: 1px solid var(--border); padding: 30px; border-radius: 20px; width: 90%; max-width: 450px; box-shadow: 0 25px 60px rgba(0,0,0,0.6); }
        .modal-glass h3 { margin: 0 0 20px; color: white; font-size: 1.3rem; }
        
        .form-stack { display: flex; flex-direction: column; gap: 12px; }
        .form-stack label { color: var(--text-dim); font-size: 0.8rem; margin-bottom: -5px; }
        .form-stack input { background: rgba(0,0,0,0.3); border: 1px solid var(--border); padding: 10px; border-radius: 8px; color: white; outline: none; width: 100%; box-sizing: border-box; }
        .form-stack input:focus { border-color: var(--accent); }

        .modal-btns { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
        .btn-ghost { background: transparent; color: var(--text-dim); border: 1px solid var(--border); padding: 10px 20px; border-radius: 8px; cursor: pointer; }
        .btn-primary { background: var(--accent); color: #0f172a; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; gap: 8px; align-items: center; }

        .slide-up { animation: slideUp 0.4s ease forwards; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        @media(max-width: 600px) { .controls-glass { flex-direction: column; } }
      `}</style>
    </div>
  );
};

export default InquiryManagement;
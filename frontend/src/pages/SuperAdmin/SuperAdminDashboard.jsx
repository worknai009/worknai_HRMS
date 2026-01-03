import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { toast } from "react-toastify";
import {
  FaUserShield, FaSync, FaSearch, FaEnvelope, FaPhone,
  FaMapMarkerAlt, FaBan, FaCheck, FaTrash, FaEdit, FaSave, 
  FaKey, FaEye, FaEyeSlash, FaSignOutAlt, FaBuilding, FaUserPlus
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [inquiries, setInquiries] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState("active"); 
  const [searchTerm, setSearchTerm] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selected, setSelected] = useState(null);
  
  const [adminPassword, setAdminPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await API.get("/superadmin/dashboard-data");
      setInquiries(res.data.inquiries || []);
      setCompanies(res.data.companies || []);
    } catch { toast.error("Sync Failed"); } 
    finally { setLoading(false); }
  };

  /* --- ACTIONS --- */
  const handleLimitAction = async (companyId, action) => {
      try {
          await API.put(`/superadmin/company-limit/${companyId}`, { action });
          toast.success(action === 'approve' ? "Limit Increased ✅" : "Rejected ❌");
          fetchData();
      } catch { toast.error("Action Failed"); }
  };

  const handleRejectOrDelete = async (id, type) => {
    if (!window.confirm("⚠️ Confirm Deletion/Rejection? This is irreversible.")) return;
    try {
      const endpoint = type === 'reject' ? `/superadmin/inquiry/${id}` : `/superadmin/company/${id}`;
      await API.delete(endpoint);
      toast.success("Processed Successfully");
      fetchData();
    } catch { toast.error("Action Failed"); }
  };

  /* --- APPROVE --- */
  const openApproveModal = (inq) => {
    setSelected(inq);
    setAdminPassword("");
    setShowApproveModal(true);
  };

  const submitApproval = async () => {
    if (adminPassword.length < 6) return toast.warning("Password too short");
    setIsSubmitting(true);
    try {
      await API.post("/superadmin/approve-inquiry", { inquiryId: selected._id, password: adminPassword });
      toast.success("Approved & Created 🚀");
      setShowApproveModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setIsSubmitting(false); }
  };

  /* --- EDIT (With Lat/Lng) --- */
  const openEditModal = (comp) => {
    setSelected(comp);
    const loc = comp.location || {};
    setEditForm({ 
      companyName: comp.name, 
      email: comp.email, 
      address: loc.address || "", 
      lat: loc.lat || 0,
      lng: loc.lng || 0,
      password: "" 
    });
    setShowEditModal(true);
  };

  const submitEdit = async () => {
    try {
      await API.put(`/superadmin/company/${selected._id}`, editForm);
      toast.success("Details Updated ✅");
      setShowEditModal(false);
      fetchData();
    } catch { toast.error("Update Failed"); }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#";
    let p = ""; for (let i = 0; i < 10; i++) p += chars[Math.floor(Math.random() * chars.length)];
    setAdminPassword(p);
  };

  /* --- RENDER HELPERS --- */
  const limitRequests = companies.filter(c => c.hrLimitRequest === 'Pending');
  const pendingInquiries = inquiries.filter(i => i.status === 'Pending');

  let list = activeTab === 'requests' ? limitRequests : activeTab === 'pending' ? pendingInquiries : companies;
  const filtered = list.filter(i => (i.name || i.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="sa-dashboard">
      <div className="ambient-bg"></div>
      
      <header className="sa-nav">
        <div className="brand">
          <div className="logo-icon"><FaUserShield /></div>
          <div><h1>SUPER ADMIN</h1><span>Root Access</span></div>
        </div>
        <button className="logout-btn" onClick={() => { logout(); navigate('/super-admin-login'); }}>
          <FaSignOutAlt/> Logout
        </button>
      </header>

      <div className="sa-container">
        
        {/* STATS */}
        <div className="stats-grid">
          <div className="stat-card blue">
            <div className="icon"><FaBuilding/></div>
            <div className="info"><h3>{companies.length}</h3><span>Active Clients</span></div>
          </div>
          <div className="stat-card gold">
            <div className="icon"><FaUserShield/></div>
            <div className="info"><h3>{pendingInquiries.length}</h3><span>New Inquiries</span></div>
          </div>
          <div className="stat-card red">
            <div className="icon"><FaUserPlus/></div>
            <div className="info"><h3>{limitRequests.length}</h3><span>Limit Requests</span></div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="toolbar">
          <div className="tabs">
            <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Active Clients</button>
            <button className={activeTab === 'pending' ? 'active' : ''} onClick={() => setActiveTab('pending')}>
                New Inquiries {pendingInquiries.length > 0 && <span className="badge">{pendingInquiries.length}</span>}
            </button>
            <button className={activeTab === 'requests' ? 'active' : ''} onClick={() => setActiveTab('requests')}>
                Requests {limitRequests.length > 0 && <span className="badge red">{limitRequests.length}</span>}
            </button>
          </div>
          <div className="search-box">
            <FaSearch />
            <input placeholder="Search records..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <button onClick={fetchData} className="refresh"><FaSync/></button>
          </div>
        </div>

        {/* LIST */}
        <div className="data-grid">
          {loading ? <div className="state-msg">Loading Data...</div> : 
           filtered.length === 0 ? <div className="state-msg">No records found.</div> : 
           filtered.map(item => (
             <div key={item._id} className="data-card">
               
               <div className="card-head">
                 <div className="avt">{(item.name || item.companyName || "C").charAt(0)}</div>
                 <div className="meta">
                   <h4>{item.name || item.companyName}</h4>
                   <small>{item.email}</small>
                 </div>
                 <span className={`status-pill ${activeTab}`}>{activeTab === 'active' ? 'ACTIVE' : 'PENDING'}</span>
               </div>

               <div className="card-body">
                 <p><FaPhone/> {item.mobile || "N/A"}</p>
                 <p><FaMapMarkerAlt/> {item.location?.address || item.address || "No Address"}</p>
                 {activeTab === 'requests' && <p className="alert-text">⚠️ Requesting HR Limit Increase</p>}
               </div>

               <div className="card-foot">
                 {activeTab === 'active' && (
                   <>
                     <button className="btn edit" onClick={() => openEditModal(item)}><FaEdit/> Edit</button>
                     <button className="btn delete" onClick={() => handleRejectOrDelete(item._id, 'delete')}><FaTrash/></button>
                   </>
                 )}
                 {activeTab === 'pending' && (
                   <>
                     <button className="btn reject" onClick={() => handleRejectOrDelete(item._id, 'reject')}><FaBan/> Reject</button>
                     <button className="btn approve" onClick={() => openApproveModal(item)}><FaCheck/> Provision</button>
                   </>
                 )}
                 {activeTab === 'requests' && (
                   <>
                     <button className="btn reject" onClick={() => handleLimitAction(item._id, 'reject')}>Deny</button>
                     <button className="btn approve" onClick={() => handleLimitAction(item._id, 'approve')}>Approve +1</button>
                   </>
                 )}
               </div>
             </div>
           ))
          }
        </div>
      </div>

      {/* --- EDIT MODAL --- */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Update Client Details</h3>
            <div className="form-stack">
                <label>Company Name</label>
                <input value={editForm.companyName} onChange={e=>setEditForm({...editForm, companyName:e.target.value})} />
                
                <label>Email (Login ID)</label>
                <input value={editForm.email} onChange={e=>setEditForm({...editForm, email:e.target.value})} />
                
                <label>Address</label>
                <textarea rows="2" value={editForm.address} onChange={e=>setEditForm({...editForm, address:e.target.value})} />
                
                <div className="row-2">
                    <div><label>Latitude</label><input type="number" step="any" value={editForm.lat} onChange={e=>setEditForm({...editForm, lat:e.target.value})} /></div>
                    <div><label>Longitude</label><input type="number" step="any" value={editForm.lng} onChange={e=>setEditForm({...editForm, lng:e.target.value})} /></div>
                </div>

                <label>Reset Password (Optional)</label>
                <input type="password" placeholder="New Password" value={editForm.password} onChange={e=>setEditForm({...editForm, password:e.target.value})} />
            </div>
            <div className="modal-actions">
                <button className="ghost" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="solid" onClick={submitEdit}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* --- APPROVE MODAL --- */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3>Provision Company</h3>
            <p>Create credentials for {selected?.companyName}</p>
            <div className="form-stack">
                <label>Assign Password</label>
                <div className="pass-grp">
                    <input type={showPassword?"text":"password"} value={adminPassword} onChange={e=>setAdminPassword(e.target.value)} />
                    <button onClick={generatePassword}><FaKey/></button>
                </div>
            </div>
            <div className="modal-actions">
                <button className="ghost" onClick={() => setShowApproveModal(false)}>Cancel</button>
                <button className="solid" onClick={submitApproval} disabled={isSubmitting}>Approve</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        :root { --bg: #0f172a; --card: #1e293b; --text: #f8fafc; --text-dim: #94a3b8; --accent: #f59e0b; --border: rgba(255,255,255,0.1); }
        .sa-dashboard { min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Inter', sans-serif; padding-bottom: 50px; }
        
        .sa-nav { display: flex; justify-content: space-between; padding: 15px 30px; background: rgba(15,23,42,0.9); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; backdrop-filter: blur(10px); }
        .brand { display: flex; gap: 15px; align-items: center; }
        .logo-icon { width: 45px; height: 45px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: #fff; box-shadow: 0 0 15px rgba(245,158,11,0.4); }
        .brand h1 { margin: 0; font-size: 1.2rem; font-weight: 800; letter-spacing: 1px; } .brand span { font-size: 0.75rem; color: var(--text-dim); text-transform: uppercase; }
        .logout-btn { background: rgba(239,68,68,0.15); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); padding: 8px 16px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 8px; font-weight: 600; }
        .logout-btn:hover { background: #ef4444; color: white; }

        .sa-container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }

        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-card { background: var(--card); border: 1px solid var(--border); padding: 25px; border-radius: 16px; display: flex; align-items: center; gap: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
        .stat-card .icon { width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; }
        .blue .icon { background: rgba(59,130,246,0.15); color: #3b82f6; } .gold .icon { background: rgba(245,158,11,0.15); color: #f59e0b; } .red .icon { background: rgba(239,68,68,0.15); color: #ef4444; }
        .stat-card h3 { font-size: 2rem; margin: 0; } .stat-card span { color: var(--text-dim); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; }

        .toolbar { background: var(--card); padding: 10px 15px; border-radius: 12px; border: 1px solid var(--border); display: flex; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 15px; }
        .tabs { display: flex; gap: 10px; }
        .tabs button { background: none; border: none; color: var(--text-dim); padding: 8px 16px; font-weight: 600; cursor: pointer; border-radius: 8px; transition: 0.3s; position: relative; }
        .tabs button:hover { color: white; background: rgba(255,255,255,0.05); }
        .tabs button.active { background: var(--accent); color: #0f172a; }
        .badge { background: #ef4444; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 10px; margin-left: 6px; position: absolute; top: -5px; right: -5px; }

        .search-box { display: flex; align-items: center; background: rgba(0,0,0,0.3); border: 1px solid var(--border); padding: 8px 15px; border-radius: 8px; flex: 1; max-width: 400px; }
        .search-box input { background: none; border: none; outline: none; color: white; width: 100%; margin-left: 10px; } 
        .search-box svg { color: var(--text-dim); } .refresh { background: none; border: none; color: var(--accent); cursor: pointer; font-size: 1rem; }

        .data-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 20px; }
        .data-card { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; transition: 0.3s; }
        .data-card:hover { border-color: var(--accent); transform: translateY(-5px); }
        
        .card-head { display: flex; align-items: center; gap: 15px; margin-bottom: 15px; border-bottom: 1px solid var(--border); padding-bottom: 15px; }
        .avt { width: 45px; height: 45px; background: linear-gradient(135deg, #334155, #475569); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 700; color: var(--accent); }
        .meta h4 { margin: 0; color: white; font-size: 1.1rem; } .meta small { color: var(--text-dim); font-size: 0.85rem; }
        .status-pill { font-size: 0.65rem; padding: 4px 8px; border-radius: 4px; font-weight: 800; }
        .active { background: rgba(16,185,129,0.2); color: #10b981; } .pending { background: rgba(245,158,11,0.2); color: #f59e0b; }

        .card-body p { margin: 8px 0; color: #cbd5e1; font-size: 0.9rem; display: flex; align-items: center; gap: 10px; }
        .card-body svg { color: var(--accent); opacity: 0.7; }
        
        .card-foot { margin-top: auto; padding-top: 15px; display: flex; gap: 10px; justify-content: flex-end; }
        .btn { padding: 8px 14px; border-radius: 6px; border: none; font-weight: 600; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 5px; }
        .edit { background: rgba(255,255,255,0.1); color: white; } .edit:hover { background: white; color: #0f172a; }
        .delete, .reject { background: rgba(239,68,68,0.2); color: #ef4444; } .delete:hover { background: #ef4444; color: white; }
        .approve { background: #10b981; color: #0f172a; } .approve:hover { filter: brightness(1.1); }

        .state-msg { text-align: center; color: var(--text-dim); font-size: 1.2rem; grid-column: 1 / -1; padding: 50px; }

        /* MODAL */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 100; backdrop-filter: blur(5px); }
        .modal-box { background: #1e293b; padding: 30px; border-radius: 16px; width: 90%; max-width: 450px; border: 1px solid var(--border); box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
        .modal-box h3 { margin: 0 0 20px; color: white; }
        .form-stack { display: flex; flex-direction: column; gap: 12px; }
        .form-stack label { color: var(--text-dim); font-size: 0.8rem; margin-bottom: -5px; }
        .form-stack input, textarea { background: rgba(0,0,0,0.3); border: 1px solid var(--border); padding: 10px; border-radius: 8px; color: white; outline: none; width: 100%; box-sizing: border-box; }
        .form-stack input:focus { border-color: var(--accent); }
        
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .pass-grp { display: flex; gap: 10px; } .pass-grp button { background: rgba(255,255,255,0.1); border: 1px solid var(--border); color: white; border-radius: 8px; width: 40px; cursor: pointer; }

        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 25px; }
        .ghost { background: transparent; color: var(--text-dim); border: none; cursor: pointer; } .ghost:hover { color: white; }
        .solid { background: var(--accent); color: #0f172a; padding: 10px 20px; border-radius: 8px; border: none; font-weight: 700; cursor: pointer; }

        @media(max-width: 768px) {
            .stats-grid { grid-template-columns: 1fr; }
            .toolbar { flex-direction: column; }
            .search-box { max-width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboard;
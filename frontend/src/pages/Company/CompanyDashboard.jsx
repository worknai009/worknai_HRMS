import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from 'react-toastify';
import {
  FaUsers, FaUserTie, FaBuilding, FaEnvelope, FaMapMarkerAlt,
  FaArrowRight, FaCamera, FaPlusCircle, FaCircle
} from "react-icons/fa";

// Helper for Image URL
const getImageUrl = (path) => {
  if (!path) return null;
  return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
};

const CompanyDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoPreview, setLogoPreview] = useState(null);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await API.get("/company/profile");
      setData(res.data); // Contains company, stats, employees, hrs
    } catch {
      console.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  /* ================= LOGO UPLOAD ================= */
  const handleLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    setLogoPreview(URL.createObjectURL(file));

    // Upload
    const formData = new FormData();
    formData.append('logo', file);

    try {
      await API.put("/company/update", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      toast.success("Logo Updated! 📸");
    } catch {
      toast.error("Logo upload failed");
    }
  };

  /* ================= REQUEST EXTRA HR ================= */
  const requestExtraHr = async () => {
    if(!window.confirm("Request Super Admin to increase HR limit?")) return;
    try {
      await API.post("/company/request-limit");
      toast.success("Request Sent to Super Admin 📩");
      loadData(); // Refresh to show pending status
    } catch {
      toast.error("Request failed");
    }
  };

  // Helper to generate Initials Logo
  const getInitials = (name) => {
    if (!name) return "CO";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  if (loading) return <div className="loader">Loading Dashboard...</div>;

  const { company, stats, employees, hrs } = data;

  return (
    <div className="comp-dashboard">
      {/* HEADER */}
      <header className="dash-nav">
        <div className="brand">
          <div className="icon-wrapper">
            <FaBuilding className="icon" />
          </div>
          <span>Company Panel</span>
        </div>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </header>

      <div className="content-wrapper">
        
        {/* TOP PROFILE SECTION */}
        <section className="profile-card">
          <div className="logo-section">
            <div className="logo-wrapper">
              {logoPreview || (company?.logo) ? (
                <img src={logoPreview || getImageUrl(company.logo)} alt="Logo" className="comp-logo" />
              ) : (
                <div className="default-logo">{getInitials(company?.name)}</div>
              )}
              
              {/* Hidden Upload Button */}
              <label className="upload-trigger">
                <FaCamera />
                <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
              </label>
            </div>
          </div>

          <div className="info-block">
            <h1>{company?.name}</h1>
            <div className="meta">
              <div className="meta-item"><FaEnvelope /> {company?.email}</div>
              <div className="meta-item"><FaMapMarkerAlt /> {company?.location?.address || "Location not set"}</div>
            </div>
          </div>

          <div className="plan-info">
            <div className="plan-header">HR Limit Usage</div>
            <div className="plan-stats">
                <h3>{hrs.length} <span className="divider">/</span> {company?.maxHrAdmins}</h3>
            </div>
            
            {company?.hrLimitRequest === 'Pending' ? (
                <span className="badge pending">Request Pending...</span>
            ) : (
                <button className="req-btn" onClick={requestExtraHr} disabled={hrs.length < company?.maxHrAdmins}>
                    Request Limit Increase
                </button>
            )}
          </div>
        </section>

        {/* STATS CARDS */}
        <div className="stats-grid">
          <div className="stat-box blue-theme">
            <div className="s-icon"><FaUsers /></div>
            <div>
              <h2>{stats.totalEmployees}</h2>
              <p>Active Employees</p>
            </div>
          </div>
          <div className="stat-box purple-theme">
            <div className="s-icon"><FaUserTie /></div>
            <div>
              <h2>{stats.totalHRs}</h2>
              <p>HR Managers</p>
            </div>
          </div>
        </div>

        {/* LISTS GRID */}
        <div className="lists-container">
          
          {/* HR LIST */}
          <div className="list-card">
            <div className="card-head">
              <h3>Active HR Team</h3>
              <button className="view-more-btn" onClick={() => navigate("/company/hr-management")}>Manage <FaArrowRight/></button>
            </div>
            <div className="list-body">
              {hrs.length === 0 ? <p className="empty">No HRs added yet.</p> : 
                hrs.map(hr => (
                  <div key={hr._id} className="list-item">
                    <div className="avatar-s">{getInitials(hr.name)}</div>
                    <div className="details">
                      <strong>{hr.name}</strong>
                      <small>{hr.email}</small>
                    </div>
                    <span className="status-dot online" title="Active"></span>
                  </div>
                ))
              }
            </div>
          </div>

          {/* EMPLOYEE LIST (Recent) */}
          <div className="list-card">
            <div className="card-head">
              <h3>Recent Employees</h3>
              <button className="view-more-btn" onClick={() => navigate("/company/hr-management")}>View All <FaArrowRight/></button>
            </div>
            <div className="list-body">
              {employees.length === 0 ? <p className="empty">No employees active.</p> : 
                employees.map(emp => (
                  <div key={emp._id} className="list-item">
                    <img 
                        src={getImageUrl(emp.profileImage) || "https://via.placeholder.com/40"} 
                        onError={(e) => e.target.src = "https://via.placeholder.com/40"}
                        className="avatar-img"
                        alt="emp" 
                    />
                    <div className="details">
                      <strong>{emp.name}</strong>
                      <small>{emp.designation}</small>
                    </div>
                    <span className="status-dot online" title="Active"></span>
                  </div>
                ))
              }
            </div>
          </div>

        </div>
      </div>

      <style>{`
        .comp-dashboard { min-height: 100vh; background: #f8fafc; font-family: 'Segoe UI', sans-serif; color: #334155; }
        
        /* HEADER */
        .dash-nav { background: #ffffff; padding: 15px 40px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
        .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; font-size: 1.3rem; color: #1e293b; }
        .brand .icon-wrapper { width: 36px; height: 36px; background: #eff6ff; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .brand .icon { color: #3b82f6; font-size: 1.2rem; }
        .logout-btn { background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; padding: 8px 20px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .logout-btn:hover { background: #ffe4e6; }

        .content-wrapper { max-width: 1100px; margin: 40px auto; padding: 0 20px; }

        /* PROFILE CARD */
        .profile-card { background: white; padding: 35px; border-radius: 20px; display: flex; align-items: center; gap: 30px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); margin-bottom: 40px; border: 1px solid #f1f5f9; flex-wrap: wrap; }
        
        .logo-section { flex-shrink: 0; }
        .logo-wrapper { position: relative; width: 100px; height: 100px; }
        .comp-logo { width: 100%; height: 100%; border-radius: 20px; object-fit: cover; border: 2px solid #f1f5f9; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .default-logo { width: 100%; height: 100%; background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; display: flex; align-items: center; justify-content: center; font-size: 2.5rem; font-weight: 700; border-radius: 20px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.2); }
        .upload-trigger { position: absolute; bottom: -8px; right: -8px; background: white; border: 1px solid #e2e8f0; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; box-shadow: 0 4px 6px rgba(0,0,0,0.08); transition: 0.2s; }
        .upload-trigger:hover { color: #2563eb; transform: scale(1.1); }

        .info-block { flex: 1; min-width: 250px; }
        .info-block h1 { margin: 0 0 12px 0; font-size: 2rem; color: #0f172a; font-weight: 800; letter-spacing: -0.5px; }
        .meta { display: flex; flex-direction: column; gap: 8px; color: #64748b; font-size: 0.95rem; }
        .meta-item { display: flex; align-items: center; gap: 8px; }
        .meta-item svg { color: #94a3b8; }

        .plan-info { text-align: center; background: #f8fafc; padding: 20px 30px; border-radius: 16px; border: 1px solid #e2e8f0; min-width: 200px; }
        .plan-header { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; margin-bottom: 8px; }
        .plan-stats h3 { margin: 0 0 15px; font-size: 1.8rem; color: #0f172a; font-weight: 800; }
        .plan-stats .divider { color: #cbd5e1; font-weight: 400; margin: 0 5px; }
        .req-btn { background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 0.85rem; cursor: pointer; font-weight: 600; transition: 0.2s; width: 100%; box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2); }
        .req-btn:hover { background: #2563eb; transform: translateY(-1px); }
        .req-btn:disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; box-shadow: none; transform: none; }
        .badge.pending { background: #fff7ed; color: #d97706; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid #ffedd5; display: inline-block; }

        /* STATS GRID */
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 40px; }
        .stat-box { background: white; padding: 30px; border-radius: 16px; display: flex; align-items: center; gap: 25px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); border: 1px solid #f1f5f9; transition: transform 0.2s; }
        .stat-box:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }
        
        .s-icon { width: 64px; height: 64px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.8rem; }
        .blue-theme .s-icon { background: #eff6ff; color: #3b82f6; }
        .purple-theme .s-icon { background: #f5f3ff; color: #8b5cf6; }
        
        .stat-box h2 { margin: 0; font-size: 2.2rem; color: #0f172a; font-weight: 800; line-height: 1; }
        .stat-box p { margin: 5px 0 0; color: #64748b; font-weight: 500; font-size: 0.95rem; }

        /* LISTS */
        .lists-container { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
        .list-card { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        
        .card-head { padding: 20px 25px; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; background: #fafbfc; }
        .card-head h3 { margin: 0; font-size: 1.1rem; color: #334155; font-weight: 700; }
        .view-more-btn { background: none; border: none; color: #3b82f6; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; font-size: 0.9rem; transition: 0.2s; }
        .view-more-btn:hover { gap: 10px; }
        
        .list-body { padding: 15px; }
        .list-item { display: flex; align-items: center; gap: 15px; padding: 12px 15px; border-radius: 10px; transition: 0.2s; margin-bottom: 5px; }
        .list-item:last-child { margin-bottom: 0; }
        .list-item:hover { background: #f8fafc; }
        
        .avatar-s { width: 42px; height: 42px; background: #e0e7ff; color: #4338ca; font-weight: 700; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1rem; }
        .avatar-img { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; border: 1px solid #e2e8f0; }
        
        .details { flex: 1; }
        .details strong { display: block; font-size: 0.95rem; color: #1e293b; margin-bottom: 2px; }
        .details small { color: #64748b; font-size: 0.85rem; display: block; }
        
        .status-dot { width: 10px; height: 10px; background: #22c55e; border-radius: 50%; box-shadow: 0 0 0 3px #dcfce7; }
        .empty { padding: 30px; text-align: center; color: #94a3b8; font-style: italic; }

        .loader { display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 1.2rem; color: #64748b; }

        @media(max-width: 900px) {
          .stats-grid, .lists-container { grid-template-columns: 1fr; }
        }

        @media(max-width: 768px) {
          .profile-card { flex-direction: column; text-align: center; padding: 25px; }
          .meta { align-items: center; }
          .plan-info { width: 100%; box-sizing: border-box; }
          .dash-nav { padding: 15px 20px; }
        }
      `}</style>
    </div>
  );
};

export default CompanyDashboard;
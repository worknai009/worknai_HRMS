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
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useClientPagination } from "../../utils/useClientPagination";
import Pagination from "../../components/Pagination";

const HRManagement = () => {
  const { logout } = useAuth();
  const [hrs, setHrs] = useState([]);
  const [company, setCompany] = useState(null);

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

  const fetchHRs = async () => {
    try {
      setLoading(true);

      // hrs list
      const res = await API.get("/company/hrs");
      const list = res?.data?.data || res?.data;
      setHrs(Array.isArray(list) ? list : []);

      // fetch company (for limit banner)
      try {
        const prof = await API.get("/company/profile");
        const c =
          prof?.data?.company ||
          prof?.data?.data?.company ||
          prof?.data?.companyProfile ||
          null;
        setCompany(c);
      } catch {
        // ok, ignore
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load HR list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Force body background to prevent white gaps
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#050714";
    fetchHRs();
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  const maxHrAdmins =
    Number(company?.maxHrAdmins ?? company?.hrLimit ?? 0) || 0;
  const usedSlots = hrs.length;
  const isLimitReached = maxHrAdmins ? usedSlots >= maxHrAdmins : false;

  const handleOpenCreate = () => {
    if (isLimitReached) {
      toast.warning("HR limit reached. Please request upgrade from dashboard.");
      return;
    }
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

  const handleOpenEdit = (hr) => {
    setFormData({
      name: hr.name || "",
      email: hr.email || "",
      password: "",
      mobile: hr.mobile || "",
      designation: hr.designation || "HR Manager",
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
        await API.put(`/company/update-user/${selectedId}`, formData);
        toast.success("HR updated ✅");
      } else {
        // try new endpoint, fallback is same
        try {
          await API.post("/company/register-hr", formData);
        } catch {
          await API.post("/company/register-hr", formData);
        }
        toast.success("HR created 🚀");
      }

      setShowModal(false);
      fetchHRs();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Operation Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredHRs = useMemo(() => {
    const st = searchTerm.toLowerCase();
    return hrs.filter(
      (hr) =>
        (hr.name || "").toLowerCase().includes(st) ||
        (hr.email || "").toLowerCase().includes(st),
    );
  }, [hrs, searchTerm]);

  const pager = useClientPagination(filteredHRs);
  const { paginatedItems } = pager;

  return (
    <div className="hr-page">
      {/* HEADER */}
      <header className="page-header">
        <div className="title-group">
          <div className="pro-icon-container">
            <div className="pro-icon-box">
              <FaUserShield className="pro-icon" />
            </div>
            <div className="pro-icon-ring"></div>
            <div className="pro-icon-glow"></div>
          </div>
          <div>
            <h1>HR Management</h1>
            <p>Create and manage HR admin accounts with AI precision.</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="btn-add"
            onClick={handleOpenCreate}
            disabled={isLimitReached}
          >
            <FaPlus /> <span className="hide-sm">Add New HR</span>
          </button>

          <button className="logout-btn" onClick={() => logout("/")} title="Logout">
            <FaSignOutAlt /> <span className="hide-sm">Logout</span>
          </button>
        </div>
      </header>

      {maxHrAdmins ? (
        <div className={`quota glass-inner ${isLimitReached ? "warn" : ""}`}>
          <div className="qLeft">
            <span className="qIcon">
              {isLimitReached ? <FaExclamationTriangle /> : <FaCheckCircle />}
            </span>
            <div>
              <strong>
                HR Slots: {usedSlots} / {maxHrAdmins}
              </strong>
              <p>
                {isLimitReached
                  ? "Limit reached. Request upgrade from Company Dashboard."
                  : "You can add more HR admins until the limit."}
              </p>
            </div>
          </div>
        </div>
      ) : null}

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
        <div className="count-badge">
          Total: <strong>{hrs.length}</strong>
        </div>
      </div>

      {/* GRID */}
      <div className="hr-grid">
        {loading ? (
          <div className="state-msg">
            <FaSpinner className="spin" /> Loading HRs...
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <FaUserShield />
            </div>
            <h3>No HR Admins Found</h3>
            <p>Click "Add New HR" to create your first admin.</p>
          </div>
        ) : (
          paginatedItems.map((hr) => (
            <div key={hr._id} className="hr-card slide-up">
              <div className="card-top">
                <div className="avatar">
                  {hr.name?.charAt(0)?.toUpperCase() || "H"}
                </div>
                <div className="info">
                  <h3>{hr.name}</h3>
                  <span className="badge">
                    {hr.designation || "HR Manager"}
                  </span>
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

      <div style={{ marginTop: "20px", paddingRight: "1rem" }}>
        <Pagination pager={pager} />
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content zoom-in">
            <div className="modal-header">
              <h3>{isEditMode ? "Edit HR" : "Create HR Admin"}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
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
                        : "Min 6 characters"
                    }
                    required={!isEditMode}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>

                <div className="form-group full">
                  <label>Designation</label>
                  <input
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    placeholder="HR Manager"
                  />
                </div>
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

      <style>{`
        :root {
          --bg-dark: #050714;
          --glass: rgba(13, 17, 34, 0.7);
          --glass-border: rgba(255, 255, 255, 0.08);
          --accent-blue: #50c8ff;
          --accent-violet: #a78bfa;
          --text-bright: #ffffff;
          --text-dim: rgba(255, 255, 255, 0.5);
          --brand-gradient: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          --action-gradient: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
        }

        .hr-page {
          padding: 20px 15px 60px;
          background-color: #050714;
          background: radial-gradient(circle at top left, #0a0f2b 0%, #050714 50%, #080d1e 100%);
          background-attachment: fixed;
          min-height: 100vh;
          min-height: 100dvh;
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #fff;
        }

        .page-header {
          max-width: 1200px; margin: 0 auto 20px; 
          background: var(--glass); padding: 25px; border-radius: 24px; border: 1px solid var(--glass-border);
          box-shadow: 0 20px 50px rgba(0,0,0,0.3); display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap;
          backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
        }

        /* Pro Icon Boxes */
        .pro-icon-container {
          position: relative; width: 60px; height: 60px;
          display: flex; align-items: center; justify-content: center;
        }
        .pro-icon-box {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(80, 200, 255, 0.1); border: 1px solid rgba(80, 200, 255, 0.2);
          display: flex; align-items: center; justify-content: center; z-index: 2; backdrop-filter: blur(10px);
        }
        .pro-icon { font-size: 22px; color: var(--accent-blue); filter: drop-shadow(0 0 8px rgba(80, 200, 255, 0.5)); }
        .pro-icon-ring {
          position: absolute; width: 100%; height: 100%;
          border: 2px dashed rgba(80, 200, 255, 0.2); border-radius: 18px;
          animation: spinRing 20s linear infinite;
        }
        .pro-icon-glow {
          position: absolute; width: 40px; height: 40px;
          background: var(--accent-blue); filter: blur(30px); opacity: 0.2; z-index: 1;
        }
        @keyframes spinRing { to { transform: rotate(360deg); } }

        .title-group h1 { 
          margin: 0; font-size: 1.8rem; font-weight: 900; 
          background: var(--brand-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .title-group p { margin: 4px 0 0; color: var(--text-dim); font-weight: 600; font-size: 0.95rem; }

        .header-actions { display: flex; gap: 12px; align-items: center; }
        .btn-add {
          background: var(--action-gradient); color: #fff; border: none; padding: 14px 24px; border-radius: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px;
          transition: 0.3s cubic-bezier(0.165, 0.84, 0.44, 1); box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }
        .btn-add:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(139, 92, 246, 0.5); filter: brightness(1.1); }
        .btn-add:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

        .logout-btn {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444;
          padding: 14px 24px; border-radius: 16px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px;
          transition: 0.3s;
        }
        .logout-btn:hover { background: rgba(239, 68, 68, 0.2); transform: translateY(-3px); box-shadow: 0 10px 20px rgba(239, 68, 68, 0.15); }

        .quota {
          max-width: 1200px; margin: 0 auto 20px; 
          background: rgba(255, 255, 255, 0.02); border: 1px solid var(--glass-border); border-radius: 20px; padding: 16px 20px; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.1); backdrop-filter: blur(10px);
        }
        .quota.warn { border-color: rgba(245, 158, 11, 0.2); background: rgba(245, 158, 11, 0.03); }
        .qLeft { display: flex; gap: 12px; align-items: center; }
        .qIcon { width: 40px; height: 40px; border-radius: 12px; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; color: #10b981; font-size: 1rem; flex-shrink: 0; }
        .quota.warn .qIcon { color: #f59e0b; background: rgba(245, 158, 11, 0.05); }
        .quota strong { display: block; font-weight: 800; color: #fff; font-size: 0.95rem; }
        .quota p { margin: 2px 0 0; color: var(--text-dim); font-weight: 600; font-size: 0.78rem; line-height: 1.4; }

        .controls-row { max-width: 1200px; margin: 0 auto 20px; display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; }
        .search-box {
          flex: 1; min-width: 300px; max-width: 450px; background: var(--glass); border: 1px solid var(--glass-border); border-radius: 18px;
          display: flex; align-items: center; padding: 0 16px; transition: 0.3s;
        }
        .search-box:focus-within { border-color: var(--accent-blue); box-shadow: 0 0 20px rgba(80, 200, 255, 0.15); }
        .search-box input { border: none; padding: 14px; outline: none; flex: 1; font-size: 1rem; background: transparent; color: #fff; }
        .search-box .icon { color: var(--accent-blue); }
        .count-badge { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); padding: 8px 16px; border-radius: 12px; color: var(--text-dim); font-weight: 800; font-size: 0.8rem; }
        .count-badge strong { color: var(--accent-blue); }

        .hr-grid {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px;
        }
        .hr-card {
          background: var(--glass); border: 1px solid var(--glass-border); border-radius: 24px; padding: 22px; box-shadow: 0 15px 35px rgba(0,0,0,0.2);
          transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); display: flex; flex-direction: column; backdrop-filter: blur(10px);
        }
        .hr-card:hover { transform: translateY(-8px); border-color: var(--accent-blue); box-shadow: 0 20px 50px rgba(80, 200, 255, 0.15); }
        
        .card-top { display: flex; align-items: center; gap: 18px; margin-bottom: 18px; padding-bottom: 18px; border-bottom: 1px solid var(--glass-border); }
        .avatar {
          width: 60px; height: 60px; border-radius: 18px; 
          background: linear-gradient(135deg, rgba(80, 200, 255, 0.2), rgba(167, 139, 250, 0.2)); 
          color: var(--accent-blue); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.5rem;
          border: 1px solid rgba(80, 200, 255, 0.3); box-shadow: 0 8px 16px rgba(0,0,0,0.3);
        }
        .info h3 { margin: 0; font-size: 1.25rem; font-weight: 900; color: #fff; }
        .badge { display: inline-block; font-size: 0.75rem; background: rgba(80, 200, 255, 0.15); color: var(--accent-blue); padding: 6px 12px; border-radius: 12px; margin-top: 8px; font-weight: 800; border: 1px solid rgba(80, 200, 255, 0.1); }
        
        .card-body { margin-bottom: 18px; flex: 1; }
        .info-row { display: flex; align-items: center; gap: 12px; color: var(--text-dim); margin-bottom: 12px; font-size: 0.95rem; font-weight: 600; }
        .info-row svg { color: var(--accent-blue); opacity: 0.7; }

        .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
        .status-pill.active { background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 8px 14px; border-radius: 999px; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(16, 185, 129, 0.2); }
        .btn-edit {
          background: rgba(255, 255, 255, 0.04); border: 1px solid var(--glass-border); color: var(--accent-blue); padding: 10px 18px; border-radius: 14px; cursor: pointer;
          display: flex; align-items: center; gap: 10px; font-weight: 800; transition: 0.3s; font-size: 0.9rem;
        }
        .btn-edit:hover { background: var(--accent-blue); color: #fff; border-color: var(--accent-blue); transform: scale(1.05); }

        .state-msg, .empty-state { grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-dim); font-weight: 800; background: var(--glass); border: 1px dashed var(--glass-border); border-radius: 24px; font-size: 1.1rem; }
        .empty-icon { font-size: 3.5rem; margin-bottom: 15px; background: var(--brand-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; opacity: 0.5; }
        .spin { animation: spin 1s linear infinite; color: var(--accent-blue); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .slide-up { animation: slideUp 0.5s cubic-bezier(0.165, 0.84, 0.44, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(5, 7, 20, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .modal-content { background: #080d1e; border: 1px solid var(--glass-border); border-radius: 28px; width: 100%; max-width: 650px; padding: 35px; box-shadow: 0 40px 100px rgba(0,0,0,0.5); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .modal-header h3 { margin: 0; font-size: 1.5rem; font-weight: 900; background: var(--brand-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .close-btn { background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); width: 44px; height: 44px; border-radius: 14px; cursor: pointer; color: var(--text-dim); transition: 0.3s; }
        .close-btn:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: #ef4444; }
        
        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group label { font-weight: 700; color: var(--text-dim); font-size: 0.85rem; display: block; margin-bottom: 8px; }
        .form-group input {
          width: 100%; box-sizing: border-box; border: 1px solid var(--glass-border); border-radius: 14px; padding: 14px; outline: none; font-weight: 600; background: rgba(255, 255, 255, 0.03); color: #fff; transition: 0.3s;
        }
        .form-group input:focus { border-color: var(--accent-blue); background: rgba(80, 200, 255, 0.05); box-shadow: 0 0 15px rgba(80, 200, 255, 0.2); }
        
        .submit-btn {
          width: 100%; margin-top: 25px; border: none; border-radius: 16px; padding: 16px; 
          background: var(--action-gradient); color: #fff; font-weight: 800; cursor: pointer; transition: 0.3s;
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }
        .submit-btn:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(139, 92, 246, 0.5); filter: brightness(1.1); }
        .zoom-in { animation: zoomIn 0.3s cubic-bezier(0.165, 0.84, 0.44, 1); }
        @keyframes zoomIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }

        @media (max-width: 640px) {
          .hr-page { padding: 15px 12px 40px; }
          .page-header { padding: 18px; border-radius: 18px; flex-direction: column; align-items: center; text-align: center; gap: 15px; }
          .pro-icon-container { margin: 0 auto; width: 50px; height: 50px; }
          .pro-icon-box { width: 42px; height: 42px; }
          .pro-icon { font-size: 20px; }
          .title-group h1 { font-size: 1.5rem; }
          .title-group p { font-size: 0.8rem; }
          
          .header-actions { width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .btn-add, .logout-btn { width: 100%; justify-content: center; padding: 12px; font-size: 0.9rem; }
          .hide-sm { display: none; }

          .quota { padding: 15px; border-radius: 16px; margin-bottom: 15px; }
          .qIcon { width: 38px; height: 38px; font-size: 1rem; }
          .quota strong { font-size: 0.95rem; }

          .controls-row { flex-direction: column; gap: 12px; align-items: stretch; margin-bottom: 15px; }
          .search-box { min-width: 0; max-width: none; width: 100%; border-radius: 14px; }
          .search-box input { padding: 12px; font-size: 0.9rem; }
          .count-badge { text-align: center; padding: 6px; font-size: 0.72rem; border-radius: 10px; border-style: dashed; }

          .hr-grid { grid-template-columns: 1fr; gap: 15px; }
          .hr-card { padding: 18px; border-radius: 20px; }
          .avatar { width: 50px; height: 50px; font-size: 1.2rem; border-radius: 14px; }
          .info h3 { font-size: 1.1rem; }
          .badge { font-size: 0.7rem; padding: 5px 10px; }
          .info-row { font-size: 0.85rem; gap: 10px; }
          .card-footer { gap: 10px; }
          .status-pill { padding: 6px 10px; font-size: 0.7rem; }
          .btn-edit { padding: 8px 14px; font-size: 0.8rem; }
          
          .form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default HRManagement;

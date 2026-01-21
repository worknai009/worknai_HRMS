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
} from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";
import Pagination from "../../components/Pagination";

const HRManagement = () => {
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
    fetchHRs();
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
          <div className="icon-box">
            <FaUserShield />
          </div>
          <div>
            <h1>HR Management</h1>
            <p>Create and manage HR admin accounts.</p>
          </div>
        </div>

        <button
          className="btn-add"
          onClick={handleOpenCreate}
          disabled={isLimitReached}
        >
          <FaPlus /> Add New HR
        </button>
      </header>

      {maxHrAdmins ? (
        <div className={`quota ${isLimitReached ? "warn" : ""}`}>
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
        :root{--bg:#f8fafc;--card:#fff;--text:#0f172a;--muted:#64748b;--border:#e2e8f0;--primary:#2563eb;--shadow:0 10px 30px rgba(15,23,42,.06)}
        .hr-page{padding:22px 16px;background:var(--bg);min-height:100vh;font-family:Inter,system-ui,Segoe UI,Arial,sans-serif}
        .page-header{
          max-width:1200px;margin:0 auto 12px;background:var(--card);padding:16px;border-radius:16px;border:1px solid var(--border);
          box-shadow:var(--shadow);display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap
        }
        .title-group{display:flex;gap:12px;align-items:center}
        .icon-box{width:48px;height:48px;background:#eff6ff;color:var(--primary);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem}
        .title-group h1{margin:0;font-size:1.35rem;font-weight:1000}
        .title-group p{margin:2px 0 0;color:var(--muted);font-weight:700;font-size:.9rem}
        .btn-add{
          background:var(--primary);color:#fff;border:none;padding:12px 16px;border-radius:14px;font-weight:1000;cursor:pointer;display:flex;align-items:center;gap:10px;
          transition:.2s
        }
        .btn-add:hover{filter:brightness(1.05);transform:translateY(-1px)}
        .btn-add:disabled{opacity:.6;cursor:not-allowed;transform:none}

        .quota{
          max-width:1200px;margin:0 auto 12px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:16px;padding:12px 14px;box-shadow:var(--shadow)
        }
        .quota.warn{background:#fffbeb;border-color:#fde68a}
        .qLeft{display:flex;gap:12px;align-items:center}
        .qIcon{width:42px;height:42px;border-radius:14px;background:#fff;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;color:#059669}
        .quota.warn .qIcon{color:#b45309}
        .quota strong{display:block;font-weight:1000}
        .quota p{margin:2px 0 0;color:var(--muted);font-weight:700}

        .controls-row{max-width:1200px;margin:0 auto 12px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
        .search-box{
          flex:1;min-width:260px;max-width:420px;background:var(--card);border:1px solid var(--border);border-radius:14px;
          display:flex;align-items:center;padding:0 12px;transition:.2s
        }
        .search-box:focus-within{border-color:#93c5fd;box-shadow:0 0 0 4px rgba(59,130,246,.12)}
        .search-box input{border:none;padding:12px;outline:none;flex:1;font-size:.95rem}
        .search-box .icon{color:#94a3b8}
        .count-badge{background:var(--card);border:1px solid var(--border);padding:10px 14px;border-radius:999px;color:#334155;font-weight:900}

        .hr-grid{
          max-width:1200px;margin:0 auto;
          display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px
        }
        .hr-card{
          background:var(--card);border:1px solid var(--border);border-radius:16px;padding:14px;box-shadow:var(--shadow);
          transition:.25s;display:flex;flex-direction:column
        }
        .hr-card:hover{transform:translateY(-3px);border-color:#cfe0ff}
        .card-top{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f1f5f9}
        .avatar{
          width:50px;height:50px;border-radius:14px;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;
          display:flex;align-items:center;justify-content:center;font-weight:1000;font-size:1.2rem
        }
        .info h3{margin:0;font-size:1.05rem;font-weight:1000}
        .badge{display:inline-block;font-size:.75rem;background:#eff6ff;color:var(--primary);padding:5px 10px;border-radius:10px;margin-top:6px;font-weight:1000}
        .card-body{margin-bottom:12px;flex:1}
        .info-row{display:flex;align-items:center;gap:10px;color:var(--muted);margin-bottom:8px;font-size:.9rem;font-weight:800}
        .card-footer{display:flex;justify-content:space-between;align-items:center}
        .status-pill.active{background:#dcfce7;color:#166534;padding:7px 10px;border-radius:999px;font-size:.75rem;font-weight:1000;display:flex;align-items:center;gap:8px;border:1px solid #bbf7d0}
        .btn-edit{
          background:#fff;border:1px solid var(--border);color:var(--primary);padding:10px 12px;border-radius:12px;cursor:pointer;
          display:flex;align-items:center;gap:8px;font-weight:1000;transition:.2s
        }
        .btn-edit:hover{background:#eff6ff;border-color:#cfe0ff}

        .state-msg,.empty-state{grid-column:1/-1;text-align:center;padding:44px;color:var(--muted);font-weight:900;background:var(--card);border:1px dashed var(--border);border-radius:16px}
        .empty-icon{font-size:3rem;margin-bottom:8px;opacity:.25}
        .spin{animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}
        .slide-up{animation:slideUp .25s ease-out}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        /* Modal */
        .modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:18px;backdrop-filter:blur(6px)}
        .modal-content{background:#fff;border:1px solid var(--border);border-radius:18px;width:100%;max-width:620px;padding:16px;box-shadow:0 30px 80px rgba(0,0,0,.2)}
        .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .modal-header h3{margin:0;font-size:1.15rem;font-weight:1000}
        .close-btn{background:#fff;border:1px solid var(--border);width:40px;height:40px;border-radius:12px;cursor:pointer;color:#64748b}
        .close-btn:hover{background:#f1f5f9}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .form-group{display:flex;flex-direction:column;gap:6px}
        .form-group.full{grid-column:1/-1}
        .form-group label{font-weight:900;color:#334155;font-size:.9rem}
        .form-group input{border:1px solid var(--border);border-radius:12px;padding:11px 12px;outline:none;font-weight:700}
        .form-group input:focus{border-color:#93c5fd;box-shadow:0 0 0 4px rgba(59,130,246,.12)}
        .submit-btn{
          width:100%;margin-top:12px;border:none;border-radius:12px;padding:12px;background:var(--primary);color:#fff;font-weight:1000;cursor:pointer;transition:.2s
        }
        .submit-btn:hover{filter:brightness(1.05);transform:translateY(-1px)}
        .submit-btn:disabled{opacity:.65;cursor:not-allowed;transform:none}
        .zoom-in{animation:zoomIn .18s ease-out}
        @keyframes zoomIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}

        @media (max-width: 560px){
          .page-header{align-items:flex-start}
          .search-box{min-width:0;max-width:none}
          .form-grid{grid-template-columns:1fr}
        }
      `}</style>
    </div>
  );
};

export default HRManagement;

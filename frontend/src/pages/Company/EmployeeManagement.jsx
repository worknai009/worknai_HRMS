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
  FaUserTag,
  FaClock,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";
import Pagination from "../../components/Pagination";

import { getAssetUrl } from "../../utils/assetUrl";

const pickStatus = (emp) => {
  // ✅ supports multiple backend styles
  if (emp?.status) return String(emp.status);
  if (typeof emp?.isApproved === "boolean")
    return emp.isApproved ? "Active" : "Pending";
  if (typeof emp?.approved === "boolean")
    return emp.approved ? "Active" : "Pending";
  return "Active";
};

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState("All"); // All | Active | Pending

  // Modal State
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
      // new backend might give {data: []} or [] directly
      const res = await API.get("/company/employees");
      const list = res?.data?.data || res?.data;
      setEmployees(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Force body background to prevent white gaps
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#050714";
    fetchEmployees();
    return () => {
      document.body.style.backgroundColor = originalBg;
    };
  }, []);

  const handleOpenEdit = (emp) => {
    setFormData({
      name: emp.name || "",
      email: emp.email || "",
      password: "",
      mobile: emp.mobile || "",
      designation: emp.designation || emp.role || "",
    });
    setSelectedId(emp._id);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      // If backend ignores empty password => safe
      await API.put(`/company/update-user/${selectedId}`, formData);
      toast.success("Employee updated ✅");
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update Failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredEmployees = useMemo(() => {
    const st = searchTerm.toLowerCase();
    return employees
      .filter((emp) => {
        const status = pickStatus(emp);
        if (tab === "Active" && status !== "Active") return false;
        if (tab === "Pending" && status !== "Pending") return false;
        return true;
      })
      .filter(
        (emp) =>
          (emp.name || "").toLowerCase().includes(st) ||
          (emp.email || "").toLowerCase().includes(st),
      );
  }, [employees, searchTerm, tab]);

  const totalActive = useMemo(
    () => employees.filter((e) => pickStatus(e) === "Active").length,
    [employees],
  );
  const totalPending = useMemo(
    () => employees.filter((e) => pickStatus(e) === "Pending").length,
    [employees],
  );

  const {
    paginatedItems,
    startIndex,
    endIndex,
    totalItems,
    next,
    prev,
    canNext,
    canPrev,
    page,
    totalPages,
    goToPage,
  } = useClientPagination(filteredEmployees);

  const pager = {
    page,
    totalPages,
    goToPage,
    next,
    prev,
    canNext,
    canPrev,
    startIndex,
    endIndex,
    totalItems,
  };

  return (
    <div className="emp-page">
      <header className="page-header">
        <div className="title-group">
          <div className="pro-icon-container">
            <div className="pro-icon-box blue-theme">
              <FaUsers className="pro-icon" />
            </div>
            <div className="pro-icon-ring"></div>
            <div className="pro-icon-glow"></div>
          </div>
          <div>
            <h1>Employee Directory</h1>
            <p>View, search and update employee details with precision.</p>
          </div>
        </div>
      </header>

      <div className="top-row">
        <div className="tabs">
          <button
            className={tab === "All" ? "active" : ""}
            onClick={() => setTab("All")}
          >
            All <span className="count">{employees.length}</span>
          </button>
          <button
            className={tab === "Active" ? "active" : ""}
            onClick={() => setTab("Active")}
          >
            Active <span className="count">{totalActive}</span>
          </button>
          <button
            className={tab === "Pending" ? "active" : ""}
            onClick={() => setTab("Pending")}
          >
            Pending <span className="count">{totalPending}</span>
          </button>
        </div>

        <div className="search-box">
          <FaSearch className="icon" />
          <input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="emp-grid">
        {loading ? (
          <div className="loader-container">
            <FaSpinner className="spin" /> Loading Directory...
          </div>
        ) : paginatedItems.length === 0 ? (
          <div className="empty-state">No Employees Found.</div>
        ) : (
          paginatedItems.map((emp) => {
            const status = pickStatus(emp);
            return (
              <div key={emp._id} className="emp-card slide-up">
                <div className="card-top">
                  <div className="top-main">
                    <img
                      src={
                        getAssetUrl(emp.profileImage) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`
                      }
                      alt="Profile"
                      className="avatar-img"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`;
                      }}
                    />
                    <div className="info">
                      <div className="name-row">
                        <h3>{emp.name}</h3>
                        <span className={`status-pill ${status.toLowerCase()}`}>
                          {status === "Pending" ? <FaClock size={8} /> : <FaCheckCircle size={8} />}
                          {status}
                        </span>
                      </div>
                      <span className="badge">
                        <FaUserTag size={10} />{" "}
                        {emp.designation || emp.role || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="card-details">
                  <div>
                    <FaEnvelope className="icon-sm" /> {emp.email}
                  </div>
                  <div>
                    <FaPhone className="icon-sm" /> {emp.mobile || "N/A"}
                  </div>
                </div>

                <div className="card-footer">
                  <span className="dot active">
                    <FaCircle size={8} /> Online
                  </span>
                  <button
                    className="btn-edit"
                    onClick={() => handleOpenEdit(emp)}
                  >
                    <FaEdit /> Edit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div style={{ marginTop: "20px", paddingRight: "1rem" }}>
        <Pagination pager={pager} />
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content zoom-in">
            <div className="modal-header">
              <h3>Edit Employee</h3>
              <button onClick={() => setShowModal(false)} className="close-btn">
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

                <div className="form-group full">
                  <label>Reset Password (Optional)</label>
                  <input
                    type="password"
                    placeholder="Leave empty to keep current"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? <FaSpinner className="spin" /> : "Update Changes"}
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

        .emp-page {
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
          display: flex; margin: 0 auto 20px; max-width: 1200px;
          background: var(--glass); padding: 20px; border-radius: 20px; border: 1px solid var(--glass-border);
          box-shadow: 0 20px 50px rgba(0,0,0,0.3); backdrop-filter: blur(25px); -webkit-backdrop-filter: blur(25px);
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

        .top-row { max-width: 1200px; margin: 0 auto 25px; display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
        .tabs { display: flex; gap: 12px; flex-wrap: wrap; }
        .tabs button {
          border: 1px solid var(--glass-border); background: var(--glass); border-radius: 16px; padding: 12px 18px;
          font-weight: 700; cursor: pointer; color: #fff; display: flex; gap: 10px; align-items: center; transition: 0.3s;
        }
        .tabs button.active { border-color: var(--accent-blue); background: rgba(80, 200, 255, 0.12); color: var(--accent-blue); }
        .tabs .count { background: rgba(80, 200, 255, 0.1); color: var(--accent-blue); padding: 2px 8px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; }

        .search-box {
          margin-left: auto; min-width: 300px; flex: 1; max-width: 450px;
          background: var(--glass); border: 1px solid var(--glass-border); border-radius: 18px;
          display: flex; align-items: center; padding: 0 16px; transition: 0.3s;
        }
        .search-box:focus-within { border-color: var(--accent-blue); box-shadow: 0 0 20px rgba(80, 200, 255, 0.15); }
        .search-box input { border: none; padding: 14px; outline: none; flex: 1; font-size: 1rem; background: transparent; color: #fff; }
        .search-box .icon { color: var(--accent-blue); font-size: 1.1rem; }

        .emp-grid {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .emp-card {
          background: var(--glass); border-radius: 24px; border: 1px solid var(--glass-border);
          padding: 22px; transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); display: flex; flex-direction: column;
          box-shadow: 0 15px 35px rgba(0,0,0,0.2); backdrop-filter: blur(10px);
          min-height: 320px; /* Fixed min-height for uniform cards */
        }
        .emp-card:hover { transform: translateY(-8px); border-color: var(--accent-blue); box-shadow: 0 20px 50px rgba(80, 200, 255, 0.15); }
        
        .card-top { margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--glass-border); }
        .top-main { display: flex; align-items: flex-start; gap: 16px; }
        .avatar-img { width: 64px; height: 64px; border-radius: 18px; object-fit: cover; border: 2px solid var(--glass-border); flex-shrink: 0; }
        
        .name-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; width: 100%; }
        .name-row h3 { 
          margin: 0; font-size: 1.1rem; color: #fff; font-weight: 900; 
          flex: 1; min-width: 0; white-space: normal; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
        }

        .status-pill {
          font-size: 0.65rem; font-weight: 900; border-radius: 8px; padding: 4px 8px;
          display: flex; align-items: center; gap: 5px; border: 1px solid var(--glass-border);
          text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0; margin-top: 2px;
        }
        .status-pill.active { background: rgba(16, 185, 129, 0.12); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
        .status-pill.pending { background: rgba(245, 158, 11, 0.12); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }

        .card-details { flex: 1; margin-bottom: 20px; display: flex; flex-direction: column; gap: 12px; justify-content: center; }
        .card-details div { 
          display: flex; align-items: center; gap: 12px; color: var(--text-dim); 
          font-size: 0.9rem; font-weight: 600; 
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .icon-sm { color: var(--accent-blue); opacity: 0.7; }

        .card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: auto; }
        .dot.active { background: rgba(16, 163, 74, 0.1); color: #22c55e; padding: 8px 14px; border-radius: 999px; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(34, 197, 94, 0.2); }
        
        .btn-edit {
          background: rgba(255, 255, 255, 0.04); border: 1px solid var(--glass-border); color: var(--accent-blue);
          padding: 10px 18px; border-radius: 14px; cursor: pointer; font-size: 0.9rem;
          display: flex; align-items: center; gap: 10px; transition: 0.3s; font-weight: 800;
        }
        .btn-edit:hover { background: var(--accent-blue); color: #fff; border-color: var(--accent-blue); transform: scale(1.05); }

        .loader-container, .empty-state {
          grid-column: 1/-1; text-align: center; padding: 60px; color: var(--text-dim); font-weight: 800;
          background: var(--glass); border: 1px dashed var(--glass-border); border-radius: 24px;
          display: flex; align-items: center; justify-content: center; gap: 12px; font-size: 1.2rem;
        }
        .spin { animation: spin 1s infinite linear; color: var(--accent-blue); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .slide-up { animation: slideUp 0.5s cubic-bezier(0.165, 0.84, 0.44, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(5, 7, 20, 0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .modal-content { background: #080d1e; border: 1px solid var(--glass-border); border-radius: 28px; width: 100%; max-width: 600px; padding: 35px; box-shadow: 0 40px 100px rgba(0,0,0,0.5); }
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
          .emp-page { padding: 15px 12px 40px; }
          .page-header { padding: 15px; margin-bottom: 15px; border-radius: 16px; }
          .title-group { flex-direction: column; text-align: center; gap: 10px; }
          .pro-icon-container { margin: 0 auto; width: 50px; height: 50px; }
          .pro-icon-box { width: 40px; height: 40px; }
          .pro-icon { font-size: 18px; }
          .title-group h1 { font-size: 1.4rem; }
          .title-group p { font-size: 0.8rem; }

          .top-row { gap: 12px; margin-bottom: 15px; }
          .tabs { width: 100%; justify-content: center; gap: 8px; }
          .tabs button { padding: 10px 14px; font-size: 0.85rem; border-radius: 14px; }
          .search-box { margin-left: 0; max-width: none; min-width: 0; width: 100%; border-radius: 14px; }
          .search-box input { padding: 12px; font-size: 0.9rem; }

          .emp-grid { grid-template-columns: 1fr; gap: 15px; }
          .emp-card { padding: 18px; min-height: auto; border-radius: 20px; }
          .avatar-img { width: 56px; height: 56px; border-radius: 16px; }
          .name-row h3 { font-size: 0.95rem; }
          .badge { font-size: 0.72rem; padding: 5px 10px; }
          .card-details div { font-size: 0.85rem; gap: 10px; }
          .dot.active { padding: 6px 12px; font-size: 0.7rem; }
          .btn-edit { padding: 8px 14px; font-size: 0.8rem; }
        }
      `}</style>
    </div>
  );
};

export default EmployeeManagement;

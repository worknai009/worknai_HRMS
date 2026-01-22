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
    fetchEmployees();
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
          <div className="icon-wrap blue">
            <FaUsers />
          </div>
          <div>
            <h1>Employee Directory</h1>
            <p>View, search and update employee details.</p>
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
                  <img
                    src={
                      getAssetUrl(emp.profileImage) ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`
                    }
                    alt="Profile"
                    className="avatar-img"
                    onError={(e) => {
                      e.target.onerror = null; // prevent loop
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`;
                    }}
                  />
                  <div className="info">
                    <h3>{emp.name}</h3>
                    <span className="badge">
                      <FaUserTag size={10} />{" "}
                      {emp.designation || emp.role || "—"}
                    </span>
                  </div>
                  <span className={`status ${status.toLowerCase()}`}>
                    {status === "Pending" ? <FaClock /> : <FaCheckCircle />}
                    {status}
                  </span>
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
        :root{
          --bg:#f8fafc; --card:#fff; --text:#0f172a; --muted:#64748b; --border:#e2e8f0;
          --primary:#2563eb; --shadow: 0 10px 30px rgba(15,23,42,.06);
        }
        .emp-page{padding:22px 16px; background:var(--bg); min-height:100vh; font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;}
        .page-header{
          display:flex; margin:0 auto 14px; max-width:1200px;
          background:var(--card); padding:16px; border-radius:16px; border:1px solid var(--border);
          box-shadow:var(--shadow);
        }
        .title-group{display:flex; gap:12px; align-items:center;}
        .icon-wrap.blue{width:48px;height:48px;background:#eff6ff;color:#3b82f6;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.4rem;}
        .title-group h1{margin:0;font-size:1.35rem;color:var(--text);font-weight:1000;}
        .title-group p{margin:2px 0 0;color:var(--muted);font-weight:700;font-size:.9rem;}

        .top-row{max-width:1200px;margin:0 auto 14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;}
        .tabs{display:flex;gap:10px;flex-wrap:wrap;}
        .tabs button{
          border:1px solid var(--border);background:var(--card);border-radius:999px;padding:10px 12px;
          font-weight:1000;cursor:pointer;color:#334155;display:flex;gap:8px;align-items:center;
        }
        .tabs button.active{border-color:#cfe0ff;background:#eff6ff;color:var(--primary)}
        .tabs .count{background:#e2e8f0;color:#334155;padding:2px 8px;border-radius:999px;font-weight:1000;font-size:.8rem}

        .search-box{
          margin-left:auto; min-width:260px; flex:1; max-width:420px;
          background:var(--card); border:1px solid var(--border); border-radius:14px;
          display:flex; align-items:center; padding:0 12px; transition:.2s;
        }
        .search-box:focus-within{border-color:#93c5fd; box-shadow:0 0 0 4px rgba(59,130,246,.12);}
        .search-box input{border:none;padding:12px;outline:none;flex:1;font-size:.95rem;}
        .search-box .icon{color:#94a3b8;}

        .emp-grid{
          max-width:1200px;margin:0 auto;
          display:grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap:12px;
        }
        .emp-card{
          background:var(--card); border-radius:16px; border:1px solid var(--border);
          padding:14px; transition:.25s; display:flex; flex-direction:column;
          box-shadow:var(--shadow);
        }
        .emp-card:hover{transform:translateY(-3px);border-color:#cfe0ff;}
        .card-top{display:flex;align-items:center;gap:12px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid #f1f5f9;position:relative;}
        .avatar-img{width:56px;height:56px;border-radius:14px;object-fit:cover;border:1px solid var(--border);}
        .info h3{margin:0;font-size:1.05rem;color:var(--text);font-weight:1000;}
        .badge{background:#f1f5f9;color:var(--muted);font-size:.75rem;padding:5px 10px;border-radius:10px;display:inline-flex;align-items:center;gap:6px;margin-top:6px;font-weight:900;}
        .status{
          position:absolute; right:0; top:0;
          font-size:.75rem; font-weight:1000; border-radius:12px; padding:6px 10px;
          display:flex; align-items:center; gap:6px; border:1px solid var(--border);
          background:#fff;
        }
        .status.pending{background:#fffbeb;color:#92400e;border-color:#fde68a;}
        .status.active{background:#ecfdf5;color:#065f46;border-color:#bbf7d0;}

        .card-details{flex:1;margin-bottom:12px;}
        .card-details div{display:flex;align-items:center;gap:10px;color:var(--muted);margin-bottom:8px;font-size:.9rem;font-weight:700;}
        .icon-sm{color:#94a3b8;}

        .card-footer{display:flex;justify-content:space-between;align-items:center;}
        .dot.active{background:#f0fdf4;color:#16a34a;padding:6px 10px;border-radius:999px;font-size:.75rem;font-weight:1000;display:flex;align-items:center;gap:8px;border:1px solid #dcfce7;}
        .btn-edit{
          background:#fff;border:1px solid var(--border);color:var(--primary);
          padding:10px 12px;border-radius:12px;cursor:pointer;font-size:.85rem;
          display:flex;align-items:center;gap:8px;transition:.2s;font-weight:1000;
        }
        .btn-edit:hover{background:#eff6ff;border-color:#cfe0ff;}

        .loader-container,.empty-state{
          grid-column:1/-1;text-align:center;padding:44px;color:var(--muted);font-weight:900;
          background:var(--card);border:1px dashed var(--border);border-radius:16px;
          display:flex;align-items:center;justify-content:center;gap:10px;
        }
        .spin{animation:spin 1s infinite linear;}
        @keyframes spin{to{transform:rotate(360deg)}}
        .slide-up{animation:slideUp .25s ease-out;}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

        /* Modal */
        .modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:18px;backdrop-filter:blur(6px)}
        .modal-content{background:#fff;border:1px solid var(--border);border-radius:18px;width:100%;max-width:560px;padding:16px;box-shadow:0 30px 80px rgba(0,0,0,.2)}
        .modal-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .modal-header h3{margin:0;font-size:1.15rem;font-weight:1000}
        .close-btn{background:#fff;border:1px solid var(--border);width:40px;height:40px;border-radius:12px;cursor:pointer;color:#64748b}
        .close-btn:hover{background:#f1f5f9}
        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .form-group{display:flex;flex-direction:column;gap:6px}
        .form-group.full{grid-column:1/-1}
        .form-group label{font-weight:900;color:#334155;font-size:.9rem}
        .form-group input{
          border:1px solid var(--border);border-radius:12px;padding:11px 12px;outline:none;font-weight:700
        }
        .form-group input:focus{border-color:#93c5fd;box-shadow:0 0 0 4px rgba(59,130,246,.12)}
        .submit-btn{
          width:100%;margin-top:12px;border:none;border-radius:12px;padding:12px;
          background:var(--primary);color:#fff;font-weight:1000;cursor:pointer;transition:.2s
        }
        .submit-btn:hover{filter:brightness(1.05);transform:translateY(-1px)}
        .submit-btn:disabled{opacity:.65;cursor:not-allowed;transform:none}
        .zoom-in{animation:zoomIn .18s ease-out}
        @keyframes zoomIn{from{opacity:0;transform:scale(.97)}to{opacity:1;transform:scale(1)}}

        @media (max-width: 560px){
          .search-box{margin-left:0;max-width:none;min-width:0}
          .form-grid{grid-template-columns:1fr}
        }
      `}</style>
    </div>
  );
};

export default EmployeeManagement;

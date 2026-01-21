
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../services/api";
import { useClientPagination } from "../../utils/useClientPagination";
import Pagination from "../../components/Pagination";
import { toast } from "react-toastify";
import {
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaEdit,
  FaSave,
  FaTimes,
  FaCalculator,
  FaCheckCircle,
  FaLaptopHouse,
  FaPlaneDeparture,
  FaClock,
  FaExclamationTriangle,
  FaSignInAlt,
  FaSignOutAlt,
  FaTasks,
  FaClipboardList,
  FaDownload,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";

/* =========================
   Helpers (No import.meta)
========================= */
const safeArr = (v) => (Array.isArray(v) ? v : []);
const safeStr = (v, fb = "") => (String(v || "").trim() ? String(v) : fb);

const tryReq = async (fnList = []) => {
  let lastErr = null;
  for (const fn of fnList) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const st = e?.response?.status;
      // only fallback if route not found / method not allowed
      if (st === 404 || st === 405) continue;
      throw e;
    }
  }
  throw lastErr || new Error("Request failed");
};

const getApiHost = () => {
  // Use axios baseURL if set, else fallback
  const base = API?.defaults?.baseURL || "";
  if (!base) return "http://localhost:5000";
  // if base ends with /api, strip it (common pattern)
  return base.replace(/\/api\/?$/i, "");
};

const getImageUrl = (path) => {
  if (!path) return "https://via.placeholder.com/150";
  const p = String(path);
  if (p.startsWith("http")) return p;

  const host = getApiHost();
  const clean = p.replace(/\\/g, "/").replace(/^\/+/, "");
  return `${host}/${clean}`;
};

const formatTime = (d) => {
  if (!d) return "--";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "--";
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (d) => {
  if (!d) return "--";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "--";
  return dt.toLocaleDateString();
};

const cls = (...arr) => arr.filter(Boolean).join(" ");

const statusClass = (s) => {
  const v = String(s || "").toLowerCase().replace(/\s+/g, "");
  if (v.includes("present") || v.includes("completed") || v.includes("punchedout") || v.includes("verified"))
    return "good";
  if (v.includes("half")) return "warn";
  if (v.includes("absent") || v.includes("unpaid") || v.includes("rejected")) return "bad";
  if (v.includes("pending")) return "pending";
  return "neutral";
};

const normalizeUser = (u) => {
  if (!u) return null;
  return {
    ...u,
    name: u.name || u.fullName || "Employee",
    email: u.email || u.workEmail || "",
    mobile: u.mobile || u.phone || "",
    designation: u.designation || u.roleTitle || u.role || "Employee",
    basicSalary: u.basicSalary ?? u.salary?.basic ?? u.salary ?? 0,
    joiningDate: u.joiningDate || u.joinedAt || u.createdAt || null,
    status: u.status || (u.isApproved || u.isActive ? "Active" : "Pending"),
    profileImage: u.profileImage || u.avatar || u.photo || "",
  };
};

const normalizeAttendance = (r) => {
  // Many backends use different keys; normalize to one schema
  return {
    _id: r._id || `${r.date || r.createdAt}-${Math.random()}`,
    date: r.date || r.day || r.createdAt,
    status: r.status || r.attendanceStatus || r.state || "—",
    mode: r.mode || r.workMode || r.attendanceMode || "",
    punchInTime: r.punchInTime || r.punchInAt || r.inTime || r.checkIn || null,
    punchOutTime: r.punchOutTime || r.punchOutAt || r.outTime || r.checkOut || null,
    netWorkHours: r.netWorkHours || r.netHours || r.totalHours || r.workHours || "--",
    plannedTasks: r.plannedTasks || r.morningPlan || r.plan || r.todayPlan || "",
    dailyReport: r.dailyReport || r.eodReport || r.report || r.endOfDayReport || "",
  };
};

const normalizeLeave = (l) => ({
  _id: l._id,
  leaveType: l.leaveType || l.type || "Paid",
  startDate: l.startDate || l.from || l.start || null,
  endDate: l.endDate || l.to || l.end || null,
  reason: l.reason || l.message || "",
  status: l.status || "Pending",
});

/* =========================
   Component
========================= */
const HrAdminEmployeeView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  // Data state
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [leaves, setLeaves] = useState([]);

  // Payroll state
  const [dates, setDates] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split("T")[0],
  });
  const [payrollStats, setPayrollStats] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Salary slip download
  const [downloading, setDownloading] = useState(false);

  // Manual Attendance
  const [manualDate, setManualDate] = useState(new Date().toISOString().split("T")[0]);
  const [manualStatus, setManualStatus] = useState("Present");
  const [inTime, setInTime] = useState("");
  const [outTime, setOutTime] = useState("");

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    mobile: "",
    designation: "",
    basicSalary: "",
    joiningDate: "",
  });

  // UI filters
  const [search, setSearch] = useState("");

  const attendancePager = useClientPagination(history);
  const leavesPager = useClientPagination(leaves);

  // const [showAll, setShowAll] = useState(false); // Removed client-side showAll

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchEmployeeKundali();
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, search]);

  const fetchEmployeeKundali = async () => {
    try {
      setLoading(true);

      // 1) Attendance History
      // Tried multiple endpoints to ensure backward compatibility
      const q = `?search=${encodeURIComponent(search)}`;
      let histRes = null;
      let historyData = [];

      try {
        // Parallel attempt: standard attendance route first
        histRes = await tryReq([
          () => API.get(`/attendance/history/${userId}${q}`),
          () => API.get(`/hr/history/${userId}${q}`),
        ]);

        // Normalize data based on response structure
        if (Array.isArray(histRes)) {
          historyData = histRes;
        } else if (Array.isArray(histRes?.data)) {
          historyData = histRes.data;
        } else if (Array.isArray(histRes?.history)) {
          historyData = histRes.history;
        } else if (Array.isArray(histRes?.data?.history)) {
          historyData = histRes.data.history;
        } else if (histRes && typeof histRes === 'object') {
          // If it's a single record or unexpected object, start with empty
          // But if it has a 'user' key, we might extract user later
          if (histRes.user) setUser(normalizeUser(histRes.user));
          if (Array.isArray(histRes.attendance)) historyData = histRes.attendance;
        }

      } catch (e) {
        console.warn("History request failed", e);
      }

      // Sort by date desc
      const sortedHistory = historyData
        .map(normalizeAttendance)
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      setHistory(sortedHistory);


      // 2) User Profile
      if (!user) {
        // If user wasn't in history response, fetch explicitly
        try {
          const userRes = await tryReq([
            () => API.get(`/company/employee/${userId}`),
            () => API.get(`/company/employees/${userId}`),
            () => API.get(`/hr/employee/${userId}`)
          ]);
          const u = normalizeUser(userRes?.data?.user || userRes?.data);
          if (u) setUser(u);
        } catch (e) { console.warn("User fetch warning", e); }
      }

      // 3) Leaves
      try {
        const leaveRes = await tryReq([
          () => API.get(`/company/leaves/employee/${userId}`),
          () => API.get(`/leaves/employee/${userId}`),
        ]);
        const lv = safeArr(leaveRes?.data || leaveRes).map(normalizeLeave);
        setLeaves(lv);
      } catch {
        setLeaves([]);
      }

      // 4) Initialize edit form if user loaded
      const finalUser = user || (histRes?.user ? normalizeUser(histRes.user) : null);
      if (finalUser) {
        if (!user) setUser(finalUser);
        setEditForm({
          name: finalUser.name || "",
          mobile: finalUser.mobile || "",
          designation: finalUser.designation || "",
          basicSalary: finalUser.basicSalary || "",
          joiningDate: finalUser.joiningDate ? String(finalUser.joiningDate).split("T")[0] : "",
        });
      }

    } catch (err) {
      console.error("fetchEmployeeKundali Error:", err);
      toast.error("Failed to load full details");
    } finally {
      setLoading(false);
    }
  };


  /* ================= ACTIONS ================= */

  const handleUpdate = async () => {
    try {
      await tryReq([
        () => API.put(`/company/employee/${userId}`, editForm),
        () => API.put(`/company/employees/${userId}`, editForm),
        () => API.put(`/hr/employee/${userId}`, editForm),
      ]);

      toast.success("Profile Updated Successfully");
      setUser((prev) => (prev ? { ...prev, ...editForm } : prev));
      setIsEditing(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update Failed");
    }
  };

  const calculateSalary = async () => {
    try {
      setCalculating(true);

      const res = await tryReq([
        () => API.get(`/company/payroll/${userId}?startDate=${dates.startDate}&endDate=${dates.endDate}`),
        () => API.get(`/hr/payroll/${userId}?startDate=${dates.startDate}&endDate=${dates.endDate}`),
      ]);

      setPayrollStats(res.data);
      toast.success("Salary Calculated");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Calculation Error");
    } finally {
      setCalculating(false);
    }
  };

  const downloadSalarySlip = async () => {
    if (!userId) return;
    try {
      setDownloading(true);

      const res = await tryReq([
        () =>
          API.get(`/company/payroll/salary-slip/${userId}?startDate=${dates.startDate}&endDate=${dates.endDate}`, {
            responseType: "blob",
          }),
        () =>
          API.get(`/hr/payroll/salary-slip/${userId}?startDate=${dates.startDate}&endDate=${dates.endDate}`, {
            responseType: "blob",
          }),
      ]);

      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Salary_Slip_${userId}_${dates.startDate}_${dates.endDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Salary slip downloaded ✅");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to download salary slip");
    } finally {
      setDownloading(false);
    }
  };

  // ✅ Manual Attendance: empty time → backend company defaults
  const markManualAttendance = async () => {
    try {
      if (!user?._id) return toast.warning("User not loaded");

      const payload = {
        userId: user._id,
        date: manualDate,
        status: manualStatus,
        inTime: manualStatus === "Present" || manualStatus === "HalfDay" ? (inTime || undefined) : undefined,
        outTime: manualStatus === "Present" || manualStatus === "HalfDay" ? (outTime || undefined) : undefined,
        remarks: "Marked manually by HR",
        method: "MANUAL_HR", // ✅ new backend style
      };

      await tryReq([
        () => API.post("/attendance/manual", payload),
        () => API.post("/company/attendance/manual", payload),
        () => API.post("/hr/attendance/manual", payload),
      ]);

      toast.success("Attendance Updated Successfully ✅");
      setInTime("");
      setOutTime("");
      fetchEmployeeKundali();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to mark attendance");
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await tryReq([
        () => API.put("/leaves/update-status", { leaveId, status }),
        () => API.put("/company/leaves/update-status", { leaveId, status }),
      ]);
      toast.success(`Request ${status}`);
      fetchEmployeeKundali();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Action failed");
    }
  };

  /* ================= DERIVED STATS ================= */
  const stats = useMemo(() => {
    const h = safeArr(history);
    const lv = safeArr(leaves);

    const modeStr = (r) => String(r?.mode || "").toLowerCase();
    const statusStr = (r) => String(r?.status || "").toLowerCase();

    const isWFH = (r) => modeStr(r).includes("wfh");

    const isLeaveDay = (r) => {
      const s = statusStr(r);
      const m = modeStr(r);
      return s.includes("leave") || m.includes("paid leave");
    };

    const isHoliday = (r) => statusStr(r).includes("holiday") || modeStr(r).includes("holiday");

    const isAbsent = (r) => {
      const s = statusStr(r);
      const m = modeStr(r);
      return s.includes("absent") || m.includes("unpaid");
    };

    const isPresent = (r) => {
      if (isWFH(r) || isLeaveDay(r) || isHoliday(r) || isAbsent(r)) return false;
      const s = statusStr(r);
      return s.includes("present") || s.includes("completed") || s.includes("halfday") || s === "halfday";
    };

    const wfhCount = h.filter(isWFH).length;
    const approvedLeavesCount = lv.filter((l) => String(l?.status || "").toLowerCase() === "approved").length;
    const totalPresent = h.filter(isPresent).length;
    const totalAbsent = h.filter(isAbsent).length;

    return { wfhCount, approvedLeavesCount, totalPresent, totalAbsent };
  }, [history, leaves]);


  // Removed filteredHistory (using server-side search/pagination)

  if (loading || !user) {
    return (
      <div className="loader-screen">
        <div className="spinner"></div>
        <div className="ld-text">Loading employee…</div>
        <style>{`
          .loader-screen{min-height:70vh;display:grid;place-items:center;gap:10px;}
          .spinner{width:46px;height:46px;border-radius:50%;border:4px solid #e5e7eb;border-top-color:#ea580c;animation:spin 1s linear infinite;}
          .ld-text{color:#6b7280;font-weight:900}
          @keyframes spin{to{transform:rotate(360deg)}}
          .pagination-controls {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
          }
          .pg-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #fff;
            border: 1px solid #e2e8f0;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            color: #64748b;
            transition: all 0.2s;
          }
          .pg-btn:hover:not(:disabled) {
            border-color: #cbd5e1;
            color: #334155;
          }
          .pg-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="view-page slide-up">
      {/* HEADER */}
      <header className="view-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>

          <div className="title-box">
            <h2>{user.name}</h2>
            <span className="subtitle">
              ID: {String(user._id).substring(String(user._id).length - 6).toUpperCase()}
            </span>
          </div>
        </div>

        <div className="header-right">
          <span className={cls("status-badge", user.status === "Active" ? "active" : "inactive")}>
            {user.status}
          </span>
        </div>
      </header>

      <div className="grid-layout">
        {/* LEFT */}
        <aside className="left-panel">
          {/* PROFILE */}
          <div className="modern-card profile-card">
            <div className="profile-img-container">
              <img
                src={getImageUrl(user.profileImage)}
                alt="Profile"
                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
              />
            </div>

            {!isEditing ? (
              <div className="profile-info">
                <span className="designation-badge">{user.designation}</span>

                <div className="info-list">
                  <div className="info-item">
                    <FaEnvelope className="icon" /> {user.email || "—"}
                  </div>
                  <div className="info-item">
                    <FaPhone className="icon" /> {user.mobile || "—"}
                  </div>
                  <div className="info-item">
                    <FaCalendarAlt className="icon" /> Joined: {formatDate(user.joiningDate)}
                  </div>
                  <div className="info-item salary">
                    <FaMoneyBillWave className="icon" /> ₹{Number(user.basicSalary || 0).toLocaleString()} / mo
                  </div>
                </div>

                <button className="btn-outline-primary full-width" onClick={() => setIsEditing(true)}>
                  <FaEdit /> Edit Profile
                </button>
              </div>
            ) : (
              <div className="edit-form animate-fade">
                <div className="form-group">
                  <label>Full Name</label>
                  <input value={safeStr(editForm.name)} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Mobile Number</label>
                  <input value={safeStr(editForm.mobile)} onChange={(e) => setEditForm({ ...editForm, mobile: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Designation</label>
                  <input value={safeStr(editForm.designation)} onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Basic Salary</label>
                  <input
                    type="number"
                    value={editForm.basicSalary ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, basicSalary: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Joining Date</label>
                  <input
                    type="date"
                    value={safeStr(editForm.joiningDate)}
                    onChange={(e) => setEditForm({ ...editForm, joiningDate: e.target.value })}
                  />
                </div>

                <div className="btn-group">
                  <button className="btn-primary" onClick={handleUpdate}>
                    <FaSave /> Save
                  </button>
                  <button className="btn-secondary" onClick={() => setIsEditing(false)} title="Cancel">
                    <FaTimes />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MANUAL ATTENDANCE */}
          <div className="modern-card manual-card">
            <div className="card-header-small">
              <h4>
                <FaClock className="icon-orange" /> Manual Attendance
              </h4>
            </div>

            <div className="manual-form">
              <div className="input-group">
                <label>Date</label>
                <input type="date" value={manualDate} onChange={(e) => setManualDate(e.target.value)} />
              </div>

              <div className="input-group">
                <label>Status</label>
                <select value={manualStatus} onChange={(e) => setManualStatus(e.target.value)}>
                  <option value="Present">Present</option>
                  <option value="HalfDay">Half Day</option>
                  <option value="On Leave">Mark Paid Leave</option>
                  <option value="Absent">Mark Absent</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>

              {(manualStatus === "Present" || manualStatus === "HalfDay") && (
                <>
                  <div className="time-row-inputs">
                    <div className="input-group">
                      <label>
                        In Time <small className="text-muted">(Opt)</small>
                      </label>
                      <input type="time" value={inTime} onChange={(e) => setInTime(e.target.value)} className="input-time" />
                    </div>

                    <div className="input-group">
                      <label>
                        Out Time <small className="text-muted">(Opt)</small>
                      </label>
                      <input type="time" value={outTime} onChange={(e) => setOutTime(e.target.value)} className="input-time" />
                    </div>
                  </div>

                  <div className="helper-note">* Leave blank to use Company Default Time</div>
                </>
              )}

              <button className="btn-primary full-width" onClick={markManualAttendance}>
                Update Record
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT */}
        <main className="right-panel">
          {/* STATS */}
          <section className="stats-row">
            <div className="stat-widget">
              <div className="stat-icon green">
                <FaCheckCircle />
              </div>
              <div className="stat-data">
                <strong>{stats.totalPresent}</strong>
                <span>Present</span>
              </div>
            </div>

            <div className="stat-widget">
              <div className="stat-icon blue">
                <FaLaptopHouse />
              </div>
              <div className="stat-data">
                <strong>{stats.wfhCount}</strong>
                <span>WFH Days</span>
              </div>
            </div>

            <div className="stat-widget">
              <div className="stat-icon orange">
                <FaPlaneDeparture />
              </div>
              <div className="stat-data">
                <strong>{stats.approvedLeavesCount}</strong>
                <span>Approved Leaves</span>
              </div>
            </div>

            <div className="stat-widget">
              <div className="stat-icon red">
                <FaExclamationTriangle />
              </div>
              <div className="stat-data">
                <strong>{stats.totalAbsent}</strong>
                <span>Absent</span>
              </div>
            </div>
          </section>

          {/* PAYROLL */}
          <section className="modern-card payroll-section">
            <div className="card-header">
              <h3>
                <FaCalculator /> Salary Calculator
              </h3>

              <button
                className="btn-outline-primary mini-btn"
                onClick={downloadSalarySlip}
                disabled={downloading}
                title="Download Salary Slip PDF"
              >
                {downloading ? <FaSpinner className="spin" /> : <FaDownload />} Slip
              </button>
            </div>

            <div className="payroll-controls">
              <div className="date-group">
                <div className="input-wrap">
                  <label>From</label>
                  <input type="date" value={dates.startDate} onChange={(e) => setDates({ ...dates, startDate: e.target.value })} />
                </div>

                <div className="input-wrap">
                  <label>To</label>
                  <input type="date" value={dates.endDate} onChange={(e) => setDates({ ...dates, endDate: e.target.value })} />
                </div>
              </div>

              <button className="btn-primary btn-calc" onClick={calculateSalary} disabled={calculating}>
                {calculating ? "Calculating..." : "Calculate"}
              </button>
            </div>

            {payrollStats && (
              <div className="payroll-result animate-slide-up">
                <div className="result-grid">
                  <div className="res-box">
                    <span>Payable Days</span>
                    <strong>{payrollStats.totalPayableDays ?? payrollStats.payableDays ?? 0}</strong>
                  </div>

                  <div className="res-box">
                    <span>Paid Leaves</span>
                    <strong>{payrollStats.paidLeaveDays ?? payrollStats.paidLeaves ?? 0}</strong>
                  </div>

                  <div className="res-box">
                    <span>Holidays</span>
                    <strong>{payrollStats.holidayCount ?? payrollStats.holidays ?? 0}</strong>
                  </div>

                  <div className="res-box total">
                    <span>Net Salary</span>
                    <strong>₹{Number(payrollStats.estimatedSalary ?? payrollStats.netSalary ?? 0).toLocaleString()}</strong>
                  </div>
                </div>

                {payrollStats.breakdown ? (
                  <div className="breakdown-note">
                    <small>{payrollStats.breakdown}</small>
                  </div>
                ) : null}
              </div>
            )}
          </section>

          {/* ATTENDANCE LOG */}
          <section className="modern-card">
            <div className="card-header">
              <h3><FaClipboardList className="icon-orange" /> Attendance & Work Reports</h3>
              <div className="search">
                <input
                  type="text"
                  placeholder="Search date (YYYY-MM-DD) or status..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Timings</th>
                    <th>Morning Plan</th>
                    <th>EOD Report</th>
                    <th>Status</th>
                    <th>Net Hrs</th>
                  </tr>
                </thead>
                <tbody>
                  {attendancePager.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="empty">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    attendancePager.paginatedItems.map((raw) => {
                      const rec = normalizeAttendance(raw);
                      const st = rec.status;
                      const hasIn = !!rec.punchInTime;
                      const hasOut = !!rec.punchOutTime;

                      return (
                        <tr key={rec._id} className="hover-row">
                          <td className="date-cell-bold">{formatDate(rec.date)}</td>

                          <td>
                            <div className="punch-times">
                              <div className="time-row">
                                <FaSignInAlt className="icon-tiny text-green" />
                                {hasIn ? formatTime(rec.punchInTime) : "--:--"}
                              </div>
                              <div className="time-row">
                                <FaSignOutAlt className="icon-tiny text-red" />
                                {hasOut ? formatTime(rec.punchOutTime) : "--:--"}
                              </div>
                            </div>
                          </td>

                          <td className="report-cell">
                            {rec.plannedTasks ? (
                              <div className="report-text" title={rec.plannedTasks}>
                                {rec.plannedTasks.length > 50
                                  ? rec.plannedTasks.slice(0, 50) + "..."
                                  : rec.plannedTasks}
                              </div>
                            ) : (
                              <span className="text-muted text-sm">-</span>
                            )}
                          </td>

                          <td className="report-cell">
                            {rec.dailyReport ? (
                              <div className="report-text" title={rec.dailyReport}>
                                {rec.dailyReport.length > 50
                                  ? rec.dailyReport.slice(0, 50) + "..."
                                  : rec.dailyReport}
                              </div>
                            ) : (
                              <span className="text-muted text-sm">-</span>
                            )}
                          </td>

                          <td>
                            <span className={cls("status-pill", statusClass(st))}>
                              {st}
                            </span>
                          </td>

                          <td>
                            <strong>{rec.netWorkHours}</strong>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Simple Pagination/Limit Notice if needed */}
              <div className="section-foot">
                <Pagination pager={attendancePager} />
              </div>
            </div>
          </section>

          {/* LEAVE HISTORY */}
          <section className="modern-card">
            <div className="card-header">
              <h3>Leave History</h3>
            </div>

            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {leavesPager.paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="empty">
                        No requests found
                      </td>
                    </tr>
                  ) : (
                    leavesPager.paginatedItems.map((l) => (
                      <tr key={l._id}>
                        <td>
                          <span className={cls("type-tag", String(l.leaveType).toLowerCase() === "unpaid" ? "unpaid" : "paid")}>
                            {l.leaveType}
                          </span>
                        </td>

                        <td>
                          {formatDate(l.startDate)} ➞ {formatDate(l.endDate)}
                        </td>

                        <td className="reason-cell">{l.reason || "--"}</td>

                        <td>
                          <span className={cls("status-pill", statusClass(l.status))}>{l.status}</span>
                        </td>

                        <td>
                          {String(l.status).toLowerCase() === "pending" ? (
                            <div className="btn-group-sm">
                              <button className="btn-xs approve" onClick={() => handleLeaveAction(l._id, "Approved")}>
                                Approve
                              </button>
                              <button className="btn-xs reject" onClick={() => handleLeaveAction(l._id, "Rejected")}>
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted">Done</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="section-foot">
              <Pagination pager={leavesPager} />
            </div>
          </section>
        </main>
      </div>

      {/* STYLES */}
      <style>{`
        :root{
          --primary:#ea580c;
          --primary-hover:#c2410c;
          --bg:#f8fafc;
          --white:#ffffff;
          --text:#1e293b;
          --muted:#64748b;
          --border:#e2e8f0;
          --green:#10b981;
          --red:#ef4444;
          --blue:#3b82f6;
          --orange:#f59e0b;
        }

        .view-page{padding:18px;background:var(--bg);min-height:100vh;font-family:Inter,system-ui,Segoe UI,Roboto,Arial;color:var(--text);max-width:1400px;margin:0 auto;}

        /* Header */
        .view-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;background:var(--white);padding:14px 16px;border-radius:14px;border:1px solid var(--border);box-shadow:0 8px 22px rgba(0,0,0,0.04);gap:10px;flex-wrap:wrap;}
        .header-left{display:flex;align-items:center;gap:12px;flex-wrap:wrap;}
        .back-btn{background:transparent;border:1px solid var(--border);padding:9px 12px;border-radius:12px;color:var(--muted);cursor:pointer;display:flex;align-items:center;gap:8px;transition:.2s;font-weight:900;}
        .back-btn:hover{border-color:var(--primary);color:var(--primary);background:#fff7ed;}
        .title-box h2{margin:0;font-size:18px;font-weight:950;}
        .subtitle{font-size:12px;color:var(--muted);font-weight:800;}
        .status-badge{padding:7px 12px;border-radius:999px;font-size:12px;font-weight:950;text-transform:capitalize;border:1px solid var(--border);background:#f8fafc;}
        .status-badge.active{background:#dcfce7;color:#166534;border-color:#bbf7d0;}
        .status-badge.inactive{background:#fee2e2;color:#991b1b;border-color:#fecaca;}

        /* Layout */
        .grid-layout{display:grid;grid-template-columns:340px minmax(0,1fr);gap:16px;align-items:start;}
        .left-panel{display:flex;flex-direction:column;gap:14px;}
        .right-panel{display:flex;flex-direction:column;gap:14px;}

        /* Cards */
        .modern-card{background:var(--white);border-radius:16px;padding:14px;border:1px solid var(--border);box-shadow:0 10px 25px rgba(0,0,0,0.04);}
        .card-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:10px;border-bottom:1px solid #f1f5f9;gap:10px;flex-wrap:wrap;}
        .card-header h3{margin:0;font-size:14px;font-weight:950;display:flex;align-items:center;gap:8px;}
        .card-header-small{margin-bottom:10px;border-bottom:1px solid #f1f5f9;padding-bottom:8px;}
        .card-header-small h4{margin:0;font-size:13px;font-weight:950;display:flex;align-items:center;gap:8px;}
        .icon-orange{color:var(--primary);}

        /* Profile */
        .profile-img-container{width:96px;height:96px;margin:0 auto 10px;border-radius:50%;padding:4px;border:2px dashed var(--primary);}
        .profile-img-container img{width:100%;height:100%;border-radius:50%;object-fit:cover;}
        .profile-info{text-align:center;}
        .designation-badge{background:#fff7ed;color:var(--primary);padding:6px 12px;border-radius:999px;font-size:12px;font-weight:950;display:inline-block;margin-bottom:14px;}
        .info-list{text-align:left;margin-bottom:14px;}
        .info-item{display:flex;align-items:center;gap:10px;margin-bottom:10px;color:var(--muted);font-size:13px;font-weight:800;}
        .info-item .icon{color:var(--primary);width:16px;}
        .info-item.salary{font-weight:950;color:var(--text);border-top:1px solid #f1f5f9;padding-top:10px;margin-top:10px;}

        /* Forms */
        .manual-form{display:flex;flex-direction:column;gap:10px;}
        .input-group label,.form-group label{display:block;font-size:12px;font-weight:950;color:var(--muted);margin-bottom:5px;}
        input,select{padding:10px;border:1px solid var(--border);border-radius:12px;width:100%;box-sizing:border-box;outline:none;font-weight:850;background:#fcfcfd;}
        input:focus,select:focus{border-color:var(--primary);box-shadow:0 0 0 3px rgba(234,88,12,0.12);}
        .time-row-inputs{display:flex;gap:10px;}
        .helper-note{font-size:11px;color:var(--muted);font-style:italic;margin-top:-4px;}
        .text-muted{color:#94a3b8;}
        .text-sm{font-size:12px;}

        .btn-primary{background:var(--primary);color:white;border:none;padding:10px;border-radius:12px;cursor:pointer;font-weight:950;width:100%;}
        .btn-primary:hover{background:var(--primary-hover);}
        .btn-outline-primary{background:white;border:1px solid var(--primary);color:var(--primary);padding:9px;border-radius:12px;cursor:pointer;font-weight:950;}
        .btn-outline-primary:hover{background:#fff7ed;}
        .btn-secondary{background:white;border:1px solid var(--border);color:var(--text);padding:9px;border-radius:12px;cursor:pointer;font-weight:950;}
        .full-width{width:100%;}
        .mini-btn{padding:8px 10px;border-radius:12px;display:inline-flex;align-items:center;gap:8px;}
        .spin{animation:spin 1s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg)}}

        .btn-group{display:flex;gap:10px;margin-top:8px;}
        .btn-group .btn-primary{flex:1;}
        .btn-group .btn-secondary{width:48px;display:grid;place-items:center;}

        /* Stats row */
        .stats-row{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;}
        .stat-widget{background:white;padding:12px;border-radius:14px;border:1px solid var(--border);display:flex;align-items:center;gap:12px;}
        .stat-icon{width:42px;height:42px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:16px;}
        .stat-icon.green{background:#dcfce7;color:#166534;}
        .stat-icon.blue{background:#dbeafe;color:#1e40af;}
        .stat-icon.orange{background:#ffedd5;color:#c2410c;}
        .stat-icon.red{background:#fee2e2;color:#991b1b;}
        .stat-data{display:flex;flex-direction:column;}
        .stat-data strong{font-size:18px;font-weight:950;line-height:1;}
        .stat-data span{font-size:12px;color:var(--muted);font-weight:900;}

        /* Payroll */
        .payroll-controls{display:flex;gap:12px;align-items:flex-end;margin-bottom:8px;flex-wrap:wrap;}
        .date-group{display:flex;gap:10px;flex:1;min-width:260px;}
        .input-wrap{flex:1;}
        .input-wrap label{display:block;font-size:12px;color:var(--muted);font-weight:950;margin-bottom:5px;}
        .btn-calc{min-width:140px;}

        .payroll-result{margin-top:10px;}
        .result-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;background:#f8fafc;padding:12px;border-radius:14px;border:1px dashed var(--border);}
        .res-box{text-align:center;}
        .res-box span{display:block;font-size:11px;color:var(--muted);font-weight:900;}
        .res-box strong{font-size:14px;font-weight:950;}
        .res-box.total strong{color:var(--green);}
        .breakdown-note{margin-top:10px;color:var(--muted);font-weight:800;}

        /* Tools row */
        .tools-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;}
        .search{min-width:240px;}

        /* Tables */
        .table-wrapper{overflow-x:auto;}
        .modern-table{width:100%;border-collapse:collapse;min-width:760px;}
        .modern-table th{text-align:left;padding:12px;background:#f8fafc;color:var(--muted);font-size:12px;font-weight:950;border-bottom:1px solid var(--border);text-transform:uppercase;letter-spacing:0.6px;}
        .modern-table td{padding:12px;border-bottom:1px solid #f1f5f9;font-size:13px;vertical-align:middle;font-weight:800;}
        .empty{text-align:center;color:var(--muted);padding:18px!important;font-weight:950;}
        .hover-row:hover{background:#fff7ed;}
        .date-cell-bold{font-weight:950;}
        .punch-times{font-size:12px;display:flex;flex-direction:column;gap:4px;}
        .time-row{display:flex;align-items:center;gap:8px;}
        .icon-tiny{font-size:12px;}
        .text-green{color:var(--green);}
        .text-red{color:var(--red);}
        .text-blue{color:var(--blue);}
        .report-cell{max-width:260px;}
        .report-text{display:flex;align-items:flex-start;gap:8px;font-size:12px;line-height:1.35;color:var(--text);}

        .status-pill{padding:6px 10px;border-radius:999px;font-size:12px;font-weight:950;border:1px solid var(--border);background:#f8fafc;display:inline-flex;}
        .status-pill.good{background:#dcfce7;color:#166534;border-color:#bbf7d0;}
        .status-pill.warn{background:#ffedd5;color:#c2410c;border-color:#fed7aa;}
        .status-pill.bad{background:#fee2e2;color:#991b1b;border-color:#fecaca;}
        .status-pill.pending{background:#fef3c7;color:#92400e;border-color:#fde68a;}
        .status-pill.neutral{background:#e0f2fe;color:#075985;border-color:#bae6fd;}

        .type-tag{padding:6px 10px;border-radius:999px;font-size:12px;font-weight:950;border:1px solid var(--border);display:inline-flex;}
        .type-tag.paid{background:#dcfce7;color:#166534;border-color:#bbf7d0;}
        .type-tag.unpaid{background:#fee2e2;color:#991b1b;border-color:#fecaca;}
        .reason-cell{max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}

        .btn-group-sm{display:flex;gap:8px;}
        .btn-xs{padding:7px 10px;border-radius:12px;border:none;cursor:pointer;font-size:12px;font-weight:950;}
        .btn-xs.approve{background:#dcfce7;color:#166534;}
        .btn-xs.reject{background:#fee2e2;color:#991b1b;}

        /* Responsive */
        @media (max-width: 1100px){
          .grid-layout{grid-template-columns:1fr;}
          .stats-row{grid-template-columns:1fr 1fr;}
        }
        @media (max-width: 640px){
          .view-page{padding:12px;}
          .stats-row{grid-template-columns:1fr;}
          .date-group{flex-direction:column;}
          .payroll-controls{align-items:stretch;}
          .modern-table{min-width:820px;}
          .time-row-inputs{flex-direction:column;}
        }

        /* Animations */
        .slide-up{animation:slideUp .35s ease-out;}
        @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .animate-fade{animation:fade .2s ease-out;}
        @keyframes fade{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}
        .animate-slide-up{animation:up .28s ease-out;}
        @keyframes up{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
      `}</style>
    </div>
  );
};

export default HrAdminEmployeeView;

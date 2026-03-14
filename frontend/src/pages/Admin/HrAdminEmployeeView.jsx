
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
  FaUserTie,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import EditEmployeeModal from "../../components/Modals/EditEmployeeModal";

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
  const [extraDays, setExtraDays] = useState(0); // Extra Day Adjustment (0-10)

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
    employmentType: "On-Roll",
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
          employmentType: finalUser.employmentType || "On-Roll",
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
        () => API.get(`/company/payroll/${userId}?startDate=${dates.startDate}&endDate=${dates.endDate}&extraDays=${extraDays}`),
        () => API.get(`/hr/payroll/${userId}?startDate=${dates.startDate}&endDate=${dates.endDate}&extraDays=${extraDays}`),
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
          API.get(`/company/payroll/salary-slip/${userId}?startDate=${dates.startDate}&endDate=${dates.endDate}&extraDays=${extraDays}`, {
            responseType: "blob",
          }),
        () =>
          API.get(`/hr/payroll/salary-slip/${userId}?startDate=${dates.startDate}&endDate=${dates.endDate}&extraDays=${extraDays}`, {
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
        <div className="loader-card animate-pop">
          <div className="spinner-container">
            <div className="spinner-ring" />
            <div className="spinner-kinetic" />
            <FaUserTie className="loader-ic" />
          </div>
          <div className="ld-text">
            <div className="ld-title">Employee Intelligence</div>
            <div className="ld-sub">Retrieving Personnel Profile...</div>
          </div>
        </div>
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
                    <FaMoneyBillWave className="icon" /> {
                      user.employmentType === 'Intern'
                        ? (user.basicSalary > 0 ? `Stipend: ₹${Number(user.basicSalary).toLocaleString()}` : 'Unpaid (Intern)')
                        : `₹${Number(user.basicSalary || 0).toLocaleString()} / mo`
                    }
                  </div>
                </div>

                <button className="btn-outline-primary full-width" onClick={() => setIsEditing(true)}>
                  <FaEdit /> Edit Profile
                </button>
              </div>
            ) : null}

            {/* Edit Modal Logic */}
            <EditEmployeeModal
              isOpen={isEditing}
              onClose={() => setIsEditing(false)}
              employee={user}
              onSuccess={() => {
                fetchEmployeeKundali();
                setIsEditing(false);
              }}
            />
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

                <div className="input-wrap">
                  <label>Extra Day Adj.</label>
                  <select value={extraDays} onChange={(e) => setExtraDays(Number(e.target.value))}>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
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

                  <div className="res-box absent">
                    <span>Absent Days</span>
                    <strong>{payrollStats.absentDays ?? 0}</strong>
                  </div>

                  <div className="res-box total">
                    <span>Net Salary</span>
                    <strong>
                      {user.employmentType === 'Intern'
                        ? (user.basicSalary > 0 ? `₹${Number(payrollStats.estimatedSalary ?? payrollStats.netSalary ?? 0).toLocaleString()}` : 'Unpaid')
                        : `₹${Number(payrollStats.estimatedSalary ?? payrollStats.netSalary ?? 0).toLocaleString()}`}
                    </strong>
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
        :root {
          --primary: #50c8ff;
          --primary-hover: #38bdf8;
          --accent-violet: #a78bfa;
          --accent-pink: #e879f9;
          --bg-dark: #050714;
          --card-glass: rgba(13, 17, 34, 0.6);
          --border-glass: rgba(255, 255, 255, 0.1);
          --text-bright: #ffffff;
          --text-dim: rgba(255, 255, 255, 0.6);
          --brand-grad: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
        }

        .view-page {
          padding: 24px;
          background: radial-gradient(circle at 50% 50%, #0f172a, #050714);
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: var(--text-bright);
          max-width: 1600px;
          margin: 0 auto;
          box-sizing: border-box;
          width: 100%;
          overflow-x: hidden;
        }

        /* Header */
        .view-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; background: rgba(13, 17, 34, 0.8);
          padding: 20px 24px; border-radius: 20px;
          border: 1px solid var(--border-glass);
          box-shadow: 0 20px 50px rgba(0,0,0,0.4);
          backdrop-filter: blur(20px);
          gap: 10px; flex-wrap: wrap; box-sizing: border-box; width: 100%;
        }
        .header-left { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; min-width: 0; }
        .back-btn {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid var(--border-glass);
          padding: 10px 18px; border-radius: 14px;
          color: var(--text-dim); cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: 0.3s; font-weight: 800;
        }
        .back-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; border-color: #50c8ff; }
        
        .title-box h2 { 
          margin: 0; font-size: 1.4rem; font-weight: 900;
          background: var(--brand-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .subtitle { font-size: 11px; color: var(--text-dim); font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        .status-badge {
          padding: 7px 16px; border-radius: 999px;
          font-size: 11px; font-weight: 800; text-transform: uppercase;
          border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255,255,255,0.05); color: #fff;
        }
        .status-badge.active { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }

        /* Layout */
        .grid-layout { display: grid; grid-template-columns: 360px minmax(0,1fr); gap: 24px; align-items: start; min-width: 0; }
        .left-panel, .right-panel { display: flex; flex-direction: column; gap: 24px; min-width: 0; width: 100%; }

        /* Cards */
        .modern-card {
          background: rgba(13, 17, 34, 0.6);
          border-radius: 24px; padding: 24px;
          border: 1px solid var(--border-glass);
          box-shadow: 0 15px 35px rgba(0,0,0,0.3);
          backdrop-filter: blur(15px);
          box-sizing: border-box; width: 100%; min-width: 0; overflow: hidden;
        }
        .card-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 20px; padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          gap: 10px; flex-wrap: wrap;
        }
        .card-header h3 { 
          margin: 0; font-size: 1.1rem; font-weight: 900;
          background: linear-gradient(90deg, #50c8ff, #a78bfa);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          display: flex; align-items: center; gap: 10px;
        }
        .card-header-small { margin-bottom: 16px; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 10px; }
        .card-header-small h4 { margin: 0; font-size: 13px; font-weight: 800; color: #fff; display: flex; align-items: center; gap: 8px; }

        /* Profile */
        .profile-img-container {
          width: 110px; height: 110px; margin: 0 auto 16px;
          border-radius: 50%; padding: 6px;
          background: var(--brand-grad);
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
        }
        .profile-img-container img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 3px solid #050714; }
        .profile-info { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .designation-badge {
          background: rgba(80, 200, 255, 0.1); color: #50c8ff;
          padding: 8px 16px; border-radius: 999px; font-size: 12px;
          font-weight: 800; display: inline-block; margin-bottom: 20px;
          border: 1px solid rgba(80, 200, 255, 0.2);
        }
        .info-list { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; gap: 4px; }
        .info-item { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; color: var(--text-dim); font-size: 13px; font-weight: 600; justify-content: center; width: 100%; }
        .info-item .icon { color: #50c8ff; width: 16px; font-size: 16px; text-align: center; }
        .info-item.salary { font-weight: 900; color: #fff; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px; margin-top: 10px; justify-content: center; }

        /* Forms */
        .manual-form { display: flex; flex-direction: column; gap: 16px; }
        .input-group label, .form-group label { display: block; font-size: 12px; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
        input, select {
          padding: 12px 16px; border: 1px solid var(--border-glass);
          border-radius: 14px; width: 100%; box-sizing: border-box;
          outline: none; font-weight: 600; background: rgba(255, 255, 255, 0.03); color: #fff;
          transition: 0.3s;
        }
        input:focus, select:focus { border-color: #50c8ff; background: rgba(80, 200, 255, 0.05); box-shadow: 0 0 15px rgba(80, 200, 255, 0.1); }
        
        .btn-primary {
          background: var(--brand-grad); color: white; border: none; padding: 14px;
          border-radius: 16px; cursor: pointer; font-weight: 900; width: 100%;
          text-transform: uppercase; letter-spacing: 1px; transition: 0.3s;
          box-shadow: 0 10px 20px rgba(139, 92, 246, 0.2); display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(139, 92, 246, 0.4); filter: brightness(1.1); }

        .btn-outline-primary {
          background: rgba(255, 255, 255, 0.05); color: #fff; border: 1px solid var(--border-glass); 
          padding: 12px 16px; border-radius: 14px; cursor: pointer; font-weight: 800; 
          display: flex; align-items: center; justify-content: center; gap: 8px; transition: 0.3s;
        }
        .btn-outline-primary:hover { border-color: #50c8ff; background: rgba(80, 200, 255, 0.1); }
        .btn-outline-primary.full-width { width: 100%; }

        /* Stats row */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        .stat-widget {
          background: rgba(255, 255, 255, 0.03); padding: 16px; border-radius: 20px;
          border: 1px solid var(--border-glass); display: flex; align-items: center; gap: 16px;
          transition: 0.3s;
        }
        .stat-widget:hover { background: rgba(255, 255, 255, 0.06); transform: translateY(-3px); }
        .stat-icon {
          width: 48px; height: 48px; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; font-size: 20px;
        }
        .stat-icon.green { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .stat-icon.blue { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
        .stat-icon.orange { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
        .stat-icon.red { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        
        .stat-data { display: flex; flex-direction: column; gap: 2px; }
        .stat-data strong { font-size: 1.2rem; font-weight: 900; color: #fff; line-height: 1.2; }
        .stat-data span { font-size: 11px; color: var(--text-dim); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Payroll result */
        .payroll-controls { display: flex; flex-direction: column; gap: 16px; margin-bottom: 24px; padding: 20px; background: rgba(255,255,255,0.02); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); }
        .date-group { display: flex; gap: 16px; align-items: flex-end; flex-wrap: wrap; }
        .input-wrap { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 150px; }
        .input-wrap label { font-size: 11px; font-weight: 800; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; }
        
        .result-grid {
          grid-template-columns: repeat(5, 1fr); gap: 12px;
          background: rgba(255, 255, 255, 0.02); padding: 20px;
          border-radius: 20px; border: 1px dashed rgba(255, 255, 255, 0.1);
        }
        .res-box strong { font-size: 16px; display: block; margin-top: 4px; }
        .res-box.total strong { color: #50c8ff; text-shadow: 0 0 10px rgba(80, 200, 255, 0.3); }

        /* Tables */
        .modern-table { width: 100%; border-collapse: collapse; }
        .modern-table th {
          background: rgba(255, 255, 255, 0.05); color: var(--text-dim);
          font-size: 11px; font-weight: 800; border-bottom: 2px solid var(--border-glass);
          padding: 14px 16px; text-align: left; text-transform: uppercase; letter-spacing: 0.5px;
        }
        .modern-table td { 
          color: #fff; border-bottom: 1px solid rgba(255, 255, 255, 0.05); 
          font-weight: 600; padding: 16px; font-size: 13px; line-height: 1.5; 
        }
        .modern-table tr:hover { background: rgba(255, 255, 255, 0.03); }

        .status-pill {
          padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 800;
          border: 1px solid rgba(255, 255, 255, 0.1); background: rgba(255, 255, 255, 0.05);
        }
        .status-pill.good { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.2); }
        .status-pill.bad { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: rgba(239, 68, 68, 0.2); }

        /* Animation */
        .loader-screen {
          height: 100vh; background: radial-gradient(circle at 50% 50%, #0f172a, #050714);
          display: grid; place-items: center; color: #fff;
        }
        .loader-card { text-align: center; }
        .spinner-container {
          position: relative; width: 80px; height: 80px; margin: 0 auto 24px;
          display: flex; align-items: center; justify-content: center;
        }
        .spinner-ring {
          position: absolute; inset: 0; border: 2px solid rgba(80, 200, 255, 0.1);
          border-radius: 50%; border-top-color: #50c8ff;
          animation: spin 1s cubic-bezier(0.55, 0.17, 0.21, 0.76) infinite;
        }
        .spinner-kinetic {
          position: absolute; inset: 10px; border: 2px solid transparent;
          border-radius: 50%; border-left-color: #a78bfa; border-right-color: #e879f9;
          animation: spin 1.5s linear infinite reverse;
        }
        .loader-ic { font-size: 24px; color: #50c8ff; filter: drop-shadow(0 0 10px rgba(80, 200, 255, 0.5)); animation: pulse 2s ease-in-out infinite; }

        .ld-title { font-size: 1.5rem; font-weight: 900; background: var(--brand-grad); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .ld-sub { color: var(--text-dim); margin-top: 8px; font-weight: 600; font-size: 0.9rem; }

        /* Pagination & Search */
        .pagination-controls { display: flex; align-items: center; justify-content: flex-end; gap: 16px; margin-top: 20px; }
        .pg-btn {
          background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-glass);
          color: #fff; padding: 8px 16px; border-radius: 12px; cursor: pointer;
          display: flex; align-items: center; gap: 8px; font-weight: 800; transition: 0.3s;
        }
        .pg-btn:hover:not(:disabled) { background: rgba(80, 200, 255, 0.1); border-color: #50c8ff; }
        .pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pg-info { font-size: 13px; color: var(--text-dim); font-weight: 700; }

        .search-box-sm {
          display: flex; align-items: center; background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-glass); border-radius: 14px; padding: 6px 14px;
          width: 240px; transition: 0.3s;
        }
        .search-box-sm:focus-within { border-color: #50c8ff; background: rgba(80, 200, 255, 0.05); }
        .search-box-sm input {
          border: none; background: transparent; color: #fff; outline: none;
          font-size: 13px; font-weight: 600; width: 100%;
        }

        .tools-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.6; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
        .animate-pop { animation: pop 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); }
        @keyframes pop { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .slide-up { animation: slideUp 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }

        /* Responsive */
        @media (max-width: 1024px) {
          .grid-layout { grid-template-columns: 300px 1fr; }
          .stats-row { grid-template-columns: repeat(2, 1fr); }
          .result-grid { grid-template-columns: repeat(3, 1fr); }
        }

        @media (max-width: 768px) {
          .view-page { padding: 12px; }
          .grid-layout { grid-template-columns: 1fr; gap: 16px; }
          .stats-row { grid-template-columns: 1fr 1fr; gap: 12px; }
          .result-grid { grid-template-columns: 1fr 1fr; }
          .payroll-controls .date-group { flex-direction: column; width: 100%; align-items: stretch; }
          .payroll-controls .input-wrap { width: 100%; }
          .table-wrapper { overflow-x: auto; border: 1px solid var(--border-glass); border-radius: 14px; }
          .modern-table { min-width: 600px; }
          .card-header { flex-direction: column; align-items: flex-start; gap: 12px; }
          .card-header .search { width: 100%; }
          .search input { width: 100%; }
          .view-header { flex-direction: column; align-items: flex-start; gap: 16px; padding: 16px; }
          .header-left { width: 100%; }
          .left-panel { gap: 16px; }
          .modern-card { padding: 16px; }
        }

        @media (max-width: 480px) {
          .stats-row { grid-template-columns: 1fr; }
          .result-grid { grid-template-columns: 1fr; }
          .header-left { flex-direction: column-reverse; align-items: flex-start; gap: 12px; }
          .back-btn { padding: 8px 14px; font-size: 13px; align-self: flex-start; }
          .title-box h2 { font-size: 1.2rem; word-break: break-all; }
        }
      `}</style>
    </div>
  );
};

export default HrAdminEmployeeView;

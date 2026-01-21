import React, { useEffect, useMemo, useRef, useState } from "react";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {
  FaPlaneDeparture,
  FaLaptopHouse,
  FaCalendarAlt,
  FaHistory,
  FaCheckCircle,
  FaHourglassHalf,
  FaInfoCircle,
  FaArrowLeft,
  FaTimesCircle,
  FaSearch,
  FaFilter,
  FaRedoAlt,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";
import Pagination from "../../components/Pagination";

const TZ = "Asia/Kolkata";
const todayYMD = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

const safeArr = (v) => (Array.isArray(v) ? v : []);

const formatDate = (iso) => {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
};

const statusKey = (s) => String(s || "").toLowerCase();
const chip = (type) => String(type || "").toLowerCase();

const LeaveRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const mountedRef = useRef(true);

  const [leaves, setLeaves] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [form, setForm] = useState({
    leaveType: "Paid",
    dayType: "Full Day",
    startDate: "",
    endDate: "",
    reason: "",
  });

  useEffect(() => {
    mountedRef.current = true;
    if (user?._id || user?.id) fetchLeaves(false);
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id, user?.id]);

  const fetchLeaves = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoadingList(true);

      let res;
      try {
        res = await API.get("/leaves/my");
      } catch (e) {
        const uid = user?._id || user?.id;
        if (uid) res = await API.get(`/leaves/employee/${uid}`);
        else throw e;
      }

      const list = safeArr(res?.data);
      if (!mountedRef.current) return;
      setLeaves(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load leaves");
      if (!mountedRef.current) return;
      setLeaves([]);
    } finally {
      if (!mountedRef.current) return;
      isRefresh ? setRefreshing(false) : setLoadingList(false);
    }
  };

  const summary = useMemo(() => {
    const arr = safeArr(leaves);
    const approved = arr.filter(
      (l) => statusKey(l.status) === "approved",
    ).length;
    const pending = arr.filter((l) => statusKey(l.status) === "pending").length;
    const rejected = arr.filter(
      (l) => statusKey(l.status) === "rejected",
    ).length;
    return { total: arr.length, approved, pending, rejected };
  }, [leaves]);

  const filtered = useMemo(() => {
    const arr = safeArr(leaves);
    const qq = q.trim().toLowerCase();

    return arr.filter((l) => {
      const okStatus =
        statusFilter === "All"
          ? true
          : statusKey(l.status) === statusFilter.toLowerCase();
      if (!okStatus) return false;

      if (!qq) return true;
      const t = String(l.leaveType || "").toLowerCase();
      const r = String(l.reason || "").toLowerCase();
      const s = String(l.status || "").toLowerCase();
      return t.includes(qq) || r.includes(qq) || s.includes(qq);
    });
  }, [leaves, q, statusFilter]);

  const pager = useClientPagination(filtered);
  const { paginatedItems } = pager;

  const validate = () => {
    const { startDate, endDate, reason } = form;
    if (!startDate || !endDate) return "Please select start & end date";
    if (!reason.trim()) return "Reason is required";
    if (new Date(startDate) > new Date(endDate))
      return "Start date should be before end date";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) return toast.warning(error);

    setSaving(true);
    try {
      const payload = {
        ...form,
        reason: form.reason.trim(),
        halfDay: form.dayType === "Half Day",
      };

      const isWFH = form.leaveType === "WFH";
      const isSingleDay = form.startDate === form.endDate;
      const isToday = form.startDate === todayYMD();

      if (isWFH && isSingleDay && isToday) {
        await API.post("/employee/wfh-request", {
          reason: payload.reason,
          dayType: payload.dayType,
        });
        toast.success("WFH Request Sent! 🏠");
      } else {
        await API.post("/leaves/apply", payload);
        toast.success(
          isWFH
            ? "WFH Request Submitted! 🏠"
            : "Leave Application Submitted! 🚀",
        );
      }

      setForm({
        leaveType: "Paid",
        dayType: "Full Day",
        startDate: "",
        endDate: "",
        reason: "",
      });
      await fetchLeaves(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setSaving(false);
    }
  };

  // ✅ ONLY CHANGE: keep options limited
  const types = ["Paid", "Unpaid", "WFH"];

  return (
    <div className="page slide-up">
      <header className="head">
        <div className="headTop">
          <button
            className="back"
            onClick={() => navigate("/employee/dashboard")}
            type="button"
          >
            <FaArrowLeft /> Dashboard
          </button>

          <button
            className="refresh"
            onClick={() => fetchLeaves(true)}
            type="button"
            disabled={refreshing}
            title="Refresh"
          >
            <FaRedoAlt className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="titleRow">
          <div className="iconBox">
            <FaPlaneDeparture />
          </div>
          <div>
            <h2>Leave & WFH Center</h2>
            <p>Apply & track your requests (backend synced + fast UI)</p>
          </div>
        </div>
      </header>

      <section className="cards">
        <div className="card">
          <div className="k">Total</div>
          <div className="v">{summary.total}</div>
        </div>
        <div className="card ok">
          <div className="k">Approved</div>
          <div className="v">{summary.approved}</div>
        </div>
        <div className="card warn">
          <div className="k">Pending</div>
          <div className="v">{summary.pending}</div>
        </div>
        <div className="card bad">
          <div className="k">Rejected</div>
          <div className="v">{summary.rejected}</div>
        </div>
      </section>

      <div className="grid">
        <div className="panel">
          <div className="pHead">
            <div className="pTitle">Apply for Leave / WFH</div>
            <div className="pSub">
              Tip: WFH (Today only) uses fastest backend route automatically.
            </div>
          </div>

          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label>Request Type</label>
              <div className="chips">
                {types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`chip ${form.leaveType === t ? "on" : ""}`}
                    onClick={() => setForm((p) => ({ ...p, leaveType: t }))}
                  >
                    {t === "WFH" ? <FaLaptopHouse /> : null}
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label>Duration Mode</label>
                <select
                  className="input"
                  value={form.dayType}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, dayType: e.target.value }))
                  }
                >
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>

              <div className="field">
                <label>Quick</label>
                <button
                  type="button"
                  className="quickBtn"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      startDate: todayYMD(),
                      endDate: todayYMD(),
                    }))
                  }
                >
                  Set Today
                </button>
              </div>
            </div>

            <div className="row">
              <div className="field">
                <label>Start Date</label>
                <div className="dateWrap">
                  <FaCalendarAlt className="ic" />
                  <input
                    type="date"
                    className="input"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, startDate: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="field">
                <label>End Date</label>
                <div className="dateWrap">
                  <FaCalendarAlt className="ic" />
                  <input
                    type="date"
                    className="input"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, endDate: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="field">
              <label>Reason</label>
              <textarea
                className="input area"
                rows={3}
                value={form.reason}
                onChange={(e) =>
                  setForm((p) => ({ ...p, reason: e.target.value }))
                }
                placeholder="e.g. Personal work, Not feeling well..."
                required
              />
            </div>

            <button type="submit" className="submit" disabled={saving}>
              {saving ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        </div>

        <div className="panel">
          <div className="pHead">
            <div className="pTitle">
              <FaHistory /> Request History
            </div>
            <div className="pSub">{filtered.length} shown</div>
          </div>

          <div className="filters">
            <div className="search">
              <FaSearch className="sIc" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search type / status / reason…"
              />
            </div>

            <div className="sel">
              <FaFilter className="fIc" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Approved">Approved</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="list">
            {loadingList ? (
              <div className="empty">Loading…</div>
            ) : paginatedItems.length === 0 ? (
              <div className="empty">
                <FaInfoCircle />
                <div>No recent history.</div>
              </div>
            ) : (
              paginatedItems.map((l) => (
                <div key={l._id} className="item">
                  <div className="iIcon">
                    {statusKey(l.status) === "approved" ? (
                      <FaCheckCircle className="ok" />
                    ) : statusKey(l.status) === "rejected" ? (
                      <FaTimesCircle className="bad" />
                    ) : (
                      <FaHourglassHalf className="warn" />
                    )}
                  </div>

                  <div className="iBody">
                    <div className="top">
                      <div className="name">
                        <span className={`type t-${chip(l.leaveType)}`}>
                          {l.leaveType}
                        </span>
                        <span className="dayType">{l.dayType || "--"}</span>
                      </div>
                      <span className={`st s-${statusKey(l.status)}`}>
                        {l.status}
                      </span>
                    </div>

                    <div className="meta">
                      <FaCalendarAlt />
                      <span>
                        {formatDate(l.startDate)} — {formatDate(l.endDate)}
                      </span>
                    </div>

                    <div className="reason">“{l.reason || "--"}”</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div style={{ padding: "15px", borderTop: "1px solid #e5e7eb" }}>
            <Pagination pager={pager} />
          </div>
        </div>
      </div>

      <style>{`
        :root{
          --bg:#f3fdf9;
          --card:#ffffff;
          --text:#0f172a;
          --muted:#64748b;
          --border:#e5e7eb;
          --brand:#10b981;
          --brand2:#4f46e5;
          --ok:#10b981;
          --bad:#ef4444;
          --warn:#f59e0b;
          --shadow: 0 14px 35px rgba(2,6,23,0.06);
        }

        .page{
          padding: 22px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial;
          background: var(--bg);
          min-height: 100vh;
          color: var(--text);
        }

        .head{ margin-bottom: 14px; }
        .headTop{ display:flex; align-items:center; justify-content:space-between; gap: 10px; flex-wrap: wrap; }
        .back{
          border: 1px solid var(--border);
          background: #fff;
          color: var(--muted);
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 950;
          cursor: pointer;
          display:flex; align-items:center; gap: 10px;
        }
        .back:hover{ border-color: rgba(16,185,129,0.4); color: #065f46; background: #ecfdf5; }

        .refresh{
          border: 1px solid var(--border);
          background: #fff;
          color: var(--text);
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 950;
          cursor: pointer;
          display:flex; align-items:center; gap: 10px;
          box-shadow: 0 8px 18px rgba(2,6,23,0.03);
        }
        .refresh:disabled{ opacity: 0.6; cursor: not-allowed; }
        .spin{ animation: spin 1s linear infinite; }
        @keyframes spin{ to{ transform: rotate(360deg);} }

        .titleRow{ display:flex; align-items:center; gap: 14px; margin-top: 14px; }
        .iconBox{
          width: 56px; height: 56px; border-radius: 18px;
          background: linear-gradient(135deg, rgba(16,185,129,0.16), rgba(79,70,229,0.10));
          border: 1px solid rgba(226,232,240,0.9);
          display:grid; place-items:center;
          font-size: 22px; color: var(--brand);
          box-shadow: 0 10px 20px rgba(16,185,129,0.06);
        }
        .titleRow h2{ margin:0; font-size: 20px; font-weight: 950; }
        .titleRow p{ margin: 6px 0 0; color: var(--muted); font-weight: 700; font-size: 13px; }

        .cards{
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin: 12px 0 16px;
        }
        .card{
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 8px 18px rgba(2,6,23,0.03);
        }
        .card.ok{ border-color: rgba(16,185,129,0.25); }
        .card.warn{ border-color: rgba(245,158,11,0.25); }
        .card.bad{ border-color: rgba(239,68,68,0.18); }
        .k{ font-size: 12px; color: var(--muted); font-weight: 950; text-transform: uppercase; letter-spacing: .8px; }
        .v{ margin-top: 8px; font-size: 22px; font-weight: 950; }

        .grid{
          display:grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 14px;
          align-items: start;
        }
        .panel{
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 22px;
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .pHead{
          padding: 16px;
          border-bottom: 1px solid rgba(241,245,249,0.95);
          background: rgba(248,250,252,0.75);
        }
        .pTitle{
          font-weight: 950;
          display:flex; align-items:center; gap: 10px;
        }
        .pSub{ margin-top: 6px; font-size: 12px; color: var(--muted); font-weight: 800; }

        .form{ padding: 16px; display:grid; gap: 14px; }
        .field{ display:grid; gap: 8px; }
        .field label{
          font-size: 12px;
          color: var(--muted);
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .7px;
        }

        .chips{ display:flex; flex-wrap: wrap; gap: 10px; }
        .chip{
          border: 1px solid var(--border);
          background: #fff;
          padding: 9px 12px;
          border-radius: 999px;
          font-weight: 900;
          color: var(--muted);
          cursor:pointer;
          display:inline-flex; align-items:center; gap: 8px;
        }
        .chip.on{
          background: #ecfdf5;
          border-color: rgba(16,185,129,0.45);
          color: #065f46;
        }

        .row{ display:grid; grid-template-columns: 1fr 1fr; gap: 12px; align-items:end; }
        .input{
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: #f9fafb;
          font-weight: 850;
          outline: none;
          box-sizing: border-box;
        }
        .input:focus{
          border-color: rgba(16,185,129,0.55);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.10);
          background: #fff;
        }
        .area{ resize: vertical; min-height: 92px; }

        .dateWrap{
          position: relative;
          display:flex;
          align-items:center;
        }
        .dateWrap .ic{
          position: absolute;
          left: 12px;
          color: rgba(79,70,229,0.55);
        }
        .dateWrap input{ padding-left: 40px; }

        .quickBtn{
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          border: 1px dashed rgba(79,70,229,0.35);
          background: rgba(79,70,229,0.06);
          color: rgba(15,23,42,0.90);
          font-weight: 950;
          cursor: pointer;
        }

        .submit{
          border:none;
          background: var(--brand);
          color: #fff;
          padding: 14px;
          border-radius: 16px;
          font-weight: 950;
          cursor: pointer;
          box-shadow: 0 14px 28px rgba(16,185,129,0.16);
        }
        .submit:disabled{ opacity: 0.7; cursor: not-allowed; }

        .filters{
          padding: 14px 16px;
          display:flex;
          gap: 10px;
          align-items:center;
          flex-wrap: wrap;
        }
        .search{
          flex: 1;
          min-width: 240px;
          display:flex; align-items:center; gap: 10px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px 12px;
        }
        .sIc{ color: var(--muted); }
        .search input{
          width:100%; border:none; outline:none; background:transparent;
          font-weight: 850;
        }
        .sel{
          display:flex; align-items:center; gap: 10px;
          border: 1px solid var(--border);
          background: #fff;
          border-radius: 14px;
          padding: 10px 12px;
        }
        .fIc{ color: var(--muted); }
        .sel select{
          border:none; outline:none; background:transparent;
          font-weight: 950;
          color: var(--text);
        }

        .list{
          padding: 0 16px 16px;
          display:grid;
          gap: 12px;
          max-height: 560px;
          overflow: auto;
        }
        .empty{
          padding: 28px 16px;
          color: var(--muted);
          font-weight: 900;
          display:flex; align-items:center; gap: 10px;
          justify-content:center;
          text-align:center;
        }

        .item{
          display:flex;
          gap: 12px;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 18px;
          padding: 12px;
          background: #fff;
        }
        .iIcon{ width: 28px; display:flex; justify-content:center; margin-top: 2px; }
        .ok{ color: var(--ok); }
        .warn{ color: var(--warn); }
        .bad{ color: var(--bad); }

        .iBody{ flex:1; min-width: 0; }
        .top{
          display:flex; justify-content:space-between; align-items:flex-start; gap: 10px;
        }
        .name{
          display:flex; align-items:center; gap: 8px;
          flex-wrap: wrap;
        }
        .type{
          font-weight: 950;
          padding: 6px 10px;
          border-radius: 999px;
          background: #f1f5f9;
          border: 1px solid rgba(226,232,240,0.9);
          font-size: 12px;
        }
        .t-wfh{ background: #ecfeff; border-color: #bae6fd; color: #075985; }
        .t-paid{ background: #ecfdf5; border-color: #bbf7d0; color: #065f46; }
        .t-unpaid{ background: #fff7ed; border-color: #fed7aa; color: #9a3412; }

        .dayType{
          font-size: 12px;
          font-weight: 950;
          color: var(--muted);
          border: 1px dashed rgba(100,116,139,0.35);
          padding: 5px 10px;
          border-radius: 999px;
        }

        .st{
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .6px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(226,232,240,0.9);
          background: #f8fafc;
          white-space: nowrap;
        }
        .s-approved{ background:#dcfce7; color:#065f46; border-color:#bbf7d0; }
        .s-pending{ background:#fef3c7; color:#92400e; border-color:#fde68a; }
        .s-rejected{ background:#fee2e2; color:#991b1b; border-color:#fecaca; }

        .meta{
          margin-top: 8px;
          display:flex; align-items:center; gap: 8px;
          color: var(--muted);
          font-weight: 850;
          font-size: 13px;
        }

        .reason{
          margin-top: 8px;
          background: rgba(241,245,249,0.85);
          border: 1px solid rgba(226,232,240,0.9);
          padding: 10px 12px;
          border-radius: 14px;
          font-weight: 800;
          color: rgba(15,23,42,0.85);
          word-break: break-word;
        }

        @media (max-width: 980px){
          .cards{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid{ grid-template-columns: 1fr; }
          .row{ grid-template-columns: 1fr; }
        }
        @media (max-width: 520px){
          .page{ padding: 14px; }
          .filters{ padding: 12px 12px; }
          .list{ padding: 0 12px 12px; }
        }

        .slide-up{ animation: slideUp .45s ease-out; }
        @keyframes slideUp{
          from{ opacity:0; transform: translateY(16px); }
          to{ opacity:1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default LeaveRequest;

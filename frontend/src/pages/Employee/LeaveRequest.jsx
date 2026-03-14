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
  FaSignOutAlt,
} from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";
import Pagination from "../../components/Pagination";

const TZ = "Asia/Kolkata";
const todayYMD = () => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());

const safeArr = (v) => (Array.isArray(v) ? v : []);

const formatDate = (iso) => {
  if (!iso) return "--";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "--";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(d);
};

const statusKey = (s) => String(s || "").toLowerCase();
const chip = (type) => String(type || "").toLowerCase();

const LeaveRequest = () => {
  const { user, logout } = useAuth();
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
    const approved = arr.filter((l) => statusKey(l.status) === "approved").length;
    const pending = arr.filter((l) => statusKey(l.status) === "pending").length;
    const rejected = arr.filter((l) => statusKey(l.status) === "rejected").length;
    return { total: arr.length, approved, pending, rejected };
  }, [leaves]);

  const filtered = useMemo(() => {
    const arr = safeArr(leaves);
    const qq = q.trim().toLowerCase();

    return arr.filter((l) => {
      const okStatus = statusFilter === "All" ? true : statusKey(l.status) === statusFilter.toLowerCase();
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
    if (new Date(startDate) > new Date(endDate)) return "Start date should be before end date";
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
        await API.post("/employee/wfh-request", { reason: payload.reason, dayType: payload.dayType });
        toast.success("WFH Request Sent! 🏠");
      } else {
        await API.post("/leaves/apply", payload);
        toast.success(isWFH ? "WFH Request Submitted! 🏠" : "Leave Application Submitted! 🚀");
      }

      setForm({ leaveType: "Paid", dayType: "Full Day", startDate: "", endDate: "", reason: "" });
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
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="back" onClick={() => navigate("/employee/dashboard")} type="button">
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

          <button className="logout-btn-nav" onClick={() => logout("/")} title="Logout">
            <FaSignOutAlt /> Logout
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
            <div className="pSub">Tip: WFH (Today only) uses fastest backend route automatically.</div>
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
                  onChange={(e) => setForm((p) => ({ ...p, dayType: e.target.value }))}
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
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
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
                    onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
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
                onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
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
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search type / status / reason…" />
            </div>

            <div className="sel">
              <FaFilter className="fIc" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
                        <span className={`type t-${chip(l.leaveType)}`}>{l.leaveType}</span>
                        <span className="dayType">{l.dayType || "--"}</span>
                      </div>
                      <span className={`st s-${statusKey(l.status)}`}>{l.status}</span>
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

          <div style={{ padding: '15px', borderTop: '1px solid #e5e7eb' }}>
            <Pagination pager={pager} />
          </div>
        </div>
      </div>

      <style>{`
        :root {
          --bg: #03050c;
          --card: rgba(13, 18, 40, 0.65);
          --text: #ffffff;
          --muted: rgba(255, 255, 255, 0.6);
          --border: rgba(80, 200, 255, 0.12);
          --primary: #50c8ff;
          --accent-violet: #a78bfa;
          --accent-pink: #e879f9;
          --ok: #10b981;
          --bad: #ef4444;
          --warn: #f59e0b;
          --grad-tri: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          --grad-btn: linear-gradient(135deg, #3b82f6, #8b5cf6);
          --shadow-lg: 0 20px 50px rgba(0, 0, 0, 0.5);
        }

        .page {
          padding: 24px;
          max-width: 1320px;
          margin: 0 auto;
          font-family: 'Plus Jakarta Sans', Inter, sans-serif;
          background: var(--bg);
          min-height: 100vh;
          color: var(--text);
          background-image: 
            radial-gradient(circle at 5% 5%, rgba(80, 200, 255, 0.04) 0%, transparent 35%),
            radial-gradient(circle at 95% 95%, rgba(232, 121, 249, 0.04) 0%, transparent 35%);
        }

        .head { margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid var(--border); }
        .headTop { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        
        .back {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          color: var(--muted);
          padding: 10px 18px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          display: flex; align-items: center; gap: 12px;
          transition: 0.3s;
          backdrop-filter: blur(8px);
        }
        .back:hover { border-color: var(--primary); color: var(--primary); background: rgba(80, 200, 255, 0.08); }

        .refresh {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
          padding: 10px 18px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          display: flex; align-items: center; gap: 12px;
          transition: 0.3s;
          backdrop-filter: blur(8px);
        }
        .refresh:hover:not(:disabled) { border-color: var(--primary); background: rgba(255,255,255,0.08); }
        .refresh:disabled { opacity: 0.5; }
        
        .spin { animation: spinAnim 1s linear infinite; }
        @keyframes spinAnim { to { transform: rotate(360deg); } }

        .titleRow { display: flex; align-items: center; gap: 20px; margin-top: 24px; }
        .iconBox {
          width: 56px; height: 56px; border-radius: 18px;
          background: rgba(80, 200, 255, 0.1);
          border: 1px solid var(--border);
          display: grid; place-items: center;
          font-size: 24px; color: var(--primary);
          box-shadow: 0 0 20px rgba(80, 200, 255, 0.2);
        }
        .titleRow h2 { 
          margin: 0; font-size: 1.5rem; font-weight: 800; letter-spacing: -0.5px;
          background: var(--grad-tri); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .titleRow p { margin: 4px 0 0; color: var(--muted); font-weight: 600; font-size: 0.9rem; }

        .cards {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin: 24px 0;
        }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 20px;
          backdrop-filter: blur(12px);
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .card:hover { transform: translateY(-5px); border-color: var(--primary); box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .card.ok { border-left: 4px solid var(--ok); }
        .card.warn { border-left: 4px solid var(--warn); }
        .card.bad { border-left: 4px solid var(--bad); }
        .k { font-size: 0.75rem; color: var(--muted); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .v { margin-top: 8px; font-size: 1.75rem; font-weight: 900; color: #fff; }

        .grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          gap: 24px;
          align-items: start;
        }
        .panel {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 28px;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
          backdrop-filter: blur(12px);
        }
        .pHead {
          padding: 24px;
          border-bottom: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
        }
        .pTitle {
          font-weight: 800; font-size: 1.1rem;
          display: flex; align-items: center; gap: 12px; color: #fff;
        }
        .pSub { margin-top: 6px; font-size: 0.85rem; color: var(--muted); font-weight: 600; }

        .form { padding: 24px; display: grid; gap: 20px; }
        .field { display: grid; gap: 10px; }
        .field label {
          font-size: 0.75rem;
          color: var(--muted);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .chips { display: flex; flex-wrap: wrap; gap: 12px; }
        .chip {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          padding: 10px 18px;
          border-radius: 50px;
          font-weight: 800;
          color: var(--muted);
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 10px;
          transition: 0.3s;
          font-size: 0.9rem;
        }
        .chip.on {
          background: rgba(80, 200, 255, 0.1);
          border-color: var(--primary);
          color: var(--primary);
        }

        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: end; }
        .input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 16px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
          color: #fff;
          font-weight: 600;
          outline: none;
          box-sizing: border-box;
          font-size: 0.95rem;
          transition: 0.3s;
        }
        .input:focus {
          border-color: var(--primary);
          background: rgba(255, 255, 255, 0.05);
          box-shadow: 0 0 0 4px rgba(80, 200, 255, 0.1);
        }
        .input option { background: #0a0f1e; color: #fff; }
        .area { resize: vertical; min-height: 100px; }

        .dateWrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .dateWrap .ic {
          position: absolute;
          left: 14px;
          color: var(--primary);
          opacity: 0.7;
          pointer-events: none;
        }
        .dateWrap input { padding-left: 44px; }
        ::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }

        .quickBtn {
          width: 100%;
          padding: 14px;
          border-radius: 16px;
          border: 1px dashed rgba(80, 200, 255, 0.3);
          background: rgba(80, 200, 255, 0.05);
          color: var(--primary);
          font-weight: 800;
          cursor: pointer;
          transition: 0.3s;
          font-size: 0.9rem;
        }
        .quickBtn:hover { background: rgba(80, 200, 255, 0.1); border-color: var(--primary); }

        .submit {
          border: none;
          background: var(--grad-btn);
          color: #fff;
          padding: 16px;
          border-radius: 18px;
          font-weight: 900;
          cursor: pointer;
          font-size: 1rem;
          box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.4);
          transition: 0.3s;
          margin-top: 8px;
        }
        .submit:hover :not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 30px -5px rgba(59, 130, 246, 0.5); }
        .submit:disabled { opacity: 0.5; filter: grayscale(1); }

        .filters {
          padding: 16px 24px;
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border);
        }
        .search {
          flex: 1;
          min-width: 220px;
          display: flex; align-items: center; gap: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px 16px;
          transition: 0.3s;
        }
        .search:focus-within { border-color: var(--primary); background: rgba(255,255,255,0.06); }
        .sIc { color: var(--muted); }
        .search input {
          width: 100%; border: none; outline: none; background: transparent;
          font-weight: 600; color: #fff; font-size: 0.9rem;
        }
        .search input::placeholder { color: rgba(255,255,255,0.3); }

        .sel {
          display: flex; align-items: center; gap: 10px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          padding: 10px 16px;
        }
        .fIc { color: var(--primary); }
        .sel select {
          border: none; outline: none; background: transparent;
          font-weight: 800;
          color: #fff;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .list {
          padding: 20px;
          display: grid;
          gap: 16px;
          max-height: 600px;
          overflow-y: auto;
        }
        .list::-webkit-scrollbar { width: 6px; }
        .list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
        
        .empty {
          padding: 60px 20px;
          color: var(--muted);
          font-weight: 700;
          display: flex; flex-direction: column; align-items: center; gap: 16px;
          justify-content: center;
          text-align: center;
        }
        .empty svg { font-size: 2.5rem; opacity: 0.3; }

        .item {
          display: flex;
          gap: 16px;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 16px;
          background: rgba(255, 255, 255, 0.02);
          transition: 0.3s;
        }
        .item:hover { border-color: var(--primary); background: rgba(255,255,255,0.04); }
        .iIcon { width: 32px; display: flex; justify-content: center; margin-top: 4px; font-size: 1.2rem; }
        .ok { color: var(--ok); }
        .warn { color: var(--warn); }
        .bad { color: var(--bad); }

        .iBody { flex: 1; min-width: 0; }
        .top {
          display: flex; justify-content: space-between; align-items: center; gap: 10px;
          margin-bottom: 12px;
        }
        .name { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .type {
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 50px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .t-wfh { background: rgba(129, 140, 248, 0.1); color: #818cf8; border-color: rgba(129, 140, 248, 0.3); }
        .t-paid { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
        .t-unpaid { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }

        .dayType {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--muted);
          border: 1px solid var(--border);
          padding: 5px 12px;
          border-radius: 50px;
          background: rgba(255, 255, 255, 0.03);
        }

        .st {
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 6px 14px;
          border-radius: 50px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.05);
          white-space: nowrap;
        }
        .s-approved { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
        .s-pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); }
        .s-rejected { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.3); }

        .meta {
          margin-bottom: 12px;
          display: flex; align-items: center; gap: 10px;
          color: var(--primary);
          font-weight: 800;
          font-size: 0.85rem;
        }
        .meta span { color: #fff; opacity: 0.9; }

        .reason {
          background: rgba(0, 0, 0, 0.2);
          border: 1px solid var(--border);
          padding: 12px 16px;
          border-radius: 16px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          font-size: 0.9rem;
          line-height: 1.5;
          word-break: break-word;
        }

        .logout-btn-nav {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 10px 18px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: 0.3s;
        }
        .logout-btn-nav:hover { background: #ef4444; color: white; }

        @media (max-width: 980px) {
          .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid { grid-template-columns: 1fr; }
          .row { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .page { padding: 16px; }
          .titleRow h2 { font-size: 1.25rem; }
          .cards { grid-template-columns: 1fr; }
          .headTop { flex-direction: column; align-items: stretch; }
          .back, .refresh { justify-content: center; }
        }

        .slide-up { animation: slideUpAnim 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
        @keyframes slideUpAnim {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div >
  );
};

export default LeaveRequest;

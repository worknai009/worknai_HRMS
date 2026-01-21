import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/ui/PageShell";
import { toast } from "react-toastify";
import API from "../../services/api";
import {
  FaClock,
  FaExternalLinkAlt,
  FaPlus,
  FaTimes,
  FaCheck,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaVideo,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaBriefcase,
  FaUser,
  FaEye,
  FaCalendarPlus,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";
import CandidateProfileModal from "../../components/Modals/CandidateProfileModal";

import Pagination from "../../components/Pagination";

const Interviews = () => {
  // ... existing state ... 

  // After filtered definition ...
  const pager = useClientPagination(filtered);
  const { paginatedItems } = pager;

  const openCreate = (prefillAppId = "") => {
    setEditingId(null);
    setForm({
      applicationId: prefillAppId || "",
      scheduledAt: "",
      mode: "Video",
      meetingLink: "",
      location: "",
      notes: "",
    });
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditingId(item._id);
    setForm({
      applicationId: item.applicationId?._id || "",
      scheduledAt: item.scheduledAt ? String(item.scheduledAt).slice(0, 16) : "",
      mode: item.mode || "Video",
      meetingLink: item.meetingLink || "",
      location: item.location || "",
      notes: item.notes || "",
    });
    setShowModal(true);
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        scheduledAt: new Date(form.scheduledAt).toISOString(),
      };

      if (editingId) {
        await API.put(`/recruitment/interview/${editingId}`, payload);
        toast.success("Interview Updated ✅");
      } else {
        await API.post("/recruitment/interview", payload);
        toast.success("Interview Scheduled ✅");
      }

      setShowModal(false);
      setEditingId(null);
      setForm({
        applicationId: "",
        scheduledAt: "",
        mode: "Video",
        meetingLink: "",
        location: "",
        notes: "",
      });
      loadData();
    } catch (e2) {
      toast.error(e2?.response?.data?.message || "Operation failed");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/recruitment/interview/${id}`, { status });
      toast.success(`Marked as ${status}`);
      setItems((prev) => prev.map((x) => (x._id === id ? { ...x, status } : x)));
    } catch (e) {
      toast.error("Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this interview?")) return;
    try {
      await API.delete(`/recruitment/interview/${id}`);
      toast.success("Interview Deleted ✅");
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  const modeIcon = (mode) => {
    if (mode === "Phone") return <FaPhoneAlt />;
    if (mode === "In-Person") return <FaMapMarkerAlt />;
    return <FaVideo />;
  };

  const statusPill = (s) => {
    const map = {
      Scheduled: { bg: "#eff6ff", bd: "#dbeafe", c: "#1d4ed8" },
      Completed: { bg: "#ecfdf5", bd: "#bbf7d0", c: "#047857" },
      Cancelled: { bg: "#fff7ed", bd: "#fed7aa", c: "#c2410c" },
      "No Show": { bg: "#fef2f2", bd: "#fecaca", c: "#b91c1c" },
      "Pending Schedule": { bg: "#fff1f2", bd: "#ffe4e6", c: "#f43f5e" },
    };
    const x = map[s] || { bg: "#f1f5f9", bd: "#e2e8f0", c: "#334155" };
    return { background: x.bg, border: `1px solid ${x.bd}`, color: x.c };
  };

  return (
    <PageShell title="Interview Pipeline" subtitle="Schedule, reschedule, and track outcomes smoothly.">
      <div className="topbar">
        <div className="stats">
          <div className="stat">
            <div className="k">Total</div>
            <div className="v">{stats.total}</div>
          </div>
          <div className="stat">
            <div className="k">Pending</div>
            <div className="v red">{stats.pending}</div>
          </div>
          <div className="stat">
            <div className="k">Scheduled</div>
            <div className="v blue">{stats.scheduled}</div>
          </div>
          <div className="stat">
            <div className="k">Completed</div>
            <div className="v green">{stats.completed}</div>
          </div>
          <div className="stat">
            <div className="k">Cancelled</div>
            <div className="v orange">{stats.cancelled}</div>
          </div>
        </div>

        <div className="actions">
          <div className="searchBox">
            <FaSearch className="ic" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, job, email, mode…"
            />
          </div>

          <div className="filterBox">
            <FaFilter className="ic" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Pending Schedule">Pending Schedule</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>

          <button className="btnPrimary" onClick={() => openCreate()}>
            <FaPlus /> Schedule
          </button>
        </div>
      </div>

      {loading ? (
        <div className="stateBox">Loading…</div>
      ) : paginatedItems.length === 0 ? (
        <div className="stateBox empty">
          <div className="emptyTitle">No interviews found</div>
          <div className="emptySub">Try changing filters or search terms.</div>
        </div>
      ) : (
        <div className="list">
          {paginatedItems.map((item) => {
            const app = item.applicationId || {};
            const c = getCandidate(app);
            const candName = c?.name || "Unknown";
            const jobTitle = app?.jobId?.title || "Role";

            const isVideo = item.mode === "Video";
            const showMeeting = isVideo && item.meetingLink;

            return (
              <div key={item._id} className="card">
                <div className="left">
                  <div className="dateBox">
                    <div className="day">
                      {item.scheduledAt ? new Date(item.scheduledAt).getDate() : "!"}
                    </div>
                    <div className="mon">
                      {item.scheduledAt
                        ? new Date(item.scheduledAt).toLocaleString([], { month: "short" })
                        : "TBD"}
                    </div>
                  </div>

                  <div className="main">
                    <div className="nameRow">
                      <div className="candName">
                        <FaUser className="miniIc" /> {candName}
                      </div>
                      <div className="status" style={statusPill(item.status)}>
                        {item.status}
                      </div>
                    </div>

                    <div className="jobRow">
                      <FaBriefcase className="miniIc" /> {jobTitle}
                    </div>

                    <div className="meta">
                      {item.scheduledAt ? (
                        <span className="pill">
                          <FaClock /> {fmt(item.scheduledAt)}
                        </span>
                      ) : null}

                      <span className="pill">
                        {modeIcon(item.mode)} {item.mode}
                      </span>

                      {showMeeting ? (
                        <a
                          className="pill link"
                          href={item.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <FaExternalLinkAlt /> Join Link
                        </a>
                      ) : item.mode === "In-Person" && item.location ? (
                        <span className="pill">
                          <FaMapMarkerAlt /> {item.location}
                        </span>
                      ) : null}
                    </div>

                    {item.notes ? <div className="notes">{item.notes}</div> : null}
                  </div>
                </div>

                <div className="right">
                  <button
                    className="iconBtn"
                    onClick={() => {
                      setSelectedApp(app);
                      setShowProfileModal(true);
                    }}
                    title="View Profile"
                  >
                    <FaEye />
                  </button>

                  {item.isVirtual ? (
                    <button
                      className="iconBtn ok"
                      onClick={() => openCreate(app._id)}
                      title="Schedule Interview"
                    >
                      <FaCalendarPlus />
                    </button>
                  ) : (
                    <>
                      <button
                        className="iconBtn"
                        onClick={() => openEdit(item)}
                        title="Edit/Reschedule"
                      >
                        <FaEdit />
                      </button>

                      {item.status !== "Completed" && (
                        <button
                          className="iconBtn ok"
                          onClick={() => updateStatus(item._id, "Completed")}
                          title="Mark Completed"
                        >
                          <FaCheck />
                        </button>
                      )}

                      <button
                        className="iconBtn danger"
                        onClick={() => handleDelete(item._id)}
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {!loading && filtered.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <Pagination pager={pager} />
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="overlay" onMouseDown={() => setShowModal(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modalHead">
              <div>
                <div className="modalTitle">
                  {editingId ? "Reschedule Interview" : "Schedule Interview"}
                </div>
                <div className="modalSub">Keep the pipeline clean and on time.</div>
              </div>
              <button onClick={() => setShowModal(false)} className="xBtn">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSchedule} className="modalBody">
              <label className="lbl">Candidate</label>
              <select
                className="select"
                required
                value={form.applicationId}
                onChange={(e) => setForm({ ...form, applicationId: e.target.value })}
                disabled={!!editingId || !!form.applicationId}
              >
                <option value="">-- Choose --</option>
                {applications.map((app) => {
                  const c = getCandidate(app);
                  return (
                    <option key={app._id} value={app._id}>
                      {c?.name || "Candidate"} — {app?.jobId?.title || "Role"}
                    </option>
                  );
                })}
              </select>

              <div className="row2">
                <div>
                  <label className="lbl">Date & Time</label>
                  <input
                    className="input"
                    type="datetime-local"
                    required
                    value={form.scheduledAt}
                    onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
                  />
                </div>

                <div>
                  <label className="lbl">Mode</label>
                  <select
                    className="select"
                    value={form.mode}
                    onChange={(e) => setForm({ ...form, mode: e.target.value })}
                  >
                    <option value="Video">Video Call</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
              </div>

              {form.mode === "Video" ? (
                <>
                  <label className="lbl">Meeting Link</label>
                  <input
                    className="input"
                    placeholder="Zoom/Meet Link"
                    value={form.meetingLink}
                    onChange={(e) => setForm({ ...form, meetingLink: e.target.value })}
                  />
                </>
              ) : (
                <>
                  <label className="lbl">Location</label>
                  <input
                    className="input"
                    placeholder="Office Address"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                  />
                </>
              )}

              <label className="lbl">Notes (optional)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Add interviewer notes, agenda, etc."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />

              <button type="submit" className="saveBtn">
                {editingId ? "Update Interview" : "Confirm Schedule"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Profile Modal */}
      {showProfileModal && selectedApp && (
        <CandidateProfileModal
          app={selectedApp}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedApp(null);
          }}
        />
      )}

      <style>{`
        .stateBox{
          padding: 40px;
          text-align: center;
          background: #fff;
          border-radius: 16px;
          border: 1px dashed #e2e8f0;
          color: #475569;
        }
        .stateBox.empty { background: linear-gradient(180deg, #fff, #f8fafc); }
        .emptyTitle { font-weight: 900; color: #0f172a; font-size: 18px; }
        .emptySub { margin-top: 6px; opacity: 0.8; }

        .topbar{
          display:flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .stats{
          display:flex;
          gap:10px;
          flex-wrap: wrap;
        }
        .stat{
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:14px;
          padding:10px 12px;
          min-width: 120px;
          box-shadow: 0 8px 20px rgba(15,23,42,0.04);
        }
        .stat .k{
          font-size:12px;
          font-weight:900;
          color:#94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat .v{
          margin-top:4px;
          font-size:22px;
          font-weight: 1000;
          color:#0f172a;
        }
        .stat .v.blue{ color:#2563eb; }
        .stat .v.green{ color:#10b981; }
        .stat .v.orange{ color:#f97316; }

        .actions{
          display:flex;
          gap:10px;
          flex-wrap: wrap;
          align-items: center;
          flex: 1;
          justify-content: flex-end;
        }
        .searchBox, .filterBox{
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius:14px;
          padding:10px 12px;
          display:flex;
          align-items:center;
          gap:10px;
          box-shadow: 0 8px 20px rgba(15,23,42,0.04);
        }
        .searchBox{ min-width: min(480px, 100%); flex: 1; }
        .searchBox input{
          border:none;
          outline:none;
          width:100%;
          font-size:14px;
          color:#0f172a;
        }
        .filterBox select{
          border:none;
          outline:none;
          font-size:14px;
          font-weight:900;
          color:#0f172a;
          background: transparent;
        }
        .ic{ color:#94a3b8; }

        .btnPrimary{
          background: linear-gradient(135deg, #0f172a, #1f2937);
          color:#fff;
          border:none;
          padding:12px 16px;
          border-radius:14px;
          font-weight:1000;
          cursor:pointer;
          display:flex;
          align-items:center;
          gap:10px;
          transition: 0.15s;
          box-shadow: 0 10px 25px rgba(15,23,42,0.12);
          white-space: nowrap;
        }
        .btnPrimary:hover{ transform: translateY(-1px); opacity:0.95; }

        .list{
          display:grid;
          gap: 12px;
        }
        .card{
          background:#fff;
          border:1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 12px 30px rgba(15,23,42,0.06);
          display:flex;
          justify-content: space-between;
          gap: 12px;
          transition: 0.18s;
          position: relative;
          overflow: hidden;
        }
        .card:hover{
          transform: translateY(-2px);
          box-shadow: 0 18px 42px rgba(15,23,42,0.10);
          border-color: rgba(59,130,246,0.35);
        }
        .card::before{
          content:"";
          position:absolute;
          inset:-70px -70px auto auto;
          width: 180px;
          height: 180px;
          background: radial-gradient(circle at 30% 30%, rgba(59,130,246,0.14), transparent 60%);
          pointer-events:none;
        }

        .left{ display:flex; gap:12px; align-items:flex-start; flex: 1; min-width: 0; }
        .dateBox{
          width: 56px;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          background: linear-gradient(180deg, #eff6ff, #ffffff);
          color:#1d4ed8;
          display:flex;
          flex-direction: column;
          align-items:center;
          justify-content:center;
          padding: 10px 0;
          flex-shrink: 0;
        }
        .day{ font-size: 20px; font-weight: 1000; line-height: 1; }
        .mon{ font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.6px; margin-top: 4px; }

        .main{ min-width: 0; width: 100%; }
        .nameRow{
          display:flex;
          justify-content: space-between;
          gap: 10px;
          align-items: center;
        }
        .candName{
          font-weight: 1000;
          color:#0f172a;
          display:flex;
          align-items:center;
          gap:8px;
          white-space: nowrap;
          overflow:hidden;
          text-overflow: ellipsis;
          max-width: 72%;
        }
        .status{
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 1000;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          white-space: nowrap;
        }
        .miniIc{ color:#94a3b8; }
        .jobRow{
          margin-top: 6px;
          color:#475569;
          font-weight: 900;
          display:flex;
          align-items:center;
          gap:8px;
          white-space: nowrap;
          overflow:hidden;
          text-overflow: ellipsis;
        }
        .meta{
          margin-top: 10px;
          display:flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .pill{
          background:#f8fafc;
          border:1px solid #eef2f7;
          color:#334155;
          padding: 6px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 900;
          display:inline-flex;
          align-items:center;
          gap: 8px;
          text-decoration: none;
        }
        .pill.link:hover{
          background:#eff6ff;
          border-color:#dbeafe;
          color:#1d4ed8;
        }
        .notes{
          margin-top: 10px;
          background:#f1f5f9;
          border:1px solid #e2e8f0;
          padding: 10px;
          border-radius: 14px;
          color:#334155;
          font-weight: 700;
          font-size: 13px;
        }

        .right{ display:flex; gap: 8px; align-items:center; }
        .iconBtn{
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          display:grid;
          place-items:center;
          color:#64748b;
          transition: 0.15s;
        }
        .iconBtn:hover{ background:#f8fafc; color:#0f172a; transform: translateY(-1px); }
        .iconBtn.ok:hover{ background:#dcfce7; border-color:#bbf7d0; color:#15803d; }
        .iconBtn.danger:hover{ background:#fee2e2; border-color:#fecaca; color:#b91c1c; }

        /* Modal */
        .overlay{
          position: fixed;
          inset: 0;
          background: rgba(2,6,23,0.70);
          display:flex;
          align-items:center;
          justify-content:center;
          z-index: 2000;
          padding: 18px;
          backdrop-filter: blur(10px);
        }
        .modal{
          width: 100%;
          max-width: 640px;
          background:#fff;
          border-radius: 22px;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 30px 60px rgba(0,0,0,0.25);
          overflow:hidden;
          animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modalHead{
          padding: 18px 18px 14px;
          display:flex;
          justify-content: space-between;
          align-items:flex-start;
          gap: 12px;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(180deg, #fff, #f8fafc);
        }
        .modalTitle{ font-size: 18px; font-weight: 1000; color:#0f172a; }
        .modalSub{ margin-top: 4px; color:#64748b; font-size: 13px; font-weight: 600; }
        .xBtn{
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor:pointer;
          display:grid;
          place-items:center;
          color:#64748b;
        }
        .xBtn:hover{ background:#f8fafc; color:#0f172a; }

        .modalBody{ padding: 18px; }
        .lbl{
          display:block;
          font-size: 12px;
          font-weight: 1000;
          color:#334155;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 8px;
          margin-top: 12px;
        }
        .select, .input{
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          outline: none;
          font-weight: 800;
          font-size: 14px;
          box-sizing: border-box;
        }
        .row2{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .saveBtn{
          margin-top: 16px;
          width:100%;
          padding: 12px 14px;
          border:none;
          border-radius: 14px;
          cursor:pointer;
          background: linear-gradient(135deg, #0f172a, #1f2937);
          color:#fff;
          font-weight: 1000;
          transition: 0.15s;
        }
        .saveBtn:hover{ transform: translateY(-1px); opacity: 0.95; }

        @media (max-width: 900px){
          .searchBox{ min-width: 100%; }
        }
        @media (max-width: 720px){
          .row2{ grid-template-columns: 1fr; }
          .card{ flex-direction: column; }
          .right{ justify-content: flex-end; }
          .candName{ max-width: 100%; }
        }

        @keyframes popIn{
          from { transform: translateY(10px) scale(0.98); opacity: 0; }
          to { transform: translateY(0px) scale(1); opacity: 1; }
        }
      `}</style>
    </PageShell>
  );
};

export default Interviews;

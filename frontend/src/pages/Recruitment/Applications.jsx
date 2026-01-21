import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/ui/PageShell";
import { toast } from "react-toastify";
import API from "../../services/api";
import {
  FaUser,
  FaBriefcase,
  FaClock,
  FaTimes,
  FaFilePdf,
  FaPhone,
  FaEnvelope,
  FaCheckCircle,
  FaTrash,
  FaEye,
  FaSearch,
  FaFilter,
  FaIdBadge,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";
import CandidateProfileModal from "../../components/Modals/CandidateProfileModal";

import Pagination from "../../components/Pagination";

const Applications = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedApp, setSelectedApp] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [newStage, setNewStage] = useState("");

  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("All");

  const getCandidate = (app) => app?.candidateId || app?.candidate || {};
  const getTrackId = (app) =>
    app?.trackId ||
    app?.timeline?.find?.((t) => t?.meta?.trackId)?.meta?.trackId ||
    "";

  const getFileBaseUrl = () => {
    const base = (API?.defaults?.baseURL || "").replace(/\/+$/, "");
    // common case: http://localhost:5000/api -> files served on http://localhost:5000/
    return base.replace(/\/api$/i, "");
  };

  const buildFileUrl = (relPath) => {
    if (!relPath) return "";
    const root = getFileBaseUrl();
    const clean = String(relPath).replace(/^\/+/, "");
    return `${root}/${clean}`;
  };

  const stageLabel = (s) => {
    const map = {
      Applied: "Applied",
      Screened: "Screened",
      "Interview-1": "Interview 1",
      "Interview-2": "Interview 2",
      Offered: "Offered",
      Hired: "Hired",
      Rejected: "Rejected",
    };
    return map[s] || s || "Applied";
  };

  const getStatusColor = (s) => {
    const map = {
      Applied: "#3b82f6",
      Screened: "#8b5cf6",
      "Interview-1": "#f59e0b",
      "Interview-2": "#f97316",
      Offered: "#06b6d4",
      Hired: "#10b981",
      Rejected: "#ef4444",
    };
    return map[s] || "#64748b";
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/recruitment/applications");
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = items.length;
    const pending = items.filter((i) =>
      ["Applied", "Screened", "Interview-1", "Interview-2"].includes(i.status)
    ).length;
    const hired = items.filter((i) => i.status === "Hired").length;
    const rejected = items.filter((i) => i.status === "Rejected").length;
    return { total, pending, hired, rejected };
  }, [items]);

  const filtered = items.filter((app) => {
    const c = getCandidate(app);
    const nameMatch = (c?.name || "").toLowerCase().includes(search.toLowerCase());
    const emailMatch = (c?.email || "").toLowerCase().includes(search.toLowerCase());
    const roleMatch = (app?.position || "")
      .toLowerCase()
      .includes(search.toLowerCase());
    const passSearch = nameMatch || emailMatch || roleMatch;

    if (stageFilter === "All") return passSearch;
    return passSearch && app.status === stageFilter;
  });

  const pager = useClientPagination(filtered);
  const { paginatedItems } = pager;

  const openStatusModal = (app) => {
    setSelectedApp(app);
    setNewStage(app.stage || "Applied");
    setShowStatusModal(true);
  };

  const handleUpdateStage = async () => {
    if (!selectedApp || !newStage) return;
    try {
      await API.put(`/recruitment/application/${selectedApp._id}/stage`, { stage: newStage });

      toast.success(
        newStage === "Hired"
          ? "Marked as Hired ✅ (Offline process — no employee auto-created)"
          : "Status Updated ✅"
      );

      setItems((prev) =>
        prev.map((item) => (item._id === selectedApp._id ? { ...item, stage: newStage } : item))
      );
      setShowStatusModal(false);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Update failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this application?")) return;
    try {
      await API.delete(`/recruitment/application/${id}`);
      toast.success("Deleted Successfully");
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch (e) {
      toast.error(e?.response?.data?.message || "Delete failed");
    }
  };

  const fmtDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <PageShell title="Applications" subtitle="Manage incoming candidates in a clean pipeline.">
      {/* Top controls */}
      <div className="topbar">
        <div className="stats">
          <div className="stat">
            <div className="k">Total</div>
            <div className="v">{stats.total}</div>
          </div>
          <div className="stat">
            <div className="k">Active</div>
            <div className="v">{stats.active}</div>
          </div>
          <div className="stat">
            <div className="k">Hired</div>
            <div className="v green">{stats.hired}</div>
          </div>
          <div className="stat">
            <div className="k">Rejected</div>
            <div className="v red">{stats.rejected}</div>
          </div>
        </div>

        <div className="controls">
          <div className="searchBox">
            <FaSearch className="ic" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by candidate, email, job, track id…"
            />
          </div>

          <div className="filterBox">
            <FaFilter className="ic" />
            <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)}>
              <option value="All">All Stages</option>
              <option value="Applied">Applied</option>
              <option value="Screened">Screened</option>
              <option value="Interview-1">Interview 1</option>
              <option value="Interview-2">Interview 2</option>
              <option value="Offered">Offered</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="stateBox">Loading…</div>
      ) : paginatedItems.length === 0 ? (
        <div className="stateBox empty">
          <div className="emptyTitle">No applications found</div>
          <div className="emptySub">Try changing filters or search terms.</div>
        </div>
      ) : (
        <div className="grid">
          {paginatedItems.map((app) => {
            const c = getCandidate(app);
            const color = getStatusColor(app.stage);
            const trackId = getTrackId(app);

            return (
              <div key={app._id} className="card">
                <div className="cardTop">
                  <div className="cand">
                    <div className="avatar" style={{ borderColor: color }}>
                      {(c?.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="candMeta">
                      <div className="candName">{c?.name || "Unknown Candidate"}</div>
                      <div className="candEmail">{c?.email || "-"}</div>
                    </div>
                  </div>

                  <div className="pill" style={{ background: `${color}14`, color }}>
                    {stageLabel(app.stage)}
                  </div>
                </div>

                <div className="cardMid">
                  <div className="row">
                    <FaBriefcase className="rowIc" />
                    <span className="rowText">{app?.jobId?.title || "Unknown Job"}</span>
                  </div>

                  <div className="chips">
                    <span className="chip">
                      <FaClock /> Applied: {new Date(app.createdAt).toLocaleDateString()}
                    </span>
                    {trackId ? (
                      <span className="chip">
                        <FaIdBadge /> {trackId}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="cardActions">
                  <button
                    className="btnIcon"
                    onClick={() => {
                      setSelectedApp(app);
                      setShowProfileModal(true);
                    }}
                    title="View Profile"
                  >
                    <FaEye />
                  </button>

                  {app.stage === "Hired" ? (
                    <span className="hiredBadge">
                      <FaCheckCircle /> Hired (Offline)
                    </span>
                  ) : (
                    <button className="btnPrimary" onClick={() => openStatusModal(app)}>
                      Update Stage
                    </button>
                  )}

                  <button className="btnIcon danger" onClick={() => handleDelete(app._id)} title="Delete">
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Pagination Controls */}
      {
        !loading && filtered.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <Pagination pager={pager} />
          </div>
        )
      }

      {/* STATUS MODAL */}
      {
        showStatusModal && (
          <div className="overlay" onMouseDown={() => setShowStatusModal(false)}>
            <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
              <div className="modalHead">
                <div>
                  <div className="modalTitle">Update Stage</div>
                  <div className="modalSub">
                    Move <b>{(getCandidate(selectedApp)?.name || "Candidate").trim()}</b> to next stage.
                  </div>
                </div>
                <button onClick={() => setShowStatusModal(false)} className="xBtn">
                  <FaTimes />
                </button>
              </div>

              <div className="modalBody">
                <label className="lbl">Stage</label>
                <select className="select" value={newStage} onChange={(e) => setNewStage(e.target.value)}>
                  <option value="Applied">Applied</option>
                  <option value="Screened">Screened</option>
                  <option value="Interview-1">Interview Round 1</option>
                  <option value="Interview-2">Interview Round 2</option>
                  <option value="Offered">Offered</option>
                  <option value="Hired">Mark as Hired</option>
                  <option value="Rejected">Rejected</option>
                </select>

                <div className="note">
                  <b>Note:</b> Marking as <b>Hired</b> will <b>NOT</b> create an employee automatically (offline hiring + onboarding later).
                </div>

                <button className="saveBtn" onClick={handleUpdateStage}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* PROFILE MODAL */}
      {
        showProfileModal && selectedApp && (
          <CandidateProfileModal
            app={selectedApp}
            onClose={() => {
              setShowProfileModal(false);
              setSelectedApp(null);
            }}
          />
        )
      }

      <style>{`
        .stateBox {
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

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 14px;
        }

        .stats {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .stat {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 10px 12px;
          min-width: 120px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
        }
        .stat .k {
          font-size: 12px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .stat .v {
          margin-top: 4px;
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
        }
        .stat .v.green { color: #10b981; }
        .stat .v.red { color: #ef4444; }

        .controls {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
          flex: 1;
        }

        .searchBox, .filterBox {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 8px 20px rgba(15, 23, 42, 0.04);
        }
        .searchBox { min-width: min(520px, 100%); flex: 1; }
        .searchBox input {
          border: none;
          outline: none;
          width: 100%;
          font-size: 14px;
          color: #0f172a;
        }
        .filterBox select {
          border: none;
          outline: none;
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          background: transparent;
        }
        .ic { color: #94a3b8; }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 14px;
        }

        .card {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
          box-shadow: 0 10px 28px rgba(15, 23, 42, 0.06);
          transition: 0.2s;
          position: relative;
          overflow: hidden;
        }
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 40px rgba(15, 23, 42, 0.10);
          border-color: rgba(59,130,246,0.35);
        }
        .card::before {
          content: "";
          position: absolute;
          inset: -60px -60px auto auto;
          width: 160px;
          height: 160px;
          background: radial-gradient(circle at 30% 30%, rgba(59,130,246,0.16), transparent 55%);
          pointer-events: none;
        }

        .cardTop {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .cand { display: flex; gap: 10px; align-items: center; min-width: 0; }
        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          display: grid;
          place-items: center;
          font-weight: 900;
          color: #0f172a;
          background: linear-gradient(180deg, #f8fafc, #f1f5f9);
          border: 2px solid #e2e8f0;
          flex-shrink: 0;
        }
        .candMeta { min-width: 0; }
        .candName {
          font-weight: 900;
          color: #0f172a;
          font-size: 15px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
        }
        .candEmail {
          font-size: 12px;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 220px;
          margin-top: 2px;
        }
        .pill {
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          padding: 6px 10px;
          border-radius: 999px;
          border: 1px solid rgba(0,0,0,0.06);
          white-space: nowrap;
        }

        .cardMid { display: grid; gap: 10px; margin-bottom: 12px; }
        .row { display: flex; align-items: center; gap: 8px; color: #334155; }
        .rowIc { color: #94a3b8; }
        .rowText { font-weight: 800; }

        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 12px;
          font-weight: 800;
          color: #475569;
          background: #f8fafc;
          border: 1px solid #eef2f7;
          padding: 6px 10px;
          border-radius: 12px;
        }

        .cardActions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          border-top: 1px solid #f1f5f9;
          padding-top: 12px;
        }
        .btnIcon {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          display: grid;
          place-items: center;
          color: #64748b;
          transition: 0.15s;
        }
        .btnIcon:hover { background: #f8fafc; color: #0f172a; transform: translateY(-1px); }
        .btnIcon.danger:hover { background: #fee2e2; border-color: #fecaca; color: #b91c1c; }

        .btnPrimary {
          background: #0f172a;
          color: #fff;
          border: none;
          padding: 10px 14px;
          border-radius: 14px;
          font-weight: 900;
          cursor: pointer;
          transition: 0.15s;
          flex: 1;
        }
        .btnPrimary:hover { background: #1f2937; transform: translateY(-1px); }

        .hiredBadge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 900;
          color: #10b981;
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          padding: 10px 12px;
          border-radius: 14px;
          flex: 1;
          justify-content: center;
        }

        /* Modal */
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(2,6,23,0.70);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 18px;
          backdrop-filter: blur(10px);
        }
        .modal {
          width: 100%;
          max-width: 520px;
          background: #fff;
          border-radius: 22px;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 30px 60px rgba(0,0,0,0.25);
          overflow: hidden;
          animation: popIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal.wide { max-width: 920px; }
        .modalHead {
          padding: 18px 18px 14px;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(180deg, #fff, #f8fafc);
        }
        .modalTitle { font-size: 18px; font-weight: 1000; color: #0f172a; }
        .modalSub { margin-top: 4px; color: #64748b; font-size: 13px; font-weight: 600; }
        .xBtn {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #fff;
          cursor: pointer;
          display: grid;
          place-items: center;
          color: #64748b;
        }
        .xBtn:hover { background: #f8fafc; color: #0f172a; }

        .modalBody { padding: 18px; }
        .lbl { display: block; font-size: 12px; font-weight: 900; color: #334155; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
        .select {
          width: 100%;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          font-weight: 800;
          outline: none;
        }
        .note {
          margin-top: 12px;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          padding: 12px;
          border-radius: 14px;
          color: #1e40af;
          font-weight: 700;
          font-size: 13px;
        }
        .saveBtn {
          margin-top: 14px;
          width: 100%;
          padding: 12px 14px;
          border: none;
          border-radius: 14px;
          cursor: pointer;
          background: linear-gradient(135deg, #0f172a, #1f2937);
          color: #fff;
          font-weight: 1000;
          letter-spacing: 0.2px;
          transition: 0.15s;
        }
        .saveBtn:hover { transform: translateY(-1px); opacity: 0.95; }

        /* Profile */
        .profileHead { display: flex; align-items: center; gap: 12px; }
        .profileAvatar {
          width: 48px;
          height: 48px;
          border-radius: 16px;
          display: grid;
          place-items: center;
          font-weight: 1000;
          color: #0f172a;
          background: linear-gradient(135deg, #e0f2fe, #eef2ff);
          border: 1px solid #e2e8f0;
        }

        .grid2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 820px) {
          .grid2 { grid-template-columns: 1fr; }
          .searchBox { min-width: 100%; }
        }

        .panel {
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 14px;
          background: #fff;
          box-shadow: 0 10px 25px rgba(15,23,42,0.04);
        }
        .panelTitle {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 1000;
          color: #0f172a;
          margin-bottom: 12px;
        }
        .infoRow {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 10px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1px solid #eef2f7;
          margin-bottom: 10px;
        }
        .miniIc { color: #64748b; }
        .k {
          font-size: 12px;
          font-weight: 900;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .v {
          font-size: 14px;
          font-weight: 900;
          color: #0f172a;
          margin-top: 2px;
        }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

        .divider {
          height: 1px;
          background: #eef2f7;
          margin: 10px 0 12px;
        }
        .resumeBtn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          text-decoration: none;
          background: #0f172a;
          color: #fff;
          padding: 12px;
          border-radius: 14px;
          font-weight: 1000;
        }
        .resumeBtn:hover { background: #1f2937; }
        .noResume {
          text-align: center;
          padding: 12px;
          border-radius: 14px;
          border: 1px dashed #e2e8f0;
          color: #64748b;
          font-weight: 800;
        }

        .timelineMeta {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        .metaItem {
          padding: 10px;
          border-radius: 14px;
          border: 1px solid #eef2f7;
          background: #f8fafc;
        }

        .timeline {
          max-height: 360px;
          overflow: auto;
          padding-right: 6px;
        }
        .tItem {
          display: grid;
          grid-template-columns: 14px 1fr;
          gap: 10px;
          padding: 10px 6px;
          border-bottom: 1px solid #f1f5f9;
        }
        .dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #3b82f6;
          margin-top: 4px;
        }
        .tAction { font-weight: 1000; color: #0f172a; }
        .tTime { font-size: 12px; font-weight: 800; color: #94a3b8; margin-top: 4px; }
        .tMeta { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
        .tTag {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 4px 8px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          color: #475569;
        }
        .muted { color: #64748b; font-weight: 800; padding: 10px; text-align: center; }

        @keyframes popIn {
          from { transform: translateY(10px) scale(0.98); opacity: 0; }
          to { transform: translateY(0px) scale(1); opacity: 1; }
        }
      `}</style>
    </PageShell >
  );
};

export default Applications;

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import FaceCapture from "../../components/FaceCapture/FaceCapture";
import { toast } from "react-toastify";
import {
  FaUserTie,
  FaMapMarkerAlt,
  FaBriefcase,
  FaCalendarCheck,
  FaCoffee,
  FaLaptopHouse,
  FaSignOutAlt,
  FaPlay,
  FaHistory,
  FaTimes,
  FaPlaneDeparture,
  FaCalendarAlt,
} from "react-icons/fa";

// Helper for Image URL
const getImageUrl = (path) => {
  // Always serve a real file from backend uploads
  const FALLBACK = `${window.location.origin}/uploads/default-avatar.jpg`;

  if (!path) return FALLBACK;
  if (path.startsWith("http")) return path;

  const clean = path.replace(/\\/g, "/").replace(/^\/+/, "");

  // if DB already stores "uploads/xxx.jpg" or "/uploads/xxx.jpg"
  const finalPath = clean.startsWith("uploads/") ? clean : `uploads/${clean}`;

  return `${window.location.origin}/${finalPath}`;
};

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    present: 0,
    leaves: 0,
    wfh: 0,
    halfDays: 0,
    holidays: 0,
  });
  const [todayStatus, setTodayStatus] = useState("Not Started");

  // Modals & Actions
  const [showCamera, setShowCamera] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [dailyReport, setDailyReport] = useState("");
  const [actionType, setActionType] = useState(null);

  useEffect(() => {
    if (user) fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const statsRes = await API.get("/attendance/stats");
      setStats(statsRes.data);

      const attRes = await API.get("/attendance/history");
      const attData = Array.isArray(attRes.data) ? attRes.data : [];
      setHistory(attData);

      const today = new Date().toLocaleDateString("en-CA", {
        timeZone: "Asia/Kolkata",
      });
      const todayRecord = attData.find((d) => d.date === today);

      if (todayRecord) {
        if (todayRecord.punchOutTime) setTodayStatus("Completed");
        else if (todayRecord.status === "On Break") setTodayStatus("On Break");
        else setTodayStatus("Working");
      } else {
        setTodayStatus("Not Started");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= ACTIONS ================= */
  const handlePunchClick = (type) => {
    if (type === "out") {
      setShowReportModal(true);
    } else {
      setActionType("in");
      setShowCamera(true);
    }
  };

  const handleReportSubmit = () => {
    if (!dailyReport.trim() || dailyReport.length < 5) {
      return toast.warning("Please write at least 5 characters in report.");
    }
    setShowReportModal(false);
    setActionType("out");
    setShowCamera(true);
  };

  /* ================= LOCATION CAPTURE & PUNCH ================= */
  const onFaceVerified = async (faceData) => {
    toast.info("📍 Acquiring GPS Location...", { autoClose: 2000 });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const payload = {
            faceDescriptor: JSON.stringify(faceData.descriptor),
            image: faceData.image,
            location: JSON.stringify({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            }),
            dailyReport: actionType === "out" ? dailyReport : undefined,
          };

          const endpoint =
            actionType === "in"
              ? "/attendance/punch-in"
              : "/attendance/punch-out";
          await API.post(endpoint, payload);

          toast.success(
            actionType === "in"
              ? "Punch In Successful ☀️"
              : "Punch Out Successful 🏠"
          );

          setShowCamera(false);
          setDailyReport("");
          fetchDashboardData();
        } catch (err) {
          toast.error(err.response?.data?.message || "Verification Failed");
        }
      },
      (error) => {
        console.error("GPS Error:", error);
        toast.error("Location Access Denied or GPS Error. Enable GPS.");
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (loading || !user)
    return (
      <div className="loader-screen">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className="emp-dashboard">
      {/* HEADER - RESPONSIVE */}
      <header className="dash-header">
        <div className="welcome-text">
          <h1>Hi, {user.name.split(" ")[0]} 👋</h1>
          <p>Ready to check in?</p>
        </div>
        <div className="header-actions">
          {/* Date Display */}
          <span className="date-display mobile-hide">
            <FaCalendarAlt /> {new Date().toDateString()}
          </span>

          {/* LOGOUT BUTTON */}
          <button className="logout-btn" onClick={logout}>
            <FaSignOutAlt />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </header>

      <div className="grid-layout">
        {/* LEFT: PROFILE & ACTIONS */}
        <aside className="profile-card slide-up">
          <div className="profile-header">
            <img
              src={getImageUrl(user.profileImage)}
              alt="Profile"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `${window.location.origin}/uploads/default-avatar.jpg`;
              }}
            />
            <span
              className={`status-badge ${todayStatus
                .toLowerCase()
                .replace(" ", "-")}`}
            >
              {todayStatus}
            </span>
          </div>
          <h3>{user.name}</h3>
          <p className="designation">{user.designation}</p>

          <div className="info-list">
            <div className="info-item">
              <FaBriefcase /> <span>{user.companyId || "Company Staff"}</span>
            </div>
            <div className="info-item">
              <FaMapMarkerAlt />{" "}
              <span>
                {user.isWfhActive ? "Remote / WFH" : "Office Location"}
              </span>
            </div>
          </div>

          <div className="action-stack">
            {todayStatus === "Not Started" && (
              <button
                className="btn-action in pulse-btn"
                onClick={() => handlePunchClick("in")}
              >
                <FaPlay /> Punch In
              </button>
            )}
            {(todayStatus === "Working" || todayStatus === "On Break") && (
              <>
                <button
                  className="btn-action break"
                  onClick={() => navigate("/employee/attendance")}
                >
                  <FaCoffee /> Break
                </button>
                <button
                  className="btn-action out"
                  onClick={() => handlePunchClick("out")}
                >
                  <FaSignOutAlt /> Punch Out
                </button>
              </>
            )}
            <div className="secondary-actions">
              <button
                className="btn-small"
                onClick={() => navigate("/employee/leaves")}
              >
                <FaLaptopHouse /> Leaves
              </button>
              <button
                className="btn-small"
                onClick={() => navigate("/employee/attendance")}
              >
                <FaHistory /> Logs
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT: STATS & HISTORY */}
        <main className="main-content slide-up delay-1">
          {/* STATS ROW */}
          <div className="stats-row">
            <div className="stat-box">
              <h3 className="text-green">{stats.present}</h3>
              <span>Present</span>
              <div className="icon-bg green">
                <FaCalendarCheck />
              </div>
            </div>
            <div className="stat-box">
              <h3 className="text-blue">{stats.leaves}</h3>
              <span>Leaves</span>
              <div className="icon-bg blue">
                <FaPlaneDeparture />
              </div>
            </div>
            <div className="stat-box">
              <h3 className="text-purple">{stats.wfh}</h3>
              <span>WFH</span>
              <div className="icon-bg purple">
                <FaLaptopHouse />
              </div>
            </div>
            <div className="stat-box">
              <h3 className="text-orange">{stats.halfDays}</h3>
              <span>Half Days</span>
              <div className="icon-bg orange">
                <FaHistory />
              </div>
            </div>
          </div>

          {/* ATTENDANCE HISTORY TABLE */}
          <div className="history-panel">
            <div className="panel-head">
              <h3>Recent Activity</h3>
              <button
                className="view-all"
                onClick={() => navigate("/employee/attendance")}
              >
                View All
              </button>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>In</th>
                    <th>Out</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    history.slice(0, 5).map((h) => (
                      <tr key={h._id}>
                        <td>
                          {new Date(h.date).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                          })}
                        </td>
                        <td className="in-time">
                          {h.punchInTime
                            ? new Date(h.punchInTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--"}
                        </td>
                        <td className="out-time">
                          {h.punchOutTime
                            ? new Date(h.punchOutTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "--"}
                        </td>
                        <td>
                          <span
                            className={`status-pill ${h.status.toLowerCase()}`}
                          >
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* --- MODALS --- */}
      {showReportModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-head">
              <h3>Daily Report 📝</h3>
              <button onClick={() => setShowReportModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="form-body">
              <p className="info-text">Summarize your tasks before leaving.</p>
              <textarea
                rows="4"
                placeholder="e.g. Completed API integration..."
                value={dailyReport}
                onChange={(e) => setDailyReport(e.target.value)}
              ></textarea>
              <button className="btn-submit" onClick={handleReportSubmit}>
                Submit & Punch Out
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <div className="modal-overlay">
          <div className="modal-card camera-card">
            <div className="modal-head">
              <h3>{actionType === "in" ? "Punch In" : "Punch Out"}</h3>
              <button onClick={() => setShowCamera(false)}>
                <FaTimes />
              </button>
            </div>
            <FaceCapture
              onCapture={onFaceVerified}
              btnText={
                actionType === "in" ? "Verify & Punch In" : "Verify & Punch Out"
              }
            />
          </div>
        </div>
      )}

      <style>{`
        /* --- PROFESSIONAL COLOR PALETTE --- */
        :root {
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --bg-page: #f1f5f9;
            --text-dark: #0f172a;
            --text-light: #64748b;
            --white: #ffffff;
            --border: #e2e8f0;
        }

        .emp-dashboard { 
            padding: 20px; 
            background: var(--bg-page); 
            min-height: 100vh; 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            box-sizing: border-box;
        }
        
        /* HEADER */
        .dash-header { 
            display: flex; justify-content: space-between; align-items: center; 
            margin-bottom: 25px; background: var(--white); padding: 15px 20px; 
            border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); 
            border: 1px solid var(--border); position: sticky; top: 80px; z-index: 10;
        }
        .dash-header h1 { color: var(--text-dark); margin: 0; font-size: 1.25rem; font-weight: 700; }
        .dash-header p { color: var(--text-light); margin: 2px 0 0; font-size: 0.85rem; }
        
        .header-actions { display: flex; gap: 10px; align-items: center; }
        .date-display { 
            background: #f8fafc; padding: 8px 12px; border-radius: 8px; 
            color: var(--text-dark); font-weight: 600; font-size: 0.85rem;
            display: flex; align-items: center; gap: 6px; border: 1px solid var(--border);
        }
        
        /* --- LOGOUT BUTTON FIX (WITH !IMPORTANT) --- */
        .logout-btn { 
            /* Flex properties ko force karo */
            display: flex !important; 
            align-items: center !important; 
            justify-content: center !important;
            gap: 8px !important;

            /* Visuals ko force karo */
            background: #fef2f2 !important; 
            color: #ef4444 !important; 
            border: 1px solid #fee2e2 !important; 
            border-radius: 8px !important; 
            cursor: pointer !important; 
            
            /* Sizing Fixes */
            padding: 0 20px !important;  
            height: 42px !important;
            width: auto !important; /* Auto width taki text fit ho */
            white-space: nowrap !important; /* Text tutega nahi */
            font-size: 0.85rem !important;
            font-weight: 600 !important;
        }

        .logout-text {
             display: inline-block !important;
        }

        /* GRID LAYOUT */
        .grid-layout { display: grid; grid-template-columns: 1fr; gap: 20px; }

        /* PROFILE CARD */
        .profile-card { 
            background: white; padding: 25px; border-radius: 16px; 
            text-align: center; border: 1px solid var(--border); 
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); 
        }
        .profile-header { position: relative; width: 90px; margin: 0 auto 15px; }
        .profile-header img { width: 90px; height: 90px; border-radius: 50%; object-fit: cover; border: 3px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .status-badge { 
            position: absolute; bottom: 0; right: 0; font-size: 0.65rem; 
            padding: 3px 8px; border-radius: 20px; font-weight: 700; color: white; 
            border: 2px solid white; text-transform: uppercase; 
        }
        .status-badge.working { background: #10b981; } 
        .status-badge.not-started { background: #9ca3af; } 
        .status-badge.completed { background: #3b82f6; }

        .profile-card h3 { margin: 0; color: var(--text-dark); font-size: 1.2rem; font-weight: 700; }
        .designation { 
            color: var(--primary); font-weight: 600; margin-bottom: 20px; 
            display: inline-block; background: #eff6ff; padding: 4px 10px; 
            border-radius: 8px; font-size: 0.8rem; margin-top: 5px; 
        }
        .info-list { text-align: left; margin-bottom: 25px; border-top: 1px solid var(--border); padding-top: 15px; }
        .info-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; color: var(--text-dark); font-size: 0.85rem; font-weight: 500; }
        .info-item svg { color: var(--primary); width: 16px; }
        
        /* ACTION BUTTONS */
        .action-stack { display: flex; flex-direction: column; gap: 10px; }
        .btn-action { 
            width: 100%; padding: 14px; border: none; border-radius: 12px; 
            font-weight: 700; cursor: pointer; display: flex; align-items: center; 
            justify-content: center; gap: 8px; transition: 0.2s; font-size: 1rem; 
            min-height: 50px; 
        }
        .btn-action.in { background: #10b981; color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25); }
        .btn-action.out { background: #ef4444; color: white; }
        .btn-action.break { background: #f59e0b; color: white; }
        .btn-action:active { transform: scale(0.98); }

        .secondary-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 5px; }
        .btn-small { 
            padding: 12px; border: 1px solid var(--border); background: white; 
            color: var(--text-dark); border-radius: 10px; cursor: pointer; 
            font-size: 0.85rem; font-weight: 600; display: flex; 
            justify-content: center; gap: 6px; align-items: center; 
            min-height: 45px;
        }

        /* STATS */
        .stats-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 25px; }
        .stat-box { 
            background: white; padding: 15px; border-radius: 12px; 
            border: 1px solid var(--border); 
            display: flex; flex-direction: column; align-items: flex-start; 
            justify-content: center; min-height: 90px; position: relative;
        }
        .stat-box h3 { font-size: 1.5rem; margin: 0; font-weight: 800; line-height: 1.1; }
        .stat-box span { color: var(--text-light); font-size: 0.75rem; font-weight: 600; margin-top: 4px; text-transform: uppercase; }
        .icon-bg { 
            position: absolute; right: 10px; top: 10px; 
            width: 30px; height: 30px; border-radius: 8px; display: flex; 
            align-items: center; justify-content: center; font-size: 1rem; opacity: 0.15; 
        }
        .text-green { color: #10b981; } .icon-bg.green { background: #10b981; color: #10b981; } 
        .text-blue { color: #3b82f6; } .icon-bg.blue { background: #3b82f6; color: #3b82f6; }
        .text-purple { color: #8b5cf6; } .icon-bg.purple { background: #8b5cf6; color: #8b5cf6; } 
        .text-orange { color: #f59e0b; } .icon-bg.orange { background: #f59e0b; color: #f59e0b; }

        /* HISTORY TABLE */
        .history-panel { background: white; padding: 20px; border-radius: 16px; border: 1px solid var(--border); }
        .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .panel-head h3 { margin: 0; font-size: 1.1rem; color: var(--text-dark); font-weight: 700; }
        .table-responsive { overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .modern-table { width: 100%; border-collapse: collapse; min-width: 300px; }
        .modern-table th { text-align: left; padding: 12px; background: #f8fafc; color: var(--text-light); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; border-radius: 6px; }
        .modern-table td { padding: 12px; border-bottom: 1px solid #f1f5f9; color: var(--text-dark); font-weight: 500; font-size: 0.85rem; }
        .in-time { color: #10b981; } .out-time { color: #ef4444; }
        .status-pill { padding: 3px 8px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
        .status-pill.present, .status-pill.completed { background: #dcfce7; color: #166534; }
        .status-pill.halfday { background: #fef3c7; color: #b45309; } .status-pill.on { background: #e0f2fe; color: #0369a1; }

        /* MODAL & OTHERS */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px); padding: 20px; }
        .modal-card { background: white; padding: 25px; border-radius: 16px; width: 100%; max-width: 400px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2); }
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 1px solid var(--border); }
        .modal-head h3 { margin: 0; font-size: 1.2rem; }
        textarea { width: 100%; border: 1px solid var(--border); border-radius: 10px; padding: 12px; font-family: inherit; font-size: 0.95rem; margin-top: 10px; }
        .btn-submit { width: 100%; margin-top: 15px; padding: 14px; background: var(--primary); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
        .pulse-btn { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        .slide-up { animation: slideUp 0.5s ease-out forwards; opacity: 0; transform: translateY(20px); }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        .loader-screen { display: flex; justify-content: center; align-items: center; height: 100vh; background: var(--bg-page); }
        .spinner { border: 4px solid #e5e7eb; border-top: 4px solid var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* --- DESKTOP BREAKPOINT --- */
        @media (min-width: 1024px) {
            .emp-dashboard { padding: 40px; max-width: 1200px; margin: 0 auto; }
            .grid-layout { grid-template-columns: 320px 1fr; gap: 40px; }
            .profile-card { position: sticky; top: 100px; height: fit-content; text-align: center; }
            .stats-row { grid-template-columns: repeat(4, 1fr); gap: 20px; }
            .stat-box { padding: 25px; min-height: 120px; }
            .stat-box h3 { font-size: 2.2rem; }
            .icon-bg { width: 50px; height: 50px; font-size: 1.5rem; top: 50%; transform: translateY(-50%); right: 20px; }
            
            .dash-header { padding: 25px; }
            .dash-header h1 { font-size: 1.8rem; }
            
            .mobile-hide { display: inline; }
        }

        /* --- TABLET BREAKPOINT --- */
        @media (min-width: 600px) and (max-width: 1023px) {
            .stats-row { grid-template-columns: 1fr 1fr; }
            .grid-layout { gap: 25px; }
            .mobile-hide { display: none; } 
        }

        /* --- MOBILE BREAKPOINT FIX --- */
        @media (max-width: 480px) {
            .mobile-hide { display: none; }
            .dash-header { flex-direction: row; padding: 12px 15px; }
            .header-actions { gap: 8px; }

            /* Mobile pe text ko chupa do aur !important se force karo */
            .logout-text { display: none !important; }
            
            /* Button ko square bana do */
            .logout-btn { 
                width: 42px !important;   
                height: 42px !important;
                padding: 0 !important; 
                justify-content: center !important;
            }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDashboard;

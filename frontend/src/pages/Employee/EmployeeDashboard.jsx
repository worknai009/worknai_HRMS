import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import FaceCapture from '../../components/FaceCapture/FaceCapture';
import { toast } from 'react-toastify';
import { 
  FaUserTie, FaMapMarkerAlt, FaBriefcase, FaEnvelope, 
  FaCalendarCheck, FaCoffee, FaLaptopHouse, FaSignOutAlt,
  FaPlay, FaHistory, FaTimes, FaPlaneDeparture, FaCalendarAlt
} from 'react-icons/fa';

// Helper for Image URL
const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/150';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000/${path.replace(/\\/g, '/')}`; 
};

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ present: 0, leaves: 0, wfh: 0, halfDays: 0, holidays: 0 });
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
      const statsRes = await API.get('/attendance/stats');
      setStats(statsRes.data);

      const attRes = await API.get('/attendance/history'); 
      const attData = Array.isArray(attRes.data) ? attRes.data : [];
      setHistory(attData);

      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const todayRecord = attData.find(d => d.date === today);
      
      if (todayRecord) {
        if (todayRecord.punchOutTime) setTodayStatus("Completed");
        else if (todayRecord.status === 'On Break') setTodayStatus("On Break");
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
    if (type === 'out') {
        setShowReportModal(true);
    } else {
        setActionType('in');
        setShowCamera(true);
    }
  };

  const handleReportSubmit = () => {
      if(!dailyReport.trim() || dailyReport.length < 5) {
          return toast.warning("Please write at least 5 characters in report.");
      }
      setShowReportModal(false);
      setActionType('out');
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
                lng: position.coords.longitude 
            }),
            dailyReport: actionType === 'out' ? dailyReport : undefined
          };

          const endpoint = actionType === 'in' ? '/attendance/punch-in' : '/attendance/punch-out';
          await API.post(endpoint, payload);
          
          toast.success(actionType === 'in' ? "Punch In Successful ☀️" : "Punch Out Successful 🏠");
          
          setShowCamera(false);
          setDailyReport(""); 
          fetchDashboardData(); 

        } catch (err) {
          // 403 Errors will show here
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

  if (loading || !user) return <div className="loader-screen"><div className="spinner"></div></div>;

  return (
    <div className="emp-dashboard">
      
      {/* HEADER */}
      <header className="dash-header">
        <div className="welcome-text">
          <h1>Hello, {user.name.split(' ')[0]} 👋</h1>
          <p>Let's make today productive!</p>
        </div>
        <div className="header-actions">
            <span className="date-display"><FaCalendarAlt/> {new Date().toDateString()}</span>
            <button className="logout-btn" onClick={logout}>
                <FaSignOutAlt/> <span>Logout</span>
            </button>
        </div>
      </header>

      <div className="grid-layout">
        
        {/* LEFT: PROFILE & ACTIONS */}
        <aside className="profile-card slide-up">
          <div className="profile-header">
            <img src={getImageUrl(user.profileImage)} alt="Profile" onError={(e) => e.target.src = 'https://via.placeholder.com/150'} />
            <span className={`status-badge ${todayStatus.toLowerCase().replace(' ', '-')}`}>{todayStatus}</span>
          </div>
          <h3>{user.name}</h3>
          <p className="designation">{user.designation}</p>
          
          <div className="info-list">
            <div className="info-item"><FaBriefcase/> <span>{user.companyId || 'Company Staff'}</span></div>
            <div className="info-item"><FaMapMarkerAlt/> <span>{user.isWfhActive ? 'Remote / WFH' : 'Office Location'}</span></div>
          </div>

          <div className="action-stack">
            {todayStatus === 'Not Started' && (
              <button className="btn-action in pulse-btn" onClick={() => handlePunchClick('in')}>
                <FaPlay/> Punch In
              </button>
            )}
            {(todayStatus === 'Working' || todayStatus === 'On Break') && (
              <>
                <button className="btn-action break" onClick={() => navigate('/employee/attendance')}>
                  <FaCoffee/> Manage Break
                </button>
                <button className="btn-action out" onClick={() => handlePunchClick('out')}>
                  <FaSignOutAlt/> Punch Out
                </button>
              </>
            )}
            <div className="secondary-actions">
                <button className="btn-small" onClick={() => navigate('/employee/leaves')}>
                <FaLaptopHouse/> WFH / Leave
                </button>
                <button className="btn-small" onClick={() => navigate('/employee/attendance')}>
                <FaHistory/> Logs
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
              <div className="icon-bg green"><FaCalendarCheck/></div>
            </div>
            <div className="stat-box">
              <h3 className="text-blue">{stats.leaves}</h3>
              <span>Leaves</span>
              <div className="icon-bg blue"><FaPlaneDeparture/></div>
            </div>
            <div className="stat-box">
              <h3 className="text-purple">{stats.wfh}</h3>
              <span>WFH</span>
              <div className="icon-bg purple"><FaLaptopHouse/></div>
            </div>
            <div className="stat-box">
              <h3 className="text-orange">{stats.halfDays}</h3>
              <span>Half Days</span>
              <div className="icon-bg orange"><FaHistory/></div>
            </div>
          </div>

          {/* ATTENDANCE HISTORY TABLE */}
          <div className="history-panel">
            <div className="panel-head">
              <h3>Recent Activity</h3>
              <button className="view-all" onClick={() => navigate('/employee/attendance')}>View Full History</button>
            </div>
            <div className="table-responsive">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>In Time</th>
                    <th>Out Time</th>
                    <th>Mode</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? <tr><td colSpan="5" className="text-center">No records found</td></tr> : 
                    history.slice(0, 5).map(h => (
                      <tr key={h._id}>
                        <td>{new Date(h.date).toLocaleDateString()}</td>
                        <td className="in-time">{h.punchInTime ? new Date(h.punchInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</td>
                        <td className="out-time">{h.punchOutTime ? new Date(h.punchOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--'}</td>
                        <td>{h.mode}</td>
                        <td><span className={`status-pill ${h.status.toLowerCase()}`}>{h.status}</span></td>
                      </tr>
                    ))
                  }
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
                  <div className="modal-head"><h3>Daily Work Report 📝</h3><button onClick={() => setShowReportModal(false)}><FaTimes/></button></div>
                  <div className="form-body">
                      <p className="info-text">Please summarize your work today before punching out.</p>
                      <textarea 
                        rows="4" 
                        placeholder="e.g. Completed API integration..." 
                        value={dailyReport} 
                        onChange={(e) => setDailyReport(e.target.value)}
                      ></textarea>
                      <button className="btn-submit" onClick={handleReportSubmit}>Submit & Punch Out</button>
                  </div>
              </div>
          </div>
      )}

      {showCamera && (
        <div className="modal-overlay">
          <div className="modal-card camera-card">
            <div className="modal-head"><h3>{actionType === 'in' ? "Punch In" : "Punch Out"} Verification</h3><button onClick={() => setShowCamera(false)}><FaTimes/></button></div>
            <FaceCapture onCapture={onFaceVerified} btnText={actionType === 'in' ? "Verify & Punch In" : "Verify & Punch Out"} />
          </div>
        </div>
      )}

      <style>{`
        /* --- CLEAN & VISIBLE COLOR PALETTE --- */
        :root {
            --primary: #10b981;       /* Emerald 500 */
            --primary-dark: #047857;  /* Emerald 700 */
            --bg-page: #f3f4f6;       /* Light Grey Background */
            --text-dark: #111827;     /* Almost Black */
            --text-light: #4b5563;    /* Dark Grey */
            --white: #ffffff;
            --border: #e5e7eb;
        }

        .emp-dashboard { padding: 30px; background: var(--bg-page); min-height: 100vh; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        
        /* HEADER - FIXED */
        .dash-header { 
            display: flex; justify-content: space-between; align-items: center; 
            margin-bottom: 30px; background: var(--white); padding: 20px; 
            border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); 
            border: 1px solid var(--border); flex-wrap: wrap; gap: 15px;
        }
        .dash-header h1 { color: var(--primary-dark); margin: 0; font-size: 1.5rem; font-weight: 800; }
        .dash-header p { color: var(--text-light); margin: 4px 0 0; font-size: 0.9rem; }
        
        .header-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
        .date-display { 
            background: #f1f5f9; padding: 10px 15px; border-radius: 8px; 
            color: var(--text-dark); font-weight: 600; font-size: 0.9rem;
            display: flex; align-items: center; gap: 8px; white-space: nowrap;
        }
        
        /* LOGOUT BUTTON FIX */
        .logout-btn { 
            background: #fff; color: #ef4444; border: 1px solid #fee2e2; 
            padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; 
            display: flex; align-items: center; gap: 8px; transition: 0.2s; font-size: 0.9rem;
            white-space: nowrap; flex-shrink: 0; min-width: 100px; justify-content: center;
        }
        .logout-btn:hover { background: #fee2e2; }

        /* GRID LAYOUT */
        .grid-layout { display: grid; grid-template-columns: 320px 1fr; gap: 30px; }

        /* PROFILE CARD */
        .profile-card { 
            background: white; padding: 30px; border-radius: 16px; 
            text-align: center; border: 1px solid var(--border); 
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); 
            height: fit-content; position: sticky; top: 20px;
        }
        .profile-header { position: relative; width: 100px; margin: 0 auto 20px; }
        .profile-header img { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .status-badge { 
            position: absolute; bottom: 0; right: 0; font-size: 0.7rem; 
            padding: 4px 10px; border-radius: 20px; font-weight: 700; color: white; 
            border: 2px solid white; text-transform: uppercase; 
        }
        .status-badge.working { background: #10b981; } 
        .status-badge.not-started { background: #9ca3af; } 
        .status-badge.completed { background: #3b82f6; }

        .profile-card h3 { margin: 0; color: var(--text-dark); font-size: 1.3rem; font-weight: 700; }
        .designation { 
            color: var(--primary); font-weight: 600; margin-bottom: 25px; 
            display: inline-block; background: #ecfdf5; padding: 4px 12px; 
            border-radius: 12px; font-size: 0.85rem; margin-top: 5px; 
        }
        
        .info-list { text-align: left; margin-bottom: 30px; border-top: 1px solid var(--border); padding-top: 20px; }
        .info-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: var(--text-dark); font-size: 0.9rem; font-weight: 500; }
        .info-item svg { color: var(--primary); }
        
        .action-stack { display: flex; flex-direction: column; gap: 12px; }
        .btn-action { 
            width: 100%; padding: 14px; border: none; border-radius: 10px; 
            font-weight: 700; cursor: pointer; display: flex; align-items: center; 
            justify-content: center; gap: 10px; transition: 0.2s; font-size: 1rem; 
        }
        .btn-action.in { background: #10b981; color: white; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); }
        .btn-action.out { background: #ef4444; color: white; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
        .btn-action.break { background: #f59e0b; color: white; }
        .btn-action:hover { opacity: 0.9; transform: translateY(-2px); }

        .secondary-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
        .btn-small { 
            padding: 10px; border: 1px solid var(--border); background: white; 
            color: var(--text-dark); border-radius: 8px; cursor: pointer; 
            font-size: 0.85rem; font-weight: 600; display: flex; 
            justify-content: center; gap: 6px; align-items: center; transition: 0.2s; 
        }
        .btn-small:hover { background: #f8fafc; border-color: var(--primary); color: var(--primary); }

        /* STATS */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .stat-box { 
            background: white; padding: 20px; border-radius: 16px; 
            border: 1px solid var(--border); box-shadow: 0 2px 5px rgba(0,0,0,0.02); 
            display: flex; flex-direction: column; align-items: flex-start; 
            position: relative; overflow: hidden; min-height: 100px; justify-content: center;
        }
        .stat-box h3 { font-size: 1.8rem; margin: 0; font-weight: 800; line-height: 1.2; }
        .stat-box span { color: var(--text-light); font-size: 0.85rem; font-weight: 600; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        .text-green { color: #10b981; } .text-blue { color: #3b82f6; } .text-purple { color: #8b5cf6; } .text-orange { color: #f59e0b; }
        
        .icon-bg { 
            position: absolute; right: 15px; top: 50%; transform: translateY(-50%); 
            width: 45px; height: 45px; border-radius: 12px; display: flex; 
            align-items: center; justify-content: center; font-size: 1.4rem; opacity: 0.15; 
        }
        .icon-bg.green { background: #10b981; color: #10b981; } .icon-bg.blue { background: #3b82f6; color: #3b82f6; }
        .icon-bg.purple { background: #8b5cf6; color: #8b5cf6; } .icon-bg.orange { background: #f59e0b; color: #f59e0b; }

        /* HISTORY TABLE */
        .history-panel { background: white; padding: 25px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
        .panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .panel-head h3 { margin: 0; font-size: 1.2rem; color: var(--text-dark); font-weight: 700; }
        .view-all { color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; font-size: 0.9rem; }
        
        .table-responsive { overflow-x: auto; }
        .modern-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .modern-table th { text-align: left; padding: 15px; background: #f8fafc; color: var(--text-light); font-weight: 600; border-radius: 8px; font-size: 0.85rem; text-transform: uppercase; }
        .modern-table td { padding: 15px; border-bottom: 1px solid #f1f5f9; color: var(--text-dark); font-weight: 500; font-size: 0.9rem; }
        .in-time { color: #10b981; font-weight: 700; } .out-time { color: #ef4444; font-weight: 700; }
        
        .status-pill { padding: 4px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; display: inline-block; }
        .status-pill.present, .status-pill.completed { background: #dcfce7; color: #166534; }
        .status-pill.halfday { background: #fef3c7; color: #b45309; } .status-pill.on { background: #e0f2fe; color: #0369a1; }

        /* MODAL & CAMERA BUTTON FIXES */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(4px); }
        .modal-card { background: white; padding: 30px; border-radius: 16px; width: 90%; max-width: 450px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2); }
        
        /* Camera Card specific styles to handle the button */
        .camera-card {
            display: flex;
            flex-direction: column;
            max-height: 90vh; /* Prevent it from being taller than the screen */
            overflow-y: auto; /* Allow scrolling if content is too tall */
        }
        
        .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--border); padding-bottom: 15px; flex-shrink: 0; }
        .modal-head h3 { margin: 0; font-size: 1.4rem; color: var(--text-dark); }
        .info-text { color: var(--text-light); font-size: 0.95rem; margin-bottom: 15px; }
        
        textarea { width: 100%; border: 1px solid var(--border); border-radius: 8px; padding: 12px; font-family: inherit; resize: none; font-size: 1rem; color: var(--text-dark); box-sizing: border-box; }
        textarea:focus { outline: none; border-color: var(--primary); }
        
        .btn-submit { width: 100%; margin-top: 20px; padding: 12px; background: var(--primary); color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 1rem; transition: 0.2s; }
        .btn-submit:hover { background: var(--primary-dark); }
        
        .pulse-btn { animation: pulse 2s infinite; }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); } 70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); } 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); } }
        
        .slide-up { animation: slideUp 0.5s ease-out forwards; opacity: 0; transform: translateY(20px); }
        @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
        
        .loader-screen { display: flex; justify-content: center; align-items: center; height: 100vh; background: var(--bg-page); }
        .spinner { border: 4px solid #e5e7eb; border-top: 4px solid var(--primary); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

        /* --- MOBILE RESPONSIVE CSS --- */
        @media (max-width: 900px) {
            .grid-layout { grid-template-columns: 1fr; gap: 20px; }
            .profile-card { position: static; margin-bottom: 20px; }
            .stats-row { grid-template-columns: 1fr 1fr; gap: 15px; }
        }

        @media (max-width: 600px) {
            .emp-dashboard { padding: 15px; }
            .dash-header { flex-direction: column; align-items: flex-start; gap: 15px; padding: 15px; }
            .header-actions { width: 100%; justify-content: space-between; }
            .logout-btn { padding: 8px 12px; font-size: 0.8rem; }
            
            .stats-row { grid-template-columns: 1fr 1fr; }
            .stat-box { padding: 15px; min-height: 80px; }
            .stat-box h3 { font-size: 1.5rem; }
            
            .history-panel { padding: 15px; }
            .panel-head { flex-direction: column; align-items: flex-start; gap: 10px; }
            .view-all { font-size: 0.85rem; align-self: flex-end; }
            
            /* Stack secondary buttons */
            .secondary-actions { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDashboard;
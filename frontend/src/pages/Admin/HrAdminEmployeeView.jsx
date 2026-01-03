import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import { toast } from 'react-toastify';
import {
  FaArrowLeft, FaEnvelope, FaPhone, FaCalendarAlt,
  FaMoneyBillWave, FaEdit, FaSave, FaTimes, FaCalculator,
  FaCheckCircle, FaLaptopHouse, FaPlaneDeparture, FaFileAlt, 
  FaClock, FaExclamationTriangle, FaSignInAlt, FaSignOutAlt, FaUserTie
} from 'react-icons/fa';

// Helper for Image URL
const getImageUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/150';
  if (path.startsWith('http')) return path;
  return `http://localhost:5000/${path.replace(/\\/g, '/')}`;
};

const HrAdminEmployeeView = () => {
  const { userId } = useParams();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [leaves, setLeaves] = useState([]);
  
  // Payroll State
  const [dates, setDates] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
  });
  const [payrollStats, setPayrollStats] = useState(null);
  const [calculating, setCalculating] = useState(false);

  // Manual Attendance State
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualStatus, setManualStatus] = useState('Present');

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchEmployeeKundali();
  }, [userId]);

  const fetchEmployeeKundali = async () => {
    try {
      setLoading(true);
      
      const res = await API.get(`/hr/history/${userId}`);
      setUser(res.data.user);
      setHistory(res.data.history || []);

      try {
          const leaveRes = await API.get(`/leaves/employee/${userId}`);
          setLeaves(Array.isArray(leaveRes.data) ? leaveRes.data : []);
      } catch (e) {
          console.warn("Leave fetch failed", e);
          setLeaves([]);
      }

      setEditForm({
        name: res.data.user.name,
        mobile: res.data.user.mobile,
        designation: res.data.user.designation,
        basicSalary: res.data.user.basicSalary,
        joiningDate: res.data.user.joiningDate ? res.data.user.joiningDate.split('T')[0] : ''
      });
    } catch (err) {
      toast.error("Failed to load details");
    } finally {
      setLoading(false);
    }
  };

  /* ================= ACTIONS ================= */
  
  const handleUpdate = async () => {
    try {
      await API.put(`/hr/employee/${userId}`, editForm);
      toast.success("Profile Updated Successfully");
      setUser({ ...user, ...editForm });
      setIsEditing(false);
    } catch (err) {
      toast.error("Update Failed");
    }
  };

  const calculateSalary = async () => {
    try {
      setCalculating(true);
      const res = await API.get(`/hr/payroll/${userId}?startDate=${dates.startDate}&endDate=${dates.endDate}`);
      setPayrollStats(res.data);
      toast.success("Salary Calculated");
    } catch (err) {
      toast.error("Calculation Error");
    } finally {
      setCalculating(false);
    }
  };

  const markManualAttendance = async () => {
    try {
      await API.post('/hr/attendance/manual', {
        userId: user._id,
        date: manualDate,
        status: manualStatus,
        remarks: "Marked manually by HR"
      });
      toast.success("Attendance Updated");
      fetchEmployeeKundali(); 
    } catch (err) {
      toast.error("Failed to mark attendance");
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    try {
      await API.put('/leaves/update-status', { leaveId, status });
      toast.success(`Request ${status}`);
      await fetchEmployeeKundali(); 
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const wfhCount = history.filter(h => h.mode === 'WFH').length;
  const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
  const totalPresent = history.filter(h => ['Present', 'HalfDay', 'Punched Out'].includes(h.status)).length;
  const totalAbsent = history.filter(h => h.status === 'Absent').length;

  if (loading || !user) return (
    <div className="loader-screen">
      <div className="spinner"></div>
      <p>Loading Employee Data...</p>
    </div>
  );

  return (
    <div className="view-page">
      
      {/* --- HEADER --- */}
      <header className="view-header">
        <div className="header-left">
            <button className="back-btn" onClick={() => navigate(-1)}><FaArrowLeft/> Back</button>
            <div className="title-box">
                <h2>{user.name}</h2>
                <span className="subtitle">ID: {user._id.substring(user._id.length - 6).toUpperCase()}</span>
            </div>
        </div>
        <div className="header-right">
            <span className={`status-badge ${user.status === 'Active' ? 'active' : 'inactive'}`}>
                {user.status}
            </span>
        </div>
      </header>

      <div className="grid-layout">
        
        {/* === LEFT COLUMN: PROFILE & MANUAL ATTENDANCE === */}
        <aside className="left-panel">
          
          {/* 1. PROFILE CARD */}
          <div className="modern-card profile-card">
            <div className="profile-img-container">
                <img src={getImageUrl(user.profileImage)} alt="Profile" onError={(e) => e.target.src = 'https://via.placeholder.com/150'} />
            </div>
            
            {!isEditing ? (
              <div className="profile-info">
                <span className="designation-badge">{user.designation}</span>
                
                <div className="info-list">
                  <div className="info-item">
                    <FaEnvelope className="icon"/> 
                    <span>{user.email}</span>
                  </div>
                  <div className="info-item">
                    <FaPhone className="icon"/> 
                    <span>{user.mobile}</span>
                  </div>
                  <div className="info-item">
                    <FaCalendarAlt className="icon"/> 
                    <span>Joined: {user.joiningDate ? new Date(user.joiningDate).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="info-item salary">
                    <FaMoneyBillWave className="icon"/> 
                    <span>₹{user.basicSalary?.toLocaleString() || '0'} / mo</span>
                  </div>
                </div>
                
                <button className="btn-outline-primary full-width" onClick={() => setIsEditing(true)}>
                    <FaEdit/> Edit Profile
                </button>
              </div>
            ) : (
              <div className="edit-form animate-fade">
                <label>Full Name</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                
                <label>Mobile Number</label>
                <input value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} />
                
                <label>Basic Salary</label>
                <input type="number" value={editForm.basicSalary} onChange={e => setEditForm({...editForm, basicSalary: e.target.value})} />
                
                <div className="btn-group">
                  <button className="btn-primary" onClick={handleUpdate}><FaSave/> Save</button>
                  <button className="btn-secondary" onClick={() => setIsEditing(false)}><FaTimes/> Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* 2. MANUAL ATTENDANCE (FIXED: Now properly stacked below profile) */}
          <div className="modern-card manual-card">
            <div className="card-header-small">
                <h4><FaClock className="icon-orange"/> Manual Attendance</h4>
            </div>
            <p className="helper-text">Fix attendance errors manually.</p>
            <div className="manual-form">
              <div className="input-group">
                  <label>Date</label>
                  <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} />
              </div>
              <div className="input-group">
                  <label>Status</label>
                  <select value={manualStatus} onChange={e => setManualStatus(e.target.value)}>
                    <option value="Present">Present</option>
                    <option value="On Leave">Mark Paid Leave</option>
                    <option value="Absent">Mark Absent (Unpaid)</option>
                    <option value="HalfDay">Half Day</option>
                  </select>
              </div>
              <button className="btn-primary full-width" onClick={markManualAttendance}>Update Attendance</button>
            </div>
          </div>
        </aside>


        {/* === RIGHT COLUMN: DATA & HISTORY === */}
        <main className="right-panel">

          {/* 1. STATS OVERVIEW */}
          <section className="stats-row">
            <div className="stat-widget">
                <div className="stat-icon green"><FaCheckCircle/></div>
                <div className="stat-data">
                    <strong>{totalPresent}</strong>
                    <span>Present Days</span>
                </div>
            </div>
            <div className="stat-widget blue">
                <div className="stat-icon blue"><FaLaptopHouse/></div>
                <div className="stat-data">
                    <strong>{wfhCount}</strong>
                    <span>WFH Days</span>
                </div>
            </div>
            <div className="stat-widget orange">
                <div className="stat-icon orange"><FaPlaneDeparture/></div>
                <div className="stat-data">
                    <strong>{approvedLeaves}</strong>
                    <span>Leaves Approved</span>
                </div>
            </div>
             <div className="stat-widget red">
                <div className="stat-icon red"><FaExclamationTriangle/></div>
                <div className="stat-data">
                    <strong>{totalAbsent}</strong>
                    <span>Absent</span>
                </div>
            </div>
          </section>

          {/* 2. PAYROLL ENGINE */}
          <section className="modern-card payroll-section">
            <div className="card-header">
                <h3><FaCalculator/> Salary Calculator</h3>
            </div>
            <div className="payroll-controls">
                <div className="date-group">
                    <div className="input-wrap">
                        <label>From</label>
                        <input type="date" value={dates.startDate} onChange={e => setDates({...dates, startDate: e.target.value})} />
                    </div>
                    <div className="input-wrap">
                        <label>To</label>
                        <input type="date" value={dates.endDate} onChange={e => setDates({...dates, endDate: e.target.value})} />
                    </div>
                </div>
                <button className="btn-primary btn-calc" onClick={calculateSalary} disabled={calculating}>
                    {calculating ? 'Calculating...' : 'Calculate Net Salary'}
                </button>
            </div>

            {payrollStats && (
              <div className="payroll-result animate-slide-up">
                <div className="result-grid">
                    <div className="res-box">
                        <span>Payable Days</span>
                        <strong>{payrollStats.totalPayableDays}</strong>
                    </div>
                    <div className="res-box">
                        <span>Unpaid (LWP)</span>
                        <strong>{payrollStats.unpaidLeaveCount}</strong>
                    </div>
                    <div className="res-box">
                        <span>Holidays</span>
                        <strong>{payrollStats.holidayCount}</strong>
                    </div>
                    <div className="res-box total">
                        <span>Net Salary</span>
                        <strong>₹{payrollStats.estimatedSalary.toLocaleString()}</strong>
                    </div>
                </div>
                <div className="breakdown-note">
                    <small>Logic Used: {payrollStats.breakdown}</small>
                </div>
              </div>
            )}
          </section>

          {/* 3. LEAVE REQUESTS */}
          <section className="modern-card">
            <div className="card-header">
                <h3>Leave Request History</h3>
            </div>
            <div className="table-wrapper">
              <table className="modern-table">
                <thead><tr><th>Type</th><th>Duration</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {leaves.length === 0 ? <tr><td colSpan="5" className="empty">No leave requests found</td></tr> :
                    leaves.map(l => (
                      <tr key={l._id}>
                        <td>
                            <span className={`type-tag ${l.leaveType === 'Unpaid' ? 'unpaid' : 'paid'}`}>
                                {l.leaveType}
                            </span>
                        </td>
                        <td>{l.dayType}</td>
                        <td>
                            <div className="date-cell">
                                <span>{new Date(l.startDate).toLocaleDateString()}</span>
                                <span className="arrow">to</span>
                                <span>{new Date(l.endDate).toLocaleDateString()}</span>
                            </div>
                        </td>
                        <td><span className={`status-pill ${l.status.toLowerCase()}`}>{l.status}</span></td>
                        <td>
                          {l.status === 'Pending' ? (
                             <button className="btn-xs approve" onClick={() => handleLeaveAction(l._id, 'Approved')}>Approve</button>
                          ) : (
                             <span className="text-muted">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. DAILY ATTENDANCE LOG */}
          <section className="modern-card">
            <div className="card-header">
                <h3>Daily Attendance Log</h3>
                <span className="badge-count">{history.length} Records</span>
            </div>
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Punch In / Out</th>
                    <th>Status</th>
                    <th>Mode/Reason</th>
                    <th>Report</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 ? <tr><td colSpan="5" className="empty">No attendance records</td></tr> : 
                    history.slice(0, 30).map(rec => (
                      <tr key={rec._id} className="hover-row">
                        <td className="date-cell-bold">{new Date(rec.date).toLocaleDateString()}</td>
                        <td>
                           {rec.status === 'Absent' ? (
                               <span className="dash">-</span>
                           ) : (
                               <div className="punch-times">
                                 <div className="time-row in">
                                    <FaSignInAlt className="icon-tiny text-green"/> 
                                    {rec.punchInTime ? new Date(rec.punchInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                 </div>
                                 <div className="time-row out">
                                    <FaSignOutAlt className="icon-tiny text-red"/> 
                                    {rec.punchOutTime ? new Date(rec.punchOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                                 </div>
                               </div>
                           )}
                        </td>
                        <td>
                            <span className={`status-pill ${rec.status.replace(' ', '').toLowerCase()}`}>
                                {rec.status}
                            </span>
                        </td>
                        <td>
                            <span className="mode-text">{rec.mode}</span>
                        </td>
                        <td className="report-text">
                           {rec.dailyReport ? 
                              <div className="report-link" title={rec.dailyReport}>
                                <FaFileAlt className="icon-tiny"/> View
                              </div> : 
                              <span className="remarks">{rec.remarks || '-'}</span>
                           }
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </section>

        </main>
      </div>

      {/* --- MODERN CSS STYLES --- */}
      <style>{`
        :root {
          --primary: #ea580c;
          --primary-hover: #c2410c;
          --bg-body: #f8fafc;
          --white: #ffffff;
          --text-main: #1e293b;
          --text-light: #64748b;
          --border: #e2e8f0;
          --green: #10b981;
          --red: #ef4444;
          --blue: #3b82f6;
          --orange: #f59e0b;
        }

        .view-page {
          padding: 20px;
          background-color: var(--bg-body);
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          color: var(--text-main);
        }

        /* HEADER */
        .view-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
            background: var(--white);
            padding: 15px 20px;
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        .header-left { display: flex; align-items: center; gap: 15px; }
        .back-btn {
            background: transparent;
            border: 1px solid var(--border);
            padding: 8px 14px;
            border-radius: 8px;
            color: var(--text-light);
            cursor: pointer;
            display: flex; align-items: center; gap: 8px;
            transition: 0.2s;
            font-weight: 500;
            font-size: 0.9rem;
        }
        .back-btn:hover { border-color: var(--primary); color: var(--primary); background: #fff7ed; }
        
        .title-box h2 { margin: 0; font-size: 1.25rem; color: var(--text-main); font-weight: 700; }
        .subtitle { font-size: 0.8rem; color: var(--text-light); }

        .status-badge {
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: 600;
            text-transform: capitalize;
        }
        .status-badge.active { background: #dcfce7; color: #166534; }
        .status-badge.inactive { background: #fee2e2; color: #991b1b; }

        /* GRID */
        .grid-layout { 
            display: grid; 
            grid-template-columns: 320px minmax(0, 1fr); 
            gap: 25px; 
            align-items: start; 
        }

        .left-panel {
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        /* CARDS */
        .modern-card {
            background: var(--white);
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 0; /* Margin handled by gap */
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
            border: 1px solid var(--border);
            transition: transform 0.2s;
        }
        .modern-card:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05); }

        .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid var(--bg-body); }
        .card-header h3 { margin: 0; font-size: 1.1rem; color: var(--text-main); font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .badge-count { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; color: var(--text-light); font-weight: 600; }

        .card-header-small { margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; }
        .card-header-small h4 { margin: 0; font-size: 1rem; display: flex; align-items: center; gap: 8px; color: var(--text-main); }

        /* PROFILE */
        .profile-img-container {
            width: 100px; height: 100px; margin: 0 auto 15px;
            border-radius: 50%; padding: 4px;
            border: 2px dashed var(--primary);
        }
        .profile-img-container img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
        .profile-info { text-align: center; }
        .designation-badge { 
            background: #fff7ed; color: var(--primary); 
            padding: 5px 12px; border-radius: 20px; 
            font-size: 0.8rem; font-weight: 600;
            display: inline-block; margin-bottom: 20px;
        }
        .info-list { text-align: left; margin-bottom: 20px; }
        .info-item { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; color: var(--text-light); font-size: 0.9rem; }
        .info-item .icon { color: var(--primary); width: 16px; }
        .info-item.salary { color: var(--text-main); font-weight: 600; border-top: 1px solid var(--border); padding-top: 10px; margin-top: 10px; }

        /* BUTTONS */
        .btn-primary { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.2s; font-size: 0.9rem; }
        .btn-primary:hover { background: var(--primary-hover); box-shadow: 0 4px 6px rgba(234, 88, 12, 0.2); }
        .btn-outline-primary { background: white; border: 1px solid var(--primary); color: var(--primary); padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: 0.2s; font-size: 0.9rem; }
        .btn-outline-primary:hover { background: #fff7ed; }
        .btn-secondary { background: #e2e8f0; color: var(--text-main); border: none; padding: 10px; border-radius: 8px; cursor: pointer; }
        .full-width { width: 100%; }
        .btn-group { display: flex; gap: 10px; margin-top: 15px; }

        /* MANUAL ATTENDANCE */
        .icon-orange { color: var(--primary); }
        .helper-text { font-size: 0.8rem; color: var(--text-light); margin-bottom: 15px; }
        .manual-form { display: flex; flex-direction: column; gap: 12px; }
        .input-group label { display: block; font-size: 0.8rem; font-weight: 600; color: var(--text-light); margin-bottom: 4px; }
        .manual-form input, .manual-form select { padding: 10px; border: 1px solid var(--border); border-radius: 8px; background: #f8fafc; width: 100%; box-sizing: border-box; }
        .manual-form input:focus, .manual-form select:focus { outline: none; border-color: var(--primary); }

        /* STATS WIDGETS */
        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 25px; }
        .stat-widget { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); display: flex; align-items: center; gap: 15px; transition: transform 0.2s; border: 1px solid var(--border); }
        .stat-widget:hover { transform: translateY(-3px); box-shadow: 0 8px 12px rgba(0,0,0,0.05); }
        .stat-icon { width: 45px; height: 45px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
        .stat-icon.green { background: #dcfce7; color: #166534; }
        .stat-icon.blue { background: #dbeafe; color: #1e40af; }
        .stat-icon.orange { background: #ffedd5; color: #c2410c; }
        .stat-icon.red { background: #fee2e2; color: #991b1b; }
        .stat-data { display: flex; flex-direction: column; }
        .stat-data strong { font-size: 1.4rem; color: var(--text-main); line-height: 1.1; font-weight: 700; }
        .stat-data span { font-size: 0.8rem; color: var(--text-light); }

        /* PAYROLL ENGINE */
        .payroll-section { border-top: 4px solid var(--primary); }
        .payroll-controls { display: flex; align-items: flex-end; justify-content: space-between; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }
        .date-group { display: flex; gap: 15px; flex: 1; }
        .input-wrap { display: flex; flex-direction: column; gap: 5px; flex: 1; }
        .input-wrap label { font-size: 0.8rem; font-weight: 600; color: var(--text-light); }
        .input-wrap input { padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; width: 100%; box-sizing: border-box; }
        
        .result-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px dashed var(--border); }
        .res-box { text-align: center; }
        .res-box span { font-size: 0.8rem; color: var(--text-light); display: block; margin-bottom: 5px; }
        .res-box strong { font-size: 1.2rem; color: var(--text-main); font-weight: 700; }
        .res-box.total strong { color: var(--green); font-size: 1.4rem; }
        .breakdown-note { margin-top: 10px; font-size: 0.8rem; color: var(--text-light); text-align: center; font-style: italic; }

        /* TABLES */
        .table-wrapper { overflow-x: auto; }
        .modern-table { width: 100%; border-collapse: separate; border-spacing: 0; min-width: 600px; }
        .modern-table th { text-align: left; padding: 15px; background: #f8fafc; color: var(--text-light); font-weight: 600; font-size: 0.8rem; border-bottom: 2px solid var(--border); text-transform: uppercase; letter-spacing: 0.05em; }
        .modern-table td { padding: 15px; border-bottom: 1px solid var(--border); vertical-align: middle; font-size: 0.9rem; color: var(--text-main); }
        .hover-row:hover { background-color: #f1f5f9; transition: 0.2s; }

        /* ATTENDANCE LOG SPECIFIC */
        .date-cell-bold { font-weight: 600; color: var(--text-main); }
        .punch-times { display: flex; flex-direction: column; gap: 4px; font-size: 0.85rem; }
        .time-row { display: flex; align-items: center; gap: 6px; }
        .text-green { color: var(--green); }
        .text-red { color: var(--red); }
        .icon-tiny { font-size: 0.8rem; }

        .status-pill { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; }
        .status-pill.present { background: #dcfce7; color: #166534; }
        .status-pill.absent { background: #fee2e2; color: #991b1b; }
        .status-pill.halfday { background: #ffedd5; color: #c2410c; }
        .status-pill.onleave { background: #e0f2fe; color: #075985; }

        .type-tag { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; }
        .type-tag.paid { background: #dbeafe; color: #1e40af; }
        .type-tag.unpaid { background: #fce7f3; color: #9d174d; }

        .report-link { color: var(--blue); cursor: pointer; display: flex; align-items: center; gap: 5px; font-size: 0.85rem; font-weight: 500; }
        .btn-xs { padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; border: none; cursor: pointer; font-weight: 600; transition: 0.2s; }
        .approve { background: #dcfce7; color: #166534; }
        .approve:hover { background: #bbf7d0; }
        .text-muted { color: #cbd5e1; }
        .date-cell { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--text-light); }
        .arrow { font-size: 0.75rem; color: #94a3b8; }

        /* ANIMATIONS */
        .animate-fade { animation: fadeIn 0.3s ease-in; }
        .animate-slide-up { animation: slideUp 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
            .grid-layout { grid-template-columns: 1fr; }
            .stats-row { grid-template-columns: 1fr 1fr; }
            .result-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 600px) {
            .view-header { flex-direction: column; align-items: flex-start; gap: 10px; }
            .header-right { align-self: flex-end; }
            .stats-row { grid-template-columns: 1fr; }
            .payroll-controls { flex-direction: column; align-items: stretch; }
            .btn-calc { margin-top: 10px; }
        }
      `}</style>
    </div>
  );
};

export default HrAdminEmployeeView;
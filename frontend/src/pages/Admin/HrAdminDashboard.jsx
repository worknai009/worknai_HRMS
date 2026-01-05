import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  FaUsers, FaUserCheck, FaCalendarAlt, 
  FaCheck, FaTimes, FaEye, FaTrash, FaBuilding,
  FaUmbrellaBeach, FaFileAlt, FaSyncAlt, FaExclamationCircle
} from 'react-icons/fa';

const HrAdminDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth(); // Destructure logout

  /* ================= STATE ================= */
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees'); // 'employees', 'leaves', 'holidays', 'reports'
  
  const [employees, setEmployees] = useState([]);
  const [leaves, setLeaves] = useState([]);
  
  // Modal States
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [approveForm, setApproveForm] = useState({ basicSalary: '', joiningDate: '' });
  
  // Holiday State
  const [holidayForm, setHolidayForm] = useState({ date: '', reason: '' });

  // Stats Logic
  const stats = {
    total: employees.length,
    pending: employees.filter(e => !e.isApproved).length,
    requests: leaves.filter(l => l.status === 'Pending').length,
    active: employees.filter(e => e.isApproved).length
  };

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [empRes, leaveRes] = await Promise.all([
        API.get('/hr/employees'),
        API.get('/leaves/all')
      ]);

      setEmployees(empRes.data || []);
      setLeaves(leaveRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Dashboard sync failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= ACTIONS (LOGIC UNCHANGED) ================= */

  // 1. APPROVAL FLOW
  const initiateApproval = (emp) => {
    setSelectedEmp(emp);
    setApproveForm({ basicSalary: '', joiningDate: new Date().toISOString().split('T')[0] });
    setShowApproveModal(true);
  };

  const submitApproval = async (e) => {
    e.preventDefault();
    if (!approveForm.basicSalary || !approveForm.joiningDate) {
      return toast.warning("Salary & Joining Date are required!");
    }

    try {
      await API.post('/hr/employee/approve', {
        userId: selectedEmp._id,
        ...approveForm
      });
      toast.success(`${selectedEmp.name} is now Active! 🚀`);
      setShowApproveModal(false);
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Approval Failed");
    }
  };

  // 2. DELETE FLOW
  const handleDelete = async (userId, name) => {
    if (!window.confirm(`⚠️ ATTENTION:\n\nDelete ${name}? This action cannot be undone.`)) return;

    try {
      await API.delete(`/hr/employee/${userId}`);
      toast.success("Employee Deleted");
      fetchDashboardData();
    } catch (err) {
      toast.error("Delete operation failed");
    }
  };

  // 3. LEAVE ACTIONS
  const handleLeaveAction = async (leaveId, status) => {
    try {
      await API.put('/leaves/update-status', { leaveId, status });
      toast.success(`Request ${status}`);
      fetchDashboardData();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  // 4. MARK HOLIDAY
  const markHoliday = async () => {
    if (!holidayForm.date || !holidayForm.reason) return toast.warning("Date & Reason required");
    try {
      await API.post('/hr/holiday', holidayForm);
      toast.success("Holiday Marked! 🎉");
      setHolidayForm({ date: '', reason: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to mark holiday");
    }
  };

  /* ================= UI RENDER ================= */
  if (loading) return (
    <div className="loader-screen">
      <div className="spinner"></div>
      <p>Loading HR Console...</p>
    </div>
  );

  return (
    <div className="hr-dashboard">
      
      {/* --- HEADER --- */}
      <header className="dashboard-header">
        <div className="header-title">
          <div className="icon-box-header"><FaBuilding /></div>
          <div>
            <h1>HR Portal</h1>
            <p>Welcome, Admin</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={fetchDashboardData}>
            <FaSyncAlt className={loading ? 'spin' : ''} /> Sync Data
          </button>
        </div>
      </header>

      {/* --- STATS GRID --- */}
      <div className="stats-grid">
        <div className="stat-card orange-card">
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <span>Employees</span>
          </div>
          <div className="stat-icon"><FaUsers /></div>
        </div>
        <div className="stat-card red-card">
          <div className="stat-info">
            <h3>{stats.pending}</h3>
            <span>Approvals</span>
          </div>
          <div className="stat-icon"><FaUserCheck /></div>
        </div>
        <div className="stat-card blue-card">
          <div className="stat-info">
            <h3>{stats.requests}</h3>
            <span>Requests</span>
          </div>
          <div className="stat-icon"><FaCalendarAlt /></div>
        </div>
        <div className="stat-card green-card">
          <div className="stat-info">
            <h3>{stats.active}</h3>
            <span>Active</span>
          </div>
          <div className="stat-icon"><FaCheck /></div>
        </div>
      </div>

      {/* --- TABS --- */}
      <div className="tabs-wrapper">
        <div className="tabs-container">
          <button className={activeTab === 'employees' ? 'active' : ''} onClick={() => setActiveTab('employees')}>
            <FaUsers /> Directory
          </button>
          <button className={activeTab === 'leaves' ? 'active' : ''} onClick={() => setActiveTab('leaves')}>
            <FaCalendarAlt /> Leaves
            {stats.requests > 0 && <span className="badge">{stats.requests}</span>}
          </button>
          <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
            <FaFileAlt /> Reports
          </button>
          <button className={activeTab === 'holidays' ? 'active' : ''} onClick={() => setActiveTab('holidays')}>
            <FaUmbrellaBeach /> Holidays
          </button>
        </div>
      </div>

      {/* --- MAIN CONTENT PANEL --- */}
      <div className="content-panel animate-up">
        
        {/* 1. EMPLOYEE TABLE */}
        {activeTab === 'employees' && (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Profile</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Salary</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan="6" className="empty-row">No employees found</td></tr>
                ) : employees.map(emp => (
                  <tr key={emp._id}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-circle">
                          {emp.profileImage ? (
                            <img src={`http://localhost:5000/${emp.profileImage}`} alt="profile" onError={(e)=>{e.target.onerror=null; e.target.style.display='none'}}/>
                          ) : (
                            emp.name.charAt(0)
                          )}
                        </div>
                        <div className="user-info">
                          <strong>{emp.name}</strong>
                          <small>{emp.email}</small>
                        </div>
                      </div>
                    </td>
                    <td><span className="role-tag">{emp.designation}</span></td>
                    <td><span className={`status-pill ${emp.status.toLowerCase()}`}>{emp.status}</span></td>
                    <td>{emp.basicSalary ? `₹${emp.basicSalary.toLocaleString()}` : '--'}</td>
                    <td>{emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : '--'}</td>
                    <td>
                      <div className="action-row">
                        {!emp.isApproved && (
                          <button className="btn-icon approve" title="Approve" onClick={() => initiateApproval(emp)}>
                            <FaCheck />
                          </button>
                        )}
                        <button className="btn-icon view" title="View Details" onClick={() => navigate(`/hr/view-employee/${emp._id}`)}>
                          <FaEye />
                        </button>
                        <button className="btn-icon delete" title="Delete" onClick={() => handleDelete(emp._id, emp.name)}>
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 2. LEAVE REQUESTS TABLE */}
        {activeTab === 'leaves' && (
          <div className="table-container">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr><td colSpan="6" className="empty-row">No leave requests found</td></tr>
                ) : leaves.map(leave => (
                  <tr key={leave._id}>
                    <td>
                      <div className="user-cell">
                        <strong>{leave.userId?.name || 'Unknown'}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="type-container">
                        <span className={`type-badge ${leave.leaveType === 'Unpaid' ? 'unpaid' : 'paid'}`}>
                          {leave.leaveType}
                        </span>
                        <small>{leave.dayType}</small>
                      </div>
                    </td>
                    <td>
                      <div className="date-col">
                        <span>{new Date(leave.startDate).toLocaleDateString()}</span>
                        <span className="arrow">to</span>
                        <span>{new Date(leave.endDate).toLocaleDateString()}</span>
                        <span className="days-badge">{leave.daysCount} Day(s)</span>
                      </div>
                    </td>
                    <td className="reason-cell" title={leave.reason}>{leave.reason}</td>
                    <td>
                      <span className={`status-pill ${leave.status.toLowerCase()}`}>{leave.status}</span>
                    </td>
                    <td>
                      {leave.status === 'Pending' ? (
                        <div className="action-row">
                          <button className="btn-icon approve" onClick={() => handleLeaveAction(leave._id, 'Approved')}>
                            <FaCheck/>
                          </button>
                          <button className="btn-icon reject" onClick={() => handleLeaveAction(leave._id, 'Rejected')}>
                            <FaTimes/>
                          </button>
                        </div>
                      ) : (
                        <span className="done-text">Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 3. REPORTS TAB (Placeholder for future) */}
        {activeTab === 'reports' && (
          <div className="reports-panel">
            <div className="empty-state">
              <FaFileAlt size={48} className="empty-icon"/>
              <h3>Daily Work Reports</h3>
              <p>Employee daily status updates and work logs will appear here.</p>
              <button className="btn-secondary" disabled>Module Coming Soon</button>
            </div>
          </div>
        )}

        {/* 4. HOLIDAYS TAB */}
        {activeTab === 'holidays' && (
          <div className="holiday-panel">
            <div className="holiday-card">
              <h3><FaUmbrellaBeach /> Mark Company Holiday</h3>
              <p>Select a date to declare a holiday for all employees.</p>
              
              <div className="holiday-form">
                <div className="form-group">
                  <label>Date</label>
                  <input type="date" value={holidayForm.date} onChange={e => setHolidayForm({...holidayForm, date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Reason</label>
                  <input type="text" placeholder="e.g. Independence Day" value={holidayForm.reason} onChange={e => setHolidayForm({...holidayForm, reason: e.target.value})} />
                </div>
                <button onClick={markHoliday} className="btn-primary full-width">Mark Holiday</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- MODAL (Responsive) --- */}
      {showApproveModal && (
        <div className="modal-overlay">
          <div className="modal-card animate-pop">
            <div className="modal-header">
              <h3>Approve Employee</h3>
              <button className="close-btn" onClick={() => setShowApproveModal(false)}><FaTimes/></button>
            </div>
            <div className="modal-body">
              <p className="emp-name-display"><FaUserCheck/> {selectedEmp?.name}</p>
              <form onSubmit={submitApproval}>
                <div className="form-group">
                  <label>Basic Salary (Monthly ₹)</label>
                  <input type="number" required placeholder="e.g. 25000" value={approveForm.basicSalary} onChange={e => setApproveForm({...approveForm, basicSalary: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Joining Date</label>
                  <input type="date" required value={approveForm.joiningDate} onChange={e => setApproveForm({...approveForm, joiningDate: e.target.value})} />
                </div>
                <button type="submit" className="btn-primary full-width">Confirm Approval</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* --- CSS STYLING --- */}
      <style>{`
        :root {
          --primary: #ea580c;
          --primary-light: #fff7ed;
          --text-dark: #1f2937;
          --text-gray: #6b7280;
          --border: #e5e7eb;
          --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .hr-dashboard {
          padding: 20px;
          background: #f8fafc;
          min-height: 100vh;
          font-family: 'Inter', sans-serif;
          max-width: 1400px;
          margin: 0 auto;
        }

        /* HEADER */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          background: white;
          padding: 15px 20px;
          border-radius: 12px;
          box-shadow: var(--shadow);
        }
        .header-title { display: flex; align-items: center; gap: 15px; }
        .icon-box-header {
          width: 45px; height: 45px;
          background: linear-gradient(135deg, #fb923c, #ea580c);
          color: white;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem;
        }
        .header-title h1 { margin: 0; font-size: 1.5rem; color: var(--text-dark); }
        .header-title p { margin: 0; color: var(--text-gray); font-size: 0.9rem; }
        
        .btn-refresh {
          background: white;
          border: 1px solid var(--primary);
          color: var(--primary);
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: 0.3s;
        }
        .btn-refresh:hover { background: var(--primary-light); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* STATS */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 15px;
          margin-bottom: 25px;
        }
        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: var(--shadow);
          border-left: 4px solid transparent;
        }
        .orange-card { border-left-color: #ea580c; }
        .red-card { border-left-color: #dc2626; }
        .blue-card { border-left-color: #2563eb; }
        .green-card { border-left-color: #16a34a; }

        .stat-info h3 { margin: 0; font-size: 1.8rem; color: var(--text-dark); }
        .stat-info span { color: var(--text-gray); font-size: 0.9rem; }
        .stat-icon { font-size: 2rem; opacity: 0.2; color: var(--text-dark); }

        /* TABS */
        .tabs-wrapper {
          overflow-x: auto;
          margin-bottom: 20px;
          padding-bottom: 5px;
        }
        .tabs-container {
          display: flex;
          gap: 10px;
          min-width: max-content;
        }
        .tabs-container button {
          background: white;
          border: 1px solid var(--border);
          padding: 10px 20px;
          border-radius: 25px;
          font-size: 0.95rem;
          color: var(--text-gray);
          cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          transition: 0.3s;
        }
        .tabs-container button.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          font-weight: 600;
          box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.4);
        }
        .badge {
          background: white;
          color: var(--primary);
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 800;
        }

        /* TABLES */
        .content-panel {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow);
        }
        .table-container {
          overflow-x: auto;
        }
        .modern-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 700px; /* Ensures table doesn't squish */
        }
        .modern-table th {
          text-align: left;
          padding: 12px 15px;
          background: #f8fafc;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 700;
          border-bottom: 2px solid var(--border);
        }
        .modern-table td {
          padding: 15px;
          border-bottom: 1px solid var(--border);
          vertical-align: middle;
          font-size: 0.9rem;
        }
        
        .user-cell { display: flex; align-items: center; gap: 12px; }
        .avatar-circle {
          width: 35px; height: 35px;
          background: #fed7aa;
          color: var(--primary);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold;
          overflow: hidden;
        }
        .avatar-circle img { width: 100%; height: 100%; object-fit: cover; }
        .user-info { display: flex; flex-direction: column; }
        .user-info small { color: var(--text-gray); font-size: 0.75rem; }

        .role-tag { background: #f1f5f9; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; color: #475569; font-weight: 600; }
        
        .status-pill { padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; text-transform: capitalize; }
        .status-pill.active, .status-pill.approved { background: #dcfce7; color: #15803d; }
        .status-pill.pending { background: #fef9c3; color: #a16207; }
        .status-pill.rejected { background: #fee2e2; color: #b91c1c; }

        .type-badge { padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 700; margin-right: 5px; }
        .type-badge.paid { background: #dbeafe; color: #1e40af; }
        .type-badge.unpaid { background: #fce7f3; color: #9d174d; }

        .date-col { display: flex; flex-direction: column; font-size: 0.85rem; color: #4b5563; }
        .date-col .arrow { font-size: 0.7rem; color: #9ca3af; }
        .days-badge { font-weight: 700; color: var(--primary); font-size: 0.7rem; margin-top: 2px; }

        .reason-cell { max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: #4b5563; }

        .action-row { display: flex; gap: 8px; }
        .btn-icon {
          width: 32px; height: 32px;
          border-radius: 8px;
          border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        .btn-icon:hover { transform: scale(1.1); }
        .approve { background: #dcfce7; color: #16a34a; }
        .view { background: #e0f2fe; color: #0284c7; }
        .reject, .delete { background: #fee2e2; color: #dc2626; }
        .done-text { font-size: 0.8rem; color: var(--text-gray); font-style: italic; }

        /* EMPTY STATES */
        .empty-row { text-align: center; padding: 40px; color: var(--text-gray); }
        .reports-panel { display: flex; justify-content: center; padding: 40px 0; }
        .empty-state { text-align: center; color: #94a3b8; max-width: 300px; }
        .empty-icon { margin-bottom: 15px; color: #cbd5e1; }
        .btn-secondary {
          margin-top: 15px;
          padding: 8px 16px;
          border: 1px dashed #cbd5e1;
          background: #f8fafc;
          color: #64748b;
          border-radius: 6px;
          cursor: not-allowed;
        }

        /* HOLIDAY PANEL */
        .holiday-panel { display: flex; justify-content: center; padding: 20px 0; }
        .holiday-card {
          background: #fff;
          border: 1px solid var(--border);
          padding: 25px;
          border-radius: 12px;
          width: 100%;
          max-width: 400px;
          text-align: center;
        }
        .holiday-card h3 { color: var(--primary); margin-top: 0; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .holiday-form { margin-top: 20px; text-align: left; }
        
        /* MODAL */
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-card {
          background: white;
          width: 100%;
          max-width: 400px;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          overflow: hidden;
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 15px 20px;
          background: #f8fafc;
          border-bottom: 1px solid var(--border);
        }
        .modal-header h3 { margin: 0; font-size: 1.1rem; color: var(--text-dark); }
        .close-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; color: #9ca3af; }
        .modal-body { padding: 20px; }
        .emp-name-display { font-weight: 600; color: var(--primary); display: flex; align-items: center; gap: 8px; margin-bottom: 20px; background: var(--primary-light); padding: 10px; border-radius: 8px; }
        
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-size: 0.9rem; font-weight: 600; color: #374151; margin-bottom: 5px; }
        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-size: 1rem;
          box-sizing: border-box;
        }
        .form-group input:focus { outline: none; border-color: var(--primary); }
        .full-width { width: 100%; }
        .btn-primary {
          background: var(--primary);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: 0.2s;
        }
        .btn-primary:hover { background: #c2410c; }

        .loader-screen {
          height: 100vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          color: var(--primary);
        }
        .spinner {
          width: 40px; height: 40px;
          border: 4px solid #fed7aa;
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }
        .animate-up { animation: slideUp 0.4s ease-out; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* RESPONSIVE QUERIES */
        @media (max-width: 768px) {
          .dashboard-header { flex-direction: column; align-items: flex-start; gap: 15px; }
          .header-actions { width: 100%; }
          .btn-refresh { width: 100%; justify-content: center; }
          
          .stats-grid { grid-template-columns: 1fr; }
          
          .stat-card { padding: 15px; }
          .stat-card h3 { font-size: 1.5rem; }
          
          .tabs-container button { padding: 8px 15px; font-size: 0.85rem; }
          
          .content-panel { padding: 15px; }
          .modern-table { min-width: 600px; } /* Allows horizontal scroll */
        }
      `}</style>
    </div>
  );
};

export default HrAdminDashboard;
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import FaceCapture from '../../components/FaceCapture/FaceCapture';
import { toast } from 'react-toastify';
import { FaHistory, FaCoffee, FaPlay, FaTimes, FaCalendarAlt } from 'react-icons/fa';

const Attendance = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScanner, setShowScanner] = useState(false);
  const [breakAction, setBreakAction] = useState(null); // 'start' or 'end'

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await API.get('/attendance/history');
      setHistory(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBreak = (type) => {
    // Direct API call for Break (As per your backend logic - no face needed for break)
    // But if you WANT face, uncomment logic below. Assuming No Face for Break based on backend code.
    performBreakAction(type);
  };

  const performBreakAction = async (type) => {
      try {
        const endpoint = type === 'start' ? '/attendance/break-start' : '/attendance/break-end';
        await API.post(endpoint);
        toast.success(type === 'start' ? "Break Started ☕" : "Welcome Back 🚀");
        fetchHistory();
      } catch (err) {
        toast.error(err.response?.data?.message || "Action Failed");
      }
  };

  return (
    <div className="att-page">
      <header className="page-head">
        <h2><FaHistory/> Attendance Logs</h2>
        <p>Track your daily work hours and breaks</p>
      </header>

      {/* BREAK CONTROL */}
      <section className="break-card">
        <div className="break-info">
          <h3>Manage Breaks</h3>
          <p>Punch out for tea/lunch to maintain accurate net working hours.</p>
        </div>
        <div className="break-btns">
          <button className="btn-brk start" onClick={() => handleBreak('start')}>
            <FaCoffee/> Start Break
          </button>
          <button className="btn-brk end" onClick={() => handleBreak('end')}>
            <FaPlay/> End Break
          </button>
        </div>
      </section>

      {/* HISTORY TABLE */}
      <div className="table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Punch In</th>
              <th>Punch Out</th>
              <th>Net Hours</th>
              <th>Work Report</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan="6" className="text-center">Loading...</td></tr> : 
             history.length === 0 ? <tr><td colSpan="6" className="text-center">No records found</td></tr> :
             history.map(row => (
               <tr key={row._id}>
                 <td><FaCalendarAlt style={{marginRight:5, color:'#10b981'}}/> {new Date(row.date).toLocaleDateString()}</td>
                 <td className="text-green">{row.punchInTime ? new Date(row.punchInTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}</td>
                 <td className="text-red">{row.punchOutTime ? new Date(row.punchOutTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}</td>
                 <td><strong>{row.netWorkHours || '0.00'} hrs</strong></td>
                 <td className="report-cell" title={row.dailyReport}>{row.dailyReport ? row.dailyReport.substring(0, 20) + '...' : '-'}</td>
                 <td><span className={`pill ${row.status.toLowerCase()}`}>{row.status}</span></td>
               </tr>
             ))
            }
          </tbody>
        </table>
      </div>

      <style>{`
        .att-page { padding: 30px; max-width: 1000px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .page-head { margin-bottom: 30px; text-align: center; }
        .page-head h2 { color: #064e3b; display: flex; align-items: center; justify-content: center; gap: 10px; margin: 0; }
        .page-head p { color: #059669; margin-top: 5px; }

        .break-card { background: #ecfdf5; border: 1px solid #10b981; padding: 25px; border-radius: 16px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.1); }
        .break-info h3 { margin: 0 0 5px 0; color: #064e3b; }
        .break-info p { margin: 0; color: #047857; font-size: 0.9rem; }
        
        .break-btns { display: flex; gap: 15px; }
        .btn-brk { padding: 12px 25px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: 0.2s; }
        .btn-brk.start { background: #f59e0b; color: white; }
        .btn-brk.end { background: #10b981; color: white; }
        .btn-brk:hover { transform: scale(1.05); }

        .table-container { background: white; padding: 20px; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.02); overflow-x: auto; }
        .modern-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .modern-table th { text-align: left; padding: 15px; background: #f0fdf4; color: #065f46; font-size: 0.9rem; font-weight: 600; border-radius: 8px; }
        .modern-table td { padding: 15px; border-bottom: 1px solid #f3f4f6; color: #374151; }
        
        .pill { padding: 4px 10px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
        .pill.present, .pill.completed { background: #dcfce7; color: #166534; }
        .pill.halfday { background: #fef3c7; color: #b45309; }
        .pill.on { background: #fef3c7; color: #b45309; } /* On Break */
        
        .text-green { color: #10b981; font-weight: 600; }
        .text-red { color: #ef4444; font-weight: 600; }
        .text-center { text-align: center; color: #9ca3af; padding: 20px; }
        .report-cell { font-size: 0.85rem; color: #6b7280; font-style: italic; }

        @media (max-width: 768px) {
          .break-card { flex-direction: column; text-align: center; gap: 15px; }
        }
      `}</style>
    </div>
  );
};

export default Attendance;
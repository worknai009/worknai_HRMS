import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { FaPlaneDeparture, FaLaptopHouse, FaCalendarAlt, FaHistory, FaMapMarkerAlt } from 'react-icons/fa';

const LeaveRequest = () => {
  const { user } = useAuth(); 
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // ✅ Form State (WFH merged here)
  const [form, setForm] = useState({
    leaveType: 'Paid', // Default
    dayType: 'Full Day', 
    startDate: '', 
    endDate: '', 
    reason: ''
  });

  useEffect(() => {
    if (user?._id) fetchLeaves();
  }, [user]);

  const fetchLeaves = async () => {
    try {
      const res = await API.get(`/leaves/employee/${user._id}`);
      setLeaves(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.startDate || !form.endDate || !form.reason) return toast.warning("Please fill all required fields");

    setLoading(true);
    try {
      // ✅ If WFH, auto-attach location (if backend needs it later, currently backend stores WFH request)
      // The current backend logic treats WFH as a Leave Type 'WFH', which is perfect.
      
      await API.post('/leaves/apply', form);
      toast.success(form.leaveType === 'WFH' ? "WFH Request Sent 🏠" : "Leave Application Sent ✈️");
      
      setForm({ leaveType: 'Paid', dayType: 'Full Day', startDate: '', endDate: '', reason: '' }); // Reset
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leave-page">
      <header className="page-head">
        <h2><FaPlaneDeparture/> Leave & WFH Center</h2>
        <p>Apply for leaves or request work from home days.</p>
      </header>

      <div className="grid-split">
        
        {/* LEFT: APPLY FORM */}
        <div className="card form-card">
          <div className="card-header">
             <h3>New Application</h3>
          </div>
          
          <form onSubmit={handleSubmit}>
            
            {/* Type Selection */}
            <div className="grp">
                <label>Application Type</label>
                <div className="type-toggle">
                    {['Paid', 'Sick', 'Casual', 'WFH', 'Unpaid'].map(type => (
                        <button 
                            key={type}
                            type="button" 
                            className={`type-btn ${form.leaveType === type ? 'active' : ''}`}
                            onClick={() => setForm({...form, leaveType: type})}
                        >
                            {type === 'WFH' ? <><FaLaptopHouse/> WFH</> : type}
                        </button>
                    ))}
                </div>
            </div>

            <div className="row">
              <div className="grp">
                <label>Duration Mode</label>
                <select value={form.dayType} onChange={e => setForm({...form, dayType: e.target.value})}>
                  <option value="Full Day">Full Day</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>
            </div>
            
            <div className="row">
              <div className="grp">
                <label>Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required/>
              </div>
              <div className="grp">
                <label>End Date</label>
                <input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required/>
              </div>
            </div>

            <div className="grp">
              <label>Reason / Description</label>
              <textarea 
                rows="3" 
                value={form.reason} 
                onChange={e => setForm({...form, reason: e.target.value})} 
                required 
                placeholder={form.leaveType === 'WFH' ? "e.g. Internet issue at office, urgent home task..." : "e.g. Family function, Feeling unwell..."}
              />
            </div>

            <button type="submit" className={`btn-submit ${form.leaveType === 'WFH' ? 'wfh-color' : ''}`} disabled={loading}>
              {loading ? "Submitting..." : form.leaveType === 'WFH' ? "Request WFH Approval" : "Apply for Leave"}
            </button>
          </form>
        </div>

        {/* RIGHT: HISTORY */}
        <div className="card history-card">
          <h3><FaHistory/> Request History</h3>
          <div className="list-wrap">
            {leaves.length === 0 ? <p className="empty">No history found.</p> : 
              leaves.map(l => (
                <div key={l._id} className="leave-item">
                  <div className="l-icon">
                      {l.leaveType === 'WFH' ? <FaLaptopHouse className="icon-wfh"/> : <FaPlaneDeparture className="icon-leave"/>}
                  </div>
                  <div className="l-details">
                    <div className="l-top">
                        <strong>{l.leaveType}</strong>
                        <span className={`status ${l.status.toLowerCase()}`}>{l.status}</span>
                    </div>
                    <small>{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()}</small>
                    <p className="reason-txt">{l.reason}</p>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

      </div>

      <style>{`
        .leave-page { padding: 30px; max-width: 1100px; margin: 0 auto; font-family: 'Inter', sans-serif; }
        .page-head { margin-bottom: 30px; }
        .page-head h2 { color: #064e3b; margin: 0; display: flex; gap: 10px; align-items: center; }
        .page-head p { color: #059669; margin: 5px 0 0 0; }
        
        .grid-split { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 30px; }
        .card { background: white; padding: 25px; border-radius: 16px; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }
        .card h3 { margin-top: 0; color: #1f2937; border-bottom: 1px solid #f3f4f6; padding-bottom: 15px; margin-bottom: 20px; }

        .type-toggle { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 15px; }
        .type-btn { padding: 8px 15px; border: 1px solid #d1fae5; background: white; border-radius: 20px; cursor: pointer; color: #065f46; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 5px; transition: 0.2s; }
        .type-btn.active { background: #10b981; color: white; border-color: #10b981; }
        .type-btn:hover:not(.active) { background: #ecfdf5; }

        .row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        .grp { margin-bottom: 15px; }
        .grp label { display: block; font-size: 0.85rem; font-weight: 600; color: #4b5563; margin-bottom: 5px; }
        select, input, textarea { width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; outline: none; box-sizing: border-box; font-family: inherit; }
        select:focus, input:focus, textarea:focus { border-color: #10b981; border-width: 2px; }

        .btn-submit { width: 100%; background: #10b981; color: white; border: none; padding: 14px; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; margin-top: 10px; }
        .btn-submit.wfh-color { background: #8b5cf6; }
        .btn-submit:hover { opacity: 0.9; }

        .list-wrap { max-height: 500px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
        .leave-item { display: flex; gap: 15px; padding: 15px; background: #f9fafb; border-radius: 10px; border: 1px solid #f3f4f6; align-items: flex-start; }
        .l-icon { font-size: 1.5rem; padding: 10px; background: white; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .icon-wfh { color: #8b5cf6; }
        .icon-leave { color: #10b981; }
        
        .l-details { flex: 1; }
        .l-top { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .l-top strong { color: #374151; font-size: 0.95rem; }
        .reason-txt { margin: 5px 0 0 0; font-size: 0.85rem; color: #6b7280; font-style: italic; }
        
        .status { font-size: 0.75rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; text-transform: uppercase; }
        .status.approved { background: #dcfce7; color: #166534; }
        .status.rejected { background: #fee2e2; color: #991b1b; }
        .status.pending { background: #ffedd5; color: #9a3412; }

        .empty { text-align: center; color: #9ca3af; margin-top: 30px; }

        @media (max-width: 800px) {
          .leave-page { padding: 15px; }
          .grid-split { grid-template-columns: 1fr; }
          .row { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default LeaveRequest;
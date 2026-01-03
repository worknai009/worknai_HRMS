import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { toast } from 'react-toastify';
import {
  FaFilePdf, FaCalendarAlt, FaUserTie, FaDownload
} from 'react-icons/fa';

const HRPayrollSlip = () => {
  /* ================= STATES ================= */
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);

  const [dates, setDates] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().split('T')[0],
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString().split('T')[0]
  });

  /* ================= LOAD EMPLOYEES ================= */
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const res = await API.get('/hr/employees');
      setEmployees(res.data || []);
    } catch {
      toast.error('Failed to load employees');
    }
  };

  /* ================= GENERATE PDF ================= */
  const generateSlip = async () => {
    if (!employeeId) return toast.warning('Select employee');

    try {
      setLoading(true);

      const res = await API.get(
        `/hr/payroll/salary-slip/${employeeId}?startDate=${dates.startDate}&endDate=${dates.endDate}`,
        { responseType: 'blob' }
      );

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `Salary_Slip_${employeeId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('Salary slip downloaded');
    } catch {
      toast.error('Failed to generate salary slip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payroll-page">
      {/* ===== HEADER ===== */}
      <header className="page-header">
        <h1><FaFilePdf /> Payroll Salary Slip</h1>
        <p>Generate official employee salary slip (PDF)</p>
      </header>

      {/* ===== CARD ===== */}
      <div className="card">
        {/* EMPLOYEE */}
        <div className="field">
          <label><FaUserTie /> Employee</label>
          <select value={employeeId} onChange={e => setEmployeeId(e.target.value)}>
            <option value="">Select Employee</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.name} – {emp.designation}
              </option>
            ))}
          </select>
        </div>

        {/* DATE RANGE */}
        <div className="date-row">
          <div className="field">
            <label><FaCalendarAlt /> Start Date</label>
            <input
              type="date"
              value={dates.startDate}
              onChange={e => setDates({ ...dates, startDate: e.target.value })}
            />
          </div>

          <div className="field">
            <label><FaCalendarAlt /> End Date</label>
            <input
              type="date"
              value={dates.endDate}
              onChange={e => setDates({ ...dates, endDate: e.target.value })}
            />
          </div>
        </div>

        {/* ACTION */}
        <button className="btn-main" onClick={generateSlip} disabled={loading}>
          {loading ? 'Generating…' : <><FaDownload /> Download Salary Slip</>}
        </button>
      </div>

      {/* ===== STYLE ===== */}
      <style>{`
        .payroll-page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 40px 20px;
          font-family: 'Inter', sans-serif;
        }

        .page-header {
          max-width: 600px;
          margin: 0 auto 30px;
          text-align: center;
        }

        .page-header h1 {
          font-size: 1.9rem;
          color: #1e293b;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .page-header p {
          color: #64748b;
          margin-top: 6px;
        }

        .card {
          max-width: 520px;
          margin: auto;
          background: #fff;
          padding: 30px;
          border-radius: 22px;
          box-shadow: 0 15px 35px rgba(0,0,0,.08);
        }

        .field {
          margin-bottom: 20px;
        }

        .field label {
          display: block;
          font-size: .8rem;
          font-weight: 700;
          color: #475569;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .field select,
        .field input {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          outline: none;
          font-size: .95rem;
        }

        .date-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .btn-main {
          width: 100%;
          padding: 16px;
          background: #2563eb;
          color: #fff;
          border: none;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .btn-main:hover {
          background: #1e40af;
        }

        .btn-main:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        @media(max-width:600px) {
          .date-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default HRPayrollSlip;

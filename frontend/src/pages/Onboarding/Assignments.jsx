import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/ui/PageShell";
import { toast } from "react-toastify";
import API, { assignOnboarding, getAssignments, getTemplates } from "../../services/api";
import { useClientPagination } from "../../utils/useClientPagination";
import { FaUserEdit, FaCheckCircle, FaSpinner } from "react-icons/fa";
import Pagination from "../../components/Pagination";

const pickArray = (d) => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.rows)) return d.rows;
  return [];
};

const Assignments = () => {
  const [templates, setTemplates] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [templateId, setTemplateId] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");

  const loadEmployees = async () => {
    try {
      const res = await API.get("/hr/employees");
      const list = pickArray(res?.data);
      setEmployees(Array.isArray(list) ? list : []);
    } catch (e) {
      try {
        const res2 = await API.get("/company/employees");
        const list2 = res2?.data?.data || res2?.data;
        setEmployees(Array.isArray(list2) ? list2 : []);
      } catch {
        setEmployees([]);
      }
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([getTemplates(), getAssignments()]);
      setTemplates(pickArray(tRes?.data));
      setAssignments(pickArray(aRes?.data));
    } catch (e) {
      toast.error("Failed to load assignments/templates");
      setTemplates([]);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    loadEmployees();
  }, []);

  const pager = useClientPagination(assignments);
  const { paginatedItems } = pager;

  const employeeByEmail = useMemo(() => {
    const map = new Map();
    employees.forEach((u) => {
      const em = String(u?.email || "").trim().toLowerCase();
      if (em) map.set(em, u);
    });
    return map;
  }, [employees]);

  const onAssign = async () => {
    if (!templateId) return toast.warning("Select template");
    const email = employeeEmail.trim().toLowerCase();
    if (!email) return toast.warning("Employee email required");

    const emp = employeeByEmail.get(email);
    if (!emp?._id) {
      return toast.error("Employee not found. Please check email OR refresh employee list.");
    }

    setSaving(true);
    try {
      await assignOnboarding({
        templateId,
        userId: emp._id,
        employeeId: emp._id,
      });

      toast.success("Assigned successfully ✅");
      setEmployeeEmail("");
      await loadAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Assign failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Onboarding Assignments"
      subtitle="Strategically assign templates to your talented team."
      right={
        <button
          onClick={onAssign}
          disabled={saving}
          className="assign-btn"
        >
          {saving ? <FaSpinner className="spin" /> : <FaCheckCircle />}
          <span>{saving ? "Assigning..." : "Assign Now"}</span>
        </button>
      }
    >
      <div className="assignments-container">
        {/* ASSIGN FORM SECTION */}
        <div className="assignment-form-card">
          <div className="section-title">
            <FaUserEdit /> Assign Template
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>Select Checklist Template</label>
              <select
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                className="theme-select"
              >
                <option value="">-- Choose a template --</option>
                {templates.map((t) => (
                  <option key={t._id || t.id} value={t._id || t.id}>
                    {t.name || "Untitled"}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Employee Email</label>
              <input
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                placeholder="Enter email..."
                className="theme-input"
              />
            </div>

            <div className="helper-text">
              <p>System will automatically map email to user ID for secure assignment.</p>
            </div>
          </div>
        </div>

        {/* LIST SECTION */}
        <div className="recent-list-section">
          <div className="section-header">
            <h3>Recent Assignments</h3>
          </div>

          {loading ? (
            <div className="loading-state">
              <FaSpinner className="spin" />
              <span>Fetching assignments...Standardizing...</span>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="empty-state">
              No assignments found. Start by assigning a template above.
            </div>
          ) : (
            <div className="assignments-grid">
              {paginatedItems.map((a) => {
                const empEmail = a?.userId?.email || a?.employeeEmail || "Employee";
                const tempName = a?.templateId?.name || a?.templateName || "Template";
                const itemCount = (a?.items || a?.steps || []).length || 0;
                const status = a.status || "In Progress";

                return (
                  <div key={a._id || a.id} className="assignment-item-card">
                    <div className="item-main">
                      <div className="emp-info">
                        <span className="emp-email">{empEmail}</span>
                        <span className="temp-badge">{tempName}</span>
                      </div>
                      <div className={`status-pill ${status.toLowerCase().replace(" ", "-")}`}>
                        {status}
                      </div>
                    </div>
                    <div className="item-footer">
                      <span className="count-tag">{itemCount} Checklist Items</span>
                      <span className="date-tag">
                        Assigned on {new Date(a.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!loading && assignments.length > 0 && (
          <div className="pagination-wrapper">
            <Pagination pager={pager} />
          </div>
        )}
      </div>

      <style>{`
        .assignments-container { display: flex; flex-direction: column; gap: 24px; color: #fff; }

        /* Form Card */
        .assignment-form-card {
          background: #080d1e;
          border: 1px solid rgba(80, 200, 255, 0.07);
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(80,200,255,0.07);
          backdrop-filter: blur(24px);
        }

        .section-title {
          font-weight: 900;
          font-size: 1.2rem;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          background: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .form-grid { display: grid; gap: 20px; }

        .input-group { display: flex; flex-direction: column; gap: 8px; }
        .input-group label { font-size: 0.85rem; font-weight: 700; color: rgba(255,255,255,0.6); margin-left: 4px; }

        .theme-select, .theme-input {
          background: rgba(80, 200, 255, 0.06);
          border: 1px solid rgba(80, 200, 255, 0.18);
          color: #fff;
          padding: 14px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 0.95rem;
          outline: none;
          transition: 0.3s;
        }

        .theme-select:focus, .theme-input:focus {
          border-color: #50c8ff;
          box-shadow: 0 0 20px rgba(80, 200, 255, 0.2);
        }

        .theme-select option { background: #080d1e; color: #fff; }

        .helper-text { font-size: 0.8rem; opacity: 0.5; font-style: italic; }

        /* Assign Button */
        .assign-btn {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
          color: #fff;
          border: none;
          padding: 10px 28px;
          border-radius: 50px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: 0.3s;
          box-shadow: 0 8px 20px -4px rgba(80, 130, 255, 0.45);
        }

        .assign-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -4px rgba(140, 80, 255, 0.55);
        }

        .assign-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* List Section */
        .section-header h3 {
          font-weight: 900;
          font-size: 1.3rem;
          margin: 10px 0 20px;
          background: linear-gradient(90deg, #fff, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .assignments-grid { display: grid; gap: 14px; }

        .assignment-item-card {
          background: #080d1e;
          border: 1px solid rgba(80, 200, 255, 0.07);
          border-radius: 14px;
          padding: 18px;
          transition: 0.3s;
        }

        .assignment-item-card:hover {
          background: rgba(80, 200, 255, 0.08);
          color: #50c8ff;
          border-color: rgba(80, 200, 255, 0.18);
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -4px rgba(140, 80, 255, 0.2);
        }

        .item-main {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .emp-info { display: flex; flex-direction: column; gap: 4px; }
        .emp-email { font-weight: 800; font-size: 1.05rem; color: #fff; }
        .temp-badge {
          font-size: 0.75rem;
          font-weight: 900;
          color: #50c8ff;
          background: rgba(80, 200, 255, 0.1);
          padding: 2px 10px;
          border-radius: 20px;
          width: fit-content;
        }

        .status-pill {
          font-size: 0.7rem;
          font-weight: 900;
          padding: 4px 12px;
          border-radius: 50px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .status-pill.in-progress { background: rgba(255, 193, 7, 0.1); color: #ffc107; border: 1px solid rgba(255, 193, 7, 0.3); }
        .status-pill.completed { background: rgba(16, 185, 129, 0.1); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }

        .item-footer {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          font-weight: 600;
        }

        .loading-state, .empty-state {
          padding: 40px;
          text-align: center;
          background: rgba(0,0,0,0.2);
          border-radius: 20px;
          color: rgba(255,255,255,0.5);
          font-weight: 600;
        }

        .spin { animation: fa-spin 2s infinite linear; }
        @keyframes fa-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(359deg); }
        }

        .pagination-wrapper { margin-top: 20px; }
      `}</style>
    </PageShell>
  );
};

export default Assignments;

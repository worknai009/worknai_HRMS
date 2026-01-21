import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/ui/PageShell";
import { toast } from "react-toastify";
import API, { assignOnboarding, getAssignments, getTemplates } from "../../services/api";
import { useClientPagination } from "../../utils/useClientPagination";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const pickArray = (d) => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.rows)) return d.rows;
  return [];
};

import Pagination from "../../components/Pagination";

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
      // Prefer HR route
      const res = await API.get("/hr/employees");
      const list = pickArray(res?.data);
      setEmployees(Array.isArray(list) ? list : []);
    } catch (e) {
      // fallback: company employees
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
        userId: emp._id,      // ✅ backend expects this
        employeeId: emp._id,  // ✅ compatibility
      });

      toast.success("Assigned ✅");
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
      subtitle="Assign templates to employees."
      right={
        <button
          onClick={onAssign}
          disabled={saving}
          style={{
            border: "none",
            padding: "10px 14px",
            borderRadius: 12,
            background: "#2563eb",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {saving ? "Assigning..." : "Assign"}
        </button>
      }
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Assign Template</div>

          <div style={{ display: "grid", gap: 10 }}>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.12)",
                boxSizing: "border-box",
                fontWeight: 800,
              }}
            >
              <option value="">-- Select Template --</option>
              {templates.map((t) => (
                <option key={t._id || t.id} value={t._id || t.id}>
                  {t.name || "Untitled"}
                </option>
              ))}
            </select>

            <input
              value={employeeEmail}
              onChange={(e) => setEmployeeEmail(e.target.value)}
              placeholder="Employee Email"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.12)",
                boxSizing: "border-box",
                fontWeight: 800,
              }}
            />

            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Backend needs <b>userId</b>. This screen converts your email → userId automatically.
            </div>
          </div>
        </div>

        <div style={{ fontWeight: 900, marginTop: 6 }}>Recent Assignments</div>

        {loading ? (
          <div style={{ opacity: 0.7 }}>Loading…</div>
        ) : paginatedItems.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No assignments yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {paginatedItems.map((a) => {
              const empEmail = a?.userId?.email || a?.employeeEmail || "Employee";
              const tempName = a?.templateId?.name || a?.templateName || "Template";
              const itemCount = (a?.items || a?.steps || []).length || 0;

              return (
                <div
                  key={a._id || a.id}
                  style={{
                    border: "1px solid rgba(0,0,0,0.08)",
                    borderRadius: 14,
                    padding: 14,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 950 }}>
                    {empEmail} — {tempName}
                  </div>
                  <div style={{ opacity: 0.75, fontSize: 13, marginTop: 6 }}>
                    Status: {a.status || "Assigned"} | Items: {itemCount}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {!loading && assignments.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <Pagination pager={pager} />
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default Assignments;

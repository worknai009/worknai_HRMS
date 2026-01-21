import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/ui/PageShell";
import { toast } from "react-toastify";
import { createTemplate, getTemplates } from "../../services/api";
import { useClientPagination } from "../../utils/useClientPagination";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import Pagination from "../../components/Pagination";

const Templates = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [stepsText, setStepsText] = useState("Email welcome kit\nShare company policy PDF\nSetup payroll");

  const steps = useMemo(() => {
    return stepsText
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }, [stepsText]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await getTemplates();
      const d = res?.data;
      const list = Array.isArray(d) ? d : Array.isArray(d?.data) ? d.data : Array.isArray(d?.templates) ? d.templates : [];
      setItems(list);
    } catch (e) {
      toast.error("Failed to load templates");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const pager = useClientPagination(items);
  const { paginatedItems } = pager;

  const onCreate = async () => {
    if (!name.trim()) return toast.warning("Template name required");
    if (steps.length === 0) return toast.warning("Add at least 1 step");
    setSaving(true);
    try {
      // backend supports steps/checklist/items normalization
      await createTemplate({ name: name.trim(), steps });
      toast.success("Template created ✅");
      setName("");
      await fetchAll();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Onboarding Templates"
      subtitle="Create onboarding steps & checklists."
      right={
        <button
          onClick={onCreate}
          disabled={saving}
          style={{
            border: "none",
            padding: "10px 14px",
            borderRadius: 12,
            background: "#0f172a",
            color: "#fff",
            fontWeight: 900,
            cursor: "pointer",
          }}
        >
          {saving ? "Saving..." : "Create Template"}
        </button>
      }
    >
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 14, padding: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>New Template</div>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template Name (e.g. Engineer Onboarding)"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.12)",
                boxSizing: "border-box",
                fontWeight: 700,
              }}
            />

            <textarea
              value={stepsText}
              onChange={(e) => setStepsText(e.target.value)}
              rows={5}
              placeholder="One step per line…"
              style={{
                width: "100%",
                padding: 12,
                borderRadius: 10,
                border: "1px solid rgba(0,0,0,0.12)",
                boxSizing: "border-box",
                fontWeight: 700,
              }}
            />
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              Tip: Write <b>one step per line</b>.
            </div>
          </div>
        </div>

        <div style={{ fontWeight: 900, marginTop: 6 }}>Existing Templates</div>

        {loading ? (
          <div style={{ opacity: 0.7 }}>Loading…</div>
        ) : paginatedItems.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No templates yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {paginatedItems.map((t) => (
              <div
                key={t._id || t.id}
                style={{
                  border: "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 14,
                  padding: 14,
                  background: "#fff",
                }}
              >
                <div style={{ fontWeight: 950 }}>{t.name || "Untitled Template"}</div>
                <div style={{ marginTop: 8, opacity: 0.8, fontSize: 13 }}>
                  {(t.steps || t.items || []).slice(0, 5).map((s, idx) => (
                    <div key={idx}>• {typeof s === "string" ? s : s?.title || "Step"}</div>
                  ))}
                  {(t.steps || t.items || []).length > 5 ? <div>…</div> : null}
                </div>
              </div>
            ))}
          </div>
        )}
        {!loading && items.length > 0 && (
          <div style={{ marginTop: '20px' }}>
            <Pagination pager={pager} />
          </div>
        )}
      </div>
    </PageShell>
  );
};

export default Templates;

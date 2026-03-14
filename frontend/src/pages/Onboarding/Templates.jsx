import React, { useEffect, useMemo, useState } from "react";
import PageShell from "../../components/ui/PageShell";
import { toast } from "react-toastify";
import { createTemplate, getTemplates } from "../../services/api";
import { useClientPagination } from "../../utils/useClientPagination";
import { FaPlus, FaListUl, FaSpinner, FaFileAlt } from "react-icons/fa";
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
      subtitle="Craft the perfect first day for your new hires."
      right={
        <button
          onClick={onCreate}
          disabled={saving}
          className="create-btn"
        >
          {saving ? <FaSpinner className="spin" /> : <FaPlus />}
          <span>{saving ? "Creating..." : "Create Template"}</span>
        </button>
      }
    >
      <div className="templates-container">
        {/* NEW TEMPLATE FORM */}
        <div className="template-form-card">
          <div className="section-title">
            <FaFileAlt /> Builder
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label>Template Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Software Engineer Onboarding"
                className="theme-input"
              />
            </div>

            <div className="input-group">
              <label>Checklist Steps (One per line)</label>
              <textarea
                value={stepsText}
                onChange={(e) => setStepsText(e.target.value)}
                rows={5}
                placeholder="Ex:\nSend Welcome Email\nAssign Buddy\nHardware Setup"
                className="theme-textarea"
              />
            </div>

            <div className="helper-text">
              Tip: Clear, actionable steps make onboarding smoother.
            </div>
          </div>
        </div>

        {/* EXISTING TEMPLATES */}
        <div className="templates-list-section">
          <div className="section-header">
            <h3>Library</h3>
          </div>

          {loading ? (
            <div className="loading-state">
              <FaSpinner className="spin" />
              <span>Loading your library...</span>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="empty-state">
              Your template library is empty.
            </div>
          ) : (
            <div className="templates-grid">
              {paginatedItems.map((t) => (
                <div key={t._id || t.id} className="template-item-card">
                  <div className="item-head">
                    <FaListUl className="icon" />
                    <span className="item-name">{t.name || "Untitled Template"}</span>
                  </div>
                  <div className="item-steps">
                    {(t.steps || t.items || []).slice(0, 4).map((s, idx) => (
                      <div key={idx} className="step-pill">
                        {typeof s === "string" ? s : s?.title || "Step"}
                      </div>
                    ))}
                    {(t.steps || t.items || []).length > 4 && (
                      <div className="more-tag">+ {(t.steps || t.items || []).length - 4} more</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && items.length > 0 && (
          <div className="pagination-wrapper">
            <Pagination pager={pager} />
          </div>
        )}
      </div>

      <style>{`
        .templates-container { display: flex; flex-direction: column; gap: 24px; color: #fff; }

        /* Form Card */
        .template-form-card {
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

        .theme-input, .theme-textarea {
          background: rgba(80, 200, 255, 0.06);
          border: 1px solid rgba(80, 200, 255, 0.18);
          color: #fff;
          padding: 14px;
          border-radius: 14px;
          font-weight: 600;
          font-size: 0.95rem;
          outline: none;
          transition: 0.3s;
          width: 100%;
          box-sizing: border-box;
        }

        .theme-input:focus, .theme-textarea:focus {
          border-color: #50c8ff;
          box-shadow: 0 0 20px rgba(80, 200, 255, 0.2);
        }

        .helper-text { font-size: 0.8rem; opacity: 0.5; font-style: italic; }

        /* Create Button */
        .create-btn {
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

        .create-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -4px rgba(140, 80, 255, 0.55);
        }

        .create-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* List Section */
        .section-header h3 {
          font-weight: 900;
          font-size: 1.3rem;
          margin: 10px 0 20px;
          background: linear-gradient(90deg, #fff, #50c8ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .templates-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }

        .template-item-card {
          background: #080d1e;
          border: 1px solid rgba(80, 200, 255, 0.07);
          border-radius: 14px;
          padding: 20px;
          transition: 0.3s;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .template-item-card:hover {
          background: rgba(80, 200, 255, 0.08);
          border-color: rgba(80, 200, 255, 0.18);
          transform: translateY(-4px);
          box-shadow: 0 14px 28px -4px rgba(140, 80, 255, 0.2);
        }

        .item-head { display: flex; align-items: center; gap: 12px; }
        .item-head .icon { color: #a78bfa; font-size: 1.1rem; }
        .item-name { font-weight: 800; font-size: 1.1rem; color: #fff; }

        .item-steps { display: flex; flex-wrap: wrap; gap: 6px; }
        .step-pill {
          font-size: 0.7rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .more-tag { font-size: 0.7rem; font-weight: 800; color: #50c8ff; margin-top: 4px; }

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

export default Templates;

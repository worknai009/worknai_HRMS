import React, { useEffect, useState } from "react";
import { getMyOnboarding, updateOnboardingItem } from "../../services/api";
import { toast } from "react-toastify";
import PageShell from "../../components/ui/PageShell";
import { FaCheckCircle, FaClock, FaSpinner, FaLayerGroup, FaArrowLeft, FaSignOutAlt } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

const MyOnboarding = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [onboarding, setOnboarding] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const res = await getMyOnboarding();
      setOnboarding(res.data);
    } catch (error) {
      // ✅ 404 = not assigned yet
      setOnboarding(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (itemId) => {
    try {
      await updateOnboardingItem(itemId, { status: "Done", comment: "Completed by employee" });
      toast.success("Task completed! ✅");
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  if (loading) {
    return (
      <PageShell
        title="My Onboarding"
        subtitle="Just a moment..."
        right={(
          <>
            <button className="btn-back-onb" onClick={() => navigate(-1)}><FaArrowLeft /> Back</button>
            <button className="btn-logout-onb" onClick={() => logout("/")}><FaSignOutAlt /> Logout</button>
          </>
        )}
      >
        <div className="loading-state">
          <FaSpinner className="spin" />
          <span>Syncing your checklist...</span>
        </div>
      </PageShell>
    );
  }

  if (!onboarding) {
    return (
      <PageShell
        title="My Onboarding"
        subtitle="Your journey starts here."
        right={(
          <>
            <button className="btn-back-onb" onClick={() => navigate(-1)}><FaArrowLeft /> Back</button>
            <button className="btn-logout-onb" onClick={() => logout("/")}><FaSignOutAlt /> Logout</button>
          </>
        )}
      >
        <div className="empty-state">
          <div className="empty-icon">🎉</div>
          <h3>Welcome Aboard!</h3>
          <p>No onboarding tasks have been assigned to you yet. Sit back and relax!</p>
        </div>
      </PageShell>
    );
  }

  const items = Array.isArray(onboarding?.items) ? onboarding.items : [];

  return (
    <PageShell
      title="My Onboarding Journey"
      subtitle={`Progressing through: ${onboarding?.templateId?.name || "Standard Onboarding"}`}
      right={(
        <>
          <button className="btn-back-onb" onClick={() => navigate(-1)}><FaArrowLeft /> Back</button>
          <button className="btn-logout-onb" onClick={() => logout("/")}><FaSignOutAlt /> Logout</button>
        </>
      )}
    >
      <div className="onboarding-container">
        <div className="checklist-stats">
          <div className="stat-card">
            <FaLayerGroup />
            <span>{items.length} Total Tasks</span>
          </div>
          <div className="stat-card">
            <FaCheckCircle />
            <span>{items.filter(i => i.status === "Done").length} Completed</span>
          </div>
        </div>

        <div className="checklist-grid">
          {items.map((item) => (
            <div
              key={item._id}
              className={`checklist-item ${item.status === "Done" ? "completed" : "pending"}`}
            >
              <div className="item-content">
                <div className="item-text">
                  <h4 className="item-title">{item.title}</h4>
                  <p className="item-desc">{item.description}</p>
                </div>

                {item.dueAt && (
                  <div className="due-date">
                    <FaClock />
                    <span>Due: {new Date(item.dueAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="item-actions">
                {item.status === "Pending" ? (
                  <button
                    onClick={() => handleMarkDone(item._id)}
                    className="done-btn"
                  >
                    Mark Done
                  </button>
                ) : (
                  <div className="done-badge">
                    <FaCheckCircle />
                    <span>Completed</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .onboarding-container { color: #fff; }

        .checklist-stats {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: #080d1e;
          border: 1px solid rgba(80, 200, 255, 0.07);
          padding: 10px 18px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          color: #a78bfa;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        }

        .checklist-grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        }

        .checklist-item {
          background: #080d1e;
          border: 1px solid rgba(80, 200, 255, 0.07);
          border-radius: 18px;
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .checklist-item:hover {
          background: rgba(80, 200, 255, 0.08);
          border-color: rgba(80, 200, 255, 0.18);
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -4px rgba(140, 80, 255, 0.2);
        }

        .checklist-item.completed {
          background: rgba(16, 185, 129, 0.03);
          border-color: rgba(16, 185, 129, 0.15);
        }

        .checklist-item.completed::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background: #10b981;
        }

        .item-content { flex: 1; display: flex; flex-direction: column; gap: 12px; }
        
        .item-title {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 800;
          letter-spacing: -0.2px;
        }

        .completed .item-title {
          text-decoration: line-through;
          opacity: 0.5;
        }

        .item-desc {
          margin: 0;
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.5;
        }

        .due-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: #f59e0b;
          font-weight: 700;
        }

        .done-btn {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
          color: #fff;
          border: none;
          padding: 10px 28px;
          border-radius: 50px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.3s;
          white-space: nowrap;
          box-shadow: 0 8px 20px -4px rgba(80, 130, 255, 0.45);
        }

        .done-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 28px -4px rgba(140, 80, 255, 0.55);
        }

        .done-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #10b981;
          font-weight: 900;
          font-size: 0.9rem;
          padding: 8px 16px;
          background: rgba(16, 185, 129, 0.1);
          border-radius: 50px;
        }

        .loading-state, .empty-state {
          padding: 60px 20px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          color: rgba(255, 255, 255, 0.4);
        }

        .empty-icon { font-size: 60px; margin-bottom: 20px; }
        .empty-state h3 { font-size: 26px; color: #fff; margin: 0; font-weight: 900; }
        .empty-state p { opacity: 0.7; font-size: 15px; margin-top: 5px; }

        .btn-back-onb {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: white;
          padding: 10px 18px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: 0.3s;
          font-size: 14px;
        }
        .btn-back-onb:hover { border-color: #50c8ff; color: #50c8ff; background: rgba(80, 200, 255, 0.1); }

        .btn-logout-onb {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          color: #ef4444;
          padding: 10px 18px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: 0.3s;
          font-size: 14px;
        }
        .btn-logout-onb:hover { background: #ef4444; color: white; }

        .spin { animation: fa-spin 2s infinite linear; font-size: 2rem; color: #50c8ff; }
        @keyframes fa-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(359deg); }
        }

        @media (max-width: 640px) {
          .checklist-item { flex-direction: column; align-items: flex-start; gap: 20px; }
          .item-actions { width: 100%; }
          .done-btn { width: 100%; padding: 14px; }
        }

@media (max-width: 480px) {
  .checklist-stats {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  .stat-card {
    justify-content: center;
  }
  .checklist-grid {
    grid-template-columns: 1fr;
  }
}
      `}</style>
    </PageShell>
  );
};

export default MyOnboarding;

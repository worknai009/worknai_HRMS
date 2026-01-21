import React, { useEffect, useState } from "react";
import { getMyOnboarding, updateOnboardingItem } from "../../services/api";
import { toast } from "react-toastify";

const MyOnboarding = () => {
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
      // ✅ 404 = not assigned yet (ignore)
      setOnboarding(null);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (itemId) => {
    try {
      await updateOnboardingItem(itemId, { status: "Done", comment: "Completed by employee" });
      toast.success("Item Marked as Done ✅");
      fetchData();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to update status");
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Loading Checklist...</div>;
  if (!onboarding) return <div style={{ padding: 20 }}>🎉 No onboarding tasks assigned yet!</div>;

  const items = Array.isArray(onboarding?.items) ? onboarding.items : [];

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h2>My Onboarding Checklist</h2>
      <p style={{ opacity: 0.7 }}>Template: {onboarding?.templateId?.name || "—"}</p>

      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "15px" }}>
        {items.map((item) => (
          <div
            key={item._id}
            style={{
              padding: "20px",
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              background: item.status === "Done" ? "#f0fff4" : "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div>
              <h4 style={{ margin: "0 0 5px 0", textDecoration: item.status === "Done" ? "line-through" : "none" }}>
                {item.title}
              </h4>
              <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>{item.description}</p>
              {item.dueAt && (
                <p style={{ fontSize: "12px", color: "orange" }}>
                  Due: {new Date(item.dueAt).toLocaleDateString()}
                </p>
              )}
            </div>

            <div>
              {item.status === "Pending" ? (
                <button
                  onClick={() => handleMarkDone(item._id)}
                  style={{
                    padding: "8px 16px",
                    background: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontWeight: 800,
                  }}
                >
                  Mark Done
                </button>
              ) : (
                <span style={{ color: "green", fontWeight: "bold" }}>Completed ✅</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOnboarding;

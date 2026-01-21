// frontend/src/pages/SuperAdmin/SuperAdminDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import {
  FaUserShield,
  FaSync,
  FaSearch,
  FaPhone,
  FaMapMarkerAlt,
  FaBan,
  FaCheck,
  FaTrash,
  FaEdit,
  FaKey,
  FaSignOutAlt,
  FaBuilding,
  FaUserPlus,
  FaTimes,
  FaCopy,
  FaExclamationTriangle,
} from "react-icons/fa";

import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || "";
const libraries = ["places"];
const mapStyle = { width: "100%", height: "260px", borderRadius: "14px" };

const safeStr = (v) => (v === null || v === undefined ? "" : String(v));
const normalizeRole = (role = "") => safeStr(role).trim().toUpperCase().replace(/\s+/g, "_");

const pickCompanyDisplayName = (item) => item?.name || item?.companyName || "Company";
const pickCompanyEmail = (item) => item?.email || "";
const pickCompanyPhone = (item) => item?.mobile || item?.phone || "";
const pickCompanyAddress = (item) => item?.location?.address || item?.address || "";

const isCompanyActive = (c) => {
  const st = String(c?.status || "Active").toLowerCase();
  return st !== "inactive" && st !== "deleted";
};

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [activeTab, setActiveTab] = useState("clients"); // clients | inquiries | requests
  const [searchTerm, setSearchTerm] = useState("");

  const [inquiries, setInquiries] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Provision password
  const [adminPassword, setAdminPassword] = useState("");

  // Edit form
  const [editForm, setEditForm] = useState({
    companyName: "",
    email: "",
    mobile: "",
    address: "",
    lat: 18.5204,
    lng: 73.8567,
    password: "",
  });

  // Maps
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [autocomplete, setAutocomplete] = useState(null);
  const [map, setMap] = useState(null);

  useEffect(() => {
    const role = normalizeRole(user?.role);
    if (user && role !== "SUPERADMIN" && role !== "SUPER_ADMIN") {
      toast.error("Unauthorized");
      navigate("/super-admin-login");
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      setSyncing(true);
      setLoading(true);

      // ✅ Backend now hides inactive by default (because we updated getDashboardData)
      const res = await API.get("/superadmin/dashboard-data");
      const inq = res?.data?.inquiries || [];
      const comps = res?.data?.companies || [];

      setInquiries(Array.isArray(inq) ? inq : []);
      setCompanies(Array.isArray(comps) ? comps : []);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Sync Failed");
      setInquiries([]);
      setCompanies([]);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  const pendingInquiries = useMemo(
    () => inquiries.filter((i) => (i?.status || "Pending") === "Pending"),
    [inquiries]
  );

  // Requests should be only for active companies
  const activeCompanies = useMemo(() => companies.filter(isCompanyActive), [companies]);

  const limitRequests = useMemo(
    () => activeCompanies.filter((c) => (c?.hrLimitRequest || "") === "Pending"),
    [activeCompanies]
  );

  const list = useMemo(() => {
    if (activeTab === "inquiries") return pendingInquiries;
    if (activeTab === "requests") return limitRequests;
    return activeCompanies; // ✅ Only active in Clients tab
  }, [activeTab, activeCompanies, pendingInquiries, limitRequests]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return list;
    return list.filter((item) => {
      const name = pickCompanyDisplayName(item).toLowerCase();
      const email = safeStr(pickCompanyEmail(item)).toLowerCase();
      const phone = safeStr(pickCompanyPhone(item)).toLowerCase();
      const addr = safeStr(pickCompanyAddress(item)).toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || addr.includes(q);
    });
  }, [list, searchTerm]);

  const onPlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (!place?.geometry) return;
    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    setEditForm((prev) => ({
      ...prev,
      lat,
      lng,
      address: place.formatted_address || prev.address,
    }));
    if (map) map.panTo({ lat, lng });
  };

  const onMarkerDragEnd = (e) => {
    if (!e?.latLng) return;
    setEditForm((prev) => ({
      ...prev,
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    }));
  };

  const handleLimitAction = async (companyId, action) => {
    try {
      await API.put(`/superadmin/company-limit/${companyId}`, { action });
      toast.success(action === "approve" ? "Approved +1 ✅" : "Request Denied ✅");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const handleRejectOrDelete = async (id, type) => {
    const msg =
      type === "reject"
        ? "Reject this inquiry? (Irreversible)"
        : "Delete this company? (It will be archived and hidden from Clients)";
    if (!window.confirm(`⚠️ ${msg}`)) return;

    try {
      const endpoint = type === "reject" ? `/superadmin/inquiry/${id}` : `/superadmin/company/${id}`;
      await API.delete(endpoint);

      // ✅ Optimistic: remove from UI instantly (no flicker)
      if (type === "delete") {
        setCompanies((prev) => prev.filter((c) => c._id !== id));
      }

      toast.success("Action Completed ✅");
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed");
    }
  };

  const openApproveModal = (inq) => {
    setSelected(inq);
    setAdminPassword("");
    setShowApproveModal(true);
  };

  const genPassword = () => {
    const p = Math.random().toString(36).slice(-10);
    setAdminPassword(p);
  };

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(adminPassword);
      toast.success("Copied ✅");
    } catch {
      toast.error("Copy failed");
    }
  };

  const submitApproval = async () => {
    if (adminPassword.trim().length < 6) return toast.warning("Password too short (min 6)");
    if (!selected?._id) return;

    setIsSubmitting(true);
    try {
      const payload = {
        inquiryId: selected._id,
        password: adminPassword.trim(),
        address: selected?.address,
        location: selected?.location,
      };

      await API.post("/superadmin/approve-inquiry", payload);
      toast.success("Company Provisioned 🚀");
      setShowApproveModal(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Provision failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (comp) => {
    setSelected(comp);
    setEditForm({
      companyName: pickCompanyDisplayName(comp),
      email: pickCompanyEmail(comp),
      mobile: pickCompanyPhone(comp) || "",
      address: pickCompanyAddress(comp) || "",
      lat: comp?.location?.lat ?? comp?.lat ?? 18.5204,
      lng: comp?.location?.lng ?? comp?.lng ?? 73.8567,
      password: "",
    });
    setShowEditModal(true);
  };

  const submitEdit = async () => {
    if (!selected?._id) return;
    if (!editForm.companyName.trim() || !editForm.email.trim()) {
      return toast.warning("Company name and email are required");
    }
    setIsSubmitting(true);

    try {
      const payload = {
        name: editForm.companyName.trim(),
        companyName: editForm.companyName.trim(),
        email: editForm.email.trim(),
        mobile: editForm.mobile.trim(),
        phone: editForm.mobile.trim(),
        password: editForm.password ? editForm.password : undefined,
        location: {
          address: editForm.address || "",
          lat: Number(editForm.lat),
          lng: Number(editForm.lng),
        },
        address: editForm.address || "",
        lat: Number(editForm.lat),
        lng: Number(editForm.lng),
      };

      if (!payload.password) delete payload.password;

      await API.put(`/superadmin/company/${selected._id}`, payload);
      toast.success("Details Updated ✅");
      setShowEditModal(false);
      fetchData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Update Failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToInquiryPipeline = () => navigate("/superadmin/inquiries");

  const topStats = useMemo(() => {
    return {
      companies: activeCompanies.length, // ✅ Active only
      inquiries: pendingInquiries.length,
      requests: limitRequests.length,
    };
  }, [activeCompanies.length, pendingInquiries.length, limitRequests.length]);

  return (
    <div className="sa-page">
      <header className="sa-header">
        <div className="brand">
          <div className="brand-icon">
            <FaUserShield />
          </div>
          <div className="brand-text">
            <h1>Super Admin</h1>
            <p>Control Center</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="btn ghost" onClick={goToInquiryPipeline} title="Open Inquiry Pipeline">
            Inquiries Page
          </button>

          <button className="btn ghost" onClick={fetchData} disabled={syncing} title="Sync Data">
            <FaSync className={syncing ? "spin" : ""} /> {syncing ? "Syncing" : "Sync"}
          </button>

          <button
            className="btn danger"
            onClick={() => {
              logout();
              navigate("/super-admin-login");
            }}
          >
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      <main className="sa-container">
        {/* STATS */}
        <section className="stats">
          <div className="stat-card">
            <div className="stat-left">
              <span className="stat-title">Active Clients</span>
              <strong className="stat-value">{topStats.companies}</strong>
            </div>
            <div className="stat-icon blue">
              <FaBuilding />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-left">
              <span className="stat-title">New Inquiries</span>
              <strong className="stat-value">{topStats.inquiries}</strong>
            </div>
            <div className="stat-icon gold">
              <FaUserPlus />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-left">
              <span className="stat-title">Upgrade Requests</span>
              <strong className="stat-value">{topStats.requests}</strong>
            </div>
            <div className="stat-icon red">
              <FaExclamationTriangle />
            </div>
          </div>
        </section>

        {/* TOOLBAR */}
        <section className="toolbar">
          <div className="tabs">
            <button
              className={activeTab === "clients" ? "active" : ""}
              onClick={() => setActiveTab("clients")}
            >
              Clients
            </button>
            <button
              className={activeTab === "inquiries" ? "active" : ""}
              onClick={() => setActiveTab("inquiries")}
            >
              Inquiries {topStats.inquiries > 0 ? <span className="dot">{topStats.inquiries}</span> : null}
            </button>
            <button
              className={activeTab === "requests" ? "active" : ""}
              onClick={() => setActiveTab("requests")}
            >
              HR Upgrade {topStats.requests > 0 ? <span className="dot">{topStats.requests}</span> : null}
            </button>
          </div>

          <div className="search">
            <FaSearch className="sicon" />
            <input
              placeholder="Search by name, email, phone, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </section>

        {/* DATA */}
        <section className="data">
          {loading ? (
            <div className="state">Fetching data...</div>
          ) : filtered.length === 0 ? (
            <div className="state">No records found.</div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="table-wrap desktop-only">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Company</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Address</th>
                      <th>Status</th>
                      <th className="right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => {
                      const name = pickCompanyDisplayName(item);
                      const email = pickCompanyEmail(item);
                      const phone = pickCompanyPhone(item);
                      const addr = pickCompanyAddress(item);

                      // ✅ FIX: show real status
                      const status =
                        activeTab === "clients"
                          ? (item?.status || "Active")
                          : activeTab === "inquiries"
                          ? item?.status || "Pending"
                          : "Pending";

                      return (
                        <tr key={item._id}>
                          <td>
                            <div className="cell-main">
                              <div className="avatar">{name.charAt(0).toUpperCase()}</div>
                              <div className="cell-meta">
                                <strong className="cell-title">{name}</strong>
                                <span className="cell-sub">{activeTab === "requests" ? "HR limit request" : "—"}</span>
                              </div>
                            </div>
                          </td>
                          <td>{email || "—"}</td>
                          <td>{phone || "—"}</td>
                          <td className="addr">{addr || "—"}</td>
                          <td>
                            <span className={`pill ${String(status).toLowerCase()}`}>
                              {String(status)}
                            </span>
                          </td>
                          <td className="right">
                            <div className="actions">
                              {activeTab === "clients" && (
                                <>
                                  <button className="btn small ghost" onClick={() => openEditModal(item)}>
                                    <FaEdit /> Edit
                                  </button>
                                  <button
                                    className="btn small danger"
                                    onClick={() => handleRejectOrDelete(item._id, "delete")}
                                    title="Delete company"
                                  >
                                    <FaTrash />
                                  </button>
                                </>
                              )}

                              {activeTab === "inquiries" && (
                                <>
                                  <button
                                    className="btn small danger ghost"
                                    onClick={() => handleRejectOrDelete(item._id, "reject")}
                                  >
                                    <FaBan /> Reject
                                  </button>
                                  <button className="btn small primary" onClick={() => openApproveModal(item)}>
                                    <FaCheck /> Provision
                                  </button>
                                </>
                              )}

                              {activeTab === "requests" && (
                                <>
                                  <button
                                    className="btn small danger ghost"
                                    onClick={() => handleLimitAction(item._id, "reject")}
                                  >
                                    Deny
                                  </button>
                                  <button
                                    className="btn small primary"
                                    onClick={() => handleLimitAction(item._id, "approve")}
                                  >
                                    Approve +1
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="cards mobile-only">
                {filtered.map((item) => {
                  const name = pickCompanyDisplayName(item);
                  const email = pickCompanyEmail(item);
                  const phone = pickCompanyPhone(item);
                  const addr = pickCompanyAddress(item);

                  const status =
                    activeTab === "clients"
                      ? (item?.status || "Active")
                      : activeTab === "inquiries"
                      ? item?.status || "Pending"
                      : "Pending";

                  return (
                    <div key={item._id} className="card">
                      <div className="card-head">
                        <div className="cell-main">
                          <div className="avatar">{name.charAt(0).toUpperCase()}</div>
                          <div className="cell-meta">
                            <strong className="cell-title">{name}</strong>
                            <span className="cell-sub">{email}</span>
                          </div>
                        </div>
                        <span className={`pill ${String(status).toLowerCase()}`}>{String(status)}</span>
                      </div>

                      <div className="card-body">
                        <p>
                          <FaPhone /> {phone || "—"}
                        </p>
                        <p className="addrLine">
                          <FaMapMarkerAlt /> {addr || "—"}
                        </p>
                      </div>

                      <div className="card-foot">
                        {activeTab === "clients" && (
                          <>
                            <button className="btn small ghost" onClick={() => openEditModal(item)}>
                              <FaEdit /> Edit
                            </button>
                            <button className="btn small danger" onClick={() => handleRejectOrDelete(item._id, "delete")}>
                              <FaTrash />
                            </button>
                          </>
                        )}

                        {activeTab === "inquiries" && (
                          <>
                            <button className="btn small danger ghost" onClick={() => handleRejectOrDelete(item._id, "reject")}>
                              <FaBan /> Reject
                            </button>
                            <button className="btn small primary" onClick={() => openApproveModal(item)}>
                              <FaCheck /> Provision
                            </button>
                          </>
                        )}

                        {activeTab === "requests" && (
                          <>
                            <button className="btn small danger ghost" onClick={() => handleLimitAction(item._id, "reject")}>
                              Deny
                            </button>
                            <button className="btn small primary" onClick={() => handleLimitAction(item._id, "approve")}>
                              Approve +1
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-head">
              <h3>
                <FaEdit /> Update Client
              </h3>
              <button className="icon-btn" onClick={() => setShowEditModal(false)} title="Close">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                {/* LEFT */}
                <div className="form-col">
                  <div className="fg">
                    <label>Company Name</label>
                    <input
                      value={editForm.companyName}
                      onChange={(e) => setEditForm((p) => ({ ...p, companyName: e.target.value }))}
                      placeholder="Company name"
                    />
                  </div>

                  <div className="fg">
                    <label>Login Email</label>
                    <input
                      value={editForm.email}
                      onChange={(e) => setEditForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="Email"
                      type="email"
                    />
                  </div>

                  <div className="fg">
                    <label>Owner Contact</label>
                    <input
                      value={editForm.mobile}
                      onChange={(e) => setEditForm((p) => ({ ...p, mobile: e.target.value }))}
                      placeholder="Mobile"
                    />
                  </div>

                  <div className="fg">
                    <label>Reset Password (Optional)</label>
                    <input
                      value={editForm.password}
                      onChange={(e) => setEditForm((p) => ({ ...p, password: e.target.value }))}
                      placeholder="Min 6 chars"
                      type="password"
                    />
                  </div>

                  <div className="fg">
                    <label>Address</label>
                    <textarea
                      rows="2"
                      value={editForm.address}
                      onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))}
                      placeholder="Physical address"
                    />
                  </div>
                </div>

                {/* RIGHT */}
                <div className="map-col">
                  <label className="map-label">
                    <FaMapMarkerAlt /> Pin Office Location
                  </label>

                  {!GOOGLE_MAPS_API_KEY ? (
                    <div className="map-fallback">
                      <p>
                        Google Maps key missing. Add <code>REACT_APP_GOOGLE_MAPS_KEY</code> in <code>.env</code>.
                      </p>
                    </div>
                  ) : !isLoaded ? (
                    <div className="map-fallback">Loading Maps...</div>
                  ) : (
                    <>
                      <Autocomplete onLoad={(a) => setAutocomplete(a)} onPlaceChanged={onPlaceChanged}>
                        <div className="map-search">
                          <FaSearch className="sicon" />
                          <input placeholder="Search address..." />
                        </div>
                      </Autocomplete>

                      <div className="map-box">
                        <GoogleMap
                          mapContainerStyle={mapStyle}
                          center={{ lat: Number(editForm.lat), lng: Number(editForm.lng) }}
                          zoom={15}
                          onLoad={(m) => setMap(m)}
                        >
                          <Marker
                            position={{ lat: Number(editForm.lat), lng: Number(editForm.lng) }}
                            draggable
                            onDragEnd={onMarkerDragEnd}
                          />
                        </GoogleMap>
                      </div>

                      <div className="coords">
                        <span>Lat: {Number(editForm.lat).toFixed(5)}</span>
                        <span>Lng: {Number(editForm.lng).toFixed(5)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn ghost" onClick={() => setShowEditModal(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={submitEdit} disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Apply Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* APPROVE / PROVISION MODAL */}
      {showApproveModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal small">
            <div className="modal-head">
              <h3>
                <FaKey /> Provision Company
              </h3>
              <button className="icon-btn" onClick={() => setShowApproveModal(false)} title="Close">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p className="hint">
                Create login password for <strong>{pickCompanyDisplayName(selected)}</strong>
              </p>

              <div className="pass-row">
                <input
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Type password..."
                />
                <button className="btn small ghost" onClick={genPassword} title="Generate">
                  <FaKey />
                </button>
                <button
                  className="btn small ghost"
                  onClick={copyPassword}
                  title="Copy"
                  disabled={!adminPassword}
                >
                  <FaCopy />
                </button>
              </div>

              <div className="note">
                Tip: password generate karke copy karo, phir company owner ko share kar do.
              </div>
            </div>

            <div className="modal-foot">
              <button className="btn ghost" onClick={() => setShowApproveModal(false)}>
                Cancel
              </button>
              <button className="btn primary" onClick={submitApproval} disabled={isSubmitting}>
                {isSubmitting ? "Provisioning..." : "Provision"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        :root{
          --bg:#f8fafc;
          --card:#ffffff;
          --text:#0f172a;
          --muted:#64748b;
          --border:#e2e8f0;
          --shadow:0 10px 30px rgba(15,23,42,.06);
          --primary:#2563eb;
          --primary2:#1d4ed8;
          --danger:#ef4444;
          --danger2:#dc2626;
          --gold:#f59e0b;
        }

        .sa-page{min-height:100vh;background:var(--bg);font-family:'Inter',sans-serif;color:var(--text)}
        .sa-header{
          position:sticky;top:0;z-index:50;background:rgba(248,250,252,.9);backdrop-filter:blur(10px);
          border-bottom:1px solid var(--border);
          display:flex;justify-content:space-between;align-items:center;
          padding:12px 18px;
        }
        .brand{display:flex;gap:12px;align-items:center}
        .brand-icon{
          width:42px;height:42px;border-radius:12px;
          background:linear-gradient(135deg,var(--primary),#60a5fa);
          display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.2rem;
          box-shadow:0 10px 20px rgba(37,99,235,.18);
        }
        .brand-text h1{margin:0;font-size:1.05rem;font-weight:900;letter-spacing:.2px}
        .brand-text p{margin:0;color:var(--muted);font-size:.78rem;font-weight:700}

        .header-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
        .btn{
          border:none;cursor:pointer;border-radius:12px;padding:10px 14px;font-weight:800;
          display:inline-flex;align-items:center;gap:8px;transition:.2s;font-size:.88rem;
        }
        .btn.small{padding:8px 12px;border-radius:10px;font-size:.82rem;font-weight:800}
        .btn.primary{background:var(--primary);color:#fff;box-shadow:0 10px 22px rgba(37,99,235,.18)}
        .btn.primary:hover{background:var(--primary2);transform:translateY(-1px)}
        .btn.ghost{background:#fff;border:1px solid var(--border);color:var(--text)}
        .btn.ghost:hover{border-color:#cbd5e1;background:#f1f5f9}
        .btn.danger{background:rgba(239,68,68,.12);border:1px solid rgba(239,68,68,.18);color:var(--danger2)}
        .btn.danger:hover{background:rgba(239,68,68,.18)}

        .spin{animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        .sa-container{max-width:1200px;margin:18px auto;padding:0 16px 40px}

        .stats{
          display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:18px 0 14px;
        }
        .stat-card{
          background:var(--card);border:1px solid var(--border);border-radius:18px;
          padding:16px;box-shadow:var(--shadow);
          display:flex;align-items:center;justify-content:space-between;gap:14px;
        }
        .stat-left{display:flex;flex-direction:column;gap:6px}
        .stat-title{color:var(--muted);font-size:.8rem;font-weight:800;text-transform:uppercase;letter-spacing:.6px}
        .stat-value{font-size:1.7rem;line-height:1;font-weight:900}
        .stat-icon{
          width:46px;height:46px;border-radius:16px;display:flex;align-items:center;justify-content:center;
          font-size:1.25rem;
        }
        .stat-icon.blue{background:rgba(37,99,235,.12);color:var(--primary)}
        .stat-icon.gold{background:rgba(245,158,11,.14);color:#b45309}
        .stat-icon.red{background:rgba(239,68,68,.12);color:var(--danger2)}

        .toolbar{
          background:var(--card);border:1px solid var(--border);border-radius:18px;
          padding:12px;box-shadow:var(--shadow);
          display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;
        }
        .tabs{display:flex;gap:8px;flex-wrap:wrap}
        .tabs button{
          border:1px solid var(--border);background:#fff;color:var(--muted);
          padding:10px 12px;border-radius:999px;font-weight:900;cursor:pointer;
          transition:.2s;font-size:.86rem;display:flex;align-items:center;gap:8px;
        }
        .tabs button.active{
          background:rgba(37,99,235,.12);border-color:rgba(37,99,235,.25);color:var(--primary);
        }
        .dot{
          background:var(--primary);color:#fff;border-radius:999px;padding:2px 7px;font-size:.72rem;font-weight:900
        }
        .search{
          flex:1;min-width:260px;max-width:420px;
          display:flex;align-items:center;gap:10px;
          border:1px solid var(--border);background:#fff;border-radius:999px;
          padding:10px 14px;
        }
        .search .sicon{color:#94a3b8}
        .search input{border:none;outline:none;width:100%;font-size:.92rem}

        .data{margin-top:14px}
        .state{
          background:var(--card);border:1px dashed var(--border);border-radius:18px;
          padding:40px;text-align:center;color:var(--muted);font-weight:800;
        }

        .table-wrap{
          background:var(--card);border:1px solid var(--border);border-radius:18px;
          box-shadow:var(--shadow);overflow:hidden;
        }
        .tbl{width:100%;border-collapse:collapse}
        .tbl th{
          text-align:left;padding:14px 16px;background:#f1f5f9;color:#475569;font-size:.82rem;
          font-weight:900;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid var(--border);
        }
        .tbl td{
          padding:14px 16px;border-bottom:1px solid #f1f5f9;font-size:.92rem;vertical-align:middle;
        }
        .tbl tr:hover td{background:#fbfdff}
        .right{text-align:right}

        .cell-main{display:flex;align-items:center;gap:12px}
        .avatar{
          width:40px;height:40px;border-radius:14px;background:rgba(37,99,235,.1);color:var(--primary);
          display:flex;align-items:center;justify-content:center;font-weight:900;
        }
        .cell-meta{display:flex;flex-direction:column;gap:2px}
        .cell-title{font-weight:900}
        .cell-sub{color:var(--muted);font-size:.78rem;font-weight:700}
        .addr{max-width:420px}
        .pill{
          display:inline-flex;align-items:center;justify-content:center;
          padding:5px 10px;border-radius:999px;font-size:.78rem;font-weight:900;
          background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;
          text-transform:capitalize;
        }
        .pill.pending{background:rgba(245,158,11,.14);border-color:rgba(245,158,11,.25);color:#92400e}
        .pill.approved,.pill.active{background:rgba(16,185,129,.14);border-color:rgba(16,185,129,.25);color:#065f46}
        .pill.rejected{background:rgba(239,68,68,.12);border-color:rgba(239,68,68,.22);color:#991b1b}
        .pill.inactive{background:rgba(148,163,184,.18);border-color:rgba(148,163,184,.35);color:#475569}

        .actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
        .btn.danger.ghost{background:#fff;border:1px solid rgba(239,68,68,.22);color:var(--danger2)}
        .btn.danger.ghost:hover{background:rgba(239,68,68,.08)}

        /* Mobile cards */
        .cards{display:grid;grid-template-columns:1fr;gap:12px}
        .card{
          background:var(--card);border:1px solid var(--border);border-radius:18px;
          box-shadow:var(--shadow);padding:14px;
        }
        .card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
        .card-body{margin-top:10px;display:flex;flex-direction:column;gap:8px;color:#334155;font-weight:700}
        .card-body p{margin:0;display:flex;gap:10px;align-items:flex-start;color:#334155}
        .addrLine{
          display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;color:var(--muted);font-weight:700
        }
        .card-foot{display:flex;gap:10px;justify-content:flex-end;margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;flex-wrap:wrap}

        /* Modal */
        .modal-overlay{
          position:fixed;inset:0;background:rgba(2,6,23,.55);
          display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;
          backdrop-filter: blur(6px);
        }
        .modal{
          width:100%;max-width:980px;background:#fff;border-radius:20px;
          border:1px solid var(--border);box-shadow:0 30px 80px rgba(15,23,42,.25);
          overflow:hidden;display:flex;flex-direction:column;
          max-height:90vh;
        }
        .modal.small{max-width:520px}
        .modal-head{
          display:flex;align-items:center;justify-content:space-between;
          padding:14px 16px;background:#f8fafc;border-bottom:1px solid var(--border);
        }
        .modal-head h3{margin:0;font-size:1.05rem;font-weight:900;display:flex;align-items:center;gap:10px}
        .icon-btn{
          width:38px;height:38px;border-radius:12px;border:1px solid var(--border);
          background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;
        }
        .icon-btn:hover{background:#f1f5f9}
        .modal-body{padding:16px;overflow:auto}
        .modal-foot{
          padding:14px 16px;border-top:1px solid var(--border);background:#f8fafc;
          display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;
        }
        .modal-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
        .form-col,.map-col{min-width:0}
        .fg{display:flex;flex-direction:column;gap:7px;margin-bottom:12px}
        .fg label{font-size:.82rem;color:#475569;font-weight:900}
        .fg input,.fg textarea{
          border:1px solid var(--border);border-radius:14px;padding:12px 12px;
          outline:none;font-size:.95rem;background:#fff;
        }
        .fg input:focus,.fg textarea:focus{border-color:rgba(37,99,235,.4);box-shadow:0 0 0 4px rgba(37,99,235,.12)}
        .map-label{display:flex;align-items:center;gap:10px;font-weight:900;color:#475569;margin-bottom:8px}
        .map-search{
          position:relative;display:flex;align-items:center;gap:10px;border:1px solid var(--border);
          padding:10px 12px;border-radius:14px;background:#fff;margin-bottom:10px;
        }
        .map-search input{border:none;outline:none;width:100%}
        .map-box{border:1px solid var(--border);border-radius:14px;overflow:hidden}
        .coords{display:flex;justify-content:space-between;margin-top:8px;color:var(--muted);font-weight:800;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace}
        .map-fallback{
          border:1px dashed var(--border);border-radius:14px;padding:14px;background:#fff7ed;color:#7c2d12;font-weight:800
        }
        .hint{margin:0 0 10px;color:var(--muted);font-weight:800}
        .pass-row{display:flex;gap:10px;align-items:center}
        .pass-row input{
          flex:1;border:1px solid var(--border);border-radius:14px;padding:12px;font-size:1rem;
          font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          letter-spacing:.5px;
        }
        .note{margin-top:10px;color:var(--muted);font-weight:700;font-size:.9rem}

        .desktop-only{display:block}
        .mobile-only{display:none}

        @media (max-width: 980px){
          .modal-grid{grid-template-columns:1fr}
        }
        @media (max-width: 900px){
          .stats{grid-template-columns:1fr}
        }
        @media (max-width: 768px){
          .desktop-only{display:none}
          .mobile-only{display:block}
          .sa-header{gap:10px}
          .header-actions{width:100%;justify-content:flex-start}
          .search{max-width:100%}
        }
      `}</style>
    </div>
  );
};

export default SuperAdminDashboard;

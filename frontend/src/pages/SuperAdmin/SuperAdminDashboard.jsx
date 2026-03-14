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
        :root {
          --bg: #050714;
          --card: rgba(255, 255, 255, 0.03);
          --card-hover: rgba(255, 255, 255, 0.06);
          --text: #ffffff;
          --muted: rgba(255, 255, 255, 0.6);
          --border: rgba(255, 255, 255, 0.08);
          --shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          --primary: #50c8ff;
          --primary-grad: linear-gradient(135deg, #50c8ff, #a78bfa, #e879f9);
          --danger: #ef4444;
          --danger2: #ef4444;
          --success: #10b981;
          --gold: #f59e0b;
        }

        body {
          background-color: #050714 !important;
          margin: 0;
        }


        .sa-page {
          min-height: 100vh;
          background: var(--bg);
          font-family: 'Inter', sans-serif;
          color: var(--text);
          background-image: radial-gradient(circle at 10% 20%, rgba(80, 200, 255, 0.05) 0%, transparent 40%),
                            radial-gradient(circle at 90% 80%, rgba(167, 139, 250, 0.05) 0%, transparent 40%);
        }

        .sa-header {
          position: sticky;
          top: 0;
          z-index: 1000;
          background: rgba(5, 7, 20, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 24px;
        }

        .brand { display: flex; gap: 14px; align-items: center; }
        .brand-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--primary-grad);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 1.3rem;
          box-shadow: 0 8px 16px rgba(80, 200, 255, 0.25);
        }
        .brand-text h1 { 
          margin: 0; 
          font-size: 1.2rem; 
          font-weight: 900; 
          background: linear-gradient(90deg, #50c8ff, #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand-text p { margin: 0; color: var(--muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }

        .header-actions { display: flex; gap: 12px; align-items: center; }
        .btn {
          border: none;
          cursor: pointer;
          border-radius: 12px;
          padding: 10px 18px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          transition: 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
          font-size: 0.88rem;
        }
        .btn.small { padding: 8px 14px; border-radius: 10px; font-size: 0.82rem; }
        .btn.primary { 
          background: var(--primary-grad); 
          color: #fff; 
          box-shadow: 0 8px 20px rgba(80, 130, 255, 0.3);
        }
        .btn.primary:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(140, 80, 255, 0.4); }
        .btn.ghost { background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border); color: #fff; }
        .btn.ghost:hover { background: rgba(255, 255, 255, 0.1); border-color: var(--primary); color: var(--primary); }
        .btn.danger { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; }
        .btn.danger:hover { background: rgba(239, 68, 68, 0.2); color: #fff; }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .sa-container { max-width: 1400px; margin: 24px auto; padding: 0 24px 60px; }

        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px; }
        .stat-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 24px;
          box-shadow: var(--shadow);
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: 0.3s;
          backdrop-filter: blur(10px);
        }
        .stat-card:hover { transform: translateY(-5px); border-color: rgba(80, 200, 255, 0.3); background: var(--card-hover); }
        .stat-left { display: flex; flex-direction: column; gap: 8px; }
        .stat-title { color: var(--muted); font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .stat-value { font-size: 2.2rem; font-weight: 900; background: #fff; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .stat-icon.blue { background: rgba(80, 200, 255, 0.1); color: #50c8ff; border: 1px solid rgba(80, 200, 255, 0.2); }
        .stat-icon.gold { background: rgba(245, 158, 11, 0.12); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.2); }
        .stat-icon.red { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.2); }

        .toolbar {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 14px;
          box-shadow: var(--shadow);
          display: flex;
          gap: 16px;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          backdrop-filter: blur(10px);
        }
        .tabs { display: flex; gap: 10px; }
        .tabs button {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.04);
          color: var(--muted);
          padding: 10px 20px;
          border-radius: 14px;
          font-weight: 800;
          cursor: pointer;
          transition: 0.3s;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .tabs button:hover { background: rgba(255, 255, 255, 0.08); color: #fff; }
        .tabs button.active {
          background: rgba(80, 200, 255, 0.15);
          border-color: #50c8ff;
          color: #50c8ff;
        }
        .dot {
          background: #50c8ff;
          color: #050714;
          border-radius: 999px;
          padding: 2px 8px;
          font-size: 0.75rem;
          font-weight: 900;
        }
        .search {
          flex: 1;
          min-width: 300px;
          max-width: 450px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          border-radius: 14px;
          padding: 10px 18px;
          transition: 0.3s;
        }
        .search:focus-within { border-color: #50c8ff; background: rgba(255, 255, 255, 0.06); box-shadow: 0 0 15px rgba(80, 200, 255, 0.15); }
        .search .sicon { color: rgba(255, 255, 255, 0.4); }
        .search input { background: transparent; border: none; outline: none; width: 100%; color: #fff; font-size: 0.95rem; }
        .search input::placeholder { color: rgba(255, 255, 255, 0.3); }

        .data { margin-top: 24px; }
        .state {
          background: var(--card);
          border: 1px dashed var(--border);
          border-radius: 24px;
          padding: 60px;
          text-align: center;
          color: var(--muted);
          font-weight: 800;
        }

        .table-wrap {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          box-shadow: var(--shadow);
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        .tbl { width: 100%; border-collapse: collapse; }
        .tbl th {
          text-align: left;
          padding: 18px 24px;
          background: rgba(255, 255, 255, 0.05);
          color: var(--muted);
          font-size: 0.8rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid var(--border);
        }
        .tbl td {
          padding: 18px 24px;
          border-bottom: 1px solid var(--border);
          font-size: 0.95rem;
          vertical-align: middle;
          transition: 0.2s;
        }
        .tbl tr:last-child td { border-bottom: none; }
        .tbl tr:hover td { background: rgba(255, 255, 255, 0.04); }
        .right { text-align: right; }

        .cell-main { display: flex; align-items: center; gap: 14px; }
        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          background: rgba(80, 200, 255, 0.1);
          color: #50c8ff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          font-size: 1.1rem;
          border: 1px solid rgba(80, 200, 255, 0.2);
        }
        .cell-meta { display: flex; flex-direction: column; gap: 2px; }
        .cell-title { font-weight: 900; color: #fff; }
        .cell-sub { color: var(--muted); font-size: 0.85rem; font-weight: 700; }
        .addr { max-width: 350px; line-height: 1.5; color: var(--muted); }
        
        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 900;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
          border: 1px solid var(--border);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .pill.pending { background: rgba(245, 158, 11, 0.1); border-color: rgba(245, 158, 11, 0.3); color: #f59e0b; }
        .pill.approved, .pill.active { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #10b981; }
        .pill.rejected { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }

        .actions { display: flex; gap: 10px; justify-content: flex-end; }
        
        /* Mobile cards */
        .cards { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 22px;
          box-shadow: var(--shadow);
          padding: 20px;
          backdrop-filter: blur(10px);
        }
        .card-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 15px; }
        .card-body { margin-top: 15px; display: flex; flex-direction: column; gap: 10px; }
        .card-body p { margin: 0; display: flex; gap: 12px; align-items: flex-start; color: var(--muted); font-weight: 600; font-size: 0.92rem; }
        .card-body p svg { color: var(--primary); margin-top: 3px; }
        .addrLine { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .card-foot { 
          display: flex; gap: 12px; justify-content: flex-end; 
          margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--border); 
        }

        /* Modal */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          backdrop-filter: blur(8px);
        }
        .modal {
          width: 100%;
          max-width: 1000px;
          background: #0a0d1d;
          border-radius: 28px;
          border: 1px solid var(--border);
          box-shadow: 0 40px 100px rgba(0, 0, 0, 0.8);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          position: relative;
        }
        .modal.small { max-width: 580px; }
        .modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: rgba(255, 255, 255, 0.02);
          border-bottom: 1px solid var(--border);
        }
        .modal-head h3 { margin: 0; font-size: 1.25rem; font-weight: 900; display: flex; align-items: center; gap: 12px; color: #fff; }
        .icon-btn {
          width: 42px;
          height: 42px;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.05);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          transition: 0.3s;
        }
        .icon-btn:hover { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; }
        .modal-body { padding: 24px; overflow-y: auto; }
        .modal-foot {
          padding: 18px 24px;
          border-top: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.02);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .fg { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
        .fg label { font-size: 0.85rem; color: var(--muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .fg input, .fg textarea {
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 14px 18px;
          outline: none;
          font-size: 1rem;
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
          transition: 0.3s;
        }
        .fg input:focus, .fg textarea:focus { border-color: #50c8ff; background: rgba(255, 255, 255, 0.06); box-shadow: 0 0 15px rgba(80, 200, 255, 0.1); }
        .map-label { display: flex; align-items: center; gap: 12px; font-weight: 900; color: #fff; margin-bottom: 12px; }
        .map-search {
          position: relative;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--border);
          padding: 12px 18px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.03);
          margin-bottom: 15px;
        }
        .map-search input { background: transparent; border: none; outline: none; width: 100%; color: #fff; }
        .map-box { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; }
        .coords { display: flex; justify-content: space-between; margin-top: 10px; color: var(--muted); font-weight: 800; font-size: 0.85rem; }
        .map-fallback {
          border: 1px dashed var(--border);
          border-radius: 16px;
          padding: 24px;
          background: rgba(245, 158, 11, 0.05);
          color: #f59e0b;
          font-weight: 800;
          text-align: center;
        }
        .hint { margin: 0 0 15px; color: var(--muted); font-weight: 700; font-size: 0.95rem; }
        .pass-row { display: flex; gap: 12px; align-items: center; }
        .pass-row input {
          flex: 1;
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 14px 18px;
          font-size: 1rem;
          background: rgba(255, 255, 255, 0.03);
          color: #fff;
          font-family: inherit;
        }
        .note { margin-top: 15px; color: var(--muted); font-size: 0.85rem; line-height: 1.6; }

        @media (max-width: 1024px) {
          .modal-grid { grid-template-columns: 1fr; }
          .stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .mobile-only { display: block; }
          .sa-container { padding: 0 10px 40px; margin: 10px auto; }
          .stats { grid-template-columns: 1fr; gap: 10px; }
          .toolbar { flex-direction: column; align-items: stretch; padding: 10px; border-radius: 16px; }
          .search { max-width: 100%; min-width: 0; padding: 8px 14px; }
          .tabs { overflow-x: auto; padding-bottom: 5px; -webkit-overflow-scrolling: touch; gap: 6px; }
          .tabs button { white-space: nowrap; flex-shrink: 0; padding: 8px 12px; font-size: 0.8rem; }
          .sa-header { padding: 10px; flex-direction: column; align-items: stretch; gap: 10px; height: auto; }
          .header-actions { justify-content: center; width: 100%; flex-wrap: wrap; gap: 6px; }
          .header-actions .btn { font-size: 0.75rem; padding: 8px; flex: 1; min-width: calc(50% - 5px); justify-content: center; }
          .header-actions .btn.danger { min-width: 100%; }
        }
        @media (max-width: 480px) {
          .brand-text p { display: none; }
          .brand { justify-content: center; gap: 8px; }
          .brand-icon { width: 32px; height: 32px; font-size: 1rem; border-radius: 8px; }
          .brand-text h1 { font-size: 1rem; }
          .stat-value { font-size: 1.6rem; }
          .stat-card { padding: 12px; border-radius: 16px; }
          .stat-icon { width: 44px; height: 44px; font-size: 1.2rem; }
        }
        @media (max-width: 330px) {
          .sa-container { padding: 0 6px 40px; }
          .card { padding: 10px; border-radius: 16px; }
          .header-actions .btn { font-size: 0.65rem; padding: 6px; letter-spacing: -0.2px; }
          .header-actions .btn svg { display: none; } /* Hide icons to save space on 320px if needed */
          .tabs button { font-size: 0.75rem; padding: 6px 10px; }
          .stat-value { font-size: 1.4rem; }
          .pill { font-size: 0.7rem; padding: 4px 8px; }
        }




      `}</style>

    </div>
  );
};

export default SuperAdminDashboard;

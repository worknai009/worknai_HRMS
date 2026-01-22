import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  FaUsers,
  FaUserTie,
  FaBuilding,
  FaEnvelope,
  FaMapMarkerAlt,
  FaArrowRight,
  FaCamera,
  FaSync,
  FaExclamationTriangle,
  FaSignOutAlt,
  FaClock,
  FaCog,
  FaSave,
  FaLocationArrow,
  FaBullseye,
  FaShieldAlt,
} from "react-icons/fa";

import { getAssetUrl } from "../../utils/assetUrl";

const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Asia/Dubai",
  "Asia/Singapore",
];

const ATTENDANCE_METHODS = [
  { value: "GPS_FACE", label: "GPS + Face" },
  { value: "FACE_ONLY", label: "Face Only" },
  { value: "QR_FACE", label: "QR + Face" },
  { value: "WIFI_FACE", label: "WiFi + Face" },
  { value: "IP_FACE", label: "IP + Face" },
  { value: "MANUAL_HR", label: "Manual (HR)" },
];

// ✅ Only keep the routes we still use in this dashboard UI
const ROUTES = {
  HR_MANAGEMENT: "/company/hr-management",
  EMP_MANAGEMENT: "/company/employee-management",
  COMPANY_LOGIN: "/company-login",
};

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const [data, setData] = useState({
    company: null,
    stats: {},
    employees: [],
    hrs: [],
  });

  const [logoPreview, setLogoPreview] = useState(null);

  const [settings, setSettings] = useState({
    address: "",
    lat: "",
    lng: "",
    radius: 200,
    startTime: "09:30",
    endTime: "18:30",
    timeZone: "Asia/Kolkata",
    attendanceMethod: "GPS_FACE",
  });

  const safeLogout = useCallback(
    (msg) => {
      if (msg) toast.error(msg);
      logout();
      navigate(ROUTES.COMPANY_LOGIN);
    },
    [logout, navigate],
  );

  const normalizeDashboard = (payload) => {
    const root = payload?.data ?? payload ?? {};
    const company =
      root.company || root?.companyProfile || root?.profile || root;
    const stats = root.stats || root?.counts || {};
    const employees = root.employees || root?.recentEmployees || [];
    const hrs = root.hrs || root?.hrAdmins || root?.hrList || [];
    return { company, stats, employees, hrs };
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      // ✅ Try new-style first, fallback to old
      try {
        res = await API.get("/company/dashboard");
      } catch {
        res = await API.get("/company/profile");
      }

      const normalized = normalizeDashboard(res?.data);

      setData({
        company: normalized.company,
        stats: normalized.stats || {},
        employees: Array.isArray(normalized.employees)
          ? normalized.employees
          : [],
        hrs: Array.isArray(normalized.hrs) ? normalized.hrs : [],
      });

      // ✅ Prefill settings from company
      const c = normalized.company || {};
      const loc = c.location || {};
      const office = c.officeTiming || {};
      const pol = c.attendancePolicy || {};

      setSettings((prev) => ({
        ...prev,
        address: loc.address || prev.address,
        lat:
          typeof loc.lat === "number"
            ? String(loc.lat)
            : loc.lat
              ? String(loc.lat)
              : prev.lat,
        lng:
          typeof loc.lng === "number"
            ? String(loc.lng)
            : loc.lng
              ? String(loc.lng)
              : prev.lng,
        radius: Number(loc.radius ?? prev.radius) || prev.radius,
        startTime: office.startTime || prev.startTime,
        endTime: office.endTime || prev.endTime,
        timeZone: office.timeZone || prev.timeZone,
        attendanceMethod: pol.method || prev.attendanceMethod,
      }));
    } catch (err) {
      const code = err?.response?.status;
      if (code === 401)
        return safeLogout("Session expired. Please login again.");
      toast.error(err?.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [safeLogout]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const company = data.company;
  const employees = data.employees || [];
  const hrs = data.hrs || [];
  const stats = data.stats || {};

  const maxHrAdmins =
    Number(company?.maxHrAdmins ?? company?.hrLimit ?? 0) || 0;
  const usedSlots = hrs.length;
  const freeSlots = Math.max(0, maxHrAdmins - usedSlots);
  const hrRequestStatus = company?.hrLimitRequest; // 'Pending' or null

  const getInitials = (name) => {
    if (!name) return "CO";
    return name
      .split(" ")
      .map((n) => n?.[0] || "")
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  const validateSettings = () => {
    const start = settings.startTime;
    const end = settings.endTime;
    if (!start || !end) return "Office start/end time required.";
    if (end <= start) return "End time must be greater than start time.";

    const rad = Number(settings.radius);
    if (!rad || rad < 50 || rad > 5000)
      return "Radius must be between 50 and 5000 meters.";

    const lat = settings.lat?.trim();
    const lng = settings.lng?.trim();
    if ((lat && !lng) || (!lat && lng))
      return "Please enter both Latitude and Longitude.";
    if (lat && lng) {
      const latNum = Number(lat);
      const lngNum = Number(lng);
      if (Number.isNaN(latNum) || Number.isNaN(lngNum))
        return "Latitude/Longitude must be numbers.";
    }

    return null;
  };

  // ✅ Logo Upload (same logic)
  const handleLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("logo", file);

    try {
      await API.put("/company/update", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Logo updated ✅");
      loadData();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Logo upload failed");
    }
  };

  // ✅ Settings Save (same logic)
  const handleSettingsSave = async (e) => {
    e.preventDefault();
    if (savingSettings) return;

    const validationMsg = validateSettings();
    if (validationMsg) return toast.warning(validationMsg);

    setSavingSettings(true);

    const latNum = settings.lat ? Number(settings.lat) : null;
    const lngNum = settings.lng ? Number(settings.lng) : null;
    const radiusNum = Number(settings.radius);

    const payloadObj = {
      location: {
        address: settings.address,
        radius: radiusNum,
        ...(latNum !== null && !Number.isNaN(latNum) ? { lat: latNum } : {}),
        ...(lngNum !== null && !Number.isNaN(lngNum) ? { lng: lngNum } : {}),
      },
      officeTiming: {
        startTime: settings.startTime,
        endTime: settings.endTime,
        timeZone: settings.timeZone,
      },
      attendancePolicy: {
        method: settings.attendanceMethod,
      },
      // backward safety
      address: settings.address,
      radius: radiusNum,
      timeZone: settings.timeZone,
      officeStartTime: settings.startTime,
      officeEndTime: settings.endTime,
    };

    try {
      await API.put("/company/update", payloadObj);
      toast.success("Company settings saved ✅");
      loadData();
    } catch (err) {
      try {
        const fd = new FormData();
        fd.append("location", JSON.stringify(payloadObj.location));
        fd.append("officeTiming", JSON.stringify(payloadObj.officeTiming));
        fd.append(
          "attendancePolicy",
          JSON.stringify(payloadObj.attendancePolicy),
        );

        await API.put("/company/update", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        toast.success("Company settings saved ✅");
        loadData();
      } catch (err2) {
        toast.error(err2?.response?.data?.message || "Failed to save settings");
      }
    } finally {
      setSavingSettings(false);
    }
  };

  const confirmRequest = async () => {
    setShowConfirmModal(false);
    setRequesting(true);
    try {
      await API.post("/company/request-limit");
      toast.success("Request sent to Super Admin 📩");
      setData((prev) => ({
        ...prev,
        company: { ...(prev.company || {}), hrLimitRequest: "Pending" },
      }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Request failed");
    } finally {
      setRequesting(false);
    }
  };

  // ✅ Clean UI: only 2 cards now
  const quickCards = useMemo(
    () => [
      {
        title: "HR Management",
        desc: "Create & manage HR admins",
        icon: <FaUserTie />,
        onClick: () => navigate(ROUTES.HR_MANAGEMENT),
      },
      {
        title: "Employees",
        desc: "Directory & profile updates",
        icon: <FaUsers />,
        onClick: () => navigate(ROUTES.EMP_MANAGEMENT),
      },
    ],
    [navigate],
  );

  if (loading) {
    return (
      <div className="cd-loader">
        <div className="spinner" />
        <div className="muted">Loading dashboard...</div>
        <style>{`
          .cd-loader{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:#f8fafc;font-family:Inter,sans-serif}
          .spinner{width:44px;height:44px;border-radius:999px;border:4px solid #e2e8f0;border-top-color:#2563eb;animation:spin 1s linear infinite}
          .muted{color:#64748b;font-weight:600}
          @keyframes spin{to{transform:rotate(360deg)}}
        `}</style>
      </div>
    );
  }

  return (
    <div className="company-dashboard">
      {/* NAV */}
      <header className="cd-nav">
        <div className="brand">
          <div className="brand-ic">
            <FaBuilding />
          </div>
          <div className="brand-txt">
            <h1>{company?.name || "Company"}</h1>
            <span>Admin Console</span>
          </div>
        </div>

        <div className="nav-actions">
          <button className="ghost-btn" onClick={loadData} title="Refresh">
            <FaSync />
            <span className="hide-sm">Refresh</span>
          </button>
          <button
            className="logout-btn"
            onClick={() => {
              logout();
              navigate(ROUTES.COMPANY_LOGIN);
            }}
          >
            <FaSignOutAlt />
            <span className="hide-sm">Logout</span>
          </button>
        </div>
      </header>

      <main className="cd-wrap">
        {/* HERO */}
        <section className="hero">
          <div className="hero-left">
            <div className="logoBox">
              <div className="logo">
                {logoPreview || company?.logo ? (
                  <img
                    src={logoPreview || getAssetUrl(company.logo)}
                    alt="Company logo"
                  />
                ) : (
                  <div className="initials">{getInitials(company?.name)}</div>
                )}
              </div>
              <label className="camBtn" title="Update logo">
                <FaCamera />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleLogoChange}
                />
              </label>
            </div>

            <div className="heroInfo">
              <h2>Welcome back 👋</h2>

              <div className="metaRow">
                <span className="pill">
                  <FaEnvelope /> {company?.email || "—"}
                </span>
                <span className="pill">
                  <FaMapMarkerAlt />{" "}
                  {settings.address ||
                    company?.location?.address ||
                    "Office address not set"}
                </span>
              </div>

              <div className="policyRow">
                <span className="pill soft">
                  <FaShieldAlt /> Attendance:{" "}
                  <strong>
                    {ATTENDANCE_METHODS.find(
                      (m) => m.value === settings.attendanceMethod,
                    )?.label || settings.attendanceMethod}
                  </strong>
                </span>
                <span className="pill soft">
                  <FaClock /> {settings.startTime} - {settings.endTime} (
                  {settings.timeZone})
                </span>
              </div>
            </div>
          </div>

          {/* HR LIMIT */}
          <div className="hero-right">
            <div className="limitCard">
              <div className="limitTop">
                <div className="limitTitle">
                  <FaUserTie />
                  <span>HR Slot Usage</span>
                </div>
                <div className="limitNum">
                  <strong>{usedSlots}</strong>
                  <span> / {maxHrAdmins || "—"}</span>
                </div>
              </div>

              <div className="limitBar">
                <div
                  className="limitFill"
                  style={{
                    width: maxHrAdmins
                      ? `${Math.min(100, (usedSlots / maxHrAdmins) * 100)}%`
                      : "0%",
                  }}
                />
              </div>

              <div className="limitHint">
                {freeSlots > 0 ? (
                  <span>
                    ✅ <strong>{freeSlots}</strong> slots available
                  </span>
                ) : (
                  <span>
                    <FaExclamationTriangle /> Limit reached — request upgrade
                  </span>
                )}
              </div>

              {hrRequestStatus === "Pending" ? (
                <div className="status pending">
                  <FaSync className="spin" /> Request Pending...
                </div>
              ) : (
                <button
                  className="primaryBtn"
                  onClick={() => setShowConfirmModal(true)}
                  disabled={requesting || freeSlots > 0}
                  title={
                    freeSlots > 0
                      ? "Slots are still available"
                      : "Request more HR slots"
                  }
                >
                  {requesting ? "Sending..." : "Request HR Limit Increase"}
                  <FaArrowRight />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* QUICK ACTIONS (clean) */}
        <section className="quick">
          <div className="secHead">
            <h3>Quick Access</h3>
            <p>Only the essential modules for daily management</p>
          </div>

          <div className="quickGrid">
            {quickCards.map((c) => (
              <button key={c.title} className="qCard" onClick={c.onClick}>
                <div className="qIcon">{c.icon}</div>
                <div className="qTxt">
                  <h4>{c.title}</h4>
                  <span>{c.desc}</span>
                </div>
                <div className="qGo">
                  <FaArrowRight />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* STATS + SETTINGS */}
        <section className="grid2">
          <div className="statsCol">
            {/* ✅ Only 2 stat cards now */}
            <div className="statCard">
              <div className="sIcon blue">
                <FaUsers />
              </div>
              <div className="sTxt">
                <h4>Employees</h4>
                <strong>
                  {stats?.totalEmployees ?? employees.length ?? 0}
                </strong>
              </div>
              <button
                className="linkBtn"
                onClick={() => navigate(ROUTES.EMP_MANAGEMENT)}
              >
                Manage <FaArrowRight />
              </button>
            </div>

            <div className="statCard">
              <div className="sIcon purple">
                <FaUserTie />
              </div>
              <div className="sTxt">
                <h4>HR Managers</h4>
                <strong>{stats?.totalHRs ?? hrs.length ?? 0}</strong>
              </div>
              <button
                className="linkBtn"
                onClick={() => navigate(ROUTES.HR_MANAGEMENT)}
              >
                Manage <FaArrowRight />
              </button>
            </div>
          </div>

          {/* SETTINGS (same as before) */}
          <div className="settingsCard">
            <div className="settingsHead">
              <div className="shLeft">
                <div className="shIcon">
                  <FaCog />
                </div>
                <div>
                  <h3>Company Configuration</h3>
                  <p>Office time, location radius, and attendance method</p>
                </div>
              </div>
            </div>

            <form className="settingsForm" onSubmit={handleSettingsSave}>
              <div className="formGrid">
                <div className="fg full">
                  <label>
                    <FaMapMarkerAlt /> Office Address
                  </label>
                  <input
                    value={settings.address}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="e.g. Pune, Maharashtra"
                  />
                </div>

                <div className="fg">
                  <label>
                    <FaLocationArrow /> Latitude (optional)
                  </label>
                  <input
                    value={settings.lat}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, lat: e.target.value }))
                    }
                    placeholder="18.5204"
                  />
                </div>

                <div className="fg">
                  <label>
                    <FaLocationArrow /> Longitude (optional)
                  </label>
                  <input
                    value={settings.lng}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, lng: e.target.value }))
                    }
                    placeholder="73.8567"
                  />
                </div>

                <div className="fg">
                  <label>
                    <FaBullseye /> Radius (meters)
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    value={settings.radius}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        radius: Number(e.target.value || 0),
                      }))
                    }
                  />
                  <small className="hint">
                    Geo-fence used during attendance punch.
                  </small>
                </div>

                <div className="fg">
                  <label>
                    <FaClock /> Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.startTime}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, startTime: e.target.value }))
                    }
                  />
                </div>

                <div className="fg">
                  <label>
                    <FaClock /> End Time
                  </label>
                  <input
                    type="time"
                    value={settings.endTime}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, endTime: e.target.value }))
                    }
                  />
                </div>

                <div className="fg">
                  <label>Time Zone</label>
                  <select
                    value={settings.timeZone}
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, timeZone: e.target.value }))
                    }
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="fg">
                  <label>Attendance Method</label>
                  <select
                    value={settings.attendanceMethod}
                    onChange={(e) =>
                      setSettings((p) => ({
                        ...p,
                        attendanceMethod: e.target.value,
                      }))
                    }
                  >
                    {ATTENDANCE_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <small className="hint">
                    Method used for employee punch-in/out verification.
                  </small>
                </div>
              </div>

              <div className="saveRow">
                <button
                  type="submit"
                  className="saveBtn"
                  disabled={savingSettings}
                >
                  {savingSettings ? (
                    "Saving..."
                  ) : (
                    <>
                      <FaSave /> Save Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* LISTS (kept: HR + Employees only) */}
        <section className="lists">
          <div className="panel">
            <div className="panelHead">
              <h3>Active HR Team</h3>
              <button onClick={() => navigate(ROUTES.HR_MANAGEMENT)}>
                Manage All <FaArrowRight />
              </button>
            </div>
            <div className="panelBody">
              {hrs.length === 0 ? (
                <div className="empty">No HR admins yet.</div>
              ) : (
                hrs.slice(0, 8).map((hr) => (
                  <div className="row" key={hr._id}>
                    <div className="avatar">{getInitials(hr.name)}</div>
                    <div className="rowInfo">
                      <strong>{hr.name}</strong>
                      <span>{hr.email}</span>
                    </div>
                    <span className="dot" />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="panel">
            <div className="panelHead">
              <h3>Recent Employees</h3>
              <button onClick={() => navigate(ROUTES.EMP_MANAGEMENT)}>
                View Directory <FaArrowRight />
              </button>
            </div>
            <div className="panelBody">
              {employees.length === 0 ? (
                <div className="empty">No employees found.</div>
              ) : (
                employees.slice(0, 8).map((emp) => (
                  <div className="row" key={emp._id}>
                    <img
                      src={
                        getAssetUrl(emp.profileImage) ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`
                      }
                      onError={(e) =>
                        (e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`)
                      }
                      className="img"
                      alt="emp"
                    />
                    <div className="rowInfo">
                      <strong>{emp.name}</strong>
                      <span>{emp.designation || emp.role || "—"}</span>
                    </div>
                    <span className="dot" />
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* CONFIRM MODAL */}
      {showConfirmModal && (
        <div className="modalBack">
          <div className="modal scaleIn">
            <div className="mIcon">
              <FaExclamationTriangle />
            </div>
            <h3>Request HR Limit Increase?</h3>
            <p>
              Your HR slots are full. This will notify Super Admin for approval.
            </p>
            <div className="mBtns">
              <button
                className="mGhost"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button className="mPrimary" onClick={confirmRequest}>
                Confirm Request
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
          --primary:#2563eb;
          --primary2:#1d4ed8;
          --danger:#e11d48;
          --shadow: 0 10px 30px rgba(15,23,42,0.06);
        }

        .company-dashboard{min-height:100vh;background:var(--bg);font-family:Inter,system-ui,Segoe UI,Arial,sans-serif;color:var(--text)}
        .cd-nav{
          position:sticky;top:0;z-index:50;
          background:rgba(255,255,255,.92);backdrop-filter:blur(10px);
          border-bottom:1px solid var(--border);
          display:flex;align-items:center;justify-content:space-between;
          padding:14px 20px;
        }
        .brand{display:flex;align-items:center;gap:12px}
        .brand-ic{
          width:42px;height:42px;border-radius:12px;background:#eff6ff;color:var(--primary);
          display:flex;align-items:center;justify-content:center;font-size:1.2rem
        }
        .brand-txt h1{margin:0;font-size:1.05rem;font-weight:900}
        .brand-txt span{display:block;margin-top:1px;font-size:.74rem;color:var(--muted);font-weight:800;letter-spacing:.6px;text-transform:uppercase}
        .nav-actions{display:flex;gap:10px;align-items:center}
        .ghost-btn{
          background:#fff;border:1px solid var(--border);color:var(--text);
          padding:10px 12px;border-radius:12px;display:flex;gap:8px;align-items:center;
          cursor:pointer;font-weight:800;transition:.2s;
        }
        .ghost-btn:hover{transform:translateY(-1px);box-shadow:var(--shadow)}
        .logout-btn{
          background:#fff1f2;border:1px solid #ffe4e6;color:var(--danger);
          padding:10px 12px;border-radius:12px;display:flex;gap:8px;align-items:center;
          cursor:pointer;font-weight:900;transition:.2s;
        }
        .logout-btn:hover{background:#ffe4e6}

        .cd-wrap{max-width:1200px;margin:22px auto;padding:0 16px 40px}

        .hero{
          background:var(--card);border:1px solid var(--border);border-radius:18px;
          padding:18px;box-shadow:var(--shadow);
          display:flex;gap:16px;flex-wrap:wrap;align-items:stretch;
        }
        .hero-left{flex:1;min-width:280px;display:flex;gap:16px;align-items:center}
        .logoBox{position:relative}
        .logo{
          width:78px;height:78px;border-radius:18px;overflow:hidden;background:#eff6ff;
          display:flex;align-items:center;justify-content:center;border:1px solid var(--border)
        }
        .logo img{width:100%;height:100%;object-fit:cover}
        .initials{width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--primary);color:#fff;font-weight:1000;font-size:1.9rem}
        .camBtn{
          position:absolute;right:-8px;bottom:-8px;width:34px;height:34px;border-radius:999px;
          background:#fff;border:1px solid var(--border);display:flex;align-items:center;justify-content:center;
          cursor:pointer;color:var(--muted);box-shadow:var(--shadow)
        }
        .camBtn:hover{color:var(--primary)}
        .heroInfo h2{margin:0 0 10px;font-size:1.25rem;font-weight:1000}
        .metaRow,.policyRow{display:flex;gap:10px;flex-wrap:wrap;margin:6px 0}
        .pill{
          background:#f1f5f9;border:1px solid #e6edf7;color:#334155;
          padding:8px 10px;border-radius:12px;font-size:.86rem;font-weight:700;
          display:flex;gap:8px;align-items:center;
        }
        .pill.soft{background:#f8fafc}

        .hero-right{width:340px;max-width:100%}
        .limitCard{
          height:100%;
          background:#f8fafc;border:1px solid var(--border);border-radius:16px;padding:14px;
          display:flex;flex-direction:column;gap:10px;
        }
        .limitTop{display:flex;justify-content:space-between;align-items:center}
        .limitTitle{display:flex;gap:10px;align-items:center;font-weight:1000;color:#334155}
        .limitNum strong{font-size:1.5rem}
        .limitNum span{color:var(--muted);font-weight:800}
        .limitBar{height:10px;border-radius:999px;background:#e2e8f0;overflow:hidden}
        .limitFill{height:100%;background:linear-gradient(90deg,#2563eb,#60a5fa)}
        .limitHint{color:var(--muted);font-weight:800;font-size:.86rem;display:flex;gap:8px;align-items:center}
        .status{padding:10px;border-radius:12px;font-weight:900;display:flex;gap:8px;align-items:center;justify-content:center;border:1px solid var(--border)}
        .status.pending{background:#fffbeb;color:#92400e;border-color:#fde68a}
        .spin{animation:spin 1s linear infinite}
        @keyframes spin{to{transform:rotate(360deg)}}

        .primaryBtn{
          width:100%;border:none;border-radius:12px;padding:12px;
          background:var(--primary);color:#fff;font-weight:1000;cursor:pointer;
          display:flex;align-items:center;justify-content:center;gap:10px;
          transition:.2s;
        }
        .primaryBtn:hover{background:var(--primary2);transform:translateY(-1px)}
        .primaryBtn:disabled{opacity:.55;cursor:not-allowed;transform:none}

        .quick{margin-top:18px}
        .secHead h3{margin:0;font-size:1.05rem;font-weight:1000}
        .secHead p{margin:4px 0 12px;color:var(--muted);font-weight:700;font-size:.9rem}

        /* ✅ clean grid: auto-fit makes it perfect on desktop + mobile */
        .quickGrid{display:grid;grid-template-columns:repeat(auto-fit, minmax(240px, 1fr));gap:12px}

        .qCard{
          border:1px solid var(--border);background:var(--card);border-radius:16px;padding:14px;
          display:flex;gap:12px;align-items:center;cursor:pointer;transition:.2s;text-align:left;
        }
        .qCard:hover{transform:translateY(-2px);box-shadow:var(--shadow);border-color:#cfe0ff}
        .qIcon{width:44px;height:44px;border-radius:14px;background:#eff6ff;color:var(--primary);display:flex;align-items:center;justify-content:center;font-size:1.2rem}
        .qTxt h4{margin:0;font-size:.98rem;font-weight:1000}
        .qTxt span{display:block;margin-top:2px;color:var(--muted);font-weight:700;font-size:.84rem}
        .qGo{margin-left:auto;color:var(--muted)}

        .grid2{margin-top:16px;display:grid;grid-template-columns:1fr 1.35fr;gap:12px;align-items:start}
        .statsCol{display:grid;grid-template-columns:1fr;gap:12px}

        .statCard{
          border:1px solid var(--border);background:var(--card);border-radius:16px;padding:14px;
          display:flex;gap:12px;align-items:center;box-shadow:var(--shadow);
        }
        .sIcon{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.15rem}
        .sIcon.blue{background:#eff6ff;color:#2563eb}
        .sIcon.purple{background:#f5f3ff;color:#7c3aed}
        .sTxt h4{margin:0;color:#334155;font-weight:900}
        .sTxt strong{display:block;margin-top:2px;font-size:1.35rem;font-weight:1000}

        .linkBtn{
          margin-left:auto;border:1px solid var(--border);background:#fff;border-radius:12px;
          padding:10px 12px;font-weight:900;cursor:pointer;display:flex;gap:8px;align-items:center;
          transition:.2s;color:var(--primary);
        }
        .linkBtn:hover{background:#eff6ff;border-color:#cfe0ff}

        .settingsCard{
          border:1px solid var(--border);background:var(--card);border-radius:16px;box-shadow:var(--shadow);overflow:hidden
        }
        .settingsHead{padding:14px;border-bottom:1px solid var(--border);background:#fbfdff}
        .shLeft{display:flex;gap:12px;align-items:center}
        .shIcon{width:44px;height:44px;border-radius:14px;background:#eef2ff;color:#4338ca;display:flex;align-items:center;justify-content:center;font-size:1.15rem}
        .settingsHead h3{margin:0;font-size:1.05rem;font-weight:1000}
        .settingsHead p{margin:4px 0 0;color:var(--muted);font-weight:700;font-size:.88rem}

        .settingsForm{padding:14px}
        .formGrid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
        .fg.full{grid-column:1/-1}
        .fg label{display:flex;gap:8px;align-items:center;font-weight:900;color:#334155;font-size:.9rem;margin-bottom:6px}
        .fg input,.fg select{
          width:100%;box-sizing:border-box;
          border:1px solid var(--border);border-radius:12px;padding:11px 12px;
          outline:none;font-weight:700;color:#0f172a;background:#fff;
        }
        .fg input:focus,.fg select:focus{border-color:#93c5fd;box-shadow:0 0 0 4px rgba(59,130,246,.12)}
        .hint{display:block;margin-top:6px;color:var(--muted);font-weight:700;font-size:.82rem}
        .saveRow{margin-top:12px;display:flex;justify-content:flex-end}
        .saveBtn{
          border:none;border-radius:12px;padding:12px 16px;background:#10b981;color:#064e3b;
          font-weight:1000;cursor:pointer;display:flex;gap:10px;align-items:center;transition:.2s;
        }
        .saveBtn:hover{filter:brightness(1.05);transform:translateY(-1px)}
        .saveBtn:disabled{opacity:.65;cursor:not-allowed;transform:none}

        .lists{margin-top:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .panel{border:1px solid var(--border);background:var(--card);border-radius:16px;box-shadow:var(--shadow);overflow:hidden}
        .panelHead{
          padding:12px 14px;border-bottom:1px solid var(--border);background:#fbfdff;
          display:flex;justify-content:space-between;align-items:center
        }
        .panelHead h3{margin:0;font-size:1rem;font-weight:1000}
        .panelHead button{
          border:none;background:transparent;color:var(--primary);font-weight:900;cursor:pointer;display:flex;gap:8px;align-items:center
        }
        .panelBody{padding:10px;max-height:280px;overflow:auto}
        .row{display:flex;gap:12px;align-items:center;padding:10px;border-radius:12px}
        .row:hover{background:#f8fafc}
        .avatar{
          width:40px;height:40px;border-radius:14px;background:#e2e8f0;color:#334155;
          display:flex;align-items:center;justify-content:center;font-weight:1000
        }
        .img{width:40px;height:40px;border-radius:14px;object-fit:cover;border:1px solid var(--border)}
        .rowInfo strong{display:block;font-weight:1000}
        .rowInfo span{display:block;margin-top:1px;color:var(--muted);font-weight:700;font-size:.86rem}
        .dot{margin-left:auto;width:10px;height:10px;border-radius:999px;background:#22c55e}
        .empty{padding:24px;text-align:center;color:var(--muted);font-weight:800}

        /* Modal */
        .modalBack{position:fixed;inset:0;background:rgba(15,23,42,.45);display:flex;align-items:center;justify-content:center;z-index:1000;padding:18px}
        .modal{width:100%;max-width:420px;background:#fff;border:1px solid var(--border);border-radius:18px;padding:18px;box-shadow:0 30px 80px rgba(0,0,0,.2);text-align:center}
        .mIcon{width:56px;height:56px;margin:0 auto 10px;border-radius:999px;background:#fff7ed;color:#b45309;display:flex;align-items:center;justify-content:center;font-size:1.6rem}
        .modal h3{margin:8px 0 6px;font-size:1.2rem;font-weight:1000}
        .modal p{margin:0;color:var(--muted);font-weight:700}
        .mBtns{margin-top:14px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
        .mGhost{background:#fff;border:1px solid var(--border);padding:10px 14px;border-radius:12px;font-weight:900;cursor:pointer;color:#334155}
        .mPrimary{background:var(--primary);border:none;padding:10px 14px;border-radius:12px;font-weight:1000;cursor:pointer;color:#fff}
        .scaleIn{animation:scaleIn .18s ease-out}
        @keyframes scaleIn{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}

        .hide-sm{display:inline}

        @media (max-width: 1024px){
          .grid2{grid-template-columns:1fr}
          .hero-right{width:100%}
        }
        @media (max-width: 560px){
          .hide-sm{display:none}
          .hero-left{flex-direction:column;align-items:flex-start}
          .metaRow,.policyRow{flex-direction:column;align-items:flex-start}
          .formGrid{grid-template-columns:1fr}
          .lists{grid-template-columns:1fr}
          .cd-nav{padding:12px 14px}
        }
      `}</style>
    </div>
  );
};

export default CompanyDashboard;

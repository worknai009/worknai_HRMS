import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Force body background to prevent white flashes/gaps on mobile
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#050714";

    const goOnline = () => { setIsOnline(true); toast.success("Back online! 🟢"); };
    const goOffline = () => { setIsOnline(false); toast.error("You are offline ⚠️"); };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      document.body.style.backgroundColor = originalBg;
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

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
          <div className="pro-icon-container nav-pro">
            <div className="pro-icon-box">
              <FaBuilding className="pro-icon" />
            </div>
            <div className="pro-icon-ring"></div>
            <div className="pro-icon-glow"></div>
          </div>
          <div className="brand-txt">
            <h1>{company?.name || "Company"}</h1>
            <div className="brand-sub">
              <span>Manager Terminal</span>
              <div className={`net-indicator ${isOnline ? "online" : "offline"}`}>
                <span className="net-dot" />
                {isOnline ? "Online" : "Offline"}
              </div>
            </div>
          </div>
        </div>

        <div className="nav-actions">
          <button className="ghost-btn refresh-btn" onClick={loadData} title="Refresh">
            <FaSync />
            <span className="hide-sm">Refresh</span>
          </button>

          <button className="logout-btn" onClick={() => logout("/")} title="Logout">
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

      <footer className="cd-footer">
        <div className="footer-content">
          <p>© {new Date().getFullYear()} WorknAi Technologies India Pvt. Ltd • Manager Console</p>
          <div className="footer-links">
            <span>Secure Environment</span>
            <span className="dot-sep">•</span>
            <span>Version 2.4.0</span>
          </div>
        </div>
      </footer>

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
        :root {
          --bg-dark: #050714;
          --glass: rgba(13, 17, 34, 0.7);
          --glass-border: rgba(255, 255, 255, 0.08);
          --accent-blue: #50c8ff;
          --accent-violet: #a78bfa;
          --accent-pink: #e879f9;
          --text-bright: #ffffff;
          --text-dim: rgba(255, 255, 255, 0.5);
          --brand-gradient: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          --action-gradient: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
        }

        .company-dashboard {
          min-height: 100vh;
          min-height: 100dvh;
          background-color: #050714;
          background: radial-gradient(circle at top left, #0a0f2b 0%, #050714 50%, #080d1e 100%);
          background-attachment: fixed;
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #fff;
          display: flex;
          flex-direction: column;
        }

        .cd-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(5, 7, 20, 0.85);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          display: flex; align-items: center; justify-content: space-between;
          padding: 10px 24px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        }

        .brand { display: flex; align-items: center; gap: 15px; }

        /* Pro Icon Logic */
        .pro-icon-container {
          position: relative;
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .nav-pro { width: 44px; height: 44px; }
        .pro-icon-box {
          width: 36px; height: 36px;
          border-radius: 12px;
          background: rgba(80, 200, 255, 0.1);
          border: 1px solid rgba(80, 200, 255, 0.2);
          display: flex; align-items: center; justify-content: center;
          z-index: 2; backdrop-filter: blur(10px);
        }
        .nav-pro .pro-icon-box { width: 32px; height: 32px; border-radius: 10px; }
        .pro-icon { font-size: 16px; color: var(--accent-blue); }
        .pro-icon-ring {
          position: absolute; width: 100%; height: 100%;
          border: 1.5px dashed rgba(80, 200, 255, 0.2);
          border-radius: 16px; animation: spinRing 15s linear infinite;
        }
        .pro-icon-glow {
          position: absolute; width: 30px; height: 30px;
          background: var(--accent-blue); filter: blur(25px); opacity: 0.15; z-index: 1;
        }
        @keyframes spinRing { to { transform: rotate(360deg); } }

        .brand-txt h1 { 
          margin: 0; font-size: 1.1rem; font-weight: 900; line-height: 1.2;
          background: var(--brand-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .brand-sub { display: flex; align-items: center; gap: 10px; margin-top: 2px; }
        .brand-sub span { font-size: 0.62rem; color: var(--text-dim); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

        .net-indicator {
          display: flex; align-items: center; gap: 5px;
          font-size: 0.65rem; font-weight: 900; text-transform: uppercase;
        }
        .net-indicator.online { color: #10b981; }
        .net-indicator.offline { color: #ef4444; }
        .net-indicator .net-dot {
          width: 5px; height: 5px; border-radius: 50%;
          animation: pulseShadow 1.5s infinite;
        }
        .net-indicator.online .net-dot { background: #10b981; box-shadow: 0 0 5px #10b981; }
        .net-indicator.offline .net-dot { background: #ef4444; box-shadow: 0 0 5px #ef4444; }
        @keyframes pulseShadow {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .nav-actions { display: flex; gap: 12px; align-items: center; }
        .ghost-btn {
          background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); color: #fff;
          padding: 8px 16px; border-radius: 12px; display: flex; gap: 8px; align-items: center;
          cursor: pointer; font-weight: 700; transition: 0.3s;
        }
        .ghost-btn:hover { background: rgba(255, 255, 255, 0.08); border-color: var(--accent-blue); }

        /* Network Status Badge */
        .net-badge {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 14px; border-radius: 999px;
          font-size: 0.78rem; font-weight: 800; letter-spacing: 0.4px;
          border: 1px solid; transition: 0.4s;
        }
        .net-badge.online  { background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.3);  color: #10b981; }
        .net-badge.offline { background: rgba(239, 68, 68, 0.12);  border-color: rgba(239, 68, 68, 0.3);   color: #ef4444; }
        .net-dot {
          width: 8px; height: 8px; border-radius: 999px; flex-shrink: 0;
          animation: netPulse 1.8s ease-in-out infinite;
        }
        .net-badge.online  .net-dot { background: #10b981; box-shadow: 0 0 6px #10b981; }
        .net-badge.offline .net-dot { background: #ef4444; box-shadow: 0 0 6px #ef4444; }
        @keyframes netPulse {
          0%, 100% { transform: scale(1);   opacity: 1; }
          50%       { transform: scale(1.5); opacity: 0.5; }
        }
        
        .logout-btn {
          background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444;
          padding: 8px 16px; border-radius: 12px; display: flex; gap: 8px; align-items: center;
          cursor: pointer; font-weight: 800; transition: 0.3s;
        }
        .logout-btn:hover { background: rgba(239, 68, 68, 0.2); transform: scale(1.02); }

        .cd-wrap { flex: 1; max-width: 1200px; margin: 30px auto 0; padding: 0 20px 80px; }

        .hero {
          background: var(--glass); border: 1px solid var(--glass-border); border-radius: 24px;
          padding: 30px; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
          display: flex; gap: 24px; flex-wrap: wrap; align-items: center;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }

        .hero::before {
          content: ""; position: absolute; top: -50%; left: -20%; width: 60%; height: 60%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.05) 0%, transparent 70%); z-index: -1;
        }

        .hero-left { flex: 1; min-width: 300px; display: flex; gap: 24px; align-items: center; }
        .logoBox { position: relative; }
        .logo {
          width: 90px; height: 90px; border-radius: 22px; overflow: hidden;
          background: rgba(80, 200, 255, 0.05); display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--glass-border); box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        }
        .logo img { width: 100%; height: 100%; object-fit: cover; }
        .initials { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--action-gradient); color: #fff; font-weight: 900; font-size: 2.2rem; }
        
        .camBtn {
          position: absolute; right: -5px; bottom: -5px; width: 34px; height: 34px; border-radius: 999px;
          background: #1a2035; border: 1px solid var(--accent-blue); display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: var(--accent-blue); transition: 0.3s;
        }
        .camBtn:hover { background: var(--accent-blue); color: #fff; transform: scale(1.1); }

        .heroInfo h2 { 
          margin: 0 0 12px; font-size: 1.8rem; font-weight: 900; 
          background: var(--brand-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .metaRow, .policyRow { display: flex; gap: 12px; flex-wrap: wrap; margin: 8px 0; }
        .pill {
          background: rgba(255, 255, 255, 0.04); border: 1px solid var(--glass-border); color: var(--text-bright);
          padding: 8px 14px; border-radius: 14px; font-size: 0.85rem; font-weight: 600;
          display: flex; gap: 8px; align-items: center; transition: 0.3s;
        }
        .pill:hover { border-color: var(--accent-blue); background: rgba(80, 200, 255, 0.08); transform: translateY(-1px); }
        .pill.soft { background: rgba(255, 255, 255, 0.02); color: var(--text-dim); }
        .pill strong { color: var(--accent-blue); }

        .hero-right { width: 360px; max-width: 100%; }
        .limitCard {
          background: rgba(255, 255, 255, 0.03); border: 1px solid var(--glass-border); border-radius: 20px; padding: 20px;
          display: flex; flex-direction: column; gap: 15px;
        }
        .limitTop { display: flex; justify-content: space-between; align-items: center; }
        .limitTitle { display: flex; gap: 10px; align-items: center; font-weight: 800; color: var(--text-dim); text-transform: uppercase; font-size: 0.75rem; letter-spacing: 1px; }
        .limitTitle svg { color: var(--accent-violet); font-size: 1.1rem; }
        .limitNum strong { font-size: 1.8rem; color: #fff; }
        .limitNum span { color: var(--text-dim); font-size: 0.9rem; }
        .limitBar { height: 8px; border-radius: 999px; background: rgba(255, 255, 255, 0.05); overflow: hidden; }
        .limitFill { height: 100%; background: var(--action-gradient); box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
        .limitHint { color: var(--text-dim); font-weight: 600; font-size: 0.8rem; display: flex; gap: 8px; align-items: center; }
        .limitHint strong { color: var(--accent-blue); }

        .status.pending { background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.2); }
        
        .primaryBtn {
          width: 100%; border: none; border-radius: 14px; padding: 14px;
          background: var(--action-gradient); color: #fff; font-weight: 800; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 12px;
          transition: 0.3s; box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }
        .primaryBtn:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(139, 92, 246, 0.5); filter: brightness(1.1); }
        .primaryBtn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

        .quick { margin-top: 30px; }
        .secHead h3 { margin: 0; font-size: 1.25rem; font-weight: 900; color: #fff; }
        .secHead p { margin: 4px 0 18px; color: var(--text-dim); font-weight: 600; font-size: 0.9rem; }

        .quickGrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; }
        .qCard {
          border: 1px solid var(--glass-border); background: var(--glass); border-radius: 20px; padding: 20px;
          display: flex; gap: 18px; align-items: center; cursor: pointer; transition: 0.3s; text-align: left;
        }
        .qCard:hover { transform: translateY(-5px); background: rgba(80, 200, 255, 0.05); border-color: var(--accent-blue); box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
        .qIcon { 
          width: 50px; height: 50px; border-radius: 14px; 
          background: rgba(80, 200, 255, 0.08); color: var(--accent-blue); 
          display: flex; align-items: center; justify-content: center; font-size: 1.3rem; 
          transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .qCard:hover .qIcon { transform: rotate(10deg) scale(1.1); background: var(--accent-blue); color: #fff; }
        .qTxt h4 { margin: 0; font-size: 1.1rem; font-weight: 850; color: #fff; letter-spacing: -0.2px; }
        .qTxt span { display: block; margin-top: 3px; color: var(--text-dim); font-weight: 600; font-size: 0.8rem; }
        .qGo { margin-left: auto; color: var(--text-dim); transition: 0.3s; opacity: 0.5; }
        .qCard:hover .qGo { color: var(--accent-blue); transform: translateX(5px); opacity: 1; }

        .grid2 { margin-top: 25px; display: grid; grid-template-columns: 1fr 1.35fr; gap: 20px; align-items: start; }
        .statsCol { display: grid; grid-template-columns: 1fr; gap: 18px; }

        .statCard {
          border: 1px solid var(--glass-border); background: var(--glass); border-radius: 22px; padding: 22px;
          display: flex; gap: 18px; align-items: center; box-shadow: 0 15px 35px rgba(0,0,0,0.2);
        }
        .sIcon { width: 56px; height: 56px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; }
        .sIcon.blue { background: rgba(80, 200, 255, 0.1); color: var(--accent-blue); }
        .sIcon.purple { background: rgba(167, 139, 250, 0.1); color: var(--accent-violet); }
        .sTxt strong { display: block; margin-top: 2px; font-size: 1.5rem; font-weight: 900; color: #fff; line-height: 1; }

        .linkBtn {
          margin-left: auto; border: 1px solid var(--glass-border); background: rgba(255, 255, 255, 0.05); border-radius: 10px;
          padding: 8px 12px; font-size: 0.75rem; font-weight: 800; cursor: pointer; display: flex; gap: 6px; align-items: center;
          transition: 0.3s; color: var(--accent-blue); white-space: nowrap;
        }
        .linkBtn:hover { background: var(--accent-blue); color: #fff; border-color: var(--accent-blue); }

        .settingsCard { border: 1px solid var(--glass-border); background: var(--glass); border-radius: 24px; overflow: hidden; }
        .settingsHead { padding: 22px; border-bottom: 1px solid var(--glass-border); background: rgba(255, 255, 255, 0.02); }
        .shLeft { display: flex; gap: 15px; align-items: center; }
        .shIcon { 
          width: 54px; height: 54px; border-radius: 16px; 
          background: rgba(167, 139, 250, 0.1); color: var(--accent-violet); 
          display: flex; align-items: center; justify-content: center; font-size: 1.4rem; 
        }
        .settingsHead h3 { margin: 0; font-size: 1.2rem; font-weight: 900; }
        .settingsHead p { margin: 6px 0 0; color: var(--text-dim); font-weight: 600; font-size: 0.88rem; }

        .settingsForm { padding: 25px; }
        .formGrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
        .fg label { display: flex; gap: 8px; align-items: center; font-weight: 700; color: var(--text-dim); font-size: 0.85rem; margin-bottom: 8px; }
        .fg input, .fg select {
          width: 100%; box-sizing: border-box;
          border: 1px solid var(--glass-border); border-radius: 14px; padding: 12px 15px;
          outline: none; font-weight: 600; color: #fff; background: rgba(255, 255, 255, 0.03);
          transition: 0.3s;
        }
        .fg input:focus, .fg select:focus { border-color: var(--accent-blue); background: rgba(80, 200, 255, 0.05); box-shadow: 0 0 15px rgba(80, 200, 255, 0.2); }
        .fg select option { background: #050714; color: #fff; }
        .saveBtn {
          border: none; border-radius: 14px; padding: 14px 24px; 
          background: linear-gradient(135deg, #10b981, #059669); color: #fff;
          font-weight: 800; cursor: pointer; display: flex; gap: 10px; align-items: center; transition: 0.3s;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.2);
        }
        .saveBtn:hover { transform: translateY(-2px); box-shadow: 0 15px 35px rgba(16, 185, 129, 0.4); filter: brightness(1.1); }

        .cd-footer {
          margin-top: auto;
          padding: 40px 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          background: rgba(0, 0, 0, 0.2);
          text-align: center;
        }
        .footer-content p { color: var(--text-dim); font-size: 0.8rem; font-weight: 700; margin: 0; }
        .footer-links { 
          margin-top: 10px; display: flex; align-items: center; justify-content: center; 
          gap: 10px; color: rgba(255, 255, 255, 0.2); font-size: 0.75rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 1px;
        }
        .dot-sep { opacity: 0.5; }

        .panel { border: 1px solid var(--glass-border); background: var(--glass); border-radius: 22px; overflow: hidden; }
        .panelHead {
          padding: 18px 22px; border-bottom: 1px solid var(--glass-border); background: rgba(255, 255, 255, 0.02);
          display: flex; justify-content: space-between; align-items: center;
        }
        .panelHead h3 { margin: 0; font-size: 1.1rem; font-weight: 900; }
        .panelHead button { border: none; background: transparent; color: var(--accent-blue); font-weight: 800; cursor: pointer; display: flex; gap: 8px; align-items: center; transition: 0.3s; }
        .panelHead button:hover { color: #fff; transform: translateX(5px); }
        
        .row {
          display: flex; align-items: center; gap: 12px; padding: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03); transition: 0.3s;
          cursor: default;
        }
        .row:last-child { border-bottom: none; }
        .row:hover { background: rgba(255, 255, 255, 0.03); }
        
        .rowInfo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .rowInfo strong { 
          color: #fff; font-weight: 800; font-size: 0.95rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .rowInfo span { 
          color: var(--text-dim); font-weight: 600; font-size: 0.78rem;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .avatar {
          width: 40px; height: 40px; border-radius: 12px; background: rgba(80, 200, 255, 0.1); color: var(--accent-blue);
          display: flex; align-items: center; justify-content: center; font-weight: 900; border: 1px solid var(--glass-border);
          flex-shrink: 0; font-size: 0.85rem;
        }
        .img { width: 40px; height: 40px; border-radius: 12px; object-fit: cover; border: 1.5px solid var(--glass-border); flex-shrink: 0; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; box-shadow: 0 0 10px rgba(16, 185, 129, 0.6); flex-shrink: 0; }

        .modal { background: #080d1e; border: 1px solid var(--accent-blue); border-radius: 24px; padding: 30px; }
        .mIcon { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        .mGhost { background: transparent; border: 1px solid var(--glass-border); color: #fff; transition: 0.3s; }
        .mGhost:hover { background: rgba(255, 255, 255, 0.05); }
        .mPrimary { background: var(--action-gradient); box-shadow: 0 10px 20px rgba(139, 92, 246, 0.3); }

        @media (max-width: 1024px) { .grid2 { grid-template-columns: 1fr; } .hero-right { width: 100%; } }
        @media (max-width: 640px) {
          .cd-nav { padding: 10px 12px; }
          .hero-left { flex-direction: column; text-align: center; gap: 12px; }
          .logo { margin: 0 auto; width: 70px; height: 70px; border-radius: 18px; }
          .heroInfo h2 { font-size: 1.4rem; margin-bottom: 6px; }
          .metaRow, .policyRow { justify-content: center; gap: 6px; }
          .pill { font-size: 0.72rem; padding: 5px 9px; }
          .cd-wrap { margin: 15px auto; padding: 0 12px 40px; }
          .hero { padding: 20px 15px; }
          .statCard { padding: 15px; gap: 12px; }
          .sIcon { width: 44px; height: 44px; font-size: 1.1rem; border-radius: 12px; }
          .sTxt strong { font-size: 1.4rem; }
          .linkBtn { padding: 6px 10px; font-size: 0.7rem; }
          .qCard { padding: 15px; gap: 12px; }
          .qIcon { width: 42px; height: 42px; font-size: 1.1rem; }
          .qTxt h4 { font-size: 0.95rem; }
          .qTxt span { font-size: 0.72rem; }
          .brand-txt h1 { font-size: 0.9rem; max-width: 140px; }
          .brand-sub { gap: 5px; }
          .net-indicator { font-size: 0.5rem; }
          .hide-sm { display: none; }
          /* Fix List Rows on Mobile */
          .panelHead h3 { font-size: 0.95rem; }
          .panelHead button { font-size: 0.75rem; }
          .rowInfo strong { font-size: 0.88rem; }
          .rowInfo span { font-size: 0.7rem; }
        }
        @media (max-width: 360px) {
          .brand-txt h1 { max-width: 120px; }
          .nav-pro { display: none; } /* Hide icon to save space on ultra-small screens */
          .linkBtn span { display: none; } /* Show only arrow if needed */
        }
      `}</style>
    </div>
  );
};

export default CompanyDashboard;

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import FaceCapture from "../../components/FaceCapture/FaceCapture";
import { toast } from "react-toastify";
import {
  FaBars,
  FaTimes,
  FaSignOutAlt,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaBriefcase,
  FaEnvelope,
  FaPlay,
  FaCoffee,
  FaArrowRight,
  FaRedoAlt,
  FaTasks,
  FaPlaneDeparture,
  FaHistory,
  FaClipboardList,
  FaUserCheck,
  FaCheckCircle,
  FaSpinner,
} from "react-icons/fa";
import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api";

/* =========================
   GOOGLE MAPS KEY (CRA .env)
========================= */
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || "";

/* =========================
   BACKEND HOST (for images)
========================= */
const DEV_BACKEND_FALLBACK = "http://localhost:5000";
const ENV_BACKEND = process.env.REACT_APP_SERVER_URL || process.env.REACT_APP_BACKEND_URL || "";

/* =========================
   MAP SETTINGS
========================= */
const mapContainerStyle = { width: "100%", height: "260px", borderRadius: "16px" };

/* =========================
   Request helper (fallback safe)
========================= */
const tryReq = async (fnList = []) => {
  let lastErr = null;
  for (const fn of fnList) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const st = e?.response?.status;
      if (st === 404 || st === 405) continue; // fallback only on route missing
      throw e;
    }
  }
  throw lastErr || new Error("Request failed");
};

/* =========================
   Resolve backend host safely
========================= */
const getApiHost = () => {
  const base = API?.defaults?.baseURL || "";

  // absolute baseURL (e.g. https://domain.com/api)
  if (typeof base === "string" && /^https?:\/\//i.test(base)) {
    return base.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
  }

  // relative baseURL (e.g. /api)
  const winOrigin =
    typeof window !== "undefined" && window.location?.origin ? window.location.origin : "";

  const isLocalDev =
    typeof window !== "undefined" && /localhost:3000|127\.0\.0\.1:3000/i.test(winOrigin);

  if (ENV_BACKEND && /^https?:\/\//i.test(ENV_BACKEND)) {
    return ENV_BACKEND.replace(/\/+$/, "");
  }

  if (isLocalDev) return DEV_BACKEND_FALLBACK;

  return (winOrigin || DEV_BACKEND_FALLBACK).replace(/\/+$/, "");
};

const normalizeUploadPath = (raw) => {
  if (!raw) return "";
  const p = String(raw).replace(/\\/g, "/");

  if (/^https?:\/\//i.test(p)) return p;

  const lower = p.toLowerCase();
  const idx = lower.lastIndexOf("/uploads/");
  if (idx !== -1) return p.slice(idx + 1);

  const idx2 = lower.indexOf("uploads/");
  if (idx2 !== -1) return p.slice(idx2);

  return p.replace(/^\/+/, "").replace(/^backend\//i, "");
};

const getImageUrl = (imgPath) => {
  if (!imgPath) return "https://via.placeholder.com/150";
  const p = String(imgPath);
  if (p.startsWith("http")) return p;

  const host = getApiHost();
  const clean = normalizeUploadPath(p);
  return `${host}/${clean}`;
};

/* =========================
   GEO HELPERS
========================= */
const haversineMeters = (a, b) => {
  if (!a || !b) return null;
  const lat1 = Number(a.lat);
  const lon1 = Number(a.lng);
  const lat2 = Number(b.lat);
  const lon2 = Number(b.lng);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;

  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const x =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
};

const computeDistanceMeters = (a, b) => {
  try {
    if (
      typeof window !== "undefined" &&
      window.google?.maps?.geometry?.spherical &&
      a?.lat != null &&
      a?.lng != null &&
      b?.lat != null &&
      b?.lng != null
    ) {
      const p1 = new window.google.maps.LatLng(Number(a.lat), Number(a.lng));
      const p2 = new window.google.maps.LatLng(Number(b.lat), Number(b.lng));
      const d = window.google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
      return Number.isFinite(d) ? d : null;
    }
  } catch (e) { }
  return haversineMeters(a, b);
};

/* =========================
   ACCURATE GPS
========================= */
const getAccuratePosition = ({
  desiredAccuracy = 60,
  maxWaitMs = 25000,
  enableHighAccuracy = true,
} = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));

    const opts = { enableHighAccuracy, timeout: 15000, maximumAge: 0 };
    let best = null;
    let watchId = null;
    let done = false;

    const finish = (pos, isTimeout = false) => {
      if (done) return;
      done = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      if (isTimeout && best) return resolve(best);
      resolve(pos);
    };

    const fail = (err) => {
      if (done) return;
      done = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      reject(err);
    };

    const consider = (pos) => {
      const acc = Number(pos?.coords?.accuracy);
      if (!best || (Number.isFinite(acc) && acc < Number(best.coords.accuracy))) best = pos;
      if (Number.isFinite(acc) && acc <= desiredAccuracy) finish(pos);
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        consider(pos);

        const acc = Number(pos?.coords?.accuracy);
        if (Number.isFinite(acc) && acc <= desiredAccuracy) return;

        watchId = navigator.geolocation.watchPosition(
          (p) => consider(p),
          (e) => (best ? finish(best, true) : fail(e)),
          { enableHighAccuracy, maximumAge: 0, timeout: 20000 }
        );

        setTimeout(() => finish(best || pos, true), maxWaitMs);
      },
      (err) => fail(err),
      opts
    );
  });
};

/* =========================
   DATA NORMALIZERS
========================= */
const pickArray = (d) => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.rows)) return d.rows;
  return [];
};

const normalizeLeaveType = (t) => {
  const s = String(t || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "wfh" || s.includes("work from home")) return "WFH";
  if (s.includes("unpaid") || s === "absent") return "Unpaid";
  if (s.includes("paid") || s.includes("leave") || s === "sick" || s === "casual") return "Paid";
  return t;
};

const fmtTime = (val, tz = "Asia/Kolkata") => {
  if (!val) return "--";
  const dt = new Date(val);
  if (Number.isNaN(dt.getTime())) return "--";
  return dt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: tz });
};

const fmtDate = (val, tz = "Asia/Kolkata") => {
  if (!val) return "--";
  const dt = new Date(val);
  if (Number.isNaN(dt.getTime())) return String(val);
  return dt.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric", timeZone: tz });
};

const toYMD = (val, tz = "Asia/Kolkata") => {
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const dt = new Date(val);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toLocaleDateString("en-CA", { timeZone: tz });
};

const resolveJoiningDate = (u) => {
  if (!u) return null;
  return (
    u.joiningDate ||
    u.joinDate ||
    u.dateOfJoining ||
    u.doj ||
    u.joining_date ||
    u.employeeDetails?.joiningDate ||
    u.employmentDetails?.joiningDate ||
    u.employment?.joiningDate ||
    u.joinedAt ||
    u.createdAt ||
    u.created_on ||
    null
  );
};

const normalizeProfile = (u) => {
  if (!u) return null;
  return {
    ...u,
    name: u.name || u.fullName || "Employee",
    designation: u.designation || u.roleTitle || u.role || "Employee",
    profileImage: u.profileImage || u.avatar || u.photo || "",
    joiningDate: resolveJoiningDate(u),
  };
};

/* =========================
   Lazy Map Loader (only when modal opens)
========================= */
const VerifyMap = React.memo(function VerifyMap({ apiKey, currentPos, officePos, circleOptions }) {
  const libraries = useMemo(() => ["geometry"], []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries,
  });

  const mapBlocked = !apiKey || !!loadError;

  if (mapBlocked) {
    return (
      <div className="warnBox">
        Google Map not available. Check:
        <br />• REACT_APP_GOOGLE_MAPS_KEY in .env
        <br />• Maps JavaScript API enabled
        <br />• Billing enabled on GCP
      </div>
    );
  }

  if (!isLoaded) return <div className="mapFallback">Loading map…</div>;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={currentPos || officePos || { lat: 20.5937, lng: 78.9629 }}
      zoom={currentPos || officePos ? 16 : 5}
      options={{
        streetViewControl: false,
        fullscreenControl: false,
        mapTypeControl: false,
        clickableIcons: false,
      }}
    >
      {officePos && (
        <>
          <Marker position={officePos} />
          <Circle center={officePos} options={circleOptions} />
        </>
      )}
      {currentPos && <Marker position={{ lat: currentPos.lat, lng: currentPos.lng }} />}
    </GoogleMap>
  );
});

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // loader only first time (no blink)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const initialLoadedRef = useRef(false);

  // latest self profile
  const [meProfile, setMeProfile] = useState(null);

  // datasets
  const [stats, setStats] = useState({});
  const [history, setHistory] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tasks, setTasks] = useState([]);

  // onboarding summary
  const [onboardingSummary, setOnboardingSummary] = useState({ pending: 0, total: 0, assigned: false });
  const onboardingDisabledRef = useRef(false);

  // punch flow
  const [todayStatus, setTodayStatus] = useState("Not Started");
  const [showTextModal, setShowTextModal] = useState(false);
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [reportText, setReportText] = useState("");
  const [actionType, setActionType] = useState(null); // "in" | "out"

  // location
  const [currentPos, setCurrentPos] = useState(null);
  const [officePos, setOfficePos] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [isGpsLocked, setIsGpsLocked] = useState(false);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [isInsideRadius, setIsInsideRadius] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const watchToastRef = useRef(null);

  const profile = useMemo(() => normalizeProfile(meProfile || user), [meProfile, user]);
  const uid = profile?._id || user?._id || null;

  // keep latest profile in ref (avoid dependency loops)
  const profileRef = useRef(profile);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  const tz = useMemo(() => {
    const companyTz = profile?.companyId?.officeTiming?.timeZone || profile?.companyId?.timeZone || "Asia/Kolkata";
    try {
      return companyTz || Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    } catch {
      return "Asia/Kolkata";
    }
  }, [profile?.companyId?.officeTiming?.timeZone, profile?.companyId?.timeZone]);

  const radiusMeters = useMemo(() => {
    const r =
      Number(profile?.companyId?.location?.radius) ||
      Number(profile?.companyId?.radius) ||
      Number(profile?.companyId?.attendanceRadius) ||
      3000;
    if (!Number.isFinite(r)) return 3000;
    return Math.min(Math.max(r, 50), 5000);
  }, [profile?.companyId?.location?.radius, profile?.companyId?.radius, profile?.companyId?.attendanceRadius]);

  const attendanceMethod = useMemo(() => {
    return profile?.companyId?.attendanceMethod || profile?.companyId?.attendancePolicy?.method || "GPS_FACE";
  }, [profile?.companyId?.attendanceMethod, profile?.companyId?.attendancePolicy?.method]);

  const circleOptions = useMemo(() => {
    return {
      strokeColor: "#10b981",
      strokeOpacity: 0.9,
      strokeWeight: 2,
      fillColor: "#10b981",
      fillOpacity: 0.12,
      clickable: false,
      radius: radiusMeters,
      zIndex: 1,
    };
  }, [radiusMeters]);

  /* =========================
     FETCH LATEST PROFILE (loop-safe)
  ========================= */
  const fetchMe = useCallback(async () => {
    if (!user?._id) return;

    try {
      const res = await tryReq([
        () => API.get("/employee/me"),
        () => API.get("/auth/me"),
        () => API.get("/users/me"),
      ]);

      const u = res?.data?.user || res?.data;
      if (!u?._id) return;

      setMeProfile((prev) => {
        if (!prev) return u;

        const sameId = String(prev._id) === String(u._id);
        const sameUpdated = String(prev.updatedAt || "") === String(u.updatedAt || "");
        // if backend returns same profile again -> don't set (prevents render loop)
        if (sameId && sameUpdated) return prev;
        return u;
      });
    } catch {
      // ignore
    }
  }, [user?._id]);

  /* =========================
     FETCH DASHBOARD (no blink after first load)
  ========================= */
  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      if (!uid) return;

      if (!initialLoadedRef.current) setLoading(true);
      else if (isRefresh) setRefreshing(true);

      try {
        const leavesPromise = API.get("/leaves/my").catch(() => API.get(`/leaves/employee/${uid}`));

        const [statsRes, attRes, leaveRes, taskRes] = await Promise.all([
          API.get("/attendance/stats"),
          API.get("/attendance/history"),
          leavesPromise,
          API.get("/tasks/my-tasks"),
        ]);

        setStats(statsRes?.data || {});

        const attList = pickArray(attRes?.data);
        const sortedAtt = [...attList].sort((a, b) => {
          const da = new Date(a?.date || a?.punchInTime || 0).getTime();
          const db = new Date(b?.date || b?.punchInTime || 0).getTime();
          return db - da;
        });
        setHistory(sortedAtt);

        const leaveList = pickArray(leaveRes?.data).sort(
          (a, b) => new Date(b?.createdAt || b?.startDate || 0) - new Date(a?.createdAt || a?.startDate || 0)
        );
        setLeaves(leaveList);

        setTasks(pickArray(taskRes?.data));

        // office location from latest profile ref (no dependency loop)
        const p = profileRef.current;
        const cLoc = p?.companyId?.location || {};
        const lat = Number(cLoc.lat);
        const lng = Number(cLoc.lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) setOfficePos({ lat, lng });
        else setOfficePos(null);

        const todayYmd = toYMD(new Date(), tz);
        const todayRecord = sortedAtt.find((d) => toYMD(d?.date, tz) === todayYmd);

        if (!todayRecord) setTodayStatus("Not Started");
        else if (todayRecord?.punchOutTime) setTodayStatus("Completed");
        else if (String(todayRecord?.status || "").toLowerCase().includes("break")) setTodayStatus("On Break");
        else setTodayStatus("Working");

        initialLoadedRef.current = true;
      } catch (err) {
        console.error(err);
        toast.error("Dashboard load failed");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [uid, tz]
  );

  /* =========================
     ONBOARDING SUMMARY (404 -> stop forever)
  ========================= */
  const fetchOnboardingSummary = useCallback(async () => {
    if (onboardingDisabledRef.current) return;

    try {
      // ✅ FIX: specific endpoint only (no fallbacks)
      const res = await API.get("/onboarding/my");

      // Handle 200 OK with null body (from backend fix)
      if (!res.data) {
        setOnboardingSummary({ pending: 0, total: 0, assigned: false });
        return;
      }

      const data = res?.data;
      const items = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.steps)
          ? data.steps
          : Array.isArray(data)
            ? data
            : [];
      const total = items.length;
      const pending = items.filter((x) => String(x?.status || "").toLowerCase() !== "done").length;

      setOnboardingSummary({ pending, total, assigned: true });
    } catch (e) {
      const st = e?.response?.status;
      // 404 means "No onboarding assigned" -> Valid state, not an error.
      if (st === 404) {
        setOnboardingSummary({ pending: 0, total: 0, assigned: false });
        return;
      }
      // 403/500 etc -> log but don't break dashboard
      console.warn("Onboarding check failed:", e);
      setOnboardingSummary({ pending: 0, total: 0, assigned: false });
    }
  }, []);

  /* =========================
     EFFECTS
  ========================= */
  useEffect(() => {
    if (!user?._id) return;
    fetchMe();
    // only once per login/user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  useEffect(() => {
    if (!uid) return;
    fetchDashboardData(false);
    fetchOnboardingSummary();
  }, [uid, fetchDashboardData, fetchOnboardingSummary]);

  useEffect(() => {
    if (!currentPos || !officePos) {
      setDistanceMeters(null);
      setIsInsideRadius(true);
      return;
    }
    const d = computeDistanceMeters(currentPos, officePos);
    setDistanceMeters(d);
    setIsInsideRadius(d == null ? false : d <= radiusMeters);
  }, [currentPos, officePos, radiusMeters]);

  /* =========================
     PUNCH FLOW
  ========================= */
  const handlePunchInit = (type) => {
    setActionType(type);
    setReportText("");
    setShowTextModal(true);
  };

  const proceedToVerification = () => {
    setShowTextModal(false);
    setShowPunchModal(true);

    setIsGpsLocked(false);
    setCurrentPos(null);
    setGpsAccuracy(null);
    setDistanceMeters(null);
    setIsInsideRadius(true);

    fetchLocation(); // try, but not mandatory
  };

  const fetchLocation = async () => {
    setIsLocating(true);
    setIsGpsLocked(false);
    setCurrentPos(null);
    setGpsAccuracy(null);
    setDistanceMeters(null);
    setIsInsideRadius(true);

    if (!navigator.geolocation) {
      setIsLocating(false);
      return;
    }

    if (!GOOGLE_MAPS_API_KEY) {
      // no toast spam, just once
    }

    try {
      if (watchToastRef.current) toast.dismiss(watchToastRef.current);
      watchToastRef.current = toast.info("📍 Getting accurate location…", { autoClose: 2000 });

      const pos = await getAccuratePosition({
        desiredAccuracy: 60,
        maxWaitMs: 25000,
        enableHighAccuracy: true,
      });

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const accuracy = Number(pos.coords.accuracy);

      setCurrentPos({ lat, lng, accuracy });
      setGpsAccuracy(Number.isFinite(accuracy) ? accuracy : null);
      setIsGpsLocked(true);

      toast.success(`Location Locked ✅ (±${Number.isFinite(accuracy) ? Math.round(accuracy) : "?"}m)`);
    } catch (err) {
      // location optional — no hard block
      console.error(err);
      toast.info("Location not available — continuing without GPS.");
    } finally {
      setIsLocating(false);
    }
  };

  const onFaceVerified = async (faceData) => {
    const locationOk =
      isGpsLocked &&
      currentPos &&
      Number.isFinite(Number(currentPos.lat)) &&
      Number.isFinite(Number(currentPos.lng));

    if (officePos && locationOk && distanceMeters != null && distanceMeters > radiusMeters) {
      return toast.error(`❌ You are outside office radius (${radiusMeters}m). Attendance blocked.`);
    }

    try {
      const payload = {
        faceDescriptor: JSON.stringify(faceData?.descriptor || []),
        faceDescriptorArray: faceData?.descriptor || [],
        image: faceData?.image,

        attendanceMethod,
        method: attendanceMethod,

        // location optional
        ...(locationOk
          ? {
            location: {
              lat: currentPos.lat,
              lng: currentPos.lng,
              accuracy: currentPos.accuracy ?? gpsAccuracy ?? null,
              capturedAt: new Date().toISOString(),
            },
          }
          : {}),

        morningReport: actionType === "in" ? reportText : undefined,
        dailyReport: actionType === "out" ? reportText : undefined,
        plannedTasks: actionType === "in" ? reportText : undefined,
      };

      const endpoint = actionType === "in" ? "/attendance/punch-in" : "/attendance/punch-out";
      await API.post(endpoint, payload);

      toast.success(actionType === "in" ? "Attendance Marked ✅" : "Logged Out Successfully 🏠");
      setShowPunchModal(false);
      fetchDashboardData(true);
      fetchMe();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Verification failed!");
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await API.put(`/tasks/update-status/${taskId}`, { status });
      toast.success(`Task updated: ${status}`);
      fetchDashboardData(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Task update failed");
    }
  };

  /* =========================
     UI HELPERS
  ========================= */
  const approvedLeavesCount = useMemo(() => {
    return leaves.filter((l) => String(l?.status || "").toLowerCase() === "approved").length;
  }, [leaves]);

  const pendingTasksCount = useMemo(() => {
    return tasks.filter((t) => {
      const s = String(t?.status || "").toLowerCase();
      return s === "pending" || s === "in progress";
    }).length;
  }, [tasks]);

  const presentThisMonth = useMemo(() => {
    const v = stats?.present ?? stats?.presentDays ?? stats?.presentCount ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, [stats]);

  const distanceLabel = (d) => {
    if (d == null) return "--";
    if (d < 1000) return `${Math.round(d)} m`;
    return `${(d / 1000).toFixed(2)} km`;
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="loaderScreen">
        <div className="spinBig" />
        <div className="loaderText">Loading Dashboard…</div>

        <style>{`
          .loaderScreen{ min-height: 70vh; display:grid; place-items:center; gap:10px; }
          .spinBig{ width:46px; height:46px; border-radius:50%; border:5px solid #e5e7eb; border-top-color:#10b981; animation: sp 1s linear infinite; }
          @keyframes sp{ to{ transform: rotate(360deg);} }
          .loaderText{ font-weight:950; color:#334155; }
        `}</style>
      </div>
    );
  }

  const companyName = profile?.companyId?.name || profile?.companyId?.companyName || "Company";
  const companyIdVal =
    profile?.companyId?._id ||
    profile?.companyId?.id ||
    (typeof profile?.companyId === "string" ? profile.companyId : "");
  const companyIdText = companyIdVal ? String(companyIdVal) : "";

  return (
    <div className="dashWrap">
      {/* TOP NAV */}
      <header className="topNav">
        <div className="navLeft">
          <button className="menuBtn" onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>
          <div className="brand">
            SMART<span>HRMS</span>
          </div>
        </div>

        <div className="navRight">
          <div className="dateBadge">
            <FaCalendarAlt />
            <span>{new Date().toLocaleDateString("en-GB")}</span>
          </div>

          <button
            className="miniBtn"
            onClick={() => fetchDashboardData(true)}
            type="button"
            title="Refresh"
            style={{ opacity: refreshing ? 0.7 : 1 }}
          >
            <FaRedoAlt /> {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button className="logoutBtn" onClick={logout} title="Logout">
            <FaSignOutAlt />
          </button>
        </div>
      </header>

      {/* MOBILE BACKDROP */}
      {sidebarOpen && <div className="backdrop" onClick={() => setSidebarOpen(false)} />}

      <div className="layout">
        {/* SIDEBAR */}
        <aside className={`side ${sidebarOpen ? "open" : ""}`}>
          <div className="sideInner">
            <div className="sideClose" onClick={() => setSidebarOpen(false)}>
              <FaTimes />
            </div>

            <div className="profileCard">
              <div className="statusDot" data-status={todayStatus}></div>

              <div className="avatarWrap">
                <img
                  src={getImageUrl(profile?.profileImage)}
                  alt="Profile"
                  onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/150")}
                />
              </div>

              <div className="userName">{profile?.name || user.name}</div>
              <div className="userRole">{profile?.designation || "Employee"}</div>

              <div className="meta">
                <div className="metaRow">
                  <FaBriefcase />
                  <span>
                    {companyName}
                    {companyIdText ? <span className="cid">ID: {companyIdText}</span> : null}
                  </span>
                </div>

                <div className="metaRow">
                  <FaMapMarkerAlt />
                  <span>{profile?.companyId?.location?.address || "Office location"}</span>
                </div>

                <div className="metaRow">
                  <FaEnvelope />
                  <span>{profile?.email || user.email}</span>
                </div>

                <div className="metaRow">
                  <FaCalendarAlt />
                  <span>Joined: {fmtDate(profile?.joiningDate, tz)}</span>
                </div>
              </div>

              <div className="punchArea">
                {todayStatus === "Not Started" ? (
                  <button className="btnPrimary pulse" onClick={() => handlePunchInit("in")}>
                    <FaPlay /> Start Shift
                  </button>
                ) : todayStatus === "Completed" ? (
                  <div className="doneChip">
                    <FaCheckCircle /> Shift Completed
                  </div>
                ) : (
                  <div className="dual">
                    <button className="btnGhost" onClick={() => navigate("/employee/attendance")}>
                      <FaCoffee /> Break
                    </button>
                    <button className="btnDanger" onClick={() => handlePunchInit("out")}>
                      <FaSignOutAlt /> End Day
                    </button>
                  </div>
                )}
              </div>

              <div className="quickLinks">
                <button onClick={() => navigate("/employee/attendance")}>
                  <FaHistory /> Attendance
                </button>
                <button onClick={() => navigate("/employee/leaves")}>
                  <FaPlaneDeparture /> Leaves
                </button>
                <button onClick={() => navigate("/employee/tasks")}>
                  <FaTasks /> My Tasks
                </button>
                <button onClick={() => navigate("/employee/onboarding")}>
                  <FaUserCheck /> Onboarding
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="main">
          <div className="hero">
            <div className="heroLeft">
              <div className="heroTitle">Welcome, {profile?.name || user.name} 👋</div>
              <div className="heroSub">
                Method: <b>{attendanceMethod}</b> • TZ: <b>{tz}</b> • Radius: <b>{radiusMeters}m</b>
              </div>
            </div>
            <div className="heroRight">
              <button className="heroBtn" onClick={() => navigate("/employee/leaves")}>
                <FaPlaneDeparture /> Apply Leave
              </button>
              <button className="heroBtn dark" onClick={() => navigate("/employee/onboarding")}>
                <FaUserCheck /> My Onboarding
              </button>
            </div>
          </div>

          <div className="statsGrid">
            <div className="statCard">
              <div className="statLabel">Present</div>
              <div className="statValue">{presentThisMonth}</div>
              <div className="statHint">This month</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Approved Leaves</div>
              <div className="statValue">{approvedLeavesCount}</div>
              <div className="statHint">All time</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Pending Tasks</div>
              <div className="statValue">{pendingTasksCount}</div>
              <div className="statHint">Need action</div>
            </div>
            <div className="statCard">
              <div className="statLabel">Onboarding</div>
              <div className="statValue">
                {onboardingSummary.assigned ? `${onboardingSummary.pending}/${onboardingSummary.total}` : "--"}
              </div>
              <div className="statHint">{onboardingSummary.assigned ? "Pending steps" : "Not assigned"}</div>
            </div>
          </div>

          <div className="tablesGrid">
            {/* Attendance */}
            <section className="panel">
              <div className="panelHead">
                <div className="panelTitle">
                  <FaClipboardList /> Attendance (Recent)
                </div>
                <button className="linkBtn" onClick={() => navigate("/employee/attendance")}>
                  View All
                </button>
              </div>

              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>In</th>
                      <th>Out</th>
                      <th>Net</th>
                      <th>Reports</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="empty">
                          No attendance records yet.
                        </td>
                      </tr>
                    ) : (
                      history.slice(0, 5).map((h) => {
                        const m = String(h?.mode || "").toLowerCase();
                        const displayStatus =
                          m.includes("wfh") ? "WFH" : m.includes("unpaid") ? "Unpaid" : m.includes("paid") ? "Paid" : h.status || "—";

                        const isManual = h.isManualEntry || h.source === 'MANUAL_HR';
                        const hasMorning = !!h.plannedTasks;
                        const hasDaily = !!h.dailyReport;

                        return (
                          <tr key={h._id || `${h.date}-${h.punchInTime}`}>
                            <td>
                              <div className="bold">{fmtDate(h.date, tz)}</div>
                              {isManual && (
                                <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0284c7', padding: '2px 6px', borderRadius: '4px', border: '1px solid #bae6fd', fontWeight: 800 }}>
                                  Marked by HR
                                </span>
                              )}
                            </td>
                            <td className="green">{fmtTime(h.punchInTime, tz)}</td>
                            <td className="red">{fmtTime(h.punchOutTime, tz)}</td>
                            <td>{h.netWorkHours || h.netHours || "--"}</td>
                            <td>
                              <div style={{ display: 'flex', gap: '6px', fontSize: '11px', fontWeight: 800 }}>
                                <span title={h.plannedTasks || "No Morning Plan"} style={{
                                  color: hasMorning ? '#16a34a' : '#94a3b8',
                                  background: hasMorning ? '#dcfce7' : '#f1f5f9',
                                  padding: '2px 6px', borderRadius: '4px'
                                }}>
                                  M: {hasMorning ? "✅" : "—"}
                                </span>
                                <span title={h.dailyReport || "No Daily Report"} style={{
                                  color: hasDaily ? '#2563eb' : '#94a3b8',
                                  background: hasDaily ? '#dbeafe' : '#f1f5f9',
                                  padding: '2px 6px', borderRadius: '4px'
                                }}>
                                  E: {hasDaily ? "✅" : "—"}
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`pill ${String(displayStatus || "").toLowerCase().replace(/\s/g, "-")}`}>
                                {displayStatus}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Leaves */}
            <section className="panel">
              <div className="panelHead">
                <div className="panelTitle">
                  <FaPlaneDeparture /> Leaves (Recent)
                </div>
                <button className="linkBtn" onClick={() => navigate("/employee/leaves")}>
                  Manage
                </button>
              </div>

              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="empty">
                          No leave requests yet.
                        </td>
                      </tr>
                    ) : (
                      leaves.slice(0, 5).map((l) => (
                        <tr key={l._id || `${l.startDate}-${l.endDate}`}>
                          <td className="bold">{normalizeLeaveType(l.leaveType) || "Leave"}</td>
                          <td>
                            {fmtDate(l.startDate, tz)} - {fmtDate(l.endDate, tz)}
                          </td>
                          <td>
                            <span className={`pill ${String(l.status || "").toLowerCase()}`}>
                              {l.status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Tasks */}
            <section className="panel panelWide">
              <div className="panelHead">
                <div className="panelTitle">
                  <FaTasks /> Tasks (My Work)
                </div>
                <button className="linkBtn" onClick={() => navigate("/employee/tasks")}>
                  Open Tasks
                </button>
              </div>

              <div className="hintBox">
                New joiner? ✅ First complete your <b>Onboarding</b> checklist from <b>My Onboarding</b>.
              </div>

              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Task</th>
                      <th>Due</th>
                      <th>Status</th>
                      <th style={{ width: 180 }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="empty">
                          No tasks assigned right now.
                        </td>
                      </tr>
                    ) : (
                      tasks.slice(0, 6).map((t) => {
                        const status = String(t.status || "Pending");
                        const s = status.toLowerCase();
                        return (
                          <tr key={t._id || t.id}>
                            <td>
                              <div className="taskCell">
                                <div className="bold">{t.title || "Untitled Task"}</div>
                                <div className="muted">{t.description || ""}</div>
                              </div>
                            </td>
                            <td>{t.deadline ? fmtDate(t.deadline, tz) : "--"}</td>
                            <td>
                              <span className={`pill ${s.replace(/\s/g, "-")}`}>{status}</span>
                            </td>
                            <td>
                              {s === "pending" ? (
                                <button className="miniBtn greenBtn" onClick={() => updateTaskStatus(t._id, "In Progress")}>
                                  Start
                                </button>
                              ) : s === "in progress" ? (
                                <button className="miniBtn blueBtn" onClick={() => navigate("/employee/tasks")}>
                                  Submit
                                </button>
                              ) : s === "completed" ? (
                                <span className="muted">Under Review</span>
                              ) : s === "verified" ? (
                                <span className="okText">Verified ✅</span>
                              ) : (
                                <span className="muted">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      {/* MODALS */}
      {showTextModal && (
        <div className="modalOverlay">
          <div className="modalCard">
            <div className="modalHead">
              <div className="modalTitle">{actionType === "in" ? "Morning Report" : "Daily Report"}</div>
              <button className="iconBtn" onClick={() => setShowTextModal(false)}>
                <FaTimes />
              </button>
            </div>

            <textarea
              className="modalText"
              placeholder={actionType === "in" ? "Today's plan / tasks..." : "Today's work summary..."}
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
            />

            <button className="btnPrimary" onClick={proceedToVerification}>
              Proceed <FaArrowRight />
            </button>
          </div>
        </div>
      )}

      {showPunchModal && (
        <div className="modalOverlay">
          <div className="modalCard wide">
            <div className="modalHead">
              <div className="modalTitle">Verification</div>
              <button className="iconBtn" onClick={() => setShowPunchModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="locStrip">
              <div className={`locPill ${officePos && distanceMeters != null && !isInsideRadius ? "bad" : "ok"}`}>
                <FaMapMarkerAlt />
                <span>
                  {officePos
                    ? `Distance: ${distanceLabel(distanceMeters)} (Limit: ${radiusMeters}m)`
                    : "Office location not configured (Admin must set office lat/lng)."}
                </span>
              </div>

              <div className="locMeta">
                <span>Accuracy: {gpsAccuracy != null ? `±${Math.round(gpsAccuracy)}m` : "--"}</span>
                <button className="miniBtn" onClick={fetchLocation} type="button">
                  <FaRedoAlt /> Refresh
                </button>
              </div>
            </div>

            <div className="verifyGrid">
              <div className="mapBox">
                <VerifyMap apiKey={GOOGLE_MAPS_API_KEY} currentPos={currentPos} officePos={officePos} circleOptions={circleOptions} />

                {isLocating && (
                  <div className="gpsOverlay">
                    <FaSpinner className="spin" /> Detecting Location…
                  </div>
                )}
              </div>

              <div className="faceBox">
                <div className={`faceWrap ${officePos && distanceMeters != null && !isInsideRadius ? "blocked" : ""}`}>
                  <FaceCapture onCapture={onFaceVerified} btnText="Verify & Punch" />
                  {officePos && distanceMeters != null && !isInsideRadius && (
                    <div className="blockOverlay">❌ You are outside office radius. Move closer and refresh location.</div>
                  )}
                </div>

                <div className="smallHint">Tip: Good light + face centered = fast verification ✅</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STYLES */}
      <style>{`
        :root{
          --bg:#f8fafc;
          --card:#ffffff;
          --text:#0f172a;
          --muted:#64748b;
          --border:#e2e8f0;
          --primary:#10b981;
          --primaryDark:#059669;
          --danger:#ef4444;
        }

        .dashWrap{ background:var(--bg); min-height:100vh; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:var(--text); }

        .topNav{
          position:sticky; top:0; z-index:60;
          background:rgba(255,255,255,0.92);
          backdrop-filter: blur(10px);
          border-bottom:1px solid var(--border);
          display:flex; align-items:center; justify-content:space-between;
          padding:14px 18px;
        }
        .navLeft{ display:flex; align-items:center; gap:12px; }
        .menuBtn{
          display:none;
          border:none; background:transparent; font-size:18px; cursor:pointer; color:var(--text);
        }
        .brand{ font-weight:950; font-size:18px; letter-spacing:-0.2px; }
        .brand span{ color:var(--primary); }
        .navRight{ display:flex; align-items:center; gap:10px; }
        .dateBadge{
          display:flex; align-items:center; gap:8px;
          padding:8px 12px;
          border-radius:999px;
          background:#ecfdf5;
          color:var(--primaryDark);
          font-weight:900;
          font-size:12px;
          border:1px solid #d1fae5;
        }
        .logoutBtn{
          width:38px; height:38px;
          display:grid; place-items:center;
          border:none; border-radius:12px;
          cursor:pointer;
          background:#fee2e2;
          color:var(--danger);
        }

        .backdrop{
          position:fixed; inset:0;
          background: rgba(15,23,42,0.35);
          z-index:70;
        }

        .layout{
          max-width: 1400px;
          margin: 0 auto;
          padding: 18px;
          display:grid;
          grid-template-columns: 320px 1fr;
          gap: 16px;
          align-items:start;
        }

        .side{ position:sticky; top:78px; z-index:80; }
        .sideInner{ }
        .sideClose{ display:none; }
        .profileCard{
          background:var(--card);
          border:1px solid var(--border);
          border-radius:18px;
          padding:18px;
          box-shadow: 0 10px 30px rgba(15,23,42,0.04);
          position:relative;
        }

        .avatarWrap{
          width:84px; height:84px;
          border-radius:999px;
          overflow:hidden;
          margin: 4px auto 10px;
          border: 2px dashed var(--primary);
          padding:4px;
          background:#fff;
        }
        .avatarWrap img{
          width:100%; height:100%;
          border-radius:999px;
          object-fit:cover;
          display:block;
        }

        .statusDot{
          width:12px; height:12px; border-radius:999px;
          position:absolute; top:16px; right:16px;
          background:#d1d5db;
          box-shadow: 0 0 0 4px rgba(209,213,219,0.25);
        }
        .statusDot[data-status="Working"]{ background:#10b981; box-shadow:0 0 0 4px rgba(16,185,129,0.18); }
        .statusDot[data-status="On Break"]{ background:#f59e0b; box-shadow:0 0 0 4px rgba(245,158,11,0.18); }
        .statusDot[data-status="Completed"]{ background:#2563eb; box-shadow:0 0 0 4px rgba(37,99,235,0.18); }

        .userName{ font-weight:950; font-size:18px; margin-top:6px; text-align:center; }
        .userRole{ color:var(--muted); font-weight:800; margin-top:3px; font-size:13px; text-align:center; }

        .meta{ margin-top:14px; border-top:1px dashed #eef2f7; padding-top:12px; display:grid; gap:10px; }
        .metaRow{ display:flex; gap:10px; align-items:flex-start; color:var(--muted); font-weight:800; font-size:13px; }
        .metaRow svg{ color:var(--primary); margin-top:2px; }

        .cid{
          display:block;
          margin-top:3px;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
          font-size:12px;
          color:#0f172a;
          font-weight:900;
          word-break: break-all;
        }

        .punchArea{ margin-top:14px; }
        .dual{ display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .doneChip{
          padding:10px 12px;
          border-radius:14px;
          border:1px solid #bbf7d0;
          background:#ecfdf5;
          color:#065f46;
          font-weight:950;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }

        .btnPrimary{
          width:100%;
          border:none;
          padding:12px 14px;
          border-radius:14px;
          background:var(--primary);
          color:white;
          font-weight:950;
          cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:10px;
          box-shadow: 0 14px 28px rgba(16,185,129,0.20);
          transition: .15s;
        }
        .btnPrimary:hover{ background:var(--primaryDark); transform: translateY(-1px); }

        .pulse{ animation:pulse 1.5s infinite; }
        @keyframes pulse{
          0%{ box-shadow:0 0 0 0 rgba(16,185,129,.35); }
          70%{ box-shadow:0 0 0 12px rgba(16,185,129,0); }
          100%{ box-shadow:0 0 0 0 rgba(16,185,129,0); }
        }

        .btnDanger{
          width:100%;
          border:none;
          padding:12px 14px;
          border-radius:14px;
          background:var(--danger);
          color:white;
          font-weight:950;
          cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:10px;
        }
        .btnGhost{
          width:100%;
          border:1px solid var(--border);
          padding:12px 14px;
          border-radius:14px;
          background:white;
          color:var(--text);
          font-weight:900;
          cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:10px;
        }

        .quickLinks{
          margin-top:14px;
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:10px;
        }
        .quickLinks button{
          border:1px solid var(--border);
          background:white;
          padding:10px 12px;
          border-radius:14px;
          font-weight:900;
          color:var(--muted);
          cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .quickLinks button:hover{ border-color:#cbd5e1; color:#0f172a; }

        .main{ display:flex; flex-direction:column; gap:14px; }
        .hero{
          background: linear-gradient(135deg, #ecfdf5 0%, #ffffff 65%);
          border:1px solid #d1fae5;
          border-radius:18px;
          padding:16px;
          display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;
        }
        .heroTitle{ font-weight:950; font-size:18px; }
        .heroSub{ margin-top:6px; color:var(--muted); font-weight:800; font-size:12px; }
        .heroRight{ display:flex; gap:10px; flex-wrap:wrap; align-items:center; }
        .heroBtn{
          border:none;
          padding:10px 12px;
          border-radius:14px;
          background:white;
          border:1px solid var(--border);
          font-weight:950;
          cursor:pointer;
          display:flex; align-items:center; gap:8px;
        }
        .heroBtn.dark{
          background:#0f172a;
          border-color:#0f172a;
          color:white;
        }

        .statsGrid{
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap:12px;
        }
        .statCard{
          background:var(--card);
          border:1px solid var(--border);
          border-radius:18px;
          padding:14px;
          box-shadow: 0 10px 20px rgba(15,23,42,0.03);
        }
        .statLabel{ color:var(--muted); font-weight:900; font-size:12px; text-transform:uppercase; letter-spacing:0.8px; }
        .statValue{ font-weight:950; font-size:28px; margin-top:6px; }
        .statHint{ color:var(--muted); font-weight:800; font-size:12px; margin-top:2px; }

        .tablesGrid{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:12px;
        }
        .panelWide{ grid-column: 1 / -1; }

        .panel{
          background:var(--card);
          border:1px solid var(--border);
          border-radius:18px;
          padding:14px;
          box-shadow: 0 10px 20px rgba(15,23,42,0.03);
          overflow:hidden;
        }
        .panelHead{
          display:flex; justify-content:space-between; align-items:center;
          gap:10px;
          margin-bottom:10px;
        }
        .panelTitle{
          font-weight:950;
          display:flex; align-items:center; gap:10px;
        }
        .linkBtn{
          border:none;
          background:#f1f5f9;
          color:#0f172a;
          font-weight:900;
          padding:8px 10px;
          border-radius:12px;
          cursor:pointer;
        }
        .hintBox{
          background:#f8fafc;
          border:1px dashed #e2e8f0;
          padding:10px 12px;
          border-radius:14px;
          margin-bottom:10px;
          font-weight:800;
          color:#334155;
          font-size:12px;
        }

        .tableWrap{ overflow:auto; }
        .table{
          width:100%;
          border-collapse:collapse;
          min-width: 560px;
        }
        .table thead th{
          text-align:left;
          padding:12px;
          font-size:11px;
          color:var(--muted);
          text-transform:uppercase;
          letter-spacing:0.8px;
          border-bottom:1px solid #f1f5f9;
        }
        .table tbody td{
          padding:12px;
          border-bottom:1px solid #f8fafc;
          font-weight:800;
          font-size:13px;
          color:#0f172a;
          vertical-align:top;
        }
        .table tbody tr:hover{ background:#fcfcfd; }
        .empty{ text-align:center; color:var(--muted) !important; font-weight:900; padding:18px !important; }

        .bold{ font-weight:950; }
        .muted{ color:var(--muted); font-weight:800; font-size:12px; margin-top:4px; }
        .green{ color:#16a34a; }
        .red{ color:#ef4444; }

        .pill{
          display:inline-flex;
          align-items:center;
          padding:6px 10px;
          border-radius:999px;
          font-size:11px;
          font-weight:950;
          border:1px solid var(--border);
          background:#f8fafc;
          text-transform:capitalize;
        }
        .pill.present, .pill.approved, .pill.verified{
          background:#ecfdf5;
          border-color:#bbf7d0;
          color:#065f46;
        }
        .pill.pending, .pill.in-progress{
          background:#fffbeb;
          border-color:#fde68a;
          color:#92400e;
        }
        .pill.rejected, .pill.absent, .pill.unpaid{
          background:#fee2e2;
          border-color:#fecaca;
          color:#991b1b;
        }
        .pill.wfh{
          background:#eef2ff;
          border-color:#c7d2fe;
          color:#3730a3;
        }
        .pill.paid{
          background:#ecfdf5;
          border-color:#bbf7d0;
          color:#065f46;
        }

        .taskCell{ display:flex; flex-direction:column; gap:2px; }

        .miniBtn{
          border:1px solid var(--border);
          background:#fff;
          padding:8px 10px;
          border-radius:12px;
          font-weight:950;
          cursor:pointer;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          gap:8px;
        }
        .greenBtn{ background:#ecfdf5; border-color:#bbf7d0; color:#065f46; }
        .blueBtn{ background:#eff6ff; border-color:#bfdbfe; color:#1d4ed8; }
        .okText{ font-weight:950; color:#065f46; }

        .modalOverlay{
          position:fixed; inset:0;
          background:rgba(15,23,42,.45);
          display:flex; align-items:center; justify-content:center;
          z-index:1000;
          padding:16px;
        }
        .modalCard{
          width:100%;
          max-width:540px;
          background:#fff;
          border:1px solid var(--border);
          border-radius:18px;
          box-shadow: 0 30px 80px rgba(0,0,0,.18);
          padding:14px;
        }
        .modalCard.wide{ max-width:1100px; }
        .modalHead{
          display:flex; justify-content:space-between; align-items:center;
          gap:10px; margin-bottom:10px;
        }
        .modalTitle{ font-weight:1000; }
        .iconBtn{
          width:38px; height:38px;
          border-radius:12px;
          border:1px solid var(--border);
          background:#fff;
          cursor:pointer;
          display:grid; place-items:center;
        }
        .modalText{
          width:100%;
          min-height:120px;
          border:1px solid var(--border);
          border-radius:14px;
          padding:12px;
          outline:none;
          font-weight:800;
          color:#0f172a;
          margin-bottom:12px;
        }

        .locStrip{ display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap; margin-bottom:12px; }
        .locPill{
          flex:1;
          display:flex; align-items:center; gap:10px;
          border-radius:14px;
          padding:10px 12px;
          border:1px solid var(--border);
          background:#f8fafc;
          font-weight:900;
          color:#334155;
          min-width:260px;
        }
        .locPill.ok{ background:#ecfdf5; border-color:#bbf7d0; color:#065f46; }
        .locPill.bad{ background:#fee2e2; border-color:#fecaca; color:#991b1b; }
        .locMeta{ display:flex; gap:10px; align-items:center; color:var(--muted); font-weight:900; }

        .verifyGrid{
          display:grid;
          grid-template-columns: 1.4fr 1fr;
          gap:12px;
          align-items:start;
        }
        .mapBox{
          position:relative;
          border:1px solid var(--border);
          border-radius:16px;
          overflow:hidden;
          min-height:260px;
          background:#fff;
        }
        .mapFallback{
          height:260px;
          display:grid;
          place-items:center;
          color:var(--muted);
          font-weight:900;
        }
        .gpsOverlay{
          position:absolute; inset:0;
          display:flex; align-items:center; justify-content:center;
          gap:10px;
          font-weight:1000;
          color:#0f172a;
          background:rgba(255,255,255,.6);
          backdrop-filter: blur(6px);
        }
        .spin{ animation:spin 1s linear infinite; }
        @keyframes spin{ to{ transform:rotate(360deg);} }

        .warnBox{
          padding:12px;
          background:#fffbeb;
          border:1px solid #fde68a;
          color:#92400e;
          font-weight:900;
          border-radius:14px;
          margin:10px;
        }

        .faceWrap{ position:relative; border:1px solid var(--border); border-radius:16px; padding:10px; background:#fff; }
        .blockOverlay{
          position:absolute; inset:0;
          display:flex; align-items:center; justify-content:center;
          text-align:center;
          padding:14px;
          background:rgba(15,23,42,.65);
          color:#fff;
          font-weight:1000;
          border-radius:16px;
        }
        .smallHint{ margin-top:10px; color:var(--muted); font-weight:800; font-size:12px; }

        @media (max-width: 1024px){
          .layout{ grid-template-columns: 1fr; }
          .side{ position:fixed; top:0; left:0; height:100vh; width:320px; transform:translateX(-110%); transition:.2s; background:transparent; z-index:90; }
          .side.open{ transform:translateX(0); }
          .sideInner{ height:100%; padding:18px; background:var(--bg); }
          .sideClose{ display:flex; width:40px; height:40px; border-radius:12px; border:1px solid var(--border); background:#fff; align-items:center; justify-content:center; margin-bottom:10px; cursor:pointer; }
          .menuBtn{ display:inline-flex; }
          .statsGrid{ grid-template-columns: repeat(2, minmax(0,1fr)); }
          .tablesGrid{ grid-template-columns: 1fr; }
          .verifyGrid{ grid-template-columns: 1fr; }
          .table{ min-width: 520px; }
        }
        @media (max-width: 560px){
          .statsGrid{ grid-template-columns: 1fr; }
          .table{ min-width: 520px; }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDashboard;

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import { getAssetUrl } from "../../utils/assetUrl";
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
  FaArrowsAlt,
  FaArrowRight,
  FaRedoAlt,
  FaTasks,
  FaPlaneDeparture,
  FaHistory,
  FaClipboardList,
  FaUserCheck,
  FaCheckCircle,
  FaSpinner,
  FaCamera,
} from "react-icons/fa";
import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api";
import worknaiLogo from "../../assets/worknai logo.png";

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
const mapContainerStyle = { width: "100%", height: "300px", borderRadius: "20px" };

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
const getImageUrl = (imgPath, name = "") => {
  if (!imgPath) {
    const fn = (name || "User").replace(/\s+/g, "+");
    return `https://ui-avatars.com/api/?name=${fn}&background=50c8ff&color=03050c&bold=true&size=128`;
  }

  let finalPath = imgPath;
  if (typeof imgPath === "object") {
    finalPath = imgPath.url || imgPath.secure_url || imgPath.filepath || imgPath.path || "";
  }

  const assetUrl = getAssetUrl(finalPath);

  // Debug final generated URL in dev
  if (process.env.NODE_ENV === "development" && assetUrl) {
    if (!assetUrl.includes("ui-avatars")) {
      console.log("Final Avatar URL:", assetUrl);
    }
  }

  if (assetUrl) return assetUrl;

  const fn = (name || "User").replace(/\s+/g, "+");
  return `https://ui-avatars.com/api/?name=${fn}&background=50c8ff&color=03050c&bold=true&size=128`;
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

  // 🕵️ Comprehensive Case-Insensitive Deep Scan
  const getF = (obj, keys = []) => {
    if (!obj) return null;
    for (const k of keys) {
      if (obj[k]) return obj[k];
      // Case insensitive check
      const lowK = k.toLowerCase();
      const actualK = Object.keys(obj).find((x) => x.toLowerCase() === lowK);
      if (actualK && obj[actualK]) return obj[actualK];
    }
    return null;
  };

  const rawImage =
    getF(u, ["profileImage", "profile_image", "profilePicture", "avatar", "photo", "image", "img", "userImage", "url"]) ||
    getF(u.employeeId, ["profileImage", "avatar", "photo", "image", "url"]) ||
    getF(u.userId, ["profileImage", "avatar", "photo", "image", "url"]) ||
    getF(u.employeeDetails, ["profileImage", "avatar", "photo", "image", "url"]) ||
    getF(u.employmentDetails, ["profileImage", "avatar", "photo", "image", "url"]) ||
    getF(u.personalDetails, ["profileImage", "avatar", "photo", "image", "url"]) ||
    getF(u.profile, ["image", "avatar", "profileImage", "url"]) ||
    getF(u.details, ["profileImage", "image", "avatar", "url"]) ||
    u.employeeId?.userId?.profileImage ||
    u.userId?.employeeId?.profileImage ||
    "";

  // Debug log for developer
  if (process.env.NODE_ENV === "development") {
    if (!rawImage && u._id) {
      console.warn("Profile Image missing for user:", u.name || u._id, u);
    } else if (rawImage) {
      console.log("Profile Image found:", rawImage);
    }
  }

  const rawName =
    getF(u, ["name", "fullName", "username", "displayName"]) ||
    getF(u.employeeId, ["name", "fullName"]) ||
    getF(u.userId, ["name", "fullName"]) ||
    "Employee";

  const rawDesig =
    getF(u, ["designation", "roleTitle", "role", "jobTitle", "title"]) ||
    getF(u.employeeId, ["designation"]) ||
    getF(u.employeeDetails, ["designation"]) ||
    "Employee";

  return {
    ...u,
    name: rawName,
    designation: rawDesig,
    profileImage: rawImage,
    joiningDate: resolveJoiningDate(u),
    basicSalary: u.basicSalary ?? u.salary ?? 0,
    employmentType: u.employmentType || "On-Roll",
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
  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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

  // ✅ Prevent Background Scroll when Sidebar is open (Mobile)
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [sidebarOpen]);

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
          .loaderScreen { min-height: 100vh; display: grid; place-items: center; gap: 10px; background: #03050c; }
          .spinBig { 
            width: 48px; height: 48px; border-radius: 50%; 
            border: 3px solid rgba(80, 200, 255, 0.1); 
            border-top-color: #50c8ff; 
            animation: sp 1s cubic-bezier(0.4, 0, 0.2, 1) infinite; 
          }
          @keyframes sp { to { transform: rotate(360deg); } }
          .loaderText { font-weight: 800; color: #50c8ff; letter-spacing: 1px; }
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

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append("profileImage", file);

      const res = await API.patch("/employee/profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success(res.data?.message || "Profile image updated");
      
      // Force refresh meProfile so all child components see new image
      if (res.data?.profileImage) {
        setMeProfile(prev => ({ ...prev, profileImage: res.data.profileImage }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      // clean up
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div className="dashWrap">
      {/* TOP NAV */}
      <header className="topNav">
        <div className="navLeft">
          <button className="menuBtn" onClick={() => setSidebarOpen(true)}>
            <FaBars />
          </button>
          <div className="brand">
            <img src={worknaiLogo} alt="WorknAi" />
            WorknAi <span>HRMS</span>
          </div>
        </div>

        <div className="navRight">
          <div className="dateBadge desktop-only">
            <FaCalendarAlt />
            <span>{new Date().toLocaleDateString("en-GB")}</span>
          </div>

          <button
            className="refreshBtn"
            onClick={() => fetchDashboardData(true)}
            type="button"
            title="Refresh"
            style={{ opacity: refreshing ? 0.7 : 1 }}
          >
            <FaRedoAlt className={refreshing ? "fa-spin" : ""} />
            <span className="desktop-only">{refreshing ? "Refreshing…" : "Refresh"}</span>
          </button>

          <button className="logoutBtn" onClick={() => logout("/")} title="Logout">
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

            <div className={`profileCard ${uploadingImage ? 'loading-img' : ''}`}>
              <div className="statusDot" data-status={todayStatus}></div>

              <div className="avatarWrap" onClick={handleAvatarClick} title="Change Profile Image">
                {uploadingImage && (
                  <div className="img-overlay">
                    <FaSpinner className="spin" />
                  </div>
                )}
                <img
                  src={getImageUrl(profile?.profileImage, profile?.name || user.name)}
                  alt="Profile"
                />
                <div className="edit-hint">
                  <FaCamera />
                </div>
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                accept="image/*"
                onChange={handleFileChange}
              />

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
            <div className="statCard">
              <div className="statLabel">{profile.employmentType === "Intern" ? "Stipend" : "Basic Salary"}</div>
              <div className="statValue">
                {profile.employmentType === "Intern" && profile.basicSalary === 0 
                  ? "Unpaid" 
                  : `₹${Number(profile.basicSalary || 0).toLocaleString()}`}
              </div>
              <div className="statHint">{profile.employmentType === "Intern" ? "Fixed Monthly" : "Current Package"}</div>
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
                <table className="table desktop-only">
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
                        <td colSpan={6} className="empty"> No attendance records yet. </td>
                      </tr>
                    ) : (
                      history.slice(0, 5).map((h) => {
                        const m = String(h?.mode || "").toLowerCase();
                        const displayStatus = m.includes("wfh") ? "WFH" : m.includes("unpaid") ? "Unpaid" : m.includes("paid") ? "Paid" : h.status || "—";
                        const isManual = h.isManualEntry || h.source === 'MANUAL_HR';
                        const hasMorning = !!h.plannedTasks;
                        const hasDaily = !!h.dailyReport;

                        return (
                          <tr key={h._id || `${h.date}-${h.punchInTime}`}>
                            <td>
                              <div className="bold">{fmtDate(h.date, tz)}</div>
                              {isManual && <span className="hrLabel">Marked by HR</span>}
                            </td>
                            <td className="green">{fmtTime(h.punchInTime, tz)}</td>
                            <td className="red">{fmtTime(h.punchOutTime, tz)}</td>
                            <td>{h.netWorkHours || h.netHours || "--"}</td>
                            <td>
                              <div className="reportPillGroup">
                                <span title={h.plannedTasks || "No Morning Plan"} className={`reportPill ${hasMorning ? 'ok' : 'none'}`}>M: {hasMorning ? "✅" : "—"}</span>
                                <span title={h.dailyReport || "No Daily Report"} className={`reportPill ${hasDaily ? 'blue' : 'none'}`}>E: {hasDaily ? "✅" : "—"}</span>
                              </div>
                            </td>
                            <td><span className={`pill ${String(displayStatus || "").toLowerCase().replace(/\s/g, "-")}`}>{displayStatus}</span></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="mobile-cards">
                  {history.length === 0 ? (
                    <div className="empty">No attendance records yet.</div>
                  ) : (
                    history.slice(0, 5).map((h) => {
                      const m = String(h?.mode || "").toLowerCase();
                      const displayStatus = m.includes("wfh") ? "WFH" : m.includes("unpaid") ? "Unpaid" : m.includes("paid") ? "Paid" : h.status || "—";
                      const isManual = h.isManualEntry || h.source === 'MANUAL_HR';
                      const hasMorning = !!h.plannedTasks;
                      const hasDaily = !!h.dailyReport;

                      return (
                        <div key={h._id || `${h.date}-${h.punchInTime}`} className="m-card">
                          <div className="m-card-top">
                            <span className="bold">{fmtDate(h.date, tz)}</span>
                            <span className={`pill ${String(displayStatus || "").toLowerCase().replace(/\s/g, "-")}`}>{displayStatus}</span>
                          </div>
                          <div className="m-card-body">
                            <div className="m-item">
                              <label>Time:</label>
                              <div className="valGroup">
                                <span className="green">{fmtTime(h.punchInTime, tz)}</span>
                                <span className="sep">-</span>
                                <span className="red">{fmtTime(h.punchOutTime, tz)}</span>
                              </div>
                            </div>
                            <div className="m-item">
                              <label>Net Hours:</label>
                              <span className="bold text-primary">{h.netWorkHours || h.netHours || "--"}</span>
                            </div>
                            <div className="m-item">
                              <label>Reports:</label>
                              <div className="reportPillGroup">
                                <span className={`reportPill ${hasMorning ? 'ok' : 'none'}`}>M: {hasMorning ? "✅" : "—"}</span>
                                <span className={`reportPill ${hasDaily ? 'blue' : 'none'}`}>E: {hasDaily ? "✅" : "—"}</span>
                              </div>
                            </div>
                            {isManual && <div className="m-item mt-2"><span className="hrLabel">Marked by HR</span></div>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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
                <table className="table desktop-only">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaves.length === 0 ? (
                      <tr><td colSpan={3} className="empty">No leave requests yet.</td></tr>
                    ) : (
                      leaves.slice(0, 5).map((l) => (
                        <tr key={l._id || `${l.startDate}-${l.endDate}`}>
                          <td className="bold">{normalizeLeaveType(l.leaveType) || "Leave"}</td>
                          <td>{fmtDate(l.startDate, tz)} - {fmtDate(l.endDate, tz)}</td>
                          <td><span className={`pill ${String(l.status || "").toLowerCase()}`}>{l.status || "Pending"}</span></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Mobile Card View */}
                <div className="mobile-cards">
                  {leaves.length === 0 ? (
                    <div className="empty">No leave requests yet.</div>
                  ) : (
                    leaves.slice(0, 5).map((l) => (
                      <div key={l._id || `${l.startDate}-${l.endDate}`} className="m-card">
                        <div className="m-card-top">
                          <span className="bold">{normalizeLeaveType(l.leaveType) || "Leave"}</span>
                          <span className={`pill ${String(l.status || "").toLowerCase()}`}>{l.status || "Pending"}</span>
                        </div>
                        <div className="m-card-body">
                          <div className="m-item"><label>Duration:</label> <span>{fmtDate(l.startDate, tz)} - {fmtDate(l.endDate, tz)}</span></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
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


      <style>{`
        :root {
          --bg: #03050c; /* Deeper dark background */
          --card: rgba(13, 18, 40, 0.65);
          --text: #ffffff;
          --muted: rgba(255, 255, 255, 0.6);
          --border: rgba(80, 200, 255, 0.12);
          --primary: #50c8ff;
          --primary-glow: rgba(80, 200, 255, 0.4);
          --accent-violet: #a78bfa;
          --accent-pink: #e879f9;
          --danger: #ef4444;
          --glass-bg: rgba(255, 255, 255, 0.03);
          --grad-tri: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          --grad-btn: linear-gradient(135deg, #3b82f6, #8b5cf6);
        }

        .dashWrap { 
          background: var(--bg); 
          min-height: 100vh; 
          width: 100%;
          overflow-x: hidden; /* Prevent horizontal scroll gaps */
          font-family: 'Plus Jakarta Sans', Inter, sans-serif; 
          color: var(--text);
          background-image: 
            radial-gradient(circle at 10% 20%, rgba(80, 200, 255, 0.05) 0%, transparent 40%),
            radial-gradient(circle at 90% 80%, rgba(167, 139, 250, 0.05) 0%, transparent 40%);
        }

         .topNav {
          position: sticky;
          top: 0;
          z-index: 1001; /* Above almost everything */
          background: rgba(5, 7, 20, 0.85);
          backdrop-filter: blur(25px);
          -webkit-backdrop-filter: blur(25px);
          border-bottom: 1px solid var(--border);
          display: flex; 
          align-items: center; 
          justify-content: space-between;
          padding: 10px 20px;
          height: 64px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
          overflow: hidden; /* Prevent nav contents from pushing out */
        }
        .navLeft { display: flex; align-items: center; gap: 12px; }
        .menuBtn {
          display: none;
          border: 1px solid var(--border);
          background: rgba(255,255,255,0.05); 
          width: 42px; 
          height: 42px; 
          border-radius: 12px;
          font-size: 20px; 
          cursor: pointer; 
          color: #fff;
          align-items: center; justify-content: center;
          transition: 0.3s;
        }
        .menuBtn:hover { background: rgba(80, 200, 255, 0.1); border-color: var(--primary); }
        
        .brand { 
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 900; 
          font-size: 1.3rem; 
          letter-spacing: -0.5px;
          background: linear-gradient(90deg, #50c8ff, #a78bfa, #e879f9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand img { 
          width: 32px; 
          height: 32px; 
          object-fit: contain; 
          filter: drop-shadow(0 0 8px rgba(80, 200, 255, 0.3));
        }
        .brand span {
          background: linear-gradient(90deg, #a78bfa, #e879f9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .navRight { display: flex; align-items: center; gap: 10px; }
        .dateBadge {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 14px;
          border-radius: 50px;
          background: rgba(80, 200, 255, 0.08);
          color: var(--primary);
          font-weight: 700;
          font-size: 0.8rem;
          border: 1px solid rgba(80, 200, 255, 0.2);
        }
        .refreshBtn {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          padding: 8px 14px;
          border-radius: 12px;
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          display: flex; align-items: center; gap: 8px;
          cursor: pointer;
          transition: 0.3s;
        }
        .refreshBtn:hover { background: rgba(80, 200, 255, 0.1); border-color: var(--primary); }
        .logoutBtn {
          width: 42px; height: 42px;
          display: grid; place-items: center;
          border: 1px solid rgba(239, 68, 68, 0.25); 
          border-radius: 12px;
          cursor: pointer;
          background: rgba(239, 68, 68, 0.08);
          color: #f87171;
          transition: 0.3s;
        }
        .logoutBtn:hover {
          background: #ef4444;
          color: #fff;
          border-color: #ef4444;
          transform: translateY(-2px);
        }

        .backdrop {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          z-index: 1999; /* Below side but above topNav */
        }

        .layout {
          max-width: 1440px;
          margin: 0 auto;
          padding: 20px;
          padding-bottom: 100px; /* Force extra space at very bottom */
          display: grid;
          grid-template-columns: 310px 1fr;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 1150px) {
          .layout { grid-template-columns: 1fr; padding: 15px; }
        }

        .side { position: sticky; top: 84px; z-index: 80; height: calc(100vh - 100px); }
        .sideInner { height: 100%; overflow-y: auto; padding-bottom: 80px; padding-right: 8px; scrollbar-width: thin; }
        .sideInner::-webkit-scrollbar { width: 5px; }
        .sideInner::-webkit-scrollbar-track { background: transparent; }
        .sideInner::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
        
        .profileCard {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 24px;
          padding-bottom: 32px; /* Extra room at bottom */
          backdrop-filter: blur(12px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          position: relative;
        }

        .avatarWrap {
          width: 100px; height: 100px;
          border-radius: 50%;
          overflow: hidden;
          margin: 0 auto 16px;
          border: 4px solid rgba(80, 200, 255, 0.2);
          padding: 3px;
          background: rgba(255, 255, 255, 0.08); /* improved backdrop */
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.5);
          display: flex; align-items: center; justify-content: center;
        }
        .avatarWrap img {
          width: 100%; height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
          transition: 0.3s;
        }

        .avatarWrap {
          cursor: pointer;
          position: relative;
        }

        .avatarWrap:hover img {
           filter: brightness(0.6);
        }

        .edit-hint {
          position: absolute;
          inset: 0;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem;
          color: #fff;
          opacity: 0;
          transition: 0.3s;
          pointer-events: none;
        }

        .avatarWrap:hover .edit-hint {
          opacity: 1;
        }

        .img-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.6);
          display: grid; place-items: center;
          z-index: 5;
          border-radius: 50%;
        }

        .loading-img {
          pointer-events: none;
          opacity: 0.8;
        }

        .statusDot {
          width: 14px; height: 14px; border-radius: 50%;
          position: absolute; top: 24px; right: 24px;
          background: #64748b;
          border: 3px solid #050714;
        }
        .statusDot[data-status="Working"] { background: #10b981; box-shadow: 0 0 15px rgba(16, 185, 129, 0.5); }
        .statusDot[data-status="On Break"] { background: #f59e0b; box-shadow: 0 0 15px rgba(245, 158, 11, 0.5); }
        .statusDot[data-status="Completed"] { background: #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }

        .userName { font-weight: 800; font-size: 1.25rem; text-align: center; color: #fff; }
        .userRole { color: var(--primary); font-weight: 700; margin-top: 4px; font-size: 0.9rem; text-align: center; opacity: 0.9; }

        .meta { margin-top: 20px; border-top: 1px solid var(--border); padding-top: 20px; display: grid; gap: 12px; }
        .metaRow { display: flex; gap: 12px; align-items: center; color: var(--muted); font-weight: 600; font-size: 0.85rem; }
        .metaRow svg { color: var(--primary); font-size: 1rem; flex-shrink: 0; }

        .cid {
          display: block;
          margin-top: 4px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
          color: var(--primary);
          opacity: 0.8;
        }

        .punchArea { margin-top: 24px; }
        .dual { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .doneChip {
          padding: 12px;
          border-radius: 16px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          font-weight: 800;
          display: flex; align-items: center; justify-content: center; gap: 10px;
        }

        .btnPrimary {
          width: 100%;
          border: none;
          padding: 14px;
          border-radius: 16px;
          background: var(--grad-btn);
          color: white;
          font-weight: 800;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 10px 20px -5px rgba(59, 130, 246, 0.5);
          transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btnPrimary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px -5px rgba(59, 130, 246, 0.6); }

        .pulse { animation: pulseAnim 2s infinite; }
        @keyframes pulseAnim {
          0% { box-shadow: 0 0 0 0 rgba(80, 200, 255, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(80, 200, 255, 0); }
          100% { box-shadow: 0 0 0 0 rgba(80, 200, 255, 0); }
        }

        .btnDanger {
          width: 100%;
          border: none;
          padding: 14px;
          border-radius: 16px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
          font-weight: 800;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: 0.3s;
        }
        .btnDanger:hover { background: #ef4444; color: #fff; border-color: #ef4444; }

        .btnGhost {
          width: 100%;
          border: 1px solid var(--border);
          padding: 14px;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          transition: 0.3s;
        }
        .btnGhost:hover { background: rgba(255, 255, 255, 0.1); border-color: var(--primary); }

        .quickLinks {
          margin-top: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .quickLinks button {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          padding: 12px;
          border-radius: 14px;
          font-weight: 700;
          color: var(--muted);
          cursor: pointer;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
          transition: 0.3s;
          font-size: 0.75rem;
        }
        .quickLinks button:hover { 
          background: rgba(80, 200, 255, 0.08); 
          color: var(--primary); 
          border-color: var(--primary);
          transform: translateY(-2px);
        }

        .main { display: flex; flex-direction: column; gap: 16px; }
        .hero {
          background: linear-gradient(135deg, rgba(80, 200, 255, 0.1) 0%, rgba(167, 139, 250, 0.05) 100%);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 16px 20px;
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          gap: 16px; 
          flex-wrap: wrap;
          backdrop-filter: blur(10px);
          min-height: auto;
        }
        .heroLeft { flex: 1; min-width: 200px; }
        .heroTitle { font-weight: 900; font-size: 1.25rem; color: #fff; line-height: 1.2; letter-spacing: -0.5px; }
        .heroSub { margin-top: 4px; color: var(--muted); font-weight: 600; font-size: 0.75rem; }
        .heroSub b { color: var(--primary); }
        .heroRight { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .heroBtn {
          border: none;
          padding: 12px 20px;
          border-radius: 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          color: #fff;
          font-weight: 700;
          cursor: pointer;
          display: flex; align-items: center; gap: 10px;
          transition: 0.3s;
        }
        .heroBtn:hover { background: rgba(80, 200, 255, 0.1); border-color: var(--primary); }
        .heroBtn.dark {
          background: var(--grad-btn);
          border: none;
          box-shadow: 0 8px 16px rgba(59, 130, 246, 0.3);
        }

        .statsGrid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }
        .statCard {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 20px;
          backdrop-filter: blur(10px);
          transition: 0.3s;
        }
        .statCard:hover { transform: translateY(-5px); border-color: var(--primary); }
        .statLabel { color: var(--muted); font-weight: 800; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; }
        .statValue { font-weight: 950; font-size: 2rem; margin-top: 8px; color: #fff; }
        .statHint { color: var(--primary); font-weight: 700; font-size: 0.8rem; margin-top: 4px; opacity: 0.8; }

        .tablesGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .panelWide { grid-column: 1 / -1; }

        .panel {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 24px;
          padding: 20px;
          backdrop-filter: blur(10px);
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
        }
        .panelHead {
          display: flex; justify-content: space-between; align-items: center;
          gap: 12px;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--border);
        }
        .panelTitle {
          font-weight: 800;
          font-size: 1.1rem;
          display: flex; align-items: center; gap: 12px;
          color: #fff;
        }
        .panelTitle svg { color: var(--primary); }
        .linkBtn {
          border: none;
          background: rgba(255, 255, 255, 0.05);
          color: var(--primary);
          font-weight: 700;
          padding: 8px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: 0.3s;
        }
        .linkBtn:hover { background: rgba(80, 200, 255, 0.1); }

        .hintBox {
          background: rgba(80, 200, 255, 0.05);
          border: 1px dashed rgba(80, 200, 255, 0.2);
          padding: 12px 16px;
          border-radius: 16px;
          margin-bottom: 16px;
          font-weight: 600;
          color: #cbd5e1;
          font-size: 0.85rem;
        }
        .hintBox b { color: var(--primary); }

        .tableWrap { overflow: auto; }
        .mobile-cards { display: none; }
        .table {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }
        .table thead th {
          text-align: left;
          padding: 12px 16px;
          font-size: 0.75rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid var(--border);
        }
        .table tbody td {
          padding: 16px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          font-weight: 600;
          font-size: 0.9rem;
          color: #e2e8f0;
          vertical-align: middle;
        }
        .table tbody tr:hover { background: rgba(255, 255, 255, 0.02); }
        .empty { text-align: center; color: var(--muted) !important; font-weight: 800; padding: 32px !important; }

        .bold { font-weight: 800; color: #fff; }
        .muted { color: var(--muted); font-weight: 600; font-size: 0.8rem; margin-top: 4px; }
        .green { color: #10b981; }
        .red { color: #ef4444; }

        .pill {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          border-radius: 50px;
          font-size: 0.75rem;
          font-weight: 800;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.05);
          text-transform: capitalize;
        }
        .pill.present, .pill.approved, .pill.verified {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.3);
          color: #10b981;
        }
        .pill.pending, .pill.in-progress {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.3);
          color: #f59e0b;
        }
        .pill.rejected, .pill.absent, .pill.unpaid {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }
        .pill.wfh {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.3);
          color: #818cf8;
        }

        .taskCell { display: flex; flex-direction: column; gap: 4px; }

        .miniBtn {
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.05);
          padding: 8px 12px;
          border-radius: 12px;
          font-weight: 800;
          color: #fff;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: 0.3s;
          font-size: 0.8rem;
        }
        .miniBtn:hover { border-color: var(--primary); background: rgba(80, 200, 255, 0.1); }
        .greenBtn { color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
        .blueBtn { color: #3b82f6; border-color: rgba(59, 130, 246, 0.3); }
        .okText { font-weight: 800; color: #10b981; }

        .modalOverlay {
          position: fixed; inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 1000;
          padding: 24px;
        }
        .modalCard {
          width: 100%;
          max-width: 540px;
          background: #0a0f1e;
          border: 1px solid var(--border);
          border-radius: 28px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
          padding: 24px;
        }
        .modalCard.wide { max-width: 1100px; }
        .modalHead {
          display: flex; justify-content: space-between; align-items: center;
          gap: 12px; margin-bottom: 24px;
        }
        .modalTitle { font-weight: 900; font-size: 1.25rem; color: #fff; }
        .iconBtn {
          width: 40px; height: 40px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.05);
          color: #fff;
          cursor: pointer;
          display: grid; place-items: center;
          transition: 0.3s;
        }
        .iconBtn:hover { background: rgba(255, 255, 255, 0.15); }
        
        .modalText {
          width: 100%;
          min-height: 140px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 16px;
          outline: none;
          font-weight: 600;
          color: #fff;
          font-size: 1rem;
          margin-bottom: 20px;
          resize: none;
        }
        .modalText:focus { border-color: var(--primary); box-shadow: 0 0 0 2px rgba(80, 200, 255, 0.2); }

        .locStrip { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .locPill {
          flex: 1;
          display: flex; align-items: center; gap: 12px;
          border-radius: 16px;
          padding: 12px 16px;
          border: 1px solid var(--border);
          background: rgba(255, 255, 255, 0.03);
          font-weight: 700;
          color: #fff;
          min-width: 280px;
        }
        .locPill.ok { background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.3); color: #10b981; }
        .locPill.bad { background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: #f87171; }
        .locMeta { display: flex; gap: 16px; align-items: center; color: var(--muted); font-weight: 700; }

        .verifyGrid {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          gap: 20px;
          align-items: start;
        }
        .mapBox {
          position: relative;
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          min-height: 300px;
          background: #000;
        }
        .mapFallback {
          height: 300px;
          display: grid;
          place-items: center;
          color: var(--muted);
          font-weight: 800;
          background: rgba(255,255,255,0.02);
        }
        .gpsOverlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          gap: 12px;
          font-weight: 800;
          color: #fff;
          background: rgba(5, 7, 20, 0.7);
          backdrop-filter: blur(8px);
        }
        
        .faceWrap { 
          position: relative; 
          border: 1px solid var(--border); 
          border-radius: 20px; 
          padding: 12px; 
          background: rgba(255, 255, 255, 0.02); 
        }
        .faceWrap.blocked { opacity: 0.5; }
        .blockOverlay {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          text-align: center;
          padding: 24px;
          background: rgba(0, 0, 0, 0.8);
          color: #fff;
          font-weight: 800;
          border-radius: 20px;
          z-index: 10;
        }

        @media (max-width: 1150px) {
          .layout { grid-template-columns: 1fr; padding: 12px; }
          .side {
            position: fixed; top: 0; left: 0; bottom: 0;
            width: 300px; z-index: 2000;
            transform: translateX(-105%);
            transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            height: 100vh;
            background: #050714;
          }
          .side.open { transform: translateX(0); box-shadow: 20px 0 50px rgba(0,0,0,0.8); }
          .sideInner { 
            height: 100%; 
            padding: 12px; 
            overflow-y: auto; 
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding-bottom: 150px; /* Huge space to ensure nothing is hidden */
          }
          .sideClose { display: flex; width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--border); background: rgba(255,255,255,0.05); align-items: center; justify-content: center; margin-bottom: 5px; cursor: pointer; color: #fff; flex-shrink: 0; }
          .menuBtn { display: flex; }
          .statsGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
          .statCard { padding: 14px; }
          .statValue { font-size: 1.4rem; }
          .tablesGrid { grid-template-columns: 1fr; gap: 12px; }
          
          .profileCard { padding: 12px; border-radius: 18px; margin-bottom: 10px; }
          .avatarWrap { width: 60px; height: 60px; margin-bottom: 8px; border-width: 2px; }
          .userName { font-size: 1rem; }
          .userRole { font-size: 0.75rem; margin-top: 2px; }
          .meta { margin-top: 10px; padding-top: 10px; gap: 4px; }
          .metaRow { font-size: 0.7rem; gap: 8px; }
          .metaRow svg { font-size: 0.8rem; }
          .punchArea { margin-top: 10px; }
          .btnPrimary, .btnDanger, .btnGhost { padding: 8px; font-size: 0.8rem; border-radius: 12px; }
          .quickLinks { gap: 5px; margin-top: 8px; }
          .quickLinks button { padding: 6px; font-size: 0.65rem; border-radius: 10px; }
          .quickLinks button svg { font-size: 14px; }
        }

          .m-card { 
            background: rgba(255, 255, 255, 0.03); 
            border: 1px solid var(--border); 
            border-radius: 12px; 
            padding: 12px; 
            transition: 0.2s;
          }
          .m-card:active { border-color: var(--primary); background: rgba(80, 200, 255, 0.05); }
          .m-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
          .m-card-top .bold { font-size: 0.9rem; }
          .m-card-body { display: flex; flex-direction: column; gap: 4px; font-size: 0.8rem; color: var(--muted); }
          .m-item { display: flex; justify-content: space-between; align-items: center; min-height: 24px; }
          .m-item label { color: var(--muted); font-weight: 600; font-size: 0.75rem; }
          .m-item .bold { color: #fff; font-weight: 800; }
          .valGroup { display: flex; align-items: center; gap: 4px; font-weight: 700; font-size: 0.85rem; }
          .sep { color: var(--muted); opacity: 0.5; }
          .text-primary { color: var(--primary); }
          .mt-2 { margin-top: 8px; }
          .hrLabel { font-size: 9px; background: #e0f2fe; color: #0284c7; padding: 1px 4px; border-radius: 4px; border: 1px solid #bae6fd; font-weight: 800; }
          .reportPillGroup { display: flex; gap: 4px; }
          .reportPill { padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 800; border: 1px solid rgba(255,255,255,0.05); }
          .reportPill.ok { color: #10b981; background: rgba(16, 185, 129, 0.1); border-color: rgba(16, 185, 129, 0.2); }
          .reportPill.blue { color: #50c8ff; background: rgba(80, 200, 255, 0.1); border-color: rgba(80, 200, 255, 0.2); }
          .reportPill.none { color: var(--muted); background: rgba(255, 255, 255, 0.03); opacity: 0.6; }
        }
        @media (max-width: 640px) {
          .statsGrid { grid-template-columns: repeat(2, 1fr); }
          .hero { padding: 15px; }
          .heroTitle { font-size: 1.15rem; }
          .topNav { padding: 8px 12px; height: 60px; }
          .heroRight { width: 100%; margin-top: 5px; }
          .heroBtn { flex: 1; justify-content: center; padding: 8px 12px; font-size: 0.75rem; border-radius: 10px; }
          .brand span { display: none; }
        }
        @media (max-width: 480px) {
           .layout { padding: 10px; }
           .statsGrid { grid-template-columns: 1fr; }
           .hero { flex-direction: column; align-items: flex-start; border-radius: 16px; padding: 12px; gap: 10px; }
           .heroTitle { font-size: 1.1rem; }
           .heroSub { font-size: 0.7rem; }
           .heroRight { gap: 8px; margin-top: 0; width: 100%; }
           .heroBtn { width: 100%; flex: none; font-size: 0.75rem; padding: 10px; }
           .topNav { padding: 8px 8px; height: 56px; gap: 4px; }
           .brand { font-size: 1rem; gap: 4px; }
           .brand img { width: 22px; height: 22px; }
           .brand span { display: none; }
           .refreshBtn span { display: none; } 
           .refreshBtn { width: 34px; height: 34px; padding: 0; justify-content: center; border-radius: 8px; font-size: 12px; }
           .navRight { gap: 4px; }
           .dateBadge { padding: 4px 8px; font-size: 0.6rem; border-radius: 4px; }
           .dateBadge svg { display: none; } /* Hide icon to save space on tiny screens */
           .logoutBtn { width: 34px; height: 34px; border-radius: 8px; font-size: 12px; }
        }
      `}</style>
    </div>
  );
};

export default EmployeeDashboard;

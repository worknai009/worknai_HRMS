import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FaHistory,
  FaCoffee,
  FaPlay,
  FaCalendarAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationCircle,
  FaSearch,
  FaRedoAlt,
  FaMapMarkerAlt,
  FaTimes,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaArrowLeft,
  FaSignOutAlt,
  FaInfoCircle,
  FaCamera,
} from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";

import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  Circle,
} from "@react-google-maps/api";

/* =========================
   GOOGLE MAPS CONFIG
========================= */
const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || "";
const LIBRARIES = ["geometry"];

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
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
};

const computeDistanceMeters = (a, b) => {
  try {
    if (
      window.google?.maps?.geometry?.spherical &&
      a?.lat != null &&
      a?.lng != null &&
      b?.lat != null &&
      b?.lng != null
    ) {
      const p1 = new window.google.maps.LatLng(Number(a.lat), Number(a.lng));
      const p2 = new window.google.maps.LatLng(Number(b.lat), Number(b.lng));
      const d = window.google.maps.geometry.spherical.computeDistanceBetween(
        p1,
        p2,
      );
      return Number.isFinite(d) ? d : null;
    }
  } catch (e) { }
  return haversineMeters(a, b);
};

/**
 * FAST + ACCURATE GPS:
 * 1) Quick fix (low latency) to immediately show something
 * 2) Refine fix (high accuracy) if needed
 */
const getQuickPosition = ({ timeoutMs = 5500 } = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: timeoutMs,
      maximumAge: 10000, // allow small cache for speed
    });
  });
};

const getAccuratePosition = ({
  desiredAccuracy = 60,
  maxWaitMs = 12000,
  enableHighAccuracy = true,
} = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation)
      return reject(new Error("Geolocation not supported"));

    const opts = { enableHighAccuracy, timeout: 12000, maximumAge: 0 };
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
      if (!best || (Number.isFinite(acc) && acc < Number(best.coords.accuracy)))
        best = pos;
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
          { enableHighAccuracy, maximumAge: 0, timeout: 12000 },
        );

        setTimeout(() => finish(best || pos, true), maxWaitMs);
      },
      (err) => fail(err),
      opts,
    );
  });
};

/* =========================
   FORMAT HELPERS
========================= */
const toSafeNumber = (v, fallback = 0) => {
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) ? n : fallback;
};

const formatYMD = (ymd) => {
  if (!ymd || typeof ymd !== "string") return "--";
  if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    const [y, m, d] = ymd.split("-").map((x) => Number(x));
    const dt = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  }
  const dt = new Date(ymd);
  if (Number.isNaN(dt.getTime())) return String(ymd);
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dt);
};

const formatTime = (iso) => {
  if (!iso) return "--";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "--";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(dt);
};

const clampText = (s, max = 42) => {
  const str = String(s || "").trim();
  if (!str) return "--";
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
};

const getMorningReport = (row) =>
  row?.morningReport ||
  row?.plannedTasks ||
  row?.plan ||
  row?.reportIn ||
  row?.shiftPlan ||
  "";

const getDailyReport = (row) =>
  row?.dailyReport ||
  row?.endReport ||
  row?.report ||
  row?.reportOut ||
  row?.summary ||
  "";

const getLocationLink = (row) => {
  const loc = row?.location || row?.punchInLocation || row?.gps || null;
  const lat = loc?.lat ?? loc?.latitude;
  const lng = loc?.lng ?? loc?.longitude;
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)))
    return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
};

const getImageUrl = (imgPath, name = "") => {
  if (!imgPath) {
    const fn = (name || "User").replace(/\s+/g, "+");
    return `https://ui-avatars.com/api/?name=${fn}&background=50c8ff&color=03050c&bold=true&size=128`;
  }
  let finalPath = imgPath;
  if (typeof imgPath === "object") {
    finalPath = imgPath.url || imgPath.secure_url || imgPath.filepath || imgPath.path || "";
  }
  // Basic relative path resolver if getAssetUrl not available in this file
  if (finalPath.startsWith('http')) return finalPath;
  const backend = process.env.REACT_APP_SERVER_URL || "http://localhost:5000";
  return `${backend}/${finalPath.replace(/^(\.\.\/|\.\/)+/, "")}`;
};

/* =========================
   STATUS / MODE NORMALIZER
========================= */
const normalizeAttendanceLabel = (row) => {
  const mode = String(row?.mode || "").trim();
  const st = String(row?.status || "").trim();

  if (mode === "WFH") return "WFH";
  if (mode === "Paid Leave") return "Paid Leave";
  if (mode === "Unpaid Leave") return "Unpaid Leave";
  if (mode === "Holiday") return "Holiday";

  const s = st.toLowerCase();
  if (s === "on leave") return "Paid Leave";
  if (s === "absent") return "Unpaid Leave";
  if (s === "holiday") return "Holiday";

  return st || "Not Started";
};

const StatusPill = ({ row }) => {
  const s = String(normalizeAttendanceLabel(row) || "Not Started");
  const key = s.toLowerCase().replace(/\s+/g, "-");
  return (
    <span className={`pill pill-${key}`}>
      {s === "Completed" ? <FaCheckCircle className="pill-ic" /> : null}
      {s}
    </span>
  );
};

const MiniButton = ({ icon, text, variant = "solid", onClick, disabled }) => {
  return (
    <button
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
      type="button"
      aria-disabled={disabled ? "true" : "false"}
    >
      {icon ? <span className="btn-ic">{icon}</span> : null}
      <span>{text}</span>
    </button>
  );
};

const TextCell = ({ label, value, onOpen }) => {
  const has = String(value || "").trim().length > 0;
  return (
    <div className="textcell">
      <div className="textcell-main">{has ? clampText(value) : "--"}</div>
      {has && String(value).length > 45 ? (
        <button
          className="linkbtn"
          type="button"
          onClick={() => onOpen(label, value)}
        >
          View
        </button>
      ) : null}
    </div>
  );
};

import Pagination from "../../components/Pagination";

const Attendance = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [query, setQuery] = useState("");
  const [onlyToday, setOnlyToday] = useState(false);

  // Modal
  const [modal, setModal] = useState({ open: false, title: "", text: "" });

  // Location verify
  const [locLoading, setLocLoading] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [distanceMeters, setDistanceMeters] = useState(null);
  const [inside, setInside] = useState(true);

  const fileInputRef = useRef(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [meUser, setMeUser] = useState(user);

  const mountedRef = useRef(true);

  const tz = useMemo(() => {
    return (
      user?.companyId?.officeTiming?.timeZone ||
      user?.companyId?.timeZone ||
      "Asia/Kolkata"
    );
  }, [user]);

  const todayYMD = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(
      new Date(),
    );
  }, [tz]);

  const officePos = useMemo(() => {
    const loc = user?.companyId?.location || {};
    const lat = Number(loc.lat);
    const lng = Number(loc.lng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
    return null;
  }, [user]);

  const radiusMeters = useMemo(() => {
    const r =
      Number(user?.companyId?.location?.radius) ||
      Number(user?.companyId?.radius) ||
      Number(user?.companyId?.attendanceRadius) ||
      3000;
    if (!Number.isFinite(r)) return 3000;
    return Math.min(Math.max(r, 50), 5000);
  }, [user]);

  const attendanceMethod = useMemo(() => {
    return (
      user?.companyId?.attendanceMethod ||
      user?.companyId?.attendancePolicy?.method ||
      "GPS_FACE"
    );
  }, [user]);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

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

  useEffect(() => {
    mountedRef.current = true;
    loadAll(false);
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadAll = async (isRefresh = false) => {
    try {
      isRefresh ? setRefreshing(true) : setLoading(true);

      const [hRes, sRes] = await Promise.allSettled([
        API.get("/attendance/history"),
        API.get("/attendance/stats"),
      ]);

      const histData =
        hRes.status === "fulfilled" && Array.isArray(hRes.value?.data)
          ? hRes.value.data
          : [];
      const statData = sRes.status === "fulfilled" ? sRes.value?.data : null;

      if (!mountedRef.current) return;
      setHistory(histData);
      setStats(statData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load attendance data");
    } finally {
      if (!mountedRef.current) return;
      isRefresh ? setRefreshing(false) : setLoading(false);
    }
  };

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

      toast.success(res.data?.message || "Profile image updated ✅");
      
      if (res.data?.profileImage) {
        setMeUser(prev => ({ ...prev, profileImage: res.data.profileImage }));
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const openTextModal = (title, text) =>
    setModal({ open: true, title, text: String(text || "") });
  const closeModal = () => setModal({ open: false, title: "", text: "" });

  const distanceLabel = (d) => {
    if (d == null) return "--";
    if (d < 1000) return `${Math.round(d)} m`;
    return `${(d / 1000).toFixed(2)} km`;
  };

  /**
   * SUPER FAST detect:
   * - quick pos immediately (5s)
   * - refine in background if accuracy is poor
   */
  const detectLocation = useCallback(
    async ({ desiredAccuracy = 60 } = {}) => {
      if (!navigator.geolocation) {
        toast.error("Geolocation not supported");
        return null;
      }

      setLocLoading(true);

      const applyPos = (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracy = Number(pos.coords.accuracy);

        const my = { lat, lng };
        setCurrentPos(my);
        setGpsAccuracy(Number.isFinite(accuracy) ? accuracy : null);

        if (officePos) {
          const d = computeDistanceMeters(my, officePos);
          setDistanceMeters(d);
          setInside(d != null ? d <= radiusMeters : false);
        } else {
          setDistanceMeters(null);
          setInside(true);
        }

        return {
          lat,
          lng,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
        };
      };

      try {
        if (!GOOGLE_MAPS_API_KEY) {
          toast.info("Map key missing. GPS will still work.");
        }

        // 1) QUICK fix
        let quick = null;
        try {
          const posQuick = await getQuickPosition({ timeoutMs: 5500 });
          quick = applyPos(posQuick);
        } catch (e) {
          // ignore; will try accurate below
        }

        // if quick already good enough -> done
        if (quick?.accuracy != null && quick.accuracy <= desiredAccuracy) {
          toast.success(`Location Locked ✅ (±${Math.round(quick.accuracy)}m)`);
          return quick;
        }

        // 2) REFINE fix (fast cap 12s)
        const posAcc = await getAccuratePosition({
          desiredAccuracy,
          maxWaitMs: 12000,
          enableHighAccuracy: true,
        });

        const refined = applyPos(posAcc);

        toast.success(
          `Location Locked ✅ (±${refined?.accuracy != null ? Math.round(refined.accuracy) : "?"}m)`,
        );

        return refined || quick;
      } catch (err) {
        console.error(err);
        const msg =
          err?.code === 1
            ? "Location permission denied. Please allow location."
            : err?.code === 2
              ? "Location unavailable. Turn ON GPS."
              : err?.code === 3
                ? "Location timeout. Try again."
                : "Location error. Try again.";
        toast.error(msg);
        return null;
      } finally {
        setLocLoading(false);
      }
    },
    [officePos, radiusMeters],
  );

  const ensureOfficeInsideIfNeeded = async () => {
    if (!officePos) {
      toast.info(
        "Office location not configured by Admin. Skipping geo-check.",
      );
      return { ok: true, payload: {} };
    }

    // break actions should be FAST → slightly relaxed accuracy
    const loc = await detectLocation({ desiredAccuracy: 90 });
    if (!loc) return { ok: false, payload: null };

    const d = computeDistanceMeters({ lat: loc.lat, lng: loc.lng }, officePos);
    const isInside = d != null ? d <= radiusMeters : false;
    const enforce = String(attendanceMethod || "")
      .toUpperCase()
      .includes("GPS");

    if (enforce && !isInside) {
      toast.error(
        `❌ Outside office radius (${radiusMeters}m). Action blocked.`,
      );
      return { ok: false, payload: null };
    }

    return {
      ok: true,
      payload: {
        method: attendanceMethod,
        attendanceMethod,
        location: {
          lat: loc.lat,
          lng: loc.lng,
          accuracy: loc.accuracy,
          capturedAt: new Date().toISOString(),
        },
        office: {
          lat: officePos.lat,
          lng: officePos.lng,
          radius: radiusMeters,
          distanceMeters: d ?? null,
        },
      },
    };
  };

  const handleBreak = async (type) => {
    try {
      const { ok, payload } = await ensureOfficeInsideIfNeeded();
      if (!ok) return;

      const endpoint =
        type === "start" ? "/attendance/break-start" : "/attendance/break-end";
      await API.post(endpoint, payload || {});
      toast.success(type === "start" ? "Break Started ☕" : "Welcome Back! 🚀");
      loadAll(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Break action failed");
    }
  };

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = Array.isArray(history) ? history : [];
    const rows = onlyToday
      ? base.filter((r) => String(r?.date) === todayYMD)
      : base;
    if (!q) return rows;

    return rows.filter((r) => {
      const dateStr = String(r?.date || "");
      const st = String(normalizeAttendanceLabel(r) || "");
      const mr = String(getMorningReport(r) || "");
      const dr = String(getDailyReport(r) || "");
      return (
        dateStr.toLowerCase().includes(q) ||
        st.toLowerCase().includes(q) ||
        mr.toLowerCase().includes(q) ||
        dr.toLowerCase().includes(q)
      );
    });
  }, [history, query, onlyToday, todayYMD]);

  const {
    paginatedItems,
    startIndex,
    endIndex,
    totalItems,
    next,
    prev,
    canNext,
    canPrev,
    page,
    totalPages,
    goToPage,
  } = useClientPagination(filteredRows);

  const pager = {
    page,
    totalPages,
    goToPage,
    next,
    prev,
    canNext,
    canPrev,
    startIndex,
    endIndex,
    totalItems,
  };

  const summary = useMemo(() => {
    // robust mapping (old + new)
    if (stats && typeof stats === "object") {
      const present =
        stats.present ?? stats.presentDays ?? stats.presentCount ?? 0;
      const halfDays =
        stats.halfDays ?? stats.halfDay ?? stats.halfDayCount ?? 0;

      const wfh = stats.wfh ?? stats.wfhDays ?? stats.wfhCount ?? 0;

      const paid = stats.paidLeaveDays ?? stats.paidLeaves ?? 0;
      const unpaid = stats.unpaidLeaveDays ?? stats.unpaidLeaves ?? 0;

      const leaves =
        stats.leaves ??
        stats.leaveDays ??
        Number(paid || 0) + Number(unpaid || 0) ??
        0;

      return { present, halfDays, wfh, leaves };
    }

    // fallback compute
    const arr = Array.isArray(history) ? history : [];
    const present = arr.filter(
      (r) => String(normalizeAttendanceLabel(r)).toLowerCase() === "present",
    ).length;
    const halfDays = arr.filter(
      (r) => String(normalizeAttendanceLabel(r)).toLowerCase() === "halfday",
    ).length;
    const wfh = arr.filter(
      (r) => String(normalizeAttendanceLabel(r)).toLowerCase() === "wfh",
    ).length;
    const leaves = arr.filter((r) => {
      const k = String(normalizeAttendanceLabel(r)).toLowerCase();
      return k === "paid leave" || k === "unpaid leave";
    }).length;

    return { present, halfDays, wfh, leaves };
  }, [stats, history]);

  const disableBreakButtons = useMemo(() => {
    const todayRec = (Array.isArray(history) ? history : []).find(
      (r) => String(r?.date) === todayYMD,
    );
    if (!todayRec)
      return { start: true, end: true, reason: "No active attendance today" };

    const label = String(
      normalizeAttendanceLabel(todayRec) || "",
    ).toLowerCase();
    const mode = String(todayRec?.mode || "").toLowerCase();
    const st = String(todayRec?.status || "").toLowerCase();

    const completed = !!todayRec?.punchOutTime || st === "completed";
    if (completed)
      return { start: true, end: true, reason: "Shift already completed" };

    // leave/holiday: disable breaks
    const isNonWorking =
      label === "paid leave" ||
      label === "unpaid leave" ||
      label === "holiday" ||
      mode === "paid leave" ||
      mode === "unpaid leave" ||
      mode === "holiday";

    if (isNonWorking)
      return {
        start: true,
        end: true,
        reason: "Break not available on Leave/Holiday",
      };

    if (
      label === "on break" ||
      label === "on-break" ||
      st === "on break" ||
      st === "on-break"
    ) {
      return { start: true, end: false, reason: "" };
    }

    return { start: false, end: true, reason: "" };
  }, [history, todayYMD]);

  return (
    <div className="page slide-up">
      <header className="head">
        <div className="head-left">
          <button className="btn-back" onClick={() => navigate("/employee/dashboard")} title="Back to Dashboard">
            <FaArrowLeft />
          </button>
          <div className="iconBox">
            <FaHistory />
          </div>
          <div>
            <h1>Attendance Activity</h1>
            <p>Fast logs + reports view. (Backend synced)</p>
          </div>
        </div>

        <div className="head-right">
          <MiniButton
            icon={refreshing ? <FaRedoAlt className="spin" /> : <FaRedoAlt />}
            text={refreshing ? "Refreshing…" : "Refresh"}
            variant="ghost"
            onClick={() => loadAll(true)}
            disabled={refreshing}
          />

          <div className="attAvatarWrap" onClick={handleAvatarClick} title="Change Profile Image">
            {uploadingImage && <div className="attImgOverlay"><FaSpinner className="spin" /></div>}
            <img 
              src={getImageUrl(meUser?.profileImage, meUser?.name)} 
              alt="Me" 
              className="attAvatar"
            />
            <div className="attEditHint"><FaCamera /></div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="image/*"
            onChange={handleFileChange}
          />

          <button className="btn-logout" onClick={() => logout("/")} title="Logout">
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </header>

      <section className="cards">
        <div className="card c1">
          <div className="cLabel">Present</div>
          <div className="cVal">{toSafeNumber(summary.present)}</div>
        </div>
        <div className="card c2">
          <div className="cLabel">Half Days</div>
          <div className="cVal">{toSafeNumber(summary.halfDays)}</div>
        </div>
        <div className="card c3">
          <div className="cLabel">WFH</div>
          <div className="cVal">{toSafeNumber(summary.wfh)}</div>
        </div>
        <div className="card c4">
          <div className="cLabel">Leaves</div>
          <div className="cVal">{toSafeNumber(summary.leaves)}</div>
        </div>
      </section>

      <section className="locCard">
        <div className="locTop">
          <div>
            <div className="locTitle">
              <FaMapMarkerAlt /> Location Verification
            </div>
            <div className="locSub">
              Method: <b>{attendanceMethod}</b> • Radius: <b>{radiusMeters}m</b>
              {officePos ? "" : " • (Admin office location not set)"}
            </div>
          </div>

          <div className="locActions">
            <MiniButton
              icon={locLoading ? <FaSpinner className="spin" /> : <FaRedoAlt />}
              text={locLoading ? "Detecting…" : "Detect Location"}
              variant="solid"
              onClick={() => detectLocation({ desiredAccuracy: 60 })}
              disabled={locLoading}
            />
          </div>
        </div>

        <div className="locMetaRow">
          <span
            className={`badge ${officePos ? (inside ? "ok" : "bad") : "neutral"}`}
          >
            {officePos
              ? inside
                ? "Inside Office Radius ✅"
                : "Outside Radius ❌"
              : "Office location not configured"}
          </span>
          <span className="meta">
            Accuracy:{" "}
            <b>{gpsAccuracy != null ? `±${Math.round(gpsAccuracy)}m` : "--"}</b>
          </span>
          <span className="meta">
            Distance: <b>{officePos ? distanceLabel(distanceMeters) : "--"}</b>
          </span>
        </div>

        <div className="mapWrap">
          {loadError && (
            <div className="warnBox">
              Map load error. Check Google key + Maps JS API enabled + billing.
            </div>
          )}

          {isLoaded ? (
            <GoogleMap
              mapContainerClassName="map"
              center={currentPos || officePos || { lat: 19.076, lng: 72.877 }}
              zoom={15}
              options={{ disableDefaultUI: true, gestureHandling: "greedy" }}
            >
              {officePos && <Circle center={officePos} options={circleOptions} />}
              {officePos && (
                <Marker
                  position={officePos}
                  label={{
                    text: "Office",
                    color: "white",
                    fontWeight: "bold",
                    className: "mapLabel",
                  }}
                />
              )}
              {currentPos && (
                <Marker
                  position={currentPos}
                  icon="https://maps.google.com/mapfiles/ms/icons/blue-dot.png"
                />
              )}
            </GoogleMap>
          ) : (
            <div className="mapPlaceholder">
              <FaSpinner className="spin" /> Initializing Map…
            </div>
          )}
        </div>
      </section>

      <div className="mainGrid">
        <section className="tablePanel">
          <div className="panelHead">
            <div className="pLeft">
              <div className="total">
                Results: <b>{filteredRows.length}</b>
              </div>
              <div className="filters">
                <div className="searchBox">
                  <FaSearch className="sIc" />
                  <input
                    placeholder="Search records…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <button
                  className={`toggleBtn ${onlyToday ? "active" : ""}`}
                  onClick={() => setOnlyToday(!onlyToday)}
                >
                  {onlyToday ? "All History" : "Today Only"}
                </button>
              </div>
            </div>
          </div>

          <div className="tableWrap shadow-nice">
            <table className="table desktop-only">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>In</th>
                  <th>Out</th>
                  <th>Hours</th>
                  <th>Report In</th>
                  <th>Report Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      <FaSpinner className="spin" /> Syncing with server…
                    </td>
                  </tr>
                ) : paginatedItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty">
                      <FaExclamationCircle /> No matching records.
                    </td>
                  </tr>
                ) : (
                  paginatedItems.map((r) => {
                    const morning = getMorningReport(r);
                    const evening = getDailyReport(r);
                    return (
                      <tr key={r._id}>
                        <td>
                          <b>{formatYMD(r.date)}</b>
                        </td>
                        <td className="green text-center">
                          {formatTime(r.punchInTime)}
                        </td>
                        <td className="red text-center">
                          {formatTime(r.punchOutTime)}
                        </td>
                        <td className="text-center">
                          {r.netWorkHours || r.netHours || "--"}
                        </td>
                        <td>
                          <TextCell
                            label="Morning Plan"
                            value={morning}
                            onOpen={openTextModal}
                          />
                        </td>
                        <td>
                          <TextCell
                            label="Daily Report"
                            value={evening}
                            onOpen={openTextModal}
                          />
                        </td>
                        <td>
                          <StatusPill row={r} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="mobile-only">
              {loading ? (
                <div className="empty">
                  <FaSpinner className="spin" /> Syncing…
                </div>
              ) : paginatedItems.length === 0 ? (
                <div className="empty">No records found.</div>
              ) : (
                <div className="mList">
                  {paginatedItems.map((r) => (
                    <div key={r._id} className="mCard">
                      <div className="mTop">
                        <span className="mDate">{formatYMD(r.date)}</span>
                        <StatusPill row={r} />
                      </div>
                      <div className="mTimes">
                        <div className="mTime green">
                          <label>In:</label> {formatTime(r.punchInTime)}
                        </div>
                        <div className="mTime red">
                          <label>Out:</label> {formatTime(r.punchOutTime)}
                        </div>
                        <div className="mTime">
                          <label>Net:</label>
                          <b className="text-primary">
                            {String(r.date) === todayYMD && !r.punchOutTime ? "Working..." : (r.netWorkHours || r.netHours || "--")}
                          </b>
                        </div>
                      </div>
                      <div className="mReports">
                        <div className="mR">
                          <label>Morning:</label>{" "}
                          {clampText(getMorningReport(r), 30)}
                        </div>
                        <div className="mR">
                          <label>Daily:</label> {clampText(getDailyReport(r), 30)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="tableFoot">
            <Pagination pager={pager} />
          </div>
        </section>

        <section className="sidePanel">
          <div className="breakCard">
            <h3>Break Management</h3>
            <p>Track your break durations during the shift.</p>

            <div className="breakStats">
              <div className="bStat">
                <FaCoffee />
                <div>
                  <div className="bVal">30m</div>
                  <div className="bLab">Used</div>
                </div>
              </div>
              <div className="bStat">
                <FaClock />
                <div>
                  <div className="bVal">30m</div>
                  <div className="bLab">Left</div>
                </div>
              </div>
            </div>

            <div className="breakActions">
              <button
                className="btn btn-outline"
                disabled={disableBreakButtons.start}
                onClick={() => handleBreak("start")}
              >
                Start Break
              </button>
              <button
                className="btn btn-solid"
                disabled={disableBreakButtons.end}
                onClick={() => handleBreak("end")}
              >
                End Break
              </button>
            </div>
            {disableBreakButtons.reason && (
              <div className="breakHint">
                <FaInfoCircle /> {disableBreakButtons.reason}
              </div>
            )}
          </div>

          <div className="helpCard">
            <h4>Quick FAQ</h4>
            <ul>
              <li>Location locked? Try refreshing your GPS.</li>
              <li>Missing logs? Sync with backend using Refresh.</li>
              <li>Incorrect status? Contact HR for manual fix.</li>
            </ul>
          </div>
        </section>
      </div>

      {modal.open && (
        <div className="modalOverlay" onClick={closeModal}>
          <div className="modalBox zoom-in" onClick={(e) => e.stopPropagation()}>
            <div className="mHead">
              <h3>{modal.title}</h3>
              <button onClick={closeModal}>
                <FaTimes />
              </button>
            </div>
            <div className="mBody">{modal.text}</div>
            <div className="mFoot">
              <button onClick={closeModal} className="btn btn-solid">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        :root {
          --bg: #03050c;
          --card: rgba(13, 18, 40, 0.65);
          --text: #ffffff;
          --muted: rgba(255, 255, 255, 0.6);
          --border: rgba(80, 200, 255, 0.12);
          --primary: #50c8ff;
          --grad-tri: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
        }

        .page { padding: 24px; max-width: 1400px; margin: 0 auto; min-height: 100vh; background: var(--bg); color: var(--text); font-family: 'Plus Jakarta Sans', Inter, sans-serif;
           background-image: radial-gradient(circle at 5% 5%, rgba(80, 200, 255, 0.04) 0%, transparent 30%);
        }
        
        .mobile-only { display: none; }
        .desktop-only { display: block; }

        /* HEADER */
        .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 20px; flex-wrap: wrap; gap: 20px; }
        .head-left { display: flex; gap: 16px; align-items: center; }
        .iconBox { width: 50px; height: 50px; background: rgba(80, 200, 255, 0.1); border-radius: 14px; display: grid; place-items: center; font-size: 22px; color: var(--primary); }
        .head-left h1 { margin: 0; font-size: 1.5rem; font-weight: 850; letter-spacing: -0.5px; background: var(--grad-tri); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .head-left p { margin: 4px 0 0; font-size: 0.9rem; color: var(--muted); font-weight: 600; }
        .head-right { display: flex; gap: 12px; align-items: center; }
        
        .btn-back { width: 42px; height: 42px; border-radius: 12px; border: 1px solid var(--border); background: rgba(255,255,255,0.03); color: white; cursor: pointer; transition: 0.3s; display: grid; place-items: center; }
        .btn-back:hover { border-color: var(--primary); color: var(--primary); background: rgba(80, 200, 255, 0.1); }

        .btn-logout { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 10px 18px; border-radius: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 10px; transition: 0.3s; }
        .btn-logout:hover { background: #ef4444; color: white; }

        .attAvatarWrap {
          width: 42px; height: 42px;
          border-radius: 12px;
          border: 1px solid var(--border);
          overflow: hidden;
          position: relative;
          cursor: pointer;
          transition: 0.3s;
        }
        .attAvatarWrap:hover { border-color: var(--primary); }
        .attAvatar { width: 100%; height: 100%; object-fit: cover; transition: 0.3s; }
        .attAvatarWrap:hover .attAvatar { filter: brightness(0.6); }
        .attEditHint { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #fff; opacity: 0; transition: 0.3s; pointer-events: none; font-size: 14px; }
        .attAvatarWrap:hover .attEditHint { opacity: 1; }
        .attImgOverlay { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: grid; place-items: center; z-index: 5; }

        /* CARDS */
        .cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
        .card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 20px; backdrop-filter: blur(10px); transition: 0.3s; }
        .card:hover { border-color: var(--primary); transform: translateY(-3px); }
        .card.c1 { border-left: 4px solid #10b981; }
        .card.c2 { border-left: 4px solid #f59e0b; }
        .card.c3 { border-left: 4px solid #3b82f6; }
        .card.c4 { border-left: 4px solid #ef4444; }
        .cLabel { font-size: 0.75rem; color: var(--muted); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
        .cVal { font-size: 1.8rem; font-weight: 900; margin-top: 6px; }

        /* LOC CARD */
        .locCard { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 24px; margin-bottom: 24px; }
        .locTop { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; gap: 20px; flex-wrap: wrap; }
        .locTitle { font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; gap: 10px; color: #fff; }
        .locSub { margin-top: 4px; font-size: 0.85rem; color: var(--muted); font-weight: 600; }
        .locMetaRow { display: flex; gap: 20px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
        .badge { padding: 6px 14px; border-radius: 50px; font-weight: 800; font-size: 0.8rem; }
        .badge.ok { background: rgba(16, 185, 129, 0.15); color: #10b981; }
        .badge.bad { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .meta { font-size: 0.85rem; color: var(--muted); }
        .meta b { color: #fff; }

        .workingTag {
          color: #10b981;
          font-size: 0.7rem;
          background: rgba(16, 185, 129, 0.1);
          padding: 2px 8px;
          border-radius: 6px;
          border: 1px solid rgba(16, 185, 129, 0.2);
          animation: pulse-small 2s infinite;
        }
        @keyframes pulse-small {
          0% { opacity: 0.8; }
          50% { opacity: 1; text-shadow: 0 0 5px rgba(16, 185, 129, 0.3); }
          100% { opacity: 0.8; }
        }

        .mapWrap { height: 320px; border-radius: 16px; overflow: hidden; border: 1px solid var(--border); position: relative; }
        .map { width: 100%; height: 100%; }
        .warnBox { position: absolute; inset: 0; background: rgba(239, 68, 68, 0.1); display: grid; place-items: center; color: #f87171; padding: 20px; text-align: center; font-weight: 600; z-index: 10; backdrop-filter: blur(4px); }
        .mapPlaceholder { position: absolute; inset: 0; background: rgba(0,0,0,0.5); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: var(--muted); }

        /* MAIN GRID */
        .mainGrid { display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; }
        .tablePanel { background: var(--card); border: 1px solid var(--border); border-radius: 24px; overflow: hidden; }
        .panelHead { padding: 20px; border-bottom: 1px solid var(--border); background: rgba(255,255,255,0.01); }
        .pLeft { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; }
        .total { font-size: 0.9rem; color: var(--muted); font-weight: 600; }
        .filters { display: flex; gap: 12px; align-items: center; }
        .searchBox { position: relative; display: flex; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 12px; padding: 8px 12px; gap: 10px; width: 240px; transition: 0.3s; }
        .searchBox:focus-within { border-color: var(--primary); background: rgba(255,255,255,0.06); }
        .searchBox input { background: none; border: none; outline: none; color: #fff; width: 100%; font-size: 0.9rem; font-weight: 600; }
        .sIc { color: var(--muted); font-size: 14px; }
        .toggleBtn { padding: 8px 16px; border-radius: 10px; border: 1px solid var(--border); background: none; color: #fff; font-weight: 700; cursor: pointer; transition: 0.3s; font-size: 0.85rem; }
        .toggleBtn.active { background: var(--primary); color: #03050c; border-color: var(--primary); }

        .tableWrap { overflow-x: auto; }
        .table { width: 100%; border-collapse: collapse; }
        .table th { background: rgba(255,255,255,0.03); padding: 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: var(--muted); font-weight: 800; }
        .table td { padding: 16px; border-bottom: 1px solid var(--border); font-size: 13.5px; }
        .table tr:last-child td { border-bottom: none; }
        .table tr:hover { background: rgba(255,255,255,0.02); }

        .textcell { min-width: 140px; }
        .textcell-main { color: var(--muted); font-size: 12px; line-height: 1.4; }
        .linkbtn { background: none; border: none; color: var(--primary); padding: 4px 0; font-size: 11px; font-weight: 800; cursor: pointer; text-decoration: underline; }

        .pill { padding: 4px 10px; border-radius: 50px; font-size: 11px; font-weight: 900; display: inline-flex; align-items: center; gap: 5px; text-transform: uppercase; letter-spacing: 0.5px; background: rgba(255,255,255,0.05); }
        .pill-present { color: #10b981; background: rgba(16, 185, 129, 0.1); }
        .pill-absent { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
        .pill-paid-leave { color: #3b82f6; background: rgba(59, 130, 246, 0.1); }
        .pill-unpaid-leave { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
        .pill-not-started { color: var(--muted); }

        .btn { padding: 10px 18px; border-radius: 12px; font-weight: 800; cursor: pointer; transition: 0.3s; display: inline-flex; align-items: center; gap: 8px; font-size: 0.9rem; }
        .btn-solid { background: var(--primary); border: none; color: #03050c; }
        .btn-solid:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(80, 200, 255, 0.3); }
        .btn-ghost { background: rgba(255,255,255,0.05); border: 1px solid var(--border); color: #fff; }
        .btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.1); border-color: var(--primary); }
        .btn-outline { background: none; border: 1px solid var(--border); color: #fff; }
        .btn-outline:hover:not(:disabled) { border-color: var(--primary); color: var(--primary); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* SIDE PANEL */
        .sidePanel { display: grid; gap: 24px; }
        .breakCard { background: var(--card); border: 1px solid var(--border); border-radius: 24px; padding: 24px; }
        .breakCard h3 { margin: 0; font-size: 1.2rem; }
        .breakCard p { font-size: 0.85rem; color: var(--muted); margin: 6px 0 20px; font-weight: 600; }
        .breakStats { display: flex; gap: 20px; margin-bottom: 24px; }
        .bStat { flex: 1; display: flex; align-items: center; gap: 12px; background: rgba(255,255,255,0.03); padding: 12px; border-radius: 16px; border: 1px solid var(--border); }
        .bStat svg { font-size: 1.2rem; color: var(--primary); opacity: 0.7; }
        .bVal { font-size: 1.1rem; font-weight: 900; }
        .bLab { font-size: 10px; color: var(--muted); font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .breakActions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .breakHint { margin-top: 16px; font-size: 11px; color: #f59e0b; font-weight: 700; display: flex; align-items: center; gap: 6px; }

        .helpCard { background: rgba(80, 200, 255, 0.03); border: 1px dashed rgba(80, 200, 255, 0.2); border-radius: 20px; padding: 16px; }
        .helpCard h4 { margin: 0; font-size: 0.9rem; color: var(--primary); }
        .helpCard ul { margin: 10px 0 0; padding-left: 20px; font-size: 12px; color: var(--muted); font-weight: 600; }
        .helpCard li { margin-bottom: 8px; }

        /* MODAL */
        .modalOverlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 2000; backdrop-filter: blur(8px); padding: 20px; }
        .modalBox { background: #0a0f1e; border: 1px solid var(--border); border-radius: 24px; width: 100%; max-width: 480px; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
        .mHead { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid var(--border); }
        .mHead h3 { margin: 0; font-size: 1.2rem; }
        .mHead button { background: none; border: none; color: var(--muted); font-size: 1.4rem; cursor: pointer; }
        .mBody { padding: 24px; font-size: 0.95rem; line-height: 1.6; color: rgba(255,255,255,0.8); white-space: pre-wrap; max-height: 400px; overflow-y: auto; }
        .mFoot { padding: 20px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; }

        .zoom-in { animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* RESPONSIVE */
        @media (max-width: 1200px) { 
          .mainGrid { grid-template-columns: 1fr; } 
          .sidePanel { order: 1; } 
          .cards { grid-template-columns: repeat(2, 1fr); } 
        }

        @media (max-width: 768px) {
          .page { padding: 16px; }
          .head { gap: 12px; margin-bottom: 20px; }
          .head-left h1 { font-size: 1.25rem; }
          .head-right { width: 100%; justify-content: space-between; gap: 8px; }
          .btn-logout { padding: 8px 12px; font-size: 0.8rem; flex: 1; justify-content: center; }
          .mapWrap { height: 260px; }
          .mainGrid { gap: 16px; }
        }

        @media (max-width: 640px) {
          .mobile-only { display: block; }
          .desktop-only { display: none; }
          .head-left { gap: 12px; }
          .iconBox { width: 44px; height: 44px; font-size: 18px; }
          .cards { grid-template-columns: 1fr; gap: 12px; }
          .cVal { font-size: 1.5rem; }
          .tableWrap { display: none; }
          .panelHead { padding: 16px; }
          .pLeft { flex-direction: column; align-items: stretch; }
          .searchBox { width: 100%; }
          .filters { width: 100%; justify-content: space-between; }
          .mList { display: grid; gap: 12px; padding: 12px; }
          .mCard { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 16px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
          .mTop { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
          .mDate { font-weight: 850; font-size: 0.9rem; color: #fff; }
          .mTimes { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px; }
          .mTime { font-size: 0.8rem; font-weight: 700; }
          .mTime label { display: block; color: var(--muted); font-size: 9px; text-transform: uppercase; margin-bottom: 2px; }
          .mReports { border-top: 1px solid var(--border); padding-top: 12px; display: grid; gap: 8px; font-size: 0.8rem; }
          .mR { line-height: 1.4; }
          .mR label { font-weight: 800; color: var(--primary); margin-right: 4px; }
          .breakStats { flex-direction: column; gap: 12px; }
          .bStat { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Attendance;

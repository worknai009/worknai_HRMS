import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import { useAuth } from "../../context/AuthContext";
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
} from "react-icons/fa";
import { useClientPagination } from "../../utils/useClientPagination";

import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api";

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
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

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
      const d = window.google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
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
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: 10000, // allow small cache for speed
      }
    );
  });
};

const getAccuratePosition = ({
  desiredAccuracy = 60,
  maxWaitMs = 12000,
  enableHighAccuracy = true,
} = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));

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
          { enableHighAccuracy, maximumAge: 0, timeout: 12000 }
        );

        setTimeout(() => finish(best || pos, true), maxWaitMs);
      },
      (err) => fail(err),
      opts
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
    return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(dt);
  }
  const dt = new Date(ymd);
  if (Number.isNaN(dt.getTime())) return String(ymd);
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(dt);
};

const formatTime = (iso) => {
  if (!iso) return "--";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "--";
  return new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(dt);
};

const clampText = (s, max = 42) => {
  const str = String(s || "").trim();
  if (!str) return "--";
  if (str.length <= max) return str;
  return str.slice(0, max) + "…";
};

const getMorningReport = (row) =>
  row?.morningReport || row?.plannedTasks || row?.plan || row?.reportIn || row?.shiftPlan || "";

const getDailyReport = (row) =>
  row?.dailyReport || row?.endReport || row?.report || row?.reportOut || row?.summary || "";

const getLocationLink = (row) => {
  const loc = row?.location || row?.punchInLocation || row?.gps || null;
  const lat = loc?.lat ?? loc?.latitude;
  const lng = loc?.lng ?? loc?.longitude;
  if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return null;
  return `https://www.google.com/maps?q=${lat},${lng}`;
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
        <button className="linkbtn" type="button" onClick={() => onOpen(label, value)}>
          View
        </button>
      ) : null}
    </div>
  );
};

import Pagination from "../../components/Pagination";

const Attendance = () => {
  const { user } = useAuth();

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

  const mountedRef = useRef(true);

  const tz = useMemo(() => {
    return user?.companyId?.officeTiming?.timeZone || user?.companyId?.timeZone || "Asia/Kolkata";
  }, [user]);

  const todayYMD = useMemo(() => {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
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
        hRes.status === "fulfilled" && Array.isArray(hRes.value?.data) ? hRes.value.data : [];
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

  const openTextModal = (title, text) => setModal({ open: true, title, text: String(text || "") });
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
  const detectLocation = useCallback(async ({ desiredAccuracy = 60 } = {}) => {
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

      return { lat, lng, accuracy: Number.isFinite(accuracy) ? accuracy : null };
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
        `Location Locked ✅ (±${refined?.accuracy != null ? Math.round(refined.accuracy) : "?"}m)`
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
  }, [officePos, radiusMeters]);

  const ensureOfficeInsideIfNeeded = async () => {
    if (!officePos) {
      toast.info("Office location not configured by Admin. Skipping geo-check.");
      return { ok: true, payload: {} };
    }

    // break actions should be FAST → slightly relaxed accuracy
    const loc = await detectLocation({ desiredAccuracy: 90 });
    if (!loc) return { ok: false, payload: null };

    const d = computeDistanceMeters({ lat: loc.lat, lng: loc.lng }, officePos);
    const isInside = d != null ? d <= radiusMeters : false;
    const enforce = String(attendanceMethod || "").toUpperCase().includes("GPS");

    if (enforce && !isInside) {
      toast.error(`❌ Outside office radius (${radiusMeters}m). Action blocked.`);
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

      const endpoint = type === "start" ? "/attendance/break-start" : "/attendance/break-end";
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
    const rows = onlyToday ? base.filter((r) => String(r?.date) === todayYMD) : base;
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
    canPrev
  } = useClientPagination(filteredRows);

  const summary = useMemo(() => {
    // robust mapping (old + new)
    if (stats && typeof stats === "object") {
      const present = stats.present ?? stats.presentDays ?? stats.presentCount ?? 0;
      const halfDays = stats.halfDays ?? stats.halfDay ?? stats.halfDayCount ?? 0;

      const wfh =
        stats.wfh ??
        stats.wfhDays ??
        stats.wfhCount ??
        0;

      const paid = stats.paidLeaveDays ?? stats.paidLeaves ?? 0;
      const unpaid = stats.unpaidLeaveDays ?? stats.unpaidLeaves ?? 0;

      const leaves =
        stats.leaves ??
        stats.leaveDays ??
        (Number(paid || 0) + Number(unpaid || 0)) ??
        0;

      return { present, halfDays, wfh, leaves };
    }

    // fallback compute
    const arr = Array.isArray(history) ? history : [];
    const present = arr.filter((r) => String(normalizeAttendanceLabel(r)).toLowerCase() === "present").length;
    const halfDays = arr.filter((r) => String(normalizeAttendanceLabel(r)).toLowerCase() === "halfday").length;
    const wfh = arr.filter((r) => String(normalizeAttendanceLabel(r)).toLowerCase() === "wfh").length;
    const leaves = arr.filter((r) => {
      const k = String(normalizeAttendanceLabel(r)).toLowerCase();
      return k === "paid leave" || k === "unpaid leave";
    }).length;

    return { present, halfDays, wfh, leaves };
  }, [stats, history]);

  const disableBreakButtons = useMemo(() => {
    const todayRec = (Array.isArray(history) ? history : []).find((r) => String(r?.date) === todayYMD);
    if (!todayRec) return { start: true, end: true, reason: "No active attendance today" };

    const label = String(normalizeAttendanceLabel(todayRec) || "").toLowerCase();
    const mode = String(todayRec?.mode || "").toLowerCase();
    const st = String(todayRec?.status || "").toLowerCase();

    const completed = !!todayRec?.punchOutTime || st === "completed";
    if (completed) return { start: true, end: true, reason: "Shift already completed" };

    // leave/holiday: disable breaks
    const isNonWorking =
      label === "paid leave" ||
      label === "unpaid leave" ||
      label === "holiday" ||
      mode === "paid leave" ||
      mode === "unpaid leave" ||
      mode === "holiday";

    if (isNonWorking) return { start: true, end: true, reason: "Break not available on Leave/Holiday" };

    if (label === "on break" || label === "on-break" || st === "on break" || st === "on-break") {
      return { start: true, end: false, reason: "" };
    }

    return { start: false, end: true, reason: "" };
  }, [history, todayYMD]);

  return (
    <div className="page slide-up">
      <header className="head">
        <div className="head-left">
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
          <span className={`badge ${officePos ? (inside ? "ok" : "bad") : "neutral"}`}>
            {officePos ? (inside ? "Inside Office Radius ✅" : "Outside Radius ❌") : "Office location not configured"}
          </span>
          <span className="meta">
            Accuracy: <b>{gpsAccuracy != null ? `±${Math.round(gpsAccuracy)}m` : "--"}</b>
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

          {isLoaded && GOOGLE_MAPS_API_KEY ? (
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "220px", borderRadius: "16px" }}
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
              {currentPos && <Marker position={currentPos} />}
            </GoogleMap>
          ) : (
            <div className="mapFallback">
              {GOOGLE_MAPS_API_KEY ? "Loading map…" : "Google Maps not available (missing key). GPS still works."}
            </div>
          )}
        </div>
      </section>

      <section className="breakCard">
        <div className="bkLeft">
          <h3>Break Management</h3>
          <p>Accurate net work hours ke liye break start/end zaroor mark karein.</p>
          {disableBreakButtons.reason ? <div className="hint">{disableBreakButtons.reason}</div> : null}
        </div>

        <div className="bkBtns">
          <MiniButton
            icon={<FaCoffee />}
            text="Start Break"
            variant="warning"
            onClick={() => handleBreak("start")}
            disabled={disableBreakButtons.start}
          />
          <MiniButton
            icon={<FaPlay />}
            text="Resume Work"
            variant="success"
            onClick={() => handleBreak("end")}
            disabled={disableBreakButtons.end}
          />
        </div>
      </section>

      <section className="bar">
        <div className="search">
          <FaSearch className="sIc" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by date / status / reports…"
          />
        </div>

        <button
          type="button"
          className={`toggle ${onlyToday ? "on" : ""}`}
          onClick={() => setOnlyToday((v) => !v)}
        >
          {onlyToday ? "Showing: Today" : "Filter: Today"}
        </button>

        <div className="count">{filteredRows.length} records</div>
      </section>

      <section className="tableCard">
        <div className="tableWrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Net Hours</th>
                <th>Status</th>
                <th>Morning Plan</th>
                <th>Daily Report</th>
                <th>Location</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="msg">Fetching your logs…</td>
                </tr>
              ) : paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="msg">
                    <FaExclamationCircle /> No attendance records found.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((row) => {
                  const net = toSafeNumber(row?.netWorkHours, 0);
                  const locLink = getLocationLink(row);

                  return (
                    <tr key={row._id} className="tr">
                      <td className="date">
                        <FaCalendarAlt className="dim" />
                        <span>{formatYMD(row?.date)}</span>
                      </td>

                      <td className="time in">
                        <FaClock />
                        {formatTime(row?.punchInTime)}
                      </td>

                      <td className="time out">
                        <FaClock />
                        {formatTime(row?.punchOutTime)}
                      </td>

                      <td className="hours">
                        <strong>{net ? net.toFixed(2) : "0.00"}</strong> <small>hrs</small>
                      </td>

                      <td><StatusPill row={row} /></td>

                      <td>
                        <TextCell label="Morning Plan" value={getMorningReport(row)} onOpen={openTextModal} />
                      </td>

                      <td>
                        <TextCell label="Daily Report" value={getDailyReport(row)} onOpen={openTextModal} />
                      </td>

                      <td>
                        {locLink ? (
                          <a className="mapLink" href={locLink} target="_blank" rel="noreferrer">
                            <FaMapMarkerAlt /> Map
                          </a>
                        ) : (
                          <span className="muted">--</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div style={{ padding: '10px' }}>
            <Pagination pager={pager} />
          </div>
        </div>
      </section>

      {modal.open ? (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="mHead">
              <div>
                <div className="mTitle">{modal.title}</div>
                <div className="mSub">Full text view</div>
              </div>
              <button className="xbtn" type="button" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <div className="mBody">
              <pre className="pre">{modal.text || "--"}</pre>
            </div>

            <div className="mFoot">
              <button className="btn btn-solid" type="button" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        :root{
          --bg:#f8fafc;
          --card:#ffffff;
          --text:#0f172a;
          --muted:#64748b;
          --border:#e2e8f0;
          --brand:#10b981;
          --brand2:#4f46e5;
          --danger:#ef4444;
          --warn:#f59e0b;
          --ok:#10b981;
          --shadow: 0 14px 35px rgba(2,6,23,0.06);
        }

        .page{
          padding: 22px;
          max-width: 1280px;
          margin: 0 auto;
          font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial;
          color: var(--text);
        }

        .head{
          display:flex; justify-content:space-between; align-items:flex-end;
          gap: 14px; margin-bottom: 16px;
        }
        .head-left{ display:flex; gap:14px; align-items:center; }
        .iconBox{
          width:56px; height:56px; border-radius:18px;
          background: linear-gradient(135deg, rgba(16,185,129,0.15), rgba(79,70,229,0.10));
          border: 1px solid rgba(226,232,240,0.9);
          display:flex; align-items:center; justify-content:center;
          font-size: 22px; color: var(--brand);
          box-shadow: 0 10px 20px rgba(16,185,129,0.06);
        }
        .head h1{ margin:0; font-size: 22px; letter-spacing:-0.3px; }
        .head p{ margin:4px 0 0; color: var(--muted); font-weight: 600; font-size: 13px; }

        .cards{
          display:grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 14px;
        }
        .card{
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 14px;
          box-shadow: 0 8px 18px rgba(2,6,23,0.04);
        }
        .cLabel{ font-size: 12px; color: var(--muted); font-weight: 800; text-transform: uppercase; letter-spacing: .8px; }
        .cVal{ font-size: 22px; font-weight: 950; margin-top: 8px; }
        .c1{ border-color: rgba(16,185,129,0.22); }
        .c2{ border-color: rgba(245,158,11,0.22); }
        .c3{ border-color: rgba(79,70,229,0.22); }
        .c4{ border-color: rgba(239,68,68,0.18); }

        .locCard{
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 22px;
          box-shadow: var(--shadow);
          padding: 14px;
          margin-bottom: 14px;
          overflow:hidden;
        }
        .locTop{
          display:flex; justify-content:space-between; gap:12px;
          flex-wrap:wrap; align-items:flex-start;
          margin-bottom: 10px;
        }
        .locTitle{ font-weight: 950; display:flex; align-items:center; gap:10px; }
        .locSub{ margin-top: 4px; color: var(--muted); font-weight: 800; font-size: 12px; }
        .locMetaRow{
          display:flex; gap:10px; flex-wrap:wrap; align-items:center;
          margin-bottom: 10px;
        }
        .badge{
          padding: 7px 10px;
          border-radius: 999px;
          font-weight: 950;
          font-size: 11px;
          border:1px solid var(--border);
          background:#f8fafc;
        }
        .badge.ok{ background:#dcfce7; border-color:#bbf7d0; color:#065f46; }
        .badge.bad{ background:#fee2e2; border-color:#fecaca; color:#991b1b; }
        .badge.neutral{ background:#e0f2fe; border-color:#bae6fd; color:#075985; }
        .meta{ color: var(--muted); font-weight: 900; font-size: 12px; }
        .mapWrap{ border-radius: 16px; overflow:hidden; border:1px solid rgba(226,232,240,0.9); }
        .mapFallback{ padding: 14px; color: var(--muted); font-weight: 900; background:#f8fafc; }
        .warnBox{ padding: 10px 12px; background:#fff7ed; color:#9a3412; font-weight: 950; border-bottom:1px solid #fed7aa; font-size: 12px; }

        .breakCard{
          background: linear-gradient(135deg, rgba(79,70,229,0.10), rgba(16,185,129,0.10));
          border: 1px solid rgba(199,210,254,0.8);
          border-radius: 22px;
          padding: 18px;
          display:flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
          box-shadow: 0 12px 22px rgba(79,70,229,0.06);
          flex-wrap: wrap;
        }
        .bkLeft h3{ margin:0; font-size: 16px; font-weight: 950; }
        .bkLeft p{ margin:6px 0 0; color: rgba(15,23,42,0.72); font-weight: 650; }
        .hint{ margin-top: 10px; font-size: 12px; color: rgba(15,23,42,0.70); font-weight: 800; background: rgba(255,255,255,0.65); padding: 6px 10px; border-radius: 12px; width: fit-content; }
        .bkBtns{ display:flex; gap: 10px; }

        .bar{
          display:flex; gap: 10px; align-items:center; justify-content:space-between;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }
        .search{
          flex: 1;
          min-width: 240px;
          display:flex; align-items:center; gap: 10px;
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 10px 12px;
          box-shadow: 0 8px 18px rgba(2,6,23,0.03);
        }
        .sIc{ color: var(--muted); }
        .search input{
          width: 100%;
          border:none; outline:none;
          font-weight: 800;
          color: var(--text);
          background: transparent;
        }

        .toggle{
          border: 1px solid var(--border);
          background: #fff;
          padding: 10px 12px;
          border-radius: 14px;
          cursor: pointer;
          font-weight: 900;
          color: var(--muted);
        }
        .toggle.on{
          border-color: rgba(16,185,129,0.4);
          color: #065f46;
          background: #ecfdf5;
        }
        .count{ font-weight: 900; color: var(--muted); font-size: 13px; }

        .tableCard{
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 22px;
          box-shadow: var(--shadow);
          overflow: hidden;
        }
        .tableWrap{ overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .tbl{
          width: 100%;
          border-collapse: collapse;
          min-width: 980px;
        }
        .tbl th{
          text-align: left;
          padding: 16px 16px;
          background: rgba(248,250,252,0.95);
          border-bottom: 1px solid rgba(226,232,240,0.9);
          font-size: 12px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: .9px;
          font-weight: 950;
          white-space: nowrap;
        }
        .tbl td{
          padding: 14px 16px;
          border-bottom: 1px solid rgba(241,245,249,0.95);
          font-weight: 650;
          font-size: 13px;
          vertical-align: middle;
        }
        .tr:hover{ background: rgba(248,250,252,0.70); }
        .msg{ padding: 36px !important; text-align:center; color: var(--muted); font-weight: 900; }

        .date{ display:flex; align-items:center; gap: 10px; font-weight: 950; }
        .dim{ color: rgba(79,70,229,0.65); }
        .time{ display:inline-flex; align-items:center; gap: 8px; font-weight: 900; }
        .time.in{ color: #059669; }
        .time.out{ color: #ef4444; }
        .hours strong{ font-size: 14px; }
        .hours small{ color: var(--muted); font-weight: 900; }

        .muted{ color: var(--muted); font-weight: 800; }

        .pill{
          display:inline-flex; align-items:center; gap: 6px;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 950;
          text-transform: uppercase;
          letter-spacing: .5px;
          border: 1px solid rgba(226,232,240,0.9);
          background: #f8fafc;
          color: #0f172a;
          white-space: nowrap;
        }
        .pill-ic{ font-size: 12px; }

        .pill-present, .pill-completed{
          background: #dcfce7; color: #065f46; border-color: #bbf7d0;
        }
        .pill-halfday{
          background: #fef3c7; color: #92400e; border-color: #fde68a;
        }
        .pill-on-break{
          background: #e0f2fe; color: #075985; border-color: #bae6fd;
        }
        .pill-absent{
          background: #fee2e2; color: #991b1b; border-color: #fecaca;
        }

        /* ✅ Added (same palette) */
        .pill-wfh{
          background:#e0f2fe; color:#075985; border-color:#bae6fd;
        }
        .pill-paid-leave{
          background:#dcfce7; color:#065f46; border-color:#bbf7d0;
        }
        .pill-unpaid-leave{
          background:#fee2e2; color:#991b1b; border-color:#fecaca;
        }
        .pill-holiday{
          background:#f1f5f9; color:#0f172a; border-color:#e2e8f0;
        }

        .textcell{ display:flex; align-items:center; justify-content:space-between; gap: 10px; }
        .textcell-main{ color: rgba(15,23,42,0.88); font-weight: 800; }
        .linkbtn{
          border:none; background: transparent;
          color: var(--brand2);
          font-weight: 950;
          cursor: pointer;
          padding: 0;
          white-space: nowrap;
        }

        .mapLink{
          display:inline-flex; align-items:center; gap: 8px;
          text-decoration: none;
          font-weight: 950;
          color: #0f172a;
          background: #f1f5f9;
          border: 1px solid rgba(226,232,240,0.9);
          padding: 7px 10px;
          border-radius: 12px;
          white-space: nowrap;
        }
        .mapLink:hover{ filter: brightness(0.98); }

        .btn{
          border:none;
          border-radius: 14px;
          padding: 10px 12px;
          font-weight: 950;
          cursor:pointer;
          display:inline-flex; align-items:center; gap: 10px;
          white-space: nowrap;
        }
        .btn:disabled{ opacity: 0.6; cursor: not-allowed; }
        .btn-ghost{
          background: #fff;
          border: 1px solid var(--border);
          color: var(--text);
          box-shadow: 0 8px 18px rgba(2,6,23,0.03);
        }
        .btn-solid{
          background: var(--brand);
          color: #fff;
          box-shadow: 0 12px 22px rgba(16,185,129,0.15);
        }
        .btn-warning{
          background: var(--warn);
          color:#fff;
          box-shadow: 0 12px 22px rgba(245,158,11,0.18);
        }
        .btn-success{
          background: var(--ok);
          color:#fff;
          box-shadow: 0 12px 22px rgba(16,185,129,0.18);
        }
        .btn-ic{ display:inline-flex; }

        .overlay{
          position: fixed; inset:0;
          background: rgba(2,6,23,0.55);
          backdrop-filter: blur(5px);
          display:grid; place-items:center;
          z-index: 999;
          padding: 14px;
        }
        .modal{
          width: 100%;
          max-width: 720px;
          background: #fff;
          border-radius: 22px;
          border: 1px solid rgba(226,232,240,0.9);
          box-shadow: 0 30px 70px rgba(0,0,0,0.20);
          overflow: hidden;
        }
        .mHead{
          display:flex; justify-content:space-between; align-items:flex-start;
          padding: 16px 16px;
          border-bottom: 1px solid rgba(241,245,249,0.95);
          background: rgba(248,250,252,0.9);
        }
        .mTitle{ font-weight: 950; font-size: 16px; }
        .mSub{ margin-top: 4px; color: var(--muted); font-weight: 800; font-size: 12px; }
        .xbtn{
          border:none;
          background: #fff;
          border: 1px solid rgba(226,232,240,0.9);
          border-radius: 12px;
          width: 40px; height: 40px;
          display:grid; place-items:center;
          cursor: pointer;
        }
        .mBody{ padding: 16px; }
        .pre{
          margin: 0;
          white-space: pre-wrap;
          word-break: break-word;
          background: #0b1220;
          color: #e5e7eb;
          padding: 14px;
          border-radius: 16px;
          font-size: 13px;
          line-height: 1.5;
        }
        .mFoot{
          display:flex; justify-content:flex-end;
          gap: 10px;
          padding: 14px 16px;
          border-top: 1px solid rgba(241,245,249,0.95);
        }

        .spin{ animation: spin 1s linear infinite; }
        @keyframes spin{ to{ transform: rotate(360deg); } }

        @media (max-width: 980px){
          .cards{ grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .bkBtns{ width: 100%; }
          .btn{ width: 100%; justify-content:center; }
          .bkBtns{ display:grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        }
        @media (max-width: 520px){
          .page{ padding: 14px; }
          .head{ align-items: flex-start; flex-direction: column; }
          .head-right{ width: 100%; }
          .bkBtns{ grid-template-columns: 1fr; }
          .toggle{ width: 100%; }
          .count{ width: 100%; text-align: right; }
        }

        .slide-up{ animation: slideUp .45s ease-out; }
        @keyframes slideUp{
          from{ opacity:0; transform: translateY(16px); }
          to{ opacity:1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Attendance;

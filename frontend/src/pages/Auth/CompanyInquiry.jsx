import React, { useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaUserTie,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaCheckCircle,
  FaSearch,
  FaClock,
  FaDotCircle,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from "@react-google-maps/api";
import { submitInquiry } from "../../services/api";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_KEY || "";
const libraries = ["places"];

const mapContainerStyle = {
  width: "100%",
  height: "300px",
  borderRadius: "10px",
  marginTop: "15px",
  border: "1px solid #d1d5db",
};

const defaultCenter = { lat: 18.5204, lng: 73.8567 }; // Pune

const TIMEZONE_OPTIONS = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Bangkok",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
  "Australia/Perth",
];

const CompanyInquiry = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const tz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    } catch {
      return "Asia/Kolkata";
    }
  }, []);

  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    mobile: "",
    address: "",
    lat: "",
    lng: "",
    radius: 200,
    timeZone: TIMEZONE_OPTIONS.includes(tz) ? tz : "Asia/Kolkata",
    officeStartTime: "09:30",
    officeEndTime: "18:30",
  });

  const setField = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const [map, setMap] = useState(null);
  const [autocomplete, setAutocomplete] = useState(null);

  const [markerPos, setMarkerPos] = useState(defaultCenter);

  const onLoad = useCallback((m) => setMap(m), []);
  const onUnmount = useCallback(() => setMap(null), []);

  const onPlaceChanged = () => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    if (!place?.geometry) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || form.address;

    setMarkerPos({ lat, lng });
    if (map) map.panTo({ lat, lng });

    setForm((prev) => ({ ...prev, lat, lng, address }));
    toast.success("Location Selected from Map! 📍");
  };

  const onMarkerDragEnd = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPos({ lat, lng });
    setForm((prev) => ({ ...prev, lat, lng }));
  };

  const validate = () => {
    if (!form.companyName || !form.contactPerson || !form.email || !form.mobile) {
      toast.warning("⚠️ Please fill all required fields.");
      return false;
    }

    if (!form.officeStartTime || !form.officeEndTime) {
      toast.warning("⚠️ Please set Office Start & End time.");
      return false;
    }

    if (form.officeEndTime <= form.officeStartTime) {
      toast.warning("⚠️ End time should be greater than start time.");
      return false;
    }

    if (!form.radius || Number(form.radius) < 50 || Number(form.radius) > 5000) {
      toast.warning("⚠️ Please enter radius between 50 and 5000 meters.");
      return false;
    }

    if (!form.lat || !form.lng) {
      toast.warning("⚠️ Please select office location on map OR enter coordinates.");
      return false;
    }

    if (!form.address) {
      toast.warning("⚠️ Please enter Full Address.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const latNum = Number(form.lat);
      const lngNum = Number(form.lng);
      const radiusNum = Number(form.radius);

      const payload = {
        // existing (backward safe)
        companyName: form.companyName,
        contactPerson: form.contactPerson,
        email: form.email,
        mobile: form.mobile,
        address: form.address,
        lat: latNum,
        lng: lngNum,
        radius: radiusNum,

        // ✅ NEW backend friendly objects
        location: {
          address: form.address,
          lat: latNum,
          lng: lngNum,
          radius: radiusNum,
        },
        officeTiming: {
          startTime: form.officeStartTime,
          endTime: form.officeEndTime,
          timeZone: form.timeZone,
        },

        // optional mirror
        timeZone: form.timeZone,
        officeStartTime: form.officeStartTime,
        officeEndTime: form.officeEndTime,
      };

      await submitInquiry(payload);

      toast.success("Inquiry Submitted Successfully! 🚀");
      setTimeout(() => navigate("/"), 1200);
    } catch (error) {
      const msg = error?.response?.data?.message || "Server Error. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const mapsProblem = !GOOGLE_MAPS_API_KEY || !!loadError;

  return (
    <div className="inquiry-page">
      <div className="inquiry-card slide-up">
        <div className="form-header">
          <div className="icon-badge">
            <FaBuilding />
          </div>
          <h2>Partner with SmartHRMS</h2>
          <p>Digitize your workforce with AI-powered Attendance & Payroll.</p>
        </div>

        <form onSubmit={handleSubmit} className="form-content">
          <div className="input-row">
            <div className="field-group">
              <label>Company Name</label>
              <div className="input-wrap">
                <FaBuilding className="field-icon" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Tech Solutions Pvt Ltd"
                  value={form.companyName}
                  onChange={(e) => setField("companyName", e.target.value)}
                />
              </div>
            </div>

            <div className="field-group">
              <label>Contact Person</label>
              <div className="input-wrap">
                <FaUserTie className="field-icon" />
                <input
                  type="text"
                  required
                  placeholder="Full Name"
                  value={form.contactPerson}
                  onChange={(e) => setField("contactPerson", e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="input-row">
            <div className="field-group">
              <label>Email Address</label>
              <div className="input-wrap">
                <FaEnvelope className="field-icon" />
                <input
                  type="email"
                  required
                  placeholder="hr@company.com"
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                />
              </div>
            </div>

            <div className="field-group">
              <label>Mobile Number</label>
              <div className="input-wrap">
                <FaPhone className="field-icon" />
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={form.mobile}
                  onChange={(e) => setField("mobile", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Office Timing */}
          <div className="timing-box">
            <div className="box-header">
              <label>
                <FaClock /> Set Office Timing
              </label>
              <span className="status-badge info">Required</span>
            </div>

            <div className="timing-grid">
              <div className="field-group">
                <label>Office Start Time</label>
                <div className="input-wrap noIcon">
                  <input
                    type="time"
                    value={form.officeStartTime}
                    onChange={(e) => setField("officeStartTime", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Office End Time</label>
                <div className="input-wrap noIcon">
                  <input
                    type="time"
                    value={form.officeEndTime}
                    onChange={(e) => setField("officeEndTime", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="field-group">
                <label>
                  <FaDotCircle /> Attendance Radius (meters)
                </label>
                <div className="input-wrap noIcon">
                  <input
                    type="number"
                    min="50"
                    max="5000"
                    value={form.radius}
                    onChange={(e) => setField("radius", Number(e.target.value || 0))}
                    required
                  />
                </div>
                <small className="hint">Used for geo-fencing during punch-in/out.</small>
              </div>

              <div className="field-group">
                <label>Office Time Zone</label>
                <div className="input-wrap noIcon">
                  <select value={form.timeZone} onChange={(e) => setField("timeZone", e.target.value)} required>
                    {TIMEZONE_OPTIONS.map((z) => (
                      <option key={z} value={z}>
                        {z}
                      </option>
                    ))}
                  </select>
                </div>
                <small className="hint">Auto-selected. You can change.</small>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="location-box">
            <div className="box-header">
              <label>
                <FaMapMarkerAlt /> Set Office Location
              </label>
              {form.lat && form.lng ? (
                <span className="status-badge success">
                  <FaCheckCircle /> Selected
                </span>
              ) : (
                <span className="status-badge warn">Required</span>
              )}
            </div>

            {/* Map section */}
            {mapsProblem ? (
              <div className="map-warning">
                Google Maps not available (missing/invalid key). You can still submit by entering coordinates below.
              </div>
            ) : isLoaded ? (
              <div className="map-wrapper">
                <Autocomplete onLoad={(a) => setAutocomplete(a)} onPlaceChanged={onPlaceChanged}>
                  <div className="input-wrap search-wrap">
                    <FaSearch className="field-icon" />
                    <input type="text" placeholder="Search office address..." className="map-search-input" />
                  </div>
                </Autocomplete>

                <GoogleMap mapContainerStyle={mapContainerStyle} center={markerPos} zoom={15} onLoad={onLoad} onUnmount={onUnmount}>
                  <Marker position={markerPos} draggable={true} onDragEnd={onMarkerDragEnd} />
                </GoogleMap>

                <div className="lat-lng-display">
                  <small>
                    Coords: {Number(markerPos.lat).toFixed(6)}, {Number(markerPos.lng).toFixed(6)}
                  </small>
                </div>
              </div>
            ) : (
              <div className="map-loading">Loading Google Maps...</div>
            )}

            {/* Manual coords inputs (kept, not removing anything) */}
            <div className="input-row" style={{ marginTop: 12 }}>
              <div className="field-group">
                <label>Latitude</label>
                <div className="input-wrap noIcon">
                  <input
                    type="number"
                    step="0.000001"
                    value={form.lat}
                    onChange={(e) => setField("lat", e.target.value)}
                    placeholder="18.520400"
                    required
                  />
                </div>
              </div>
              <div className="field-group">
                <label>Longitude</label>
                <div className="input-wrap noIcon">
                  <input
                    type="number"
                    step="0.000001"
                    value={form.lng}
                    onChange={(e) => setField("lng", e.target.value)}
                    placeholder="73.856700"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="field-group full-width-field">
              <label>Full Address</label>
              <div className="input-wrap">
                <textarea
                  required
                  rows="2"
                  placeholder="Address will auto-fill from map..."
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                />
              </div>
            </div>
          </div>

          <button className="btn-submit" disabled={loading}>
            {loading ? "Processing..." : (
              <>
                <FaPaperPlane /> Submit Application
              </>
            )}
          </button>

          <div className="secure-badge">
            <FaLock /> Secure 256-bit SSL Encrypted
          </div>
        </form>
      </div>

      <style>{`
        :root {
          --primary: #10b981;
          --primary-dark: #059669;
          --bg-page: #f3f4f6;
          --card-bg: #ffffff;
          --text-main: #111827;
          --text-sec: #4b5563;
          --border: #d1d5db;
          --input-bg: #ffffff;
        }

        .inquiry-page {
          min-height: 100vh;
          background: var(--bg-page);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 15px;
          font-family: 'Segoe UI', sans-serif;
        }

        .inquiry-card {
          background: var(--card-bg);
          width: 100%;
          max-width: 760px;
          border-radius: 14px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
          overflow: hidden;
          border: 1px solid #e5e7eb;
          padding: 40px;
        }

        .form-header { text-align: center; margin-bottom: 32px; }
        .icon-badge {
          width: 64px; height: 64px;
          background: #ecfdf5;
          color: var(--primary);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.8rem;
          margin: 0 auto 14px;
          box-shadow: 0 10px 20px rgba(16,185,129,0.12);
        }
        .form-header h2 { margin: 0 0 8px; color: var(--text-main); font-size: 1.85rem; font-weight: 900; }
        .form-header p { margin: 0; color: var(--text-sec); font-size: 1rem; }

        .form-content { display: flex; flex-direction: column; gap: 18px; }
        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .field-group { display: flex; flex-direction: column; gap: 6px; }

        label { font-size: 0.9rem; font-weight: 800; color: var(--text-main); }
        .hint { color: #6b7280; font-size: 0.78rem; margin-top: 2px; }

        .input-wrap { position: relative; }
        .input-wrap input, textarea, select {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 1rem;
          color: var(--text-main);
          background: var(--input-bg);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .input-wrap.noIcon input,
        .input-wrap.noIcon select { padding-left: 12px; }

        textarea { padding-left: 15px; resize: none; font-family: inherit; }

        .input-wrap input:focus, textarea:focus, select:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(16,185,129,0.12);
        }

        .field-icon {
          position: absolute; left: 14px; top: 50%;
          transform: translateY(-50%);
          color: #6b7280; font-size: 1rem;
        }

        .timing-box {
          background: #f9fafb;
          padding: 18px;
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-top: 6px;
        }
        .timing-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 12px;
        }

        .location-box {
          background: #f9fafb;
          padding: 18px;
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-top: 8px;
        }
        .box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .box-header label { display:flex; align-items:center; gap:8px; font-size: 0.95rem; }

        .status-badge {
          font-size: 0.75rem; padding: 4px 10px; border-radius: 20px;
          font-weight: 900; display:flex; align-items:center; gap:6px;
        }
        .success { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
        .warn { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }
        .info { background:#e0f2fe; color:#075985; border: 1px solid #38bdf8; }

        .map-wrapper { margin-bottom: 12px; }
        .search-wrap input { background: #fff; }
        .lat-lng-display { text-align: right; margin-top: 5px; color: #6b7280; font-size: 0.85rem; }
        .map-loading {
          height: 300px; display:flex; align-items:center; justify-content:center;
          background:#e5e7eb; border-radius: 10px; color:#6b7280; font-weight: 800;
        }
        .map-warning{
          height: 120px;
          display:flex;
          align-items:center;
          justify-content:center;
          border-radius: 10px;
          background: #fff7ed;
          color: #9a3412;
          border: 1px solid #fed7aa;
          font-weight: 900;
          text-align: center;
          padding: 12px;
        }

        .full-width-field { margin-top: 14px; width: 100%; }

        .btn-submit {
          width: 100%; padding: 14px;
          background: var(--primary); color: white;
          border: none; border-radius: 12px;
          font-size: 1.05rem; font-weight: 900;
          cursor: pointer; display:flex; align-items:center; justify-content:center; gap:10px;
          transition: transform 0.2s, background 0.2s;
          margin-top: 4px;
          box-shadow: 0 14px 30px rgba(16,185,129,0.18);
        }
        .btn-submit:hover { background: var(--primary-dark); transform: translateY(-1px); }
        .btn-submit:disabled { background: #9ca3af; cursor: not-allowed; transform: none; box-shadow:none; }

        .secure-badge {
          text-align:center; color:#6b7280; font-size: 0.85rem; margin-top: 16px;
          display:flex; align-items:center; justify-content:center; gap:6px; font-weight: 700;
        }

        .slide-up { animation: slideUp 0.35s ease-out; }
        @keyframes slideUp { from { opacity:0; transform: translateY(20px);} to { opacity:1; transform: translateY(0);} }

        @media(max-width: 600px){
          .inquiry-card { padding: 24px 18px; }
          .input-row { grid-template-columns: 1fr; gap: 14px; }
          .timing-grid { grid-template-columns: 1fr; }
          .form-header h2 { font-size: 1.55rem; }
        }
      `}</style>
    </div>
  );
};

export default CompanyInquiry;

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
          <div className="pro-icon-container">
            <div className="pro-icon-box">
              <FaBuilding className="pro-icon" />
            </div>
            <div className="pro-icon-ring"></div>
            <div className="pro-icon-glow"></div>
          </div>
          <h2>Partner with WorknAi</h2>
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
          <div className="timing-box glass-inner">
            <div className="box-header">
              <label>
                <FaClock className="accent-icon" /> Set Office Timing
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
          <div className="location-box glass-inner">
            <div className="box-header">
              <label>
                <FaMapMarkerAlt className="accent-icon" /> Set Office Location
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
        .inquiry-page {
          width: 100%;
          min-height: 100vh;
          background: radial-gradient(circle at top left, #0a0f2b 0%, #050714 50%, #080d1e 100%);
          padding: 120px 20px 100px; /* Ample padding for top and bottom */
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #fff;
          box-sizing: border-box;
          overflow-x: hidden;
        }

        .inquiry-card {
          width: 100%;
          max-width: 860px;
          margin: 0 auto;
          background: rgba(8, 13, 30, 0.75); 
          border-radius: 32px;
          padding: 60px 50px; 
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(80, 150, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.1);
          position: relative;
        }

        /* Fixed Autocomplete results visibility */
        .pac-container {
          z-index: 99999 !important;
          background: #111827 !important;
          border: 1px solid #374151 !important;
          font-family: inherit !important;
          border-radius: 12px !important;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
        }

        .form-header { text-align: center; margin-bottom: 45px; }

        .pro-icon-container {
          position: relative;
          width: 90px;
          height: 90px;
          margin: 0 auto 25px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pro-icon-box {
          width: 70px;
          height: 70px;
          border-radius: 20px;
          background: linear-gradient(135deg, rgba(80, 200, 255, 0.1), rgba(167, 139, 250, 0.1));
          border: 1px solid rgba(80, 200, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
        }

        .pro-icon {
          font-size: 32px;
          color: #50c8ff;
          filter: drop-shadow(0 0 8px rgba(80, 200, 255, 0.5));
        }

        .pro-icon-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px dashed rgba(80, 200, 255, 0.2);
          border-radius: 28px;
          animation: spinRing 20s linear infinite;
        }

        .pro-icon-glow {
          position: absolute;
          width: 60px;
          height: 60px;
          background: #50c8ff;
          filter: blur(40px);
          opacity: 0.2;
          z-index: 1;
        }

        @keyframes spinRing { to { transform: rotate(360deg); } }

        .form-header h2 { 
          margin: 0 0 12px; font-size: 2.6rem; font-weight: 900; 
          background: linear-gradient(90deg, #50c8ff, #a78bfa, #e879f9);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .form-header p { color: rgba(255,255,255,0.6); font-size: 1.15rem; }

        .form-content { display: flex; flex-direction: column; gap: 28px; }
        .input-row { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
        
        .field-group { display: flex; flex-direction: column; gap: 10px; }
        .field-group label { font-size: 0.95rem; font-weight: 600; color: rgba(255,255,255,0.6); margin-left: 4px; }

        .input-wrap { position: relative; }
        .input-wrap input, textarea, select {
          width: 100%; padding: 16px 16px 16px 52px;
          border: 1px solid rgba(255,255,255,0.12); border-radius: 16px;
          font-size: 1rem; color: #fff; background: rgba(255,255,255,0.05);
          transition: all 0.3s ease; box-sizing: border-box;
        }
        .input-wrap.noIcon input, .input-wrap.noIcon select { padding-left: 20px; }

        .field-icon { position: absolute; left: 18px; top: 52%; transform: translateY(-50%); color: #50c8ff; font-size: 1.2rem; }

        .glass-inner {
          background: rgba(255, 255, 255, 0.03); padding: 30px;
          border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 24px;
        }

        .box-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; }
        .box-header label { font-size: 1.15rem; color: #fff; display: flex; align-items: center; gap: 10px; margin: 0; }

        .timing-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 24px;
        }

        .map-section { margin: 20px 0; border-radius: 18px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1); }
        .map-search-input { margin-bottom: 12px !important; }

        .btn-submit {
          width: 100%; padding: 20px; border-radius: 18px; font-size: 1.2rem; font-weight: 850;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
          color: #fff; border: none; cursor: pointer; transition: all 0.3s ease; margin-top: 15px;
          box-shadow: 0 20px 50px rgba(139, 92, 246, 0.3);
        }
        .btn-submit:hover { transform: translateY(-3px); box-shadow: 0 25px 60px rgba(139, 92, 246, 0.5); }

        .secure-badge { margin-top: 25px; display: flex; align-items: center; justify-content: center; gap: 10px; color: rgba(255,255,255,0.4); font-size: 0.9rem; }

        @media (max-width: 860px) {
          .inquiry-card { max-width: 95%; padding: 40px 25px; }
          .input-row { grid-template-columns: 1fr; gap: 20px; }
          .timing-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .inquiry-page { padding: 80px 15px 60px; }
          .form-header h2 { font-size: 1.8rem; }
          .form-header p { font-size: 1rem; }
          .glass-inner { padding: 20px 15px; }
        }

        @media (max-width: 480px){
          .inquiry-card { 
            padding: 30px 18px; 
            border-radius: 24px; 
          }
          .glass-inner { padding: 18px 15px; }
          .form-header h2 { font-size: 1.5rem; }
          .form-header p { font-size: 0.95rem; }
          .pro-icon-container { width: 75px; height: 75px; }
          .pro-icon-box { width: 60px; height: 60px; }
          .pro-icon { font-size: 24px; }
        }
      `}</style>
    </div>
  );
};

export default CompanyInquiry;

import React, { useState } from "react";
import API from "../../services/api";
import { toast } from "react-toastify";
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaPaperPlane,
  FaUserTie,
  FaEnvelope,
  FaPhone,
  FaLock,
  FaSyncAlt,
  FaCheckCircle,
  FaMapPin,
  FaGlobe
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const CompanyInquiry = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const [form, setForm] = useState({
    companyName: "",
    contactPerson: "",
    email: "",
    mobile: "",
    address: "",
    lat: "",
    lng: ""
  });

  /* ---------------- GPS HANDLER ---------------- */
  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGpsLoading(true);
    toast.info("📍 Detecting Location...");

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const success = (pos) => {
      setForm((prev) => ({
        ...prev,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      }));
      setGpsLoading(false);
      toast.success("Location Locked Successfully! ✅");
    };

    const error = (err) => {
      setGpsLoading(false);
      console.error(err);
      if (err.code === 1) toast.error("Permission Denied. Please enter coordinates manually.");
      else if (err.code === 3) toast.error("GPS Timeout. Please enter coordinates manually.");
      else toast.error("Location Error. Please enter coordinates manually.");
    };

    navigator.geolocation.getCurrentPosition(success, error, options);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!form.lat || !form.lng) {
      if(!window.confirm("⚠️ Coordinates are missing. Attendance features might not work correctly. Submit anyway?")) {
          return;
      }
    }

    setLoading(true);
    try {
      await API.post("/auth/inquiry", form);
      toast.success("Inquiry Submitted Successfully! 🚀");
      setTimeout(() => navigate("/"), 2500);
    } catch (error) {
      const msg = error.response?.data?.message || "Server Error. Please try again.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inquiry-page">
      <div className="inquiry-card slide-up">
        
        {/* HEADER SECTION */}
        <div className="form-header">
          <div className="icon-badge">
            <FaBuilding />
          </div>
          <h2>Partner with SmartHRMS</h2>
          <p>Digitize your workforce with AI-powered Attendance & Payroll.</p>
        </div>

        {/* FORM SECTION */}
        <form onSubmit={handleSubmit} className="form-content">
          
          {/* Row 1 */}
          <div className="input-row">
            <div className="field-group">
              <label>Company Name</label>
              <div className="input-wrap">
                <FaBuilding className="field-icon"/>
                <input 
                  type="text"
                  required 
                  placeholder="e.g. Tech Solutions Pvt Ltd" 
                  value={form.companyName} 
                  onChange={e=>setForm({...form, companyName:e.target.value})} 
                />
              </div>
            </div>
            <div className="field-group">
              <label>Contact Person</label>
              <div className="input-wrap">
                <FaUserTie className="field-icon"/>
                <input 
                  type="text"
                  required 
                  placeholder="Full Name" 
                  value={form.contactPerson} 
                  onChange={e=>setForm({...form, contactPerson:e.target.value})} 
                />
              </div>
            </div>
          </div>

          {/* Row 2 */}
          <div className="input-row">
            <div className="field-group">
              <label>Email Address</label>
              <div className="input-wrap">
                <FaEnvelope className="field-icon"/>
                <input 
                  type="email" 
                  required 
                  placeholder="hr@company.com" 
                  value={form.email} 
                  onChange={e=>setForm({...form, email:e.target.value})} 
                />
              </div>
            </div>
            <div className="field-group">
              <label>Mobile Number</label>
              <div className="input-wrap">
                <FaPhone className="field-icon"/>
                <input 
                  type="tel" 
                  required 
                  placeholder="+91 98765 43210" 
                  value={form.mobile} 
                  onChange={e=>setForm({...form, mobile:e.target.value})} 
                />
              </div>
            </div>
          </div>

          {/* Location Section */}
          <div className="location-box">
            <div className="box-header">
              <label><FaMapMarkerAlt /> Office Location</label>
              {form.lat && form.lng ? 
                <span className="status-badge success"><FaCheckCircle/> Locked</span> : 
                <span className="status-badge warn">Required</span>
              }
            </div>
            
            <textarea 
              required 
              rows="2" 
              placeholder="Enter full physical office address..." 
              value={form.address} 
              onChange={e=>setForm({...form, address:e.target.value})} 
            />

            <div className="geo-row">
              <div className="geo-input">
                  <label>Latitude</label>
                  <div className="input-wrap small">
                      <FaGlobe className="field-icon small-icon"/>
                      <input 
                        type="number" 
                        step="any" 
                        placeholder="0.0000" 
                        value={form.lat} 
                        onChange={e=>setForm({...form, lat:e.target.value})} 
                      />
                  </div>
              </div>
              <div className="geo-input">
                  <label>Longitude</label>
                  <div className="input-wrap small">
                      <FaGlobe className="field-icon small-icon"/>
                      <input 
                        type="number" 
                        step="any" 
                        placeholder="0.0000" 
                        value={form.lng} 
                        onChange={e=>setForm({...form, lng:e.target.value})} 
                      />
                  </div>
              </div>
            </div>

            <button type="button" className="btn-gps" onClick={getLocation} disabled={gpsLoading}>
              {gpsLoading ? <FaSyncAlt className="spin"/> : <FaMapPin/>} 
              {gpsLoading ? " Detecting..." : " Auto-Detect Location"}
            </button>
          </div>

          <button className="btn-submit" disabled={loading}>
            {loading ? "Processing..." : <><FaPaperPlane /> Submit Application</>}
          </button>

          <div className="secure-badge">
            <FaLock /> Secure 256-bit SSL Encrypted
          </div>

        </form>
      </div>

      <style>{`
        /* --- CLEAN & VISIBLE COLOR PALETTE --- */
        :root {
            --primary: #10b981;       /* Emerald Green (Trust) */
            --primary-dark: #059669;  /* Darker Green */
            --bg-page: #f3f4f6;       /* Light Grey Background */
            --card-bg: #ffffff;       /* White Card */
            --text-main: #111827;     /* Almost Black (High Contrast) */
            --text-sec: #4b5563;      /* Dark Gray */
            --border: #d1d5db;        /* Light Gray Border */
            --input-bg: #ffffff;
        }

        .inquiry-page {
            min-height: 100vh;
            background: var(--bg-page);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 30px 15px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .inquiry-card {
            background: var(--card-bg);
            width: 100%;
            max-width: 700px; /* Centered width */
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            overflow: hidden;
            border: 1px solid #e5e7eb;
            padding: 40px;
        }

        /* --- HEADER --- */
        .form-header {
            text-align: center;
            margin-bottom: 35px;
        }
        .icon-badge {
            width: 60px; height: 60px; 
            background: #ecfdf5; /* Very light green */
            color: var(--primary);
            border-radius: 50%; 
            display: flex; align-items: center; justify-content: center;
            font-size: 1.8rem; 
            margin: 0 auto 15px;
        }
        .form-header h2 { 
            margin: 0 0 8px; 
            color: var(--text-main); 
            font-size: 1.8rem; 
            font-weight: 700; 
        }
        .form-header p { 
            margin: 0; 
            color: var(--text-sec); 
            font-size: 1rem; 
        }

        /* --- FORM LAYOUT --- */
        .form-content { display: flex; flex-direction: column; gap: 20px; }

        .input-row { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 20px; 
        }
        
        .field-group { display: flex; flex-direction: column; gap: 6px; }
        
        label { 
            font-size: 0.9rem; 
            font-weight: 600; 
            color: var(--text-main); /* High visibility */
        }
        
        .input-wrap { position: relative; }
        
        .input-wrap input, textarea {
            width: 100%; 
            padding: 12px 12px 12px 40px; 
            border: 1px solid var(--border); 
            border-radius: 8px;
            font-size: 1rem; 
            color: var(--text-main); 
            background: var(--input-bg);
            outline: none; 
            transition: border-color 0.2s; 
            box-sizing: border-box;
        }
        textarea { padding-left: 15px; resize: none; font-family: inherit; }
        
        .input-wrap input:focus, textarea:focus { 
            border-color: var(--primary); 
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1); 
        }
        
        .field-icon { 
            position: absolute; 
            left: 14px; 
            top: 50%; 
            transform: translateY(-50%); 
            color: #6b7280; /* Medium Gray Icon */
            font-size: 1rem; 
        }

        /* --- LOCATION BOX --- */
        .location-box { 
            background: #f9fafb; /* Very light gray */
            padding: 20px; 
            border: 1px solid var(--border); 
            border-radius: 10px; 
            margin-top: 10px; 
        }
        .box-header { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 15px; 
        }
        .box-header label { 
            font-size: 0.95rem; 
            display: flex; 
            align-items: center; 
            gap: 8px; 
        }
        
        .status-badge { 
            font-size: 0.75rem; 
            padding: 4px 10px; 
            border-radius: 20px; 
            font-weight: 700; 
            display: flex; 
            align-items: center; 
            gap: 5px; 
        }
        .success { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
        .warn { background: #fee2e2; color: #991b1b; border: 1px solid #ef4444; }

        .geo-row { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
            margin-top: 15px; 
        }
        .input-wrap.small input { padding-left: 35px; font-size: 0.95rem; }
        .small-icon { left: 12px; font-size: 0.9rem; }

        .btn-gps {
            width: 100%; 
            margin-top: 15px; 
            padding: 12px; 
            background: #1f2937; /* Dark Grey Button */
            color: white; 
            border: none; 
            border-radius: 8px; 
            font-weight: 600; 
            font-size: 0.95rem;
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 8px; 
            transition: 0.2s;
        }
        .btn-gps:hover { background: #111827; }

        /* --- SUBMIT BUTTON --- */
        .btn-submit {
            width: 100%; 
            padding: 14px; 
            background: var(--primary); 
            color: white; 
            border: none; 
            border-radius: 8px; 
            font-size: 1.1rem; 
            font-weight: 700; 
            cursor: pointer; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 10px; 
            transition: background 0.2s;
            margin-top: 10px;
        }
        .btn-submit:hover { background: var(--primary-dark); }
        .btn-submit:disabled { background: #9ca3b8; cursor: not-allowed; }

        .secure-badge { 
            text-align: center; 
            color: #6b7280; 
            font-size: 0.85rem; 
            margin-top: 25px; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 6px; 
            font-weight: 500; 
        }

        .spin { animation: spin 1s infinite linear; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .slide-up { animation: slideUp 0.4s ease-out; } 
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

        /* --- RESPONSIVE --- */
        @media (max-width: 600px) {
            .inquiry-page { padding: 15px; }
            .inquiry-card { padding: 25px 20px; }
            .input-row { grid-template-columns: 1fr; gap: 15px; } /* Stack fields on mobile */
            .geo-row { grid-template-columns: 1fr; gap: 10px; }
            .form-header h2 { font-size: 1.5rem; }
        }
      `}</style>
    </div>
  );
};

export default CompanyInquiry;
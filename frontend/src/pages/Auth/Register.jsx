import React, { useState, useEffect, useRef, useMemo } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { toast } from "react-toastify";
import { registerEmployee, getActiveCompanies } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";

import Footer from "../../components/Common/Footer";
import {
  FaCamera,

  FaCheckCircle,
  FaRedo,
  FaIdCard,
  FaUser,
  FaLock,
  FaBuilding,
  FaSpinner,
  FaSyncAlt,
  FaEnvelope,
  FaPhone,
  FaBriefcase,
  FaImage,
  FaUserPlus,
  FaSignInAlt,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import { readEnv } from "../../utils/env";

const Register = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    designation: "",
    companyId: "",
    employmentType: "On-Roll", // Default
  });

  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  const [profileImage, setProfileImage] = useState(null);

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelLoading, setModelLoading] = useState(true);

  const [faceDescriptor, setFaceDescriptor] = useState(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);

  const [facingMode, setFacingMode] = useState("user"); // user / environment
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const MODEL_URL = useMemo(() => {
    return (
      readEnv("VITE_FACE_MODEL_URL") ||
      readEnv("REACT_APP_FACE_MODEL_URL") ||
      "https://justadudewhohacks.github.io/face-api.js/models"
    );
  }, []);

  const videoConstraints = useMemo(() => ({ facingMode }), [facingMode]);

  const loadModels = async () => {
    setModelLoading(true);
    setModelsLoaded(false);
    try {
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      setModelsLoaded(true);
    } catch (err) {
      console.error(err);
      toast.error("Face models failed to load. Check internet / model URL.");
      setModelsLoaded(false);
    } finally {
      setModelLoading(false);
    }
  };

  const loadCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const res = await getActiveCompanies();
      const data = res?.data;

      const list =
        Array.isArray(data) ? data :
          Array.isArray(data?.companies) ? data.companies :
            Array.isArray(data?.data) ? data.data : [];

      setCompanies(list);
    } catch (err) {
      console.error(err);
      toast.error("Unable to load companies list.");
      setCompanies([]);
    } finally {
      setCompaniesLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MODEL_URL]);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setProfileImage(file);
  };

  const handleFaceScan = async () => {
    if (!modelsLoaded) return toast.warning("Models loading… please wait.");
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return toast.error("Camera capture failed");

    const img = new Image();
    img.src = imageSrc;

    img.onload = async () => {
      try {
        const detection = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (!detection) {
          toast.error("No face detected. Keep face centered & good lighting.");
          return;
        }

        setFaceDescriptor(Array.from(detection.descriptor));
        setScannedImage(imageSrc);
        setIsCameraOpen(false);
        toast.success("Biometrics Captured ✅");
      } catch (e) {
        toast.error("Face scan error");
      }
    };
  };

  const resetFace = () => {
    setScannedImage(null);
    setFaceDescriptor(null);
    setIsCameraOpen(true);
  };

  const validate = () => {
    if (!formData.companyId) return toast.warning("Please select your Company"), false;
    if (!faceDescriptor) return toast.warning("Face Scan is mandatory"), false;
    if (!profileImage) return toast.warning("Profile Photo is required"), false;

    if ((formData.password || "").length < 6) {
      toast.warning("Password must be at least 6 characters");
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
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));

      // backend expected fields
      data.append("image", profileImage);
      data.append("faceDescriptor", JSON.stringify(faceDescriptor));

      await registerEmployee(data);

      toast.success("Registration Successful! Please Login.");
      navigate("/employee-login");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-page">
      <div className="auth-hero-section">
        <div className="reg-container">
          <header className="reg-header">
            <div className="pro-icon-container">
              <div className="pro-icon-box">
                <FaUserPlus className="pro-icon" />
              </div>
              <div className="pro-icon-ring"></div>
              <div className="pro-icon-glow"></div>
            </div>
            <h1>Employee Onboarding</h1>
            <p>Secure Biometric Registration</p>
          </header>

          {/* STEP 1: BIOMETRICS */}
          <section className="reg-section">
            <h3>
              <FaIdCard /> 1. Face Identity
            </h3>

            {modelLoading ? (
              <div className="model-loading">
                <FaSpinner className="spin" /> Loading AI Models…
              </div>
            ) : !modelsLoaded ? (
              <div className="model-loading bad" style={{ flexDirection: "column", gap: 10 }}>
                <div>
                  Face models not loaded. Set <b>VITE_FACE_MODEL_URL</b> / <b>REACT_APP_FACE_MODEL_URL</b> or check internet.
                </div>
                <button type="button" className="retry-btn" onClick={loadModels}>
                  Retry Models
                </button>
              </div>
            ) : scannedImage ? (
              <div className="preview-mode">
                <img src={scannedImage} alt="Scanned" />
                <div className="preview-actions">
                  <button type="button" onClick={resetFace}>
                    <FaRedo /> Rescan
                  </button>
                  <span className="status-ok">
                    <FaCheckCircle /> Captured
                  </span>
                </div>
              </div>
            ) : isCameraOpen ? (
              <div className="cam-wrapper">
                <div className="cam-top">
                  <div className="cam-hint">Tip: Keep face centered & remove mask for best match.</div>
                  <button
                    type="button"
                    className="swap-btn"
                    onClick={() => setFacingMode((m) => (m === "user" ? "environment" : "user"))}
                  >
                    <FaSyncAlt /> Switch Camera
                  </button>
                </div>

                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  className="webcam-feed"
                  videoConstraints={videoConstraints}
                />

                <button type="button" onClick={handleFaceScan} className="scan-btn">
                  <FaCamera /> Capture Face
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setIsCameraOpen(true)} className="start-cam-btn">
                <FaCamera /> Start Camera
              </button>
            )}
          </section>

          {/* STEP 2: DETAILS */}
          <form onSubmit={handleSubmit} className="reg-form">
            <h3>
              <FaUser /> 2. Personal Details
            </h3>

            <div className="form-group">
              <label>
                <FaBuilding /> Select Company
              </label>
              <select name="companyId" value={formData.companyId} onChange={handleChange} required disabled={companiesLoading}>
                <option value="">{companiesLoading ? "Loading companies..." : "-- Choose Your Organization --"}</option>
                {companies.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
                    {c.name || c.companyName}
                  </option>
                ))}
              </select>
              {!companiesLoading && companies.length === 0 ? (
                <div style={{ marginTop: 8, fontSize: 12, color: "#b91c1c", fontWeight: 700 }}>
                  No active companies available right now.
                </div>
              ) : null}
            </div>

            <div className="input-grid">
              <div className="form-group">
                <label><FaUser /> Full Name</label>
                <input name="name" placeholder="John Doe" onChange={handleChange} value={formData.name} required />
              </div>
              <div className="form-group">
                <label><FaEnvelope /> Official Email</label>
                <input name="email" type="email" placeholder="john@company.com" onChange={handleChange} value={formData.email} required />
              </div>
              <div className="form-group">
                <label><FaPhone /> Mobile Number</label>
                <input name="mobile" placeholder="+91 98765 43210" onChange={handleChange} value={formData.mobile} required />
              </div>
              <div className="form-group">
                <label><FaBriefcase /> Job Role</label>
                <input name="designation" placeholder="Software Engineer" onChange={handleChange} value={formData.designation} required />
              </div>

              <div className="form-group">
                <label><FaUser /> Employment Type</label>
                <select name="employmentType" value={formData.employmentType} onChange={handleChange} required>
                  <option value="On-Roll">On-Roll Employee</option>
                  <option value="Intern">Intern</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>
                <FaLock /> Create Password
              </label>
              <div className="password-wrapper">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  onChange={handleChange}
                  value={formData.password}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label><FaImage /> Profile Photo (For ID Card)</label>
              <input type="file" accept="image/*" onChange={handleFileChange} required />
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Registering..." : "Complete Registration"}
            </button>

            <div className="mini-note">Your face data is stored securely for attendance verification.</div>
          </form>

          <div className="reg-footer">
            Already have an account? <Link to="/employee-login"><FaSignInAlt /> Login Here</Link>
          </div>
        </div>
      </div>
      <Footer />



      <style>{`
        .reg-page {
          min-height: 100vh;
          width: 100%;
          background: #050714;
          font-family: 'Outfit', 'Inter', sans-serif;
          color: #fff;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
          overflow-x: hidden;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
        }

        .auth-hero-section {
          min-height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 100px 20px 40px;
          box-sizing: border-box;
        }

        /* Fixed background captures the whole screen forever */
        .reg-page::before {
          content: "";
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(circle at top left, #0a0f2b 0%, #050714 50%, #080d1e 100%);
          z-index: -1;
          pointer-events: none;
        }

        .reg-container {
          width: 100%; 
          max-width: 680px; 
          background: rgba(8, 13, 30, 0.75); 
          border-radius: 28px;
          padding: 40px 30px; 
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(80, 150, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.08);
          position: relative;
          overflow: hidden;
          margin: auto;
          animation: slideUp 0.8s cubic-bezier(0.165, 0.84, 0.44, 1);
        }

        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }

        .reg-header { text-align: center; margin-bottom: 25px; }

        .pro-icon-container {
          position: relative;
          width: 65px;
          height: 65px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pro-icon-box {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(80, 200, 255, 0.1), rgba(167, 139, 250, 0.1));
          border: 1px solid rgba(80, 200, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          backdrop-filter: blur(10px);
        }

        .pro-icon {
          font-size: 24px;
          color: #50c8ff;
          filter: drop-shadow(0 0 8px rgba(80, 200, 255, 0.5));
        }

        .pro-icon-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border: 2px dashed rgba(80, 200, 255, 0.2);
          border-radius: 18px;
          animation: spinRing 20s linear infinite;
        }

        @keyframes spinRing { to { transform: rotate(360deg); } }

        .reg-header h1 { 
          font-size: 1.8rem; 
          font-weight: 900; 
          margin: 0;
          letter-spacing: -0.5px;
          background: linear-gradient(90deg, #50c8ff 0%, #a78bfa 55%, #e879f9 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .reg-header p { 
          color: rgba(255, 255, 255, 0.6); 
          margin-top: 5px; 
          font-weight: 600; 
          font-size: 0.9rem;
        }

        .reg-section {
          background: rgba(255, 255, 255, 0.03); 
          padding: 20px; 
          border-radius: 18px;
          margin-bottom: 25px; 
          text-align: center; 
          border: 1px solid rgba(80, 200, 255, 0.08);
          box-shadow: inset 0 0 20px rgba(0,0,0,0.1);
        }
        .reg-section h3 {
          margin-top: 0; 
          font-size: 1rem; 
          color: #50c8ff;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px;
          font-weight: 800;
          margin-bottom: 15px;
        }

        .model-loading {
          display: flex; 
          gap: 10px; 
          align-items: center; 
          justify-content: center;
          padding: 12px; 
          background: rgba(80, 200, 255, 0.04); 
          border-radius: 12px; 
          font-weight: 700; 
          color: #50c8ff;
          font-size: 0.85rem;
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .webcam-feed { 
          width: 100%; 
          border-radius: 14px; 
          margin-bottom: 12px; 
          border: 1px solid rgba(80, 200, 255, 0.2);
        }
        .cam-wrapper { display: flex; flex-direction: column; gap: 12px; }
        .cam-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
        .cam-hint { font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 600; }
        .swap-btn {
          border: 1px solid rgba(80, 200, 255, 0.2); 
          background: rgba(80, 200, 255, 0.05); 
          color: #50c8ff;
          padding: 8px 12px; 
          border-radius: 10px; 
          font-weight: 700; 
          font-size: 0.75rem;
          cursor: pointer;
          display: flex; 
          align-items: center; 
          gap: 6px;
        }

        .preview-mode img {
          width: 140px; 
          height: 140px; 
          border-radius: 50%;
          object-fit: cover; 
          border: 3px solid #22c55e;
          display: block; 
          margin: 0 auto 15px;
        }
        .preview-actions { display: flex; align-items: center; justify-content: center; gap: 12px; }
        .preview-actions button {
          border: 1px solid rgba(255, 255, 255, 0.1); 
          background: rgba(255, 255, 255, 0.05); 
          padding: 10px 16px; 
          border-radius: 12px;
          font-weight: 800; 
          font-size: 0.85rem;
          color: #fff;
          display: flex; 
          align-items: center; 
          gap: 8px;
          cursor: pointer;
        }
        .status-ok { font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; color: #22c55e; font-weight: 800; }

        .reg-form h3 {
          font-size: 1rem; 
          color: #a78bfa; 
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding-bottom: 10px; 
          margin-bottom: 20px;
          display: flex; 
          align-items: center; 
          gap: 8px; 
          font-weight: 800;
        }
        .form-group { margin-bottom: 16px; }
        .form-group label {
          display: block; 
          font-size: 0.8rem; 
          font-weight: 700; 
          color: rgba(255, 255, 255, 0.5); 
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        select, input {
          width: 100%; 
          padding: 12px 14px; 
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px; 
          font-size: 0.9rem; 
          outline: none; 
          box-sizing: border-box;
          background: rgba(255, 255, 255, 0.04);
          color: #fff;
          transition: all 0.3s ease;
        }
        select option { background: #080d1e; color: #fff; }
        select:focus, input:focus { 
          border-color: #50c8ff; 
          background: rgba(80, 200, 255, 0.05);
          box-shadow: 0 0 12px rgba(80, 200, 255, 0.12); 
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          cursor: pointer;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
        }

        .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 16px; }

        .start-cam-btn, .scan-btn, .submit-btn {
          width: 100%; 
          padding: 13px; 
          border: none; 
          border-radius: 12px;
          font-weight: 800; 
          cursor: pointer; 
          transition: 0.3s;
          display: flex; 
          align-items: center; 
          justify-content: center; 
          gap: 8px;
          font-size: 0.95rem;
        }
        .start-cam-btn { 
          background: rgba(80, 200, 255, 0.1); 
          color: #50c8ff; 
          border: 1px solid rgba(80, 200, 255, 0.2);
        }
        .scan-btn { 
          background: linear-gradient(135deg, #3b82f6, #8b5cf6); 
          color: #fff; 
          box-shadow: 0 8px 20px rgba(59, 130, 246, 0.2);
        }
        .submit-btn { 
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9); 
          color: #fff; 
          margin-top: 10px;
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.3);
        }
        .submit-btn:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .mini-note { 
          margin-top: 12px; 
          font-size: 0.75rem; 
          color: rgba(255, 255, 255, 0.3); 
          font-weight: 600; 
          text-align: center; 
        }

        .reg-footer { text-align: center; margin-top: 20px; font-size: 0.85rem; color: rgba(255, 255, 255, 0.5); }
        .reg-footer a { 
          color: #a78bfa; 
          font-weight: 800; 
          text-decoration: none; 
          margin-left: 5px;
        }

        @media (max-width: 600px){
          .reg-container { padding: 30px 20px; }
          .input-grid { grid-template-columns: 1fr; gap: 0; }
          .reg-header h1 { font-size: 1.5rem; }
          .pro-icon-container { width: 55px; height: 55px; margin-bottom: 12px; }
          .pro-icon-box { width: 45px; height: 45px; border-radius: 10px; }
          .pro-icon { font-size: 20px; }
          .pro-icon-ring { display: none; }
        }

        /* 320px & Short Viewport Optimization */
        @media(max-width: 335px), (max-height: 700px) {
          .auth-hero-section { padding: 80px 10px 40px; }
          .reg-container { 
            padding: 20px 15px; 
            border-radius: 18px; 
            margin: auto; 
            width: 100%;
            max-width: 300px;
          }
          .reg-header { margin-bottom: 10px; }
          .reg-header h1 { font-size: 1.2rem; }
          .reg-header p { font-size: 0.75rem; margin-top: 2px; }
          .pro-icon-container { width: 40px; height: 40px; margin-bottom: 6px; }
          .pro-icon-box { width: 32px; height: 32px; border-radius: 8px; }
          .pro-icon { font-size: 14px; }
          .reg-section { padding: 12px 10px; margin-bottom: 15px; border-radius: 12px; }
          .reg-section h3, .reg-form h3 { font-size: 0.85rem; margin-bottom: 10px; }
          .webcam-feed { border-radius: 8px; margin-bottom: 8px; }
          .cam-hint { font-size: 0.65rem; }
          .swap-btn { padding: 5px 8px; font-size: 0.65rem; border-radius: 6px; }
          .preview-mode img { width: 100px; height: 100px; margin-bottom: 10px; }
          .preview-actions button { padding: 8px 12px; font-size: 0.75rem; border-radius: 8px; }
          .form-group { margin-bottom: 10px; }
          .form-group label { font-size: 0.7rem; margin-bottom: 4px; }
          select, input { padding: 9px 12px; font-size: 0.8rem; border-radius: 8px; }
          .submit-btn { padding: 10px; font-size: 0.85rem; border-radius: 8px; margin-top: 5px; }
          .reg-footer { margin-top: 10px; font-size: 0.75rem; }
          .mini-note { font-size: 0.65rem; margin-top: 8px; }
        }
      `}</style>
    </div>
  );
};

export default Register;

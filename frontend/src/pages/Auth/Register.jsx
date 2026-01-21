import React, { useState, useEffect, useRef, useMemo } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { toast } from "react-toastify";
import { registerEmployee, getActiveCompanies } from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
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
      <div className="reg-container">
        <header className="reg-header">
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
            <input name="name" placeholder="Full Name" onChange={handleChange} value={formData.name} required />
            <input name="email" type="email" placeholder="Official Email" onChange={handleChange} value={formData.email} required />
            <input name="mobile" placeholder="Mobile Number" onChange={handleChange} value={formData.mobile} required />
            <input name="designation" placeholder="Job Role (e.g. Developer)" onChange={handleChange} value={formData.designation} required />
          </div>

          <div className="form-group">
            <label>
              <FaLock /> Create Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              onChange={handleChange}
              value={formData.password}
              required
            />
          </div>

          <div className="form-group">
            <label>Profile Photo (For ID Card)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} required />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Registering..." : "Complete Registration"}
          </button>

          <div className="mini-note">Your face data is stored securely for attendance verification.</div>
        </form>

        <div className="reg-footer">
          Already have an account? <Link to="/employee-login">Login Here</Link>
        </div>
      </div>

      <style>{`
        .reg-page {
          min-height: 100vh; background: #f8fafc; padding: 40px 20px;
          font-family: 'Inter', sans-serif; display:flex; justify-content:center;
        }
        .reg-container {
          background:#fff; max-width: 680px; width: 100%;
          padding: 40px; border-radius: 22px;
          box-shadow: 0 18px 50px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.06);
        }
        .reg-header { text-align:center; margin-bottom: 26px; }
        .reg-header h1 { font-size: 1.85rem; color:#0f172a; margin:0; font-weight: 950; letter-spacing:-0.4px; }
        .reg-header p { color:#64748b; margin-top: 6px; font-weight: 600; }

        .reg-section {
          background: #f1f5f9; padding: 20px; border-radius: 14px;
          margin-bottom: 26px; text-align:center; border: 1px solid rgba(0,0,0,0.06);
        }
        .reg-section h3 {
          margin-top:0; font-size: 1rem; color:#334155;
          display:flex; align-items:center; justify-content:center; gap: 8px;
          font-weight: 900;
        }

        .model-loading{
          display:flex; gap:10px; align-items:center; justify-content:center;
          padding: 12px; background:#fff; border-radius: 12px; font-weight: 800; color:#334155;
          border: 1px solid rgba(0,0,0,0.06);
        }
        .model-loading.bad{ color:#b91c1c; }
        .retry-btn{
          border:none; background:#fee2e2; color:#991b1b;
          padding: 10px 12px; border-radius: 10px; font-weight: 900; cursor:pointer;
        }
        .spin{ animation: spin 1s linear infinite; }
        @keyframes spin { to{ transform: rotate(360deg);} }

        .webcam-feed { width: 100%; border-radius: 12px; margin-bottom: 10px; border: 4px solid rgba(37,99,235,0.08); }
        .cam-wrapper{ display:flex; flex-direction:column; gap: 10px; }
        .cam-top{ display:flex; justify-content:space-between; align-items:center; gap: 10px; flex-wrap:wrap; }
        .cam-hint{ font-size: 0.82rem; color:#475569; font-weight: 700; }
        .swap-btn{
          border: none; background: #e0f2fe; color:#0284c7;
          padding: 10px 12px; border-radius: 10px; font-weight: 900; cursor:pointer;
          display:flex; align-items:center; gap: 8px;
        }
        .swap-btn:hover{ filter: brightness(0.98); transform: translateY(-1px); }

        .preview-mode img {
          width: 150px; height: 150px; border-radius: 50%;
          object-fit: cover; border: 4px solid #22c55e;
          display:block; margin: 0 auto 14px;
        }
        .preview-actions{ display:flex; align-items:center; justify-content:center; gap: 12px; flex-wrap:wrap; }
        .preview-actions button{
          border:none; background:#fff; padding: 10px 12px; border-radius: 12px;
          font-weight: 900; cursor:pointer; display:flex; align-items:center; gap:8px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
        }
        .status-ok { display:inline-flex; align-items:center; gap: 8px; color:#15803d; font-weight: 900; }

        .reg-form h3 {
          font-size: 1rem; color:#334155; border-bottom: 1px solid #e2e8f0;
          padding-bottom: 10px; margin-bottom: 18px;
          display:flex; align-items:center; gap: 8px; font-weight: 900;
        }
        .form-group { margin-bottom: 14px; }
        .form-group label {
          display:block; font-size: 0.85rem; font-weight: 900; color:#475569; margin-bottom: 6px;
        }

        select, input {
          width: 100%; padding: 12px; border: 1.6px solid #e2e8f0;
          border-radius: 10px; font-size: 0.95rem; outline:none; box-sizing:border-box;
          background:#fff;
        }
        select:focus, input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.10); }

        .input-grid { display:grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }

        .start-cam-btn, .scan-btn, .submit-btn {
          width: 100%; padding: 14px; border:none; border-radius: 12px;
          font-weight: 950; cursor:pointer; transition: 0.2s;
          display:flex; align-items:center; justify-content:center; gap: 10px;
        }
        .start-cam-btn { background: #e0f2fe; color: #0284c7; }
        .scan-btn { background: #2563eb; color: #fff; }
        .submit-btn { background: #0f172a; color:#fff; margin-top: 10px; font-size: 1rem; }
        .submit-btn:hover { transform: translateY(-1px); filter: brightness(1.02); }
        .submit-btn:disabled { background:#94a3b8; cursor:not-allowed; transform:none; }

        .mini-note{ margin-top: 10px; font-size: 0.82rem; color:#64748b; font-weight: 700; text-align:center; }

        .reg-footer { text-align:center; margin-top: 18px; font-size: 0.92rem; color:#64748b; }
        .reg-footer a { color:#2563eb; font-weight: 950; text-decoration:none; }

        @media(max-width: 600px){
          .reg-container{ padding: 24px; border-radius: 0; box-shadow:none; border:none; }
          .input-grid{ grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default Register;

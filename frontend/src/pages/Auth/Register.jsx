import React, { useState, useEffect, useRef } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { toast } from "react-toastify";
import API from "../../services/api";
import { useNavigate, Link } from "react-router-dom";
import {
  FaCamera, FaCheckCircle, FaRedo, FaIdCard,
  FaUser, FaEnvelope, FaPhone, FaBriefcase, FaLock, FaBuilding
} from "react-icons/fa";

const Register = () => {
  const navigate = useNavigate();
  const webcamRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    designation: "",
    companyId: "" // ✅ Now required
  });

  const [companies, setCompanies] = useState([]); // ✅ List of companies
  const [profileImage, setProfileImage] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scannedImage, setScannedImage] = useState(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- 1. LOAD MODELS & COMPANIES ---------------- */
  useEffect(() => {
    const init = async () => {
      try {
        // Load Face Models
        const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);

        // ✅ Fetch Active Companies for Dropdown
        const res = await API.get("/auth/companies");
        setCompanies(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error(err);
        toast.error("System Init Failed: Check connection");
      }
    };
    init();
  }, []);

  /* ---------------- 2. HANDLERS ---------------- */
  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setProfileImage(file);
  };

  /* ---------------- 3. FACE SCAN LOGIC ---------------- */
  const handleFaceScan = async () => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    
    if (!imageSrc) return toast.error("Camera capture failed");

    const img = new Image();
    img.src = imageSrc;
    img.onload = async () => {
      try {
        const detection = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor();
        
        if (!detection) {
          return toast.error("No face detected. Ensure good lighting.");
        }

        setFaceDescriptor(Array.from(detection.descriptor));
        setScannedImage(imageSrc);
        setIsCameraOpen(false);
        toast.success("Biometrics Captured ✅");
      } catch {
        toast.error("Face scan error");
      }
    };
  };

  /* ---------------- 4. SUBMIT REGISTRATION ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.companyId) return toast.warning("Please select your Company");
    if (!faceDescriptor) return toast.warning("Face Scan is mandatory");
    if (!profileImage) return toast.warning("Profile Photo is required");

    setLoading(true);
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([k, v]) => data.append(k, v));
      
      data.append("image", profileImage);
      data.append("faceDescriptor", JSON.stringify(faceDescriptor));

      await API.post("/auth/register", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      toast.success("Registration Successful! Please Login.");
      navigate("/employee-login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration Failed");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="reg-page">
      <div className="reg-container">
        <header className="reg-header">
          <h1>Employee Onboarding</h1>
          <p>Secure Biometric Registration</p>
        </header>

        {/* --- STEP 1: BIOMETRICS --- */}
        <section className="reg-section">
          <h3><FaIdCard /> 1. Face Identity</h3>
          
          {!modelsLoaded ? <p>Loading AI Models...</p> : 
            scannedImage ? (
              <div className="preview-mode">
                <img src={scannedImage} alt="Scanned" />
                <button type="button" onClick={() => { setScannedImage(null); setFaceDescriptor(null); setIsCameraOpen(true); }}>
                  <FaRedo /> Rescan
                </button>
                <span className="status-ok"><FaCheckCircle /> Captured</span>
              </div>
            ) : isCameraOpen ? (
              <div className="cam-wrapper">
                <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="webcam-feed" />
                <button type="button" onClick={handleFaceScan} className="scan-btn">Capture Face</button>
              </div>
            ) : (
              <button type="button" onClick={() => setIsCameraOpen(true)} className="start-cam-btn">
                <FaCamera /> Start Camera
              </button>
            )
          }
        </section>

        {/* --- STEP 2: DETAILS --- */}
        <form onSubmit={handleSubmit} className="reg-form">
          <h3><FaUser /> 2. Personal Details</h3>
          
          <div className="form-group">
            <label><FaBuilding/> Select Company</label>
            <select name="companyId" value={formData.companyId} onChange={handleChange} required>
              <option value="">-- Choose Your Organization --</option>
              {companies.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="input-grid">
            <input name="name" placeholder="Full Name" onChange={handleChange} required />
            <input name="email" type="email" placeholder="Official Email" onChange={handleChange} required />
            <input name="mobile" placeholder="Mobile Number" onChange={handleChange} required />
            <input name="designation" placeholder="Job Role (e.g. Developer)" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label><FaLock/> Create Password</label>
            <input name="password" type="password" placeholder="••••••••" onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Profile Photo (For ID Card)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} required />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? "Registering..." : "Complete Registration"}
          </button>
        </form>

        <div className="reg-footer">
          Already have an account? <Link to="/employee-login">Login Here</Link>
        </div>
      </div>

      <style>{`
        .reg-page { min-height: 100vh; background: #f8fafc; padding: 40px 20px; font-family: 'Inter', sans-serif; display: flex; justify-content: center; }
        .reg-container { background: #fff; max-width: 600px; width: 100%; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .reg-header { text-align: center; margin-bottom: 30px; }
        .reg-header h1 { font-size: 1.8rem; color: #1e293b; margin: 0; }
        .reg-header p { color: #64748b; }

        .reg-section { background: #f1f5f9; padding: 20px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
        .reg-section h3 { margin-top: 0; font-size: 1rem; color: #334155; display: flex; align-items: center; justify-content: center; gap: 8px; }
        
        .webcam-feed { width: 100%; border-radius: 12px; margin-bottom: 10px; }
        .preview-mode img { width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid #22c55e; display: block; margin: 0 auto 15px; }
        .status-ok { display: block; color: #15803d; font-weight: 700; margin-top: 5px; }

        .reg-form h3 { font-size: 1rem; color: #334155; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 5px; }
        
        select, input { width: 100%; padding: 12px; border: 1.5px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; outline: none; box-sizing: border-box; }
        select:focus, input:focus { border-color: #2563eb; }

        .input-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
        
        .start-cam-btn, .scan-btn, .submit-btn { width: 100%; padding: 14px; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; transition: 0.2s; }
        .start-cam-btn { background: #e0f2fe; color: #0284c7; }
        .scan-btn { background: #2563eb; color: #fff; }
        .submit-btn { background: #0f172a; color: #fff; margin-top: 10px; font-size: 1rem; }
        .submit-btn:disabled { background: #94a3b8; cursor: not-allowed; }

        .reg-footer { text-align: center; margin-top: 25px; font-size: 0.9rem; color: #64748b; }
        .reg-footer a { color: #2563eb; font-weight: 700; text-decoration: none; }

        @media(max-width: 600px) { .input-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default Register;
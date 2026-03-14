import React, { useRef, useState, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as faceapi from 'face-api.js';
import { toast } from 'react-toastify';
import { FaCamera, FaSync, FaCheckCircle } from 'react-icons/fa';

const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

const FaceCapture = ({ onCapture, btnText = "Verify Face" }) => {
  const webcamRef = useRef(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);

  /* =========================
     1️⃣ LOAD AI MODELS (FAST)
  ========================== */
  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        if (mounted) setModelsLoaded(true);
      } catch (err) {
        console.error(err);
        toast.error("Biometric engine failed to initialize");
      }
    };

    loadModels();
    return () => { mounted = false; };
  }, []);

  /* =========================
     2️⃣ CAPTURE & DETECT FACE
  ========================== */
  const handleCapture = async () => {
    if (!webcamRef.current || processing) return;

    setProcessing(true);

    try {
      const screenshot = webcamRef.current.getScreenshot();
      if (!screenshot) {
        toast.error("Camera not ready");
        setProcessing(false);
        return;
      }

      const img = await faceapi.fetchImage(screenshot);

      const detection = await faceapi
        .detectSingleFace(
          img,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 224,
            scoreThreshold: 0.6
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        toast.error("Face not detected. Keep your face centered & steady.");
        setProcessing(false);
        return;
      }

      setPreview(screenshot);

      onCapture({
        descriptor: Array.from(detection.descriptor),
        image: screenshot
      });

      toast.success("Face verified successfully ✔");
    } catch (err) {
      console.error(err);
      toast.error("Face verification failed");
    } finally {
      setProcessing(false);
    }
  };

  /* =========================
     3️⃣ UI STATES
  ========================== */
  if (!modelsLoaded) {
    return (
      <div className="fc-loader">
        <div className="spinner" />
        <p>Initializing biometric engine...</p>
      </div>
    );
  }

  return (
    <div className="face-box">
      {preview ? (
        <div className="preview">
          <img src={preview} alt="face-preview" />
          <span className="verified"><FaCheckCircle /> Verified</span>
          <button onClick={() => setPreview(null)} className="reset-btn">
            <FaSync /> Retake
          </button>
        </div>
      ) : (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            mirrored
            screenshotFormat="image/jpeg"
            videoConstraints={{
              width: 420,
              height: 420,
              facingMode: "user"
            }}
            className="webcam"
          />

          <div className="overlay">
            <div className="face-guide" />
          </div>

          <button
            onClick={handleCapture}
            disabled={processing}
            className="capture-btn"
          >
            <FaCamera />
            {processing ? "Scanning..." : btnText}
          </button>
        </>
      )}

      {/* ================= STYLES ================= */}
      <style>{`
        .face-box {
          background: rgba(13, 17, 34, 0.85);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow: hidden;
          max-width: 420px;
          margin: auto;
          position: relative;
          box-shadow: 0 40px 80px rgba(0,0,0,0.6);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .webcam {
          width: 100%;
          height: auto;
          display: block;
        }

        .overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .face-guide {
          width: 240px;
          height: 300px;
          border: 2px solid rgba(80, 200, 255, 0.5);
          border-radius: 50%;
          box-shadow: 0 0 0 9999px rgba(5, 7, 20, 0.7);
          position: relative;
        }

        .face-guide::after {
          content: "";
          position: absolute; inset: -4px;
          border: 2px dashed rgba(167, 139, 250, 0.6);
          border-radius: 50%;
          animation: spin 20s linear infinite;
        }

        .capture-btn {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          background: linear-gradient(135deg, #3b82f6, #8b5cf6, #e879f9);
          color: #fff;
          border: none;
          padding: 14px 28px;
          border-radius: 18px;
          font-weight: 900;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          box-shadow: 0 15px 35px rgba(139, 92, 246, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
          font-size: 13px;
          white-space: nowrap;
        }

        .capture-btn:hover { 
          transform: translateX(-50%) translateY(-3px); 
          box-shadow: 0 20px 50px rgba(139, 92, 246, 0.6);
          filter: brightness(1.1);
        }
        .capture-btn:disabled { 
          opacity: 0.7; 
          cursor: not-allowed;
          background: #475569;
          box-shadow: none;
        }

        .preview {
          text-align: center;
          background: #050714;
          padding-bottom: 24px;
        }

        .preview img {
          width: 100%;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 15px;
        }

        .verified {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.2);
        }

        .reset-btn {
          margin-top: 15px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          padding: 8px 20px;
          border-radius: 12px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 700;
          display: block;
          margin-left: auto; margin-right: auto;
          transition: 0.3s;
        }
        .reset-btn:hover { background: rgba(255, 255, 255, 0.1); color: #fff; border-color: #50c8ff; }

        .fc-loader {
          padding: 60px 40px;
          text-align: center;
          background: rgba(13, 17, 34, 0.85);
          border-radius: 28px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.6);
          max-width: 420px;
          margin: auto;
        }
        .fc-loader p { font-weight: 800; font-size: 14px; margin: 0; letter-spacing: 0.5px; }

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(255, 255, 255, 0.05);
          border-top-color: #50c8ff;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 0.8s linear infinite;
          box-shadow: 0 0 20px rgba(80, 200, 255, 0.2);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FaceCapture;

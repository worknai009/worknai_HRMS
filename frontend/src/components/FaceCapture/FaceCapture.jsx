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
          background: #fff;
          border-radius: 18px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          max-width: 380px;
          margin: auto;
          position: relative;
          box-shadow: 0 10px 30px rgba(0,0,0,0.08);
        }

        .webcam {
          width: 100%;
          height: auto;
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
          width: 210px;
          height: 270px;
          border: 2px dashed rgba(37,99,235,0.6);
          border-radius: 50%;
          box-shadow: 0 0 0 999px rgba(0,0,0,0.45);
        }

        .capture-btn {
          position: absolute;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          background: #2563eb;
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 999px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: 0.3s;
        }

        .capture-btn:hover { background: #1e40af; }
        .capture-btn:disabled { opacity: 0.7; }

        .preview {
          text-align: center;
          background: #000;
          padding-bottom: 20px;
        }

        .preview img {
          width: 100%;
          filter: grayscale(10%);
        }

        .verified {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #16a34a;
          color: #fff;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 0.75rem;
          font-weight: 700;
          margin-top: -14px;
        }

        .reset-btn {
          margin-top: 10px;
          background: transparent;
          border: 1px solid #64748b;
          color: #64748b;
          padding: 6px 14px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .fc-loader {
          padding: 40px;
          text-align: center;
          color: #475569;
        }

        .spinner {
          width: 34px;
          height: 34px;
          border: 4px solid #e5e7eb;
          border-top-color: #2563eb;
          border-radius: 50%;
          margin: 0 auto 15px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FaceCapture;

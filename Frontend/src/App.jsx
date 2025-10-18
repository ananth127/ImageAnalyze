import React, { useRef, useState, useEffect } from "react";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);

  // List available video devices
  const getVideoDevices = async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
    setDevices(videoDevices);
    if (videoDevices.length > 0) setSelectedDeviceId(videoDevices[0].deviceId);
  };

  // Start camera with selected device
  const startCamera = async (deviceId) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined },
      });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Unable to access camera. Please allow permissions.");
    }
  };

  // Switch camera
  const handleDeviceChange = (e) => {
    const deviceId = e.target.value;
    setSelectedDeviceId(deviceId);
    startCamera(deviceId);
  };

  // Capture image
  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setCapturedImage(canvas.toDataURL("image/png"));
    setResult(null);
  };

  // Analyze image
  const handleAnalyze = async () => {
    if (!capturedImage) return alert("Please capture an image first.");
    setLoading(true);
    const base64String = capturedImage.split(",")[1];

    try {
      const res = await fetch("https://image-analyze.vercel.app/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64String, mimeType: "image/png" }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      alert("Failed to fetch backend. Make sure server is running.");
    }
    setLoading(false);
  };

  useEffect(() => {
    getVideoDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) startCamera(selectedDeviceId);
  }, [selectedDeviceId]);

  return (
    <div className="App">
      <h1>📷 Multi-Camera Analyzer</h1>

      {/* Camera selection */}
      {devices.length > 1 && (
        <div>
          <label>Select Camera: </label>
          <select value={selectedDeviceId} onChange={handleDeviceChange}>
            {devices.map((d, i) => (
              <option key={i} value={d.deviceId}>
                {d.label || `Camera ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video feed */}
      <video ref={videoRef} autoPlay playsInline className="video-feed" />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="btn-group">
        <button onClick={capturePhoto}>📸 Capture</button>
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "🔍 Analyze"}
        </button>
      </div>

      {/* Preview */}
      {capturedImage && (
        <div className="preview">
          <h3>Captured Image:</h3>
          <img src={capturedImage} alt="Captured" />
        </div>
      )}

      {loading && <p>⏳ Processing image...</p>}

      {!loading && result && <div className="result-box">{JSON.stringify(result, null, 2)}</div>}
    </div>
  );
}

export default App;

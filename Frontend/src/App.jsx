import React, { useRef, useState } from "react";
import "./App.css";

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Unable to access camera. Please allow camera permissions.");
    }
  };

  // Capture image from video feed
  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL("image/png");
      setCapturedImage(imageBase64);
      setResult(null);
    }
  };

  // Send captured image to backend
  const handleAnalyze = async () => {
    if (!capturedImage) return alert("Please capture an image first.");

    setLoading(true);
    const base64String = capturedImage.split(",")[1];
    const mimeType = "image/png";

    try {
      const response = await fetch("https://image-analyze.vercel.app/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64String, mimeType }),
      });

      const data = await response.json();
      setResult(data);
    } catch (err) {
      alert("Failed to fetch from backend. Make sure your server is running.");
    }

    setLoading(false);
  };

  // Render different response types
  const renderResponse = (data) => {
    if (!data) return null;

    if (data.questions) {
      return (
        <div>
          <h3>🧠 MCQ Answers</h3>
          {data.questions.map((q, idx) => (
            <div key={idx} className="card">
              <p><b>Q{idx + 1}:</b> {q.question}</p>
              {q.options && (
                <ul>
                  {q.options.map((opt, i) => (
                    <li key={i}>{opt}</li>
                  ))}
                </ul>
              )}
              <p><b>✅ Answer:</b> {q.answer}</p>
            </div>
          ))}
          {data.definition && (
            <p className="definition"><b>📘 Definition:</b> {data.definition}</p>
          )}
        </div>
      );
    }

    if (data.code) {
      return (
        <div>
          <h3>💻 Code Solution</h3>
          {data.problemstatement && <p><b>Problem:</b> {data.problemstatement}</p>}
          {data.question && <p><b>Question:</b> {data.question}</p>}
          {data.definition && <p><b>📘 Explanation:</b> {data.definition}</p>}
          <pre className="code-block">{data.code}</pre>
        </div>
      );
    }

    if (data.content && data.definition) {
      return (
        <div>
          <h3>📖 Content</h3>
          <p>{data.content}</p>
          <h3>📘 Definition</h3>
          <p>{data.definition}</p>
        </div>
      );
    }

    return (
      <div>
        <h3>Raw JSON Output</h3>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="App">
      <h1>📷 Live Camera Analyzer</h1>

      {/* Camera preview */}
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline className="video-feed" />
        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>

      <div className="btn-group">
        <button onClick={startCamera}>Start Camera</button>
        <button onClick={capturePhoto}>📸 Capture</button>
        <button onClick={handleAnalyze} disabled={loading}>
          {loading ? "Analyzing..." : "🔍 Analyze"}
        </button>
      </div>

      {/* Show captured image */}
      {capturedImage && (
        <div className="preview">
          <h3>Captured Image:</h3>
          <img src={capturedImage} alt="Captured" />
        </div>
      )}

      {loading && <p>⏳ Processing image...</p>}

      {!loading && result && (
        <div className="result-box">{renderResponse(result)}</div>
      )}
    </div>
  );
}

export default App;

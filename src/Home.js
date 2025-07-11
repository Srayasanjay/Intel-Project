//HOME JS
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [context, setContext] = useState("");
  const [name, setName] = useState("");
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("contexts");
    return saved ? JSON.parse(saved) : [];
  });
  const [medium, setMedium] = useState("text");
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      }
      clearInterval(timerRef.current);
    };
  }, []);

  const saveContext = () => {
    if (!context.trim() || !name.trim()) return;
    const newEntry = { name: name.trim(), text: context.trim() };
    const newHistory = [...history, newEntry];
    setHistory(newHistory);
    localStorage.setItem("contexts", JSON.stringify(newHistory));
    setContext("");
    setName("");
  };

  const goToStudy = (index) => {
    localStorage.setItem("currentContextIndex", index);
    navigate("/study");
  };

  const renameContext = (index) => {
    const newName = prompt("Enter a new name for this context:", history[index].name);
    if (newName && newName.trim()) {
      const updated = history.map((item, i) => {
        if (i === index) {
          // create a new object with the updated name
          return { ...item, name: newName.trim() };
        }
        return item;
      });
      setHistory(updated);
      localStorage.setItem("contexts", JSON.stringify(updated));
    }
  };
  

  const deleteContext = (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this context?");
    if (confirmDelete) {
      const updated = history.filter((_, i) => i !== index);
      setHistory(updated);
      localStorage.setItem("contexts", JSON.stringify(updated));
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        clearInterval(timerRef.current);
        setRecording(false);
        setRecordingTime(0);

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          setAudioUrl(URL.createObjectURL(audioBlob));

          setIsTranscribing(true);
          const formData = new FormData();
          formData.append("audio", audioBlob, "recording.webm");

          const response = await fetch("http://localhost:5000/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          setContext(prev => prev + (prev ? " " : "") + data.text);
        } catch (err) {
          console.error("Transcription error:", err);
          alert(`Transcription failed: ${err.message}`);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(100);
      setRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Recording error:", err);
      alert(`Could not start recording: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const playRecording = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  return (
    <div style={{ padding: 20, color: "#caf0f8", background: "#000814", minHeight: "100vh" }}>
      <h1>Enter Learning Context</h1>

      <div style={{ marginBottom: 20 }}>
        <label>
          Choose input method:
          <select 
            value={medium} 
            onChange={(e) => setMedium(e.target.value)}
            style={{ marginLeft: 10, padding: 5 }}
          >
            <option value="text">Text</option>
            <option value="audio">Voice Recording</option>
          </select>
        </label>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter a name for this context"
        style={{ width: "100%", fontSize: 16, padding: 10, marginTop: 10, borderRadius: 5 }}
      />

      {medium === "text" ? (
        <textarea
          rows={5}
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Type or paste your text here..."
          style={{ width: "100%", fontSize: 16, padding: 10, marginTop: 10, borderRadius: 5 }}
        />
      ) : (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={recording ? stopRecording : startRecording}
              disabled={isTranscribing}
              style={{
                padding: "8px 20px",
                background: recording ? "#ff595e" : "#06d6a0",
                color: "#000814",
                border: "none",
                borderRadius: 5,
                cursor: "pointer",
              }}
            >
              {recording ? `Stop Recording (${recordingTime}s)` : "Start Recording"}
            </button>

            {audioUrl && (
              <button
                onClick={playRecording}
                style={{
                  padding: "8px 20px",
                  background: "#ffd166",
                  color: "#000814",
                  border: "none",
                  borderRadius: 5,
                  cursor: "pointer",
                }}
              >
                Play Recording
              </button>
            )}
          </div>

          <p style={{ marginTop: 10 }}>
            {recording ? "🎙️ Recording... speak now!" : "Click to record your voice input"}
            {isTranscribing && " (Transcribing...)"}
          </p>
        </div>
      )}

      <button
        onClick={saveContext}
        disabled={isTranscribing}
        style={{
          marginTop: 20,
          padding: "10px 25px",
          fontSize: 16,
          background: "#00b4d8",
          color: "#000814",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
        }}
      >
        Save Context
      </button>

      <h2 style={{ marginTop: 40 }}>History</h2>

      {history.length === 0 ? (
        <p>No history yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {history.map((ctx, i) => (
            <li key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={() => goToStudy(i)}
                  style={{
                    cursor: "pointer",
                    background: "#00b4d8",
                    color: "#000814",
                    padding: "6px 12px",
                    borderRadius: 5,
                    border: "none",
                  }}
                >
                  {ctx.name || `Context #${i + 1}`}
                </button>

                <button
                  onClick={() => renameContext(i)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 14,
                    background: "#ffafcc",
                    color: "#000814",
                    border: "none",
                    borderRadius: 5,
                    cursor: "pointer",
                  }}
                >
                  Rename
                </button>

                <button
                  onClick={() => deleteContext(i)}
                  style={{
                    padding: "6px 12px",
                    fontSize: 14,
                    background: "#e63946",
                    color: "white",
                    border: "none",
                    borderRadius: 5,
                    cursor: "pointer",
                  }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
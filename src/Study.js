import React, { useEffect, useState } from "react";

export default function Study() {
  const [engagement, setEngagement] = useState("Detecting...");
  const [context, setContext] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [quiz, setQuiz] = useState([]);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);

  function shuffleArray(arr) {
    return arr
      .map((val) => ({ val, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ val }) => val);
  }

  useEffect(() => {
    const fetchEngagement = () => {
      fetch("http://localhost:5000/state")
        .then((res) => res.json())
        .then((data) => setEngagement(data.state))
        .catch(() => setEngagement("Unavailable"));
    };
    fetchEngagement();
    const interval = setInterval(fetchEngagement, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const idx = localStorage.getItem("currentContextIndex");
    const contexts = JSON.parse(localStorage.getItem("contexts") || "[]");
    if (idx !== null && contexts[idx]) {
      setContext(contexts[idx]);
    }
  }, []);

  async function generateAnswer() {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("http://localhost:8000/generate-answer/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          context: context.text,
        }),
      });
      const data = await res.json();
      setAnswer(data.answer);
    } catch (err) {
      console.error("Error generating answer:", err);
      setAnswer("Failed to generate answer.");
    }
    setLoading(false);
  }

  const summarizeText = async () => {
    setSummarizing(true);
    try {
      const res = await fetch("http://localhost:8000/summarize/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: context.text }),
      });
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error("Error summarizing:", err);
      setSummary("Failed to summarize.");
    }
    setSummarizing(false);
  };

  const generateQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      const res = await fetch("http://localhost:8000/generate-quiz/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context: context.text }),
      });
      const data = await res.json();

      const questions = data.quiz
        .split(/\n|\?/g)
        .map((q) => q.trim())
        .filter((q) => q.length > 5)
        .map((q) => ({
          question: q.endsWith("?") ? q : q + "?",
          options: shuffleArray([
            "Option A",
            "Option B",
            "Option C",
            "Correct Answer",
          ]),
          correct: "Correct Answer",
          selected: null,
        }));

      setQuiz(questions);
    } catch (err) {
      console.error("Error generating quiz:", err);
      setQuiz([]);
    }
    setGeneratingQuiz(false);
  };

  return (
    <div style={{ padding: 20, color: "#caf0f8", background: "#000814", minHeight: "100vh" }}>
      <h1>Study Mode</h1>

      <div style={{ marginBottom: 20 }}>
        <strong>Context:</strong>
        <div style={{ whiteSpace: "pre-wrap", marginTop: 5, padding: 10, backgroundColor: "#001f3f", borderRadius: 5 }}>
          {context?.text || "No context loaded."}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <button onClick={summarizeText} disabled={!context || summarizing} style={{ padding: "8px 20px", fontSize: 16, background: "#00b4d8", color: "#000814", border: "none", borderRadius: 5, cursor: summarizing ? "not-allowed" : "pointer" }}>
            {summarizing ? "Summarizing..." : "Summarize"}
          </button>

          <button onClick={generateQuiz} disabled={!context || generatingQuiz} style={{ padding: "8px 20px", fontSize: 16, background: "#90e0ef", color: "#000814", border: "none", borderRadius: 5, cursor: generatingQuiz ? "not-allowed" : "pointer" }}>
            {generatingQuiz ? "Generating Quiz..." : "Generate Quiz"}
          </button>
        </div>
      </div>

      {summary && (
        <div style={{ whiteSpace: "pre-wrap", backgroundColor: "#001f3f", padding: 10, borderRadius: 5, marginBottom: 20 }}>
          <strong>Summary:</strong>
          <ul style={{ marginTop: 5 }}>
            {summary.split(". ").map((point, idx) => point.trim() ? <li key={idx}>{point.trim()}.</li> : null)}
          </ul>
        </div>
      )}

      {quiz.length > 0 && (
        <div style={{ backgroundColor: "#001f3f", padding: 15, borderRadius: 5 }}>
          <strong style={{ fontSize: 18 }}>Quiz:</strong>
          <div style={{ marginTop: 10 }}>
            {quiz.map((q, i) => (
              <div key={i} style={{ marginBottom: 20 }}>
                <div style={{ marginBottom: 8 }}>{i + 1}. {q.question}</div>
                {q.options.map((opt, j) => (
                  <button
                    key={j}
                    onClick={() => {
                      const newQuiz = [...quiz];
                      newQuiz[i].selected = opt;
                      setQuiz(newQuiz);
                    }}
                    disabled={q.selected}
                    style={{
                      display: "block",
                      marginBottom: 6,
                      padding: 8,
                      backgroundColor: q.selected
                        ? opt === q.correct
                          ? "#28a745"
                          : opt === q.selected
                          ? "#dc3545"
                          : "#001f3f"
                        : "#007bff",
                      color: "#fff",
                      border: "none",
                      borderRadius: 5,
                      cursor: q.selected ? "default" : "pointer",
                      width: "100%",
                      textAlign: "left",
                    }}
                  >
                    {opt}
                  </button>
                ))}
                {q.selected && (
                  <div style={{ marginTop: 5 }}>
                    {q.selected === q.correct ? "✔️ Correct!" : "❌ Wrong."}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h2>Ask a Question</h2>
        <textarea
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question here..."
          style={{ width: "100%", padding: 10, borderRadius: 5, border: "1px solid #4dabf7", backgroundColor: "#001f3f", color: "#caf0f8", resize: "vertical" }}
        />
        <button onClick={generateAnswer} disabled={loading || !question.trim()} style={{ marginTop: 10, padding: "8px 20px", fontSize: 16, background: "#00b4d8", color: "#000814", border: "none", borderRadius: 5, cursor: loading ? "not-allowed" : "pointer" }}>
          {loading ? "Generating..." : "Generate Answer"}
        </button>
        {answer && (
          <div style={{ marginTop: 15, whiteSpace: "pre-wrap", backgroundColor: "#001f3f", padding: 10, borderRadius: 5, color: "#caf0f8" }}>
            <strong>Answer:</strong> {answer}
          </div>
        )}
      </div>

      <div style={{ marginTop: 40 }}>
        <h2>Engagement Monitor</h2>
        <img src="http://localhost:5000/video_feed" alt="Live Webcam Feed" style={{ maxWidth: 300, border: "4px solid #4dabf7", borderRadius: 10, marginBottom: 20 }} />
        <div>
          Engagement State: <span style={{ fontWeight: "bold", color: "#ffbf00" }}>{engagement}</span>
        </div>
      </div>
    </div>
  );
}

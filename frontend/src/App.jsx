import { useState } from "react";
import UploadZone from "./components/UploadZone";
import LoadingState from "./components/LoadingState";
import RiskDashboard from "./components/RiskDashboard";
import NegotiationEmail from "./components/NegotiationEmail";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [view, setView] = useState("upload"); // "upload" | "loading" | "results"
  const [analysisResult, setAnalysisResult] = useState(null);
  const [error, setError] = useState(null);
  const [invalidMessage, setInvalidMessage] = useState(null);

  console.log("[App] Current view:", view);
  console.log("[App] Analysis result:", analysisResult);
  if (analysisResult) {
    console.log("[Parent] negotiation_email value:", analysisResult.negotiation_email);
  }

  const handleSubmit = async (formData) => {
    console.log("[App] Submitting form data to /analyze");
    setView("loading");
    setError(null);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      console.log("[App] Response status:", response.status);

      if (!response.ok) {
        let errData = {};
        try {
          errData = await response.json();
        } catch (e) {
          console.error("Failed to parse error JSON", e);
        }

        if (response.status === 422) {
          const detail = typeof errData.detail === "string" ? errData.detail : (typeof errData.error === "string" ? errData.error : "Invalid document");
          setInvalidMessage(detail);
          setView("invalid");
          return;
        }

        const errorMessage = typeof errData.detail === "string" ? errData.detail : (typeof errData.error === "string" ? errData.error : JSON.stringify(errData));
        throw new Error(errorMessage || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("[App] Analysis result received:", data);
      setAnalysisResult(data);
      setView("results");
    } catch (err) {
      console.error("[App] Error during analysis:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setView("upload");
    }
  };

  const handleReset = () => {
    console.log("[App] Resetting to upload view");
    setView("upload");
    setAnalysisResult(null);
    setError(null);
    setInvalidMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Navbar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '1.2rem', color: 'white', margin: 0 }}>LexGuard</h1>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.72rem', color: 'var(--text-muted)' }} className="hidden sm:inline">
            | Know what you're signing
          </span>
        </div>
      </nav>

      <main className="flex-1 relative">
        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 text-center text-sm">
            ⚠️ {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 underline hover:text-white"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Views */}
        {view === "upload" && <UploadZone onSubmit={handleSubmit} />}
        {view === "loading" && <LoadingState />}
        {view === "invalid" && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <div style={{
              backgroundColor: 'rgba(255,69,96,0.08)',
              border: '1px solid rgba(255,69,96,0.3)',
              color: 'var(--text-primary)',
              padding: '1.25rem 1.5rem',
              maxWidth: '520px',
              width: '100%',
              marginBottom: '1.25rem',
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.82rem',
              lineHeight: 1.6,
            }}>
              ⚠️ {invalidMessage || "Invalid Document"}
            </div>
            <button
              onClick={handleReset}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                padding: '0.5rem 1.25rem',
                cursor: 'pointer',
                transition: 'color 150ms',
              }}
            >
              Try Again
            </button>
          </div>
        )}
        {view === "results" && analysisResult && (
          <div style={{ animation: "fadeIn 400ms ease-in-out" }}>
            <RiskDashboard result={analysisResult} />
            {analysisResult.negotiation_email && (
              <NegotiationEmail email={analysisResult.negotiation_email} />
            )}
            <div className="text-center py-8">
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-slate-500 text-slate-300 hover:bg-slate-800 transition-colors font-mono text-sm"
              >
                ← Analyze another contract
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        flexShrink: 0,
        textAlign: 'center',
        padding: '1rem',
        fontFamily: "'DM Mono', monospace",
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-card)',
      }}>
        Not legal advice. For informational purposes only.
      </footer>
    </div>
  );
}

export default App;

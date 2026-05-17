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

  console.log("[App] Current view:", view);
  console.log("[App] Analysis result:", analysisResult);

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
          const isInvalidDoc = 
            (typeof errData.detail === "string" && errData.detail.includes("does not appear to be a legal contract")) || 
            (typeof errData.error === "string" && errData.error.includes("Failed to extract text"));
            
          if (isInvalidDoc) {
            setView("invalid");
            return;
          }
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
  };

  return (
    <div className="min-h-screen bg-navy">
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
          <div className="bg-red-600 text-white px-6 py-4 text-center max-w-lg mb-6 font-mono text-sm">
            ⚠️ Invalid Document — This doesn't look like a legal contract. Please upload a contract, NDA, employment agreement, vendor agreement, or similar legal document.
          </div>
          <button
            onClick={handleReset}
            className="px-6 py-2 bg-slate-800 text-slate-200 border border-slate-600 hover:bg-slate-700 transition-colors font-mono text-sm"
          >
            Try Again
          </button>
        </div>
      )}
      {view === "results" && analysisResult && (
        <div>
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
    </div>
  );
}

export default App;

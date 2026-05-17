import { useState, useRef } from "react";

const ROLES = [
  "employee", "employer", "buyer", "vendor",
  "tenant", "landlord", "freelancer", "client",
];

function UploadZone({ onSubmit }) {
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("");
  const [concern, setConcern] = useState("");
  const [counterpartyName, setCounterpartyName] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const handleSampleContract = async () => {
    try {
      const res = await fetch(`${API_URL}/sample-contract`);
      const data = await res.json();
      const sampleFile = new File([data.text], "sample_agreement.txt", { type: "text/plain" });
      setFile(sampleFile);
      setRole("employee");
      setConcern("I want to know what I'm giving up");
      setCounterpartyName("The Company");
    } catch (err) {
      console.error("Failed to load sample contract", err);
    }
  };

  console.log("[UploadZone] file:", file?.name, "role:", role, "concern:", concern);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      console.log("[UploadZone] File dropped:", e.dataTransfer.files[0].name);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      console.log("[UploadZone] File selected:", e.target.files[0].name);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!file || !role) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("role", role);
    formData.append("concern", concern);
    formData.append("counterparty_name", counterpartyName || "the counterparty");

    console.log("[UploadZone] Submitting form data");
    onSubmit(formData);
  };

  const isOversize = file && file.size > 10 * 1024 * 1024;
  const canSubmit = file && role && !isOversize;

  const labelStyle = {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.7rem",
    letterSpacing: "0.15em",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "0.35rem",
  };

  const inputStyle = {
    width: "100%",
    backgroundColor: "var(--bg-elevated)",
    border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
    padding: "0.55rem 0.75rem",
    fontSize: "0.85rem",
    fontFamily: "'DM Mono', monospace",
    outline: "none",
    transition: "border-color 150ms",
    appearance: "none",
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] px-4 py-10">
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: "480px" }}>

        {/* Logo */}
        <div className="text-center mb-10">
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⚖️</div>
          <h1 style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "3rem",
            color: "white",
            letterSpacing: "-0.02em",
            lineHeight: 1,
            marginBottom: "0.5rem",
          }}>
            LexGuard
          </h1>
          {/* Red underline decoration */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
            <span style={{ display: "block", width: "40px", height: "2px", backgroundColor: "var(--red-vivid)" }} />
          </div>
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Know what you're signing
          </p>
        </div>

        {/* Sample Banner */}
        <div style={{
          backgroundColor: "rgba(255,69,96,0.06)",
          border: "1px solid rgba(255,69,96,0.2)",
          padding: "0.75rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}>
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.78rem", color: "var(--text-muted)" }}>
            No contract handy?
          </span>
          <button
            type="button"
            onClick={handleSampleContract}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.78rem",
              color: "var(--red-vivid)",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Try our sample →
          </button>
        </div>

        {/* Drop Zone */}
        <div
          className={dragActive ? "" : "dropzone-pulse"}
          style={{
            backgroundColor: "var(--bg-card)",
            border: dragActive ? `1px solid var(--red-vivid)` : "1px solid var(--border-subtle)",
            padding: "2.5rem 1.5rem",
            textAlign: "center",
            cursor: "pointer",
            marginBottom: "1.5rem",
            transition: "border-color 300ms",
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
                📄 {file.name}
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.25rem" }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "1rem", marginBottom: "0.35rem" }}>
                Drop contract here
              </p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "var(--text-muted)" }}>
                PDF or TXT · Max 10MB
              </p>
            </div>
          )}
        </div>

        {isOversize && (
          <p style={{ color: "var(--red-vivid)", fontSize: "0.75rem", marginBottom: "0.75rem" }}>File exceeds 10MB limit.</p>
        )}

        {/* Role */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={labelStyle}>Your Role in This Contract</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="lex-input"
            style={inputStyle}
          >
            <option value="">Select your role…</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Concern */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={labelStyle}>Your Specific Concern</label>
          <textarea
            value={concern}
            onChange={(e) => setConcern(e.target.value.slice(0, 200))}
            placeholder="e.g. I want to start a competing business in 1 year"
            rows={2}
            className="lex-input"
            style={{ ...inputStyle, resize: "none" }}
          />
          <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "var(--text-muted)", textAlign: "right" }}>
            {concern.length}/200
          </p>
        </div>

        {/* Counterparty */}
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={labelStyle}>Who Sent You This Contract? (optional)</label>
          <input
            type="text"
            value={counterpartyName}
            onChange={(e) => setCounterpartyName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="lex-input"
            style={inputStyle}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: "100%",
            padding: "0.85rem",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 600,
            fontSize: "0.85rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            border: "none",
            cursor: canSubmit ? "pointer" : "not-allowed",
            backgroundColor: canSubmit ? "var(--red-vivid)" : "#2a2a3a",
            color: canSubmit ? "white" : "var(--text-muted)",
            transition: "all 200ms",
            boxShadow: canSubmit ? "0 0 20px var(--accent-glow)" : "none",
          }}
          onMouseEnter={(e) => { if (canSubmit) e.target.style.filter = "brightness(1.1)"; }}
          onMouseLeave={(e) => { if (canSubmit) e.target.style.filter = "brightness(1)"; }}
        >
          Analyze Contract →
        </button>

        {/* Trust indicators */}
        <p style={{
          textAlign: "center",
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.68rem",
          color: "var(--text-muted)",
          marginTop: "1rem",
          letterSpacing: "0.05em",
        }}>
          🔒 Private &nbsp;·&nbsp; ⚡ ~30 sec analysis &nbsp;·&nbsp; ✓ No data stored
        </p>

      </form>
    </div>
  );
}

export default UploadZone;

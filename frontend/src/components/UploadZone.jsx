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

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-mono font-bold text-white tracking-tight">
            LexGuard
          </h1>
          <p className="text-slate-400 text-sm mt-1">Know what you're signing</p>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            dragActive
              ? "border-blue-400 bg-blue-900/20"
              : "border-slate-600 hover:border-slate-400"
          }`}
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
              <p className="text-white font-mono text-sm">📄 {file.name}</p>
              <p className="text-slate-500 text-xs mt-1">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-slate-300 text-sm">
                Drop your contract here or click to browse
              </p>
              <p className="text-slate-500 text-xs mt-1">PDF or TXT · Max 10MB</p>
            </div>
          )}
        </div>

        {isOversize && (
          <p className="text-red-400 text-xs">File exceeds 10MB limit.</p>
        )}

        {/* Role Selector */}
        <div>
          <label className="block text-slate-400 text-xs mb-1 font-mono">
            YOUR ROLE IN THIS CONTRACT
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full bg-navy-light border border-slate-600 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
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
        <div>
          <label className="block text-slate-400 text-xs mb-1 font-mono">
            YOUR SPECIFIC CONCERN
          </label>
          <textarea
            value={concern}
            onChange={(e) => setConcern(e.target.value.slice(0, 200))}
            placeholder="e.g. I want to start a competing business in 1 year"
            rows={2}
            className="w-full bg-navy-light border border-slate-600 text-white px-3 py-2 text-sm resize-none focus:outline-none focus:border-blue-500"
          />
          <p className="text-slate-500 text-xs text-right">{concern.length}/200</p>
        </div>

        {/* Counterparty Name */}
        <div>
          <label className="block text-slate-400 text-xs mb-1 font-mono">
            WHO SENT YOU THIS CONTRACT? (optional)
          </label>
          <input
            type="text"
            value={counterpartyName}
            onChange={(e) => setCounterpartyName(e.target.value)}
            placeholder="e.g. Acme Corp"
            className="w-full bg-navy-light border border-slate-600 text-white px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-3 font-mono text-sm font-semibold tracking-wide transition-colors ${
            canSubmit
              ? "bg-white text-navy hover:bg-slate-200"
              : "bg-slate-700 text-slate-500 cursor-not-allowed"
          }`}
        >
          ANALYZE CONTRACT →
        </button>
      </form>
    </div>
  );
}

export default UploadZone;

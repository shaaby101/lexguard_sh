function ClauseCard({ clause, riskHex }) {
  const colors = riskHex || {
    critical: "#ff4560",
    high:     "#ff8c42",
    medium:   "#ffd166",
    low:      "#06d6a0",
  };

  const severityColor = colors[clause.severity] || "#6b6b8a";

  const bgTint = {
    critical: "rgba(255,69,96,0.05)",
    high:     "rgba(255,140,66,0.05)",
    medium:   "rgba(255,209,102,0.04)",
    low:      "rgba(6,214,160,0.05)",
  };

  return (
    <div
      style={{
        backgroundColor: bgTint[clause.severity] || "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderLeft: `3px solid ${severityColor}`,
        borderRadius: "0 4px 4px 0",
        padding: "1rem 1.25rem",
        transition: "background-color 150ms",
        cursor: "default",
      }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--bg-elevated)"}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = bgTint[clause.severity] || "var(--bg-card)"}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
        {/* Severity badge — outline */}
        <span style={{
          border: `1px solid ${severityColor}`,
          color: severityColor,
          background: "transparent",
          padding: "0.1rem 0.6rem",
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.65rem",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}>
          {(clause.severity || "").toUpperCase()}
        </span>

        {/* Title */}
        <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 600, color: "var(--text-primary)", fontSize: "0.95rem" }}>
          {clause.title}
        </span>

        {/* Category */}
        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "var(--text-muted)" }}>
          ({clause.category})
        </span>

        {clause.is_unusual && (
          <span style={{
            border: "1px solid rgba(255,209,102,0.4)",
            color: "#ffd166",
            background: "rgba(255,209,102,0.08)",
            padding: "0.1rem 0.5rem",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.65rem",
            letterSpacing: "0.05em",
          }}>
            ⚠ UNUSUAL
          </span>
        )}
        {clause.negotiable && (
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "#06d6a0" }}>
            ✓ Negotiable
          </span>
        )}
      </div>

      {/* Worst Case */}
      {clause.worst_case && (
        <div style={{
          padding: "0.65rem 0.875rem",
          marginBottom: "0.5rem",
          backgroundColor: clause.severity === "critical" || clause.severity === "high"
            ? "rgba(255,69,96,0.07)"
            : "var(--bg-elevated)",
          border: clause.severity === "critical" || clause.severity === "high"
            ? "1px solid rgba(255,69,96,0.15)"
            : "1px solid var(--border-subtle)",
        }}>
          <span style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.62rem",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            display: "block",
            marginBottom: "0.35rem",
          }}>
            Worst Case
          </span>
          <p style={{ fontFamily: "'Syne', sans-serif", fontWeight: 400, fontSize: "0.9rem", color: "var(--text-primary)", margin: 0, lineHeight: 1.5 }}>
            {clause.worst_case}
          </p>
        </div>
      )}

      {/* Industry Benchmark */}
      {clause.industry_benchmark && (
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "var(--text-muted)", fontStyle: "italic", marginBottom: "0.5rem" }}>
          {clause.industry_benchmark}
        </p>
      )}

      {/* Raw Text */}
      <details style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem" }}>
        <summary style={{ color: "var(--text-muted)", cursor: "pointer", userSelect: "none" }}>
          View original clause text
        </summary>
        <pre style={{
          marginTop: "0.5rem",
          color: "var(--text-muted)",
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-subtle)",
          padding: "0.75rem",
          fontSize: "0.7rem",
          whiteSpace: "pre-wrap",
          overflowX: "auto",
          maxHeight: "10rem",
          overflowY: "auto",
        }}>
          {clause.raw_text}
        </pre>
      </details>
    </div>
  );
}

export default ClauseCard;

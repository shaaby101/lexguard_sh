import ClauseCard from "./ClauseCard";

function RiskDashboard({ result }) {
  console.log("[RiskDashboard] Rendering with result:", result);

  const sortedClauses = [...(result.clauses || [])].sort(
    (a, b) => (b.severity_score || 0) - (a.severity_score || 0)
  );

  const riskHex = {
    critical: "#ff4560",
    high:     "#ff8c42",
    medium:   "#ffd166",
    low:      "#06d6a0",
  };

  const riskGlow = {
    critical: "0 0 30px rgba(255,69,96,0.4)",
    high:     "0 0 30px rgba(255,140,66,0.4)",
    medium:   "0 0 30px rgba(255,209,102,0.4)",
    low:      "0 0 30px rgba(6,214,160,0.4)",
  };

  const total = (result.critical_count||0)+(result.high_count||0)+(result.medium_count||0)+(result.low_count||0) || 1;

  const labelStyle = {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.68rem",
    letterSpacing: "0.15em",
    color: "var(--text-muted)",
    textTransform: "uppercase",
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "2.5rem 1.25rem" }}>

      {/* Overall Score */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}
        className={result.overall_risk === "critical" ? "animate-pulse" : ""}
      >
        <p style={labelStyle}>Overall Risk Score</p>
        <p style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "clamp(5rem, 14vw, 8rem)",
          color: riskHex[result.overall_risk] || "var(--text-primary)",
          textShadow: riskGlow[result.overall_risk] || "none",
          lineHeight: 1,
          margin: "0.25rem 0",
        }}>
          {result.overall_score}
        </p>
        <p style={{
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.75rem",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: riskHex[result.overall_risk] || "var(--text-muted)",
          marginTop: "0.5rem",
        }}>
          {result.overall_risk} risk
        </p>
      </div>

      {/* Count Badges — outline style */}
      <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {[
          ["critical", result.critical_count],
          ["high",     result.high_count],
          ["medium",   result.medium_count],
          ["low",      result.low_count],
        ].map(([level, count]) => (
          <span key={level} style={{
            border: `1px solid ${riskHex[level]}`,
            color: riskHex[level],
            background: "transparent",
            padding: "0.15rem 0.75rem",
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.68rem",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            {level}: {count || 0}
          </span>
        ))}
      </div>

      {/* Risk Bar — 3px, sharp */}
      <div style={{ display: "flex", height: "3px", marginBottom: "1.25rem", overflow: "hidden" }}>
        {result.critical_count > 0 && <div style={{ backgroundColor: riskHex.critical, width: `${(result.critical_count/total)*100}%` }} />}
        {result.high_count > 0     && <div style={{ backgroundColor: riskHex.high,     width: `${(result.high_count/total)*100}%` }} />}
        {result.medium_count > 0   && <div style={{ backgroundColor: riskHex.medium,   width: `${(result.medium_count/total)*100}%` }} />}
        {result.low_count > 0      && <div style={{ backgroundColor: riskHex.low,      width: `${(result.low_count/total)*100}%` }} />}
      </div>

      {/* Persona Context */}
      <p style={{ ...labelStyle, textAlign: "center", marginBottom: "1.5rem" }}>
        Analyzing as:{" "}
        <span style={{
          backgroundColor: "var(--bg-elevated)",
          border: "1px solid var(--border-subtle)",
          padding: "0.1rem 0.5rem",
          borderRadius: "2px",
          color: "var(--text-primary)",
        }}>
          {result.persona?.role}
        </span>
        {" "}· Concern: {result.persona?.concern || "—"}
      </p>

      {/* Gradient Divider */}
      <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, var(--red-vivid), var(--orange-vivid), transparent)", marginBottom: "2rem" }} />

      {/* Clause List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {sortedClauses.map((clause) => (
          <ClauseCard key={clause.id} clause={clause} riskHex={riskHex} />
        ))}
      </div>
    </div>
  );
}

export default RiskDashboard;

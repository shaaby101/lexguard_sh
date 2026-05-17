import ClauseCard from "./ClauseCard";

function RiskDashboard({ result }) {
  console.log("[RiskDashboard] Rendering with result:", result);

  const sortedClauses = [...(result.clauses || [])].sort(
    (a, b) => (b.severity_score || 0) - (a.severity_score || 0)
  );

  const riskColor = {
    critical: "text-critical",
    high: "text-high",
    medium: "text-medium",
    low: "text-low",
  };

  const badgeStyle = (level, count) => {
    const colors = {
      critical: "bg-critical/20 text-critical border-critical/40",
      high: "bg-high/20 text-high border-high/40",
      medium: "bg-medium/20 text-medium border-medium/40",
      low: "bg-low/20 text-low border-low/40",
    };
    return colors[level] || "";
  };

  const total = (result.critical_count||0)+(result.high_count||0)+(result.medium_count||0)+(result.low_count||0) || 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Overall Score */}
      <div className="text-center mb-8">
        <p className="text-slate-400 text-xs font-mono mb-2">OVERALL RISK SCORE</p>
        <p className={`text-6xl font-mono font-bold ${riskColor[result.overall_risk] || "text-white"}`}>
          {result.overall_score}
        </p>
        <p className={`text-sm font-mono mt-1 uppercase ${riskColor[result.overall_risk] || ""}`}>
          {result.overall_risk} risk
        </p>
      </div>

      {/* Count Badges */}
      <div className="flex justify-center gap-3 mb-6 flex-wrap">
        {[
          ["critical", result.critical_count],
          ["high", result.high_count],
          ["medium", result.medium_count],
          ["low", result.low_count],
        ].map(([level, count]) => (
          <span key={level} className={`px-3 py-1 text-xs font-mono border ${badgeStyle(level)}`}>
            {level.toUpperCase()}: {count || 0}
          </span>
        ))}
      </div>

      {/* Risk Bar */}
      <div className="flex h-2 mb-6 overflow-hidden">
        {result.critical_count > 0 && <div className="bg-critical" style={{width:`${(result.critical_count/total)*100}%`}} />}
        {result.high_count > 0 && <div className="bg-high" style={{width:`${(result.high_count/total)*100}%`}} />}
        {result.medium_count > 0 && <div className="bg-medium" style={{width:`${(result.medium_count/total)*100}%`}} />}
        {result.low_count > 0 && <div className="bg-low" style={{width:`${(result.low_count/total)*100}%`}} />}
      </div>

      {/* Persona Context */}
      <p className="text-slate-500 text-xs font-mono text-center mb-8">
        Analyzing as: {result.persona?.role} · Concern: {result.persona?.concern || "—"}
      </p>

      {/* Clause List */}
      <div className="space-y-4">
        {sortedClauses.map((clause) => (
          <ClauseCard key={clause.id} clause={clause} />
        ))}
      </div>
    </div>
  );
}

export default RiskDashboard;

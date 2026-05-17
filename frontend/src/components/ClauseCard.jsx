function ClauseCard({ clause }) {
  const borderColor = {
    critical: "border-l-critical",
    high: "border-l-high",
    medium: "border-l-medium",
    low: "border-l-low",
  };

  const severityBg = {
    critical: "bg-critical/20 text-critical",
    high: "bg-high/20 text-high",
    medium: "bg-medium/20 text-medium",
    low: "bg-low/20 text-low",
  };

  return (
    <div className={`bg-navy-light border border-slate-700 border-l-4 ${borderColor[clause.severity] || "border-l-slate-500"} p-4`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className={`px-2 py-0.5 text-xs font-mono font-semibold ${severityBg[clause.severity] || ""}`}>
          {(clause.severity || "").toUpperCase()}
        </span>
        <span className="text-white font-mono text-sm font-semibold">{clause.title}</span>
        <span className="text-slate-500 text-xs">({clause.category})</span>
        {clause.is_unusual && (
          <span className="px-2 py-0.5 text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-600/40">
            ⚠ UNUSUAL
          </span>
        )}
        {clause.negotiable && (
          <span className="text-xs text-green-400">✓ Negotiable</span>
        )}
      </div>

      {/* Worst Case */}
      {clause.worst_case && (
        <div className={`p-3 mb-2 text-sm ${
          clause.severity === "critical" || clause.severity === "high"
            ? "bg-red-900/20 border border-red-800/30 text-red-200"
            : "bg-slate-800 text-slate-300"
        }`}>
          <span className="text-xs text-slate-400 font-mono block mb-1">WORST CASE</span>
          {clause.worst_case}
        </div>
      )}

      {/* Industry Benchmark */}
      {clause.industry_benchmark && (
        <p className="text-xs text-slate-400 italic mb-2">{clause.industry_benchmark}</p>
      )}

      {/* Raw Text */}
      <details className="text-xs">
        <summary className="text-slate-500 cursor-pointer hover:text-slate-300">
          View original clause text
        </summary>
        <pre className="mt-2 text-slate-400 whitespace-pre-wrap bg-navy p-2 border border-slate-700 text-xs overflow-auto max-h-40">
          {clause.raw_text}
        </pre>
      </details>
    </div>
  );
}

export default ClauseCard;

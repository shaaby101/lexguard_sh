const ROLES = ["employee","employer","buyer","vendor","tenant","landlord","freelancer","client"];

function PersonaSelector({ role, onRoleChange, concern, onConcernChange }) {
  return (
    <div className="space-y-4">
      <select value={role} onChange={(e) => onRoleChange(e.target.value)}
        className="w-full bg-navy-light border border-slate-600 text-white px-3 py-2 text-sm">
        <option value="">Select role…</option>
        {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
      </select>
      <textarea value={concern} onChange={(e) => onConcernChange(e.target.value.slice(0,200))}
        rows={2} className="w-full bg-navy-light border border-slate-600 text-white px-3 py-2 text-sm resize-none" />
    </div>
  );
}

export default PersonaSelector;

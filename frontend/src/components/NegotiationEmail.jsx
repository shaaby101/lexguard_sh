import { useState } from "react";

function NegotiationEmail({ email }) {
  const [copied, setCopied] = useState(null);

  console.log("[NegotiationEmail] Rendering email:", email?.subject);

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      console.log("[NegotiationEmail] Copied:", label);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error("[NegotiationEmail] Copy failed:", err);
    }
  };

  if (!email) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-mono font-bold text-white">Your Negotiation Email</h2>
        <button
          onClick={() => copyText(`Subject: ${email.subject}\n\n${email.body}`, "all")}
          className="px-3 py-1 text-xs font-mono border border-slate-600 text-slate-300 hover:bg-slate-800"
        >
          {copied === "all" ? "✓ Copied!" : "Copy All"}
        </button>
      </div>

      {/* Subject */}
      <div className="mb-4">
        <label className="text-slate-400 text-xs font-mono block mb-1">SUBJECT</label>
        <div className="flex items-center gap-2">
          <input
            type="text" readOnly value={email.subject || ""}
            className="flex-1 bg-navy-light border border-slate-600 text-white px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={() => copyText(email.subject, "subject")}
            className="px-2 py-2 text-xs border border-slate-600 text-slate-400 hover:bg-slate-800"
          >
            {copied === "subject" ? "✓" : "📋"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="mb-4">
        <label className="text-slate-400 text-xs font-mono block mb-1">EMAIL BODY</label>
        <pre className="bg-navy-light border border-slate-600 text-slate-200 p-4 text-sm font-mono whitespace-pre-wrap overflow-auto max-h-96">
          {email.body}
        </pre>
      </div>

      {/* Key Asks */}
      {email.key_asks && email.key_asks.length > 0 && (
        <div className="mb-4">
          <label className="text-slate-400 text-xs font-mono block mb-2">KEY ASKS</label>
          <ol className="list-decimal list-inside space-y-1">
            {email.key_asks.map((ask, i) => (
              <li key={i} className="text-slate-300 text-sm">{ask}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-slate-600 text-xs mt-4">
        ⚖️ This is AI-generated. Review with a legal professional before sending.
      </p>
    </div>
  );
}

export default NegotiationEmail;

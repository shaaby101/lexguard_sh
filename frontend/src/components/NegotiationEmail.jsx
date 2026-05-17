import { useState } from "react";

function NegotiationEmail({ email }) {
  const [copied, setCopied] = useState(null);

  console.log("[NegotiationEmail] props received:", email);
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

  const labelStyle = {
    fontFamily: "'DM Mono', monospace",
    fontSize: "0.65rem",
    letterSpacing: "0.15em",
    color: "var(--text-muted)",
    textTransform: "uppercase",
    display: "block",
    marginBottom: "0.5rem",
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 1.25rem 3rem" }}>

      {/* Section Heading with red left border */}
      <div style={{ borderLeft: "3px solid var(--red-vivid)", paddingLeft: "1rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: "1.4rem",
          color: "var(--text-primary)",
          margin: 0,
        }}>
          Your Negotiation Email
        </h2>
        <button
          onClick={() => copyText(`Subject: ${email.subject}\n\n${email.body}`, "all")}
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            backgroundColor: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            padding: "0.3rem 0.75rem",
            cursor: "pointer",
            transition: "color 150ms",
          }}
        >
          {copied === "all" ? "✓ Copied!" : "Copy All"}
        </button>
      </div>

      {/* Subject */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Subject</label>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            readOnly
            value={email.subject || ""}
            style={{
              flex: 1,
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              padding: "0.55rem 0.75rem",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.82rem",
              outline: "none",
            }}
          />
          <button
            onClick={() => copyText(email.subject, "subject")}
            style={{
              backgroundColor: "var(--bg-elevated)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-muted)",
              padding: "0.4rem 0.6rem",
              cursor: "pointer",
              fontSize: "0.82rem",
            }}
          >
            {copied === "subject" ? "✓" : "📋"}
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ marginBottom: "1.25rem" }}>
        <label style={labelStyle}>Email Body</label>
        <pre style={{
          backgroundColor: "var(--bg-primary)",
          border: "1px solid var(--border-subtle)",
          color: "var(--text-primary)",
          padding: "1.25rem",
          fontFamily: "'DM Mono', monospace",
          fontSize: "0.82rem",
          lineHeight: 1.7,
          whiteSpace: "pre-wrap",
          overflowX: "auto",
          maxHeight: "24rem",
          overflowY: "auto",
          margin: 0,
        }}>
          {email.body}
        </pre>
      </div>

      {/* Key Asks */}
      {email.key_asks && email.key_asks.length > 0 && (
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={labelStyle}>Key Asks</label>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {email.key_asks.map((ask, i) => (
              <li key={i} style={{ display: "flex", gap: "0.65rem", fontFamily: "'DM Mono', monospace", fontSize: "0.82rem" }}>
                <span style={{ color: "var(--red-vivid)", flexShrink: 0 }}>→</span>
                <span style={{ color: "var(--text-primary)" }}>{ask}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <p style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.68rem", color: "var(--text-muted)", marginTop: "1rem" }}>
        ⚖️ This is AI-generated. Review with a legal professional before sending.
      </p>
    </div>
  );
}

export default NegotiationEmail;

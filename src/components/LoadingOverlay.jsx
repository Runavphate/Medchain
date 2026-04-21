import React, { useEffect, useState } from "react";

/* ─── inline keyframes injected once ─────────────────────── */
const STYLES = `
  @keyframes lo-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes lo-spin-reverse {
    to { transform: rotate(-360deg); }
  }
  @keyframes lo-pulse-dot {
    0%, 100% { transform: scale(0.6); opacity: 0.35; }
    50%       { transform: scale(1);   opacity: 1;    }
  }
  @keyframes lo-fadein {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes lo-node-pulse {
    0%, 100% { r: 3; opacity: 0.4; }
    50%       { r: 5; opacity: 1;   }
  }
  @keyframes lo-bounce-check {
    0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
    60%  { transform: scale(1.2) rotate(4deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg);   opacity: 1; }
  }
  @keyframes lo-shake {
    0%, 100% { transform: translateX(0); }
    20%      { transform: translateX(-8px); }
    40%      { transform: translateX(8px); }
    60%      { transform: translateX(-5px); }
    80%      { transform: translateX(5px); }
  }
`;

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected) return;
  const tag = document.createElement("style");
  tag.textContent = STYLES;
  document.head.appendChild(tag);
  stylesInjected = true;
}

/* ─── Animated blockchain node SVG ───────────────────────── */
function BlockchainNodes() {
  const nodes = [
    { cx: 50,  cy: 25,  delay: "0s"    },
    { cx: 90,  cy: 50,  delay: "0.3s"  },
    { cx: 75,  cy: 88,  delay: "0.6s"  },
    { cx: 25,  cy: 88,  delay: "0.9s"  },
    { cx: 10,  cy: 50,  delay: "1.2s"  },
  ];
  const lines = [
    [0,1],[1,2],[2,3],[3,4],[4,0],[0,2],[1,3],
  ];

  return (
    <svg viewBox="0 0 100 112" width="88" height="88" style={{ overflow: "visible" }}>
      {/* connection lines */}
      {lines.map(([a,b], i) => (
        <line key={i}
          x1={nodes[a].cx} y1={nodes[a].cy}
          x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="rgba(198,245,240,0.25)" strokeWidth="0.8"
        />
      ))}
      {/* nodes */}
      {nodes.map((n, i) => (
        <circle key={i}
          cx={n.cx} cy={n.cy} r="4"
          fill="#c6f5f0"
          style={{
            animation: `lo-node-pulse 1.8s ease-in-out ${n.delay} infinite`,
          }}
        />
      ))}
    </svg>
  );
}

/* ─── Triple‑ring spinner ─────────────────────────────────── */
function Spinner() {
  const ring = (size, color, dur, rev) => ({
    position: "absolute",
    inset: 0,
    margin: "auto",
    width: size,
    height: size,
    borderRadius: "50%",
    border: `2px solid transparent`,
    borderTopColor: color,
    borderRightColor: color,
    animation: `${rev ? "lo-spin-reverse" : "lo-spin"} ${dur} linear infinite`,
  });

  return (
    <div style={{ position: "relative", width: "72px", height: "72px" }}>
      <div style={ring("72px", "#d8daff", "1.0s", false)} />
      <div style={ring("52px", "#c6f5f0", "1.6s", true)}  />
      <div style={ring("34px", "#fdfbf7", "2.2s", false)} />
      {/* inner dot */}
      <div style={{
        position: "absolute", inset: 0, margin: "auto",
        width: "8px", height: "8px", borderRadius: "50%",
        background: "#c6f5f0",
        animation: "lo-pulse-dot 1.2s ease-in-out infinite",
      }} />
    </div>
  );
}

/* ─── Animated status text carousel ─────────────────────── */
const HINTS = [
  "Encrypting your data…",
  "Talking to the blockchain…",
  "Pinning to IPFS…",
  "Verifying transaction…",
  "Almost there…",
];

function StatusCarousel() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % HINTS.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <p key={idx} style={{
      color: "rgba(216,218,255,0.6)",
      fontSize: "0.75rem",
      animation: "lo-fadein 0.5s ease",
      marginTop: "0.25rem",
    }}>
      {HINTS[idx]}
    </p>
  );
}

/* ─── Main component ──────────────────────────────────────── */
function LoadingOverlay({ message, success, failure, statusMessage }) {
  useEffect(() => { injectStyles(); }, []);
  if (!message && !success && !failure) return null;

  const backdrop = {
    position: "fixed", inset: 0, zIndex: 9999,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(5,10,31,0.75)",
    backdropFilter: "blur(10px)",
    WebkitBackdropFilter: "blur(10px)",
  };

  const card = {
    background: "linear-gradient(160deg, #0f172a 0%, #050a1f 100%)",
    border: "1px solid rgba(216,218,255,0.12)",
    borderRadius: "24px",
    padding: "2.75rem 2.5rem",
    boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(198,245,240,0.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.1rem",
    minWidth: "300px",
    maxWidth: "380px",
    textAlign: "center",
    animation: "lo-fadein 0.3s ease",
  };

  /* ── Failure state ── */
  if (failure) return (
    <div style={backdrop}>
      <div style={card}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "linear-gradient(135deg, #450a0a, #7f1d1d)",
          border: "1px solid #ef4444",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.8rem",
          animation: "lo-shake 0.5s ease",
        }}>✕</div>
        <p style={{ color: "#fca5a5", fontWeight: 700, fontSize: "1.1rem", fontFamily: "Playfair Display, serif" }}>
          Transaction Failed
        </p>
        {statusMessage && <p style={{ color: "rgba(216,218,255,0.5)", fontSize: "0.85rem" }}>{statusMessage}</p>}
      </div>
    </div>
  );

  /* ── Success state ── */
  if (success) return (
    <div style={backdrop}>
      <div style={card}>
        <div style={{
          width: "64px", height: "64px", borderRadius: "50%",
          background: "linear-gradient(135deg, #052e16, #065f46)",
          border: "1px solid #10b981",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.8rem",
          animation: "lo-bounce-check 0.5s cubic-bezier(0.34,1.56,0.64,1)",
        }}>✓</div>
        <p style={{ color: "#6ee7b7", fontWeight: 700, fontSize: "1.1rem", fontFamily: "Playfair Display, serif" }}>
          Done!
        </p>
        {statusMessage && <p style={{ color: "rgba(216,218,255,0.5)", fontSize: "0.85rem" }}>{statusMessage}</p>}
      </div>
    </div>
  );

  /* ── Loading state ── */
  return (
    <div style={backdrop}>
      <div style={card}>
        {/* Blockchain mesh illustration */}
        <div style={{ position: "relative", width: "88px", height: "88px" }}>
          <BlockchainNodes />
          {/* Triple spinner over nodes */}
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Spinner />
          </div>
        </div>

        {/* Status text */}
        <div>
          <p style={{
            color: "#fdfbf7",
            fontWeight: 600,
            fontSize: "1rem",
            fontFamily: "Playfair Display, serif",
            marginBottom: "0.15rem",
          }}>
            {message || "Processing…"}
          </p>
          <StatusCarousel />
        </div>

        {/* Progress dot row */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: i === 0 ? "#c6f5f0" : "rgba(198,245,240,0.2)",
              animation: `lo-pulse-dot 1.4s ease-in-out ${i * 0.25}s infinite`,
            }} />
          ))}
        </div>

        <p style={{ color: "rgba(216,218,255,0.3)", fontSize: "0.7rem", letterSpacing: "0.04em" }}>
          PLEASE KEEP THIS WINDOW OPEN
        </p>
      </div>
    </div>
  );
}

export default LoadingOverlay;

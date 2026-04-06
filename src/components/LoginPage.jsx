import React from "react";
import logo from "../assets/medchain-logo.svg";

function LoginPage({ connectWallet, connectPrivy, darkMode }) {
  const hasMetaMask = typeof window.ethereum !== "undefined";
  const dm = darkMode;

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* ── Left Panel ── */}
      <div
        style={{
          flex: "1 1 50%",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #1e1b4b 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Background glow blobs */}
        <div style={{
          position: "absolute", width: "350px", height: "350px",
          borderRadius: "50%", top: "10%", left: "10%",
          background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", width: "300px", height: "300px",
          borderRadius: "50%", bottom: "10%", right: "5%",
          background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Hero Illustration */}
        <div style={{
          width: "min(220px, 72%)",
          marginBottom: "1.75rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <svg viewBox="0 0 120 130" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", filter: "drop-shadow(0 8px 24px rgba(99,102,241,0.25))" }}>
            {/* Shield shape */}
            <path
              d="M60 8 L104 28 L104 70 Q104 100 60 122 Q16 100 16 70 L16 28 Z"
              fill="rgba(99,102,241,0.15)"
              stroke="rgba(129,140,248,0.6)"
              strokeWidth="2"
            />
            {/* Lock body */}
            <rect x="43" y="62" width="34" height="28" rx="5" fill="#818cf8" />
            {/* Lock shackle */}
            <path
              d="M50 62 L50 52 Q50 40 60 40 Q70 40 70 52 L70 62"
              fill="none"
              stroke="#a5b4fc"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Keyhole */}
            <circle cx="60" cy="74" r="5" fill="#1e1b4b" />
            <rect x="57" y="74" width="6" height="9" rx="1" fill="#1e1b4b" />
          </svg>
        </div>

        {/* Tagline */}
        <h2 style={{
          color: "#fff",
          fontSize: "1.45rem",
          fontWeight: 800,
          textAlign: "center",
          marginBottom: "0.5rem",
          lineHeight: 1.3,
        }}>
          Your Medical Records,{" "}
          <span style={{ color: "#818cf8" }}>On-Chain. Always.</span>
        </h2>
        <p style={{
          color: "#94a3b8",
          fontSize: "1rem",
          textAlign: "center",
          maxWidth: "380px",
          marginBottom: "1.25rem",
          lineHeight: 1.6,
        }}>
          A Decentralized, Health Record System — No central server, no middleman. Your data lives on Blockchain, owned only by you.
        </p>

        {/* Feature Pills */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", maxWidth: "360px" }}>
          {[
            { icon: "🔒", label: "Your Records Stay Private" },
            { icon: "⛓️", label: "No One Can Alter Your Data" },
            { icon: "🩺", label: "You Control Who Sees Your Records" },
          ].map(({ icon, label }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              padding: "0.75rem 1.25rem",
              backdropFilter: "blur(6px)",
            }}>
              <span style={{ fontSize: "1.3rem" }}>{icon}</span>
              <span style={{ color: "#e2e8f0", fontSize: "0.9rem", fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div
        style={{
          flex: "1 1 50%",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div style={{
          background: dm ? "#1e293b" : "#fff",
          borderRadius: "24px",
          boxShadow: dm ? "0 8px 40px rgba(0,0,0,0.5)" : "0 8px 40px rgba(0,0,0,0.10)",
          padding: "3rem 2.5rem",
          width: "100%",
          maxWidth: "420px",
          textAlign: "center",
          border: `1px solid ${dm ? "#334155" : "#e2e8f0"}`,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1.25rem" }}>
            <img src={logo} alt="MedChain" style={{ width: "64px", height: "64px" }} />
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: "2rem", fontWeight: 800, color: dm ? "#f1f5f9" : "#0f172a",
            marginBottom: "0.5rem", lineHeight: 1.2,
          }}>
            Welcome to MedChain
          </h1>
          <p style={{ color: dm ? "#94a3b8" : "#64748b", fontSize: "0.95rem", marginBottom: "1.5rem", lineHeight: 1.5 }}>
            Connect your wallet to securely access your medical records on the blockchain.
          </p>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem",
          }}>
            <div style={{ flex: 1, height: "1px", background: dm ? "#334155" : "#e2e8f0" }} />
            <span style={{ color: dm ? "#94a3b8" : "#94a3b8", fontSize: "0.8rem", whiteSpace: "nowrap" }}>Sign in with</span>
            <div style={{ flex: 1, height: "1px", background: dm ? "#334155" : "#e2e8f0" }} />
          </div>

          {/* MetaMask — connect or install */}
          {hasMetaMask ? (
            <button
              onClick={connectWallet}
              style={{
                width: "100%",
                padding: "1rem 1.5rem",
                background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
                color: "#fff",
                border: "none",
                borderRadius: "14px",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.5)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)";
              }}
            >
              <span style={{ fontSize: "1.4rem" }}>🦊</span>
              Connect MetaMask
            </button>
          ) : (
            <>
              {/* No MetaMask detected — show install prompt */}
              <div style={{
                background: dm ? "#451a03" : "linear-gradient(135deg, #fff7ed, #ffedd5)",
                border: `1.5px solid ${dm ? "#78350f" : "#fb923c"}`,
                borderRadius: "14px",
                padding: "1rem 1.25rem",
                marginBottom: "0.25rem",
                textAlign: "left",
              }}>
                <p style={{ fontWeight: 700, color: dm ? "#fcd34d" : "#9a3412", fontSize: "0.9rem", marginBottom: "0.3rem" }}>
                  🦊 MetaMask not detected
                </p>
                <p style={{ color: dm ? "#fde68a" : "#7c2d12", fontSize: "0.8rem", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                  Install the MetaMask browser extension to connect your wallet on desktop.
                </p>
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.6rem",
                    width: "100%",
                    padding: "0.75rem 1.25rem",
                    background: "linear-gradient(135deg, #f97316, #ea580c)",
                    color: "#fff",
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    textDecoration: "none",
                    boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
                    transition: "transform 0.15s ease, box-shadow 0.15s ease",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(249,115,22,0.45)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(249,115,22,0.35)";
                  }}
                >
                  <span style={{ fontSize: "1.2rem" }}>🦊</span>
                  Install MetaMask Extension
                </a>
              </div>
            </>
          )}

          {/* Privy Login Button — Secondary Option */}
          <div style={{
            display: "flex", alignItems: "center", gap: "1rem", margin: "1.5rem 0 1rem",
          }}>
            <div style={{ flex: 1, height: "1px", background: dm ? "#334155" : "#e2e8f0", opacity: 0.5 }} />
            <span style={{ color: dm ? "#64748b" : "#94a3b8", fontSize: "0.75rem", whiteSpace: "nowrap" }}>or use digital identity</span>
            <div style={{ flex: 1, height: "1px", background: dm ? "#334155" : "#e2e8f0", opacity: 0.5 }} />
          </div>

          <button
            onClick={connectPrivy}
            style={{
              width: "100%",
              padding: "0.8rem 1.5rem",
              background: dm ? "rgba(99, 102, 241, 0.1)" : "#f1f5f9",
              color: dm ? "#a5b4fc" : "#4f46e5",
              border: `1px solid ${dm ? "rgba(99, 102, 241, 0.3)" : "#e2e8f0"}`,
              borderRadius: "14px",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = dm ? "rgba(99, 102, 241, 0.2)" : "#e2e8f0";
              e.currentTarget.style.borderColor = "#6366f1";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = dm ? "rgba(99, 102, 241, 0.1)" : "#f1f5f9";
              e.currentTarget.style.borderColor = dm ? "rgba(99, 102, 241, 0.3)" : "#e2e8f0";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            <span style={{ fontSize: "1.2rem" }}>🛡️</span>
            Login with Email/Wallets
          </button>


          {/* Footer note */}
          {!hasMetaMask && (
            <p style={{ color: dm ? "#fcd34d" : "#f97316", fontSize: "0.75rem", marginTop: "0.5rem", lineHeight: 1.5, background: dm ? "#451a03" : "#fff7ed", padding: "0.4rem 0.75rem", borderRadius: "8px" }}>
              💡 No extension? Use <strong style={{ color: dm ? "#fbbf24" : "#ea580c" }}>Login with Email/Wallets</strong> to connect from your phone or desktop.
            </p>
          )}
          <p style={{ color: dm ? "#64748b" : "#94a3b8", fontSize: "0.78rem", marginTop: "0.75rem", lineHeight: 1.5 }}>
            🔐 Secured by Ethereum · Sepolia Testnet<br />
            Your keys. Your data. Your control.
          </p>
          <button 
            onClick={() => { if(window.confirm("Are you sure you want to delete all profiles, chats, and mock data from this browser?")) { localStorage.clear(); window.location.reload(); } }}
            style={{ marginTop: "1.5rem", background: "transparent", border: "none", color: dm ? "#ef4444" : "#ef4444", fontSize: "0.75rem", fontWeight: 700, cursor: "pointer", opacity: 0.7 }}
          >
            🧹 Reset Local Test Data
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;

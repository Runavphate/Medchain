import React, { useState } from "react";
import logo from "../assets/medchain-logo.svg";

function LoginPage({ connectWeb3Modal, darkMode, onRoleSelect }) {
  const dm = darkMode;
  const [selectedRole, setSelectedRole] = useState("");

  const ROLES = [
    {
      key: "patient",
      emoji: "🧑",
      title: "Patient",
      desc: "Manage your records & control doctor access",
      gradient: "linear-gradient(135deg, #d1fae5, #6ee7b7)",
      selectedGradient: "linear-gradient(135deg, #059669, #10b981)",
      glow: "rgba(16,185,129,0.35)",
      border: "#10b981",
    },
    {
      key: "doctor",
      emoji: "👨‍⚕️",
      title: "Doctor",
      desc: "View patient records you've been granted access to",
      gradient: "linear-gradient(135deg, #e0e7ff, #a5b4fc)",
      selectedGradient: "linear-gradient(135deg, #4f46e5, #6366f1)",
      glow: "rgba(99,102,241,0.35)",
      border: "#6366f1",
    },
  ];

  const handleConnect = () => {
    if (selectedRole) onRoleSelect(selectedRole);
    connectWeb3Modal();
  };

  const canConnect = selectedRole !== "";

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
            <path
              d="M60 8 L104 28 L104 70 Q104 100 60 122 Q16 100 16 70 L16 28 Z"
              fill="rgba(99,102,241,0.15)"
              stroke="rgba(129,140,248,0.6)"
              strokeWidth="2"
            />
            <rect x="43" y="62" width="34" height="28" rx="5" fill="#818cf8" />
            <path
              d="M50 62 L50 52 Q50 40 60 40 Q70 40 70 52 L70 62"
              fill="none"
              stroke="#a5b4fc"
              strokeWidth="6"
              strokeLinecap="round"
            />
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
          A Decentralized Health Record System — No central server, no middleman. Your data lives on Blockchain, owned only by you.
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
          background: dm ? "#0f172a" : "#f8fafc",
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
          padding: "2.5rem 2.5rem",
          width: "100%",
          maxWidth: "420px",
          textAlign: "center",
          border: `1px solid ${dm ? "#334155" : "#e2e8f0"}`,
        }}>
          {/* Logo */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <img src={logo} alt="MedChain" style={{ width: "56px", height: "56px" }} />
          </div>

          {/* Heading */}
          <h1 style={{
            fontSize: "1.75rem", fontWeight: 800, color: dm ? "#f1f5f9" : "#0f172a",
            marginBottom: "0.4rem", lineHeight: 1.2,
          }}>
            Welcome to MedChain
          </h1>
          <p style={{ color: dm ? "#94a3b8" : "#64748b", fontSize: "0.88rem", marginBottom: "1.75rem", lineHeight: 1.5 }}>
            Choose your role, then connect your wallet to get started.
          </p>

          {/* ── Role Picker ── */}
          <p style={{
            fontSize: "0.72rem", fontWeight: 700, color: dm ? "#64748b" : "#94a3b8",
            textTransform: "uppercase", letterSpacing: "0.07em",
            marginBottom: "0.75rem", textAlign: "left",
          }}>
            I am a…
          </p>
          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {ROLES.map((r) => {
              const isSelected = selectedRole === r.key;
              return (
                <button
                  key={r.key}
                  id={`role-select-${r.key}`}
                  onClick={() => setSelectedRole(r.key)}
                  style={{
                    flex: 1,
                    padding: "1rem 0.75rem",
                    borderRadius: "16px",
                    border: `2px solid ${isSelected ? r.border : (dm ? "#334155" : "#e2e8f0")}`,
                    background: isSelected
                      ? r.selectedGradient
                      : (dm ? "#0f172a" : "#f8fafc"),
                    color: isSelected ? "#fff" : (dm ? "#94a3b8" : "#64748b"),
                    cursor: "pointer",
                    transition: "all 0.18s ease",
                    boxShadow: isSelected ? `0 6px 24px ${r.glow}` : "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.4rem",
                    textAlign: "center",
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = r.border;
                      e.currentTarget.style.boxShadow = `0 4px 16px ${r.glow}`;
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.borderColor = dm ? "#334155" : "#e2e8f0";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <span style={{ fontSize: "1.8rem", lineHeight: 1 }}>{r.emoji}</span>
                  <span style={{ fontWeight: 800, fontSize: "0.95rem" }}>{r.title}</span>
                  <span style={{
                    fontSize: "0.72rem",
                    color: isSelected ? "rgba(255,255,255,0.8)" : (dm ? "#475569" : "#94a3b8"),
                    lineHeight: 1.3,
                  }}>
                    {r.desc}
                  </span>
                  {isSelected && (
                    <span style={{
                      marginTop: "0.25rem", fontSize: "0.7rem",
                      background: "rgba(255,255,255,0.2)",
                      padding: "2px 10px", borderRadius: "999px", fontWeight: 700,
                    }}>
                      ✓ Selected
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Connect Button */}
          <button
            id="connect-wallet-btn"
            onClick={handleConnect}
            disabled={!canConnect}
            style={{
              width: "100%",
              padding: "1rem 1.5rem",
              background: canConnect
                ? "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)"
                : (dm ? "#1e293b" : "#e2e8f0"),
              color: canConnect ? "#fff" : (dm ? "#475569" : "#94a3b8"),
              border: "none",
              borderRadius: "14px",
              fontSize: "1rem",
              fontWeight: 700,
              cursor: canConnect ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.75rem",
              boxShadow: canConnect ? "0 4px 20px rgba(99,102,241,0.4)" : "none",
              transition: "transform 0.15s ease, box-shadow 0.15s ease, background 0.2s",
            }}
            onMouseEnter={e => {
              if (canConnect) {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 28px rgba(99,102,241,0.55)";
              }
            }}
            onMouseLeave={e => {
              if (canConnect) {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.4)";
              }
            }}
          >
            <span style={{ fontSize: "1.4rem" }}>🔗</span>
            {canConnect ? `Connect Wallet as ${ROLES.find(r => r.key === selectedRole)?.title}` : "Select a role first"}
          </button>

          <p style={{ color: dm ? "#475569" : "#94a3b8", fontSize: "0.75rem", marginTop: "1rem", lineHeight: 1.6 }}>
            Supports MetaMask, WalletConnect, Coinbase Wallet &amp; more
          </p>
          <p style={{ color: dm ? "#64748b" : "#94a3b8", fontSize: "0.78rem", marginTop: "0.4rem", lineHeight: 1.5 }}>
            🔐 Secured by Ethereum · Sepolia Testnet<br />
            Your keys. Your data. Your control.
          </p>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;

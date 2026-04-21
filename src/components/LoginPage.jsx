import React, { useState } from "react";


function LoginPage({ connectWeb3Modal, darkMode, onRoleSelect }) {
  const dm = darkMode;
  const [selectedRole, setSelectedRole] = useState("");

  const ROLES = [
    {
      key: "patient",
      emoji: "🧑",
      title: "Patient",
      desc: "Manage your records & control access",
      bg: dm ? "rgba(253, 251, 247, 0.03)" : "rgba(5, 10, 31, 0.02)",
      selectedBg: dm ? "rgba(198, 245, 240, 0.15)" : "#c6f5f0",
      glow: "rgba(198, 245, 240, 0.4)",
      border: "#c6f5f0",
      selectedText: dm ? "#fdfbf7" : "#050a1f"
    },
    {
      key: "doctor",
      emoji: "👨‍⚕️",
      title: "Doctor",
      desc: "View authorized patient records",
      bg: dm ? "rgba(253, 251, 247, 0.03)" : "rgba(5, 10, 31, 0.02)",
      selectedBg: dm ? "rgba(216, 218, 255, 0.15)" : "#d8daff",
      glow: "rgba(216, 218, 255, 0.4)",
      border: "#d8daff",
      selectedText: dm ? "#fdfbf7" : "#050a1f"
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
          background: "transparent",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "3rem",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Soft ambient blobs instead of harsh gradients */}
        <div 
          className="animate-float"
          style={{
          position: "absolute", width: "500px", height: "500px",
          borderRadius: "50%", top: "-10%", left: "-10%",
          background: "radial-gradient(circle, rgba(216, 218, 255, 0.08) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />
        <div 
          className="animate-float-delayed"
          style={{
          position: "absolute", width: "400px", height: "400px",
          borderRadius: "50%", bottom: "0%", right: "-5%",
          background: "radial-gradient(circle, rgba(198, 245, 240, 0.06) 0%, transparent 60%)",
          pointerEvents: "none",
        }} />

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "480px", width: "100%", zIndex: 10 }}>
          {/* Tagline */}
          <h2 
            className="animate-fade-in-up"
            style={{
            color: dm ? "#fdfbf7" : "#050a1f",
            fontFamily: "Playfair Display, serif",
            fontSize: "3.5rem",
            fontWeight: 400,
            lineHeight: 1.1,
            marginBottom: "1.5rem",
            letterSpacing: "-0.02em",
            opacity: 0
          }}>
            Your health data.<br/>
            <span style={{ color: dm ? "#d8daff" : "#4f46e5", fontStyle: "italic" }}>Absolute control.</span>
          </h2>
          <p 
            className="animate-fade-in-up-delay-1"
            style={{
            color: dm ? "rgba(253, 251, 247, 0.7)" : "rgba(5, 10, 31, 0.65)",
            fontFamily: "Inter, sans-serif",
            fontSize: "1.05rem",
            maxWidth: "400px",
            marginBottom: "3rem",
            lineHeight: 1.6,
            fontWeight: 300,
            opacity: 0
          }}>
            A highly secure, decentralized medical record system engineered for complete privacy. Powered by decentralized cryptographic architecture.
          </p>

          {/* Feature List */}
          <div className="animate-fade-in-up-delay-2" style={{ display: "flex", flexDirection: "column", gap: "1rem", opacity: 0 }}>
            {[
              { label: "End-to-End Encryption" },
              { label: "On-Chain Audit Trails" },
              { label: "Patient-Controlled Access" },
            ].map(({ label }) => (
              <div key={label} style={{
                display: "flex", alignItems: "center", gap: "1rem"
              }}>
                <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: dm ? "rgba(216, 218, 255, 0.1)" : "rgba(5, 10, 31, 0.08)", border: `1px solid ${dm ? "rgba(216, 218, 255, 0.3)" : "rgba(5, 10, 31, 0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: dm ? "#d8daff" : "#050a1f", fontSize: "0.7rem" }}>✓</span>
                </div>
                <span style={{ color: dm ? "#d8daff" : "#050a1f", fontSize: "0.95rem", fontWeight: 400, letterSpacing: "0.02em" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div
        style={{
          flex: "1 1 50%",
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div 
          className="animate-fade-in-up-delay-1"
          style={{
          background: dm ? "#0f172a" : "#fff",
          borderRadius: "32px",
          boxShadow: dm ? "0 20px 60px rgba(0,0,0,0.6)" : "0 20px 60px rgba(5,10,31,0.05)",
          padding: "3.5rem 3rem",
          width: "100%",
          maxWidth: "460px",
          textAlign: "center",
          border: `1px solid ${dm ? "#1e293b" : "rgba(216, 218, 255, 0.4)"}`,
          opacity: 0
        }}>
          {/* Heading */}
          <h1 style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "2.2rem", fontWeight: 400, color: dm ? "#fdfbf7" : "#050a1f",
            marginBottom: "0.5rem", lineHeight: 1.2, letterSpacing: "-0.02em"
          }}>
            Welcome Back
          </h1>
          <p style={{ fontFamily: "Inter, sans-serif", color: dm ? "rgba(216, 218, 255, 0.7)" : "rgba(5, 10, 31, 0.6)", fontSize: "0.95rem", marginBottom: "2.5rem", lineHeight: 1.5 }}>
            Please authenticate to view your dashboard.
          </p>

          {/* ── Role Picker ── */}
          <p style={{
            fontSize: "0.75rem", fontWeight: 600, color: dm ? "rgba(216, 218, 255, 0.5)" : "rgba(5, 10, 31, 0.4)",
            textTransform: "uppercase", letterSpacing: "0.08em",
            marginBottom: "1rem", textAlign: "left",
          }}>
            Select Access Profile
          </p>
          <div style={{ display: "flex", gap: "1rem", marginBottom: "2.5rem" }}>
            {ROLES.map((r) => {
              const isSelected = selectedRole === r.key;
              return (
                <button
                  key={r.key}
                  id={`role-select-${r.key}`}
                  onClick={() => setSelectedRole(r.key)}
                  style={{
                    flex: 1,
                    padding: "1.25rem 0.5rem",
                    borderRadius: "20px",
                    border: `1px solid ${isSelected ? r.border : (dm ? "#1e293b" : "rgba(5, 10, 31, 0.1)")}`,
                    background: isSelected ? r.selectedBg : r.bg,
                    color: isSelected ? r.selectedText : (dm ? "rgba(253, 251, 247, 0.6)" : "rgba(5, 10, 31, 0.6)"),
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    boxShadow: isSelected ? `0 8px 24px ${r.glow}` : "none",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.5rem",
                    textAlign: "center",
                  }}
                >
                  <span style={{ fontSize: "2rem", lineHeight: 1, filter: isSelected ? "none" : "grayscale(80%) opacity(70%)" }}>{r.emoji}</span>
                  <span style={{ fontFamily: "Playfair Display, serif", fontWeight: 600, fontSize: "1.1rem" }}>{r.title}</span>
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
              padding: "1.1rem 1.5rem",
              background: canConnect
                ? (dm ? "#d8daff" : "#050a1f") 
                : (dm ? "#1e293b" : "#f1f5f9"),
              color: canConnect ? (dm ? "#050a1f" : "#fdfbf7") : (dm ? "rgba(216, 218, 255, 0.3)" : "rgba(5, 10, 31, 0.3)"),
              border: "none",
              borderRadius: "16px",
              fontFamily: "Inter, sans-serif",
              fontSize: "1rem",
              fontWeight: 500,
              letterSpacing: "0.02em",
              cursor: canConnect ? "pointer" : "not-allowed",
              boxShadow: canConnect ? (dm ? "0 8px 24px rgba(216, 218, 255, 0.15)" : "0 8px 24px rgba(5, 10, 31, 0.15)") : "none",
              transition: "all 0.3s ease",
            }}
          >
            {canConnect ? `Authenticate as ${ROLES.find(r => r.key === selectedRole)?.title}` : "Select a profile to continue"}
          </button>

          <p style={{ color: dm ? "rgba(216, 218, 255, 0.4)" : "rgba(5, 10, 31, 0.4)", fontSize: "0.75rem", marginTop: "1.5rem", lineHeight: 1.6 }}>
            Secured by Zero-Knowledge Proofs & Ethereum
          </p>

        </div>
      </div>
    </div>
  );
}

export default LoginPage;

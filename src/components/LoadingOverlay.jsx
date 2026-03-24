import React from "react";

function LoadingOverlay({ message, success, failure, statusMessage }) {
  if (!message && !success && !failure) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(15,23,42,0.6)", backdropFilter: "blur(4px)" }}>
      <div style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "2.5rem 3rem",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.25rem",
        minWidth: "280px",
        maxWidth: "380px",
        textAlign: "center",
      }}>
        {failure ? (
          <>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "linear-gradient(135deg, #fee2e2, #fca5a5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem",
            }}>✕</div>
            <p style={{ color: "#dc2626", fontWeight: 700, fontSize: "1.1rem" }}>Transaction Failed</p>
            {statusMessage && <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>{statusMessage}</p>}
          </>
        ) : success ? (
          <>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "linear-gradient(135deg, #dcfce7, #86efac)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem",
            }}>✓</div>
            <p style={{ color: "#16a34a", fontWeight: 700, fontSize: "1.1rem" }}>Done!</p>
            {statusMessage && <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>{statusMessage}</p>}
          </>
        ) : (
          <>
            {/* Animated spinner */}
            <div style={{ position: "relative", width: "60px", height: "60px" }}>
              <div style={{
                position: "absolute", inset: 0,
                borderRadius: "50%",
                border: "5px solid #e0e7ff",
                borderTop: "5px solid #6366f1",
                animation: "spin 0.85s linear infinite",
              }} />
            </div>

            {message && (
              <div>
                <p style={{
                  color: "#0f172a", fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem",
                }}>Processing…</p>
                <p style={{
                  color: "#6366f1", fontSize: "0.875rem", fontWeight: 500,
                  background: "#eef2ff", padding: "0.4rem 0.75rem",
                  borderRadius: "999px",
                }}>{message}</p>
              </div>
            )}

            <p style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
              Please wait and don't close this window
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default LoadingOverlay;

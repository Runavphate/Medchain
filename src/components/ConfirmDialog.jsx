import React from "react";

function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirm", confirmColor = "#ef4444" }) {
    if (!open) return null;
    return (
        <div
            style={{
                position: "fixed", inset: 0, zIndex: 9998,
                background: "rgba(15,23,42,0.55)", backdropFilter: "blur(4px)",
                display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
            }}
            onClick={onCancel}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: "#fff", borderRadius: "20px", padding: "2rem 2.5rem",
                    maxWidth: "420px", width: "100%",
                    boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
                    textAlign: "center",
                }}
            >
                <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>⚠️</div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>{title}</h3>
                <p style={{ color: "#64748b", fontSize: "0.875rem", lineHeight: 1.6, marginBottom: "1.75rem" }}>{message}</p>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                    <button
                        onClick={onCancel}
                        style={{
                            padding: "0.65rem 1.5rem", border: "1.5px solid #e2e8f0",
                            borderRadius: "10px", background: "#f8fafc", color: "#374151",
                            fontWeight: 600, fontSize: "0.9rem", cursor: "pointer",
                            transition: "background 0.15s",
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                        onMouseLeave={e => e.currentTarget.style.background = "#f8fafc"}
                    >Cancel</button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: "0.65rem 1.5rem", border: "none",
                            borderRadius: "10px", background: confirmColor, color: "#fff",
                            fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
                            boxShadow: `0 4px 16px ${confirmColor}55`,
                            transition: "transform 0.12s, box-shadow 0.12s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                    >{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
}

export default ConfirmDialog;

import React, { useState, useCallback, useEffect } from "react";

// ─── Single Toast ───────────────────────────────────────────────────
function ToastItem({ toast, onRemove }) {
    useEffect(() => {
        const t = setTimeout(() => onRemove(toast.id), toast.duration || 3500);
        return () => clearTimeout(t);
    }, [toast, onRemove]);

    const styles = {
        success: { bg: "#dcfce7", border: "#86efac", iconBg: "#16a34a", icon: "✓" },
        error: { bg: "#fee2e2", border: "#fca5a5", iconBg: "#dc2626", icon: "✕" },
        info: { bg: "#e0f2fe", border: "#7dd3fc", iconBg: "#0284c7", icon: "ℹ" },
        warning: { bg: "#fff7ed", border: "#fdba74", iconBg: "#f97316", icon: "⚠" },
    };
    const s = styles[toast.type] || styles.info;

    return (
        <div
            style={{
                display: "flex", alignItems: "flex-start", gap: "0.75rem",
                background: s.bg, border: `1.5px solid ${s.border}`,
                borderRadius: "14px", padding: "0.85rem 1rem",
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                animation: "slideInToast 0.3s ease forwards",
                maxWidth: "360px", width: "fit-content",
                pointerEvents: "auto",
            }}
        >
            <div style={{
                width: "24px", height: "24px", borderRadius: "50%",
                background: s.iconBg, color: "#fff", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.8rem", flexShrink: 0,
            }}>{s.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
                {toast.title && <p style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a", marginBottom: "0.1rem" }}>{toast.title}</p>}
                <p style={{ fontSize: "0.8rem", color: "#475569", lineHeight: 1.4 }}>{toast.message}</p>
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: "1rem", lineHeight: 1, padding: "0 2px" }}
            >×</button>
        </div>
    );
}

// ─── Toast Container (renders at bottom-right) ───────────────────────
export function ToastContainer({ toasts, onRemove }) {
    if (!toasts.length) return null;
    return (
        <div style={{
            position: "fixed", bottom: "1.5rem", right: "1.5rem",
            display: "flex", flexDirection: "column", gap: "0.6rem",
            zIndex: 9999, pointerEvents: "none",
        }}>
            {toasts.map(t => <ToastItem key={t.id} toast={t} onRemove={onRemove} />)}
        </div>
    );
}

// ─── Hook ────────────────────────────────────────────────────────────
let _id = 0;
export function useToast() {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback(({ type = "info", title, message, duration = 3500 }) => {
        const id = ++_id;
        setToasts(prev => [...prev, { id, type, title, message, duration }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const toast = {
        success: (message, title) => addToast({ type: "success", title, message }),
        error: (message, title) => addToast({ type: "error", title, message }),
        info: (message, title) => addToast({ type: "info", title, message }),
        warning: (message, title) => addToast({ type: "warning", title, message }),
    };

    return { toasts, removeToast, toast };
}

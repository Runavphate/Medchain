import React, { useState, useEffect, useRef } from "react";
import { getPendingRequests } from "../utils/contract";

function NotificationBell({ account, role, darkMode }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [prevCount, setPrevCount] = useState(0);
  const [shaking, setShaking] = useState(false);
  const ref = useRef(null);

  // Poll for pending access requests when role is patient
  useEffect(() => {
    if (!account || role !== "patient") {
      setNotifications([]);
      return;
    }

    const poll = async () => {
      try {
        const addrs = await getPendingRequests();
        if (!addrs) return; // Guard against undefined
        
        setNotifications(
          addrs.map((addr) => {
            const dName = localStorage.getItem(`doctorName_${addr}`);
            const dHospital = localStorage.getItem(`hospitalName_${addr}`);
            return { id: addr, addr, dName, dHospital };
          })
        );
        // Shake bell if new requests arrived
        setShaking((prev) => {
          if (addrs.length > prevCount && addrs.length > 0) {
            setTimeout(() => setShaking(false), 800);
            return true;
          }
          return prev;
        });
        setPrevCount(addrs.length);
      } catch (err) {
        console.warn("Polling error (likely skipped due to session sync):", err.message);
      }
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [account, role]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dm = darkMode;
  const bg = dm ? "#1e293b" : "#fff";
  const border = dm ? "#334155" : "#e2e8f0";
  const textPrimary = dm ? "#f1f5f9" : "#0f172a";
  const textMuted = dm ? "#94a3b8" : "#64748b";
  const rowHover = dm ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";

  const unread = notifications.length;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((o) => !o)}
        title={unread > 0 ? `${unread} pending access request(s)` : "No new notifications"}
        style={{
          background: dm ? "#1e293b" : "#f1f5f9",
          border: `1.5px solid ${unread > 0 ? "#f59e0b" : border}`,
          borderRadius: "50%",
          width: "38px",
          height: "38px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          fontSize: "1.1rem",
          position: "relative",
          transition: "all 0.2s",
          animation: shaking ? "bellShake 0.6s ease-in-out" : "none",
        }}
      >
        🔔
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-5px",
              right: "-5px",
              background: "linear-gradient(135deg, #ef4444, #dc2626)",
              color: "#fff",
              borderRadius: "50%",
              width: "19px",
              height: "19px",
              fontSize: "0.62rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              border: "2px solid white",
              animation: "pulseBadge 2s ease-in-out infinite",
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 12px)",
            right: 0,
            width: "340px",
            background: bg,
            border: `1.5px solid ${border}`,
            borderRadius: "18px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
            zIndex: 200,
            overflow: "hidden",
            animation: "slideDown 0.18s ease-out",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "0.9rem 1.25rem",
              borderBottom: `1px solid ${border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: unread > 0
                ? dm ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.05)"
                : "transparent",
            }}
          >
            <span style={{ fontWeight: 800, color: textPrimary, fontSize: "0.9rem" }}>
              🔔 Notifications
            </span>
            {unread > 0 && (
              <span
                style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)",
                  color: "#fff",
                  borderRadius: "999px",
                  padding: "2px 10px",
                  fontSize: "0.7rem",
                  fontWeight: 700,
                }}
              >
                {unread} new
              </span>
            )}
          </div>

          {/* Body */}
          <div style={{ maxHeight: "340px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "2.5rem", lineHeight: 1 }}>✅</p>
                <p style={{ color: textPrimary, fontWeight: 700, marginTop: "0.75rem", fontSize: "0.9rem" }}>
                  All caught up!
                </p>
                <p style={{ color: textMuted, fontSize: "0.78rem", marginTop: "0.25rem" }}>
                  {role === "patient"
                    ? "No pending access requests."
                    : "Notifications appear here for patients."}
                </p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={n.id}
                  style={{
                    padding: "0.9rem 1.25rem",
                    borderBottom: i < notifications.length - 1 ? `1px solid ${border}` : "none",
                    background: "transparent",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = rowHover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #fef3c7, #fbbf24)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.1rem",
                        flexShrink: 0,
                      }}
                    >
                      🔐
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.83rem", color: textPrimary, fontWeight: 700, marginBottom: "0.2rem" }}>
                        New Access Request
                      </p>
                      <p style={{ fontSize: "0.75rem", color: textMuted }}>
                        {n.dName ? (
                          <>
                            <strong>Dr. {n.dName}</strong>
                            {n.dHospital && <> ({n.dHospital})</>}
                          </>
                        ) : (
                          <>{n.addr.slice(0, 10)}…{n.addr.slice(-6)}</>
                        )}{" "}
                        wants to view your records.
                      </p>
                      <p
                        style={{
                          fontSize: "0.68rem",
                          color: dm ? "#475569" : "#94a3b8",
                          marginTop: "0.3rem",
                        }}
                      >
                        Go to Patient Dashboard → Access Requests tab to approve
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div
              style={{
                padding: "0.7rem 1.25rem",
                borderTop: `1px solid ${border}`,
                textAlign: "center",
                background: dm ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
              }}
            >
              <p style={{ fontSize: "0.72rem", color: textMuted }}>
                Manage in your Patient Dashboard
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes bellShake {
          0%,100% { transform: rotate(0); }
          20% { transform: rotate(-18deg); }
          40% { transform: rotate(18deg); }
          60% { transform: rotate(-12deg); }
          80% { transform: rotate(12deg); }
        }
        @keyframes pulseBadge {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default NotificationBell;

/**
 * NotificationBell.jsx
 *
 * Shows for BOTH roles:
 *   - 🔔 Pending access requests (patient only, from blockchain)
 *   - 💬 Unread messages from any connected doctor/patient (Firebase)
 *   - ✅ Access granted events (doctor only, from blockchain)
 *
 * Unread = messages sent AFTER the last time this user opened that chat.
 * lastSeen timestamps are stored in Firebase under: chatSeen/<myAddr>/<chatId>
 */

import React, { useState, useEffect, useRef } from "react";
import { getPendingRequests } from "../utils/contract";
import { getUserProfile } from "../utils/db";
import { ref, get, set, onValue, off } from "firebase/database";
import { db } from "../utils/firebase";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const norm = (a) => (a || "").toLowerCase().replace(/[.#$[\]]/g, "_");
const chatId = (a, b) => `chat_${[a, b].sort().join("_")}`;

async function getLastSeen(myAddr, partnerId) {
  try {
    const snap = await get(ref(db, `chatSeen/${norm(myAddr)}/${norm(partnerId)}`));
    return snap.exists() ? snap.val() : 0;
  } catch { return 0; }
}

async function setLastSeen(myAddr, partnerId) {
  try {
    await set(ref(db, `chatSeen/${norm(myAddr)}/${norm(partnerId)}`), Date.now());
  } catch { }
}

// ─── Component ────────────────────────────────────────────────────────────────
function NotificationBell({ account, role, darkMode, grantedDoctors = [], grantedPatients = [] }) {
  const [open, setOpen] = useState(false);
  const [reqNotifs, setReqNotifs] = useState([]);      // pending access requests
  const [msgNotifs, setMsgNotifs] = useState([]);      // unread messages
  const [accessNotifs, setAccessNotifs] = useState([]); // access granted (doctor)
  const [shaking, setShaking] = useState(false);
  const ref_ = useRef(null);
  const prevCountRef = useRef(0);

  // ── 1. Poll pending access requests (patient only) ────────────────────────
  useEffect(() => {
    if (!account || role !== "patient") { setReqNotifs([]); return; }

    const poll = async () => {
      try {
        const addrs = await getPendingRequests();
        if (!addrs) return;

        const profiles = await Promise.all(
          addrs.map((a) => getUserProfile(a).catch(() => ({})))
        );

        const notifs = addrs.map((addr, i) => ({
          id: `req_${addr}`,
          type: "access_request",
          icon: "🔐",
          title: "New Access Request",
          body: profiles[i]?.name
            ? `Dr. ${profiles[i].name}${profiles[i].hospital ? ` (${profiles[i].hospital})` : ""} wants your records.`
            : `${addr.slice(0, 10)}…${addr.slice(-6)} wants your records.`,
          addr,
        }));

        setReqNotifs(notifs);

        if (addrs.length > prevCountRef.current && addrs.length > 0) {
          setShaking(true);
          setTimeout(() => setShaking(false), 800);
        }
        prevCountRef.current = addrs.length;
      } catch (err) {
        console.warn("Polling error:", err.message);
      }
    };

    poll();
    const interval = setInterval(poll, 8000);
    return () => clearInterval(interval);
  }, [account, role]);

  // ── 2. Listen for unread messages from all connected partners ─────────────
  useEffect(() => {
    if (!account) return;

    // Partners array: doctors for patient, patients for doctor
    const partners = role === "patient" ? grantedDoctors : grantedPatients;
    if (!partners.length) { setMsgNotifs([]); return; }

    const unsubs = [];
    const unreadMap = {};

    const flush = () => {
      const notifs = Object.values(unreadMap).filter(n => n.count > 0);
      setMsgNotifs(notifs);
      if (notifs.length > 0) { setShaking(true); setTimeout(() => setShaking(false), 800); }
    };

    partners.forEach((partnerAddr) => {
      const cid = chatId(account.toLowerCase(), partnerAddr.toLowerCase());
      const msgsRef = ref(db, `chats/${cid}/messages`);

      const unsub = onValue(msgsRef, async (snap) => {
        if (!snap.exists()) { unreadMap[partnerAddr] = { count: 0 }; flush(); return; }

        const lastSeen = await getLastSeen(account, partnerAddr);
        const msgs = Object.values(snap.val() || {});
        const unread = msgs.filter(
          m => m.sender?.toLowerCase() !== account.toLowerCase() && (m.clientTs || 0) > lastSeen
        );

        if (unread.length > 0) {
          getUserProfile(partnerAddr.toLowerCase()).then((profile) => {
            const name = profile?.name || "";
            const label = role === "patient" ? `Dr. ${name || partnerAddr.slice(0, 8) + "…"}` : (name || partnerAddr.slice(0, 8) + "…");
            unreadMap[partnerAddr] = {
              count: unread.length,
              id: `msg_${partnerAddr}`,
              type: "unread_message",
              icon: "💬",
              title: `${unread.length} unread message${unread.length > 1 ? "s" : ""}`,
              body: `From ${label}`,
              partnerAddr,
            };
            flush();
          });
        } else {
          unreadMap[partnerAddr] = { count: 0 };
          flush();
        }
      });

      unsubs.push(() => off(msgsRef, "value", unsub));
    });

    return () => unsubs.forEach(fn => fn());
  }, [account, role, grantedDoctors, grantedPatients]);

  // ── 3. Access granted events (doctor only) ────────────────────────────────
  useEffect(() => {
    if (!account || role !== "doctor") { setAccessNotifs([]); return; }

    // Read from Firebase activityLog for "access granted" events
    const logRef = ref(db, `users/${norm(account)}/activityLog`);
    const unsub = onValue(logRef, (snap) => {
      if (!snap.exists()) { setAccessNotifs([]); return; }
      const log = Object.values(snap.val() || {});
      const grants = log
        .filter(e => e.icon === "✅" && e.msg && e.msg.includes("gained access"))
        .slice(0, 5)
        .map((e, i) => ({
          id: `grant_${i}`,
          type: "access_granted",
          icon: "✅",
          title: "Access Granted",
          body: e.msg.replace("✅ ", ""),
        }));
      setAccessNotifs(grants);
    });

    return () => off(logRef, "value", unsub);
  }, [account, role]);

  // ── Close on outside click ────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (ref_.current && !ref_.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Mark messages as seen when bell is opened
  const handleOpen = () => {
    setOpen(o => !o);
  };

  const markMessageRead = async (partnerAddr) => {
    await setLastSeen(account, partnerAddr);
    setMsgNotifs(prev => prev.filter(n => n.partnerAddr !== partnerAddr));
  };

  // ── Aggregate all notifications ───────────────────────────────────────────
  const allNotifs = [
    ...reqNotifs,
    ...msgNotifs,
    ...(role === "doctor" ? accessNotifs : []),
  ];
  const unreadCount = allNotifs.length;

  // ── Theme ─────────────────────────────────────────────────────────────────
  const dm = darkMode;
  const bg = dm ? "#1e293b" : "#fff";
  const border = dm ? "#334155" : "#e2e8f0";
  const textPrimary = dm ? "#f1f5f9" : "#0f172a";
  const textMuted = dm ? "#94a3b8" : "#64748b";
  const rowHover = dm ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)";

  const TYPE_COLORS = {
    access_request: { bg: "linear-gradient(135deg, #fef3c7, #fbbf24)", icon: "🔐" },
    unread_message:  { bg: "linear-gradient(135deg, #ede9fe, #8b5cf6)", icon: "💬" },
    access_granted:  { bg: "linear-gradient(135deg, #d1fae5, #10b981)", icon: "✅" },
  };

  return (
    <div ref={ref_} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={handleOpen}
        title={unreadCount > 0 ? `${unreadCount} notification(s)` : "No new notifications"}
        style={{
          background: dm ? "#1e293b" : "#f1f5f9",
          border: `1.5px solid ${unreadCount > 0 ? "#f59e0b" : border}`,
          borderRadius: "50%",
          width: "38px", height: "38px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", fontSize: "1.1rem", position: "relative",
          transition: "all 0.2s",
          animation: shaking ? "bellShake 0.6s ease-in-out" : "none",
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: "-5px", right: "-5px",
            background: "linear-gradient(135deg, #ef4444, #dc2626)",
            color: "#fff", borderRadius: "50%",
            width: "19px", height: "19px", fontSize: "0.62rem",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, border: "2px solid white",
            animation: "pulseBadge 2s ease-in-out infinite",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 12px)", right: 0,
          width: "360px", background: bg,
          border: `1.5px solid ${border}`, borderRadius: "18px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          zIndex: 200, overflow: "hidden",
          animation: "slideDown 0.18s ease-out",
        }}>
          {/* Header */}
          <div style={{
            padding: "0.9rem 1.25rem",
            borderBottom: `1px solid ${border}`,
            display: "flex", justifyContent: "space-between", alignItems: "center",
            background: unreadCount > 0
              ? (dm ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.05)")
              : "transparent",
          }}>
            <span style={{ fontWeight: 800, color: textPrimary, fontSize: "0.9rem" }}>
              🔔 Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{
                background: "linear-gradient(135deg, #ef4444, #dc2626)",
                color: "#fff", borderRadius: "999px",
                padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700,
              }}>
                {unreadCount} new
              </span>
            )}
          </div>

          {/* Body */}
          <div style={{ maxHeight: "380px", overflowY: "auto" }}>
            {allNotifs.length === 0 ? (
              <div style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
                <p style={{ fontSize: "2.5rem", lineHeight: 1 }}>✅</p>
                <p style={{ color: textPrimary, fontWeight: 700, marginTop: "0.75rem", fontSize: "0.9rem" }}>
                  All caught up!
                </p>
                <p style={{ color: textMuted, fontSize: "0.78rem", marginTop: "0.25rem" }}>
                  No new notifications.
                </p>
              </div>
            ) : (
              allNotifs.map((n, i) => (
                <div
                  key={n.id}
                  onClick={n.type === "unread_message" ? () => markMessageRead(n.partnerAddr) : undefined}
                  style={{
                    padding: "0.9rem 1.25rem",
                    borderBottom: i < allNotifs.length - 1 ? `1px solid ${border}` : "none",
                    background: "transparent", transition: "background 0.15s",
                    cursor: n.type === "unread_message" ? "pointer" : "default",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = rowHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                    {/* Icon bubble */}
                    <div style={{
                      width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0,
                      background: TYPE_COLORS[n.type]?.bg || "#e2e8f0",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "1.05rem",
                    }}>
                      {n.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.83rem", color: textPrimary, fontWeight: 700, marginBottom: "0.15rem" }}>
                        {n.title}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: textMuted, lineHeight: 1.4 }}>
                        {n.body}
                      </p>
                      {n.type === "access_request" && (
                        <p style={{ fontSize: "0.67rem", color: dm ? "#475569" : "#94a3b8", marginTop: "0.3rem" }}>
                          Go to Patient Dashboard → Access Requests to approve
                        </p>
                      )}
                      {n.type === "unread_message" && (
                        <p style={{ fontSize: "0.67rem", color: dm ? "#475569" : "#94a3b8", marginTop: "0.3rem" }}>
                          Click to mark as read · Go to Messages to reply
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {allNotifs.length > 0 && (
            <div style={{
              padding: "0.7rem 1.25rem",
              borderTop: `1px solid ${border}`, textAlign: "center",
              background: dm ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)",
            }}>
              <p style={{ fontSize: "0.72rem", color: textMuted }}>
                Manage in your Dashboard
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

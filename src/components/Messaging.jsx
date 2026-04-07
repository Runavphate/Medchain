import React, { useState, useEffect, useRef } from "react";
import { ref, push, onValue, off } from "firebase/database";
import { db } from "../utils/firebase";

function Messaging({ currentUserAddress, otherUserAddress, otherUserName, role, darkMode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState("");
  const [connected, setConnected] = useState(true);
  const endRef = useRef(null);

  // Deterministic chat ID — same for both parties regardless of who opens first
  const chatId = `chat_${[currentUserAddress, otherUserAddress].sort().join("_")}`;

  // ── Real-time Firebase listener ─────────────────────────────────────────
  useEffect(() => {
    if (!currentUserAddress || !otherUserAddress) return;

    const messagesRef = ref(db, `chats/${chatId}/messages`);

    onValue(
      messagesRef,
      (snapshot) => {
        setConnected(true);
        const data = snapshot.val();
        if (data) {
          const msgs = Object.entries(data)
            .map(([key, val]) => ({ id: key, ...val }))
            .sort((a, b) => (a.clientTs || 0) - (b.clientTs || 0));
          setMessages(msgs);
        } else {
          setMessages([]);
        }
      },
      (error) => {
        console.error("Firebase read error:", error);
        setConnected(false);
      }
    );

    // Cleanup listener on unmount / chat partner change
    return () => off(messagesRef);
  }, [chatId, currentUserAddress, otherUserAddress]);

  // Auto-scroll to latest message
  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send message ────────────────────────────────────────────────────────
  const handleSend = (textMsg) => {
    const text = typeof textMsg === "string" ? textMsg : input;
    if (!text.trim() || !connected) return;

    const messagesRef = ref(db, `chats/${chatId}/messages`);
    push(messagesRef, {
      sender:   currentUserAddress,
      text:     text.trim(),
      role:     role,
      // clientTs for ordering (serverTimestamp is async and only for display)
      clientTs: Date.now(),
    });

    setInput("");
  };

  // ── Theme ───────────────────────────────────────────────────────────────
  const dm          = darkMode;
  const bg          = dm ? "#0f172a" : "#f8fafc";
  const border      = dm ? "#334155" : "#e2e8f0";
  const textPrimary = dm ? "#f1f5f9" : "#0f172a";
  const textMuted   = dm ? "#94a3b8" : "#64748b";

  if (!otherUserAddress) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: textMuted }}>
        Select someone to chat with.
      </div>
    );
  }

  const formatTime = (ts) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return isToday ? time : `${d.toLocaleDateString([], { month: "short", day: "numeric" })} · ${time}`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "500px", border: `1px solid ${border}`, borderRadius: "16px", background: dm ? "#1e293b" : "#fff", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${border}`, background: dm ? "#0f172a" : "#f1f5f9", display: "flex", alignItems: "center", gap: "0.75rem", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: role === "patient" ? "linear-gradient(135deg, #fce7f3, #f472b6)" : "linear-gradient(135deg, #e0e7ff, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
            {role === "patient" ? "👨‍⚕️" : "🧑"}
          </div>
          <div>
            <h4 style={{ margin: 0, color: textPrimary, fontSize: "0.95rem", fontWeight: 700 }}>
              {otherUserName
                ? (role === "patient" ? `Dr. ${otherUserName}` : otherUserName)
                : `${otherUserAddress.slice(0, 8)}…`}
            </h4>
            <p style={{ margin: 0, fontSize: "0.7rem", color: textMuted }}>{otherUserAddress}</p>
          </div>
        </div>
        {/* Connection Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.7rem", color: connected ? "#10b981" : "#ef4444", fontWeight: 700 }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: connected ? "#10b981" : "#ef4444", display: "inline-block" }} />
          {connected ? "Live" : "Offline"}
        </div>
      </div>

      {/* ── Messages ── */}
      <div style={{ flex: 1, padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: textMuted, marginTop: "auto", marginBottom: "auto" }}>
            <p style={{ fontSize: "2.5rem", margin: 0, marginBottom: "0.5rem" }}>💬</p>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender.toLowerCase() === currentUserAddress.toLowerCase();
            return (
              <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  {!isMe && (
                    <span style={{ fontSize: "0.7rem", color: textMuted, marginBottom: "0.2rem", marginLeft: "0.3rem", fontWeight: 700 }}>
                      {role === "patient"
                        ? (otherUserName ? `Dr. ${otherUserName}` : "Doctor")
                        : (otherUserName || "Patient")}
                    </span>
                  )}
                  <div style={{
                    padding: "0.7rem 1rem",
                    borderRadius: "16px",
                    borderBottomRightRadius: isMe ? "4px" : "16px",
                    borderBottomLeftRadius:  !isMe ? "4px" : "16px",
                    background: isMe ? "linear-gradient(135deg, #6366f1, #4f46e5)" : (dm ? "#334155" : "#e2e8f0"),
                    color:      isMe ? "#fff" : textPrimary,
                    fontSize: "0.9rem",
                    lineHeight: 1.4,
                    wordBreak: "break-word",
                  }}>
                    {m.text}
                  </div>
                  <span style={{ fontSize: "0.65rem", color: textMuted, marginTop: "0.35rem" }}>
                    {formatTime(m.clientTs)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* ── Input ── */}
      <div style={{ padding: "1rem", borderTop: `1px solid ${border}`, background: bg }}>
        {/* Quick Replies (doctor only) */}
        {role === "doctor" && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
            {[
              { label: "🚨 Requires immediate hospital visit", text: "Patient needs to visit hospital now", bg: dm ? "rgba(76,29,149,0.4)" : "#ede9fe", color: dm ? "#ddd6fe" : "#5b21b6", border: dm ? "#6d28d9" : "#c4b5fd" },
              { label: "📝 Test results ready",                text: "Your test results are ready for review.", bg: dm ? "rgba(30,58,138,0.4)" : "#dbeafe", color: dm ? "#bfdbfe" : "#1e40af", border: dm ? "#1d4ed8" : "#93c5fd" },
              { label: "🙋 Update symptoms",                   text: "Please update me on your symptoms.", bg: dm ? "rgba(15,118,110,0.4)" : "#ccfbf1", color: dm ? "#99f6e4" : "#0f766e", border: dm ? "#0f766e" : "#5eead4" },
            ].map(({ label, text, bg: rbg, color: rc, border: rb }) => (
              <button
                key={label}
                onClick={() => handleSend(text)}
                style={{ whiteSpace: "nowrap", padding: "0.4rem 0.85rem", fontSize: "0.75rem", borderRadius: "999px", background: rbg, color: rc, border: `1px solid ${rb}`, cursor: "pointer", fontWeight: 600 }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={connected ? "Type a message…" : "Reconnecting…"}
            disabled={!connected}
            style={{ flex: 1, padding: "0.75rem 1.25rem", borderRadius: "999px", border: `1px solid ${border}`, background: dm ? "#1e293b" : "#fff", color: textPrimary, outline: "none", fontSize: "0.95rem", opacity: connected ? 1 : 0.6 }}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || !connected}
            style={{ padding: "0 1.5rem", borderRadius: "999px", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", fontWeight: 700, cursor: input.trim() && connected ? "pointer" : "not-allowed", opacity: input.trim() && connected ? 1 : 0.5, transition: "opacity 0.2s" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Messaging;

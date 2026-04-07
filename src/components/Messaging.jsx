import React, { useState, useEffect, useRef } from "react";

function Messaging({ currentUserAddress, otherUserAddress, otherUserName, role, darkMode }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  // Storage key sorted to be identical for both parties
  // Normalize to lowercase so checksum-cased addresses always map to the same key
  const storageKey = `chat_${[currentUserAddress.toLowerCase(), otherUserAddress.toLowerCase()].sort().join("_")}`;

  useEffect(() => {
    if (!currentUserAddress || !otherUserAddress) return;
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try { setMessages(JSON.parse(raw)); } catch {}
    }
    // Set up polling so both get instant updates if running in two split windows locally
    const interval = setInterval(() => {
      const msgs = localStorage.getItem(storageKey);
      if (msgs) {
        try { setMessages(JSON.parse(msgs)); } catch {}
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [storageKey, currentUserAddress, otherUserAddress]);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (textMsg) => {
    const text = typeof textMsg === "string" ? textMsg : input;
    if (!text.trim()) return;
    
    const newMsg = {
      id: Date.now(),
      sender: currentUserAddress,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      role: role
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    setInput("");
  };

  const dm = darkMode;
  const bg = dm ? "#0f172a" : "#f8fafc";
  const border = dm ? "#334155" : "#e2e8f0";
  const textPrimary = dm ? "#f1f5f9" : "#0f172a";
  const textMuted = dm ? "#94a3b8" : "#64748b";

  if (!otherUserAddress) {
    return <div style={{ padding: "2rem", textAlign: "center", color: textMuted }}>Select someone to chat with.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "500px", border: `1px solid ${border}`, borderRadius: "16px", background: dm ? "#1e293b" : "#fff", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${border}`, background: dm ? "#0f172a" : "#f1f5f9", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: role === "patient" ? "linear-gradient(135deg, #fce7f3, #f472b6)" : "linear-gradient(135deg, #e0e7ff, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
          {role === "patient" ? "👨‍⚕️" : "🧑"}
        </div>
        <div>
          <h4 style={{ margin: 0, color: textPrimary, fontSize: "0.95rem", fontWeight: 700 }}>
            {otherUserName || `${otherUserAddress.slice(0,8)}…`}
          </h4>
          <p style={{ margin: 0, fontSize: "0.7rem", color: textMuted }}>{otherUserAddress}</p>
        </div>
      </div>

      {/* Messages Array */}
      <div style={{ flex: 1, padding: "1rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: textMuted, marginTop: "auto", marginBottom: "auto" }}>
            <p style={{ fontSize: "2.5rem", margin: 0, marginBottom: "0.5rem" }}>💬</p>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender === currentUserAddress;
            return (
              <div key={m.id} style={{ alignSelf: isMe ? "flex-end" : "flex-start", maxWidth: "75%" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  {!isMe && (
                    <span style={{ fontSize: "0.7rem", color: textMuted, marginBottom: "0.2rem", marginLeft: "0.3rem", fontWeight: 700 }}>
                      {role === "patient" ? (otherUserName ? `Dr. ${otherUserName}` : "Doctor") : (otherUserName || "Patient")}
                    </span>
                  )}
                  <div style={{
                    padding: "0.7rem 1rem",
                    borderRadius: "16px",
                    borderBottomRightRadius: isMe ? "4px" : "16px",
                    borderBottomLeftRadius: !isMe ? "4px" : "16px",
                    background: isMe ? "linear-gradient(135deg, #6366f1, #4f46e5)" : (dm ? "#334155" : "#e2e8f0"),
                    color: isMe ? "#fff" : textPrimary,
                    fontSize: "0.9rem",
                    lineHeight: 1.4,
                    wordBreak: "break-word"
                  }}>
                    {m.text}
                  </div>
                  <span style={{ fontSize: "0.65rem", color: textMuted, marginTop: "0.35rem" }}>
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {/* Input Box */}
      <div style={{ padding: "1rem", borderTop: `1px solid ${border}`, background: bg }}>
        {/* Quick Replies */}
        {role === "doctor" && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", overflowX: "auto", paddingBottom: "0.25rem" }}>
            <button onClick={() => handleSend("Patient needs to visit hospital now")} style={{ whiteSpace: "nowrap", padding: "0.4rem 0.85rem", fontSize: "0.75rem", borderRadius: "999px", background: dm ? "rgba(76, 29, 149, 0.4)" : "#ede9fe", color: dm ? "#ddd6fe" : "#5b21b6", border: `1px solid ${dm ? "#6d28d9" : "#c4b5fd"}`, cursor: "pointer", fontWeight: 600 }}>🚨 Requires immediate hospital visit</button>
            <button onClick={() => handleSend("Your test results are ready for review.")} style={{ whiteSpace: "nowrap", padding: "0.4rem 0.85rem", fontSize: "0.75rem", borderRadius: "999px", background: dm ? "rgba(30, 58, 138, 0.4)" : "#dbeafe", color: dm ? "#bfdbfe" : "#1e40af", border: `1px solid ${dm ? "#1d4ed8" : "#93c5fd"}`, cursor: "pointer", fontWeight: 600 }}>📝 Test results ready</button>
            <button onClick={() => handleSend("Please update me on your symptoms.")} style={{ whiteSpace: "nowrap", padding: "0.4rem 0.85rem", fontSize: "0.75rem", borderRadius: "999px", background: dm ? "rgba(15, 118, 110, 0.4)" : "#ccfbf1", color: dm ? "#99f6e4" : "#0f766e", border: `1px solid ${dm ? "#0f766e" : "#5eead4"}`, cursor: "pointer", fontWeight: 600 }}>🙋 Update symptoms</button>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            style={{ flex: 1, padding: "0.75rem 1.25rem", borderRadius: "999px", border: `1px solid ${border}`, background: dm ? "#1e293b" : "#fff", color: textPrimary, outline: "none", fontSize: "0.95rem" }}
          />
          <button onClick={() => handleSend()} disabled={!input.trim()} style={{ padding: "0 1.5rem", borderRadius: "999px", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", fontWeight: 700, cursor: input.trim() ? "pointer" : "not-allowed", opacity: input.trim() ? 1 : 0.5, transition: "opacity 0.2s" }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default Messaging;

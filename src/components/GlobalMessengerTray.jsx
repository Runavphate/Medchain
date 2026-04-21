import React, { useState, useEffect } from "react";
import Messaging from "./Messaging";
import { getUserProfile } from "../utils/db";

function GlobalMessengerTray({ account, role, darkMode, contactAddresses }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChatAddress, setActiveChatAddress] = useState(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [contactDetails, setContactDetails] = useState([]);

  const dm = darkMode;

  // Resolve details for contacts
  useEffect(() => {
    async function loadDetails() {
      if (!contactAddresses || contactAddresses.length === 0) {
        setContactDetails([]);
        return;
      }
      const details = await Promise.all(
        contactAddresses.map(async (addr) => {
          const profile = await getUserProfile(addr);
          return { addr, name: profile?.name || "", profile };
        })
      );
      setContactDetails(details);
    }
    loadDetails();
  }, [contactAddresses]);

  const handleOpenChat = (addr, name) => {
    setActiveChatAddress(addr);
    setActiveChatName(name);
  };

  if (!account || !role) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "2rem",
      right: "2rem",
      zIndex: 50,
      display: "flex",
      flexDirection: "column",
      alignItems: "flex-end",
    }}>
      {/* ── Chat Window ── */}
      {isOpen && (
        <div 
          className="animate-fade-in-up"
          style={{
          width: "350px",
          height: "500px",
          background: dm ? "#0f172a" : "#ffffff",
          borderRadius: "20px",
          boxShadow: dm ? "0 20px 40px rgba(0,0,0,0.6)" : "0 20px 40px rgba(5,10,31,0.1)",
          border: `1px solid ${dm ? "#1e293b" : "rgba(216, 218, 255, 0.5)"}`,
          marginBottom: "1rem",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}>
          {activeChatAddress ? (
            /* ── Active Chat View ── */
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ 
                padding: "1rem", 
                background: dm ? "#050a1f" : "#f1f5f9", 
                borderBottom: `1px solid ${dm ? "#1e293b" : "rgba(216, 218, 255, 0.5)"}`,
                display: "flex", alignItems: "center", gap: "0.5rem"
              }}>
                <button 
                  onClick={() => setActiveChatAddress(null)}
                  style={{ background: "none", border: "none", color: dm ? "#d8daff" : "#050a1f", fontSize: "1.2rem", cursor: "pointer", padding: "0 0.5rem" }}
                >
                  ←
                </button>
                <div>
                  <h4 style={{ margin: 0, fontFamily: "Playfair Display, serif", color: dm ? "#fdfbf7" : "#050a1f" }}>
                    {activeChatName ? (role === "patient" ? `Dr. ${activeChatName}` : activeChatName) : `${activeChatAddress.slice(0, 6)}…`}
                  </h4>
                </div>
              </div>
              <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
                 <Messaging 
                    currentUserAddress={account} 
                    otherUserAddress={activeChatAddress}
                    otherUserName={activeChatName}
                    role={role}
                    darkMode={darkMode}
                 />
              </div>
            </div>
          ) : (
            /* ── Contact List View ── */
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ padding: "1.2rem 1rem", background: dm ? "#050a1f" : "#fdfbf7", borderBottom: `1px solid ${dm ? "#1e293b" : "rgba(216, 218, 255, 0.5)"}` }}>
                <h3 style={{ margin: 0, fontFamily: "Playfair Display, serif", color: dm ? "#fdfbf7" : "#050a1f", fontSize: "1.4rem" }}>Messages</h3>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "0.5rem" }}>
                {contactDetails.length === 0 ? (
                  <p style={{ textAlign: "center", padding: "2rem", color: dm ? "rgba(216,218,255,0.5)" : "rgba(5,10,31,0.5)" }}>
                    No contacts available yet.
                  </p>
                ) : (
                  contactDetails.map(c => (
                    <div 
                      key={c.addr}
                      onClick={() => handleOpenChat(c.addr, c.name)}
                      style={{
                        padding: "1rem",
                        borderRadius: "12px",
                        cursor: "pointer",
                        transition: "background 0.2s",
                        display: "flex", alignItems: "center", gap: "1rem",
                        background: dm ? "transparent" : "transparent",
                        borderBottom: `1px solid ${dm ? "#1e293b" : "rgba(216,218,255,0.2)"}`
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = dm ? "rgba(216,218,255,0.05)" : "rgba(5,10,31,0.02)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: dm ? "linear-gradient(135deg, #050a1f, #1e293b)" : "linear-gradient(135deg, #fdfbf7, #d8daff)", border: `1px solid ${dm ? "#334155" : "#c6f5f0"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", fontWeight: 700, fontFamily: "Playfair Display, serif", color: dm ? "#c6f5f0" : "#050a1f" }}>
                        {role === "patient" ? "D" : "P"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 600, color: dm ? "#fdfbf7" : "#050a1f", fontSize: "0.95rem" }}>
                          {c.name ? (role === "patient" ? `Dr. ${c.name}` : c.name) : `${c.addr.slice(0, 6)}…`}
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: dm ? "rgba(216,218,255,0.5)" : "rgba(5,10,31,0.5)" }}>
                          Click to message
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Floating Action Button ── */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: dm ? "linear-gradient(135deg, #d8daff, #c6f5f0)" : "linear-gradient(135deg, #050a1f, #1e293b)",
          color: dm ? "#050a1f" : "#fdfbf7",
          border: "none",
          boxShadow: dm ? "0 8px 24px rgba(216, 218, 255, 0.2)" : "0 8px 24px rgba(5, 10, 31, 0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
        onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </div>
  );
}

export default GlobalMessengerTray;

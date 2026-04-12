import React, { useState, useEffect } from "react";
import { getDoctorNotes, setDoctorNotes as saveNotesToDb, getUserProfile } from "../utils/db";

const NOTE_TYPES = [
  "General Consultation",
  "Prescription",
  "Follow-up",
  "Lab Results Review",
  "Diagnosis",
  "Surgery Notes",
];

const TYPE_COLORS = {
  "General Consultation": { bg: "#dbeafe", color: "#1d4ed8" },
  "Prescription":         { bg: "#d1fae5", color: "#065f46" },
  "Follow-up":            { bg: "#fce7f3", color: "#9d174d" },
  "Lab Results Review":   { bg: "#fef3c7", color: "#92400e" },
  "Diagnosis":            { bg: "#fee2e2", color: "#991b1b" },
  "Surgery Notes":        { bg: "#ede9fe", color: "#5b21b6" },
};

const EMPTY_FORM = {
  type: NOTE_TYPES[0],
  date: new Date().toISOString().split("T")[0],
  message: "",
  prescription: "",
  nextAppointment: "",
};

function DoctorNotes({ account, patientAddress, patientName, darkMode }) {
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!patientAddress) return;
    getDoctorNotes(account, patientAddress).then((saved) => setNotes(saved));
  }, [account, patientAddress]);

  const persist = (list) => {
    saveNotesToDb(account, patientAddress, list);
    setNotes(list);
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().split("T")[0] });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.message.trim() && !form.prescription.trim()) return;
    const updated =
      editingId !== null
        ? notes.map((n) => (n.id === editingId ? { ...form, id: editingId } : n))
        : [{ ...form, id: Date.now() }, ...notes];
    persist(updated);
    setShowForm(false);
    resetForm();
  };

  const handleEdit = (note) => {
    setForm({ ...note });
    setEditingId(note.id);
    setShowForm(true);
  };

  const handleDelete = (id) => persist(notes.filter((n) => n.id !== id));

  const handlePrint = async (note) => {
    const profile = await getUserProfile(account);
    const doctorName = profile.name || account.slice(0, 8) + "\u2026";
    const hospitalName = profile.hospital || "Medical Center";
    const tc = TYPE_COLORS[note.type] || TYPE_COLORS["General Consultation"];
    // Escape user content to prevent broken HTML or XSS in the print window
    const esc = (s = "") => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
<!DOCTYPE html>
<html>
<head>
  <title>Clinical Note — Dr. ${doctorName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 2.5rem; max-width: 720px; margin: auto; color: #1e293b; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #6366f1; padding-bottom: 1.25rem; margin-bottom: 1.75rem; }
    .header-left h1 { font-size: 1.6rem; font-weight: 800; color: #4f46e5; }
    .header-left p { color: #64748b; margin-top: 0.25rem; font-size: 0.9rem; }
    .header-right { text-align: right; font-size: 0.82rem; color: #64748b; }
    .badge { display: inline-block; background: ${tc.bg}; color: ${tc.color}; border-radius: 999px; padding: 3px 12px; font-size: 0.78rem; font-weight: 700; }
    .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem 1.25rem; margin-bottom: 1.5rem; display: flex; gap: 2rem; }
    .patient-box div { font-size: 0.85rem; }
    .patient-box label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.05em; }
    .patient-box p { color: #1e293b; margin-top: 0.2rem; }
    .section { margin-bottom: 1.25rem; }
    .section label { font-weight: 700; color: #64748b; text-transform: uppercase; font-size: 0.72rem; letter-spacing: 0.05em; display: block; margin-bottom: 0.35rem; }
    .section p { font-size: 0.92rem; color: #1e293b; line-height: 1.6; white-space: pre-wrap; }
    .rx-box { background: #f0f4ff; border: 1.5px solid #a5b4fc; border-radius: 10px; padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
    .rx-box label { color: #4f46e5; }
    .footer { margin-top: 3rem; border-top: 1.5px solid #e2e8f0; padding-top: 1.25rem; display: flex; justify-content: space-between; align-items: flex-end; }
    .footer .disclaimer { font-size: 0.7rem; color: #94a3b8; max-width: 300px; }
    .footer .sig { text-align: right; }
    .footer .sig .line { border-top: 1.5px solid #334155; width: 180px; margin-left: auto; margin-bottom: 0.35rem; }
    .footer .sig p { font-size: 0.82rem; color: #475569; }
    @media print { body { padding: 1rem; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <h1>Dr. ${doctorName}</h1>
      <p>🏥 ${hospitalName}</p>
    </div>
    <div class="header-right">
      <p>Date: <strong>${note.date}</strong></p>
      <p style="margin-top:0.4rem"><span class="badge">${note.type}</span></p>
      <p style="margin-top:0.5rem;font-size:0.72rem;color:#94a3b8">Generated via MedChain</p>
    </div>
  </div>

  <div class="patient-box">
    <div><label>Patient</label><p>${patientName || "—"}</p></div>
    <div><label>Wallet</label><p style="font-family:monospace;font-size:0.78rem">${patientAddress ? patientAddress.slice(0, 12) + "…" + patientAddress.slice(-6) : "—"}</p></div>
  </div>

  ${note.message ? `<div class="section"><label>Note Message</label><p>${esc(note.message)}</p></div>` : ""}
  ${note.prescription ? `<div class="rx-box"><label>\ud83d\udc8a Rx \u2014 Prescription / Treatment</label><p style="margin-top:0.5rem">${esc(note.prescription)}</p></div>` : ""}
  ${note.nextAppointment ? `<div class="section"><label>Next Appointment</label><p>${esc(note.nextAppointment)}</p></div>` : ""}

  <div class="footer">
    <div class="disclaimer">
      <p>This document was generated digitally via MedChain, a blockchain-secured medical record system. Verify with the issuing doctor before dispensing.</p>
    </div>
    <div class="sig">
      <div class="line"></div>
      <p><strong>Dr. ${doctorName}</strong></p>
      <p>${hospitalName}</p>
    </div>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`);
    win.document.close();
  };

  const dm = darkMode;
  const cardBg = dm ? "#1e293b" : "#fff";
  const cardBorder = dm ? "#334155" : "#e2e8f0";
  const textPrimary = dm ? "#f1f5f9" : "#0f172a";
  const textMuted = dm ? "#94a3b8" : "#64748b";
  const inputBg = dm ? "#0f172a" : "#fff";
  const inputBorder = dm ? "#475569" : "#d1d5db";
  const formBg = dm ? "#0f172a" : "#f0f4ff";
  const formBorder = dm ? "#3730a3" : "#a5b4fc";

  const inputStyle = {
    width: "100%",
    marginTop: "0.3rem",
    border: `1px solid ${inputBorder}`,
    background: inputBg,
    color: textPrimary,
    borderRadius: "8px",
    padding: "0.5rem 0.75rem",
    boxSizing: "border-box",
    fontSize: "0.875rem",
  };

  // No patient selected
  if (!patientAddress) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "3.5rem 2rem",
          background: cardBg,
          borderRadius: "18px",
          border: `2px dashed ${cardBorder}`,
        }}
      >
        <p style={{ fontSize: "3.5rem" }}>📝</p>
        <p style={{ color: textPrimary, fontWeight: 700, marginTop: "0.75rem", fontSize: "1rem" }}>
          No patient selected
        </p>
        <p style={{ color: textMuted, fontSize: "0.85rem", marginTop: "0.3rem" }}>
          Enter a patient address above and fetch their records first.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Top bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.25rem",
          flexWrap: "wrap",
          gap: "0.75rem",
        }}
      >
        <div>
          <p style={{ fontSize: "0.85rem", color: textMuted }}>
            Clinical notes for:{" "}
            <strong style={{ color: textPrimary }}>
              {patientName || `${patientAddress.slice(0, 10)}…`}
            </strong>
          </p>
          <p style={{ fontSize: "0.72rem", color: dm ? "#475569" : "#94a3b8" }}>
            {notes.length} note{notes.length !== 1 ? "s" : ""} saved on this device
          </p>
        </div>
        <button
          id="new-doctor-note-btn"
          onClick={() => { setShowForm(true); resetForm(); }}
          style={{
            padding: "0.6rem 1.25rem",
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "0.875rem",
          }}
        >
          + New Note
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div
          style={{
            background: formBg,
            border: `1.5px solid ${formBorder}`,
            borderRadius: "18px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h4 style={{ color: textPrimary, fontWeight: 800, marginBottom: "1.25rem", fontSize: "1rem" }}>
            {editingId !== null ? "✏️ Edit Note" : "📝 New Clinical Note"}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {/* Type */}
            <div>
              <label style={{ fontSize: "0.75rem", color: textMuted, fontWeight: 700 }}>
                Note Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                style={inputStyle}
              >
                {NOTE_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            {/* Date */}
            <div>
              <label style={{ fontSize: "0.75rem", color: textMuted, fontWeight: 700 }}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                style={inputStyle}
              />
            </div>
            
            {/* Note Message */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.75rem", color: textMuted, fontWeight: 700 }}>
                Note Message
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                placeholder="Findings, instructions, or general notes..."
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
            {/* Prescription */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.75rem", color: "#6366f1", fontWeight: 700 }}>
                💊 Rx — Prescription / Treatment Plan
              </label>
              <textarea
                value={form.prescription}
                onChange={(e) => setForm((f) => ({ ...f, prescription: e.target.value }))}
                placeholder="Medicines, dosage, frequency, duration…"
                rows={4}
                style={{ ...inputStyle, resize: "vertical", borderColor: dm ? "#3730a3" : "#a5b4fc" }}
              />
            </div>
            
            {/* Next Appointment */}
            <div>
              <label style={{ fontSize: "0.75rem", color: textMuted, fontWeight: 700 }}>
                Next Appointment
              </label>
              <input
                type="date"
                value={form.nextAppointment}
                onChange={(e) => setForm((f) => ({ ...f, nextAppointment: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button
              onClick={handleSubmit}
              style={{
                padding: "0.6rem 1.5rem",
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {editingId !== null ? "Update Note" : "Save Note"}
            </button>
            <button
              onClick={() => { setShowForm(false); resetForm(); }}
              style={{
                padding: "0.6rem 1.25rem",
                background: dm ? "#1e293b" : "#f1f5f9",
                color: textMuted,
                border: `1px solid ${inputBorder}`,
                borderRadius: "10px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {notes.length === 0 && !showForm && (
        <div
          style={{
            textAlign: "center",
            padding: "3.5rem 2rem",
            background: cardBg,
            borderRadius: "18px",
            border: `2px dashed ${cardBorder}`,
          }}
        >
          <p style={{ fontSize: "3.5rem" }}>📋</p>
          <p style={{ color: textPrimary, fontWeight: 700, marginTop: "0.75rem", fontSize: "1rem" }}>
            No notes yet
          </p>
          <p style={{ color: textMuted, fontSize: "0.85rem", marginTop: "0.3rem" }}>
            Create a clinical note or prescription for this patient.
          </p>
        </div>
      )}

      {/* Notes list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {notes.map((note) => {
          const tc = TYPE_COLORS[note.type] || TYPE_COLORS["General Consultation"];
          return (
            <div
              key={note.id}
              style={{
                background: cardBg,
                border: `1px solid ${cardBorder}`,
                borderRadius: "16px",
                padding: "1.25rem",
                transition: "box-shadow 0.18s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.10)")
              }
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {/* Note header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "0.9rem",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <span
                    style={{
                      background: tc.bg,
                      color: tc.color,
                      borderRadius: "999px",
                      padding: "3px 12px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                    }}
                  >
                    {note.type}
                  </span>
                  <p style={{ fontSize: "0.75rem", color: textMuted, marginTop: "0.4rem" }}>
                    📅 {note.date}
                    {note.nextAppointment && (
                      <> &nbsp;·&nbsp; <span style={{ color: "#10b981", fontWeight: 700 }}>Next: {note.nextAppointment}</span></>
                    )}
                  </p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handlePrint(note)}
                    style={{
                      padding: "0.35rem 0.85rem",
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={() => handleEdit(note)}
                    style={{
                      padding: "0.35rem 0.75rem",
                      background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    style={{
                      padding: "0.35rem 0.6rem",
                      background: "linear-gradient(135deg, #ef4444, #dc2626)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Note body */}
              {note.message && (
                <div style={{ marginBottom: "0.65rem" }}>
                  <p style={{ fontSize: "0.68rem", color: textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    Note Message
                  </p>
                  <p style={{ fontSize: "0.875rem", color: textPrimary, marginTop: "0.2rem", whiteSpace: "pre-wrap" }}>
                    {note.message}
                  </p>
                </div>
              )}
              {note.prescription && (
                <div
                  style={{
                    background: dm ? "#0f172a" : "#f0f4ff",
                    border: `1px solid ${dm ? "#3730a3" : "#c7d2fe"}`,
                    borderRadius: "10px",
                    padding: "0.85rem 1rem",
                    marginBottom: "0.65rem",
                  }}
                >
                  <p style={{ fontSize: "0.68rem", color: "#6366f1", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    💊 Prescription
                  </p>
                  <p style={{ fontSize: "0.875rem", color: textPrimary, marginTop: "0.35rem", whiteSpace: "pre-wrap" }}>
                    {note.prescription}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default DoctorNotes;

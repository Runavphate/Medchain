import React, { useState, useEffect } from "react";

const FREQUENCIES = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Every 8 hours",
  "Every 12 hours",
  "As needed (PRN)",
  "Weekly",
  "Monthly",
];

const STATUS_META = {
  active:    { label: "Active",    bg: "#d1fae5", color: "#065f46", dot: "#10b981" },
  inactive:  { label: "Paused",    bg: "#fef9c3", color: "#713f12", dot: "#eab308" },
  completed: { label: "Completed", bg: "#e0e7ff", color: "#3730a3", dot: "#6366f1" },
};

const EMPTY_FORM = {
  name: "",
  dosage: "",
  frequency: FREQUENCIES[0],
  startDate: new Date().toISOString().split("T")[0],
  endDate: "",
  notes: "",
  status: "active",
};

// ── Sub-component: single medication card ───────────────────────────────────
function MedCard({ med, onEdit, onDelete, onStatusToggle, dm, cardBg, cardBorder, textPrimary, textMuted }) {
  const sm = STATUS_META[med.status] || STATUS_META.inactive;
  const nextLabel =
    med.status === "active" ? "⏸ Pause" : med.status === "inactive" ? "✓ Complete" : "↺ Restart";

  return (
    <div
      style={{
        background: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: "16px",
        padding: "1rem 1.25rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "1rem",
        justifyContent: "space-between",
        flexWrap: "wrap",
        transition: "box-shadow 0.18s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(16,185,129,0.12)")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      {/* Left: icon + info */}
      <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", flex: 1, minWidth: 0 }}>
        <div
          style={{
            width: "48px",
            height: "48px",
            borderRadius: "14px",
            background: "linear-gradient(135deg, #d1fae5, #6ee7b7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "1.5rem",
            flexShrink: 0,
          }}
        >
          💊
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <p style={{ fontWeight: 800, fontSize: "0.95rem", color: textPrimary }}>{med.name}</p>
            <span
              style={{
                background: sm.bg,
                color: sm.color,
                borderRadius: "999px",
                padding: "1px 8px",
                fontSize: "0.68rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: sm.dot,
                  display: "inline-block",
                }}
              />
              {sm.label}
            </span>
          </div>
          <p style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600, marginTop: "0.15rem" }}>
            {med.dosage ? `${med.dosage}  •  ` : ""}
            {med.frequency}
          </p>
          <p style={{ fontSize: "0.73rem", color: textMuted, marginTop: "0.2rem" }}>
            📅 {med.startDate}
            {med.endDate ? ` → ${med.endDate}` : ""}
          </p>
          {med.notes && (
            <p style={{ fontSize: "0.73rem", color: textMuted, marginTop: "0.25rem", fontStyle: "italic" }}>
              📝 {med.notes}
            </p>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0, alignItems: "center" }}>
        <button
          onClick={() => onStatusToggle(med.id)}
          style={{
            padding: "0.35rem 0.75rem",
            background: dm ? "#1e293b" : "#f1f5f9",
            border: `1px solid ${cardBorder}`,
            borderRadius: "8px",
            fontSize: "0.72rem",
            fontWeight: 700,
            color: textMuted,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {nextLabel}
        </button>
        <button
          onClick={() => onEdit(med)}
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
          onClick={() => onDelete(med.id)}
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
  );
}

// ── Main component ──────────────────────────────────────────────────────────
function MedicationTracker({ account, darkMode }) {
  const storageKey = `medications_${account.toLowerCase()}`;
  const [medications, setMedications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      setMedications(saved);
    } catch {}
  }, [storageKey]);

  const persist = (list) => {
    localStorage.setItem(storageKey, JSON.stringify(list));
    setMedications(list);
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, startDate: new Date().toISOString().split("T")[0] });
    setEditingId(null);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) return;
    const updated =
      editingId !== null
        ? medications.map((m) => (m.id === editingId ? { ...form, id: editingId } : m))
        : [...medications, { ...form, id: Date.now() }];
    persist(updated);
    setShowForm(false);
    resetForm();
  };

  const handleEdit = (med) => {
    setForm({ ...med });
    setEditingId(med.id);
    setShowForm(true);
  };

  const handleDelete = (id) => persist(medications.filter((m) => m.id !== id));

  const handleStatusToggle = (id) => {
    persist(
      medications.map((m) => {
        if (m.id !== id) return m;
        const next =
          m.status === "active" ? "inactive" : m.status === "inactive" ? "completed" : "active";
        return { ...m, status: next };
      })
    );
  };

  const dm = darkMode;
  const cardBg = dm ? "#1e293b" : "#fff";
  const cardBorder = dm ? "#334155" : "#e2e8f0";
  const textPrimary = dm ? "#f1f5f9" : "#0f172a";
  const textMuted = dm ? "#94a3b8" : "#64748b";
  const inputBg = dm ? "#0f172a" : "#fff";
  const inputBorder = dm ? "#475569" : "#d1d5db";
  const formBg = dm ? "#0f172a" : "#f0fdf4";
  const formBorder = dm ? "#166534" : "#86efac";

  const activeMeds = medications.filter((m) => m.status === "active");
  const pausedMeds = medications.filter((m) => m.status === "inactive");
  const completedMeds = medications.filter((m) => m.status === "completed");

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

  return (
    <div>
      {/* Summary stats + Add button */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "Active",    count: activeMeds.length,    color: "#10b981", bg: "#d1fae5" },
          { label: "Paused",    count: pausedMeds.length,    color: "#d97706", bg: "#fef9c3" },
          { label: "Completed", count: completedMeds.length, color: "#6366f1", bg: "#e0e7ff" },
          { label: "Total",     count: medications.length,   color: "#64748b", bg: dm ? "#1e293b" : "#f1f5f9" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              flex: 1,
              minWidth: "70px",
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: "14px",
              padding: "0.75rem",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: "2rem", fontWeight: 800, color: s.color, lineHeight: 1 }}>
              {s.count}
            </p>
            <p style={{ fontSize: "0.72rem", color: textMuted, marginTop: "0.2rem" }}>{s.label}</p>
          </div>
        ))}
        <button
          id="add-medication-btn"
          onClick={() => { setShowForm(true); resetForm(); }}
          style={{
            flex: 2,
            minWidth: "130px",
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "#fff",
            border: "none",
            borderRadius: "14px",
            padding: "0.75rem 1rem",
            fontWeight: 700,
            fontSize: "0.9rem",
            cursor: "pointer",
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.9")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          + Add Medication
        </button>
      </div>

      {/* Add / Edit Form */}
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
            {editingId !== null ? "✏️ Edit Medication" : "💊 Add New Medication"}
          </h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {/* Name — full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.75rem", color: textMuted, fontWeight: 700 }}>
                Medication Name *
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Metformin, Aspirin, Atorvastatin…"
                style={inputStyle}
              />
            </div>
            {/* Dosage */}
            <div>
              <label style={{ fontSize: "0.75rem", color: textMuted, fontWeight: 700 }}>Dosage</label>
              <input
                value={form.dosage}
                onChange={(e) => setForm((f) => ({ ...f, dosage: e.target.value }))}
                placeholder="e.g. 500mg, 10ml…"
                style={inputStyle}
              />
            </div>
            {/* Frequency */}
            <div>
              <label style={{ fontSize: "0.75rem", color: textMuted, fontWeight: 700 }}>Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm((f) => ({ ...f, frequency: e.target.value }))}
                style={inputStyle}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            {/* Start Date */}
            <div>
              <label style={{ fontSize: "0.75rem", color: textMuted, fontWeight: 700 }}>Start Date</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                style={inputStyle}
              />
            </div>
            {/* End Date */}
            <div>
              <label style={{ fontSize: "0.75rem", color: textMuted, fontWeight: 700 }}>
                End Date{" "}
                <span style={{ fontWeight: 400, opacity: 0.7 }}>(optional)</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                style={inputStyle}
              />
            </div>
            {/* Notes — full width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.75rem", color: textMuted, fontWeight: 700 }}>Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Take with food, avoid alcohol, store in cool place…"
                rows={2}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1.25rem" }}>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim()}
              style={{
                padding: "0.6rem 1.5rem",
                background: "linear-gradient(135deg, #10b981, #059669)",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                fontWeight: 700,
                cursor: form.name.trim() ? "pointer" : "not-allowed",
                opacity: form.name.trim() ? 1 : 0.6,
              }}
            >
              {editingId !== null ? "Update Medication" : "Add Medication"}
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
      {medications.length === 0 && !showForm && (
        <div
          style={{
            textAlign: "center",
            padding: "3.5rem 2rem",
            background: cardBg,
            borderRadius: "18px",
            border: `2px dashed ${cardBorder}`,
          }}
        >
          <p style={{ fontSize: "3.5rem" }}>💊</p>
          <p style={{ color: textPrimary, fontWeight: 700, marginTop: "0.75rem", fontSize: "1rem" }}>
            No medications tracked yet
          </p>
          <p style={{ color: textMuted, fontSize: "0.85rem", marginTop: "0.3rem" }}>
            Add your first medication to start tracking your health regimen.
          </p>
        </div>
      )}

      {/* Active */}
      {activeMeds.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p
            style={{
              fontSize: "0.72rem",
              color: "#10b981",
              fontWeight: 800,
              marginBottom: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            🟢 Active ({activeMeds.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {activeMeds.map((m) => (
              <MedCard
                key={m.id}
                med={m}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusToggle={handleStatusToggle}
                dm={dm}
                cardBg={cardBg}
                cardBorder={cardBorder}
                textPrimary={textPrimary}
                textMuted={textMuted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Paused */}
      {pausedMeds.length > 0 && (
        <div style={{ marginBottom: "1.5rem" }}>
          <p
            style={{
              fontSize: "0.72rem",
              color: "#d97706",
              fontWeight: 800,
              marginBottom: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            ⏸ Paused ({pausedMeds.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {pausedMeds.map((m) => (
              <MedCard
                key={m.id}
                med={m}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusToggle={handleStatusToggle}
                dm={dm}
                cardBg={cardBg}
                cardBorder={cardBorder}
                textPrimary={textPrimary}
                textMuted={textMuted}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedMeds.length > 0 && (
        <div>
          <p
            style={{
              fontSize: "0.72rem",
              color: "#6366f1",
              fontWeight: 800,
              marginBottom: "0.6rem",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            ✅ Completed ({completedMeds.length})
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {completedMeds.map((m) => (
              <MedCard
                key={m.id}
                med={m}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusToggle={handleStatusToggle}
                dm={dm}
                cardBg={cardBg}
                cardBorder={cardBorder}
                textPrimary={textPrimary}
                textMuted={textMuted}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default MedicationTracker;

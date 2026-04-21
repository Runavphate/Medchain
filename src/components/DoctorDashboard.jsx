import React, { useState, useEffect, useCallback } from "react";
import { getRecords, requestAccessOnChain, getAuditLog } from "../utils/contract";
import { decryptAndViewFile } from "../utils/ipfs";
import LoadingOverlay from "./LoadingOverlay";
import { ToastContainer, useToast } from "./Toast";
import DoctorNotes from "./DoctorNotes";
import Messaging from "./Messaging";
import {
  getUserProfile, patchUserProfile,
  getActivityLog, addActivityLogEntry,
  listUsersByRole, getUserProfile as fetchProfile,
  getRecordMeta,
} from "../utils/db";

const CATEGORY_COLORS = {
  "Lab Report": { bg: "#dbeafe", color: "#1d4ed8" },
  "Prescription": { bg: "#d1fae5", color: "#065f46" },
  "X-Ray": { bg: "#fce7f3", color: "#9d174d" },
  "Discharge Summary": { bg: "#fef3c7", color: "#92400e" },
  "Other": { bg: "#f3f4f6", color: "#374151" },
};

const isValidAddress = (addr) => /^0x[0-9a-fA-F]{40}$/.test(addr.trim());

const guessMimeFromFileName = (fileName = "") => {
  const fn = fileName.toLowerCase();
  if (fn.endsWith(".jpg") || fn.endsWith(".jpeg")) return "image/jpeg";
  if (fn.endsWith(".png")) return "image/png";
  if (fn.endsWith(".gif")) return "image/gif";
  if (fn.endsWith(".webp")) return "image/webp";
  if (fn.endsWith(".bmp")) return "image/bmp";
  if (fn.endsWith(".svg")) return "image/svg+xml";
  if (fn.endsWith(".pdf")) return "application/pdf";
  if (fn.endsWith(".doc")) return "application/msword";
  if (fn.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (fn.endsWith(".xls")) return "application/vnd.ms-excel";
  if (fn.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (fn.endsWith(".csv")) return "text/csv";
  if (fn.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
};

const resolvedMime = (storedType, fileName) =>
  (!storedType || storedType === "unknown") ? guessMimeFromFileName(fileName) : storedType;

// Deep inspect first 4 bytes for cross-session preview reliability
const detectMimeFromBuffer = (buffer) => {
  if (!buffer || buffer.byteLength < 4) return null;
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return "application/pdf"; // %PDF
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif"; // GIF8
  return null;
};

const fileIcon = (mimeType = "", fileName = "") => {
  const mime = resolvedMime(mimeType, fileName);
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📄";
  if (mime.includes("word") || mime.includes("document")) return "📝";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv")) return "📊";
  return "📎";
};

const getViewerMode = (mimeType = "", fileName = "") => {
  const mime = resolvedMime(mimeType, fileName);
  if (mime.startsWith("image/")) return "image";
  if (mime === "application/pdf") return "pdf";
  return "download";
};



function DoctorDashboard({ account, darkMode }) {
  const [patient, setPatient] = useState("");
  const [patientError, setPatientError] = useState("");
  const [records, setRecords] = useState([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [viewingCid, setViewingCid] = useState(null);
  const [viewerMeta, setViewerMeta] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [doctorName, setDoctorName] = useState("");
  const [doctorNameInput, setDoctorNameInput] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [hospitalInput, setHospitalInput] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [verified, setVerified] = useState(false);
  const [activeTab, setActiveTab] = useState("records");
  const [activityLog, setActivityLog] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [registeredPatients, setRegisteredPatients] = useState([]);
  const [recordMetas, setRecordMetas] = useState({});

  const { toasts, removeToast, toast } = useToast();

  const flashSuccess = () => { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1500); };
  const flashFailure = () => { setShowFailure(true); setTimeout(() => setShowFailure(false), 1500); };

  const log = useCallback(async (icon, msg) => {
    const updated = await addActivityLogEntry(account, { icon, msg });
    setActivityLog(updated);
  }, [account]);

  useEffect(() => {
    // Load doctor profile from Firebase
    getUserProfile(account).then((profile) => {
      if (profile.name) setDoctorName(profile.name);
      if (profile.hospital) setHospitalName(profile.hospital);
      if (profile.verified === true) setVerified(true);
    });
    // Load activity log from Firebase
    getActivityLog(account).then(setActivityLog);
    // Load registered patients from Firebase
    listUsersByRole("patient").then(setRegisteredPatients);
  }, [account]);

  const handleSaveDoctorName = async () => {
    if (!doctorNameInput.trim()) return;
    const newName = doctorNameInput.trim();
    await patchUserProfile(account, "name", newName);
    await patchUserProfile(account, "role", "doctor");
    setDoctorName(newName);
    setDoctorNameInput("");
  };

  const handleSaveHospital = async () => {
    if (!hospitalInput.trim()) return;
    const newHospital = hospitalInput.trim();
    await patchUserProfile(account, "hospital", newHospital);
    setHospitalName(newHospital);
    setHospitalInput("");
  };

  const toggleVerified = async () => {
    const next = !verified;
    setVerified(next);
    await patchUserProfile(account, "verified", next);
    toast.info(next ? "Marked as verified ✅" : "Verification badge removed");
  };

  const handlePatientAddressChange = async (a) => {
    setPatient(a); setPatientError(""); setRequestSent(false);
    const profile = await fetchProfile(a.trim().toLowerCase());
    setPatientName(profile?.name || "");
  };

  const handleRequestAccess = async () => {
    if (!patient.trim()) return;
    if (!isValidAddress(patient)) { setPatientError("Invalid Ethereum address"); return; }
    setPatientError("");
    try {
      setLoading(true); setStatus("Sending access request…");
      await requestAccessOnChain(patient.trim());
      flashSuccess();
      toast.success("Access request sent!");
      log("🔔", `Requested access from ${patient.trim().slice(0, 8)}…`);
      setRequestSent(true);
    } catch (err) {
      console.error("requestAccessOnChain failed:", err);
      flashFailure(); toast.error(`Failed to send request: ${err?.message || "unknown error"}`);
    } finally { setLoading(false); }
  };

  const fetchRecords = async () => {
    if (!patient.trim() || !isValidAddress(patient)) {
      setPatientError("Please enter a valid wallet address (0x…)");
      return;
    }
    setLoading(true); setStatus("Fetching patient records…");
    setRecords([]); setRecordMetas({});
    try {
      const result = await getRecords(patient.trim());
      setRecords(result || []);
      setActiveTab("records");
      // Fetch metadata for each CID from Firebase
      if (result && result.length > 0) {
        const pairs = await Promise.all(
          result.map(cid => getRecordMeta(cid).then(m => [cid, m]))
        );
        setRecordMetas(Object.fromEntries(pairs.filter(([, m]) => m)));
      }
      log("📂", `Fetched ${result?.length || 0} records from ${patient.slice(0, 8)}…`);
      const profile2 = await fetchProfile(patient.toLowerCase());
      setPatientName(profile2?.name || "");
      flashSuccess();
      toast.success(`${result.length} record(s) unlocked 🔓`);
      log("👁️", `Viewed records of ${patient.slice(0, 8)}…`);
    } catch (err) {
      console.error("getRecords failed:", err);
      setRecords([]);
      flashFailure();
      toast.error(`Access denied — ${err?.message || "patient must approve first"}`);
    } finally { setLoading(false); }
  };

  const handleViewFile = async (cid) => {
    let meta = null;
    try { meta = JSON.parse(localStorage.getItem(`recordMeta_${cid}`)); } catch { }
    try {
      setLoading(true); setStatus("Decrypting…");
      const fileData = await decryptAndViewFile(cid);
      const magicMime = detectMimeFromBuffer(fileData);
      const mimeType = magicMime || meta?.fileType || "application/octet-stream";
      const blob = new Blob([fileData], { type: mimeType });
      const url = URL.createObjectURL(blob);
      setViewingCid(url);
      setViewerMeta({
        ...meta,
        fileType: mimeType,
        fileName: meta?.fileName || (magicMime ? `record.${magicMime.split("/")[1]}` : "medical-record")
      });
      setViewerOpen(true);
      flashSuccess();
      toast.success("File decrypted");
    } catch (err) {
      flashFailure(); toast.error(`Decryption failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  const closeViewer = () => {
    setViewerOpen(false);
    if (viewingCid) URL.revokeObjectURL(viewingCid);
    setViewingCid(null); setViewerMeta(null);
  };

  const loadAuditLog = useCallback(async () => {
    setAuditLoading(true);
    const events = await getAuditLog(account);
    setAuditLog(events); setAuditLoading(false);
  }, [account]);

  useEffect(() => { if (activeTab === "audit") loadAuditLog(); }, [activeTab, loadAuditLog]);

  const dm = darkMode;
  const cardBg = dm ? "#1e293b" : "#fff";
  const cardBorder = dm ? "#334155" : "#e2e8f0";
  const textPrimary = dm ? "#f1f5f9" : "#0f172a";
  const textMuted = dm ? "#94a3b8" : "#64748b";
  const inputBg = dm ? "#0f172a" : "#fff";
  const inputBorder = dm ? "#475569" : "#d1d5db";

  const tabStyle = (name) => ({
    padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600,
    fontSize: "0.82rem", border: "none",
    background: activeTab === name ? "#6366f1" : (dm ? "#1e293b" : "#f1f5f9"),
    color: activeTab === name ? "#fff" : (dm ? "#94a3b8" : "#475569"),
    transition: "all 0.15s",
  });

  return (
    <>
      <LoadingOverlay message={loading ? status : ""} success={showSuccess} failure={showFailure} statusMessage={status} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="mt-14">
        {/* Header with verified badge */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "2.8rem", fontWeight: 400, color: textPrimary, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {doctorName ? `Welcome, Dr. ${doctorName}` : "Doctor Dashboard"}
          </h2>
          {verified && (
            <span style={{ background: "linear-gradient(135deg, #d1fae5, #6ee7b7)", color: "#065f46", fontWeight: 700, fontSize: "0.78rem", borderRadius: "999px", padding: "0.35rem 0.85rem", border: "1.5px solid #6ee7b7" }}>
              ✅ Verified Doctor
            </span>
          )}
        </div>

        {/* Details */}
        {(!doctorName || !hospitalName) && (
          <div className="card mb-6" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h3 className="card-header" style={{ color: textPrimary }}>👨‍⚕️ Your Details</h3>
            <div className="flex flex-col gap-3">
              {!doctorName && (
                <div className="flex gap-3 items-center">
                  <span style={{ color: textMuted, fontWeight: 500 }} className="w-24 shrink-0">Your Name:</span>
                  <input value={doctorNameInput} onChange={e => setDoctorNameInput(e.target.value)}
                    placeholder="Enter your full name"
                    style={{ flex: 1, border: `1px solid ${inputBorder}`, background: inputBg, color: textPrimary, borderRadius: "8px", padding: "0.5rem 0.75rem" }} />
                </div>
              )}
              {!hospitalName && (
                <div className="flex gap-3 items-center">
                  <span style={{ color: textMuted, fontWeight: 500 }} className="w-24 shrink-0">🏥 Hospital:</span>
                  <input value={hospitalInput} onChange={e => setHospitalInput(e.target.value)}
                    placeholder="Enter hospital name"
                    style={{ flex: 1, border: `1px solid ${inputBorder}`, background: inputBg, color: textPrimary, borderRadius: "8px", padding: "0.5rem 0.75rem" }} />
                </div>
              )}
              <button onClick={() => { handleSaveDoctorName(); handleSaveHospital(); }} className="btn-primary self-end">Save Details</button>
            </div>
          </div>
        )}

        {(doctorName || hospitalName) && (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {doctorName && <span style={{ color: textMuted, fontSize: "0.875rem" }}>👨‍⚕️ Dr. {doctorName}</span>}
            {hospitalName && <span style={{ color: textMuted, fontSize: "0.875rem" }}>🏥 {hospitalName}</span>}
            {/* Verified badge toggle */}
            <button onClick={toggleVerified}
              style={{ padding: "0.3rem 0.8rem", borderRadius: "999px", border: `1.5px solid ${verified ? "#6ee7b7" : inputBorder}`, background: verified ? "#d1fae5" : (dm ? "#1e293b" : "#f8fafc"), color: verified ? "#065f46" : textMuted, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>
              {verified ? "✅ Verified" : "☑ Mark as Verified"}
            </button>
            <button onClick={() => { patchUserProfile(account, "name", ""); patchUserProfile(account, "hospital", ""); setDoctorName(""); setHospitalName(""); setDoctorNameInput(""); setHospitalInput(""); }}
              className="text-xs text-red-400 hover:text-red-600 underline">Edit</button>
          </div>
        )}

        {/* Patient Access Card */}
        <div className="card mb-8" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="card-header" style={{ color: textPrimary }}>🧾 Patient Record Access</h3>
          
          {registeredPatients.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.8rem", color: textMuted, fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase" }}>Registered Patients</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", maxHeight: "120px", overflowY: "auto", padding: "0.75rem", background: dm ? "#0f172a" : "#f8fafc", borderRadius: "10px", border: `1px solid ${cardBorder}` }}>
                {registeredPatients.map(p => (
                  <button key={p.addr} onClick={() => handlePatientAddressChange(p.addr)}
                    style={{ padding: "0.45rem 1rem", background: patient === p.addr ? (dm ? "linear-gradient(135deg, #d8daff, #c6f5f0)" : "linear-gradient(135deg, #050a1f, #1e293b)") : (dm ? "#1e293b" : "#fff"), color: patient === p.addr ? (dm ? "#050a1f" : "#fdfbf7") : textPrimary, border: `1px solid ${patient === p.addr ? (dm ? "#c6f5f0" : "#050a1f") : cardBorder}`, borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.15s", fontWeight: patient === p.addr ? 700 : 500 }}>
                    <span style={{fontFamily: "Playfair Display, serif", fontWeight: 700, opacity: 0.8}}>P</span> {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input value={patient} onChange={e => handlePatientAddressChange(e.target.value)}
            placeholder="Or enter wallet address manually (0x…)"
            style={{ width: "100%", border: `1px solid ${patientError ? "#f87171" : inputBorder}`, background: inputBg, color: textPrimary, borderRadius: "8px", padding: "0.75rem", marginBottom: patientError ? "0.25rem" : "0" }} />
          {patientError && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginTop: "0.25rem" }}>{patientError}</p>}
          {patientName && !patientError && (
            <span style={{ display: "inline-block", marginTop: "0.75rem", fontSize: "0.82rem", color: dm ? "#050a1f" : "#fdfbf7", background: dm ? "#c6f5f0" : "#050a1f", borderRadius: "8px", padding: "0.3rem 0.75rem", fontWeight: 600 }}>
               <span style={{fontFamily: "Playfair Display, serif", opacity: 0.8, marginRight: "4px"}}>P</span> Selected: {patientName}
            </span>
          )}
          <div className="flex gap-3 flex-wrap mt-4">
            <button onClick={handleRequestAccess} disabled={!patient.trim() || requestSent} className="btn-secondary" style={{ opacity: !patient.trim() || requestSent ? 0.5 : 1 }} id="request-access-btn">
              {requestSent ? "✅ Request Sent" : "🔔 Request Access"}
            </button>
            <button onClick={fetchRecords} className="btn-primary" disabled={!patient.trim()} style={{ opacity: !patient.trim() ? 0.5 : 1 }} id="view-records-btn">
              View Records
            </button>
          </div>
          {requestSent && <p style={{ color: "#16a34a", fontSize: "0.875rem", marginTop: "0.75rem" }}>⏳ Waiting for patient to approve. Click "View Records" to check.</p>}
        </div>

        {/* Tab bar — shown when there are records OR activity OR a valid patient address */}
        {(records.length > 0 || activityLog.length > 0 || (patient.trim() && isValidAddress(patient))) && (
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
            {records.length > 0 && <button style={tabStyle("records")} onClick={() => setActiveTab("records")}>📂 Records ({records.length})</button>}
            {patient.trim() && isValidAddress(patient) && <button style={tabStyle("notes")} onClick={() => setActiveTab("notes")}>📝 Notes</button>}
            <button style={tabStyle("activity")} onClick={() => setActiveTab("activity")}>🕑 Activity ({activityLog.length})</button>
            <button style={tabStyle("audit")} onClick={() => setActiveTab("audit")}>⛓ Audit Log</button>
          </div>
        )}

        {/* Records Tab */}
        {activeTab === "records" && records.length > 0 && (
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h4 className="card-header" style={{ color: textPrimary }}>📂 {patientName ? `${patientName}'s Medical Records` : "Patient Medical Records"}</h4>
            <ul className="space-y-2">
              {records.map((cid, i) => {
                const meta = recordMetas[cid] || null;
                const catStyle = meta ? (CATEGORY_COLORS[meta.category] || CATEGORY_COLORS["Other"]) : null;
                return (
                  <li key={i} style={{ background: dm ? "#0f172a" : "#f8fafc", borderRadius: "12px", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", border: `1px solid ${cardBorder}` }}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span style={{ fontSize: "1.4rem" }}>{meta ? fileIcon(meta.fileType, meta.fileName) : "📎"}</span>
                      <div className="min-w-0">
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>{meta ? meta.fileName : `Record ${i + 1}`}</span>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          {meta && catStyle && <span style={{ background: catStyle.bg, color: catStyle.color, fontSize: "0.7rem", fontWeight: 700, borderRadius: "6px", padding: "2px 8px" }}>{meta.category}</span>}
                          {meta && <span style={{ fontSize: "0.72rem", color: textMuted }}>{meta.uploadDate}</span>}
                          <span style={{ fontSize: "0.72rem", color: dm ? "#475569" : "#d1d5db" }}>{cid.slice(0, 10)}…</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleViewFile(cid)} className="btn-primary text-sm shrink-0" style={{ padding: "0.4rem 0.9rem" }}>View</button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h3 className="card-header" style={{ color: textPrimary }}>🕑 Activity Log</h3>
            {activityLog.length === 0 ? (
              <p style={{ color: textMuted, fontSize: "0.9rem", textAlign: "center", padding: "2rem" }}>No activity recorded yet.</p>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {activityLog.map((entry, i) => (
                  <li key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.65rem 0.75rem", background: dm ? "#0f172a" : "#f8fafc", borderRadius: "10px", border: `1px solid ${cardBorder}` }}>
                    <span style={{ fontSize: "1.1rem" }}>{entry.icon}</span>
                    <div>
                      <p style={{ fontSize: "0.83rem", color: textPrimary, fontWeight: 500 }}>{entry.msg}</p>
                      <p style={{ fontSize: "0.72rem", color: textMuted }}>{new Date(entry.ts).toLocaleString("en-IN")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "notes" && (
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h3 className="card-header" style={{ color: textPrimary }}>📝 Clinical Notes & Prescriptions</h3>
            <DoctorNotes
              account={account}
              patientAddress={patient.trim()}
              patientName={patientName}
              darkMode={darkMode}
            />
          </div>
        )}

        {/* Audit Tab */}
        {activeTab === "audit" && (
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-header mb-0" style={{ color: textPrimary }}>⛓ On-Chain Audit Log</h3>
              <button onClick={loadAuditLog} className="btn-primary text-sm" style={{ padding: "0.4rem 1rem" }}>Refresh</button>
            </div>
            {auditLoading ? (
              <p style={{ color: textMuted, textAlign: "center", padding: "2rem" }}>⏳ Fetching events…</p>
            ) : auditLog.length === 0 ? (
              <p style={{ color: textMuted, fontSize: "0.9rem", textAlign: "center", padding: "2rem" }}>No on-chain events found in the last 10,000 blocks.</p>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {auditLog.map((ev, i) => (
                  <li key={i} style={{ padding: "0.65rem 0.75rem", background: dm ? "#0f172a" : "#f8fafc", borderRadius: "10px", border: `1px solid ${cardBorder}` }}>
                    <p style={{ fontSize: "0.83rem", color: textPrimary, fontWeight: 500 }}>{ev.label}</p>
                    <p style={{ fontSize: "0.72rem", color: textMuted }}>Block #{ev.block}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Viewer Modal */}
        {viewerOpen && viewingCid && (() => {
          const mimeType = viewerMeta?.fileType || "";
          const fileName = viewerMeta?.fileName || "medical-record";
          const mode = getViewerMode(mimeType, fileName);
          return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div style={{ background: "#fff", borderRadius: "20px", width: "100%", maxWidth: "700px", maxHeight: "88vh", overflow: "auto", padding: "1.75rem", boxShadow: "0 24px 80px rgba(0,0,0,0.35)" }}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{fileIcon(mimeType, fileName)} {fileName}</h3>
                    {viewerMeta?.category && <span style={{ fontSize: "0.7rem", fontWeight: 700, borderRadius: "6px", padding: "2px 8px", ...(CATEGORY_COLORS[viewerMeta.category] || CATEGORY_COLORS["Other"]) }}>{viewerMeta.category}</span>}
                  </div>
                  <button onClick={closeViewer} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "36px", height: "36px", fontSize: "1.2rem", cursor: "pointer", color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
                {mode === "image" && <img src={viewingCid} alt={fileName} className="w-full h-auto rounded-lg" />}
                {mode === "pdf" && <iframe src={viewingCid} title={fileName} style={{ width: "100%", height: "60vh", border: "none", borderRadius: "8px" }} />}
                {mode === "download" && (
                  <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #e2e8f0" }}>
                    <p style={{ fontSize: "3rem" }}>{fileIcon(mimeType, fileName)}</p>
                    <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.75rem" }}>Can't preview — download below.</p>
                  </div>
                )}
                <button onClick={() => { const a = document.createElement("a"); a.href = viewingCid; a.download = fileName; a.click(); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  style={{ display: "block", width: "100%", textAlign: "center", marginTop: "1rem" }}>⬇ Download {fileName}</button>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}

export default DoctorDashboard;
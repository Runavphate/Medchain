import React, { useState, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { QRCodeCanvas } from "qrcode.react";
import { uploadEncryptedFile, decryptAndViewFile } from "../utils/ipfs";
import {
  addRecord, grantAccess, revokeAccess, getRecords,
  getPendingRequests, clearRequest, getAuditLog
} from "../utils/contract";
import LoadingOverlay from "./LoadingOverlay";
import ConfirmDialog from "./ConfirmDialog";
import { ToastContainer, useToast } from "./Toast";
import MedicationTracker from "./MedicationTracker";
import Messaging from "./Messaging";

const CATEGORIES = ["Lab Report", "Prescription", "X-Ray", "Discharge Summary", "Other"];
const CATEGORY_COLORS = {
  "Lab Report": { bg: "#dbeafe", color: "#1d4ed8", chart: "#3b82f6" },
  "Prescription": { bg: "#d1fae5", color: "#065f46", chart: "#10b981" },
  "X-Ray": { bg: "#fce7f3", color: "#9d174d", chart: "#ec4899" },
  "Discharge Summary": { bg: "#fef3c7", color: "#92400e", chart: "#f59e0b" },
  "Other": { bg: "#f3f4f6", color: "#374151", chart: "#6b7280" },
};

const isValidAddress = (addr) => /^0x[0-9a-fA-F]{40}$/.test(addr.trim());

// Infer a real MIME type from filename extension when browser reports none
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

// ── Activity log helpers ──────────────────────────────────────────────
const logKey = (account) => `activityLog_${account}`;

const addLocalLog = (account, entry) => {
  try {
    const existing = JSON.parse(localStorage.getItem(logKey(account)) || "[]");
    const updated = [{ ...entry, ts: new Date().toISOString() }, ...existing].slice(0, 50);
    localStorage.setItem(logKey(account), JSON.stringify(updated));
  } catch { }
};

const getLocalLog = (account) => {
  try { return JSON.parse(localStorage.getItem(logKey(account)) || "[]"); } catch { return []; }
};

function PatientDashboard({ account, darkMode }) {
  // Core state
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [doctor, setDoctor] = useState("");
  const [doctorError, setDoctorError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFailure, setShowFailure] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [uploadedCids, setUploadedCids] = useState([]);
  const [viewingCid, setViewingCid] = useState(null);
  const [viewerMeta, setViewerMeta] = useState(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [accessRequests, setAccessRequests] = useState([]);
  const [grantedDoctors, setGrantedDoctors] = useState([]);
  const [selectedDoctorForChat, setSelectedDoctorForChat] = useState("");
  const [registeredDoctors, setRegisteredDoctors] = useState([]);

  // Filtering
  const [filterText, setFilterText] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Tabs
  const [activeTab, setActiveTab] = useState("records"); // records | analytics | activity | audit | qr

  // Activity & Audit
  const [activityLog, setActivityLog] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  // Confirm dialogs
  const [confirmRevoke, setConfirmRevoke] = useState(null);  // doctor addr
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  const { toasts, removeToast, toast } = useToast();

  const flashSuccess = () => { setShowSuccess(true); setTimeout(() => setShowSuccess(false), 1500); };
  const flashFailure = () => { setShowFailure(true); setTimeout(() => setShowFailure(false), 1500); };

  const log = useCallback((icon, msg) => {
    const entry = { icon, msg };
    addLocalLog(account, entry);
    setActivityLog(getLocalLog(account));
  }, [account]);

  const loadRequests = useCallback(async () => {
    try {
      const addrs = await getPendingRequests();
      setAccessRequests([...addrs]);
    } catch { }
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(`patientName_${account}`);
    if (saved) setPatientName(saved);
    const savedDoctors = localStorage.getItem(`grantedDoctors_${account}`);
    if (savedDoctors) { try { setGrantedDoctors(JSON.parse(savedDoctors)); } catch { } }
    setActivityLog(getLocalLog(account));
    loadRequests();
    const interval = setInterval(loadRequests, 5000);

    const allDocs = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.toLowerCase().startsWith("doctorname_")) {
            const addr = key.split("_")[1];
            const name = localStorage.getItem(key);
            if (name) allDocs.push({ addr, name });
        }
    }
    setRegisteredDoctors(allDocs);

    return () => clearInterval(interval);
  }, [account, loadRequests]);

  const saveGrantedDoctors = (list) => {
    localStorage.setItem(`grantedDoctors_${account}`, JSON.stringify(list));
    setGrantedDoctors(list);
  };

  const addGrantedDoctor = (addr) => {
    setGrantedDoctors(prev => {
      if (prev.includes(addr)) return prev;
      const next = [...prev, addr];
      localStorage.setItem(`grantedDoctors_${account}`, JSON.stringify(next));
      return next;
    });
  };

  const handleSaveName = () => {
    if (!nameInput.trim()) return;
    localStorage.setItem(`patientName_${account}`, nameInput.trim());
    setPatientName(nameInput.trim());
    setNameInput("");
  };

  // Approve / deny access requests
  const handleApproveRequest = async (doctorAddress) => {
    try {
      setLoading(true);
      setStatus("Granting access...");
      await grantAccess(doctorAddress);
      flashSuccess();
      toast.success("Access granted to doctor");
      log("✅", `Granted access to ${doctorAddress.slice(0, 8)}…`);
      addGrantedDoctor(doctorAddress);
      loadRequests();
    } catch {
      flashFailure();
      toast.error("Failed to grant access");
    } finally { setLoading(false); }
  };

  const handleRevokeAccess = async (doctorAddress) => {
    try {
      setLoading(true);
      setStatus("Revoking access...");
      await revokeAccess(doctorAddress);
      flashSuccess();
      toast.success("Access revoked");
      log("🚫", `Revoked access from ${doctorAddress.slice(0, 8)}…`);
      saveGrantedDoctors(grantedDoctors.filter(a => a !== doctorAddress));
    } catch {
      flashFailure();
      toast.error("Failed to revoke access");
    } finally { setLoading(false); setConfirmRevoke(null); }
  };

  const handleRevokeAll = async () => {
    setConfirmRevokeAll(false);
    try {
      setLoading(true);
      setStatus("Revoking all access...");
      for (const addr of grantedDoctors) await revokeAccess(addr);
      flashSuccess();
      toast.success(`Removed access for ${grantedDoctors.length} doctor(s)`);
      log("🚫", `Revoked all access (${grantedDoctors.length} doctors)`);
      saveGrantedDoctors([]);
    } catch {
      flashFailure();
      toast.error("Failed to revoke all access");
    } finally { setLoading(false); }
  };

  const handleDenyRequest = async (doctorAddress) => {
    try {
      setLoading(true);
      await clearRequest(doctorAddress);
      toast.info("Request denied");
      log("❌", `Denied request from ${doctorAddress.slice(0, 8)}…`);
      loadRequests();
    } catch { toast.error("Failed to deny request"); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (accessGranted) {
      getRecords(account).then(cids => setUploadedCids(cids)).catch(() => { });
    }
  }, [account, accessGranted]);

  // Drag-and-drop
  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) setFile(dropped);
  }, []);

  const handleUpload = async () => {
    if (!file) { toast.warning("Please select a file first"); return; }
    try {
      setLoading(true);
      setStatus("Encrypting & uploading to IPFS…");
      const cid = await uploadEncryptedFile(file);
      await addRecord(cid);
      const guessedType = file.type && file.type !== "" ? file.type : guessMimeFromFileName(file.name);
      const meta = { fileName: file.name, fileType: guessedType, uploadDate: new Date().toLocaleDateString("en-IN"), category };
      localStorage.setItem(`recordMeta_${cid}`, JSON.stringify(meta));
      setUploadedCids(prev => [...prev, cid]);
      flashSuccess();
      toast.success(`"${file.name}" uploaded successfully`);
      log("📄", `Uploaded ${file.name} (${category})`);
      setFile(null);
      const fi = document.getElementById("patient-file-input");
      if (fi) fi.value = "";
    } catch (err) {
      flashFailure();
      toast.error(`Upload failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  const handleGrant = async () => {
    if (!doctor.trim()) return;
    if (!isValidAddress(doctor)) { setDoctorError("Invalid Ethereum address (must be 0x + 40 hex chars)"); return; }
    setDoctorError("");
    try {
      setLoading(true); setStatus("Granting access…");
      await grantAccess(doctor.trim());
      flashSuccess();
      toast.success("Doctor access granted");
      log("✅", `Granted access to ${doctor.trim().slice(0, 8)}…`);
      addGrantedDoctor(doctor.trim());
      setDoctor("");
    } catch {
      flashFailure(); toast.error("Transaction failed");
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

  const handleRefreshRecords = async () => {
    if (!account) { toast.warning("Wallet not connected"); return; }
    try {
      setLoading(true); setStatus("Fetching records…");
      const cids = await getRecords(account);
      setUploadedCids(cids);
      flashSuccess();
      toast.success(`Found ${cids.length} record(s)`);
    } catch (err) {
      flashFailure(); toast.error(`Failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  const handleGrantSelfAccess = async () => {
    try {
      setLoading(true); setStatus("Granting self-access…");
      await grantAccess(account);
      setAccessGranted(true);
      flashSuccess();
      toast.success("Self-access granted — refreshing records");
      log("✅", "Granted self-access");
      await handleRefreshRecords();
    } catch (err) {
      flashFailure(); toast.error(`Failed: ${err.message}`);
    } finally { setLoading(false); }
  };

  const loadAuditLog = useCallback(async () => {
    if (!account) return;
    setAuditLoading(true);
    const events = await getAuditLog(account);
    setAuditLog(events);
    setAuditLoading(false);
  }, [account]);

  // When switching to audit tab, load events
  useEffect(() => { if (activeTab === "audit") loadAuditLog(); }, [activeTab, loadAuditLog]);

  const closeViewer = () => {
    setViewerOpen(false);
    if (viewingCid) URL.revokeObjectURL(viewingCid);
    setViewingCid(null); setViewerMeta(null);
  };

  // Analytics data
  const analyticsData = CATEGORIES.map(cat => {
    const count = uploadedCids.filter(cid => {
      try { return JSON.parse(localStorage.getItem(`recordMeta_${cid}`))?.category === cat; } catch { return false; }
    }).length;
    return { name: cat, value: count, color: CATEGORY_COLORS[cat].chart };
  }).filter(d => d.value > 0);

  // Filtered records
  const filteredCids = uploadedCids.filter(cid => {
    let meta = null;
    try { meta = JSON.parse(localStorage.getItem(`recordMeta_${cid}`)); } catch { }
    const matchText = !filterText || (meta?.fileName || "").toLowerCase().includes(filterText.toLowerCase());
    const matchCat = filterCategory === "All" || meta?.category === filterCategory;
    return matchText && matchCat;
  });

  const dm = darkMode;
  const cardBg = dm ? "#1e293b" : "#fff";
  const cardBorder = dm ? "#334155" : "#e2e8f0";
  const textPrimary = dm ? "#f1f5f9" : "#0f172a";
  const textMuted = dm ? "#94a3b8" : "#64748b";
  const inputBg = dm ? "#0f172a" : "#fff";
  const inputBorder = dm ? "#475569" : "#d1d5db";

  // Tab style helper
  const tabStyle = (name) => ({
    padding: "0.5rem 1rem", borderRadius: "8px", cursor: "pointer", fontWeight: 600,
    fontSize: "0.82rem", border: "none",
    background: activeTab === name ? (dm ? "#6366f1" : "#6366f1") : (dm ? "#1e293b" : "#f1f5f9"),
    color: activeTab === name ? "#fff" : (dm ? "#94a3b8" : "#475569"),
    transition: "all 0.15s",
  });

  return (
    <>
      <LoadingOverlay message={loading ? status : ""} success={showSuccess} failure={showFailure} statusMessage={status} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <ConfirmDialog
        open={!!confirmRevoke}
        title="Revoke Doctor Access"
        message={`Are you sure you want to revoke access from ${confirmRevoke?.slice(0, 10)}…? This will require a blockchain transaction.`}
        confirmLabel="Revoke Access"
        onConfirm={() => handleRevokeAccess(confirmRevoke)}
        onCancel={() => setConfirmRevoke(null)}
      />
      <ConfirmDialog
        open={confirmRevokeAll}
        title="Revoke All Doctors"
        message={`This will revoke access from all ${grantedDoctors.length} doctor(s). Each requires a separate transaction. Are you sure?`}
        confirmLabel="Revoke All"
        onConfirm={handleRevokeAll}
        onCancel={() => setConfirmRevokeAll(false)}
      />

      <div className="mt-14">
        {/* Header */}
        <h2 className="text-4xl font-extrabold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-teal-400">
          {patientName ? `Welcome, ${patientName} 👋` : "Patient Dashboard"}
        </h2>

        {/* Name input */}
        {!patientName && (
          <div className="card mb-6" style={{ background: cardBg, borderColor: cardBorder, border: `1px solid ${cardBorder}` }}>
            <h3 className="card-header" style={{ color: textPrimary }}>👤 Your Details</h3>
            <div className="flex gap-3 items-center">
              <span style={{ color: textMuted, fontWeight: 500 }} className="w-24 shrink-0">Your Name:</span>
              <input value={nameInput} onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSaveName()}
                placeholder="Enter your full name"
                style={{ flex: 1, border: `1px solid ${inputBorder}`, background: inputBg, color: textPrimary, borderRadius: "8px", padding: "0.5rem 0.75rem" }} />
              <button onClick={handleSaveName} className="btn-primary whitespace-nowrap">Save</button>
            </div>
          </div>
        )}
        {patientName && (
          <p className="text-sm mb-4" style={{ color: textMuted }}>
            <span className="mr-3">👤 {patientName}</span>
            <button onClick={() => { localStorage.removeItem(`patientName_${account}`); setPatientName(""); setNameInput(""); }}
              className="text-xs text-red-400 hover:text-red-600 underline">Edit</button>
          </p>
        )}

        {/* Access Request Notifications */}
        {accessRequests.length > 0 && (
          <div className="mb-6">
            {accessRequests.map(addr => {
              let dName = ""; let dHospital = "";
              for (let i = 0; i < localStorage.length; i++) {
                 if (localStorage.key(i).toLowerCase() === `doctorname_${addr}`.toLowerCase()) dName = localStorage.getItem(localStorage.key(i));
                 if (localStorage.key(i).toLowerCase() === `hospitalname_${addr}`.toLowerCase()) dHospital = localStorage.getItem(localStorage.key(i));
              }
              return (
                <div key={addr} style={{
                  background: "linear-gradient(135deg, #fffbeb, #fef3c7)", border: "1.5px solid #fbbf24",
                  borderRadius: "14px", padding: "1rem 1.25rem", marginBottom: "0.75rem",
                  display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap",
                  animation: "pulseNotif 2s ease-in-out infinite",
                }}>
                  <div>
                    <p style={{ fontWeight: 700, color: "#92400e", fontSize: "0.95rem" }}>🔔 New Access Request</p>
                    <p style={{ color: "#78350f", fontSize: "0.85rem", marginTop: "0.2rem" }}>
                      {dName ? <><strong>Dr. {dName}</strong>{dHospital && <> from <strong>{dHospital}</strong></>}</> : <strong>{addr.slice(0, 10)}…{addr.slice(-6)}</strong>} wants to view your records.
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.6rem" }}>
                    <button onClick={() => handleApproveRequest(addr)} style={{ padding: "0.5rem 1.1rem", background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>✓ Approve</button>
                    <button onClick={() => handleDenyRequest(addr)} style={{ padding: "0.5rem 1.1rem", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer" }}>✕ Deny</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Top action row: View + Upload */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h3 className="card-header" style={{ color: textPrimary }}>👁️ View Your Records</h3>
            {!accessGranted && uploadedCids.length === 0 ? (
              <button onClick={handleGrantSelfAccess} className="btn-alert">Grant Myself Access</button>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <p className="text-sm" style={{ color: textMuted }}>Fetch all your records from the blockchain.</p>
                <button onClick={handleRefreshRecords} className="btn-primary">Refresh Records</button>
              </div>
            )}
          </div>
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h3 className="card-header" style={{ color: textPrimary }}>📄 Upload Medical Record</h3>
            <div
              onDrop={handleDrop} onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById("patient-file-input").click()}
              style={{ border: `2px dashed ${dragOver ? "#6366f1" : inputBorder}`, borderRadius: "12px", padding: "1rem", textAlign: "center", background: dragOver ? "#eef2ff" : (dm ? "#0f172a" : "#f8fafc"), cursor: "pointer", marginBottom: "0.75rem", transition: "all 0.2s" }}
            >
              <p style={{ color: dragOver ? "#6366f1" : textMuted, fontSize: "0.875rem", fontWeight: dragOver ? 700 : 400 }}>
                {file ? <><span style={{ fontSize: "1.3rem" }}>{fileIcon(file.type, file.name)}</span><br /><strong style={{ color: textPrimary }}>{file.name}</strong></> : (dragOver ? "Drop it! 🎯" : "Drag & drop or click to browse")}
              </p>
              <input id="patient-file-input" type="file" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
            </div>
            <div className="flex gap-3 items-center mb-3">
              <label style={{ fontSize: "0.875rem", color: textMuted, fontWeight: 500 }}>Category:</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                style={{ flex: 1, border: `1px solid ${inputBorder}`, background: inputBg, color: textPrimary, borderRadius: "8px", padding: "0.5rem" }}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button onClick={handleUpload} className="btn-primary" disabled={!file} style={{ opacity: !file ? 0.6 : 1 }}>Upload & Encrypt</button>
          </div>
        </div>

        {/* Grant Access */}
        <div className="card mb-8" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
          <h3 className="card-header" style={{ color: textPrimary }}>🔐 Grant Doctor Access</h3>
          
          {registeredDoctors.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.8rem", color: textMuted, fontWeight: 700, marginBottom: "0.5rem", textTransform: "uppercase" }}>Registered Doctors</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", maxHeight: "120px", overflowY: "auto", padding: "0.75rem", background: dm ? "#0f172a" : "#f8fafc", borderRadius: "10px", border: `1px solid ${cardBorder}` }}>
                {registeredDoctors.map(d => (
                  <button key={d.addr} onClick={() => { setDoctor(d.addr); setDoctorError(""); }}
                    style={{ padding: "0.45rem 1rem", background: doctor === d.addr ? "linear-gradient(135deg, #3b82f6, #2563eb)" : (dm ? "#1e293b" : "#fff"), color: doctor === d.addr ? "#fff" : textPrimary, border: `1px solid ${doctor === d.addr ? "#2563eb" : cardBorder}`, borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem", transition: "all 0.15s", fontWeight: doctor === d.addr ? 700 : 500 }}>
                    👨‍⚕️ Dr. {d.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <input value={doctor} onChange={e => { setDoctor(e.target.value); setDoctorError(""); }}
            placeholder="Doctor wallet address (0x…)"
            style={{ width: "100%", border: `1px solid ${doctorError ? "#f87171" : inputBorder}`, background: inputBg, color: textPrimary, borderRadius: "8px", padding: "0.5rem 0.75rem", marginBottom: doctorError ? "0.25rem" : "0.75rem" }} />
          {doctorError && <p style={{ color: "#ef4444", fontSize: "0.75rem", marginBottom: "0.75rem" }}>{doctorError}</p>}
          <button onClick={handleGrant} className="btn-secondary" disabled={!doctor.trim()} style={{ opacity: !doctor.trim() ? 0.6 : 1 }}>Grant Access</button>
        </div>

        {/* ── Tab Bar ──────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          {[
            { id: "records", label: `📋 Records (${uploadedCids.length})` },
            { id: "meds", label: "💊 Medications" },
            { id: "messages", label: "💬 Messages" },
            { id: "analytics", label: "📊 Analytics" },
            { id: "activity", label: `🕑 Activity (${activityLog.length})` },
            { id: "audit", label: "⛓ Audit Log" },
            { id: "qr", label: "📷 QR Code" },
            { id: "access", label: `🩺 Access (${grantedDoctors.length})` },
          ].map(t => (
            <button key={t.id} style={tabStyle(t.id)} onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab: Records ─────────────────────────────────────── */}
        {activeTab === "records" && uploadedCids.length > 0 && (
          <div className="card" style={{ background: dm ? "#1e293b" : "#f0fdf4", border: `1px solid ${dm ? "#334155" : "#bbf7d0"}` }}>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <h3 className="font-semibold" style={{ color: textPrimary }}>✅ Your Records ({uploadedCids.length})</h3>
              <div className="flex gap-2 flex-wrap">
                <input type="text" placeholder="🔍 Search filename…" value={filterText} onChange={e => setFilterText(e.target.value)}
                  style={{ border: `1px solid ${inputBorder}`, borderRadius: "8px", padding: "0.35rem 0.75rem", fontSize: "0.8rem", background: inputBg, color: textPrimary }} />
                <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
                  style={{ border: `1px solid ${inputBorder}`, borderRadius: "8px", padding: "0.35rem 0.6rem", fontSize: "0.8rem", background: inputBg, color: textPrimary }}>
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {filteredCids.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: textMuted }}>
                <p style={{ fontSize: "2rem" }}>🔍</p>
                <p style={{ fontSize: "0.9rem", marginTop: "0.5rem" }}>No records match your filter.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredCids.map((cid, i) => {
                  let meta = null;
                  try { meta = JSON.parse(localStorage.getItem(`recordMeta_${cid}`)); } catch { }
                  const catStyle = meta ? (CATEGORY_COLORS[meta.category] || CATEGORY_COLORS["Other"]) : CATEGORY_COLORS["Other"];
                  return (
                    <li key={i} style={{ background: cardBg, borderRadius: "12px", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.75rem", border: `1px solid ${cardBorder}` }}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span style={{ fontSize: "1.4rem" }}>{meta ? fileIcon(meta.fileType, meta.fileName) : "📎"}</span>
                        <div className="min-w-0">
                          <span style={{ fontSize: "0.875rem", fontWeight: 600, color: textPrimary, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>{meta ? meta.fileName : `Record ${i + 1}`}</span>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {meta && <span style={{ background: catStyle.bg, color: catStyle.color, fontSize: "0.7rem", fontWeight: 700, borderRadius: "6px", padding: "2px 8px" }}>{meta.category}</span>}
                            {meta && <span style={{ fontSize: "0.75rem", color: textMuted }}>{meta.uploadDate}</span>}
                            <span style={{ fontSize: "0.72rem", color: dm ? "#475569" : "#d1d5db" }}>{cid.slice(0, 10)}…</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => handleViewFile(cid)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm shrink-0">View</button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {activeTab === "records" && accessGranted && uploadedCids.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem 2rem", background: dm ? "#1e293b" : "#f8fafc", borderRadius: "16px", border: `2px dashed ${cardBorder}` }}>
            <p style={{ fontSize: "3rem" }}>📂</p>
            <p style={{ color: textPrimary, fontWeight: 700, marginTop: "0.75rem" }}>No records yet</p>
            <p style={{ color: textMuted, fontSize: "0.85rem" }}>Upload your first record using the form above.</p>
          </div>
        )}

        {/* ── Tab: Medications ──────────────────────────────── */}
        {activeTab === "meds" && (
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h3 className="card-header" style={{ color: textPrimary }}>💊 Medication Tracker</h3>
            <MedicationTracker account={account} darkMode={darkMode} />
          </div>
        )}

        {/* ── Tab: Messages ───────────────────────────────────── */}
        {activeTab === "messages" && (
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h3 className="card-header" style={{ color: textPrimary }}>💬 Messages</h3>
            {grantedDoctors.length === 0 ? (
              <p style={{ color: textMuted, textAlign: "center", padding: "2rem" }}>You haven't granted access to any doctors yet. Grant access first to start messaging.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", color: textMuted, fontWeight: 700, marginBottom: "0.5rem", display: "block" }}>Select a Doctor to Chat With:</label>
                  <select 
                    value={selectedDoctorForChat} 
                    onChange={e => setSelectedDoctorForChat(e.target.value)}
                    style={{ width: "100%", maxWidth: "400px", padding: "0.75rem", borderRadius: "8px", border: `1px solid ${inputBorder}`, background: inputBg, color: textPrimary }}
                  >
                    <option value="" disabled>-- Select Doctor --</option>
                    {grantedDoctors.map(addr => {
                      let dName = "";
                      for (let i = 0; i < localStorage.length; i++) {
                         if (localStorage.key(i).toLowerCase() === `doctorname_${addr}`.toLowerCase()) dName = localStorage.getItem(localStorage.key(i));
                      }
                      return <option key={addr} value={addr}>{dName ? `Dr. ${dName}` : addr}</option>;
                    })}
                  </select>
                </div>
                {selectedDoctorForChat && (() => {
                  let chatDocName = "";
                  for (let i = 0; i < localStorage.length; i++) {
                      if (localStorage.key(i).toLowerCase() === `doctorname_${selectedDoctorForChat}`.toLowerCase()) chatDocName = localStorage.getItem(localStorage.key(i));
                  }
                  return (
                    <Messaging 
                      currentUserAddress={account}
                      otherUserAddress={selectedDoctorForChat}
                      otherUserName={chatDocName}
                      role="patient"
                      darkMode={darkMode}
                    />
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Analytics ───────────────────────────────────── */}
        {activeTab === "analytics" && (
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h3 className="card-header" style={{ color: textPrimary }}>📊 Records by Category</h3>
            {analyticsData.length === 0 ? (
              <p style={{ color: textMuted, fontSize: "0.9rem", textAlign: "center", padding: "2rem" }}>No records to show analytics for yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={analyticsData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`} labelLine={false}>
                      {analyticsData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val} record(s)`, name]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                  {analyticsData.map(d => (
                    <div key={d.name} style={{ background: dm ? "#0f172a" : "#f8fafc", borderRadius: "10px", padding: "0.75rem 1rem", textAlign: "center", border: `1px solid ${cardBorder}` }}>
                      <p style={{ fontSize: "1.5rem", fontWeight: 800, color: d.color }}>{d.value}</p>
                      <p style={{ fontSize: "0.75rem", color: textMuted }}>{d.name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Tab: Activity Log ────────────────────────────────── */}
        {activeTab === "activity" && (
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <h3 className="card-header" style={{ color: textPrimary }}>🕑 Recent Activity</h3>
            {activityLog.length === 0 ? (
              <p style={{ color: textMuted, fontSize: "0.9rem", textAlign: "center", padding: "2rem" }}>No activity recorded yet.</p>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {activityLog.map((entry, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.65rem 0.75rem", background: dm ? "#0f172a" : "#f8fafc", borderRadius: "10px", border: `1px solid ${cardBorder}` }}>
                    <span style={{ fontSize: "1.1rem" }}>{entry.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.83rem", color: textPrimary, fontWeight: 500 }}>{entry.msg}</p>
                      <p style={{ fontSize: "0.72rem", color: textMuted }}>{new Date(entry.ts).toLocaleString("en-IN")}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Tab: Blockchain Audit Log ─────────────────────────── */}
        {activeTab === "audit" && (
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}` }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="card-header mb-0" style={{ color: textPrimary }}>⛓ On-Chain Audit Log</h3>
              <button onClick={loadAuditLog} className="btn-primary text-sm" style={{ padding: "0.4rem 1rem" }}>Refresh</button>
            </div>
            {auditLoading ? (
              <p style={{ color: textMuted, textAlign: "center", padding: "2rem" }}>⏳ Fetching events from blockchain…</p>
            ) : auditLog.length === 0 ? (
              <p style={{ color: textMuted, fontSize: "0.9rem", textAlign: "center", padding: "2rem" }}>No on-chain events found in the last 10,000 blocks.</p>
            ) : (
              <ul style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {auditLog.map((ev, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.65rem 0.75rem", background: dm ? "#0f172a" : "#f8fafc", borderRadius: "10px", border: `1px solid ${cardBorder}` }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.83rem", color: textPrimary, fontWeight: 500 }}>{ev.label}</p>
                      {ev.detail && <p style={{ fontSize: "0.72rem", color: textMuted }}>CID: {ev.detail}</p>}
                      <p style={{ fontSize: "0.72rem", color: textMuted }}>Block #{ev.block}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ── Tab: QR Code ─────────────────────────────────────── */}
        {activeTab === "qr" && (
          <div className="card" style={{ background: cardBg, border: `1px solid ${cardBorder}`, textAlign: "center" }}>
            <h3 className="card-header" style={{ color: textPrimary }}>📷 Your Wallet QR Code</h3>
            <p style={{ color: textMuted, fontSize: "0.875rem", marginBottom: "1.5rem" }}>
              Show this to a doctor so they can scan your address — no typing needed.
            </p>
            <div style={{ display: "inline-block", background: "#fff", padding: "1.25rem", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.12)", marginBottom: "1rem" }}>
              <QRCodeCanvas value={account} size={200} level="H" includeMargin={false} />
            </div>
            <p style={{ fontFamily: "monospace", fontSize: "0.78rem", color: textMuted, wordBreak: "break-all", marginTop: "0.75rem" }}>{account}</p>
            <button
              onClick={() => { navigator.clipboard.writeText(account); toast.success("Address copied to clipboard!"); }}
              style={{ marginTop: "1rem", padding: "0.6rem 1.25rem", background: "linear-gradient(135deg, #6366f1, #4f46e5)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem" }}
            >📋 Copy Address</button>
          </div>
        )}

        {/* ── Tab: Doctors with Access ─────────────────────────── */}
        {activeTab === "access" && (
          <div className="card" style={{ background: cardBg, border: `1.5px solid ${dm ? "#1e3a5f" : "#7dd3fc"}` }}>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
              <h3 className="font-semibold" style={{ color: dm ? "#7dd3fc" : "#0369a1" }}>🩺 Doctors with Access ({grantedDoctors.length})</h3>
              {grantedDoctors.length > 1 && (
                <button onClick={() => setConfirmRevokeAll(true)}
                  style={{ padding: "0.4rem 1rem", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}>
                  🚫 Revoke All
                </button>
              )}
            </div>
            {grantedDoctors.length === 0 ? (
              <p style={{ color: textMuted, textAlign: "center", fontSize: "0.9rem", padding: "2rem" }}>No doctors granted access yet.</p>
            ) : (
              <ul className="space-y-2">
                {grantedDoctors.map(addr => {
                  let dName = ""; let dHospital = "";
                  for (let i = 0; i < localStorage.length; i++) {
                     if (localStorage.key(i).toLowerCase() === `doctorname_${addr}`.toLowerCase()) dName = localStorage.getItem(localStorage.key(i));
                     if (localStorage.key(i).toLowerCase() === `hospitalname_${addr}`.toLowerCase()) dHospital = localStorage.getItem(localStorage.key(i));
                  }
                  return (
                    <li key={addr} style={{ background: dm ? "#0f172a" : "#fff", borderRadius: "12px", padding: "0.75rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", border: `1px solid ${cardBorder}` }}>
                      <div>
                        <p style={{ fontWeight: 700, color: textPrimary, fontSize: "0.9rem" }}>{dName ? `👨‍⚕️ Dr. ${dName}` : `👨‍⚕️ ${addr.slice(0, 10)}…${addr.slice(-6)}`}</p>
                        {dHospital && <p style={{ fontSize: "0.78rem", color: dm ? "#7dd3fc" : "#0369a1" }}>🏥 {dHospital}</p>}
                        <p style={{ fontSize: "0.72rem", color: textMuted }}>{addr.slice(0, 10)}…{addr.slice(-6)}</p>
                      </div>
                      <button onClick={() => setConfirmRevoke(addr)}
                        style={{ padding: "0.45rem 1rem", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                        🚫 Revoke
                      </button>
                    </li>
                  );
                })}
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
                    {viewerMeta?.category && (
                      <span style={{ fontSize: "0.7rem", fontWeight: 700, borderRadius: "6px", padding: "2px 8px", ...(CATEGORY_COLORS[viewerMeta.category] || CATEGORY_COLORS["Other"]) }}>{viewerMeta.category}</span>
                    )}
                  </div>
                  <button onClick={closeViewer} style={{ background: "#f1f5f9", border: "none", borderRadius: "50%", width: "36px", height: "36px", fontSize: "1.2rem", cursor: "pointer", color: "#64748b", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                </div>
                {mode === "image" && <img src={viewingCid} alt={fileName} className="w-full h-auto rounded-lg" />}
                {mode === "pdf" && <iframe src={viewingCid} title={fileName} style={{ width: "100%", height: "60vh", border: "none", borderRadius: "8px" }} />}
                {mode === "download" && (
                  <div style={{ textAlign: "center", padding: "3rem", background: "#f8fafc", borderRadius: "12px", border: "2px dashed #e2e8f0" }}>
                    <p style={{ fontSize: "3rem" }}>{fileIcon(mimeType, fileName)}</p>
                    <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.75rem" }}>This file type can't be previewed — download it below.</p>
                  </div>
                )}
                <button onClick={() => { const a = document.createElement("a"); a.href = viewingCid; a.download = fileName; a.click(); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  style={{ display: "block", width: "100%", textAlign: "center", marginTop: "1rem" }}>
                  ⬇ Download {fileName}
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}

export default PatientDashboard;
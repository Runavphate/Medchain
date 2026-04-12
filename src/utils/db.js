/**
 * db.js — Firebase Realtime Database helpers for MedChain
 *
 * All user data is stored under: users/<walletAddress>/...
 * Record metadata is stored under: recordMeta/<cid>
 * Doctor notes are stored under: doctorNotes/<doctorAddr>/<patientAddr>
 *
 * All wallet addresses are lowercased before use as keys.
 */

import { db } from "./firebase";
import { ref, set, get } from "firebase/database";

// ─── Key normalisation ────────────────────────────────────────────────────────
const addr = (a) => (a || "").toLowerCase().replace(/[.#$[\]]/g, "_");

// ─── User profile (name, hospital, verified, grantedDoctors) ─────────────────

export async function getUserProfile(account) {
  try {
    const snap = await get(ref(db, `users/${addr(account)}/profile`));
    return snap.exists() ? snap.val() : {};
  } catch { return {}; }
}

export async function setUserProfile(account, data) {
  try {
    await set(ref(db, `users/${addr(account)}/profile`), data);
  } catch (e) { console.error("setUserProfile:", e); }
}

export async function patchUserProfile(account, key, value) {
  try {
    await set(ref(db, `users/${addr(account)}/profile/${key}`), value);
  } catch (e) { console.error("patchUserProfile:", e); }
}

// ─── Granted doctors list (patient side) ─────────────────────────────────────

export async function getGrantedDoctors(account) {
  try {
    const snap = await get(ref(db, `users/${addr(account)}/grantedDoctors`));
    if (!snap.exists()) return [];
    const val = snap.val();
    // Firebase stores arrays as objects with numeric keys — convert safely
    return Array.isArray(val) ? val : Object.values(val);
  } catch { return []; }
}

export async function setGrantedDoctors(account, list) {
  try {
    await set(ref(db, `users/${addr(account)}/grantedDoctors`), list);
  } catch (e) { console.error("setGrantedDoctors:", e); }
}

// ─── Record metadata ──────────────────────────────────────────────────────────

export async function getRecordMeta(cid) {
  try {
    const snap = await get(ref(db, `recordMeta/${cid}`));
    return snap.exists() ? snap.val() : null;
  } catch { return null; }
}

export async function setRecordMeta(cid, meta) {
  try {
    await set(ref(db, `recordMeta/${cid}`), meta);
  } catch (e) { console.error("setRecordMeta:", e); }
}

// ─── Medications ──────────────────────────────────────────────────────────────

export async function getMedications(account) {
  try {
    const snap = await get(ref(db, `users/${addr(account)}/medications`));
    if (!snap.exists()) return [];
    const val = snap.val();
    return Array.isArray(val) ? val : Object.values(val);
  } catch { return []; }
}

export async function setMedications(account, list) {
  try {
    await set(ref(db, `users/${addr(account)}/medications`), list);
  } catch (e) { console.error("setMedications:", e); }
}

// ─── Doctor notes ─────────────────────────────────────────────────────────────

export async function getDoctorNotes(doctorAccount, patientAddress) {
  try {
    const snap = await get(
      ref(db, `doctorNotes/${addr(doctorAccount)}/${addr(patientAddress)}`)
    );
    if (!snap.exists()) return [];
    const val = snap.val();
    return Array.isArray(val) ? val : Object.values(val);
  } catch { return []; }
}

export async function setDoctorNotes(doctorAccount, patientAddress, notes) {
  try {
    await set(
      ref(db, `doctorNotes/${addr(doctorAccount)}/${addr(patientAddress)}`),
      notes
    );
  } catch (e) { console.error("setDoctorNotes:", e); }
}

// ─── Activity log ─────────────────────────────────────────────────────────────

export async function getActivityLog(account) {
  try {
    const snap = await get(ref(db, `users/${addr(account)}/activityLog`));
    if (!snap.exists()) return [];
    const val = snap.val();
    return Array.isArray(val) ? val : Object.values(val);
  } catch { return []; }
}

export async function addActivityLogEntry(account, entry) {
  try {
    const existing = await getActivityLog(account);
    const updated = [{ ...entry, ts: new Date().toISOString() }, ...existing].slice(0, 50);
    await set(ref(db, `users/${addr(account)}/activityLog`), updated);
    return updated;
  } catch (e) { console.error("addActivityLogEntry:", e); return []; }
}

// ─── Registered users listing (for doctor/patient discovery) ──────────────────

/**
 * Fetch all users with a given role from Firebase.
 * Returns array of { addr, name, hospital? }
 */
export async function listUsersByRole(role) {
  try {
    const snap = await get(ref(db, "users"));
    if (!snap.exists()) return [];
    const users = snap.val();
    return Object.entries(users)
      .filter(([, u]) => u?.profile?.role === role && u?.profile?.name)
      .map(([a, u]) => ({
        addr: a,
        name: u.profile.name,
        hospital: u.profile.hospital || "",
      }));
  } catch { return []; }
}

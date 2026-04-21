import React, { useState, useEffect } from "react";
import PatientDashboard from "./components/PatientDashboard";
import DoctorDashboard from "./components/DoctorDashboard";
import LoginPage from "./components/LoginPage";
import NotificationBell from "./components/NotificationBell";
import { getGrantedDoctors, listUsersByRole } from "./utils/db";

import { createWeb3Modal, defaultConfig } from '@web3modal/ethers';
import { setGlobalProvider } from "./utils/contract";
import logo from "./assets/medchain-logo.svg";


// 1. Web3Modal Configuration
const projectId = '1c72c1484a9d982f01b4ce42b1312fa0';

const sepolia = {
  chainId: 11155111,
  name: 'Sepolia',
  currency: 'ETH',
  explorerUrl: 'https://sepolia.etherscan.io',
  rpcUrl: 'https://rpc.sepolia.org'
};

const metadata = {
  name: 'MedChain',
  description: 'MedChain Decentralized Medical Records',
  // Automatically use the current origin (localhost, Vercel, etc.)
  url: typeof window !== 'undefined' ? window.location.origin : 'https://medchain.vercel.app',
  icons: ['https://medchain.vercel.app/logo192.png']
};

const ethersConfig = defaultConfig({
  metadata,
  enableEIP6963: true,
  enableInjected: true,
  enableCoinbase: true,
});

const web3modal = createWeb3Modal({
  ethersConfig,
  chains: [sepolia],
  defaultChain: sepolia, // Enforce Sepolia chain on connect
  projectId,
  enableAnalytics: false,
  themeMode: 'dark'
});

function App() {
  const [account, setAccount] = useState("");
  const [role, setRole] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  // Role chosen on login page before wallet connects
  const [pendingRole, setPendingRole] = useState("");
  // For notification bell: who this user can receive messages from
  const [bellPartners, setBellPartners] = useState([]);

  // Sync Web3Modal WalletConnect Wallet using Vanilla JS directly
  useEffect(() => {
    // Disable auto-login on mount by clearing any active cache
    const disableAutoLogin = async () => {
      if (web3modal.getIsConnected()) {
        try {
          if (typeof web3modal.disconnect === "function") {
            await web3modal.disconnect();
          } else if (web3modal.adapter && typeof web3modal.adapter.disconnect === "function") {
            await web3modal.adapter.disconnect();
          }
        } catch (e) {
          console.error("Failed to disconnect cached session:", e);
        }
      }
    };
    disableAutoLogin();

    // Subscribe to state changes dynamically
    const unsubscribe = web3modal.subscribeProvider((state) => {
      // Prefer the wallet-specific provider from Web3Modal, then standard window.ethereum
      const provider = state.walletProvider || state.provider || (typeof window !== 'undefined' ? window.ethereum : null);
      if (state.isConnected && provider && state.address) {
        setAccount(state.address);
        setGlobalProvider(provider);
      } else {
        // Handled globally if required
      }
    });

    return () => unsubscribe();
  }, []);

  // When account is connected and a pending role exists from the login screen, apply it immediately.
  useEffect(() => {
    if (account && pendingRole && !role) {
      setRole(pendingRole);
      setPendingRole("");
    }
  }, [account, pendingRole, role]);






  // Apply / remove 'dark' class on <html> for Tailwind
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Load message partners for the notification bell
  useEffect(() => {
    if (!account || !role) { setBellPartners([]); return; }
    if (role === "patient") {
      getGrantedDoctors(account).then(list => setBellPartners(list || []));
    } else if (role === "doctor") {
      listUsersByRole("patient").then(users => setBellPartners(users.map(u => u.addr)));
    }
  }, [account, role]);


  const handleDisconnect = async () => {
    setAccount("");
    setRole("");
    setGlobalProvider(null);
    try { 
      if (web3modal.getIsConnected()) {
        if (typeof web3modal.disconnect === "function") {
          await web3modal.disconnect();
        } else if (web3modal.adapter && typeof web3modal.adapter.disconnect === "function") {
          await web3modal.adapter.disconnect();
        }
      } 
    } catch (e) {
      console.error("Disconnect Error", e); 
    }
  };



  const dm = darkMode;
  const navBg = dm ? "rgba(15,23,42,0.92)" : "rgba(255,255,255,0.88)";
  const textPrimary = dm ? "#f1f5f9" : "#1e293b";
  const subtext = dm ? "#94a3b8" : "#64748b";
  const pageBg = dm ? "#0f172a" : "#f1f5f9";

  return (
    <div style={{ minHeight: "100vh", background: pageBg, overflowX: "hidden" }}>
      {/* ── Navbar ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        backdropFilter: "blur(12px)", background: navBg,
        boxShadow: dm ? "0 1px 0 rgba(255,255,255,0.06)" : "0 1px 0 rgba(0,0,0,0.08)",
        padding: "0.9rem 2rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img src={logo} alt="MedChain logo" style={{ height: "46px", width: "46px" }} />
            <div>
              <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: textPrimary, lineHeight: 1.1 }}>MedChain</h1>
              <p style={{ fontSize: "0.72rem", color: subtext }}>Blockchain-powered medical record security</p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            {/* Dark mode toggle */}
            <button
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                background: dm ? "#1e293b" : "#f1f5f9", border: `1.5px solid ${dm ? "#334155" : "#e2e8f0"}`,
                borderRadius: "50%", width: "38px", height: "38px",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontSize: "1.1rem", transition: "all 0.2s",
              }}
            >
              {dm ? "☀️" : "🌙"}
            </button>

            {/* Notification Bell — visible once wallet is connected */}
            {account && (
              <NotificationBell
                account={account}
                role={role}
                darkMode={darkMode}
                grantedDoctors={role === "patient" ? bellPartners : []}
                grantedPatients={role === "doctor" ? bellPartners : []}
              />
            )}

            {account && (
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span
                  title={account}
                  onClick={() => { navigator.clipboard.writeText(account); }}
                  style={{ color: "#10b981", fontWeight: 700, fontSize: "0.95rem", cursor: "pointer", userSelect: "none" }}
                >
                  🦊 {account.slice(0, 6)}…{account.slice(-4)}
                </span>
                <button onClick={handleDisconnect}
                  style={{ padding: "0.45rem 1rem", background: "linear-gradient(135deg, #ef4444, #dc2626)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}>
                  Disconnect
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "6rem 2rem 3rem" }}>
        {!account && <LoginPage connectWeb3Modal={() => web3modal.open()} darkMode={darkMode} onRoleSelect={r => setPendingRole(r)} />}

        {role === "patient" && <PatientDashboard account={account} darkMode={darkMode} />}
        {role === "doctor" && <DoctorDashboard account={account} darkMode={darkMode} />}

        {role && (
          <button onClick={() => setRole("")} style={{ marginTop: "2rem", fontSize: "0.875rem", color: dm ? "#818cf8" : "#3b82f6", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            ← Switch Role
          </button>
        )}
      </main>
    </div>
  );
}

export default App;
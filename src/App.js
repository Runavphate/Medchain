import React, { useState, useEffect } from "react";
import PatientDashboard from "./components/PatientDashboard";
import DoctorDashboard from "./components/DoctorDashboard";
import LoginPage from "./components/LoginPage";
import EthereumProvider from "@walletconnect/ethereum-provider";
import logo from "./assets/medchain-logo.svg";

const SEPOLIA_CHAIN_ID = "0xaa36a7";

function App() {
  const [account, setAccount] = useState("");
  const [role, setRole] = useState("");
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  // Apply / remove 'dark' class on <html> for Tailwind
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask");
      return;
    }

    await window.ethereum.request({
      method: "wallet_requestPermissions",
      params: [{ eth_accounts: {} }],
    });

    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const chainId = await window.ethereum.request({ method: "eth_chainId" });

    if (chainId !== SEPOLIA_CHAIN_ID) {
      try {
        await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_CHAIN_ID }] });
      } catch {
        alert("Please switch to Sepolia Testnet");
        return;
      }
    }

    setAccount(accounts[0]);
  };

  const connectWalletConnect = async () => {
    try {
      const provider = await EthereumProvider.init({
        projectId: "1c72c1484a9d982f01b4ce42b1312fa0",
        chains: [11155111],
        showQrModal: true,
        qrModalOptions: { themeMode: "light" },
      });

      if (provider.session) await provider.disconnect();

      provider.on("connect", () => {
        const accs = provider.accounts;
        if (accs && accs.length > 0) setAccount(accs[0]);
      });

      provider.on("disconnect", () => { setAccount(""); setRole(""); });

      const accounts = await provider.enable();
      if (accounts && accounts.length > 0) setAccount(accounts[0]);
    } catch (err) {
      console.error("WalletConnect error:", err);
    }
  };

  const handleDisconnect = () => { setAccount(""); setRole(""); };

  React.useEffect(() => {
    if (!window.ethereum) return;
    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) setAccount(accounts[0]);
      else setAccount("");
    };
    const handleChainChanged = () => setAccount("");
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);
    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

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
        {!account && <LoginPage connectWallet={connectWallet} connectWalletConnect={connectWalletConnect} darkMode={darkMode} />}

        {account && !role && (
          <div style={{ minHeight: "calc(100vh - 120px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h2 style={{ fontSize: "2rem", fontWeight: 800, color: textPrimary, marginBottom: "0.5rem" }}>Who is using MedChain?</h2>
              <p style={{ color: subtext, fontSize: "1rem" }}>Select your role to continue. Switch anytime by disconnecting.</p>
            </div>

            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              {/* Patient Card */}
              {[
                {
                  roleKey: "patient", emoji: "🧑", title: "I'm a Patient",
                  desc: "Upload & manage your medical records securely on the blockchain.",
                  features: ["🔒 Your data stays private", "📄 Upload records to IPFS", "🤝 Grant doctor access"],
                  gradient: "linear-gradient(135deg, #d1fae5, #6ee7b7)", glowColor: "rgba(16,185,129,0.28)", borderHover: "#10b981",
                  btnGrad: "linear-gradient(135deg, #10b981, #059669)", label: "Enter as Patient →",
                },
                {
                  roleKey: "doctor", emoji: "👨‍⚕️", title: "I'm a Doctor",
                  desc: "View patient records you've been granted permission to access.",
                  features: ["✅ Blockchain permission check", "�️ View decrypted records", "🔐 Access only what's shared"],
                  gradient: "linear-gradient(135deg, #e0e7ff, #a5b4fc)", glowColor: "rgba(99,102,241,0.28)", borderHover: "#6366f1",
                  btnGrad: "linear-gradient(135deg, #6366f1, #4f46e5)", label: "Enter as Doctor →",
                }
              ].map(c => (
                <div key={c.roleKey}
                  onClick={() => setRole(c.roleKey)}
                  style={{
                    width: "280px", background: dm ? "#1e293b" : "#fff", borderRadius: "20px", padding: "2rem",
                    boxShadow: `0 4px 24px ${c.glowColor.replace("0.28", "0.12")}`, border: `2px solid ${dm ? "#334155" : "#e2e8f0"}`,
                    cursor: "pointer", transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
                    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "1rem",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${c.glowColor}`; e.currentTarget.style.borderColor = c.borderHover; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = `0 4px 24px ${c.glowColor.replace("0.28", "0.12")}`; e.currentTarget.style.borderColor = dm ? "#334155" : "#e2e8f0"; }}
                >
                  <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: c.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2.2rem" }}>{c.emoji}</div>
                  <h3 style={{ fontSize: "1.4rem", fontWeight: 800, color: textPrimary }}>{c.title}</h3>
                  <p style={{ color: subtext, fontSize: "0.875rem", lineHeight: 1.6 }}>{c.desc}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, width: "100%", textAlign: "left" }}>
                    {c.features.map(f => (
                      <li key={f} style={{ fontSize: "0.8rem", color: dm ? "#94a3b8" : "#475569", padding: "0.3rem 0", borderBottom: `1px solid ${dm ? "#1e293b" : "#f1f5f9"}` }}>{f}</li>
                    ))}
                  </ul>
                  <div style={{ width: "100%", padding: "0.75rem", background: c.btnGrad, color: "#fff", borderRadius: "12px", fontWeight: 700, fontSize: "0.95rem" }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

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

(() => {
  // Optional: set a dedicated RPC first, above this script:
// Prefer a runtime override, else your Helius key, else public
const RPC =
  (typeof localStorage !== 'undefined' && localStorage.getItem('NX_RPC')) ||
  "https://rpc.helius.xyz/?api-key=YOUR_KEY"; // <-- put your real key here
const connection = new solanaWeb3.Connection(RPC, 'confirmed');

  const { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } = solanaWeb3;

  const els = {
    btn: document.getElementById('connectBtn'),
    label: document.getElementById('connectLabel'),
    info: document.getElementById('walletInfo'),
    addr: document.getElementById('addressShort'),
    bal: document.getElementById('solBalance'),
    err: document.getElementById('walletError')
  };

  // EXAMPLES — replace with your actual IDs / handlers:
  on('connectBtn', 'click', handleConnect);
  on('refreshBtn', 'click', refreshPortfolio);
  on('wallet-btn', 'click', openWalletMenu);
  // ... any other document.getElementById(...).addEventListener(...) calls
});

  const RPC = (typeof window.NX_RPC === 'string' && window.NX_RPC.trim())
    ? window.NX_RPC.trim()
    : clusterApiUrl('mainnet-beta');
  const connection = new Connection(RPC, 'confirmed');

  function phantom() {
    const provider = window.solana;
    return (provider && provider.isPhantom) ? provider : null;
  }
  const short = (s) => {
    s = String(s);
    return s.length > 10 ? `${s.slice(0,4)}…${s.slice(-4)}` : s;
  };

  function showError(msg){ els.err.style.display='block'; els.err.textContent = msg; }
  function clearError(){ els.err.style.display='none'; els.err.textContent=''; }

  async function fetchBalance(pubkey) {
    try {
      const lamports = await connection.getBalance(new PublicKey(pubkey));
      els.bal.textContent = (lamports / LAMPORTS_PER_SOL).toFixed(4);
    } catch (e) {
      showError("Couldn’t fetch balance. RPC might be rate-limited.");
      console.warn(e);
    }
  }

  async function onConnected(publicKey) {
    clearError();
    els.label.textContent = 'Disconnect';
    els.info.style.display = 'block';
    els.addr.textContent = short(publicKey?.toString?.() || publicKey);
    await fetchBalance(publicKey);
  }
  async function onDisconnected() {
    els.label.textContent = 'Connect Phantom';
    els.info.style.display = 'none';
    els.addr.textContent = '—';
    els.bal.textContent = '0.0000';
  }

  // Button
  els.btn.addEventListener('click', async () => {
    try {
      const p = phantom();
      if (!p) {
        showError('Phantom not detected. Install Phantom or enable it in your browser.');
        window.open('https://phantom.app/', '_blank');
        return;
      }
      clearError();
      if (p.isConnected) { await p.disconnect(); return; }
      const res = await p.connect({ onlyIfTrusted: false });
      await onConnected(res.publicKey);
    } catch (e) {
      showError(e?.message || 'Wallet connection was cancelled.');
      console.warn(e);
    }
  });

  // Wallet events
  const p0 = phantom();
  if (p0) {
    p0.on('accountChanged', async (pubkey) => pubkey ? onConnected(pubkey) : onDisconnected());
    p0.on('connect', async (pubkey) => onConnected(pubkey));
    p0.on('disconnect', async () => onDisconnected());
  }

  // Auto-restore if already trusted
  (async () => {
    try {
      const p = phantom(); if (!p) return;
      const res = await p.connect({ onlyIfTrusted: true });
      if (res?.publicKey) await onConnected(res.publicKey);
    } catch {}
  })();

// Gentle polling
setInterval(async () => {
  try {
    const p = phantom();
    if (p && p.isConnected && p.publicKey) await fetchBalance(p.publicKey);
  } catch {}
}, 20000);
)();


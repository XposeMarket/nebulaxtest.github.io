(() => {
  // Optional: set a dedicated RPC first via window.NX_RPC in HTML (see step 3)

  const { Connection, clusterApiUrl, PublicKey, LAMPORTS_PER_SOL } = solanaWeb3;

// in inline-11.js, where you create the connection:
const RPC = (typeof window.NX_RPC === "string" && window.NX_RPC.trim())
  ? window.NX_RPC.trim()
  : "https://api.mainnet-beta.solana.com"; // fallback if you forget to set it

const connection = new solanaWeb3.Connection(RPC, "confirmed");

  
  const els = {
    btn:  document.getElementById('connectBtn'),
    label:document.getElementById('connectLabel'),
    info: document.getElementById('walletInfo'),
    addr: document.getElementById('addressShort'),
    bal:  document.getElementById('solBalance'),
    err:  document.getElementById('walletError'),
  };

  // safe helpers
  const $id=(id)=>document.getElementById(id);
  const on=(id,evt,fn,opts)=>{ const el=$id(id); if(!el){ console.warn(`[NX] missing #${id}`); return; } el.addEventListener(evt,fn,opts); };
  function ready(fn){ document.readyState==='loading' ? document.addEventListener('DOMContentLoaded', fn, {once:true}) : fn(); }

  // wire events after DOM ready (prevents null.addEventListener errors)
  ready(() => {
    on('connectBtn','click', async () => {
      try {
        const p = phantom();
        if (!p) {
          showError('Phantom not detected. Install Phantom or enable it.');
          window.open('https://phantom.app/','_blank');
          return;
        }
        clearError();
        if (p.isConnected) { await p.disconnect(); return; }
        const res = await p.connect({ onlyIfTrusted:false });
        await onConnected(res.publicKey);
      } catch (e) {
        showError(e?.message || 'Wallet connection was cancelled.');
        console.warn(e);
      }
    });



// inside your ready(() => { ... }) block
const walletBtn = document.getElementById('wallet-btn');
if (walletBtn && window.NXWallet?.openMenu) {
  walletBtn.addEventListener('click', () => window.NXWallet.openMenu());
}
// (or just delete this whole block if you don’t want the popover here)



  function phantom() {
    const provider = window.solana;
    return (provider && provider.isPhantom) ? provider : null;
  }
  const short = s => (s = String(s), s.length > 10 ? `${s.slice(0,4)}…${s.slice(-4)}` : s);

  function showError(msg){ if(els.err){ els.err.style.display='block'; els.err.textContent = msg; } }
  function clearError(){ if(els.err){ els.err.style.display='none'; els.err.textContent=''; } }

  async function fetchBalance(pubkey){
    try{
      const lamports = await connection.getBalance(new PublicKey(pubkey));
      if (els.bal) els.bal.textContent = (lamports / LAMPORTS_PER_SOL).toFixed(4);
    }catch(e){
      showError('Couldn’t fetch balance. RPC might be rate-limited.');
      console.warn(e);
    }
  }

  async function onConnected(publicKey){
    clearError();
    if (els.label) els.label.textContent = 'Disconnect';
    if (els.info)  els.info.style.display = 'block';
    if (els.addr)  els.addr.textContent = short(publicKey?.toString?.() || publicKey);
    await fetchBalance(publicKey);
  }
  async function onDisconnected(){
    if (els.label) els.label.textContent = 'Connect Phantom';
    if (els.info)  els.info.style.display = 'none';
    if (els.addr)  els.addr.textContent = '—';
    if (els.bal)   els.bal.textContent = '0.0000';
  }

  // wallet events
  const p0 = phantom();
  if (p0){
    p0.on('accountChanged', async (pubkey) => pubkey ? onConnected(pubkey) : onDisconnected());
    p0.on('connect',      async (pubkey) => onConnected(pubkey));
    p0.on('disconnect',   async ()       => onDisconnected());
  }

  // auto-restore if trusted
  (async () => {
    try{
      const p = phantom(); if(!p) return;
      const res = await p.connect({ onlyIfTrusted:true });
      if (res?.publicKey) await onConnected(res.publicKey);
    }catch{}
  })();

  // gentle polling
  setInterval(async () => {
    try{
      const p = phantom();
      if (p && p.isConnected && p.publicKey) await fetchBalance(p.publicKey);
    }catch{}
  }, 20000);
})();

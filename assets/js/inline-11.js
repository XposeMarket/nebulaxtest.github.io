(() => {

 const { Connection, PublicKey, LAMPORTS_PER_SOL } = solanaWeb3;

  // --- RPC (uses Helius if set in HTML) ---
  const RPC =
    (typeof window.NX_RPC === "string" && window.NX_RPC.trim()) ||
    (typeof localStorage !== "undefined" && localStorage.getItem("NX_RPC")) ||
    "https://api.mainnet-beta.solana.com";
  const connection = new Connection(RPC, "confirmed");

  // --- helpers ---
  const $ = (id) => document.getElementById(id);
  const short = (s) => (s ? s.slice(0,4) + "…" + s.slice(-4) : "—");
  const phantom = () => (window.solana && window.solana.isPhantom ? window.solana : null);
  const showErr = (m) => { const e=$("walletError"); if(e){ e.style.display="block"; e.textContent=m; } };
  const clearErr= () => { const e=$("walletError"); if(e){ e.style.display="none"; e.textContent=""; } };

  async function fetchBalance(pubkey){
    try{
  const lam = await connection.getBalance(new PublicKey(pubkey));
      const sol = lam / LAMPORTS_PER_SOL;
      const b = $("solBalance"); if (b) b.textContent = sol.toFixed(4);
      return sol;
    }catch(e){
  showErr("Couldn’t fetch balance (check RPC/API key)."); console.warn(e);
      return null;
    }
  }
async function onConnected(pk){
    clearErr();
    const s = pk?.toString?.() || String(pk||"");
    $("connectLabel") && ( $("connectLabel").textContent = "Disconnect" );
    $("walletInfo")   && ( $("walletInfo").style.display = "block" );
    $("addressShort") && ( $("addressShort").textContent = short(s) );
    await fetchBalance(s);
    window.NX_refreshPortfolioCard?.();
  }
  async function onDisconnected(){
  $("connectLabel") && ( $("connectLabel").textContent = "Connect Phantom" );
    $("walletInfo")   && ( $("walletInfo").style.display = "none" );
    $("addressShort") && ( $("addressShort").textContent = "—" );
    $("solBalance")   && ( $("solBalance").textContent = "0.0000" );
    window.NX_refreshPortfolioCard?.();
  }
 function ready(fn){
    if(document.readyState==="loading"){
      document.addEventListener("DOMContentLoaded", fn, {once:true});
    } else fn();
  }
 ready(() => {
    // Connect / Disconnect
    const btn = $("connectBtn");
    if (btn){
      btn.addEventListener("click", async () => {
        try{
          const p = phantom();
          if(!p){ showErr("Phantom not detected. Install/enable Phantom."); return; }
          clearErr();
          if(p.isConnected){ await p.disconnect(); await onDisconnected(); return; }
          const res = await p.connect({ onlyIfTrusted:false });
          await onConnected(res.publicKey);
        }catch(e){ console.warn(e); showErr(e?.message || "Wallet connection was cancelled."); }
      });
    }

    // OPTIONAL header dropdown: ONLY wire if both exist.
    // If you don't use the popover on this page, leave this as-is.
    const wbtn = document.getElementById("wallet-btn");
    if (wbtn && window.NXWallet?.openMenu) {
      wbtn.addEventListener("click", () => window.NXWallet.openMenu());
    }

    // Phantom events
    const p0 = phantom();
    if (p0){
      p0.on("accountChanged", async (pubkey)=> pubkey ? onConnected(pubkey) : onDisconnected());
      p0.on("connect",      async (pubkey)=> onConnected(pubkey));
      p0.on("disconnect",   async ()=>      onDisconnected());
    }
 // Auto-restore if trusted
    (async () => {
      try{
        const p = phantom(); if(!p) return;
        const res = await p.connect({ onlyIfTrusted:true });
        if(res?.publicKey) await onConnected(res.publicKey);
      }catch{}
    })();
  });

// … keep everything you already have above …

// Gentle polling (optional). Remove if you want TX-only updates.
setInterval(async () => {
  try {
    const p = phantom();
    if (!p || !p.isConnected) return;
    const pk = p.publicKey?.toString?.();
    if (pk) await fetchBalance(pk);
  } catch (e) {
    // swallow
  }
}, 15000);

// close the IIFE you opened at the top
})();

// Good: file should begin like this (example)
(function(){
  const LKEY = 'nebula:wallet';
  const STATE = { provider:null, pubkey:null, balance:null, conn:null };
  // … rest of the wallet code …
})();

// choose RPC from window or localStorage, else fall back
const NX_RPC =
  (typeof window !== "undefined" && typeof window.NX_RPC === "string" && window.NX_RPC.trim()) ||
  (typeof localStorage !== "undefined" && localStorage.getItem("NX_RPC")) ||
  "https://api.mainnet-beta.solana.com";

// use NX_RPC EVERY time you construct a Connection
const connection = new solanaWeb3.Connection(NX_RPC, "confirmed");
// ...and anywhere else you do new Connection(...), use NX_RPC instead of a literal

// ========= Mobile detection & deep-link builders =========
function nxIsMobile(){
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i.test(ua);
}
function nxIsInAppWebView(){
  const ua = (navigator.userAgent||'').toLowerCase();
  return /(instagram|fbav|fban|fbios|twitter|snapchat|line\/|wechat|telegram|discord)/.test(ua);
}

// Build either the app-scheme or the universal-link for Phantom
function nxBuildPhantomConnectURL(kind /* 'scheme' | 'https' */){
  const redirect = encodeURIComponent(location.origin + location.pathname + '#phantom-callback');
  const appUrl   = encodeURIComponent(location.origin);

  // Parameters are the same — only the prefix differs
  const path = `/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirect}&cluster=mainnet-beta`;

  // 1) App scheme tries to open the app directly (best shot)
  if (kind === 'scheme') return `phantom:${path}`;
  // 2) Universal link opens the app if iOS/Android recognizes it; else lands on site/store
  return `https://phantom.app${path}`;
}

// Optional: escape hatch for hostile webviews
function nxOpenInRealBrowser(){
  const url = location.href;
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isiOS){
    window.location.href = url.replace(/^http:/,'https:'); // hand off to Safari
  }else{
    const intent = `intent://${location.host}${location.pathname}${location.search}${location.hash}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intent;
    setTimeout(()=>{ window.location.href = url; }, 500);
  }
}

// Simple dropdown for connect/disconnect
(function(){
  const LKEY = 'nebula:wallet';
  const STATE = { provider: null, pubkey: null, balance: null, conn: null };

  // Robust Phantom resolver (handles multi-wallet & mobile)
  function getPhantomProvider() {
    if (window.phantom?.solana) return window.phantom.solana;           // mobile/in-app
    const w = window.solana;
    if (w?.isPhantom) return w;                                         // single provider
    if (Array.isArray(w?.providers)) {                                  // multi-provider
      const ph = w.providers.find(p => p?.isPhantom);
      if (ph) return ph;
    }
    return null;
  }
// ===== Mobile helpers & Phantom deep link =====
function nxIsMobile(){
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return /android|iphone|ipad|ipod|iemobile|opera mini|mobile/i.test(ua);
}

// Minimal Phantom *connect* deeplink (you can harden with state/signatures later)
function nxBuildPhantomConnectLink(){
  // Send user back to same page after approval
  const redirect = encodeURIComponent(location.origin + location.pathname + '#phantom-callback');
  const appUrl  = encodeURIComponent(location.origin);
  // Phantom UL connect spec (cluster optional if you’re strictly mainnet)
  return `https://phantom.app/ul/v1/connect?app_url=${appUrl}&redirect_link=${redirect}&cluster=mainnet-beta`;
}

// Optional: if user is inside a webview that blocks deeplinks, let them jump to real browser
function nxOpenInRealBrowser(){
  const url = location.href;
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isiOS){
    // iOS always uses Safari (you can’t force Chrome)
    window.location.href = url.replace(/^http:/, 'https:');
  }else{
    const intent = `intent://${location.host}${location.pathname}${location.search}${location.hash}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intent;
    setTimeout(()=>{ window.location.href = url; }, 500); // fallback
  }
}

  function shorten(pk){ if(!pk) return ''; return pk.slice(0,4)+'…'+pk.slice(-4); }
function save(pk){
  try {
    localStorage.setItem("nebula:wallet", JSON.stringify({ pk }));
  } catch {}
}
  function load(){ try{ return JSON.parse(localStorage.getItem(LKEY)||'{}').pk||null; }catch{return null} }
  function clear(){ try{ localStorage.removeItem(LKEY); }catch{} }

  async function fetchBalance(pubkey){
    try{
const url = "https://rpc.helius.xyz/?api-key=YOUR_KEY";
      const connection = new solanaWeb3.Connection(url, 'confirmed');
      STATE.conn = connection;
      const lam = await connection.getBalance(new solanaWeb3.PublicKey(pubkey));
      return lam / solanaWeb3.LAMPORTS_PER_SOL;
    }catch{ return null; }
  }

async function connect({ remember=true } = {}){
  const prov = getPhantomProvider();

  // If no injected provider and we’re on mobile → open the Phantom APP via deep link
  if (!prov) {
    if (nxIsMobile()){
      const url = nxBuildPhantomConnectLink();
      window.location.href = url;        // opens Phantom app (if installed) instead of phantom.com
      return;                            // stop here; user returns via redirect_link/hash
    }
    // Desktop without provider: keep your current error
    throw new Error('Phantom not detected. Install Phantom or open in a wallet-enabled browser.');
  }


    // nice-to-have listeners
    prov.on?.('disconnect', ()=>{ STATE.pubkey=null; STATE.balance=null; clear(); ui(); });
    prov.on?.('accountChanged', async (pub)=>{
      STATE.pubkey = pub?.toString?.() || null;
      STATE.balance = STATE.pubkey ? await fetchBalance(STATE.pubkey) : null;
      ui();
    });
    // === Minimal live watcher (SOL only) ===
let SOL_SUB_ID = null;
let SAFETY_TIMER = null;

function stopBalanceWatch(){
  try{
    if (SOL_SUB_ID != null) { STATE.conn?.removeAccountChangeListener(SOL_SUB_ID); SOL_SUB_ID = null; }
  }catch{}
  clearInterval(SAFETY_TIMER); SAFETY_TIMER = null;
}

async function startBalanceWatch(pubkey){
  stopBalanceWatch();
  if (!STATE.conn) {
    const url = 'https://api.mainnet-beta.solana.com'; // or your Helius WS URL
    STATE.conn = new solanaWeb3.Connection(url, 'confirmed');
  }

  // initial (respects your throttled refreshBalance if you prefer)
  try{
    STATE.balance = await fetchBalance(pubkey);
    ui();
    window.dispatchEvent(new CustomEvent('nebula:sol:changed', { detail:{ balance: STATE.balance }}));
  }catch(e){ console.warn('init bal fetch', e); }

  // push updates via WS
  const key = new solanaWeb3.PublicKey(pubkey);
  SOL_SUB_ID = STATE.conn.onAccountChange(key, (accInfo)=>{
    try{
      const lam = accInfo?.lamports;
      if (typeof lam === 'number') {
        const next = lam / solanaWeb3.LAMPORTS_PER_SOL;
        if (STATE.balance !== next) {
          STATE.balance = next;
          ui();
          window.dispatchEvent(new CustomEvent('nebula:sol:changed', { detail:{ balance: next }}));
        }
      }
    }catch(e){ console.warn('sol sub cb', e); }
  }, 'confirmed');

  // safety poll every 5 min (not 60s)
  SAFETY_TIMER = setInterval(async ()=>{
    try{
      const b = await fetchBalance(pubkey);
      if (b != null && b !== STATE.balance) {
        STATE.balance = b; ui();
        window.dispatchEvent(new CustomEvent('nebula:sol:changed', { detail:{ balance: b }}));
      }
    }catch{}
  }, 5*60*1000);
}

    // after: STATE.balance = await fetchBalance(pk); ui();
startBalanceWatch(STATE.pubkey);
// and broadcast the first value
window.dispatchEvent(new CustomEvent('nebula:sol:changed', { detail:{ balance: STATE.balance }}));

// after: STATE.balance = STATE.pubkey ? await fetchBalance(STATE.pubkey) : null; ui();
if (STATE.pubkey) startBalanceWatch(STATE.pubkey); else stopBalanceWatch();
window.dispatchEvent(new CustomEvent('nebula:sol:changed', { detail:{ balance: STATE.balance }}));

    
// After STATE.balance is set/cached:
window.dispatchEvent(new CustomEvent('nebula:sol:changed', { detail:{ balance: STATE.balance }}));

    const resp = await prov.connect({ onlyIfTrusted:false });
    const pk = resp?.publicKey?.toString?.() || prov?.publicKey?.toString?.() || '';
    if(!pk) throw new Error('No public key received from Phantom');
    STATE.provider = prov;
    STATE.pubkey = pk;
    if(remember) save(pk);
    STATE.balance = await fetchBalance(pk);
    ui();
    return pk;
  }

  async function disconnect(){
    try{ await STATE.provider?.disconnect?.(); }catch{}
    STATE.pubkey = null; STATE.balance = null; clear(); ui();
    stopBalanceWatch();

  }

  function isConnected(){ return !!STATE.pubkey; }
  function isInstalled(){ return !!getPhantomProvider(); }
  function getAddress(){ return STATE.pubkey; }
  function getBalance(){ return STATE.balance; }

let lastBalanceFetch = 0;
const MIN_REFRESH_INTERVAL = 60_000; // 1 minute

async function refreshBalance(force=false){
  if (!STATE.pubkey) return null;
  const now = Date.now();
  if (!force && (now - lastBalanceFetch) < MIN_REFRESH_INTERVAL) {
    return STATE.balance; // reuse cached value
  }
  lastBalanceFetch = now;

  STATE.balance = await fetchBalance(STATE.pubkey);
  ui();
  window.dispatchEvent(new CustomEvent('nebula:sol:changed', { detail:{ balance: STATE.balance }}));
  return STATE.balance;
}



  // Simple popover menu
  function ensureMenu(){
    if(document.getElementById('nxw-menu')) return;
    const div = document.createElement('div');
    div.id='nxw-menu';
    div.className='hidden fixed z-[2500] w-80 popover p-3';
    div.style.border='1px solid var(--nx-border)';
    div.style.background='rgba(13,16,34,.98)';
    div.style.borderRadius='12px';
    div.style.boxShadow='0 10px 30px rgba(0,0,0,.4)';
    div.innerHTML = `
      <div class="text-sm font-semibold mb-2">Wallet</div>
      <div id="nxw-status" class="text-xs text-zinc-400 mb-2">Not connected</div>
      <div class="grid grid-cols-2 gap-2">
        <button id="nxw-connect" class="nx-btn">Connect</button>
        <button id="nxw-disconnect" class="nx-btn">Disconnect</button>
      </div>`;
    document.body.appendChild(div);

    document.getElementById('nxw-connect').onclick = async ()=>{
      try{ await connect({ remember:true }); }catch(e){ alert(e?.message||String(e)); }
      refreshMenu();
    };
    document.getElementById('nxw-disconnect').onclick = async ()=>{
      await disconnect(); refreshMenu();
    };

    window.addEventListener('mousedown', (e)=>{
      const m = document.getElementById('nxw-menu');
      if(!m) return;
      if(!m.contains(e.target) && !e.target.closest('#wallet-btn')) hideMenu();
    });
  }
  function openWalletMenu(){
    ensureMenu();
    const m=document.getElementById('nxw-menu');
    const btn=document.getElementById('wallet-btn');
    if(!btn || !m) return;
    const r=btn.getBoundingClientRect();
    m.style.top = (r.bottom+6)+'px';
    m.style.right = (document.documentElement.clientWidth - r.right)+'px';
    m.classList.remove('hidden');
    refreshMenu();
  }
  function hideMenu(){ document.getElementById('nxw-menu')?.classList.add('hidden'); }
  function refreshMenu(){
    const s=document.getElementById('nxw-status');
    const addr=getAddress(); const bal=getBalance();
    if(s) s.textContent = addr ? `Connected: ${shorten(addr)}${bal!=null?` • ${bal.toFixed(3)} SOL`:''}` : 'Not connected';
    ui();
  }

  function ui(){
    // Wire or update the header button
    const btn = document.getElementById('wallet-btn');
    if(!btn) return;

    const key = getAddress();
    const bal = getBalance();

    if(key){
      const balTxt = (bal==null? '—' : bal.toFixed(3)) + ' SOL';
      btn.innerHTML = `<i data-lucide="wallet" class="w-3 h-3 mr-2"></i> ${shorten(key)} • ${balTxt}`;
    }else{
      btn.innerHTML = `<i data-lucide="wallet" class="w-3 h-3 mr-2"></i> Connect Wallet`;
    }
    btn.onclick = openWalletMenu;

    try{ window.lucide?.createIcons?.(); }catch{}
  }

  // Guard: require connection or redirect
  function guard({ redirectTo='loginpage.html' } = {}){
    if(isConnected()) return true;
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.href = `${redirectTo}?next=${next}`;
    return false;
  }

let _balTimer;
async function fetchBalanceThrottled(pubkey){
  return new Promise(res=>{
    clearTimeout(_balTimer);
    _balTimer = setTimeout(async ()=>{
      res(await fetchBalance(pubkey));
    }, 350);  // small debounce
  });
}


  // Init (restore remembered key; do not force-connect)
  (async function init(){
    STATE.provider = getPhantomProvider();
    const remembered = load();
    if(remembered){
      // best-effort: try to show balance without forcing the connect modal
      STATE.pubkey = remembered;
      STATE.balance = await fetchBalance(remembered);
    }
    ui();
  })();

// ===== Handle return from Phantom deep link (MVP) =====
(function nxHandleCallback(){
  const h = location.hash || '';
  if (h.includes('phantom-callback')){
    // For a hardened flow you’d parse/verify state or session here.
    // MVP: just show a hint & clear the hash so refreshes don’t loop.
    console.log('Returned from Phantom connect.');
    history.replaceState(null, '', location.pathname + location.search);
    // If the wallet injected after return (in-app browser cases), you can try a trusted connect:
    try{ getPhantomProvider()?.connect?.({ onlyIfTrusted:true }); }catch{}
  }
})();

  
  // Public API
  window.NX = window.NX || {};
 window.NXWallet = {
  connect, disconnect,
  isConnected, isInstalled,
  getAddress, getBalance,
  refreshBalance,   // <--- add here
  guard,
    openMenu: openWalletMenu
};

})();


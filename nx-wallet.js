btn.innerHTML = `<i data-lucide="wallet" class="w-3 h-3 mr-2"></i> Connect Wallet`;
btn.onclick = openWalletMenu;
}
try{ window.lucide?.createIcons?.(); }catch{}
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

  function shorten(pk){ if(!pk) return ''; return pk.slice(0,4)+'…'+pk.slice(-4); }
  function save(pk){ try{ localStorage.setItem(LKEY, JSON.stringify({ pk })); }catch{} }
  function load(){ try{ return JSON.parse(localStorage.getItem(LKEY)||'{}').pk||null; }catch{return null} }
  function clear(){ try{ localStorage.removeItem(LKEY); }catch{} }

  async function fetchBalance(pubkey){
    try{
      const url = 'https://api.mainnet-beta.solana.com'; // swap to your RPC anytime
      const connection = new solanaWeb3.Connection(url, 'confirmed');
      STATE.conn = connection;
      const lam = await connection.getBalance(new solanaWeb3.PublicKey(pubkey));
      return lam / solanaWeb3.LAMPORTS_PER_SOL;
    }catch{ return null; }
  }

  async function connect({ remember=true } = {}){
    const prov = getPhantomProvider();
    if(!prov) throw new Error('Phantom not injected. Use HTTPS/localhost or enable access for file URLs.');

    // nice-to-have listeners
    prov.on?.('disconnect', ()=>{ STATE.pubkey=null; STATE.balance=null; clear(); ui(); });
    prov.on?.('accountChanged', async (pub)=>{
      STATE.pubkey = pub?.toString?.() || null;
      STATE.balance = STATE.pubkey ? await fetchBalance(STATE.pubkey) : null;
      ui();
    });

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
  }

  function isConnected(){ return !!STATE.pubkey; }
  function isInstalled(){ return !!getPhantomProvider(); }
  function getAddress(){ return STATE.pubkey; }
  function getBalance(){ return STATE.balance; }

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
  function guard({ redirectTo='login.html' } = {}){
    if(isConnected()) return true;
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.href = `${redirectTo}?next=${next}`;
    return false;
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

  // Public API
  window.NX = window.NX || {};
  window.NX.wallet = { connect, disconnect, isConnected, isInstalled, getAddress, getBalance, guard };
})();

</script>

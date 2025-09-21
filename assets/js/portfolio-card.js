// assets/js/portfolio-card.js
(() => {
  // ---------- find a place to mount ----------
  function findHost() {
    // If you manually added a mount, prefer it
    const manual = document.getElementById('nx-portfolio-card');
    if (manual) return manual;

    // Common selectors for your layout — try in order
    const selectors = [
      '[data-panel="portfolio"] .panel-body',
      '.panel.portfolio .panel-body',
      '.portfolio .card-body',
      '.portfolio .panel-body'
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  // If it's not there yet (React still mounting), observe for it
  function whenHostReady(cb) {
    const hostNow = findHost();
    if (hostNow) return cb(hostNow);

    const root = document.getElementById('root') || document.body;
    const obs = new MutationObserver(() => {
      const hostLater = findHost();
      if (hostLater) { obs.disconnect(); cb(hostLater); }
    });
    obs.observe(root, { childList: true, subtree: true });

    // safety: give up after 6s and mount after #root
    setTimeout(() => {
      try { obs.disconnect(); } catch {}
      const fallback = document.createElement('div');
      (document.getElementById('root') || document.body).after(fallback);
      cb(fallback);
      console.warn('[NX] portfolio-card mounted at fallback location');
    }, 6000);
  }

  // ---------- helpers ----------
  const fmtUsd = (n)=> n==null ? "—" : "$" + Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
  const fmtSol = (n)=> n==null ? "—" : Number(n).toLocaleString(undefined,{maximumFractionDigits:4});
  const short  = (s)=> s ? s.slice(0,4) + "…" + s.slice(-4) : "—";
  const RPC    = (typeof window.NX_RPC === 'string' && window.NX_RPC.trim())
              || (typeof localStorage!=='undefined' && localStorage.getItem('NX_RPC'))
              || 'https://api.mainnet-beta.solana.com';

  async function readSolAndUsd(pubkey){
    const conn = new solanaWeb3.Connection(RPC,'confirmed');
    const lam  = await conn.getBalance(pubkey);
    const sol  = lam / solanaWeb3.LAMPORTS_PER_SOL;
    let price = 0;
    try {
      const r = await fetch('https://price.jup.ag/v6/price?ids=SOL');
      const j = await r.json();
      price = j?.data?.SOL?.price || 0;
    } catch {}
    return { sol, usd: sol * price };
  }

  function render(host, state){
    const { addr, sol, usd, loading, err } = state || {};

    // Embedded markup (no outer glass)
    host.innerHTML = `
      <div class="mb-3">
      <div class="nx-panel p-3">
</div>

        <div class="flex items-center justify-between">
          <div class="text-[18px] font-extrabold tracking-wide">Portfolio</div>
          <span class="px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider bg-white/10 border border-white/10 text-slate-300">Local</span>
        </div>
        <div class="text-[12px] text-slate-400/80 mt-1">${addr ? short(addr) : 'Not connected'}</div>
      </div>

      <div class="grid grid-cols-12 gap-3">
        <div class="col-span-12 md:col-span-5 rounded-xl bg-white/5 border border-white/10 p-4">
          <div class="text-[11px] uppercase tracking-wider text-slate-400/90 mb-1">Total Value</div>
          <div class="text-[22px] font-bold">${usd==null ? '—' : fmtUsd(usd)}</div>
        </div>

        <div class="col-span-12 md:col-span-4 rounded-xl bg-white/5 border border-white/10 p-4">
          <div class="text-[11px] uppercase tracking-wider text-slate-400/90 mb-1">Unrealized PnL</div>
          <div class="text-[22px] font-bold text-emerald-400">+$0</div>
        </div>

        <div class="col-span-12 md:col-span-3 rounded-xl bg-white/5 border border-white/10 p-4">
          <div class="text-[11px] uppercase tracking-wider text-slate-400/90 mb-1">Available</div>
          <div class="text-[22px] font-bold">
            ${sol==null ? '—' : `${fmtSol(sol)} SOL · ${fmtUsd(usd)}`}
          </div>
        </div>
      </div>
      </div>

      <div class="mt-4 text-[12px] uppercase tracking-wider text-slate-300/90">Positions</div>
      <div class="mt-2 rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400/80 text-[13px]">
        No live positions (mock).
      </div>

      ${err ? `<div class="mt-2 text-[12px] text-rose-400">${err}</div>` : ``}
      <div class="mt-2">
        <button id="nxp-refresh" class="text-[12px] px-3 py-1.5 rounded-md border border-white/10 bg-white/5 hover:bg-white/10"> ${loading ? 'Refreshing…' : 'Refresh'} </button>
      </div>
    `;

    const btn = host.querySelector('#nxp-refresh');
    if (btn) btn.addEventListener('click', refresh);
  }

  async function refresh(){
    const p = window.solana;
    const addr = p?.publicKey ? p.publicKey.toString() : null;
    render(currentHost, { addr, sol:null, usd:null, loading:true });
    if (!addr) { render(currentHost, { addr:null, sol:null, usd:null, loading:false }); return; }
    try {
      const { sol, usd } = await readSolAndUsd(p.publicKey);
      render(currentHost, { addr, sol, usd, loading:false });
    } catch(e){
      console.warn(e);
      render(currentHost, { addr, sol:null, usd:null, loading:false, err: e?.message || String(e) });
    }
  }

  let currentHost = null;

  whenHostReady((host) => {
    currentHost = document.createElement('div'); // mount inside target host
    host.appendChild(currentHost);

    // expose an update hook (wallet connect/disconnect can call this)
    window.NX_refreshPortfolioCard = refresh;

    // initial draw + gentle refresh
    refresh();
    // setInterval(refresh, 30000); // optional
  });
})();


// assets/js/portfolio-card.js
(() => {
  const host = document.getElementById('nx-portfolio-card');
  if (!host) return;

  // ---------- inject card markup ----------
  host.innerHTML = `
  <div class="relative rounded-2xl border border-white/10 bg-[#0b1022]/80 backdrop-blur
              shadow-[inset_0_0_24px_rgba(0,240,255,.15)] p-5 text-slate-200">
    <div class="flex items-center justify-between mb-3">
      <div class="text-[18px] font-extrabold tracking-wide drop-shadow-[0_1px_0_rgba(0,0,0,.5)]">Portfolio</div>
      <span class="px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider
                   bg-white/10 border border-white/10 text-slate-300">Local</span>
    </div>

    <div id="pv-addr" class="text-[12px] text-slate-400/80 mb-2">—</div>

    <div class="grid grid-cols-3 gap-3 mb-4">
      <!-- Total Value -->
      <div class="rounded-xl bg-white/5 border border-white/10 p-3">
        <div class="text-[11px] uppercase tracking-wider text-slate-400/90 mb-1">Total Value</div>
        <div id="pv-total" class="text-[20px] font-bold">$—</div>
      </div>

      <!-- Unrealized PnL -->
      <div class="rounded-xl bg-white/5 border border-white/10 p-3">
        <div class="text-[11px] uppercase tracking-wider text-slate-400/90 mb-1">Unrealized PnL</div>
        <div id="pv-pnl" class="text-[20px] font-bold text-emerald-400">+$0</div>
      </div>

      <!-- Available -->
      <div class="rounded-xl bg-white/5 border border-white/10 p-3">
        <div class="text-[11px] uppercase tracking-wider text-slate-400/90 mb-1">Available</div>
        <div id="pv-available" class="text-[20px] font-bold">—</div>
        <div id="pv-available-usd" class="text-[12px] text-slate-300/80">$0</div>
      </div>
    </div>

    <div class="text-[12px] uppercase tracking-wider text-slate-300/90 mb-2">Positions</div>
    <div id="pv-positions"
         class="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400/80 text-[13px]">
      No live positions (mock).
    </div>
  </div>`;

  // ---------- helpers ----------
  const $ = (id) => host.querySelector('#'+id);
  const short = (s) => (s ? s.slice(0,4)+'…'+s.slice(-4) : '—');
  const fmtUsd = (n)=> n==null ? "—" : "$" + Number(n).toLocaleString(undefined,{maximumFractionDigits:2});
  const fmtSol = (n)=> n==null ? "—" : Number(n).toLocaleString(undefined,{maximumFractionDigits:4});
  const RPC = (typeof window.NX_RPC === 'string' && window.NX_RPC.trim())
           || (typeof localStorage!=='undefined' && localStorage.getItem('NX_RPC'))
           || 'https://api.mainnet-beta.solana.com';

  async function getSolAndUsd(pubkey){
    const conn = new solanaWeb3.Connection(RPC,'confirmed');
    const lam  = await conn.getBalance(pubkey);
    const sol  = lam / solanaWeb3.LAMPORTS_PER_SOL;
    let solUsd = 0;
    try {
      const r = await fetch('https://price.jup.ag/v6/price?ids=SOL');
      const j = await r.json();
      solUsd = j?.data?.SOL?.price || 0;
    } catch {}
    return { sol, usdTotal: sol * solUsd, solUsd };
  }

  function paint({ addr, sol, usdTotal, pnlUsd=0 }){
    const addrEl = $('pv-addr');      if (addrEl) addrEl.textContent = addr ? short(addr) : 'Not connected';
    const totEl  = $('pv-total');     if (totEl)  totEl.textContent  = fmtUsd(usdTotal);

    // Available: "10 SOL · $XXXX"
    const avail  = $('pv-available');
    const availU = $('pv-available-usd');
    if (avail)  avail.textContent  = sol==null ? '—' : `${fmtSol(sol)} SOL`;
    if (availU) availU.textContent = usdTotal==null ? '$0' : fmtUsd(usdTotal);

    // PnL color + text
    const pnlEl  = $('pv-pnl');
    if (pnlEl){
      pnlEl.textContent = (pnlUsd>=0?'+':'-') + fmtUsd(Math.abs(pnlUsd));
      pnlEl.classList.remove('text-emerald-400','text-rose-400');
      pnlEl.classList.add(pnlUsd>=0 ? 'text-emerald-400' : 'text-rose-400');
    }
  }

  async function refresh(){
    const p = window.solana;
    const addr = p?.publicKey ? p.publicKey.toString() : null;
    if (!addr) { paint({ addr:null, sol:null, usdTotal:null }); return; }
    try {
      const { sol, usdTotal } = await getSolAndUsd(p.publicKey);
      paint({ addr, sol, usdTotal });
    } catch(e){ console.warn(e); }
  }

  // Expose so wallet connect/disconnect can trigger repaint
  window.NX_refreshPortfolioCard = refresh;

  // Initial paint
  refresh();
})();

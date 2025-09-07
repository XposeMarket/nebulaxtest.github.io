
/* NebulaX — swap the Chart panel to BTC/ETH/SOL when a major is clicked */
(function nxMajorsChart(){
  if (window.__nxMajorsChart) return; window.__nxMajorsChart = true;

  const frame = document.getElementById('majorChart'); if (!frame) return;

  // Which chain to prefer for each major (stable DEX liquidity)
  const MAP = {
    'BTC/USDC': { base:'BTC', quote:'USDC', chain:'ethereum' },
    'ETH/USDC': { base:'ETH', quote:'USDC', chain:'ethereum' },
    'SOL/USDC': { base:'SOL', quote:'USDC', chain:'solana' },
  };

  async function showChart(label){
    const cfg = MAP[label]; if (!cfg) return;
    const q = `${cfg.base} ${cfg.quote} ${cfg.chain}`;
    try{
      const r = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(q)}`, { cache:'no-store' });
      const j = await r.json();
      const list = Array.isArray(j.pairs) ? j.pairs : [];
      // best match: exact base/quote on the target chain, highest 24h volume
      const U = s => (s||'').toUpperCase();
      const hit = list
        .filter(p => p.chainId===cfg.chain && U(p.baseToken?.symbol)===cfg.base && U(p.quoteToken?.symbol)===cfg.quote)
        .sort((a,b)=> (b.volume?.h24||0) - (a.volume?.h24||0))[0] || null;

      if (hit?.pairAddress){
        frame.src = `https://dexscreener.com/${encodeURIComponent(cfg.chain)}/${encodeURIComponent(hit.pairAddress)}?embed=1&info=0&theme=dark`;
        frame.dataset.addr = hit.pairAddress;
        frame.dataset.mint = hit.baseToken?.address || '';
      } else {
        frame.src = '';
        frame.parentElement.innerHTML = `<div class="text-xs text-zinc-400 p-3">No chart for ${label}</div>`;
      }
    }catch(e){
      console.error('Majors chart load failed', e);
      frame.parentElement.innerHTML = `<div class="text-xs text-zinc-400 p-3">Network error loading ${label}</div>`;
    }
  }

  // Wire sidebar clicks (majors only)
  document.querySelectorAll('[data-major]').forEach(btn=>{
    btn.addEventListener('click', (ev)=>{
      // if your button already has other behavior, keep it; we only add the chart swap
      const label = (btn.getAttribute('data-major')||'').toUpperCase();
      showChart(label);
      // optional: toggle "is-selected" marker
      document.querySelectorAll('[data-major].is-selected').forEach(b=>b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
    });
  });

  // Initial chart = whichever major has .is-selected, else SOL/USDC
  const init = (document.querySelector('[data-major].is-selected')?.getAttribute('data-major') || 'SOL/USDC').toUpperCase();
  showChart(init);
})();

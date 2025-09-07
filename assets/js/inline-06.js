
(function(){
  const input = document.getElementById('header-search');
  if(!input) return;

  function openFromInput(){
    const q = (input.value||'').trim();
    if(!q) return;
    const pair = q.includes('/') ? q.replace(/\s+/g,'').toUpperCase()
                                 : `${q.toUpperCase()}/SOL`;
    NX.goToCoin({ pair });
  }

  // Enter to open
  input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') openFromInput(); });

  // If you have a search button in the header, give it id="search-go"
  document.getElementById('search-go')?.addEventListener('click', openFromInput);

  // Close any header dropdown on outside click / Esc
  const wrap = input.closest('.relative');
  function hideHeaderDD(){
    if(!wrap) return;
    const dd = wrap.querySelector('.cyberpunk-panel, .popover, .search-dd, [data-role="search-dd"]');
    if(dd){ dd.style.display='none'; }
  }
  document.addEventListener('pointerdown', (e)=>{ if(wrap && !wrap.contains(e.target)) hideHeaderDD(); });
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') hideHeaderDD(); });
})();

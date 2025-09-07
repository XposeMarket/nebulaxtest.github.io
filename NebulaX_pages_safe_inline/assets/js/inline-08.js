
/* === NebulaX Core (themes, header hydrate, routing hooks) === */
(function(){
  const UserStore={
    key:'nx_user',
    state:{ wallet:null, theme:'default', pfp:{type:'builtin',url:'/pfp/default.png'} },
    load(){ try{ Object.assign(this.state, JSON.parse(localStorage.getItem(this.key)||'{}')); }catch{} },
    save(){ localStorage.setItem(this.key, JSON.stringify(this.state)); }
  };
  UserStore.load();

  const Theme={
    init(){
      const t = UserStore.state.theme || 'default';
      document.documentElement.setAttribute('data-theme', t);
      const sel = document.getElementById('nx-theme');
      if (sel) sel.value = t;
      sel?.addEventListener('change', (e)=>{
        const v=e.target.value;
        document.documentElement.setAttribute('data-theme', v);
        UserStore.state.theme=v; UserStore.save();
      });
    }
  };

  const Header={
    initActiveTab(){
      const here = location.pathname.replace(/\/+$/,'') || '/NebulaX.html';
      document.querySelectorAll('.nx-tab').forEach(a=>{
        const route = a.getAttribute('data-route');
        if (!route) return;
        if (route===here) a.classList.add('active');
        else a.classList.remove('active');
        a.addEventListener('click',(e)=>{
          // allow normal navigation
        });
      });
    },
    initSearch(){
      const input = document.getElementById('nx-search');
      const btn   = document.getElementById('nx-search-btn');
      if(!input||!btn) return;
      const go = ()=>{
        const q = (input.value||'').trim();
        if(!q) return;
        // Route to coin page convention: /Coinpage-Official.html?query=...
        location.href = `/Coinpage-Official.html?query=${encodeURIComponent(q)}`;
      };
      btn.addEventListener('click', go);
      input.addEventListener('keydown', (e)=>{ if(e.key==='Enter') go(); });
    },
    initPfp(){
      const img = document.getElementById('nx-pfp');
      if(img) img.src = (UserStore.state.pfp?.url)||'/pfp/default.png';
      const btn = document.getElementById('nx-profile');
      btn?.addEventListener('click',()=>{
        // simple MVP: cycle built-ins; later open profile modal
        const choices=['/pfp/default.png','/pfp/nx01.png','/pfp/nx02.png'];
        const idx = Math.max(0, choices.indexOf(UserStore.state.pfp?.url));
        const next = choices[(idx+1)%choices.length];
        UserStore.state.pfp={type:'builtin',url:next}; UserStore.save();
        if(img) img.src=next;
      });
    },
    initStore(){
      const a = document.getElementById('nx-store');
      if(!a) return;
      // keep as a link; if you make a modal later, hydrate here
    },
    initWallet(){
      const w = document.getElementById('nx-wallet');
      w?.addEventListener('click', ()=>{
        // hook your wallet adapter here
        alert('Connect wallet (hook your adapter)');

      });
    },
    mount(){ this.initActiveTab(); this.initSearch(); this.initPfp(); this.initStore(); this.initWallet(); }
  };

  document.addEventListener('DOMContentLoaded', ()=>{
    Theme.init();
    Header.mount();
  });
})();

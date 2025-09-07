/* ===== NebulaX Theme Engine ===== */
;(() => {
  const LKEY = 'nebula_theme_v1';

  // CSS variables each page already uses (see --nx-*)
  const THEMES = {
  default: {                   
    '--nx-cyan':   '#00f0ff',   
    '--nx-dark':   '#0a0d1b',   
    '--nx-dark-2': '#12152a',   
    '--nx-border': '#1e2747', 
    '--nx-text':   '#e0e7ff',  
},


    neon: {
      '--nx-cyan':   '#00e6ff',
      '--nx-dark':   '#0a0d1b',
      '--nx-dark-2': '#12152a',
      '--nx-border': '#1e2747',
      '--nx-text':   '#e0e7ff',
    },
    midnight: {
      '--nx-cyan':   '#6ff3ff',
      '--nx-dark':   '#0b0e1f',
      '--nx-dark-2': '#141836',
      '--nx-border': '#263066',
      '--nx-text':   '#d9e3ff',
    },
    dusk: {
      '--nx-cyan':   '#7deccf',
      '--nx-dark':   '#0f111a',
      '--nx-dark-2': '#171a27',
      '--nx-border': '#2a2f4a',
      '--nx-text':   '#e6e9f5',
    },
    light: {
      '--nx-cyan':   '#0ea5e9',
      '--nx-dark':   '#f6f7fb',
      '--nx-dark-2': '#ffffff',
      '--nx-border': '#dbe2ef',
      '--nx-text':   '#0f172a',
    }
  };

  function applyVars(vars) {
    const root = document.documentElement;
    Object.entries(vars).forEach(([k,v]) => root.style.setProperty(k, v));
  }

  function current() {
    try { return JSON.parse(localStorage.getItem(LKEY))?.name || 'neon'; } catch { return 'neon'; }
  }

  function save(name) {
    localStorage.setItem(LKEY, JSON.stringify({ name, ts: Date.now() }));
  }

  function apply(name = current()) {
    const vars = THEMES[name] || THEMES.neon;
    applyVars(vars);
    document.documentElement.setAttribute('data-theme', name);
    // notify any listeners (optional)
    window.dispatchEvent(new CustomEvent('nebula:theme-applied', { detail: { name } }));
  }

  function set(name) { save(name); apply(name); }

  function init() {
    // 1) On load: pick saved theme (or default)
    apply();

    // 2) Cross-tab/page sync: storage event
    window.addEventListener('storage', (e) => {
      if (e.key === LKEY) apply();
    });

    // 3) Fallback sync when navigating back to a page
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) apply();
    });

    // Expose small API
    window.NX = window.NX || {};
    window.NX.theme = {
      list: () => Object.keys(THEMES),
      get: current,
      set,
      apply, // re-apply if you dynamically load chunks
    };
  }

  init();
})();

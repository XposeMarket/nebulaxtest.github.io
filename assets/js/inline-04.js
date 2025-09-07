
      /* Initialize lucide icons once (prevents per-render flicker) */
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
      }
    
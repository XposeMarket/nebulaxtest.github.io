
  // initialize wallet UI once DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    if (window.NX && window.NX.walletInit) {
      window.NX.walletInit();
    }
  });

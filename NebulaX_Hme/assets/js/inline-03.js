
  // TEST: hard-wire the ETH pair you sent
  (function(){
    function setChart(){
      const f = document.getElementById('dsChart');
      if(!f) return; // Chart card not mounted yet
      f.src = 'https://dexscreener.com/ethereum/0x00b9edc1583bf6ef09ff3a09f6c23ecb57fd7d0bb75625717ec81eed181e22d7?embed=1&info=0&theme=dark';
    }
    // try immediately and after React mount
    setChart();
    window.addEventListener('load', setChart);
  })();

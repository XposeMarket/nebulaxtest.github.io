# Jupiter V6 Integration - Implementation Guide

## 🎯 What This Solves

Your Jupiter integration is **partially working but fragmented**. This guide provides:
1. ✅ A universal swap engine that works on ALL pages
2. ✅ Proper quote handling with Jupiter V6 API
3. ✅ Trade history tracking in localStorage
4. ✅ Real Buy/Sell stats (Bought, Sold, PnL)
5. ✅ Easy integration into any page

---

## 📁 File Structure

```
NebulaX-Dev/
├── assets/
│   └── jupiter-swap-engine.js ✅ NEW - Universal swap engine
├── Coinpage-Official.html ⚠️ NEEDS UPDATE
├── Arcadegamepanel.html ⚠️ NEEDS UPDATE
└── nebula_x_store_official.html ⚠️ NEEDS UPDATE
```

---

## 🚀 Step 1: Add Engine to All Trading Pages

### For Coinpage-Official.html

**Add this RIGHT AFTER the Solana Web3.js script:**

```html
<!-- Solana Web3.js -->
<script src="https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js"></script>

<!-- Jupiter Swap Engine - ADD THIS -->
<script src="assets/jupiter-swap-engine.js"></script>
```

### For Arcadegamepanel.html

```html
<script src="https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js"></script>
<script src="assets/jupiter-swap-engine.js"></script>
```

### For nebula_x_store_official.html

```html
<script src="https://unpkg.com/@solana/web3.js@1.95.3/lib/index.iife.min.js"></script>
<script src="assets/jupiter-swap-engine.js"></script>
```

---

## 🔧 Step 2: Remove Old Jupiter Code

### In Coinpage-Official.html

**FIND this section (around line 1000+):**
```html
<!-- === Jupiter Ultra V3 Swap Integration === -->
<script>
(async function(){
  // Old Jupiter code here...
})();
</script>
```

**REPLACE it with:**
```html
<!-- === Jupiter V6 Swap Integration === -->
<script>
(function() {
  // Get DOM elements
  const amtInput = document.getElementById('amt');
  const outputDisplay = document.getElementById('output-display');
  const outputAmount = document.getElementById('output-amount');
  const priceImpact = document.getElementById('price-impact');
  const submitBtn = document.getElementById('submit-order');
  const buyBtn = document.getElementById('buy-btn');
  const sellBtn = document.getElementById('sell-btn');
  const amtLabel = document.getElementById('amt-label');
  
  // Get token info
  function getTokenInfo() {
    const qp = new URLSearchParams(location.search);
    const mint = qp.get('mint') || '';
    const base = window.NX?.base || 'TOKEN';
    const price = window.NX?.coinMarketData?.price || 0;
    
    return { mint, base, price };
  }
  
  // Handle amount input changes
  amtInput?.addEventListener('input', () => {
    const { mint, base } = getTokenInfo();
    
    JupiterSwapEngine.handleAmountChange({
      amountInput: amtInput,
      outputElement: outputAmount,
      impactElement: priceImpact,
      displayElement: outputDisplay,
      tokenMint: mint,
      tokenSymbol: base
    });
  });
  
  // Buy button
  buyBtn?.addEventListener('click', () => {
    JupiterSwapEngine.setBuyMode(true);
    const { base } = getTokenInfo();
    submitBtn.textContent = `Buy ${base}`;
    amtLabel.textContent = 'Amount (SOL)';
    amtInput.value = '';
    outputDisplay.classList.add('hidden');
  });
  
  // Sell button
  sellBtn?.addEventListener('click', () => {
    JupiterSwapEngine.setBuyMode(false);
    const { base } = getTokenInfo();
    submitBtn.textContent = `Sell ${base}`;
    amtLabel.textContent = `Amount (${base})`;
    amtInput.value = '';
    outputDisplay.classList.add('hidden');
  });
  
  // Submit button - execute swap
  submitBtn?.addEventListener('click', async () => {
    if (JupiterSwapEngine.isSwapping()) return;
    
    const { mint, base, price } = getTokenInfo();
    
    submitBtn.disabled = true;
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Swapping...';
    
    try {
      const result = await JupiterSwapEngine.executeSwap({
        tokenMint: mint,
        tokenSymbol: base,
        price: price
      });
      
      if (result.success) {
        // Clear inputs
        amtInput.value = '';
        outputDisplay.classList.add('hidden');
        
        // Show success
        alert(`Swap successful!\\n\\nTxID: ${result.txid.slice(0, 8)}...${result.txid.slice(-8)}\\n\\nView on Solscan: ${result.solscanUrl}`);
      } else {
        alert(`Swap failed: ${result.error}`);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
  
  // Listen for swap success to refresh stats
  window.addEventListener('nebulax:swap:success', () => {
    // Refresh holdings and stats
    if (typeof updateHoldings === 'function') {
      setTimeout(updateHoldings, 1000);
    }
  });
  
  console.log('[Coinpage] Jupiter V6 integration active');
})();
</script>
```

---

## 📊 Step 3: Update Stats Display

**FIND the Holdings system script (around line 1400+):**

```html
<!-- === Token Holdings & Stats Display === -->
<script>
(async function(){
  // ... existing holdings code ...
  
  // ADD THIS at the end, before closing })():
  
  // Update stats from trade history
  function updateStatsFromHistory() {
    const mint = getCurrentMint();
    if (!mint || !window.NXWallet?.isConnected()) return;
    
    const wallet = window.NXWallet.getAddress();
    if (!wallet) return;
    
    const stats = JupiterSwapEngine.calculateStats(mint, wallet);
    
    // Get SOL price for USD conversion
    const solPrice = window.NX?.solPrice || 200; // Fallback
    
    if (statBought) {
      statBought.textContent = JupiterSwapEngine.formatUSD(stats.solSpent * solPrice);
    }
    
    if (statSold) {
      statSold.textContent = JupiterSwapEngine.formatUSD(stats.solReceived * solPrice);
    }
    
    if (statPnl) {
      const pnlUSD = stats.realizedPnL * solPrice;
      const pnlColor = stats.realizedPnL >= 0 ? 'text-emerald-400' : 'text-rose-400';
      statPnl.innerHTML = `${JupiterSwapEngine.formatUSD(Math.abs(pnlUSD))} <span class="${pnlColor}">(${stats.realizedPnL >= 0 ? '+' : ''}${stats.realizedPnLPct.toFixed(2)}%)</span>`;
      statPnl.className = pnlColor;
    }
  }
  
  // Call on load and after swaps
  updateStatsFromHistory();
  window.addEventListener('nebulax:swap:success', () => {
    setTimeout(updateStatsFromHistory, 1000);
  });
  
})();
</script>
```

---

## 🎮 Step 4: Game Panel Integration

For `Arcadegamepanel.html`, add similar integration:

```html
<script src="assets/jupiter-swap-engine.js"></script>

<script>
(function() {
  const NEBX_MINT = 'YOUR_NEBX_TOKEN_MINT_HERE'; // Replace with actual NEBX mint
  
  // Buy NEBX button handler
  document.getElementById('buy-nebx-btn')?.addEventListener('click', async () => {
    const amount = document.getElementById('nebx-amount')?.value;
    if (!amount) return alert('Enter amount');
    
    // Set to buy mode
    JupiterSwapEngine.setBuyMode(true);
    
    // Trigger quote fetch
    await JupiterSwapEngine.handleAmountChange({
      amountInput: { value: amount },
      tokenMint: NEBX_MINT,
      tokenSymbol: 'NEBX'
    });
    
    // Execute swap after quote loads
    setTimeout(async () => {
      const result = await JupiterSwapEngine.executeSwap({
        tokenMint: NEBX_MINT,
        tokenSymbol: 'NEBX',
        price: 0 // Get from API if available
      });
      
      if (result.success) {
        alert('NEBX purchase successful! ' + result.solscanUrl);
      } else {
        alert('Purchase failed: ' + result.error);
      }
    }, 1000);
  });
})();
</script>
```

---

## 🛍️ Step 5: Store Integration

For `nebula_x_store_official.html`:

```html
<script src="assets/jupiter-swap-engine.js"></script>

<script>
(function() {
  const NEBX_MINT = 'YOUR_NEBX_TOKEN_MINT_HERE';
  
  // Purchase theme/item with NEBX
  async function purchaseWithNEBX(itemPrice) {
    // Sell SOL for NEBX first (if user doesn't have enough NEBX)
    JupiterSwapEngine.setBuyMode(true); // Buy NEBX with SOL
    
    await JupiterSwapEngine.handleAmountChange({
      amountInput: { value: calculateSolNeeded(itemPrice) },
      tokenMint: NEBX_MINT,
      tokenSymbol: 'NEBX'
    });
    
    setTimeout(async () => {
      const result = await JupiterSwapEngine.executeSwap({
        tokenMint: NEBX_MINT,
        tokenSymbol: 'NEBX',
        price: 0
      });
      
      if (result.success) {
        // Then process item purchase
        processItemPurchase(itemPrice);
      }
    }, 1000);
  }
  
  function calculateSolNeeded(nebxAmount) {
    // Calculate how much SOL is needed to buy X NEBX
    const nebxPrice = 0.001; // Get from API
    return (nebxAmount * nebxPrice).toFixed(4);
  }
  
  function processItemPurchase(price) {
    // Your existing purchase logic
    alert(`Item purchased for ${price} NEBX!`);
  }
})();
</script>
```

---

## ✅ Verification Checklist

After implementing, test these scenarios:

### Coinpage
- [ ] Enter SOL amount → See quote update
- [ ] Click Buy → Wallet popup → Confirm → Success alert
- [ ] Switch to Sell → Enter token amount → Get quote
- [ ] Execute sell → Transaction confirms
- [ ] Check stats: Bought/Sold/PnL update correctly

### Game Panel
- [ ] Click "Buy NEBX" → Enter amount → Transaction completes
- [ ] NEBX balance updates after purchase

### Store
- [ ] Purchase item → Swap SOL for NEBX → Item unlocked
- [ ] NEBX balance deducted correctly

---

## 🐛 Troubleshooting

### "Swap already in progress"
- Wait 5-10 seconds, transaction is processing

### "No quote available"
- Check token has liquidity on Jupiter
- Verify mint address is correct
- Check console for API errors

### "Wallet not connected"
- Click wallet button, approve connection

### Stats not updating
- Check localStorage: `nebulax_trades`
- Clear and retry: `localStorage.removeItem('nebulax_trades')`

### Quote taking too long
- Reduce `QUOTE_DEBOUNCE_MS` in `jupiter-swap-engine.js` (line 11)
- Check network connection

---

## 📝 Key Features

### ✅ What Works Now
1. Real-time quotes via Jupiter V6
2. Buy/Sell swaps with proper transaction handling
3. Trade history in localStorage
4. Bought/Sold/PnL stats calculation
5. Price impact warnings
6. Wallet balance auto-refresh

### ❌ Still Not Implemented
1. Limit orders (requires Jupiter Limit Order API)
2. TP/SL (requires backend monitoring)
3. MEV protection toggle (Jupiter auto-handles this)
4. Custom fee presets (Jupiter calculates dynamically)

---

## 🎓 Next Steps

1. **Deploy NEBX Token** on Solana mainnet
2. **Add NEBX mint address** to Game Panel and Store
3. **Test all flows** on devnet first
4. **Add slippage settings UI** (optional)
5. **Implement limit orders** (future enhancement)

---

## 📚 Resources

- Jupiter V6 Docs: https://station.jup.ag/docs/apis/swap-api
- Solana Web3.js: https://solana-labs.github.io/solana-web3.js/
- SPL Token: https://spl.solana.com/token

---

**Status:** ✅ READY TO IMPLEMENT

Copy the code blocks above into your files and test thoroughly!

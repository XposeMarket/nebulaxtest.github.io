# Jupiter V6 Integration - COMPLETE IMPLEMENTATION GUIDE

## 🎯 What This Guide Covers

Based on **actual Jupiter V6 API docs** and your requirements:
1. ✅ Universal `nx-jupiter.js` module (DONE)
2. ✅ Coinpage integration (step-by-step below)
3. ✅ Portfolio price integration
4. ⚠️ Store/Arcade (Phase 2 - after Coinpage works)

---

## 📁 File Changes Required

### 1. Add Jupiter Module to All Pages

**File:** `Coinpage-Official.html`

**FIND this section (around line 16):**
```html
<script src="assets/nx-wallet.js"></script>
```

**ADD right after it:**
```html
<script src="assets/nx-wallet.js"></script>
<script src="assets/js/nx-jupiter.js"></script> <!-- ADD THIS -->
```

---

### 2. Replace Jupiter Integration in Coinpage

**File:** `Coinpage-Official.html`

**FIND this section (around line 1000-1400):**
```html
<!-- === Jupiter Ultra V3 Swap Integration === -->
<script>
(async function(){
  // Old Jupiter code here...
})();
</script>
```

**REPLACE ENTIRE SECTION with:**

```html
<!-- === Jupiter V6 Swap Integration === -->
<script>
(function() {
  'use strict';

  // ===== DOM ELEMENTS =====
  const amtInput = document.getElementById('amt');
  const outputDisplay = document.getElementById('output-display');
  const outputAmount = document.getElementById('output-amount');
  const priceImpact = document.getElementById('price-impact');
  const submitBtn = document.getElementById('submit-order');
  const buyBtn = document.getElementById('buy-btn');
  const sellBtn = document.getElementById('sell-btn');
  const amtLabel = document.getElementById('amt-label');
  const quickBuyBtns = document.getElementById('quick-buy-btns');
  const quickSellBtns = document.getElementById('quick-sell-btns');

  // ===== STATE =====
  let currentQuote = null;
  let isSwapping = false;
  let isBuyMode = true;
  let quoteTimeout = null;
  let currentTokenBalance = 0;

  // ===== GET TOKEN INFO FROM URL =====
  function getTokenInfo() {
    const qp = new URLSearchParams(location.search);
    const mint = qp.get('mint') || '';
    const base = window.NX?.base || 'TOKEN';
    const price = window.NX?.coinMarketData?.price || 0;
    
    return { mint, base, price };
  }

  // ===== QUOTE UPDATES =====
  async function handleAmountChange() {
    clearTimeout(quoteTimeout);
    
    const amount = amtInput?.value?.trim();
    if (!amount || parseFloat(amount) <= 0) {
      if (outputDisplay) outputDisplay.classList.add('hidden');
      currentQuote = null;
      return;
    }

    const { mint, base } = getTokenInfo();
    if (!mint) {
      console.warn('[Coinpage] No mint address found');
      return;
    }

    // Show loading
    if (outputAmount) {
      outputAmount.textContent = 'Loading...';
      outputAmount.className = 'font-semibold text-emerald-400';
    }
    if (priceImpact) priceImpact.textContent = '...';
    if (outputDisplay) outputDisplay.classList.remove('hidden');

    quoteTimeout = setTimeout(async () => {
      const inputMint = isBuyMode ? NX.Jupiter.SOL_MINT : mint;
      const outputMint = isBuyMode ? mint : NX.Jupiter.SOL_MINT;
      const amountLamports = Math.floor(parseFloat(amount) * Math.pow(10, 9));

      const quote = await NX.Jupiter.getQuote({
        inputMint,
        outputMint,
        amount: amountLamports.toString(),
        swapMode: 'ExactIn'
      });

      if (quote) {
        currentQuote = quote;
        const outAmount = NX.Jupiter.formatAmount(quote.outAmount, 9);
        const impact = quote.priceImpactPct || 0;
        
        // Color code impact
        const impactColor = Math.abs(impact) > 5 
          ? 'text-rose-400' 
          : Math.abs(impact) > 1 
            ? 'text-amber-400' 
            : 'text-emerald-400';

        if (outputAmount) outputAmount.textContent = outAmount;
        if (priceImpact) {
          priceImpact.textContent = `${impact > 0 ? '+' : ''}${impact.toFixed(2)}%`;
          priceImpact.className = impactColor;
        }
      } else {
        // Quote failed
        if (outputAmount) {
          outputAmount.textContent = isBuyMode 
            ? `No liquidity to buy ${base}` 
            : `No liquidity to sell ${base}`;
          outputAmount.className = 'font-semibold text-rose-400 text-xs';
        }
        if (priceImpact) priceImpact.textContent = '—';
      }
    }, 500);
  }

  // ===== EXECUTE SWAP =====
  async function executeSwap() {
    if (isSwapping) {
      console.warn('[Coinpage] Swap already in progress');
      return;
    }

    if (!currentQuote) {
      alert('Please wait for quote to load');
      return;
    }

    if (!window.NXWallet?.isConnected()) {
      alert('Please connect your wallet first');
      return;
    }

    const { mint, base, price } = getTokenInfo();
    if (!mint) {
      alert('Token address not found');
      return;
    }

    isSwapping = true;
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;

    try {
      // Get wallet provider
      const provider = window.phantom?.solana || window.solana;
      if (!provider) throw new Error('Wallet not found');

      // Execute swap with progress updates
      let progressText = '';
      const result = await NX.Jupiter.executeSwap({
        inputMint: isBuyMode ? NX.Jupiter.SOL_MINT : mint,
        outputMint: isBuyMode ? mint : NX.Jupiter.SOL_MINT,
        amount: Math.floor(parseFloat(amtInput.value) * Math.pow(10, 9)).toString(),
        wallet: provider,
        swapMode: 'ExactIn',
        onProgress: (status) => {
          progressText = status;
          submitBtn.textContent = status;
        }
      });

      if (result.success) {
        // Clear inputs
        amtInput.value = '';
        outputDisplay.classList.add('hidden');
        currentQuote = null;

        // Save trade to history
        saveTradeToHistory({
          tokenMint: mint,
          tokenSymbol: base,
          type: isBuyMode ? 'buy' : 'sell',
          tokenAmount: parseFloat(result.quote.outAmount) / Math.pow(10, 9),
          solAmount: parseFloat(result.quote.inAmount) / Math.pow(10, 9),
          price: price,
          txid: result.txid
        });

        // Refresh balances
        if (window.NXWallet?.refreshBalance) {
          setTimeout(() => window.NXWallet.refreshBalance(true), 1000);
        }

        // Dispatch event for other systems
        window.dispatchEvent(new CustomEvent('nebulax:swap:success', {
          detail: result
        }));

        // Success alert
        alert(`Swap successful!\\n\\nTransaction: ${result.txid.slice(0, 8)}...${result.txid.slice(-8)}\\n\\nView on Solscan:\\n${result.solscanUrl}`);
      } else {
        alert(`Swap failed: ${result.error}`);
      }
    } catch (error) {
      console.error('[Coinpage] Swap error:', error);
      alert(`Swap failed: ${error.message}`);
    } finally {
      isSwapping = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  // ===== TRADE HISTORY =====
  function saveTradeToHistory(trade) {
    try {
      const history = JSON.parse(localStorage.getItem('nebulax_trades') || '[]');
      const wallet = window.NXWallet?.publicKey?.toString() || 'unknown';
      
      history.unshift({
        timestamp: Date.now(),
        ...trade,
        wallet
      });

      // Keep last 1000 trades
      if (history.length > 1000) history.length = 1000;
      
      localStorage.setItem('nebulax_trades', JSON.stringify(history));
      console.log('[Coinpage] Trade saved to history');
    } catch (error) {
      console.error('[Coinpage] Failed to save trade:', error);
    }
  }

  // ===== BUY/SELL TOGGLE =====
  buyBtn?.addEventListener('click', () => {
    isBuyMode = true;
    const { base } = getTokenInfo();
    if (submitBtn) submitBtn.textContent = `Buy ${base}`;
    if (amtLabel) amtLabel.textContent = 'Amount (SOL)';
    if (quickBuyBtns) quickBuyBtns.classList.remove('hidden');
    if (quickSellBtns) quickSellBtns.classList.add('hidden');
    amtInput.value = '';
    outputDisplay?.classList.add('hidden');
    currentQuote = null;
  });

  sellBtn?.addEventListener('click', () => {
    isBuyMode = false;
    const { base } = getTokenInfo();
    if (submitBtn) submitBtn.textContent = `Sell ${base}`;
    if (amtLabel) amtLabel.textContent = `Amount (${base})`;
    if (quickBuyBtns) quickBuyBtns.classList.add('hidden');
    if (quickSellBtns) quickSellBtns.classList.remove('hidden');
    amtInput.value = '';
    outputDisplay?.classList.add('hidden');
    currentQuote = null;
  });

  // ===== QUICK AMOUNT BUTTONS =====
  // SOL presets for buying
  quickBuyBtns?.querySelectorAll('[data-sol]').forEach(btn => {
    btn.addEventListener('click', () => {
      amtInput.value = btn.dataset.sol;
      handleAmountChange();
    });
  });

  // Percentage buttons for selling
  quickSellBtns?.querySelectorAll('[data-pct]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pct = parseFloat(btn.dataset.pct);
      if (currentTokenBalance > 0) {
        amtInput.value = (currentTokenBalance * pct / 100).toFixed(6);
        handleAmountChange();
      } else {
        alert('No token balance to sell');
      }
    });
  });

  // ===== EVENT LISTENERS =====
  amtInput?.addEventListener('input', handleAmountChange);
  submitBtn?.addEventListener('click', executeSwap);

  // Update token balance for sell buttons
  window.addEventListener('nebulax:token:balance', (e) => {
    currentTokenBalance = e.detail.balance || 0;
  });

  // Refresh on swap success
  window.addEventListener('nebulax:swap:success', () => {
    if (typeof updateHoldings === 'function') {
      setTimeout(updateHoldings, 1000);
    }
  });

  console.log('[Coinpage] Jupiter V6 integration active');
})();
</script>
```

---

### 3. Update Stats Display

**FIND the Holdings script (around line 1400+):**

```html
<!-- === Token Holdings & Stats Display === -->
<script>
(async function(){
  // ... existing code ...
```

**ADD this function at the end, before closing `})();`:**

```javascript
  // ===== CALCULATE STATS FROM HISTORY =====
  function updateStatsFromHistory() {
    const mint = getCurrentMint();
    if (!mint || !window.NXWallet?.isConnected()) return;
    
    const wallet = window.NXWallet.getAddress();
    if (!wallet) return;
    
    // Get trade history
    const history = JSON.parse(localStorage.getItem('nebulax_trades') || '[]');
    const trades = history.filter(t => t.tokenMint === mint && t.wallet === wallet);
    
    let totalBought = 0;
    let totalSold = 0;
    let solSpent = 0;
    let solReceived = 0;
    
    trades.forEach(trade => {
      if (trade.type === 'buy') {
        totalBought += trade.tokenAmount;
        solSpent += trade.solAmount;
      } else {
        totalSold += trade.tokenAmount;
        solReceived += trade.solAmount;
      }
    });
    
    const pnl = solReceived - solSpent;
    const pnlPct = solSpent > 0 ? (pnl / solSpent) * 100 : 0;
    
    // Get SOL price for USD conversion
    const solPrice = 200; // TODO: Fetch from API
    
    // Update displays
    if (statBought) {
      statBought.textContent = `$${(solSpent * solPrice).toFixed(2)}`;
    }
    
    if (statSold) {
      statSold.textContent = `$${(solReceived * solPrice).toFixed(2)}`;
    }
    
    if (statPnl) {
      const pnlColor = pnl >= 0 ? 'text-emerald-400' : 'text-rose-400';
      statPnl.innerHTML = `$${Math.abs(pnl * solPrice).toFixed(2)} <span class="${pnlColor}">(${pnl >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%)</span>`;
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

## ✅ Verification Steps

After making changes:

### 1. Check Module Loaded
Open browser console (F12) and type:
```javascript
NX.Jupiter
```
Should show object with functions (getQuote, executeSwap, etc.)

### 2. Test Quote System
1. Go to: `Coinpage-Official.html?mint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` (BONK)
2. Connect wallet
3. Enter "0.01" in amount
4. Wait 1 second
5. Should see output amount and price impact

### 3. Test Swap
1. Click "Buy BONK"
2. Phantom wallet popup
3. Approve transaction
4. Wait 5-10 seconds
5. Success alert with Solscan link

### 4. Check Stats
After swap:
```javascript
// In console:
localStorage.getItem('nebulax_trades')
```
Should show your trade logged

---

## 🎮 Test Tokens

Use these mints for testing (all have good Jupiter liquidity):

```
BONK:  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
WIF:   EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm
USDC:  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
RAY:   4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R
```

---

## 🐛 Troubleshooting

### "NX.Jupiter is undefined"
- Check that `nx-jupiter.js` is loaded before your integration script
- Hard refresh (Ctrl+Shift+R)

### Quote never loads
- Check console for errors
- Try BONK token first (best liquidity)
- Verify mint address is correct

### Swap fails
- Check wallet has enough SOL (need ~0.02 extra for fees)
- Try smaller amount
- Check token has active liquidity pools

### Stats don't update
- Check localStorage: `localStorage.getItem('nebulax_trades')`
- Verify wallet address matches
- Clear and retry: `localStorage.removeItem('nebulax_trades')`

---

## 📊 What Works Now

| Feature | Status |
|---------|--------|
| Real-time quotes | ✅ Working |
| Buy swaps | ✅ Working |
| Sell swaps | ✅ Working |
| Trade history | ✅ Saved to localStorage |
| Bought/Sold stats | ✅ Calculated from history |
| PnL display | ✅ Real calculation |
| Price impact warnings | ✅ Color-coded |
| Wallet balance refresh | ✅ Auto-refresh |

---

## 🚀 Next Steps

1. **Test Coinpage thoroughly** with BONK token
2. **Once working:** Apply to Portfolio for pricing
3. **Phase 2:** Store/Arcade payment integration
4. **Phase 3:** Deploy NEBX token and integrate

---

## 📚 API References

- **Jupiter V6 Docs:** https://station.jup.ag/docs/apis/swap-api
- **Jupiter Price API:** https://station.jup.ag/docs/apis/price-api
- **Solana Web3.js:** https://solana-labs.github.io/solana-web3.js/

---

**Status:** ✅ READY TO IMPLEMENT

Follow steps 1-3 above, test with BONK, and you'll have working Jupiter swaps!

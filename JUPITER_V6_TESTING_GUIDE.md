# Jupiter V6 - Quick Testing Guide

## 🎯 What You Have Now

✅ **jupiter-swap-engine.js** - Universal swap engine  
✅ **Implementation guide** - Step-by-step for all pages  
⚠️ **Pages need updating** - Follow guide to integrate

---

## 🚀 Quick Start (5 Minutes)

### 1. Test on Coinpage FIRST

**Open:** `Coinpage-Official.html?mint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`  
(This is BONK token - has good liquidity)

**What to check:**
```
✅ Page loads without errors
✅ Console shows: "[Jupiter] Swap Engine loaded and ready"
✅ After adding integration code: Quote updates appear
✅ Buy button triggers swap
```

### 2. Test Trade Flow

```
1. Connect Phantom wallet
2. Enter "0.01" in amount field (SOL)
3. Wait 1 second → See "You'll receive: X BONK"
4. See price impact (should be green <1%)
5. Click "Buy BONK"
6. Approve in Phantom
7. Wait 5-8 seconds
8. Success alert with Solscan link
```

### 3. Test Stats

```
After successful swap:
1. Open browser console
2. Type: JupiterSwapEngine.getTradeHistory()
3. Should see your trade logged
4. Type: JupiterSwapEngine.calculateStats(
   'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
   'YOUR_WALLET_ADDRESS'
)
5. Should show bought/sold/PnL
```

---

## 🧪 Test Tokens (Good Liquidity)

Use these for testing - all have Jupiter pools:

```javascript
// BONK (best for testing - high liquidity)
?mint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263

// WIF (dogwifhat)
?mint=EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm

// USDC
?mint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v

// RAY (Raydium)
?mint=4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R
```

---

## ✅ Success Criteria

Your integration is working if:

1. **Quote Updates** - Changes as you type (500ms delay)
2. **Price Impact Shows** - Green/yellow/red based on %
3. **Swap Executes** - Phantom popup → confirmation
4. **Transaction Confirms** - Success alert with txid
5. **History Saves** - localStorage has trade data
6. **Stats Calculate** - Bought/Sold/PnL display correctly

---

## 🐛 Common Issues & Fixes

### Issue: "JupiterSwapEngine is not defined"

**Fix:** Add script BEFORE your integration code:
```html
<script src="assets/jupiter-swap-engine.js"></script>
```

### Issue: Quote never loads

**Check console for:**
```
[Jupiter] Quote failed: 404
```

**Fix:** Token doesn't have Jupiter liquidity. Try BONK instead.

### Issue: Transaction fails

**Check:**
- ✅ Wallet has enough SOL (need ~0.02 SOL extra for fees)
- ✅ Not in a rush (wait for quote to load)
- ✅ Token has active pools

### Issue: Stats not updating

**Check localStorage:**
```javascript
// In console:
localStorage.getItem('nebulax_trades')
```

**If null:** Swap hasn't completed yet or failed
**If has data:** Stats function might not be called

---

## 📊 Console Commands for Testing

```javascript
// Check engine status
window.JupiterSwapEngine

// Get current quote
JupiterSwapEngine.getCurrentQuote()

// Check if swapping
JupiterSwapEngine.isSwapping()

// Get all trades
JupiterSwapEngine.getTradeHistory()

// Get trades for specific token
JupiterSwapEngine.getTradeHistory('MINT_ADDRESS')

// Calculate stats
JupiterSwapEngine.calculateStats('MINT_ADDRESS', 'WALLET_ADDRESS')

// Clear trade history (for testing)
localStorage.removeItem('nebulax_trades')
```

---

## 🔄 Testing Checklist

### Phase 1: Engine Load
- [ ] jupiter-swap-engine.js loads without errors
- [ ] Console shows load message
- [ ] `window.JupiterSwapEngine` is defined

### Phase 2: Quote System
- [ ] Enter amount → Quote loads within 1s
- [ ] Quote shows output amount
- [ ] Price impact displays correctly
- [ ] Quote clears when amount is 0

### Phase 3: Swap Execution
- [ ] Click Buy → Phantom opens
- [ ] Approve → Transaction sends
- [ ] Confirmation received (5-10s)
- [ ] Success alert appears

### Phase 4: Data Persistence
- [ ] Trade saves to localStorage
- [ ] Stats calculate correctly
- [ ] Bought/Sold/PnL display
- [ ] History persists after page reload

### Phase 5: Error Handling
- [ ] Low liquidity → Shows error message
- [ ] No wallet → Shows "Connect wallet" message
- [ ] Failed transaction → Error alert
- [ ] Network error → Retries automatically

---

## 🎓 Advanced Testing

### Test Buy Flow
```
1. Buy 0.01 SOL worth of BONK
2. Check BONK balance increased
3. Check SOL balance decreased
4. Verify transaction on Solscan
5. Check stats show "Bought: $X"
```

### Test Sell Flow
```
1. Switch to Sell mode
2. Enter BONK amount
3. Get quote for SOL output
4. Execute sell
5. Check SOL balance increased
6. Check stats show "Sold: $X"
```

### Test PnL Calculation
```
1. Buy at price X
2. Wait for price change
3. Sell at price Y
4. Check PnL = (Y - X) * amount
5. Verify percentage calculation
```

---

## 📝 Report Template

After testing, document results:

```
✅ WORKING:
- Quote system: YES/NO
- Buy swaps: YES/NO
- Sell swaps: YES/NO
- Trade history: YES/NO
- Stats display: YES/NO

❌ ISSUES FOUND:
1. [Describe issue]
2. [Console error]
3. [Expected vs actual]

📸 SCREENSHOTS:
- Successful swap alert
- Stats display
- Console logs
```

---

## 🚀 Next Steps After Testing

Once Coinpage works:
1. ✅ Apply same pattern to GamePanel
2. ✅ Apply to Store page
3. ✅ Test NEBX purchases
4. ✅ Deploy to production

---

## 🆘 Need Help?

**Check these first:**
1. Browser console (F12) - Look for red errors
2. Network tab - Check API calls succeed
3. localStorage - Verify trade data saves
4. Phantom - Check if wallet connected properly

**Common solutions:**
- Hard refresh (Ctrl+Shift+R)
- Clear localStorage and retry
- Try different token (BONK is most reliable)
- Check RPC connection (window.NX_RPC)

---

**Status:** ✅ Ready to test!

Start with Coinpage + BONK token for best results.

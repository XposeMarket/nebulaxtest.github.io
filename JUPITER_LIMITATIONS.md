# What DOESN'T Work - Jupiter Integration Limitations

## Summary of Non-Working Features

Your coin page now has **real Jupiter swaps** working, but some UI features don't connect to actual functionality because they require backend systems or different APIs.

---

## 1. ❌ LIMIT ORDERS

### What You See:
- "Market" button (works)
- "Limit" button (doesn't do anything different)

### Why It Doesn't Work:
Jupiter's main Swap API only supports **market orders** (execute immediately at current price). Limit orders require the separate **Jupiter Limit Order API**.

### What Would Be Needed:
```javascript
// Different endpoint entirely
POST https://api.jup.ag/limit/v1/createOrder

// Requires:
- Order creation (with target price)
- Order book storage (on-chain state)
- Order monitoring (waiting for price to hit)
- Order cancellation UI
- Listing open orders
```

### How to Fix:
You'd need to integrate Jupiter's Limit Order API separately - completely different code path than the current market swap integration.

**Docs:** https://station.jup.ag/docs/limit-order/limit-order-api

---

## 2. ❌ TAKE PROFIT / STOP LOSS (TP/SL)

### What You See:
- TP % input field
- SL % input field

### Why It Doesn't Work:
These require **continuous monitoring** of token prices and **automatic execution** when conditions are met. This is a backend service, not a frontend feature.

### What Would Be Needed:
```
Backend Service (Node.js/Python):
1. Store user's TP/SL orders in database
2. Monitor token prices every second via WebSocket
3. When price hits TP or SL:
   - Execute Jupiter swap automatically
   - Notify user
4. Handle user's wallet signing (needs stored keys or delegated authority)
5. Manage order expiration
```

### The Problem:
- Your browser tab closes → monitoring stops
- Can't sign transactions without user present
- Would need server with user's private key (huge security risk)
- Or use delegated signing authority (complex setup)

### How to Fix:
Build a complete backend order management system:
- **Database:** Store open TP/SL orders
- **Price monitor:** WebSocket to track all token prices
- **Execution engine:** Call Jupiter API when conditions met
- **Authentication:** Secure way to sign transactions (like 1inch's Limit Order protocol)

**This is basically building your own trading bot infrastructure.**

---

## 3. ❌ PRESET FEE CONFIGURATION

### What You See:
- Preset 1, 2, 3 buttons
- Fee (SOL) input field
- Save/Reset buttons

### Why It Doesn't Work:
Jupiter calculates fees **dynamically** based on:
- Network congestion (changes every block)
- Swap route complexity (direct swap vs multi-hop)
- Available liquidity (affects slippage)

You can't override Jupiter's fee calculation - it's part of their route optimization.

### What Actually Happens:
Your preset fees are **ignored**. Jupiter charges:
```
Total Fee = Base Fee + Priority Fee + DEX Fees
- Base: ~0.000005 SOL (Solana network)
- Priority: Auto-calculated (faster inclusion)
- DEX: 0.25-1% (varies by route)
```

### How to Fix:
You could:
1. **Remove the fee input** - since it doesn't work
2. **Show Jupiter's calculated fee** after getting quote
3. **Let users adjust priority fee multiplier** (but this is advanced)

**Note:** The preset system CAN control the swap amount, just not fees.

---

## 4. ❌ MEV PROTECTION TOGGLE

### What You See:
- MEV Protection: On/Off button in preset config

### Why It Doesn't Work:
Jupiter automatically uses **Jito MEV protection** when it improves the swap. You can't force it on/off via the API.

### What Actually Happens:
Jupiter internally decides:
- Use Jito bundle when MEV risk is high
- Use standard RPC when MEV risk is low
- Optimize for best user outcome

Your toggle is **ignored**.

### How to Fix:
Remove the toggle - Jupiter handles MEV protection automatically as a "smart default".

---

## 5. ❌ POSITION TRACKING STATS

### What You See:
- Bought: $0
- Sold: $0
- Holding: $0
- PnL: $0 (0%)

### Why It Doesn't Work:
Jupiter only **executes swaps** - it doesn't track your trading history. To show these stats, you'd need to:

1. **Track all past swaps:**
   - Listen to wallet transactions
   - Parse Jupiter program logs
   - Store in database/localStorage
   - Sum up all buys and sells

2. **Calculate current holdings:**
   - Query token account balance
   - Fetch current market price
   - Calculate USD value

3. **Calculate PnL:**
   - Know your entry price (average of all buys)
   - Know current price
   - Calculate: (Current - Entry) / Entry * 100

### What Would Be Needed:
```javascript
// Example structure
const tradeHistory = [
  { type: 'buy', amount: 100, priceUsd: 0.5, timestamp: ... },
  { type: 'buy', amount: 200, priceUsd: 0.6, timestamp: ... },
  { type: 'sell', amount: 150, priceUsd: 0.7, timestamp: ... }
];

// Calculate
const totalBought = 0.5*100 + 0.6*200 = $170
const totalSold = 0.7*150 = $105
const avgEntry = 170 / 300 = $0.567
const currentHolding = 150 tokens
const currentPrice = $0.8
const unrealizedPnL = (0.8 - 0.567) * 150 = $35
const realizedPnL = 105 - (0.567 * 150) = $20
```

### How to Fix:
Build a trade tracking system:
1. Use `connection.onLogs()` to watch wallet transactions
2. Parse Jupiter program instructions
3. Store trades in localStorage or database
4. Calculate stats on page load

---

## 6. ❌ TOKEN INFO METRICS

### What You See (but are placeholders):
- Top 10 H: 0%
- Dev H: 0%
- Snipers H: 0%
- Insiders: 0
- Bundlers: 0
- LP Burned: 0%
- Pro Traders: 0
- Dex Paid: None

### Why It Doesn't Work:
Jupiter doesn't provide **security analysis** data. You'd need to integrate services like:
- **Rugcheck.xyz** - Dev wallet, snipers, bundlers
- **Birdeye/Solscan** - Holder distribution
- **DefinedFi** - Insider tracking
- **Solana-specific analyzers** - LP burn verification

### How to Fix:
Add API calls to security analysis services:
```javascript
// Example
const securityData = await fetch(`https://api.rugcheck.xyz/v1/tokens/${mint}/report`);
// Then populate the UI fields
```

---

## WHAT **DOES** WORK ✅

Just to be clear, these features **ARE working**:

1. ✅ **Buy tokens with SOL** - Real Jupiter swaps
2. ✅ **Sell tokens for SOL** - Reverse swaps work
3. ✅ **Live quotes** - Updates as you type
4. ✅ **Price impact** - Real-time calculation
5. ✅ **Expected output** - Exact amount you'll receive
6. ✅ **Transaction execution** - On-chain confirmed swaps
7. ✅ **Wallet balance updates** - Auto-refresh after swap
8. ✅ **Buy/Sell toggle** - Switches input/output tokens
9. ✅ **Loading states** - Shows progress during swap
10. ✅ **Error handling** - Helpful messages on failure

---

## RECOMMENDATIONS

### Quick Wins (Easy):
1. **Hide non-functional fields** - Remove TP/SL inputs, preset fees, MEV toggle
2. **Add disclaimer** - "Market orders only" near Limit button
3. **Show real fees** - Display Jupiter's calculated fees from quote response
4. **Simplify presets** - Just store amount, remove fee/MEV config

### Medium Effort:
1. **Add Limit Orders** - Integrate Jupiter Limit Order API (separate project)
2. **Track positions** - Store trade history in localStorage
3. **Calculate stats** - Basic PnL using stored trades
4. **Add security data** - Fetch from Rugcheck/Birdeye APIs

### Advanced (Requires Backend):
1. **TP/SL Orders** - Build monitoring service with database
2. **Advanced order types** - DCA, TWAP, conditional orders
3. **Trading bots** - Automated strategies
4. **Portfolio analytics** - Multi-token P&L tracking

---

## BOTTOM LINE

**Your Jupiter integration WORKS for swaps** - the core functionality is solid. The UI just has extra buttons/fields that don't connect to anything because they require either:

- Different APIs (limit orders)
- Backend services (TP/SL monitoring)  
- Additional data sources (security metrics)
- Historical tracking (trade history)

You can either:
1. **Hide the non-working parts** (cleanest UX)
2. **Build the missing systems** (lots of work)
3. **Add coming soon badges** (honest about limitations)

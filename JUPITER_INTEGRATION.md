# Jupiter Swap Integration - Coinpage Official

## ✅ WHAT WORKS

### Real-Time Swaps
- **Buy tokens with SOL** - Enter SOL amount, get live quotes, execute swap
- **Sell tokens for SOL** - Toggle to sell mode, enter token amount, execute swap
- **Live quote updates** - As you type, Jupiter fetches real-time quotes (500ms debounce)
- **Price impact display** - Shows estimated price impact (color-coded: green <1%, amber 1-5%, red >5%)
- **Expected output** - Shows exact amount of tokens you'll receive
- **Transaction confirmation** - Waits for on-chain confirmation and shows Solscan link
- **Wallet balance refresh** - Automatically updates SOL balance after swap

### UI Integration
- **Keeps your existing UI** - All buttons, inputs, and styling remain unchanged
- **Buy/Sell toggle** - Switches between buying token with SOL and selling token for SOL
- **Loading states** - Shows "Loading..." while fetching quotes, "Swapping..." during execution
- **Error handling** - Graceful alerts for failed transactions or connection issues

### Technical Features
- **Auto route optimization** - Jupiter finds best swap routes automatically
- **Dynamic compute units** - Optimizes transaction fees
- **Priority fees** - Uses "auto" mode for faster inclusion
- **Wrap/unwrap SOL** - Automatically handles SOL wrapping when needed
- **Versioned transactions** - Uses Jupiter v6 API with latest transaction format

## ❌ WHAT DOESN'T WORK (Limitations)

### 1. **Take Profit / Stop Loss (TP/SL)**
**Why:** Jupiter only executes immediate market swaps. Conditional orders require:
- A monitoring service that watches price 24/7
- Database to store open TP/SL orders
- Backend to execute when conditions are met

**Workaround:** You'd need to build a separate bot/service that:
1. Monitors token prices continuously
2. Stores user TP/SL settings
3. Executes swaps when price hits target
4. (This is a full backend system, not a frontend feature)

### 2. **Limit Orders**
**Why:** Jupiter's main API is market orders only. They have a separate Limit Order API.

**Workaround:** You can integrate Jupiter Limit Order API separately:
- Different endpoint: `https://jup.ag/limit-orders`
- Requires posting orders to their limit order program
- Orders sit on-chain until filled by arbitrageurs
- Would need additional UI for managing open limit orders

**Note:** Currently, the "Limit" button doesn't change functionality - both Market and Limit execute market swaps.

### 3. **Your Preset Fee System**
**Why:** Jupiter calculates optimal fees dynamically based on:
- Current network congestion
- Route complexity (number of hops)
- Available liquidity

**What happens:** Your preset fee fields are ignored. Jupiter uses its own fee calculation:
- Base Solana network fee (~0.000005 SOL)
- Priority fee (auto-calculated for faster processing)
- DEX fees (varies by route, typically 0.25-1%)

**Workaround:** The preset system can still control the SOL amount, just not the fees.

### 4. **MEV Protection Toggle**
**Why:** Jupiter uses Jito MEV protection by default when beneficial, but you can't force it on/off via the API.

**What happens:** The MEV button in presets doesn't affect swaps. Jupiter automatically:
- Routes through Jito when advantageous
- Uses standard routing when MEV protection isn't needed

### 5. **Historical Position Tracking**
**Why:** Jupiter only executes swaps - it doesn't track your trading history.

**What doesn't update:**
- "Bought" stat (would need to sum all buy transactions)
- "Sold" stat (would need to sum all sell transactions)  
- "Holding" stat (would need to query token balance)
- "PnL" stat (would need to calculate entry price vs current price)

**Workaround:** You'd need to:
1. Listen to all transactions on the wallet
2. Store them in a database or localStorage
3. Calculate PnL based on entry/exit prices
4. Query current token balances from Solana

## 🔧 HOW TO USE

1. **Navigate to a coin page** with `?mint=<token_address>` in URL
2. **Connect your wallet** (Phantom/Solflare/etc)
3. **Enter amount** in SOL (for buying) or tokens (for selling)
4. **Wait for quote** - Shows expected output and price impact
5. **Click Buy/Sell button** - Confirms transaction in wallet
6. **Wait for confirmation** - Shows success message with transaction link

## 📝 CODE STRUCTURE

### Main Components
- **Quote fetcher** - Calls Jupiter API every 500ms when amount changes
- **Swap executor** - Gets transaction, signs with wallet, sends to network
- **UI updater** - Shows output amount, price impact, loading states

### Flow
```
User types amount → Debounce 500ms → Fetch quote → Update UI
User clicks Buy/Sell → Get swap transaction → Sign with wallet → Send transaction → Wait for confirmation → Show success
```

### Configuration
- **Slippage:** 0.5% (50 basis points) - can be adjusted in `SLIPPAGE_BPS` constant
- **Quote refresh:** 500ms debounce on input
- **Transaction retries:** 2 max retries on RPC failure

## 🚀 NEXT STEPS TO ADD MISSING FEATURES

### To Add Limit Orders:
1. Integrate Jupiter Limit Order API
2. Add UI for creating/canceling limit orders
3. Show list of open limit orders
4. Poll for order status updates

### To Add TP/SL:
1. Build a backend monitoring service (Node.js/Python)
2. Store TP/SL orders in database
3. Watch prices 24/7
4. Execute swaps when conditions met
5. Notify users via webhook/email

### To Add Position Tracking:
1. Listen to wallet transactions via WebSocket
2. Parse swap transactions (Jupiter program ID)
3. Store trade history in localStorage/database
4. Calculate PnL based on entry prices
5. Update stats panel in real-time

## 🐛 TROUBLESHOOTING

**"No token mint found"** - Make sure URL has `?mint=<address>` parameter

**"Wallet provider not found"** - Install Phantom or Solflare browser extension

**"Quote failed: 404"** - Token might not have liquidity on Jupiter DEXes

**"Swap failed: Transaction simulation failed"** - Usually means:
- Insufficient SOL balance
- Token account doesn't exist (first buy creates it)
- Slippage too low for volatile token

**Price impact >10%** - Token has low liquidity, you're moving the market

## 📚 API REFERENCES

- Jupiter Quote API: https://station.jup.ag/docs/apis/swap-api
- Jupiter Limit Orders: https://station.jup.ag/docs/limit-order/limit-order-api
- Solana Web3.js: https://solana-labs.github.io/solana-web3.js/

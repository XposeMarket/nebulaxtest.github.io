# Quick Test Guide - Jupiter Swap Integration

## How to Test

### 1. Open a Coin Page
Navigate to any token, for example:
```
http://localhost:8000/Coinpage-Official.html?mint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263
```
(This is Bonk token - good for testing)

### 2. Connect Your Wallet
- Click "Connect Wallet" button in header
- Approve connection in Phantom/Solflare
- Should show your SOL balance

### 3. Test Buy Flow
1. Click **"Buy"** button (should be green and selected)
2. Type an amount in SOL (e.g., `0.01`)
3. Wait 500ms - should see:
   - "You'll receive: XXX BONK"
   - "Price Impact: X.XX%"
4. Click **"Buy BONK"** button
5. Wallet popup appears - approve transaction
6. Wait for confirmation (~3-5 seconds)
7. Success alert with Solscan link

### 4. Test Sell Flow
1. Click **"Sell"** button (should turn red)
2. Button text changes to "Sell BONK"
3. Type an amount of tokens you own
4. Should show how much SOL you'll get back
5. Click **"Sell BONK"** button
6. Approve in wallet
7. Wait for confirmation

## Expected Console Logs

Open DevTools Console (F12) and watch for:

```
[Jupiter] Swap integration loaded
[Jupiter] Quote: { inputMint: "So11...", outAmount: "12345678", priceImpactPct: 0.12, ... }
[Jupiter] Getting swap transaction...
[Jupiter] Signing transaction...
[Jupiter] Sending transaction...
[Jupiter] Transaction sent: 5Xyz...
[Jupiter] Transaction confirmed: 5Xyz...
```

## What Should Happen

### ✅ Success Indicators
- Output amount updates as you type
- Price impact shows in green/amber/red
- Button shows "Swapping..." then "Confirming..."
- Alert shows transaction hash
- Wallet balance updates after swap

### ❌ Error Scenarios

**"Please connect your wallet first"**
- You didn't connect wallet - click wallet button

**"Token mint not found"**
- URL missing `?mint=` parameter
- Add token address to URL

**"Quote failed: 404"**
- Token has no liquidity on Jupiter
- Try a more popular token (SOL/USDC/BONK/WIF)

**"Swap failed: insufficient funds"**
- You don't have enough SOL
- Add more SOL to wallet or reduce amount

**"Transaction simulation failed"**
- Usually means slippage too low
- Try again (price might have moved)
- Or token has very low liquidity

## Test Tokens

Good tokens for testing (high liquidity):

1. **BONK** - `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263`
2. **WIF** - `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm`
3. **USDC** - `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`

## Browser DevTools Debugging

### Network Tab
Filter by "jup.ag" to see API calls:
- `GET /v6/quote?inputMint=...` - Quote requests
- `POST /v6/swap` - Swap transaction requests

### Console Tab
Watch for `[Jupiter]` prefixed logs:
- Quote responses
- Transaction stages
- Error messages

### Application Tab
Check localStorage:
- `nebula_presets` - Your saved presets (not used by Jupiter but still there)
- `nebula_selected_coin` - Current coin data

## Performance Expectations

- **Quote fetch:** ~200-500ms
- **Transaction signing:** Instant (wallet popup)
- **Transaction send:** ~100-300ms
- **Confirmation wait:** ~3-5 seconds (Solana block time)
- **Total swap time:** ~5-8 seconds from click to confirmed

## If Something Breaks

1. **Open Console** - Look for error messages
2. **Check wallet connection** - Reconnect if needed
3. **Verify token mint** - Make sure URL has valid token address
4. **Try smaller amount** - Large trades might exceed slippage
5. **Refresh page** - Sometimes state gets corrupted

## Advanced Testing

### Test Different Amounts
- Tiny: `0.001` SOL (should work but high impact)
- Small: `0.1` SOL (reasonable)
- Medium: `1` SOL (good for most tokens)
- Large: `10` SOL (might show high price impact)

### Test Price Impact Warnings
For low liquidity tokens, try progressively larger amounts to see:
- Green: <1% impact
- Amber: 1-5% impact  
- Red: >5% impact

### Test Error Recovery
1. Start a swap
2. Reject in wallet
3. Should reset button and allow retry
4. No state should be broken

## Known Issues to Watch For

1. **Buffer is not defined** - If you see this, Web3.js didn't load properly
2. **Transaction expired** - Solana network congestion, just retry
3. **Slippage tolerance exceeded** - Price moved too fast, retry with fresh quote
4. **Account not found** - First time buying a token (expected, transaction will create account)

## Success Criteria

Integration is working if:
- [x] Quotes update as you type
- [x] Price impact displays correctly
- [x] Wallet popup appears on submit
- [x] Transaction confirms on-chain
- [x] Balance updates after swap
- [x] Can buy AND sell same token
- [x] Error messages are helpful
- [x] No console errors

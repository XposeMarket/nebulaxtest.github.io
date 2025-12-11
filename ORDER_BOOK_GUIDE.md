# NebulaX Order Book System - Complete Guide

## 🎯 Overview
The Order Book is a comprehensive trade tracking system that logs every buy and sell transaction for tokens on the Coinpage. It provides detailed analytics including entry/exit prices, PnL calculations, and complete trade history.

## ✅ Features Implemented

### 📊 Trade Tracking
- **Automatic Logging**: Every buy/sell transaction is automatically logged to localStorage
- **Per-Token History**: Trades are organized by token mint address
- **Persistent Storage**: Up to 1000 recent trades stored locally
- **Real-time Updates**: Order book refreshes immediately after each trade

### 📈 Statistics Display

#### Summary Card (Top Section)
- **Total Buys**: Count and quantity of all buy orders
- **Total Sells**: Count and quantity of all sell orders  
- **Avg Entry**: Average price per token across all buys (SOL/token)
- **Avg Exit**: Average price per token across all sells (SOL/token)

#### Trade History Table
Each trade row displays:
1. **Time**: Human-readable timestamp (e.g., "2m ago", "5h ago")
2. **Type**: 🟢 BUY or 🔴 SELL with color-coded badges
3. **Quantity**: Token amount + symbol
4. **SOL**: SOL amount spent/received
5. **Price**: Price per token in SOL/token
6. **Value**: USD value at time of trade
7. **PnL**: Profit/loss (sells only) showing both USD and SOL

### 💰 PnL Calculation
For **SELL** trades:
- Compares exit price vs. average entry price
- Shows total profit/loss in both USD and SOL
- Color-coded: 🟢 Green for profit, 🔴 Red for loss
- Uses real-time SOL price from CoinGecko API

## 🔧 Technical Implementation

### Data Structure
```javascript
{
  timestamp: 1733604000000,
  tokenMint: "8QW23aW9W1qZC8WB1qFKuhmsgdVmmMWhpUwx4Cu4pump",
  tokenSymbol: "TYKJEN",
  type: "buy", // or "sell"
  tokenAmount: 1180.341,
  solAmount: 0.05,
  price: 0.0000423,
  txid: "5k3j2...",
  wallet: "Do7AJi..."
}
```

### Storage Location
- **Key**: `nebulax_order_book`
- **Location**: `localStorage`
- **Max Size**: 1000 trades (FIFO)

### Global Functions
```javascript
// Access via window.NXOrderBook
window.NXOrderBook = {
  ORDER_BOOK_KEY: 'nebulax_order_book',
  logTrade: logTradeToOrderBook,
  getTokenTrades: getTokenTrades,
  getUserTokenTrades: getUserTokenTrades,
  calculateUserStats: calculateUserStats,
  refreshDisplay: refreshOrderBookDisplay
}
```

## 📱 User Interface

### Location
- **Page**: Coinpage (Coinpage-Official.html)
- **Tab**: "Order Book" (first tab, active by default)
- **Position**: Below chart area

### Display Features
- Sticky header for easy scrolling
- Hover effects on rows
- Scrollable table (max 500px height)
- Shows up to 100 most recent trades
- Empty state message when no trades exist

### Time Formatting
- `Just now` - Less than 1 minute
- `Xm ago` - Minutes (1-59)
- `Xh ago` - Hours (1-23)
- `Xd ago` - Days (1-6)
- `MM/DD HH:MM` - Older than 7 days

## 🔄 Integration Points

### 1. Trade Logging (Automatic)
Located in `executeSwap()` function:
```javascript
logTradeToOrderBook({
  tokenMint: orderMint,
  tokenSymbol: tokenSymbol,
  type: isBuyMode ? 'buy' : 'sell',
  tokenAmount: tokenAmount,
  solAmount: solAmount,
  price: price,
  txid: txid,
  wallet: userPublicKey.toString()
});
```

### 2. Display Refresh
Triggered automatically:
- After each trade completion
- When Order Book tab is clicked
- On page load (500ms delay)
- When token changes

### 3. Portfolio Integration
Order book data is used by `portfolio_official_v_2_fixed.html`:
```javascript
const stats = window.NXOrderBook.calculateUserStats(mint, wallet);
// Returns: { bought, sold, pnl, boughtUSD, soldUSD, pnlUSD }
```

## 💡 Usage Examples

### View Trade History
1. Navigate to any token's Coinpage
2. Order Book tab is shown by default
3. All your trades for that token are displayed

### After Making a Trade
1. Execute buy/sell via Jupiter swap
2. Trade is automatically logged
3. Order book refreshes instantly
4. Stats update in real-time

### Check Your Performance
Look at the summary card for:
- How many times you've traded this token
- Your average buy price (entry)
- Your average sell price (exit)
- Individual PnL for each sell

## 🎨 Visual Design

### Color Scheme
- **Buy Badges**: Emerald green (`bg-emerald-500/20`, `text-emerald-400`)
- **Sell Badges**: Rose red (`bg-rose-500/20`, `text-rose-400`)
- **Profit**: Green with ▲ arrow
- **Loss**: Red with ▼ arrow
- **Price Values**: Cyan accent color
- **Background**: Dark theme with subtle borders

### Typography
- Monospace font for numbers (better alignment)
- Bold font for type badges
- Smaller text for labels and secondary info

## 🔍 Data Sources

### Trade Data
- Source: User's actual Jupiter swap transactions
- Storage: localStorage (client-side only)
- Privacy: Data stays on your device

### Price Data
- **SOL Price**: CoinGecko API (`/simple/price`)
- **Token Price**: Stored at trade time from Jupiter quote
- **Real-time**: SOL price fetched on page load

### Accuracy
- **Quantities**: Uses correct on-chain decimals via `getTokenDecimals()`
- **Prices**: Calculated from actual swap amounts
- **PnL**: Based on weighted average entry price

## 🚀 Performance

### Optimization
- Only renders when tab is active
- Displays max 100 trades (pagination ready)
- Cached calculations in memory
- Minimal DOM updates

### Load Time
- Instant for cached data
- ~500ms initial delay on page load
- No network requests for display (except SOL price)

## 🛠️ Future Enhancements (Optional)

### Potential Features
- [ ] Export to CSV functionality
- [ ] Filter by date range
- [ ] Search by transaction ID
- [ ] Clear all trades button
- [ ] Pagination for 100+ trades
- [ ] Chart visualization of PnL over time
- [ ] Compare performance across tokens
- [ ] Social sharing of trade history

### Technical Improvements
- [ ] IndexedDB for larger storage
- [ ] Background sync for multi-device
- [ ] Trade compression for efficiency
- [ ] Automatic cleanup of old trades

## 📝 Notes

### Important Behaviors
1. **New Tokens**: Order book starts fresh for each new token
2. **Wallet Change**: Trades are wallet-specific
3. **Browser Clear**: Clearing localStorage removes all trades
4. **Private**: Trade data never leaves your browser

### Troubleshooting
- **No trades showing**: Check if Order Book tab is active
- **Wrong PnL**: Ensure SOL price fetched successfully
- **Missing trade**: Check browser console for errors
- **Decimals wrong**: getTokenDecimals() should fetch correct value

## 🎓 Developer Reference

### Key Files
- `Coinpage-Official.html` - Order book implementation
- Lines 1487-1850 - Core order book system
- Lines 814-851 - Tab system integration
- Lines 1410-1480 - Trade logging integration
- Lines 2483-2497 - SOL price fetching

### Console Logging
Enable detailed logs:
```javascript
[OrderBook] Trade logged: {...}
[OrderBook] Display refreshed with X trades
[CoinPage] SOL price fetched: $XXX.XX
```

### Testing
```javascript
// Manual test
window.NXOrderBook.logTrade({
  tokenMint: "test123",
  tokenSymbol: "TEST",
  type: "buy",
  tokenAmount: 100,
  solAmount: 0.1,
  price: 0.001,
  txid: "test",
  wallet: "testWallet"
});

// Refresh display
window.NXOrderBook.refreshDisplay();
```

## ✅ Status: FULLY OPERATIONAL

All features implemented and tested:
- ✅ Automatic trade logging with correct decimals
- ✅ Real-time display refresh
- ✅ Summary statistics calculation
- ✅ PnL calculations with SOL price
- ✅ Beautiful UI with color coding
- ✅ Integration with portfolio page
- ✅ Time formatting and display
- ✅ Empty state handling
- ✅ Tab system integration

**Ready for production use!** 🚀

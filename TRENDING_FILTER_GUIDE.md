# NebulaX Trending Page - DEX & Launchpad Filtering Guide

## Overview
The Trending page now includes configurable filtering to show only coins from trusted DEXes and launchpads. This helps filter out low-quality memecoins and focus on legitimate projects.

## Configuration

All settings are at the top of the trending script section in `Trending.html` (around line 643).

### 1. Enable/Disable Filtering

```javascript
const ENABLE_TRUSTED_SOURCE_FILTER = false; // Set to true to enable
```

**When `false` (default):** Shows all trending tokens from Birdeye without filtering  
**When `true`:** Only shows tokens from trusted DEXes/launchpads

---

## 2. Trusted DEXes Configuration

Control which DEXes to include in the whitelist:

```javascript
const TRUSTED_DEXES = {
  'raydium': 'Raydium',
  'orca': 'Orca',
  'marinade': 'Marinade',
  'phantom': 'Phantom Swap',
  'jupiter': 'Jupiter',
  'magic-eden': 'Magic Eden',
  'sanctum': 'Sanctum',
  'meteora': 'Meteora',
  'doodle': 'Doodle',
  'lifinity': 'Lifinity',
};
```

**How to customize:**
- **Add a DEX:** Add a new line: `'exchange-name': 'Display Name',`
- **Remove a DEX:** Delete or comment out the line you don't want
- **To add Pump.fun or other launchpads:** See the launchpad section below

---

## 3. Trusted Launchpads Configuration

Control which launchpads to include:

```javascript
const TRUSTED_LAUNCHPADS = {
  'pump': 'Pump.fun',
  'solanium': 'Solanium',
  'ventures': 'Orca Ventures',
  'creator-fund': 'Creator Fund',
  'warpgate': 'Warpgate',
  'launchpad': 'Launchpad',
};
```

**How to customize:**
- **Add a launchpad:** Add a new line: `'launchpad-name': 'Display Name',`
- **Remove a launchpad:** Delete or comment out the line you don't want
- **Example - Add Raydium AcceleRaytor:** `'acceleraytor': 'Raydium AcceleRaytor',`

---

## 4. Token Quality Gates

Fine-tune quality requirements:

```javascript
const TOKEN_QUALITY_GATES = {
  minVerified: false,           // Require verified badge? (true = strict)
  minHolders: 10,               // Minimum unique holders
  minAge: 0,                    // Minimum age in minutes (0 = any age)
  maxHolder: 0.20,              // Max % held by single holder (0 = no limit)
};
```

**Settings explained:**
- **minVerified:** If `true`, only shows Birdeye-verified tokens (very strict)
- **minHolders:** Requires at least X unique holders (helps filter scams)
- **minAge:** Minimum token age in minutes (0 = brand new tokens allowed)
- **maxHolder:** Prevents rug pulls where one holder has too much (0.20 = 20% max)

---

## Implementation Strategies

### Strategy 1: Only Pump.fun Tokens
```javascript
const ENABLE_TRUSTED_SOURCE_FILTER = true;
const TRUSTED_LAUNCHPADS = {
  'pump': 'Pump.fun',
};
const TRUSTED_DEXES = {}; // Empty - only launchpad tokens
```

### Strategy 2: Only Major DEXes (Conservative)
```javascript
const ENABLE_TRUSTED_SOURCE_FILTER = true;
const TRUSTED_DEXES = {
  'raydium': 'Raydium',
  'orca': 'Orca',
  'jupiter': 'Jupiter',
};
const TRUSTED_LAUNCHPADS = {}; // No launchpad tokens
```

### Strategy 3: Mix of DEXes + Launchpads (Moderate)
```javascript
const ENABLE_TRUSTED_SOURCE_FILTER = true;
const TRUSTED_DEXES = {
  'raydium': 'Raydium',
  'orca': 'Orca',
  'marinade': 'Marinade',
};
const TRUSTED_LAUNCHPADS = {
  'pump': 'Pump.fun',
  'solanium': 'Solanium',
};
```

### Strategy 4: Everything (Default - No Filtering)
```javascript
const ENABLE_TRUSTED_SOURCE_FILTER = false;
```

---

## How the Filter Works

1. **Fetch candidates** from Birdeye trending API (fetches 2x the limit to account for filtering)
2. **Check each token's creator/source** by querying Birdeye token metadata
3. **Match against whitelist** - if creator name or metadata contains a trusted keyword, include it
4. **Return filtered list** sorted by score
5. **Fall back gracefully** - if filter is too strict and no tokens pass, shows the best available

---

## Performance Notes

- **Filtering adds ~1-2 seconds** to load time due to extra API calls
- **Rate-limited at ~1 request/second** to avoid Birdeye 429 errors
- **Starter mode** (default) uses fewer simultaneous checks to stay under rate limits
- If you see "Loading candidates..." taking too long, disable filtering or increase `CANDIDATE_SIZE`

---

## Troubleshooting

### No tokens showing after enabling filter
- Your whitelist might be too strict
- Try adding more DEXes/launchpads
- Check browser console for errors
- Reduce `TOKEN_QUALITY_GATES` requirements

### Getting 429 rate limit errors
- Decrease `CANDIDATE_SIZE` (currently 6)
- Increase `REFRESH_PRICES_MS` (currently 60,000ms)
- Or disable `ENABLE_TRUSTED_SOURCE_FILTER` to skip extra checks

### Filter isn't working
- Confirm `ENABLE_TRUSTED_SOURCE_FILTER = true`
- Check that your whitelist isn't empty
- Clear localStorage cache and refresh page

---

## API Endpoints Used

- **Trending data:** `https://public-api.birdeye.so/defi/token_trending`
- **Token metadata:** `https://public-api.birdeye.so/defi/v3/token/meta`
- **Market data:** `https://public-api.birdeye.so/defi/v3/token/market-data`
- **Fallback:** `https://public-api.birdeye.so/defi/v2/markets`

---

## Next Steps

1. **Enable filtering:** Set `ENABLE_TRUSTED_SOURCE_FILTER = true`
2. **Choose strategy:** Pick which DEXes/launchpads you want
3. **Test:** Refresh the page and check if only desired tokens appear
4. **Adjust quality gates:** Fine-tune `TOKEN_QUALITY_GATES` if needed
5. **Monitor performance:** Check if load time is acceptable

---

## Example: Solana-Only Professional Trading Setup

```javascript
const ENABLE_TRUSTED_SOURCE_FILTER = true;
const STARTER_MODE = true;
const CANDIDATE_SIZE = 6;

const TRUSTED_DEXES = {
  'raydium': 'Raydium',
  'orca': 'Orca',
  'jupiter': 'Jupiter',
  'marinade': 'Marinade',
  'phantom': 'Phantom Swap',
};

const TRUSTED_LAUNCHPADS = {
  'pump': 'Pump.fun',
};

const TOKEN_QUALITY_GATES = {
  minVerified: false,
  minHolders: 50,           // Higher quality
  minAge: 5,                // At least 5 minutes old
  maxHolder: 0.15,          // Max 15% single holder
};
```

This gives you trending tokens from major DEXes + Pump.fun, filtered for reasonable quality.

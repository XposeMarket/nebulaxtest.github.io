# Universal Search Implementation Guide

## 🎯 What This Adds

A **live, multi-source token search** that works across ALL pages:
- ✅ Searches Jupiter (verified tokens)
- ✅ Searches DexScreener (all Solana pairs)
- ✅ Searches GeckoTerminal (trending pools)
- ✅ Shows top 5 results with live data
- ✅ Click to navigate to Coinpage
- ✅ Keyboard navigation (arrows, enter, escape)
- ✅ "/" hotkey to focus search

---

## 📁 Files to Update

Update these pages (they already have search UI):
1. ✅ Coinpage-Official.html
2. ✅ NewPairs-official.html
3. ✅ Trending.html
4. ✅ Adrenaline-official.html
5. ✅ portfolio_official_v_2_fixed.html
6. ✅ NebulaX.html (Dashboard)

---

## 🚀 Implementation Steps

### Step 1: Add Search Module to ALL Pages

**Find this section in each page (usually near the top, around line 10-20):**

```html
<script src="assets/nx-wallet.js"></script>
```

**Add right after it:**

```html
<script src="assets/nx-wallet.js"></script>
<script src="assets/js/nx-search.js"></script> <!-- ADD THIS -->
```

**Do this for:**
- ✅ Coinpage-Official.html
- ✅ NewPairs-official.html
- ✅ Trending.html
- ✅ Adrenaline-official.html
- ✅ portfolio_official_v_2_fixed.html
- ✅ NebulaX.html

---

### Step 2: Verify Search HTML Structure

All your pages should already have this HTML (you showed it in Coinpage). Verify it exists:

```html
<!-- SEARCH -->
<div id="search-wrap" class="relative w-[26rem] max-w-[60vw]">
  <input id="search-input" 
         class="nx-input" 
         placeholder="Search markets... /" 
         autocomplete="off"/>
  <div id="search-dd" 
       class="popover hidden mt-1 w-full max-h-[22rem] overflow-auto p-2">
  </div>
</div>
```

**If missing**, add it to the header navigation area.

---

### Step 3: Remove Old Mock Search Code

**Find and REMOVE these sections in each page** (they're using mock data):

```javascript
/* ====== SEARCH DROPDOWN ====== */
const SEARCH_DATA = [
  {icon:'◎', name:'SOL / USDC', ticker:'SOL',  mc:'$13.2B', v:'$980M', l:'$120M'},
  {icon:'◈', name:'WIF / SOL',  ticker:'WIF',  mc:'$4.2B',  v:'$120M', l:'$32M'},
  {icon:'◈', name:'BONK / SOL', ticker:'BONK', mc:'$1.8B',  v:'$88M',  l:'$20M'},
];
// ... rest of mock search code
```

**Delete everything from** `/* ====== SEARCH DROPDOWN ====== */` **to** `function selectHit(i){ ... }`

The new nx-search.js handles all of this automatically.

---

### Step 4: Verify CSS Styles Exist

All pages should already have these styles (from Coinpage). Verify they exist in the `<style>` section:

```css
/* SEARCH styling */
#search-wrap:focus-within .nx-input{ 
  border-color:var(--nx-cyan); 
  box-shadow:0 0 0 2px rgba(0,230,255,.14); 
}

.search-row{ 
  display:flex; 
  align-items:center; 
  gap:.75rem; 
  padding:.45rem .6rem; 
  border-radius:10px; 
  cursor: pointer;
}

.search-row:hover{ 
  background: var(--nx-dark-2); 
}

.search-icon{ 
  height:2rem; 
  width:2rem; 
  display:flex; 
  align-items:center; 
  justify-content:center; 
  border-radius:8px; 
  background:var(--nx-dark-2); 
  overflow: hidden;
}

.search-grid{ 
  display:grid; 
  grid-template-columns: 1fr auto auto auto; 
  gap:.75rem; 
  align-items:center; 
  min-width:0; 
}

.search-name{ 
  min-width:0; 
}

.search-name .ticker{ 
  font-size:11px; 
  color:#8b97c9; 
}

.search-metric{ 
  font-size:11px; 
  color:#9fb3ff; 
  white-space:nowrap; 
  text-align: right;
}

.search-active{ 
  outline:2px solid var(--nx-cyan); 
  outline-offset:2px; 
}
```

**If missing any**, add them to the `<style>` section.

---

## ✅ Testing Checklist

After implementing on ALL pages:

### Test 1: Basic Search
1. Go to any page (start with Coinpage)
2. Click search bar OR press "/" key
3. Type "BONK"
4. Wait 1 second
5. ✅ Should see 5 results with:
   - Token logo
   - Name + symbol
   - Price + 24h change
   - Market cap
   - Volume

### Test 2: Navigation
1. Type "WIF" in search
2. Click first result
3. ✅ Should navigate to Coinpage with WIF data loaded

### Test 3: Keyboard Controls
1. Type "SOL" in search
2. Press ↓ arrow
3. ✅ First result highlights
4. Press ↓ again
5. ✅ Second result highlights
6. Press Enter
7. ✅ Navigates to that token

### Test 4: Hotkey
1. Be on any page
2. Press "/" key
3. ✅ Search input focuses

### Test 5: Different Queries
Try these searches to test different sources:
- ✅ "BONK" - Should find in all 3 sources
- ✅ "Jupiter" - Should find JUP token
- ✅ "USDC" - Should find verified stablecoin
- ✅ New token address - Should find in DexScreener

---

## 🎨 Visual Example

When you search for "BONK", you should see:

```
┌──────────────────────────────────────────────┐
│ Results (5)                                  │
├──────────────────────────────────────────────┤
│ [🐶] Bonk ✓                 BONK             │
│      Price: $0.000012 +5.2%                 │
│      MC: $850M      24h Vol: $45M           │
├──────────────────────────────────────────────┤
│ [🐶] Bonk/SOL               BONK             │
│      Price: $0.000012 +5.1%                 │
│      MC: $850M      24h Vol: $42M           │
├──────────────────────────────────────────────┤
│ ... 3 more results ...                       │
└──────────────────────────────────────────────┘
```

---

## 🔧 Customization Options

### Change Number of Results

In `nx-search.js`, find:
```javascript
const CONFIG = {
  MAX_RESULTS: 5  // Change to 10 for more results
};
```

### Change Debounce Time

```javascript
const CONFIG = {
  DEBOUNCE_MS: 300  // Change to 500 for slower typing
};
```

### Change Minimum Query Length

```javascript
const CONFIG = {
  MIN_QUERY_LENGTH: 2  // Change to 3 to require 3+ chars
};
```

---

## 🐛 Troubleshooting

### Search doesn't appear
**Check console for:**
```
[Search] Search elements not found on this page
```
**Fix:** Verify HTML has `id="search-input"` and `id="search-dd"`

### No results showing
**Check console for:**
```
[Search] DexScreener error: ...
[Search] GeckoTerminal error: ...
```
**Fix:** These APIs may be rate-limited. Jupiter should still work.

### Results not clickable
**Check:** Make sure old mock search code is removed (it conflicts)

### Dropdown stays open
**Fix:** Click outside search area or press Escape key

---

## 📊 Data Sources Explained

### Jupiter Token List
- ✅ **Verified tokens only**
- ✅ Fast (cached for 5 minutes)
- ❌ No price/volume data
- 🎯 Best for: Major tokens (SOL, USDC, BONK, etc.)

### DexScreener
- ✅ **Most comprehensive** (all Solana pairs)
- ✅ Live price, MC, volume, liquidity
- ✅ New/unknown tokens
- ❌ Sometimes slow
- 🎯 Best for: New tokens, price data

### GeckoTerminal
- ✅ Trending pools
- ✅ Good metadata
- ✅ Reliable
- ❌ Fewer results than DexScreener
- 🎯 Best for: Popular/trending tokens

### Deduplication
The search automatically combines all 3 sources and removes duplicates, showing:
1. Verified tokens first (from Jupiter)
2. Then sorted by liquidity
3. Top 5 most relevant results

---

## 🎓 Advanced Features

### Keyboard Shortcuts
- **/** - Focus search from anywhere
- **↓** - Move down results
- **↑** - Move up results
- **Enter** - Select highlighted result
- **Escape** - Close dropdown

### Auto-Navigation
- Clicking any result → Goes to Coinpage
- Passes mint address + pair data
- Stores coin data in localStorage
- Coinpage auto-loads token info

### Smart Caching
- Jupiter tokens cached for 5 minutes
- Reduces API calls
- Faster repeat searches

---

## 📝 Implementation Checklist

### All Pages (6 total)
- [ ] Coinpage-Official.html
  - [ ] Add nx-search.js script
  - [ ] Remove old mock code
  - [ ] Test search
- [ ] NewPairs-official.html
  - [ ] Add nx-search.js script
  - [ ] Remove old mock code
  - [ ] Test search
- [ ] Trending.html
  - [ ] Add nx-search.js script
  - [ ] Remove old mock code
  - [ ] Test search
- [ ] Adrenaline-official.html
  - [ ] Add nx-search.js script
  - [ ] Remove old mock code
  - [ ] Test search
- [ ] portfolio_official_v_2_fixed.html
  - [ ] Add nx-search.js script
  - [ ] Remove old mock code
  - [ ] Test search
- [ ] NebulaX.html
  - [ ] Add nx-search.js script
  - [ ] Remove old mock code
  - [ ] Test search

### Verification
- [ ] Search works on all pages
- [ ] Results show live data
- [ ] Clicking navigates to Coinpage
- [ ] Keyboard navigation works
- [ ] "/" hotkey works
- [ ] No console errors

---

## 🎉 Summary

After implementation:
- ✅ **Universal search across 6 pages**
- ✅ **Multi-source data** (Jupiter + DexScreener + GeckoTerminal)
- ✅ **Live prices, MC, volume**
- ✅ **Top 5 results**
- ✅ **Smart deduplication**
- ✅ **Keyboard navigation**
- ✅ **Auto-navigation to Coinpage**

**Total time:** ~15 minutes (3 lines of code per page)

---

## 🚀 Quick Start

1. **Add script to all 6 pages:**
   ```html
   <script src="assets/js/nx-search.js"></script>
   ```

2. **Remove old mock search code**

3. **Test on Coinpage first:**
   - Type "BONK"
   - Click result
   - Verify navigation

4. **Test on other pages** (same process)

5. **Done!** 🎉

---

**Status:** ✅ **READY TO IMPLEMENT**

The search module is self-contained, auto-initializes, and works with your existing HTML structure. Just add the script tag and remove old code!

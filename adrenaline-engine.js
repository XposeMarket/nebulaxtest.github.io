/**
 * NebulaX Adrenaline Engine v2
 * 
 * Three Panels:
 * 1. NEW PAIRS (Left): Super fresh tokens (< 3 min OR < $30K mcap)
 * 2. MIGRATING (Middle): Tokens gaining traction ($10K+ mcap, not yet on major DEX)
 * 3. MIGRATED (Right): Tokens on Raydium/Orca/Meteora with real liquidity
 */

// Configuration
const ADRENALINE_CONFIG = {
  REFRESH_INTERVAL: 5000, // 5 seconds
  MAX_AGE_MINUTES: 3, // Only show tokens < 3 minutes old (NEW PAIRS panel)
  MAX_MCAP_USD: 30000, // Or up to $30K market cap for new pairs
  MAX_PAIRS_DISPLAYED: 30,
  MIGRATING_MIN_MCAP: 10000, // $10K+ = gaining traction
  MIGRATING_MAX_AGE_MINUTES: 120, // Only show tokens < 2 hours old (prevent old tokens)
  MIGRATED_MIN_LIQ: 5000, // $5K+ liquidity on real DEX = migrated
};

// In-memory state
let newPairs = [];
let migratingTokens = [];
let migratedTokens = [];
let isRefreshing = false;
let lastRefreshTime = 0;

// Token cache - tracks tokens we've seen over time
const tokenCache = new Map(); // mint -> { firstSeen, lastSeen, data }
const CACHE_MAX_AGE_MS = 2 * 60 * 60 * 1000; // Keep tokens for 2 hours max

/**
 * Fetch new pools from GeckoTerminal
 */
async function fetchGeckoTerminalNewPools() {
  const allPools = [];
  
  try {
    // Fetch 3 pages for broader coverage
    for (let page = 1; page <= 3; page++) {
      const response = await fetch(
        `https://api.geckoterminal.com/api/v2/networks/solana/new_pools?page=${page}&include=base_token,quote_token,dex`
      );

      if (!response.ok) continue;

      const data = await response.json();
      const pools = data?.data || [];
      const included = data?.included || [];

      const includedMap = new Map();
      included.forEach(item => {
        includedMap.set(`${item.type}:${item.id}`, item);
      });

      const now = Date.now();

      for (const pool of pools) {
        const poolId = pool.id;
        const attr = pool.attributes || {};
        const rel = pool.relationships || {};

        const createdAt = attr.pool_created_at;
        if (!createdAt) continue;

        const ageMs = now - new Date(createdAt).getTime();
        const ageMinutes = ageMs / 60000;

        const baseTokenData = rel.base_token?.data;
        const dexData = rel.dex?.data;

        const baseToken = baseTokenData ? includedMap.get(`${baseTokenData.type}:${baseTokenData.id}`) : null;
        const dex = dexData ? includedMap.get(`${dexData.type}:${dexData.id}`) : null;

        const baseAttr = baseToken?.attributes || {};
        const dexAttr = dex?.attributes || {};
        const dexName = dexAttr.name || 'Unknown';
        const dexId = dexName.toLowerCase();

        const mcapUsd = parseFloat(attr.fdv_usd) || 0;
        const liquidityUsd = parseFloat(attr.reserve_in_usd) || 0;

        // Determine if on real DEX (Raydium, Orca, Meteora) vs Pump.fun
        const isRealDex = dexId.includes('raydium') || dexId.includes('orca') || dexId.includes('meteora') || dexId.includes('whirlpool');
        const isPumpFun = dexId.includes('pump') || dexId.includes('pumpfun') || dexId.includes('pump.fun');

        const pair = {
          poolId,
          mint: baseAttr.address || '',
          symbol: baseAttr.symbol || 'UNKNOWN',
          name: baseAttr.name || 'Unknown Token',
          pairAddress: attr.address || '',
          dex: dexName,
          dexId,
          isRealDex,
          isPumpFun,
          createdAt,
          ageMinutes: Math.floor(ageMinutes),
          logoURI: baseAttr.image_url || null,
          price: parseFloat(attr.base_token_price_usd) || 0,
          mcapUsd,
          liquidityUsd,
          vol24h: parseFloat(attr.volume_usd?.h24) || 0,
          vol5m: parseFloat(attr.volume_usd?.m5) || 0,
          pct5m: parseFloat(attr.price_change_percentage?.m5) || 0,
          pct1h: parseFloat(attr.price_change_percentage?.h1) || 0,
          txns5m: (attr.transactions?.m5?.buys || 0) + (attr.transactions?.m5?.sells || 0),
        };

        allPools.push(pair);
      }
    }

    return allPools;
  } catch (e) {
    console.error('[ADRENALINE] Fetch error:', e);
    return [];
  }
}

/**
 * Update token cache with new data, preserving firstSeen timestamps
 */
function updateTokenCache(pools) {
  const now = Date.now();
  
  // Clean old entries from cache
  for (const [mint, cached] of tokenCache.entries()) {
    if (now - cached.firstSeen > CACHE_MAX_AGE_MS) {
      tokenCache.delete(mint);
    }
  }
  
  // Update cache with new pools
  for (const pool of pools) {
    if (!pool.mint) continue;
    
    const existing = tokenCache.get(pool.mint);
    if (existing) {
      // Update data but keep original firstSeen
      existing.lastSeen = now;
      existing.data = { ...pool };
      // Calculate real age from when we first saw it
      existing.data.ageMinutes = Math.floor((now - existing.firstSeen) / 60000);
    } else {
      // New token - set firstSeen
      tokenCache.set(pool.mint, {
        firstSeen: now,
        lastSeen: now,
        data: { ...pool, ageMinutes: 0 }
      });
    }
  }
  
  // Return all cached tokens (with updated ages)
  const allCachedTokens = [];
  for (const [mint, cached] of tokenCache.entries()) {
    // Recalculate age for all cached tokens
    cached.data.ageMinutes = Math.floor((now - cached.firstSeen) / 60000);
    allCachedTokens.push(cached.data);
  }
  
  return allCachedTokens;
}

/**
 * Social links cache and fetching
 */
const socialLinksCache = new Map(); // mint -> { twitter, website, hasSocials, timestamp }
const SOCIAL_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

async function fetchSocialsForToken(mint) {
  // Check cache first
  const cached = socialLinksCache.get(mint);
  if (cached && Date.now() - cached.timestamp < SOCIAL_CACHE_TTL) {
    return cached;
  }

  try {
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    if (!response.ok) {
      console.log(`[ADRENALINE] DexScreener API returned ${response.status} for ${mint}`);
      const result = { twitter: null, website: null, hasSocials: false, timestamp: Date.now() };
      socialLinksCache.set(mint, result);
      return result;
    }
    
    const data = await response.json();
    console.log(`[ADRENALINE] DexScreener response for ${mint}:`, data);
    
    const pair = data.pairs?.[0];
    if (!pair) {
      console.log(`[ADRENALINE] No pairs found for ${mint}`);
      const result = { twitter: null, website: null, hasSocials: false, timestamp: Date.now() };
      socialLinksCache.set(mint, result);
      return result;
    }
    
    if (!pair.info) {
      console.log(`[ADRENALINE] No pair.info for ${mint}, pair data:`, pair);
      const result = { twitter: null, website: null, hasSocials: false, timestamp: Date.now() };
      socialLinksCache.set(mint, result);
      return result;
    }

    const socials = pair.info.socials || [];
    const websites = pair.info.websites || [];
    
    console.log(`[ADRENALINE] Found socials for ${mint}:`, socials, 'websites:', websites);
    
    const twitterSocial = socials.find(s => s.type === 'twitter');
    const websiteSocial = websites.find(w => w.url);
    
    const twitter = twitterSocial?.url || null;
    const website = websiteSocial?.url || null;
    const hasSocials = !!(twitter || website);
    
    const result = { twitter, website, hasSocials, timestamp: Date.now() };
    console.log(`[ADRENALINE] Fetched socials for ${mint}: twitter=${!!twitter}, website=${!!website}, hasSocials=${hasSocials}`);
    socialLinksCache.set(mint, result);
    return result;
  } catch (e) {
    console.error('[ADRENALINE] Error fetching socials for', mint, e);
    const result = { twitter: null, website: null, hasSocials: false, timestamp: Date.now() };
    socialLinksCache.set(mint, result);
    return result;
  }
}

/**
 * Enrich tokens with social data (in batches to avoid rate limits)
 */
async function enrichTokensWithSocials(tokens) {
  if (!tokens || tokens.length === 0) return tokens;
  
  console.log(`[ADRENALINE] Enriching ${tokens.length} tokens with social data...`);
  // Process in small batches to avoid overwhelming the API
  const batchSize = 5;
  const tokensWithSocials = [];
  
  for (let i = 0; i < Math.min(tokens.length, 20); i += batchSize) {
    const batch = tokens.slice(i, i + batchSize);
    await Promise.all(batch.map(async (token) => {
      const socials = await fetchSocialsForToken(token.mint);
      token.hasSocials = socials.hasSocials;
      if (socials.hasSocials) {
        tokensWithSocials.push(token.symbol);
      }
    }));
    // Small delay between batches
    if (i + batchSize < tokens.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  console.log(`[ADRENALINE] Enrichment complete. Tokens with socials: ${tokensWithSocials.join(', ') || 'none'}`);
  return tokens;
}

/**
 * Refresh all panels
 */
async function refreshNewPairs() {
  if (isRefreshing) return;
  isRefreshing = true;

  try {
    const freshPools = await fetchGeckoTerminalNewPools();
    const now = Date.now();
    
    // Update cache and get all tracked tokens with real ages
    const allPools = updateTokenCache(freshPools);

    // === LEFT PANEL: New Pairs (< 3 min OR < $30K mcap) ===
    // Use the tracked age from our cache
    newPairs = allPools.filter(p => {
      return p.ageMinutes < ADRENALINE_CONFIG.MAX_AGE_MINUTES || p.mcapUsd < ADRENALINE_CONFIG.MAX_MCAP_USD;
    });
    
    // Sort by age (newest first)
    newPairs.sort((a, b) => a.ageMinutes - b.ageMinutes);

    // === MIDDLE PANEL: Migrating ===
    // Tokens on Pump.fun (or non-real DEX) with $10K+ mcap = gaining traction, approaching migration
    // Also filter by age - only show tokens < 2 hours old to prevent stale old tokens
    migratingTokens = allPools.filter(p => {
      return !p.isRealDex && p.mcapUsd >= ADRENALINE_CONFIG.MIGRATING_MIN_MCAP && p.ageMinutes < ADRENALINE_CONFIG.MIGRATING_MAX_AGE_MINUTES;
    });

    // Sort migrating by mcap descending (closest to migration first)
    migratingTokens.sort((a, b) => b.mcapUsd - a.mcapUsd);

    // Log migrating tokens for debugging
    if (migratingTokens.length > 0) {
      console.log('[ADRENALINE] Migrating tokens:', migratingTokens.map(t => `${t.symbol} ($${t.mcapUsd.toFixed(0)}, age:${t.ageMinutes}m)`).join(', '));
    }

    // Log cache status and age distribution
    const ages = allPools.map(t => t.ageMinutes);
    const maxAge = Math.max(...ages, 0);
    const avgAge = ages.length ? (ages.reduce((a,b) => a+b, 0) / ages.length).toFixed(1) : 0;
    console.log(`[ADRENALINE] 📊 Cache: ${tokenCache.size} tokens | Ages: max ${maxAge}m, avg ${avgAge}m`);

    // === RIGHT PANEL: Migrated ===
    // Tokens on Raydium/Orca/Meteora with real liquidity
    migratedTokens = allPools.filter(p => {
      return p.isRealDex && p.liquidityUsd >= ADRENALINE_CONFIG.MIGRATED_MIN_LIQ;
    });

    // Sort by liquidity descending (most successful migrations first)
    migratedTokens.sort((a, b) => b.liquidityUsd - a.liquidityUsd);

    // Enrich tokens with social data (modifies tokens in-place, only first 20 to avoid rate limits)
    await enrichTokensWithSocials(newPairs);
    await enrichTokensWithSocials(migratingTokens);
    await enrichTokensWithSocials(migratedTokens);

    console.log(`[ADRENALINE] ✅ New: ${newPairs.length} | 🔄 Migrating: ${migratingTokens.length} | 🎯 Migrated: ${migratedTokens.length}`);

    // Dispatch events for UI
    window.dispatchEvent(new CustomEvent('adrenaline:newpairs:updated', {
      detail: { pairs: newPairs.slice(0, ADRENALINE_CONFIG.MAX_PAIRS_DISPLAYED) }
    }));

    window.dispatchEvent(new CustomEvent('adrenaline:migrating:updated', {
      detail: { pairs: migratingTokens.slice(0, ADRENALINE_CONFIG.MAX_PAIRS_DISPLAYED) }
    }));

    window.dispatchEvent(new CustomEvent('adrenaline:migrated:updated', {
      detail: { pairs: migratedTokens.slice(0, ADRENALINE_CONFIG.MAX_PAIRS_DISPLAYED) }
    }));
  } catch (e) {
    console.error('[ADRENALINE] Refresh error:', e);
  } finally {
    isRefreshing = false;
  }
}

/**
 * Initialize the adrenaline engine
 */
function initAdrenalineEngine() {
  console.log('[ADRENALINE] Engine v2 initialized');

  // Clear any old cached data from localStorage
  try {
    localStorage.removeItem('adrenaline_migrating_tokens');
    localStorage.removeItem('adrenaline_migrated_tokens');
    localStorage.removeItem('adrenaline_new_pairs');
  } catch (e) {}

  // Initial refresh
  refreshNewPairs();

  // Refresh every 5 seconds
  setInterval(refreshNewPairs, ADRENALINE_CONFIG.REFRESH_INTERVAL);

  // Expose to window
  window.NX = window.NX || {};
  window.NX.getNewPairs = () => newPairs.slice(0, ADRENALINE_CONFIG.MAX_PAIRS_DISPLAYED);
  window.NX.getMigratingPairs = () => migratingTokens.slice(0, ADRENALINE_CONFIG.MAX_PAIRS_DISPLAYED);
  window.NX.getMigratedPairs = () => migratedTokens.slice(0, ADRENALINE_CONFIG.MAX_PAIRS_DISPLAYED);
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAdrenalineEngine);
} else {
  initAdrenalineEngine();
}

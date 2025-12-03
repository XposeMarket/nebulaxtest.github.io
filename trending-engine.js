/**
 * NebulaX Trending Engine
 * Polls GeckoTerminal + DexScreener for trending tokens
 * Computes NebulaXTrendingScore and keeps results in memory
 */

// Configuration
const TRENDING_CONFIG = {
  REFRESH_INTERVAL: 5000, // 5 seconds for fast updates
  MAX_TOKENS_STORED: 200,
  MIN_LIQUIDITY_USD: 2000,
  MIN_VOLUME_1H: 2000,
  MIN_VOLUME_24H: 10000,
  DEXSCREENER_BATCH_SIZE: 30,
  RATE_LIMIT_BACKOFF: 30000,
};

// In-memory state
let trendingTokens = [];
let lastRefreshAt = null;
let isRefreshing = false;
let requestCount = 0;
let lastMinuteReset = Date.now();

// Rate limiting for GeckoTerminal (~30 req/min)
function canMakeRequest() {
  const now = Date.now();
  if (now - lastMinuteReset >= 60000) {
    requestCount = 0;
    lastMinuteReset = now;
  }
  if (requestCount >= 25) return false; // Leave headroom
  return true;
}

/**
 * Compute NebulaX Trending Score
 * Factors: short-term volume, price momentum, liquidity, activity, validation, boosts
 */
function computeTrendingScore(token) {
  const vol5m = (token.gtVolumeUsd_5m ?? token.dsVolumeUsd_5m ?? 0);
  const vol1h = (token.gtVolumeUsd_1h ?? token.dsVolumeUsd_1h ?? 0);
  const vol24h = (token.gtVolumeUsd_24h ?? token.dsVolumeUsd_24h ?? 0);
  const liq = Math.max(token.gtLiquidityUsd ?? 0, token.dsLiquidityUsd ?? 0);

  const pc5m = token.dsPriceChange_5m ?? 0;
  const pc1h = token.dsPriceChange_1h ?? 0;
  const pc24h = token.dsPriceChange_24h ?? 0;

  // Volume components (log scale to compress huge numbers)
  const volumeShortTerm = Math.log10(vol5m + 1) * 3 + Math.log10(vol1h + 1) * 2;
  const volume24h = Math.log10(vol24h + 1);
  const liquidityComponent = Math.log10(liq + 1);

  // Price momentum (scaled)
  const priceMomentum = (pc5m / 5) + (pc1h / 10) + (pc24h / 20);

  // Transaction activity
  const txActivity = ((token.gtTxns_5m ?? token.dsTxns_5m ?? 0) / 5);

  // DexScreener validation bonus
  const validatorBonus = token.dexscreenerValidated ? 3 : 0;

  // Penalty for active boosts (paid shills)
  const boosts = token.dsBoostsActive ?? 0;
  const boostPenalty = boosts > 0 ? -2 : 0;

  let score =
    volumeShortTerm +
    volume24h +
    liquidityComponent +
    priceMomentum +
    txActivity +
    validatorBonus +
    boostPenalty;

  // Tier classification
  let tier = 'B';
  if (score >= 20) tier = 'S';
  else if (score >= 10) tier = 'A';

  return { score: Math.max(0, score), tier };
}

/**
 * Fetch trending pools from GeckoTerminal
 */
async function fetchGeckoTrending() {
  if (!canMakeRequest()) {
    console.warn('[TRENDING] Rate limited, skipping GeckoTerminal fetch');
    return [];
  }

  requestCount++;

  try {
    const response = await fetch(
      'https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?page=1&page_size=100&include=base_token,quote_token,dex'
    );

    if (response.status === 429) {
      console.warn('[TRENDING] GeckoTerminal rate limited, backing off 30s');
      await new Promise(r => setTimeout(r, TRENDING_CONFIG.RATE_LIMIT_BACKOFF));
      return [];
    }

    if (!response.ok) {
      console.error(`[TRENDING] GeckoTerminal returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const pools = data?.data || [];
    const included = data?.included || [];

    // Build lookup map for included entities
    const includedMap = new Map();
    included.forEach(item => {
      includedMap.set(`${item.type}:${item.id}`, item);
    });

    // Extract trending tokens
    const tokens = [];
    for (const pool of pools) {
      try {
        const baseTokenRel = pool.relationships?.base_token?.data;
        const quoteTokenRel = pool.relationships?.quote_token?.data;
        const dexRel = pool.relationships?.dex?.data;

        const baseToken = baseTokenRel ? includedMap.get(`${baseTokenRel.type}:${baseTokenRel.id}`) : null;
        const quoteToken = quoteTokenRel ? includedMap.get(`${quoteTokenRel.type}:${quoteTokenRel.id}`) : null;
        const dex = dexRel ? includedMap.get(`${dexRel.type}:${dexRel.id}`) : null;

        if (!baseToken) continue;

        tokens.push({
          mint: baseToken.attributes?.address,
          symbol: baseToken.attributes?.symbol,
          name: baseToken.attributes?.name,
          logoURI: baseToken.attributes?.image_url || null,

          // GeckoTerminal data
          gtPoolId: pool.id,
          gtPoolAddress: pool.attributes?.address,
          gtDexName: dex?.attributes?.name || null,
          gtLiquidityUsd: parseFloat(pool.attributes?.reserve_in_usd) || null,
          gtVolumeUsd_5m: parseFloat(pool.attributes?.volume_usd?.m5) || null,
          gtVolumeUsd_1h: parseFloat(pool.attributes?.volume_usd?.h1) || null,
          gtVolumeUsd_24h: parseFloat(pool.attributes?.volume_usd?.h24) || null,
          gtPrice: parseFloat(pool.attributes?.base_token_price_usd) || null,
          gtTxns_5m: pool.attributes?.transactions?.m5?.buys + pool.attributes?.transactions?.m5?.sells || null,
          gtTxns_1h: pool.attributes?.transactions?.h1?.buys + pool.attributes?.transactions?.h1?.sells || null,
          gtTxns_24h: pool.attributes?.transactions?.h24?.buys + pool.attributes?.transactions?.h24?.sells || null,
          gtPoolCreatedAt: pool.attributes?.pool_created_at,

          // Placeholder for DexScreener data
          dexscreenerValidated: false,
        });
      } catch (e) {
        console.warn('[TRENDING] Error parsing pool:', e.message);
      }
    }

    console.log(`[TRENDING] Fetched ${tokens.length} pools from GeckoTerminal`);
    return tokens;
  } catch (e) {
    console.error('[TRENDING] GeckoTerminal fetch error:', e.message);
    return [];
  }
}

/**
 * Fetch prices from Jupiter V3 API
 */
async function enrichWithJupiterPrices(tokens) {
  if (tokens.length === 0) return tokens;

  try {
    const mints = tokens.map(t => t.mint).filter(Boolean);
    if (mints.length === 0) return tokens;

    // Try Jupiter API v6 first, fallback to using GeckoTerminal prices
    try {
      const response = await fetch('https://api.jup.ag/price/v2?ids=' + mints.join(','), {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const priceMap = data?.data || {};
        console.log(`[TRENDING] Fetched prices for ${Object.keys(priceMap).length}/${mints.length} tokens from Jupiter`);
        
        return tokens.map(token => {
          const jupPrice = priceMap[token.mint];
          return {
            ...token,
            jupiterPrice: jupPrice?.price || null,
          };
        });
      }
    } catch (jupError) {
      console.warn('[TRENDING] Jupiter API unavailable, using GeckoTerminal prices');
    }

    // Return tokens with existing prices (from GeckoTerminal)
    console.log('[TRENDING] Using GeckoTerminal prices');
    return tokens;
    
  } catch (e) {
    console.error('[TRENDING] Jupiter price fetch error:', e.message);
    return tokens;
  }
}

/**
 * Enrich tokens with DexScreener data
 */
async function enrichWithDexscreener(tokens) {
  if (!tokens.length) return tokens;

  try {
    // Batch mints into chunks of 30
    const chunks = [];
    for (let i = 0; i < tokens.length; i += TRENDING_CONFIG.DEXSCREENER_BATCH_SIZE) {
      chunks.push(tokens.slice(i, i + TRENDING_CONFIG.DEXSCREENER_BATCH_SIZE));
    }

    for (const chunk of chunks) {
      const mints = chunk.map(t => t.mint).filter(Boolean).join(',');
      if (!mints) continue;

      try {
        const response = await fetch(
          `https://api.dexscreener.com/latest/dex/tokens/${mints}`
        );

        if (!response.ok) {
          console.warn(`[TRENDING] DexScreener returned ${response.status}`);
          continue;
        }

        const data = await response.json();
        const pairs = data?.pairs || [];

        // Map DexScreener data back to our tokens
        pairs.forEach(pair => {
          const tokenAddress = pair.baseToken?.address;
          const token = chunk.find(t => t.mint === tokenAddress);
          if (!token) return;

          // Only update if this pair has better volume than existing data
          if (!token.dexscreenerValidated || (pair.volume?.h24 || 0) > (token.dsVolumeUsd_24h || 0)) {
            token.dexscreenerValidated = true;
            token.dsPairAddress = pair.pairAddress;
            token.dsDexId = pair.dexId;
            token.dsLiquidityUsd = parseFloat(pair.liquidity?.usd) || null;
            token.dsVolumeUsd_5m = parseFloat(pair.volume?.m5) || null;
            token.dsVolumeUsd_1h = parseFloat(pair.volume?.h1) || null;
            token.dsVolumeUsd_24h = parseFloat(pair.volume?.h24) || null;
            token.dsPriceChange_5m = parseFloat(pair.priceChange?.m5) || null;
            token.dsPriceChange_1h = parseFloat(pair.priceChange?.h1) || null;
            token.dsPriceChange_24h = parseFloat(pair.priceChange?.h24) || null;
            token.dsFdv = parseFloat(pair.fdv) || null;
            token.dsMarketCap = parseFloat(pair.marketCap) || null;
            token.dsBoostsActive = pair.boosts?.active || 0;
            token.dsTxns_5m = (pair.txns?.m5?.buys || 0) + (pair.txns?.m5?.sells || 0);
          }
        });
      } catch (e) {
        console.warn('[TRENDING] DexScreener batch error:', e.message);
      }
    }

    console.log(`[TRENDING] Enriched ${tokens.filter(t => t.dexscreenerValidated).length}/${tokens.length} with DexScreener`);
    return tokens;
  } catch (e) {
    console.error('[TRENDING] DexScreener enrichment error:', e.message);
    return tokens;
  }
}

/**
 * Apply filters and scoring
 */
function filterAndScore(tokens) {
  return tokens
    .filter(t => {
      const liq = Math.max(t.gtLiquidityUsd ?? 0, t.dsLiquidityUsd ?? 0);
      const vol1h = Math.max(t.gtVolumeUsd_1h ?? 0, t.dsVolumeUsd_1h ?? 0);
      const vol24h = Math.max(t.gtVolumeUsd_24h ?? 0, t.dsVolumeUsd_24h ?? 0);

      // Hard filters
      if (liq < TRENDING_CONFIG.MIN_LIQUIDITY_USD) return false;
      if (vol1h < TRENDING_CONFIG.MIN_VOLUME_1H && vol24h < TRENDING_CONFIG.MIN_VOLUME_24H) return false;

      return true;
    })
    .map(t => {
      const { score, tier } = computeTrendingScore(t);
      return {
        ...t,
        score,
        tier,
        lastUpdatedAt: new Date().toISOString(),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, TRENDING_CONFIG.MAX_TOKENS_STORED);
}

/**
 * Fast refresh - only update prices/volumes for existing tokens
 */
async function fastRefresh() {
  if (isRefreshing || trendingTokens.length === 0) return;
  
  isRefreshing = true;
  const startTime = Date.now();
  
  try {
    // Refresh DexScreener data for existing tokens
    const enrichedTokens = await enrichWithDexscreener(trendingTokens);
    
    // Re-score and sort
    trendingTokens = filterAndScore(enrichedTokens);
    lastRefreshAt = new Date().toISOString();
    
    console.log(`[TRENDING] ⚡ Fast refresh: ${trendingTokens.length} tokens (${Date.now() - startTime}ms)`);
    
    // Dispatch event for UI to listen
    window.dispatchEvent(new CustomEvent('nebula:trending:updated', {
      detail: { tokens: trendingTokens, count: trendingTokens.length }
    }));
  } catch (e) {
    console.error('[TRENDING] Fast refresh error:', e.message);
  } finally {
    isRefreshing = false;
  }
}

/**
 * Main refresh function
 */
async function refreshTrending() {
  if (isRefreshing) {
    console.log('[TRENDING] Already refreshing, skipping');
    return;
  }

  isRefreshing = true;
  const startTime = Date.now();

  try {
    console.log('[TRENDING] Starting refresh cycle...');

    // Fetch from GeckoTerminal
    const gtTokens = await fetchGeckoTrending();
    if (gtTokens.length === 0) {
      console.warn('[TRENDING] No tokens from GeckoTerminal');
      isRefreshing = false;
      return;
    }

    // Enrich with Jupiter prices
    const priceEnriched = await enrichWithJupiterPrices(gtTokens);

    // Enrich with DexScreener
    const enrichedTokens = await enrichWithDexscreener(priceEnriched);

    // Filter and score
    trendingTokens = filterAndScore(enrichedTokens);
    lastRefreshAt = new Date().toISOString();

    // Log summary
    const sByCount = trendingTokens.filter(t => t.tier === 'S').length;
    const aByCount = trendingTokens.filter(t => t.tier === 'A').length;
    const bByCount = trendingTokens.filter(t => t.tier === 'B').length;

    console.log(`[TRENDING] ✅ Refreshed: S=${sByCount} A=${aByCount} B=${bByCount} (${Date.now() - startTime}ms)`);

    // Log top 5
    trendingTokens.slice(0, 5).forEach((t, i) => {
      console.log(
        `  [${i + 1}] ${t.symbol} score=${t.score.toFixed(1)} tier=${t.tier} ` +
        `liq=$${(t.gtLiquidityUsd || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })} ` +
        `vol1h=$${(t.gtVolumeUsd_1h || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
      );
    });

    // Dispatch event for UI to listen
    window.dispatchEvent(new CustomEvent('nebula:trending:updated', {
      detail: { tokens: trendingTokens, count: trendingTokens.length }
    }));
  } catch (e) {
    console.error('[TRENDING] Refresh error:', e.message);
  } finally {
    isRefreshing = false;
  }
}

/**
 * Initialize the trending engine
 */
function initTrendingEngine() {
  console.log('[TRENDING] Engine initialized');

  // Initial refresh
  refreshTrending();

  // Full refresh every 60 seconds (fetch new token list from GeckoTerminal)
  setInterval(() => {
    refreshTrending();
  }, 60000);

  // Fast refresh every 5 seconds (update prices/volumes for existing tokens)
  setInterval(() => {
    fastRefresh();
  }, TRENDING_CONFIG.REFRESH_INTERVAL);

  // Expose to window with getter
  window.NX = window.NX || {};
  Object.defineProperty(window.NX, 'trendingTokens', {
    get: () => trendingTokens,
    enumerable: true
  });
  window.NX.getTrendingTokens = () => trendingTokens;
  window.NX.getTrendingLastUpdate = () => lastRefreshAt;
}

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTrendingEngine);
} else {
  initTrendingEngine();
}

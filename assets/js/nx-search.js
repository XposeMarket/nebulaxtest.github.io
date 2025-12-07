/**
 * NebulaX Universal Search
 * Multi-source token search across all pages
 * 
 * Sources:
 * - Jupiter Token List (verified tokens)
 * - DexScreener (all Solana pairs)
 * - GeckoTerminal (trending + new)
 */

(function() {
  'use strict';

  // ===== CONFIGURATION =====
  const CONFIG = {
    JUPITER_TOKENS: 'https://tokens.jup.ag/tokens?tags=verified',
    DEXSCREENER_SEARCH: 'https://api.dexscreener.com/latest/dex/search',
    GECKOTERMINAL_SEARCH: 'https://api.geckoterminal.com/api/v2/search/pools',
    DEBOUNCE_MS: 300,
    MAX_RESULTS: 5,
    MIN_QUERY_LENGTH: 2
  };

  // ===== CACHE =====
  let jupiterTokens = null;
  let lastFetch = 0;
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // ===== FETCH JUPITER TOKEN LIST =====
  async function fetchJupiterTokens(forceRefresh = false) {
    const now = Date.now();
    
    if (!forceRefresh && jupiterTokens && (now - lastFetch < CACHE_TTL)) {
      return jupiterTokens;
    }

    try {
      const response = await fetch(CONFIG.JUPITER_TOKENS);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      jupiterTokens = await response.json();
      lastFetch = now;
      
      console.log(`[Search] Jupiter tokens loaded: ${jupiterTokens.length}`);
      return jupiterTokens;
    } catch (error) {
      // Downgrade to warning - this is not fatal
      console.warn('[Search] Jupiter tokenlist unavailable, running in fallback mode:', error.message);
      // Return cached tokens or empty array
      return jupiterTokens || [];
    }
  }

  // ===== SEARCH FUNCTIONS =====

  /**
   * Search Jupiter verified tokens
   */
  async function searchJupiter(query) {
    const tokens = await fetchJupiterTokens();
    const q = query.toLowerCase();
    
    return tokens
      .filter(token => {
        const name = (token.name || '').toLowerCase();
        const symbol = (token.symbol || '').toLowerCase();
        const address = (token.address || '').toLowerCase();
        
        return name.includes(q) || symbol.includes(q) || address.includes(q);
      })
      .slice(0, CONFIG.MAX_RESULTS)
      .map(token => ({
        source: 'jupiter',
        name: token.name || 'Unknown',
        symbol: token.symbol || '???',
        address: token.address,
        logo: token.logoURI || null,
        verified: true,
        // Jupiter doesn't provide price/mc in token list
        price: null,
        marketCap: null,
        volume24h: null,
        liquidity: null
      }));
  }

  /**
   * Search DexScreener (comprehensive Solana data)
   */
  async function searchDexScreener(query) {
    try {
      const response = await fetch(`${CONFIG.DEXSCREENER_SEARCH}?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('DexScreener search failed');
      
      const data = await response.json();
      const pairs = (data.pairs || [])
        .filter(pair => pair.chainId === 'solana') // Solana only
        .slice(0, CONFIG.MAX_RESULTS);
      
      return pairs.map(pair => ({
        source: 'dexscreener',
        name: pair.baseToken?.name || 'Unknown',
        symbol: pair.baseToken?.symbol || '???',
        address: pair.baseToken?.address,
        logo: pair.info?.imageUrl || pair.baseToken?.logo || null,
        verified: false,
        price: parseFloat(pair.priceUsd) || 0,
        marketCap: pair.marketCap || 0,
        volume24h: parseFloat(pair.volume?.h24) || 0,
        liquidity: parseFloat(pair.liquidity?.usd) || 0,
        priceChange24h: parseFloat(pair.priceChange?.h24) || 0,
        pairAddress: pair.pairAddress
      }));
    } catch (error) {
      console.error('[Search] DexScreener error:', error);
      return [];
    }
  }

  /**
   * Search GeckoTerminal (trending + pools)
   */
  async function searchGeckoTerminal(query) {
    try {
      const response = await fetch(`${CONFIG.GECKOTERMINAL_SEARCH}?query=${encodeURIComponent(query)}&network=solana`);
      if (!response.ok) throw new Error('GeckoTerminal search failed');
      
      const data = await response.json();
      const pools = (data.data || []).slice(0, CONFIG.MAX_RESULTS);
      
      return pools.map(pool => {
        const baseToken = pool.attributes?.base_token_price_quote_token || {};
        const quoteToken = pool.attributes?.quote_token_price_quote_token || {};
        
        return {
          source: 'geckoterminal',
          name: pool.attributes?.name || 'Unknown',
          symbol: baseToken.symbol || '???',
          address: pool.attributes?.base_token_address,
          logo: baseToken.logo || null,
          verified: false,
          price: parseFloat(pool.attributes?.base_token_price_usd) || 0,
          marketCap: parseFloat(pool.attributes?.market_cap_usd) || 0,
          volume24h: parseFloat(pool.attributes?.volume_usd?.h24) || 0,
          liquidity: parseFloat(pool.attributes?.reserve_in_usd) || 0,
          priceChange24h: parseFloat(pool.attributes?.price_change_percentage?.h24) || 0,
          pairAddress: pool.id?.split('_')[1] // Extract pool address
        };
      });
    } catch (error) {
      console.error('[Search] GeckoTerminal error:', error);
      return [];
    }
  }

  /**
   * Multi-source search with deduplication
   */
  async function search(query) {
    if (!query || query.length < CONFIG.MIN_QUERY_LENGTH) {
      return [];
    }

    try {
      // Search all sources in parallel
      const [jupiterResults, dexResults, geckoResults] = await Promise.all([
        searchJupiter(query),
        searchDexScreener(query),
        searchGeckoTerminal(query)
      ]);

      // Combine and deduplicate by address
      const combined = [...jupiterResults, ...dexResults, ...geckoResults];
      const seen = new Set();
      const deduplicated = [];

      for (const result of combined) {
        if (!result.address || seen.has(result.address)) continue;
        seen.add(result.address);
        deduplicated.push(result);
      }

      // Sort by relevance (verified first, then by liquidity/volume)
      deduplicated.sort((a, b) => {
        // Verified tokens first
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        
        // Then by liquidity
        const aLiq = a.liquidity || 0;
        const bLiq = b.liquidity || 0;
        if (bLiq !== aLiq) return bLiq - aLiq;
        
        // Then by volume
        const aVol = a.volume24h || 0;
        const bVol = b.volume24h || 0;
        return bVol - aVol;
      });

      return deduplicated.slice(0, CONFIG.MAX_RESULTS);
    } catch (error) {
      console.error('[Search] Search error:', error);
      return [];
    }
  }

  // ===== FORMAT HELPERS =====

  function formatNumber(num) {
    if (!num || num === 0) return '—';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    if (num < 0.01) return `$${num.toExponential(2)}`;
    return `$${num.toFixed(2)}`;
  }

  function formatPrice(price) {
    if (!price || price === 0) return '—';
    if (price < 0.00001) return `$${price.toExponential(4)}`;
    if (price < 0.01) return `$${price.toFixed(8)}`;
    if (price < 1) return `$${price.toFixed(6)}`;
    if (price < 100) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  }

  function formatChange(change) {
    if (!change && change !== 0) return '';
    const sign = change >= 0 ? '+' : '';
    const color = change >= 0 ? 'text-emerald-400' : 'text-rose-400';
    return `<span class="${color}">${sign}${change.toFixed(2)}%</span>`;
  }

  // ===== UI RENDERING =====

  function renderResult(result, index) {
    const logo = result.logo 
      ? `<img src="${result.logo}" class="w-full h-full object-cover" alt="${result.symbol}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="hidden w-full h-full items-center justify-center text-xs font-bold text-cyan-400">${result.symbol.substring(0, 2)}</div>`
      : `<div class="w-full h-full flex items-center justify-center text-xs font-bold text-cyan-400">${result.symbol.substring(0, 2)}</div>`;

    const verified = result.verified 
      ? '<span class="text-[10px] text-emerald-400">✓</span>' 
      : '';

    const price = formatPrice(result.price);
    const mc = formatNumber(result.marketCap);
    const vol = formatNumber(result.volume24h);
    const liq = formatNumber(result.liquidity);
    const change = formatChange(result.priceChange24h);

    return `
      <button type="button" 
              class="search-row w-full" 
              data-index="${index}"
              data-address="${result.address}"
              data-symbol="${result.symbol}"
              data-name="${result.name}"
              data-pair="${result.pairAddress || ''}"
              data-price="${result.price || 0}">
        <div class="search-icon">
          ${logo}
        </div>
        <div class="search-grid min-w-0 flex-1">
          <div class="search-name min-w-0">
            <div class="truncate flex items-center gap-1">
              ${result.name} ${verified}
            </div>
            <div class="ticker">${result.symbol}</div>
          </div>
          <div class="search-metric tabnums">
            <span class="text-[9px] text-zinc-500">Price</span><br/>
            <span class="font-semibold">${price}</span>
            ${change}
          </div>
          <div class="search-metric tabnums">
            <span class="text-[9px] text-zinc-500">MC</span><br/>
            <span class="font-semibold">${mc}</span>
          </div>
          <div class="search-metric tabnums">
            <span class="text-[9px] text-zinc-500">24h Vol</span><br/>
            <span class="font-semibold">${vol}</span>
          </div>
        </div>
      </button>
    `;
  }

  function renderResults(results, container) {
    if (!container) return;

    if (results.length === 0) {
      container.innerHTML = `
        <div class="px-3 py-4 text-center text-sm text-zinc-400">
          No results found
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="px-3 py-2 text-[11px] uppercase tracking-wide text-zinc-400 border-b border-[var(--nx-border)]">
        Results (${results.length})
      </div>
      ${results.map((result, index) => renderResult(result, index)).join('')}
    `;

    // Add click handlers
    container.querySelectorAll('.search-row').forEach((row, index) => {
      row.addEventListener('click', () => {
        const result = results[index];
        handleResultClick(result);
      });
    });
  }

  function handleResultClick(result) {
    console.log('[Search] Selected:', result);

    // Store selected coin data
    try {
      localStorage.setItem('nebula_selected_coin', JSON.stringify({
        mint: result.address,
        symbol: result.symbol,
        name: result.name,
        pair: `${result.symbol}/SOL`,
        pairAddr: result.pairAddress || '',
        price: result.price || 0
      }));
    } catch (e) {
      console.error('[Search] Failed to store coin data:', e);
    }

    // Navigate to Coinpage
    const url = `Coinpage-Official.html?mint=${result.address}&pair=${encodeURIComponent(result.symbol + '/SOL')}${result.pairAddress ? '&pairAddr=' + result.pairAddress : ''}`;
    
    // Close dropdown
    const dropdown = document.getElementById('search-dd');
    if (dropdown) dropdown.classList.add('hidden');
    
    // Clear input
    const input = document.getElementById('search-input');
    if (input) input.value = '';

    // Navigate
    window.location.href = url;
  }

  // ===== INITIALIZATION =====

  function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchDropdown = document.getElementById('search-dd');
    const searchWrap = document.getElementById('search-wrap');

    if (!searchInput || !searchDropdown) {
      console.warn('[Search] Search elements not found on this page');
      return;
    }

    let debounceTimeout = null;
    let activeIndex = -1;
    let currentResults = [];

    // Handle input changes
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim();

      clearTimeout(debounceTimeout);

      if (query.length < CONFIG.MIN_QUERY_LENGTH) {
        searchDropdown.classList.add('hidden');
        currentResults = [];
        return;
      }

      // Show loading
      searchDropdown.classList.remove('hidden');
      searchDropdown.innerHTML = `
        <div class="px-3 py-4 text-center text-sm text-zinc-400">
          <div class="inline-block w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-2"></div>
          Searching...
        </div>
      `;

      debounceTimeout = setTimeout(async () => {
        const results = await search(query);
        currentResults = results;
        activeIndex = -1;
        renderResults(results, searchDropdown);
      }, CONFIG.DEBOUNCE_MS);
    });

    // Handle focus
    searchInput.addEventListener('focus', () => {
      if (currentResults.length > 0) {
        searchDropdown.classList.remove('hidden');
      }
    });

    // Handle keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
      if (searchDropdown.classList.contains('hidden')) return;
      
      const rows = [...searchDropdown.querySelectorAll('.search-row')];
      if (rows.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        rows.forEach(r => r.classList.remove('search-active'));
        activeIndex = (activeIndex + 1) % rows.length;
        rows[activeIndex].classList.add('search-active');
        rows[activeIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        rows.forEach(r => r.classList.remove('search-active'));
        activeIndex = (activeIndex - 1 + rows.length) % rows.length;
        rows[activeIndex].classList.add('search-active');
        rows[activeIndex].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < currentResults.length) {
          handleResultClick(currentResults[activeIndex]);
        } else if (currentResults.length > 0) {
          handleResultClick(currentResults[0]);
        }
      } else if (e.key === 'Escape') {
        searchDropdown.classList.add('hidden');
        searchInput.blur();
      }
    });

    // Handle "/" hotkey to focus search
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        searchInput.focus();
      }
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (searchWrap && !searchWrap.contains(e.target)) {
        searchDropdown.classList.add('hidden');
      }
    });

    // Pre-load Jupiter tokens
    fetchJupiterTokens();

    console.log('[Search] Universal search initialized');
  }

  // ===== PUBLIC API =====

  window.NX = window.NX || {};
  window.NX.Search = {
    search,
    searchJupiter,
    searchDexScreener,
    searchGeckoTerminal,
    init: initSearch,
    formatNumber,
    formatPrice
  };

  // Auto-initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }

  console.log('[Search] Module loaded');
})();

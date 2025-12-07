/**
 * NebulaX Jupiter Integration
 * Universal module for all Jupiter V6 API interactions
 * 
 * API Docs: https://station.jup.ag/docs/apis/swap-api
 */

(function() {
  'use strict';

  // ===== CONFIGURATION =====
  const CONFIG = {
    QUOTE_API: 'https://quote-api.jup.ag/v6/quote',
    SWAP_API: 'https://quote-api.jup.ag/v6/swap',
    PRICE_API: 'https://api.jup.ag/price/v2',
    TOKEN_LIST_API: 'https://tokens.jup.ag/tokens?tags=verified',
    SOL_MINT: 'So11111111111111111111111111111111111111112',
    DEFAULT_SLIPPAGE_BPS: 50, // 0.5%
    QUOTE_DEBOUNCE_MS: 500,
    MAX_RETRIES: 2
  };

  // ===== UTILITIES =====
  
  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function formatAmount(amount, decimals = 9) {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    if (num < 0.000001) return num.toExponential(2);
    if (num < 0.01) return num.toFixed(8);
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  // ===== JUPITER V6 QUOTE API =====
  
  /**
   * Get swap quote from Jupiter V6
   * @param {Object} options - Quote options
   * @param {string} options.inputMint - Input token mint address
   * @param {string} options.outputMint - Output token mint address  
   * @param {string} options.amount - Amount in lamports/smallest unit
   * @param {string} [options.swapMode='ExactIn'] - 'ExactIn' or 'ExactOut'
   * @param {number} [options.slippageBps] - Slippage in basis points
   * @param {number} [options.retries] - Retry attempts
   * @returns {Promise<Object|null>} Quote response or null
   */
  async function getQuote(options) {
    const {
      inputMint,
      outputMint,
      amount,
      swapMode = 'ExactIn',
      slippageBps = CONFIG.DEFAULT_SLIPPAGE_BPS,
      retries = CONFIG.MAX_RETRIES
    } = options;

    if (!inputMint || !outputMint || !amount) {
      console.error('[Jupiter] Missing required parameters for quote');
      return null;
    }

    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: slippageBps.toString(),
        swapMode
      });

      console.log('[Jupiter] Fetching quote:', {
        inputMint: inputMint.substring(0, 8) + '...',
        outputMint: outputMint.substring(0, 8) + '...',
        amount,
        swapMode
      });

      const response = await fetch(`${CONFIG.QUOTE_API}?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Jupiter] Quote failed:', response.status, errorText.substring(0, 200));
        throw new Error(`Quote API returned ${response.status}`);
      }

      const quote = await response.json();
      
      if (!quote || !quote.outAmount) {
        throw new Error('Invalid quote response');
      }

      console.log('[Jupiter] Quote received:', {
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        priceImpactPct: quote.priceImpactPct,
        routePlan: quote.routePlan?.length + ' hops'
      });

      return quote;

    } catch (error) {
      console.error('[Jupiter] Quote error:', error.message);
      
      // Retry with exponential backoff
      if (retries > 0) {
        const delay = (CONFIG.MAX_RETRIES - retries + 1) * 500;
        console.log(`[Jupiter] Retrying in ${delay}ms... (${retries} retries left)`);
        await sleep(delay);
        return getQuote({ ...options, retries: retries - 1 });
      }
      
      return null;
    }
  }

  // ===== JUPITER V6 SWAP API =====
  
  /**
   * Build swap transaction from quote
   * @param {Object} options - Swap options
   * @param {Object} options.quoteResponse - Quote from getQuote()
   * @param {string} options.userPublicKey - User's wallet address
   * @param {boolean} [options.wrapUnwrapSOL=true] - Auto wrap/unwrap SOL
   * @param {boolean} [options.dynamicComputeUnitLimit=true] - Optimize compute units
   * @param {string} [options.priorityLevel='medium'] - Priority fee level
   * @returns {Promise<string>} Base64 encoded transaction
   */
  async function buildSwapTransaction(options) {
    const {
      quoteResponse,
      userPublicKey,
      wrapUnwrapSOL = true,
      dynamicComputeUnitLimit = true,
      priorityLevel = 'medium'
    } = options;

    if (!quoteResponse || !userPublicKey) {
      console.error('[Jupiter] Missing required parameters for swap');
      throw new Error('Missing quoteResponse or userPublicKey');
    }

    try {
      console.log('[Jupiter] Building swap transaction...');

      const requestBody = {
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: wrapUnwrapSOL,
        dynamicComputeUnitLimit,
        prioritizationFeeLamports: 'auto' // Let Jupiter handle fees
      };

      // Add priority level if specified
      if (priorityLevel && priorityLevel !== 'none') {
        requestBody.dynamicSlippage = { maxBps: 300 }; // Max 3% for auto-slippage
      }

      const response = await fetch(CONFIG.SWAP_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Jupiter] Swap API failed:', response.status, errorText.substring(0, 200));
        throw new Error(`Swap API returned ${response.status}`);
      }

      const { swapTransaction } = await response.json();
      
      if (!swapTransaction) {
        throw new Error('No transaction in swap response');
      }

      console.log('[Jupiter] Swap transaction built successfully');
      return swapTransaction;

    } catch (error) {
      console.error('[Jupiter] Swap transaction error:', error);
      throw error;
    }
  }

  // ===== JUPITER PRICE API =====
  
  /**
   * Get current prices for tokens
   * @param {string[]} mints - Array of token mint addresses
   * @returns {Promise<Object>} Price data keyed by mint
   */
  async function getPrices(mints) {
    if (!mints || !Array.isArray(mints) || mints.length === 0) {
      console.warn('[Jupiter] No mints provided for price fetch');
      return {};
    }

    try {
      const ids = mints.join(',');
      const response = await fetch(`${CONFIG.PRICE_API}?ids=${ids}`);
      
      if (!response.ok) {
        throw new Error(`Price API returned ${response.status}`);
      }

      const result = await response.json();
      return result.data || {};

    } catch (error) {
      console.error('[Jupiter] Price fetch error:', error);
      return {};
    }
  }

  /**
   * Get single token price
   * @param {string} mint - Token mint address
   * @returns {Promise<number>} Price in USD
   */
  async function getPrice(mint) {
    const prices = await getPrices([mint]);
    return prices[mint]?.price || 0;
  }

  // ===== JUPITER TOKEN LIST =====
  
  let cachedTokenList = null;
  let tokenListTimestamp = 0;
  const TOKEN_LIST_CACHE_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get Jupiter's verified token list
   * @param {boolean} [forceRefresh=false] - Force refresh cache
   * @returns {Promise<Array>} Array of token metadata
   */
  async function getTokenList(forceRefresh = false) {
    const now = Date.now();
    
    // Return cached if fresh
    if (!forceRefresh && cachedTokenList && (now - tokenListTimestamp < TOKEN_LIST_CACHE_MS)) {
      return cachedTokenList;
    }

    try {
      const response = await fetch(CONFIG.TOKEN_LIST_API);
      
      if (!response.ok) {
        throw new Error(`Token list API returned ${response.status}`);
      }

      const tokens = await response.json();
      cachedTokenList = tokens;
      tokenListTimestamp = now;
      
      console.log(`[Jupiter] Token list loaded: ${tokens.length} tokens`);
      return tokens;

    } catch (error) {
      console.error('[Jupiter] Token list fetch error:', error);
      // Return cached even if stale
      return cachedTokenList || [];
    }
  }

  /**
   * Find token by address
   * @param {string} address - Token mint address
   * @returns {Promise<Object|null>} Token metadata or null
   */
  async function getTokenInfo(address) {
    const tokens = await getTokenList();
    return tokens.find(t => t.address === address) || null;
  }

  // ===== TRADE EXECUTION HELPER =====
  
  /**
   * Execute a complete swap (quote + sign + send)
   * @param {Object} options - Execution options
   * @param {string} options.inputMint - Input token address
   * @param {string} options.outputMint - Output token address
   * @param {string} options.amount - Amount in lamports
   * @param {Object} options.wallet - Wallet provider (Phantom/Solflare)
   * @param {string} [options.swapMode='ExactIn'] - Swap mode
   * @param {Function} [options.onProgress] - Progress callback
   * @returns {Promise<Object>} Execution result with txid
   */
  async function executeSwap(options) {
    const {
      inputMint,
      outputMint,
      amount,
      wallet,
      swapMode = 'ExactIn',
      onProgress = () => {}
    } = options;

    try {
      // Step 1: Get quote
      onProgress('Getting quote...');
      const quote = await getQuote({
        inputMint,
        outputMint,
        amount,
        swapMode
      });

      if (!quote) {
        throw new Error('Failed to get quote');
      }

      // Step 2: Build transaction
      onProgress('Building transaction...');
      const swapTransactionBase64 = await buildSwapTransaction({
        quoteResponse: quote,
        userPublicKey: wallet.publicKey.toString()
      });

      // Step 3: Deserialize and sign
      onProgress('Signing transaction...');
      const swapTransactionBuf = Uint8Array.from(
        atob(swapTransactionBase64),
        c => c.charCodeAt(0)
      );
      const transaction = solanaWeb3.VersionedTransaction.deserialize(swapTransactionBuf);
      const signedTransaction = await wallet.signTransaction(transaction);

      // Step 4: Send to network
      onProgress('Sending transaction...');
      const connection = new solanaWeb3.Connection(
        window.NX_RPC || 'https://api.mainnet-beta.solana.com',
        'confirmed'
      );

      const txid = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 2
      });

      // Step 5: Confirm
      onProgress('Confirming...');
      const confirmation = await connection.confirmTransaction(txid, 'confirmed');

      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }

      onProgress('Complete!');
      
      return {
        success: true,
        txid,
        quote,
        solscanUrl: `https://solscan.io/tx/${txid}`
      };

    } catch (error) {
      console.error('[Jupiter] Swap execution error:', error);
      return {
        success: false,
        error: error.message || 'Swap failed'
      };
    }
  }

  // ===== PUBLIC API =====

  window.NX = window.NX || {};
  window.NX.Jupiter = {
    // Configuration
    CONFIG,

    // Core APIs
    getQuote,
    buildSwapTransaction,
    executeSwap,

    // Price APIs  
    getPrices,
    getPrice,

    // Token list
    getTokenList,
    getTokenInfo,

    // Utilities
    formatAmount,
    
    // Constants
    SOL_MINT: CONFIG.SOL_MINT
  };

  console.log('[Jupiter] Module loaded and ready');
})();

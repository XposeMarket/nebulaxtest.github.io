/**
 * NebulaX Jupiter V6 Swap Engine
 * Universal swap integration for Coinpage, GamePanel, Store
 * 
 * Features:
 * - Real-time quotes with Jupiter V6 API
 * - Buy/Sell swaps with any SPL token
 * - Price impact calculation
 * - Transaction tracking
 * - Position/PnL tracking in localStorage
 * - Wallet balance auto-refresh
 */

(function() {
  'use strict';

  // ===== CONFIGURATION =====
  const CONFIG = {
    JUPITER_QUOTE_API: 'https://quote-api.jup.ag/v6/quote',
    JUPITER_SWAP_API: 'https://quote-api.jup.ag/v6/swap',
    SOL_MINT: 'So11111111111111111111111111111111111111112',
    SLIPPAGE_BPS: 50, // 0.5%
    QUOTE_DEBOUNCE_MS: 500,
    MAX_RETRIES: 2,
    TRADE_HISTORY_KEY: 'nebulax_trades',
    MAX_TRADES_STORED: 1000
  };

  // ===== STATE =====
  let currentQuote = null;
  let isSwapping = false;
  let isBuyMode = true;
  let quoteTimeout = null;

  // ===== UTILITY FUNCTIONS =====
  
  function formatTokenAmount(amount, decimals = 9) {
    const num = parseFloat(amount) / Math.pow(10, decimals);
    if (num < 0.000001) return num.toExponential(2);
    if (num < 0.01) return num.toFixed(8);
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  function formatUSD(value) {
    if (!value && value !== 0) return '$0';
    if (value < 0.01) return `$${value.toExponential(2)}`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  }

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===== JUPITER API FUNCTIONS =====

  /**
   * Fetch quote from Jupiter V6
   * @param {string} inputMint - Token to sell
   * @param {string} outputMint - Token to buy
   * @param {string} amount - Amount in lamports/smallest unit
   * @param {number} retries - Retry attempts remaining
   */
  async function fetchQuote(inputMint, outputMint, amount, retries = CONFIG.MAX_RETRIES) {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount,
        slippageBps: CONFIG.SLIPPAGE_BPS.toString()
      });

      console.log('[Jupiter] Fetching quote:', { inputMint, outputMint, amount });

      const response = await fetch(`${CONFIG.JUPITER_QUOTE_API}?${params}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Jupiter] Quote failed:', response.status, errorText.substring(0, 300));
        throw new Error(`Quote failed: ${response.status}`);
      }

      const quote = await response.json();
      
      if (!quote || !quote.outAmount) {
        throw new Error('Invalid quote response');
      }

      console.log('[Jupiter] Quote received:', {
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        priceImpactPct: quote.priceImpactPct
      });

      return quote;
    } catch (error) {
      console.error('[Jupiter] Quote error:', error.message);
      
      if (retries > 0) {
        const delay = (CONFIG.MAX_RETRIES - retries + 1) * 500;
        console.log(`[Jupiter] Retrying in ${delay}ms... (${retries} retries left)`);
        await sleep(delay);
        return fetchQuote(inputMint, outputMint, amount, retries - 1);
      }
      
      return null;
    }
  }

  /**
   * Get swap transaction from Jupiter V6
   * @param {object} quote - Quote from fetchQuote
   * @param {string} userPublicKey - User's wallet address
   */
  async function getSwapTransaction(quote, userPublicKey) {
    try {
      console.log('[Jupiter] Getting swap transaction...');

      const response = await fetch(CONFIG.JUPITER_SWAP_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse: quote,
          userPublicKey,
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Jupiter] Swap transaction failed:', response.status, errorText.substring(0, 300));
        throw new Error(`Swap transaction failed: ${response.status}`);
      }

      const { swapTransaction } = await response.json();
      
      if (!swapTransaction) {
        throw new Error('No transaction in swap response');
      }

      return swapTransaction;
    } catch (error) {
      console.error('[Jupiter] Transaction error:', error);
      throw error;
    }
  }

  // ===== TRADE HISTORY FUNCTIONS =====

  function saveTradeToHistory(trade) {
    try {
      const history = JSON.parse(localStorage.getItem(CONFIG.TRADE_HISTORY_KEY) || '[]');
      
      const tradeEntry = {
        timestamp: Date.now(),
        tokenMint: trade.tokenMint,
        tokenSymbol: trade.tokenSymbol,
        type: trade.type, // 'buy' or 'sell'
        tokenAmount: trade.tokenAmount,
        solAmount: trade.solAmount,
        price: trade.price,
        txid: trade.txid,
        wallet: trade.wallet
      };
      
      history.unshift(tradeEntry);
      
      // Keep last 1000 trades
      if (history.length > CONFIG.MAX_TRADES_STORED) {
        history.length = CONFIG.MAX_TRADES_STORED;
      }
      
      localStorage.setItem(CONFIG.TRADE_HISTORY_KEY, JSON.stringify(history));
      
      console.log('[Jupiter] Trade saved to history:', tradeEntry);
      
      // Dispatch event for UI updates
      window.dispatchEvent(new CustomEvent('nebulax:trade:saved', { detail: tradeEntry }));
      
      return tradeEntry;
    } catch (error) {
      console.error('[Jupiter] Failed to save trade:', error);
      return null;
    }
  }

  function getTradeHistory(tokenMint = null, wallet = null) {
    try {
      const history = JSON.parse(localStorage.getItem(CONFIG.TRADE_HISTORY_KEY) || '[]');
      
      if (!tokenMint && !wallet) return history;
      
      return history.filter(trade => {
        if (tokenMint && trade.tokenMint !== tokenMint) return false;
        if (wallet && trade.wallet !== wallet) return false;
        return true;
      });
    } catch (error) {
      console.error('[Jupiter] Failed to get trade history:', error);
      return [];
    }
  }

  function calculateStats(tokenMint, wallet) {
    const trades = getTradeHistory(tokenMint, wallet);
    
    let totalBought = 0;
    let totalSold = 0;
    let solSpent = 0;
    let solReceived = 0;
    
    trades.forEach(trade => {
      if (trade.type === 'buy') {
        totalBought += trade.tokenAmount;
        solSpent += trade.solAmount;
      } else {
        totalSold += trade.tokenAmount;
        solReceived += trade.solAmount;
      }
    });
    
    const netPosition = totalBought - totalSold;
    const avgBuyPrice = totalBought > 0 ? solSpent / totalBought : 0;
    const avgSellPrice = totalSold > 0 ? solReceived / totalSold : 0;
    const realizedPnL = solReceived - solSpent;
    
    return {
      bought: totalBought,
      sold: totalSold,
      netPosition,
      avgBuyPrice,
      avgSellPrice,
      solSpent,
      solReceived,
      realizedPnL,
      realizedPnLPct: solSpent > 0 ? (realizedPnL / solSpent) * 100 : 0
    };
  }

  // ===== MAIN SWAP FUNCTION =====

  async function executeSwap(options) {
    if (isSwapping) {
      console.warn('[Jupiter] Swap already in progress');
      return { success: false, error: 'Swap already in progress' };
    }

    if (!currentQuote) {
      console.warn('[Jupiter] No quote available');
      return { success: false, error: 'No quote available. Please wait for quote to load.' };
    }

    // Validate inputs
    if (!options.tokenMint) {
      return { success: false, error: 'No token mint provided' };
    }

    if (!window.NXWallet?.isConnected()) {
      return { success: false, error: 'Wallet not connected' };
    }

    isSwapping = true;

    try {
      // Get wallet provider
      const provider = window.phantom?.solana || window.solana;
      if (!provider) {
        throw new Error('Wallet provider not found');
      }

      const publicKey = provider.publicKey;
      if (!publicKey) {
        throw new Error('Wallet not connected');
      }

      // Get swap transaction
      const swapTransactionBase64 = await getSwapTransaction(currentQuote, publicKey.toString());
      
      // Deserialize transaction
      const swapTransactionBuf = Uint8Array.from(atob(swapTransactionBase64), c => c.charCodeAt(0));
      const transaction = solanaWeb3.VersionedTransaction.deserialize(swapTransactionBuf);
      
      // Sign transaction
      console.log('[Jupiter] Signing transaction...');
      const signedTransaction = await provider.signTransaction(transaction);
      
      // Send transaction
      console.log('[Jupiter] Sending transaction...');
      const connection = new solanaWeb3.Connection(
        window.NX_RPC || 'https://api.mainnet-beta.solana.com',
        'confirmed'
      );
      
      const txid = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        maxRetries: 2
      });
      
      console.log('[Jupiter] Transaction sent:', txid);
      
      // Wait for confirmation
      console.log('[Jupiter] Waiting for confirmation...');
      const confirmation = await connection.confirmTransaction(txid, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
      }
      
      console.log('[Jupiter] Transaction confirmed!');
      
      // Calculate amounts for history
      const tokenAmount = parseFloat(
        isBuyMode ? currentQuote.outAmount : currentQuote.inAmount
      ) / Math.pow(10, 9);
      
      const solAmount = parseFloat(
        isBuyMode ? currentQuote.inAmount : currentQuote.outAmount
      ) / Math.pow(10, 9);
      
      // Save to trade history
      const trade = saveTradeToHistory({
        tokenMint: options.tokenMint,
        tokenSymbol: options.tokenSymbol || 'TOKEN',
        type: isBuyMode ? 'buy' : 'sell',
        tokenAmount,
        solAmount,
        price: options.price || 0,
        txid,
        wallet: publicKey.toString()
      });
      
      // Refresh wallet balance
      if (window.NXWallet?.refreshBalance) {
        setTimeout(() => window.NXWallet.refreshBalance(true), 1000);
      }
      
      // Dispatch success event
      window.dispatchEvent(new CustomEvent('nebulax:swap:success', { 
        detail: { txid, trade, quote: currentQuote } 
      }));
      
      // Clear current quote
      currentQuote = null;
      
      return {
        success: true,
        txid,
        trade,
        solscanUrl: `https://solscan.io/tx/${txid}`
      };
      
    } catch (error) {
      console.error('[Jupiter] Swap failed:', error);
      
      // Dispatch error event
      window.dispatchEvent(new CustomEvent('nebulax:swap:error', { 
        detail: { error: error.message } 
      }));
      
      return {
        success: false,
        error: error.message || 'Swap failed'
      };
    } finally {
      isSwapping = false;
    }
  }

  // ===== UI UPDATE HELPERS =====

  function updateQuoteDisplay(quote, outputElement, impactElement, displayElement) {
    if (!quote) {
      if (displayElement) displayElement.classList.add('hidden');
      return;
    }

    currentQuote = quote;
    
    const outAmount = formatTokenAmount(quote.outAmount, 9);
    const priceImpact = quote.priceImpactPct || 0;
    
    // Color code price impact
    const impactColor = Math.abs(priceImpact) > 5 
      ? 'text-rose-400' 
      : Math.abs(priceImpact) > 1 
        ? 'text-amber-400' 
        : 'text-emerald-400';
    
    if (outputElement) {
      outputElement.textContent = outAmount;
    }
    
    if (impactElement) {
      impactElement.textContent = `${priceImpact > 0 ? '+' : ''}${priceImpact.toFixed(2)}%`;
      impactElement.className = impactColor;
    }
    
    if (displayElement) {
      displayElement.classList.remove('hidden');
    }
  }

  function showQuoteError(message, outputElement, displayElement) {
    if (outputElement) {
      outputElement.textContent = message;
      outputElement.className = 'font-semibold text-rose-400 text-xs';
    }
    if (displayElement) {
      displayElement.classList.remove('hidden');
    }
  }

  // ===== DEBOUNCED QUOTE FETCHER =====

  async function handleAmountChange(options) {
    clearTimeout(quoteTimeout);
    
    const amount = options.amountInput?.value?.trim();
    if (!amount || parseFloat(amount) <= 0) {
      if (options.displayElement) options.displayElement.classList.add('hidden');
      currentQuote = null;
      return;
    }
    
    const mint = options.tokenMint;
    if (!mint) {
      console.warn('[Jupiter] No token mint provided');
      return;
    }
    
    // Show loading
    if (options.outputElement) {
      options.outputElement.textContent = 'Loading...';
      options.outputElement.className = 'font-semibold text-emerald-400';
    }
    if (options.impactElement) {
      options.impactElement.textContent = '...';
    }
    if (options.displayElement) {
      options.displayElement.classList.remove('hidden');
    }
    
    quoteTimeout = setTimeout(async () => {
      const inputMint = isBuyMode ? CONFIG.SOL_MINT : mint;
      const outputMint = isBuyMode ? mint : CONFIG.SOL_MINT;
      const amountLamports = Math.floor(parseFloat(amount) * Math.pow(10, 9));
      
      const quote = await fetchQuote(inputMint, outputMint, amountLamports.toString());
      
      if (quote) {
        updateQuoteDisplay(quote, options.outputElement, options.impactElement, options.displayElement);
      } else {
        const tokenSymbol = options.tokenSymbol || 'TOKEN';
        showQuoteError(
          isBuyMode ? `No liquidity to buy ${tokenSymbol}` : `No liquidity to sell ${tokenSymbol}`,
          options.outputElement,
          options.displayElement
        );
      }
    }, CONFIG.QUOTE_DEBOUNCE_MS);
  }

  // ===== PUBLIC API =====

  window.JupiterSwapEngine = {
    // Configuration
    CONFIG,
    
    // State getters
    getCurrentQuote: () => currentQuote,
    isSwapping: () => isSwapping,
    isBuyMode: () => isBuyMode,
    
    // State setters
    setBuyMode: (buyMode) => { isBuyMode = buyMode; },
    
    // Core functions
    fetchQuote,
    executeSwap,
    handleAmountChange,
    
    // Trade history
    saveTradeToHistory,
    getTradeHistory,
    calculateStats,
    
    // UI helpers
    updateQuoteDisplay,
    showQuoteError,
    
    // Utils
    formatTokenAmount,
    formatUSD
  };

  console.log('[Jupiter] Swap Engine loaded and ready');
})();

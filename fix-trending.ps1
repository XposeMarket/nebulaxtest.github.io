# Fix encoding issues in Trending.html
$filePath = "d:\Websites\NebulaX-Dev\Trending.html"

# Read file content
$content = Get-Content $filePath -Raw

# Replace the renderTrendingTokens function
$oldFunction = @'
function renderTrendingTokens() {
  const tbody = document.getElementById('trend-body');
  if (!tbody) {
    console.warn('[RENDER] Table body #trend-body not found');
    return;
  }
  
  const tokens = window.NX?.getTrendingTokens?.() || window.NX?.trendingTokens || [];
  console.log(`[RENDER] Rendering ${tokens.length} tokens`);
  if (!tokens.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#999;">Loading trending tokens...</td></tr>';
    return;
  }
  
  tbody.innerHTML = tokens.slice(0, 100).map(token => {
    const symbol = token.symbol || '???';
    const name = token.name || 'Unknown';
    const price = token.jupiterPrice || token.gtPrice || token.dsPrice || 0;
    const mc = token.dsMarketCap || token.dsFdv || 0;
    const liq = Math.max(token.dsLiquidityUsd || 0, token.gtLiquidityUsd || 0);
    const vol24h = token.dsVolumeUsd_24h || token.gtVolumeUsd_24h || 0;
    const change24h = token.dsPriceChange_24h || 0;
    const txns_5m = token.gtTxns_5m || token.dsTxns_5m || 0;
    const score = token.score || 0;
    const tier = token.tier || 'B';
    const pair = `${symbol}/SOL`;
    const logoUrl = token.logoURI || null;
    
    // Calculate age from pool creation date
    let ageText = '-';
    if (token.gtPoolCreatedAt) {
      const createdDate = new Date(token.gtPoolCreatedAt);
      const now = new Date();
      const diffMs = now - createdDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) ageText = `${diffDays}d`;
      else if (diffHours > 0) ageText = `${diffHours}h`;
      else ageText = `${diffMins}m`;
    }
    
    // Format functions
    const fmt = (v) => {
      if (!v || isNaN(v)) return '$0';
      if (v === 0) return '$0';
      if (Math.abs(v) < 0.01) return '$' + v.toExponential(2);
      if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
      if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
      if (v >= 1e3) return '$' + (v / 1e3).toFixed(2) + 'K';
      return '$' + v.toFixed(2);
    };
    
    const fmtPrice = (p) => {
      if (!p || isNaN(p)) return '$0';
      if (p === 0) return '$0';
      if (p < 0.001) return '$' + p.toExponential(2);
      if (p < 0.01) return '$' + p.toFixed(6);
      return '$' + p.toFixed(4);
    };
    
    const tierClass = tier === 'S' ? 'green' : (tier === 'A' ? 'pill' : 'red');
    const tierColor = tier === 'S' ? '#34d399' : (tier === 'A' ? '#fbbf24' : '#f87171');
    const pctClass = change24h >= 0 ? 'green' : 'red';
'@

$newFunction = @'
function renderTrendingTokens() {
  const tbody = document.getElementById('trend-body');
  if (!tbody) {
    console.warn('[RENDER] Table body #trend-body not found');
    return;
  }
  
  const tokens = window.NX?.getTrendingTokens?.() || window.NX?.trendingTokens || [];
  console.log(`[RENDER] Rendering ${tokens.length} tokens`);
  if (!tokens.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#999;">Loading trending tokens...</td></tr>';
    return;
  }
  
  tbody.innerHTML = tokens.slice(0, 100).map(token => {
    const symbol = token.symbol || '???';
    const name = token.name || 'Unknown';
    const price = token.jupiterPrice || token.gtPrice || token.dsPrice || 0;
    const mc = token.dsMarketCap || token.dsFdv || 0;
    const liq = Math.max(token.dsLiquidityUsd || 0, token.gtLiquidityUsd || 0);
    const vol24h = token.dsVolumeUsd_24h || token.gtVolumeUsd_24h || 0;
    const change24h = token.dsPriceChange_24h || 0;
    const txns_5m = token.gtTxns_5m || token.dsTxns_5m || 0;
    const score = token.score || 0;
    const tier = token.tier || 'B';
    const pair = `${symbol}/SOL`;
    const logoUrl = token.logoURI || null;
    
    // Calculate age from pool creation date
    let ageText = '-';
    if (token.gtPoolCreatedAt) {
      const createdDate = new Date(token.gtPoolCreatedAt);
      const now = new Date();
      const diffMs = now - createdDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor(diffMs / (1000 * 60));
      
      if (diffDays > 0) ageText = `${diffDays}d`;
      else if (diffHours > 0) ageText = `${diffHours}h`;
      else ageText = `${diffMins}m`;
    }
    
    // Format functions
    const fmt = (v) => {
      if (!v || isNaN(v)) return '$0';
      if (v === 0) return '$0';
      if (Math.abs(v) < 0.01) return '$' + v.toExponential(2);
      if (v >= 1e9) return '$' + (v / 1e9).toFixed(2) + 'B';
      if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'M';
      if (v >= 1e3) return '$' + (v / 1e3).toFixed(2) + 'K';
      return '$' + v.toFixed(2);
    };
    
    const fmtPrice = (p) => {
      if (!p || isNaN(p)) return '$0';
      if (p === 0) return '$0';
      if (p < 0.001) return '$' + p.toExponential(2);
      if (p < 0.01) return '$' + p.toFixed(6);
      return '$' + p.toFixed(4);
    };
    
    const tierClass = tier === 'S' ? 'green' : (tier === 'A' ? 'pill' : 'red');
    const tierColor = tier === 'S' ? '#34d399' : (tier === 'A' ? '#fbbf24' : '#f87171');
    const pctClass = change24h >= 0 ? 'green' : 'red';
'@

# Find the start and end of the function
$startPattern = 'function renderTrendingTokens\(\) \{'
$endPattern = '^\}\s*$'

# Use regex to replace the function
$regex = "(?s)($startPattern.*?^  \}\s*\}\s*\.join\(''\);\s*\})"
if ($content -match $regex) {
    Write-Host "Pattern matched, replacing function..."
} else {
    Write-Host "Pattern not matched. Trying simpler approach..."
    # Use a line-by-line approach
}

Write-Host "Script ready. Please review the changes needed."

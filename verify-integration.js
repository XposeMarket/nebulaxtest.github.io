#!/usr/bin/env node

/**
 * NebulaX Integration Test Suite
 * Verifies all components are properly configured
 */

const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = {
  'trending-engine.js': 'Trending Engine',
  'Trending.html': 'Trending Page',
  'NewPairs-official.html': 'New Pairs Page',
  'Coinpage-Official.html': 'Coin Details Page',
  'test-apis.html': 'API Test Page'
};

console.log('🔍 NebulaX Integration Verification\n');
console.log('=' .repeat(50));

// Check files exist
console.log('\n1️⃣  File Existence Check');
console.log('-'.repeat(50));

let allFilesExist = true;
Object.entries(files).forEach(([file, name]) => {
  const fullPath = path.join(dir, file);
  const exists = fs.existsSync(fullPath);
  console.log(`${exists ? '✅' : '❌'} ${name.padEnd(30)} (${file})`);
  if (!exists) allFilesExist = false;
});

// Check key code presence
console.log('\n2️⃣  Code Integration Check');
console.log('-'.repeat(50));

const checks = {
  'trending-engine.js': [
    { pattern: /function initTrendingEngine/, name: 'Engine initialization' },
    { pattern: /fetchGeckoTrending/, name: 'GeckoTerminal fetch' },
    { pattern: /enrichWithDexscreener/, name: 'DexScreener enrichment' },
    { pattern: /computeTrendingScore/, name: 'Score computation' },
  ],
  'Trending.html': [
    { pattern: /function renderTrendingTokens/, name: 'Render function' },
    { pattern: /window\.initTrendingEngine/, name: 'Engine initialization' },
    { pattern: /window\.NX\.goToCoin/, name: 'Navigation function' },
    { pattern: /clearWatchlistBtn\.addEventListener/, name: 'Watchlist handler' },
  ],
  'NewPairs-official.html': [
    { pattern: /\/new_pools/, name: 'GeckoTerminal new pools' },
    { pattern: /setInterval.*renderNewTokens/, name: '5-second polling' },
    { pattern: /\[NEW PAIR\]/, name: 'Console logging' },
  ],
  'Coinpage-Official.html': [
    { pattern: /const fmt = /, name: 'Format function' },
    { pattern: /const fmtPrice = /, name: 'Price format function' },
    { pattern: /setInterval.*async/, name: '5-second live update' },
    { pattern: /updateMetricsDisplay/, name: 'Metrics display' },
  ]
};

let allChecksPass = true;
Object.entries(checks).forEach(([file, patterns]) => {
  const fullPath = path.join(dir, file);
  if (!fs.existsSync(fullPath)) return;

  const content = fs.readFileSync(fullPath, 'utf8');
  console.log(`\n📄 ${file}`);
  
  patterns.forEach(({ pattern, name }) => {
    const pass = pattern.test(content);
    console.log(`  ${pass ? '✅' : '❌'} ${name}`);
    if (!pass) allChecksPass = false;
  });
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('3️⃣  Summary');
console.log('-'.repeat(50));

const allPass = allFilesExist && allChecksPass;
console.log(`Files:              ${allFilesExist ? '✅ All present' : '❌ Missing files'}`);
console.log(`Code Integration:   ${allChecksPass ? '✅ All checks pass' : '❌ Some checks failed'}`);
console.log(`Overall Status:     ${allPass ? '✅ READY FOR PRODUCTION' : '❌ NEEDS FIXES'}\n`);

process.exit(allPass ? 0 : 1);

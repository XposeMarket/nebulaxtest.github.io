# Vercel Deployment Guide for Jupiter API Proxy

## Problem
GitHub Pages blocks cross-origin requests to Jupiter API. Public CORS proxies (corsproxy.io, allorigins.win) can be unreliable.

## Solution: Deploy on Vercel with Serverless API Routes

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Create Project Structure
```
NebulaX-Vercel/
├── api/
│   └── jupiter.js         # Serverless function
├── public/
│   ├── index.html         # Copy from NebulaX-Dev
│   ├── Coinpage-Official.html
│   └── assets/
│       ├── nx-wallet.js
│       └── js/
├── vercel.json            # Configuration
└── package.json
```

### 3. Create API Route: `api/jupiter.js`
```javascript
// api/jupiter.js - Serverless function to proxy Jupiter API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const { endpoint, method = 'GET', body } = req.method === 'GET' ? req.query : req.body;
  
  try {
    const url = `https://quote-api.jup.ag/v6/${endpoint}`;
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (method === 'POST' && body) {
      options.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('Jupiter proxy error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

### 4. Create `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ]
}
```

### 5. Create `package.json`
```json
{
  "name": "nebulax",
  "version": "1.0.0",
  "type": "module",
  "dependencies": {
    "node-fetch": "^3.3.2"
  }
}
```

### 6. Update `Coinpage-Official.html`
```javascript
// Replace this:
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// With this:
const USE_VERCEL_PROXY = true; // Toggle for testing
const JUPITER_PROXY = USE_VERCEL_PROXY 
  ? '/api/jupiter'  // Vercel serverless function
  : 'https://api.allorigins.win/raw?url='; // Fallback

// Update fetchQuote:
async function fetchQuote(inputMint, outputMint, amount, decimals, retries = 2) {
  try {
    if (USE_VERCEL_PROXY) {
      // Use Vercel API route
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: (amount * Math.pow(10, decimals)).toString(),
        slippageBps: '50'
      });
      
      const response = await fetch(`${JUPITER_PROXY}?endpoint=quote&${params}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`Quote failed: ${response.status}`);
      return data;
    } else {
      // Use public CORS proxy (fallback)
      const url = `${JUPITER_QUOTE_API}?${params}`;
      const proxyUrl = `${JUPITER_PROXY}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      return await response.json();
    }
  } catch (error) {
    console.error('[Jupiter] Quote error:', error);
    // Retry logic...
  }
}

// Update getSwapTransaction:
async function getSwapTransaction(quote, userPublicKey) {
  if (USE_VERCEL_PROXY) {
    const response = await fetch(`${JUPITER_PROXY}?endpoint=swap&method=POST`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        body: {
          quoteResponse: quote,
          userPublicKey: userPublicKey.toString(),
          wrapAndUnwrapSol: true,
          dynamicComputeUnitLimit: true,
          prioritizationFeeLamports: 'auto'
        }
      })
    });
    
    const { swapTransaction } = await response.json();
    return swapTransaction;
  } else {
    // Existing CORS proxy code...
  }
}
```

### 7. Deploy to Vercel
```bash
cd NebulaX-Vercel
vercel login
vercel --prod
```

## Benefits of Vercel Deployment
- ✅ No CORS issues (your API, your rules)
- ✅ Serverless = auto-scaling, no server management
- ✅ Free tier: 100GB bandwidth, 100 serverless function invocations per day
- ✅ Automatic HTTPS
- ✅ Can add custom domain: `app.nebulax.io`
- ✅ Environment variables for API keys
- ✅ Build optimization and caching

## Alternative: Cloudflare Workers
Similar approach but uses Cloudflare's edge network:
```javascript
// worker.js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const jupiterUrl = `https://quote-api.jup.ag${url.pathname}${url.search}`;
    
    const response = await fetch(jupiterUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
    
    const newResponse = new Response(response.body, response);
    newResponse.headers.set('Access-Control-Allow-Origin', '*');
    return newResponse;
  }
}
```

## Testing Locally
```bash
# Install Vercel CLI
npm install -g vercel

# Run local dev server
cd NebulaX-Vercel
vercel dev

# Test API: http://localhost:3000/api/jupiter?endpoint=quote&inputMint=...
```

## Notes
- Current solution (allorigins.win) should work for now
- Vercel deployment recommended for production
- Can keep GitHub Pages for static content, use Vercel just for API proxy
- Free tier sufficient for ~1000 users/day

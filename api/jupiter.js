// Vercel Serverless Function to proxy Jupiter API
// Deploy location: /api/jupiter.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { method = 'GET', body } = req.body || {};
    const { endpoint, ...queryParams } = req.query;
    
    // Build Jupiter API URL
    let jupiterUrl = `https://quote-api.jup.ag/v6/${endpoint || 'quote'}`;
    
    // Add query parameters for GET requests
    if (method === 'GET' && Object.keys(queryParams).length > 0) {
      const params = new URLSearchParams(queryParams);
      jupiterUrl += `?${params}`;
    }
    
    console.log('[Jupiter Proxy]', method, jupiterUrl);
    
    // Proxy request to Jupiter
    const options = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (method === 'POST' && body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(jupiterUrl, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('[Jupiter Proxy] Error:', response.status, data);
      return res.status(response.status).json({ 
        error: data,
        message: `Jupiter API returned ${response.status}`
      });
    }
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('[Jupiter Proxy] Exception:', error);
    return res.status(500).json({ 
      error: error.message,
      message: 'Internal proxy error'
    });
  }
}

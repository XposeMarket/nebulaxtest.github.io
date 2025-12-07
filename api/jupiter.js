// Vercel Serverless Function to proxy Jupiter API
import https from 'https';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const { endpoint = 'quote', ...queryParams } = req.query;
    
    // Build query string
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (key !== 'endpoint') params.append(key, value);
    }
    
    const path = `/v6/${endpoint}${params.toString() ? '?' + params.toString() : ''}`;
    
    console.log('[Jupiter Proxy] GET', path);
    
    // Use https module for reliability
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'public.jupiter-ag.workers.dev',
        port: 443,
        path: `/v6/${endpoint}${params.toString() ? '?' + params.toString() : ''}`,
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        }
      };
      
      const request = https.request(options, (response) => {
        let body = '';
        response.on('data', chunk => body += chunk);
        response.on('end', () => {
          try {
            resolve({ status: response.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: response.statusCode, data: body });
          }
        });
      });
      
      request.on('error', reject);
      
      if (req.method === 'POST' && req.body) {
        const postBody = req.body.body || req.body;
        request.write(JSON.stringify(postBody));
      }
      
      request.end();
    });
    
    if (data.status !== 200) {
      return res.status(data.status).json({ error: data.data });
    }
    
    return res.status(200).json(data.data);
    
  } catch (error) {
    console.error('[Jupiter Proxy] Error:', error.message);
    return res.status(500).json({ 
      error: error.message,
      message: 'Internal proxy error'
    });
  }
}

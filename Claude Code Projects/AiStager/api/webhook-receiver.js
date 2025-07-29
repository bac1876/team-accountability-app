// Global storage for webhook results
if (!global.webhookResults) {
  global.webhookResults = new Map();
}

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    // Receive webhook from InstantDeco
    const { request_id, status, output } = req.body;
    
    console.log('Webhook received:', { request_id, status, output });
    
    if (request_id) {
      // Store the result
      global.webhookResults.set(request_id, {
        request_id,
        status: status || 'completed',
        output: output ? output.split(',').map(url => url.trim()) : [],
        timestamp: new Date().toISOString()
      });
      
      // Clean up old results (older than 1 hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      for (const [key, value] of global.webhookResults) {
        if (new Date(value.timestamp).getTime() < oneHourAgo) {
          global.webhookResults.delete(key);
        }
      }
    }
    
    return res.status(200).json({ status: 'ok' });
  }

  // GET method - retrieve stored results
  const { request_id } = req.query;
  
  if (!request_id) {
    return res.status(400).json({ error: 'Missing request_id' });
  }

  const result = global.webhookResults.get(request_id);
  
  if (result) {
    return res.status(200).json({
      success: true,
      status: 'completed',
      images: result.output,
      data: result
    });
  }

  return res.status(200).json({
    success: true,
    status: 'processing',
    message: 'No results yet'
  });
}
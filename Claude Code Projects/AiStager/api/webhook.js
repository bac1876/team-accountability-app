module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { request_id, status, output } = req.body;
    
    console.log('Webhook received for request:', request_id);
    
    // Access global staging history
    if (global.stagingHistory) {
      const staging = global.stagingHistory.find(s => s.request_id === request_id);
      
      if (staging) {
        staging.webhook_received = true;
        staging.webhook_timestamp = new Date().toISOString();
        staging.status = status || 'completed';
        
        // Extract output images
        if (output && typeof output === 'string') {
          // Split by comma and clean up URLs
          const images = output.split(',').map(url => url.trim()).filter(Boolean);
          staging.output_images = images;
        }
        
        console.log('Webhook processed successfully:', staging.output_images?.length || 0, 'images');
      }
    }
    
    return res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ status: 'error', message: error.message });
  }
}
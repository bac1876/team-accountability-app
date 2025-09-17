const fetch = require('node-fetch');

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

  const { request_id } = req.method === 'GET' ? req.query : req.body;

  if (!request_id) {
    return res.status(400).json({ success: false, error: 'Missing request_id' });
  }

  try {
    // First check webhook receiver for results
    const webhookCheck = await fetch(`${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}/api/webhook-receiver?request_id=${request_id}`);
    
    if (webhookCheck.ok) {
      const webhookData = await webhookCheck.json();
      if (webhookData.status === 'completed' && webhookData.images && webhookData.images.length > 0) {
        return res.status(200).json({
          success: true,
          status: 'completed',
          images: webhookData.images,
          source: 'webhook'
        });
      }
    }

    // Check if we have stored results for this request
    const staging = global.stagingHistory?.find(s => s.request_id === request_id);
    
    if (staging && staging.output_images && staging.output_images.length > 0) {
      return res.status(200).json({
        success: true,
        status: 'completed',
        images: staging.output_images,
        source: 'memory'
      });
    }

    // Since InstantDeco doesn't support status checking, we can only wait for webhook
    // Return processing status
    return res.status(200).json({
      success: true,
      status: 'processing',
      message: 'Request is still being processed. InstantDeco will send results via webhook when ready.',
      note: 'InstantDeco typically takes 30-60 seconds to process images'
    });

  } catch (error) {
    console.error('Check result error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      status: 'error'
    });
  }
}
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
    // Check if we have stored results for this request
    const staging = global.stagingHistory?.find(s => s.request_id === request_id);
    
    if (staging) {
      if (staging.output_images && staging.output_images.length > 0) {
        // We have results!
        return res.status(200).json({
          success: true,
          status: 'completed',
          images: staging.output_images,
          staging_data: staging
        });
      } else if (staging.status === 'processing') {
        // Still processing
        return res.status(200).json({
          success: true,
          status: 'processing',
          message: 'Still processing, please check again in a few seconds'
        });
      } else if (staging.status === 'failed') {
        // Processing failed
        return res.status(200).json({
          success: false,
          status: 'failed',
          error: staging.error || 'Processing failed'
        });
      }
    }

    // Try to check InstantDeco API directly for status
    const checkUrl = `https://app.instantdeco.ai/api/1.1/wf/check_status?request_id=${request_id}`;
    
    const response = await fetch(checkUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.INSTANTDECO_API_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      
      // Update our stored data if we have results
      if (data.status === 'success' && data.output) {
        if (staging) {
          staging.status = 'completed';
          staging.output_images = data.output.split(',').map(url => url.trim());
        }
        
        return res.status(200).json({
          success: true,
          status: 'completed',
          images: data.output.split(',').map(url => url.trim()),
          raw_response: data
        });
      }
    }

    // Default response - no results yet
    return res.status(200).json({
      success: true,
      status: 'processing',
      message: 'Request is still being processed'
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
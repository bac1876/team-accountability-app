const fetch = require('node-fetch');
const FormData = require('form-data');

// Global storage for webhook results
if (!global.webhookResults) {
  global.webhookResults = new Map();
}

// Helper function to download image and convert to base64
async function downloadImageAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    const buffer = await response.buffer();
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

// Helper function to upload image to ImgBB
async function uploadToImgBB(base64Image) {
  if (!process.env.IMGBB_API_KEY) {
    throw new Error('ImgBB API key not configured');
  }
  
  const formData = new FormData();
  formData.append('key', process.env.IMGBB_API_KEY);
  formData.append('image', base64Image);
  
  const response = await fetch('https://api.imgbb.com/1/upload', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    throw new Error(`ImgBB upload failed: ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.success) {
    throw new Error('ImgBB upload failed');
  }
  
  return data.data.url;
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
    
    if (request_id && output) {
      try {
        // Download the image from InstantDeco's temporary URL
        console.log('Downloading image from InstantDeco URL:', output);
        const base64Image = await downloadImageAsBase64(output);
        
        // Re-upload to ImgBB for permanent storage
        console.log('Re-uploading image to ImgBB for permanent storage...');
        const permanentUrl = await uploadToImgBB(base64Image);
        console.log('Image permanently stored at:', permanentUrl);
        
        // Store the permanent URL instead of the temporary one
        global.webhookResults.set(request_id, {
          request_id,
          status: status || 'completed',
          output: [permanentUrl], // Store permanent URL
          original_url: output, // Keep original for debugging
          timestamp: new Date().toISOString()
        });
        
        console.log('Successfully processed and stored permanent image URL');
      } catch (error) {
        console.error('Error processing image:', error);
        // Fallback: store the original URL if re-hosting fails
        global.webhookResults.set(request_id, {
          request_id,
          status: status || 'completed',
          output: output ? [output] : [],
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
      
      // Clean up old results (older than 1 hour)
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      for (const [key, value] of global.webhookResults) {
        if (new Date(value.timestamp).getTime() < oneHourAgo) {
          global.webhookResults.delete(key);
        }
      }
    } else if (request_id) {
      // No output URL provided
      global.webhookResults.set(request_id, {
        request_id,
        status: status || 'completed',
        output: [],
        timestamp: new Date().toISOString()
      });
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
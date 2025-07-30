const FormData = require('form-data');
const fetch = require('node-fetch');
const rateLimiter = require('./rate-limiter');

const INSTANTDECO_API_URL = 'https://app.instantdeco.ai/api/1.1/wf/request_v2';
const IMGBB_API_URL = 'https://api.imgbb.com/1/upload';

// In-memory storage for staging history (in production, use a database)
const stagingHistory = [];

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

  const {
    image,
    transformation_type = 'furnish',
    space_type = 'interior',
    room_type = 'living_room',
    design_style = 'modern',
    update_flooring = false,
    block_decorative = true
  } = req.body;

  if (!image) {
    return res.status(400).json({ success: false, error: 'Missing image data' });
  }

  if (!process.env.INSTANTDECO_API_KEY) {
    return res.status(500).json({ success: false, error: 'InstantDecoAI API key not configured' });
  }

  try {
    // Check rate limit first
    const rateCheck = rateLimiter.canMakeRequest();
    if (!rateCheck.allowed) {
      return res.status(429).json({ 
        success: false, 
        error: rateCheck.message,
        retryAfter: rateCheck.waitTime
      });
    }
    
    let imageUrl;
    
    // Check if image is already a URL (faster processing)
    if (image.startsWith('http://') || image.startsWith('https://')) {
      imageUrl = image;
      console.log('Using direct URL, skipping upload');
    } else {
      // Extract base64 data
      const base64Data = image.includes(',') ? image.split(',')[1] : image;
      
      // Upload to ImgBB first
      if (!process.env.IMGBB_API_KEY) {
        return res.status(500).json({ success: false, error: 'ImgBB API key not configured' });
      }
      
      const formData = new FormData();
      formData.append('key', process.env.IMGBB_API_KEY);
      formData.append('image', base64Data);
      
      const imgbbResponse = await fetch(IMGBB_API_URL, {
        method: 'POST',
        body: formData
      });
      
      if (!imgbbResponse.ok) {
        throw new Error('Failed to upload image to ImgBB');
      }
      
      const imgbbData = await imgbbResponse.json();
      if (!imgbbData.success) {
        throw new Error('ImgBB upload failed');
      }
      
      imageUrl = imgbbData.data.url;
    }
    
    // Get webhook URL (using Vercel function URL)
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const webhookUrl = `${protocol}://${host}/api/webhook-receiver`;
    
    // Prepare InstantDecoAI payload - ORDER MATTERS per API docs
    const payload = {
      design: design_style || 'modern',
      room_type: room_type || 'living_room',
      transformation_type,
      img_url: imageUrl,
      webhook_url: webhookUrl,
      num_images: 1
    };
    
    // Log the actual room type being used
    console.log(`Using room_type: ${payload.room_type}, design: ${payload.design}`);
    
    // Build block_element list
    const blockElements = ['wall', 'ceiling', 'windowpane', 'door'];
    
    // Add floor to block list if not updating flooring
    if (!update_flooring && transformation_type !== 'outdoor') {
      blockElements.push('floor');
    }
    
    // Add decorative elements to block list if requested
    if (block_decorative) {
      blockElements.push('animal', 'plant', 'vase', 'basket');
    }
    
    // For outdoor, add outdoor-specific blocks
    if (transformation_type === 'outdoor') {
      blockElements.push('sky', 'house', 'building', 'tree', 'car');
    }
    
    // Add block_element after the main payload is constructed
    payload.block_element = blockElements.join(',');
    
    // Add high_details_resolution for better quality on low-res images
    if (transformation_type === 'furnish' || transformation_type === 'renovate' || transformation_type === 'redesign') {
      payload.high_details_resolution = true;
    }
    
    // Call InstantDecoAI
    console.log('Calling InstantDeco API with payload:', JSON.stringify(payload, null, 2));
    console.log('Using API Key:', process.env.INSTANTDECO_API_KEY ? `${process.env.INSTANTDECO_API_KEY.substring(0, 10)}...` : 'NOT SET');
    
    const response = await fetch(INSTANTDECO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INSTANTDECO_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log('InstantDeco API response status:', response.status);
    console.log('Response headers:', response.headers);
    
    let responseText;
    try {
      responseText = await response.text();
      console.log('InstantDeco API response:', responseText);
    } catch (textError) {
      console.error('Error reading response text:', textError);
      throw new Error('Failed to read API response');
    }
    
    if (response.ok) {
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', e);
        console.error('Raw response:', responseText);
        // Return a more specific error message
        if (responseText.includes('Request Ent')) {
          throw new Error('InstantDeco API authentication failed. Please check API key.');
        }
        throw new Error('Invalid response from InstantDeco API');
      }
      
      if (result.status === 'success' && result.response?.status === 'success') {
        const requestId = result.response?.request_id;
        
        // Store in history
        const staging = {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          transformation_type,
          space_type,
          room_type,
          design_style,
          update_flooring,
          block_decorative,
          status: 'processing',
          webhook_received: false,
          input_image: imageUrl
        };
        
        stagingHistory.push(staging);
        
        // Store in global for webhook access
        if (!global.stagingHistory) {
          global.stagingHistory = [];
        }
        global.stagingHistory.push(staging);
        
        // Record successful request for rate limiting
        rateLimiter.recordRequest();
        
        return res.status(200).json({
          success: true,
          request_id: requestId,
          webhook_url: webhookUrl,
          message: 'Staging request submitted successfully!'
        });
      } else if (result.response?.message === 'Wrong request') {
        console.error('InstantDeco API: Wrong request');
        console.error('Full result:', JSON.stringify(result, null, 2));
        throw new Error('Invalid request format. Please try again.');
      } else if (result.response?.message === 'Wrong API Key') {
        console.error('InstantDeco API: Wrong API Key');
        throw new Error('API authentication failed. Please contact support.');
      } else {
        console.error('InstantDeco API returned non-success status:', result);
        throw new Error(result.response?.message || result.message || 'InstantDeco API request failed');
      }
    } else {
      console.error('InstantDeco API HTTP error:', response.status, responseText);
      // Check if response is HTML (authentication page)
      if (responseText.includes('<!doctype html>') || responseText.includes('Request Ent')) {
        throw new Error('InstantDeco API authentication failed. Please check API key.');
      }
      // Truncate long error messages
      const errorMsg = responseText.length > 200 ? responseText.substring(0, 200) + '...' : responseText;
      throw new Error(`InstantDeco API error: ${response.status} - ${errorMsg}`);
    }
    
  } catch (error) {
    console.error('Stage room error:', error);
    console.error('Error stack:', error.stack);
    
    // If error message suggests JSON parsing issue, provide more context
    if (error.message.includes('JSON') || error.message.includes('token')) {
      return res.status(500).json({ 
        success: false, 
        error: 'Service temporarily unavailable. Please try again in a moment.',
        details: error.message
      });
    }
    
    return res.status(500).json({ success: false, error: error.message });
  }
}
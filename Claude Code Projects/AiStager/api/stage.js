const FormData = require('form-data');
const fetch = require('node-fetch');

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
    const webhookUrl = `${protocol}://${host}/api/webhook`;
    
    // Prepare InstantDecoAI payload
    const payload = {
      transformation_type,
      img_url: imageUrl,
      num_images: 1,
      webhook_url: webhookUrl
    };
    
    // Add parameters based on transformation type
    if (['furnish', 'redesign', 'outdoor'].includes(transformation_type)) {
      payload.room_type = room_type;
      payload.design = design_style;
      
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
      
      payload.block_element = blockElements.join(',');
    }
    
    // Call InstantDecoAI
    const response = await fetch(INSTANTDECO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.INSTANTDECO_API_KEY}`
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.json();
      if (result.status === 'success') {
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
        
        return res.status(200).json({
          success: true,
          request_id: requestId,
          webhook_url: webhookUrl,
          message: 'Staging request submitted successfully!'
        });
      }
    }
    
    throw new Error('InstantDecoAI API error');
    
  } catch (error) {
    console.error('Stage room error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
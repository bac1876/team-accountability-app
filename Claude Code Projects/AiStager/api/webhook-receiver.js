const fetch = require('node-fetch');
const FormData = require('form-data');
const sharp = require('sharp');

// Global storage for webhook results
if (!global.webhookResults) {
  global.webhookResults = new Map();
}

// Helper function to download image as buffer
async function downloadImageAsBuffer(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }
    const buffer = await response.buffer();
    return buffer;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}

// Helper function to compress image
async function compressImage(buffer, quality = 85, maxWidth = 2048) {
  try {
    // Get image metadata
    const metadata = await sharp(buffer).metadata();
    
    console.log(`Original image: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
    
    // Prepare sharp instance
    let sharpInstance = sharp(buffer);
    
    // Resize if wider than maxWidth while maintaining aspect ratio
    if (metadata.width > maxWidth) {
      sharpInstance = sharpInstance.resize(maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside'
      });
      console.log(`Resizing to max width: ${maxWidth}px`);
    }
    
    // Compress to JPEG with specified quality
    const compressedBuffer = await sharpInstance
      .jpeg({
        quality: quality,
        progressive: true, // Progressive JPEG for better loading
        mozjpeg: true // Use mozjpeg encoder for better compression
      })
      .toBuffer();
    
    // Log compression results
    const originalSize = buffer.length;
    const compressedSize = compressedBuffer.length;
    const reduction = Math.round((1 - compressedSize / originalSize) * 100);
    console.log(`Compression: ${Math.round(originalSize/1024)}KB → ${Math.round(compressedSize/1024)}KB (${reduction}% reduction)`);
    
    return compressedBuffer;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original buffer if compression fails
    return buffer;
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
        const imageBuffer = await downloadImageAsBuffer(output);
        
        // Compress the image before uploading
        console.log('Compressing image to reduce file size...');
        const compressedBuffer = await compressImage(imageBuffer, 85, 2048);
        
        // Convert compressed image to base64
        const base64Image = compressedBuffer.toString('base64');
        
        // Re-upload to ImgBB for permanent storage
        console.log('Uploading compressed image to ImgBB for permanent storage...');
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
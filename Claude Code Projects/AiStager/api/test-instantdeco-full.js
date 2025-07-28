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

  const apiKey = process.env.INSTANTDECO_API_KEY;
  const testImageUrl = "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800";
  
  // Test 1: Minimal valid request with Bearer auth
  let minimalTest = { attempted: false };
  if (apiKey) {
    try {
      const minimalPayload = {
        transformation_type: "furnish",
        img_url: testImageUrl,
        num_images: 1,
        webhook_url: "https://webhook.site/test"
      };
      
      const minimalResponse = await fetch('https://app.instantdeco.ai/api/1.1/wf/request_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(minimalPayload)
      });
      
      minimalTest = {
        attempted: true,
        status: minimalResponse.status,
        statusText: minimalResponse.statusText,
        response: await minimalResponse.text()
      };
    } catch (error) {
      minimalTest = {
        attempted: true,
        error: error.message
      };
    }
  }

  // Test 2: Complete request with all parameters
  let completeTest = { attempted: false };
  if (apiKey) {
    try {
      const completePayload = {
        transformation_type: "furnish",
        img_url: testImageUrl,
        num_images: 1,
        webhook_url: "https://webhook.site/test",
        room_type: "living_room",
        design: "modern",
        block_element: "wall,ceiling,windowpane,door,floor"
      };
      
      const completeResponse = await fetch('https://app.instantdeco.ai/api/1.1/wf/request_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(completePayload)
      });
      
      completeTest = {
        attempted: true,
        status: completeResponse.status,
        statusText: completeResponse.statusText,
        response: await completeResponse.text()
      };
    } catch (error) {
      completeTest = {
        attempted: true,
        error: error.message
      };
    }
  }

  // Test 3: Check if API key should be in header differently
  let headerVariantTest = { attempted: false };
  if (apiKey) {
    try {
      const testPayload = {
        transformation_type: "furnish",
        img_url: testImageUrl,
        num_images: 1,
        webhook_url: "https://webhook.site/test"
      };
      
      const headerResponse = await fetch('https://app.instantdeco.ai/api/1.1/wf/request_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
          'x-api-key': apiKey
        },
        body: JSON.stringify(testPayload)
      });
      
      headerVariantTest = {
        attempted: true,
        status: headerResponse.status,
        statusText: headerResponse.statusText,
        response: await headerResponse.text()
      };
    } catch (error) {
      headerVariantTest = {
        attempted: true,
        error: error.message
      };
    }
  }

  res.status(200).json({
    apiKey: {
      exists: !!apiKey,
      length: apiKey ? apiKey.length : 0,
      format: apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : 'N/A'
    },
    minimalTest,
    completeTest,
    headerVariantTest,
    analysis: "Check which test gives the best response"
  });
}
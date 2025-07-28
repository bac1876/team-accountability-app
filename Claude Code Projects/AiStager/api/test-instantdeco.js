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
  
  // Test 1: Check API key format
  const apiKeyInfo = {
    exists: !!apiKey,
    length: apiKey ? apiKey.length : 0,
    format: apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : 'N/A',
    containsInvalidChars: apiKey ? /[^\x20-\x7E]/.test(apiKey) : false
  };

  // Test 2: Try Bearer authentication
  let bearerTest = { attempted: false };
  if (apiKey) {
    try {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString()
      };
      
      const bearerResponse = await fetch('https://app.instantdeco.ai/api/1.1/wf/request_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(testPayload)
      });
      
      bearerTest = {
        attempted: true,
        status: bearerResponse.status,
        statusText: bearerResponse.statusText,
        response: await bearerResponse.text()
      };
    } catch (error) {
      bearerTest = {
        attempted: true,
        error: error.message
      };
    }
  }

  // Test 3: Try API key in body
  let bodyTest = { attempted: false };
  if (apiKey) {
    try {
      const testPayload = {
        api_key: apiKey,
        test: true,
        timestamp: new Date().toISOString()
      };
      
      const bodyResponse = await fetch('https://app.instantdeco.ai/api/1.1/wf/request_v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      });
      
      bodyTest = {
        attempted: true,
        status: bodyResponse.status,
        statusText: bodyResponse.statusText,
        response: await bodyResponse.text()
      };
    } catch (error) {
      bodyTest = {
        attempted: true,
        error: error.message
      };
    }
  }

  res.status(200).json({
    apiKeyInfo,
    bearerTest,
    bodyTest,
    recommendation: 'Check the response to see which authentication method works'
  });
}
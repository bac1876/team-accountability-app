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

  const { request_id } = req.query;
  const apiKey = process.env.INSTANTDECO_API_KEY;

  // Test different status check endpoints
  const tests = [];

  // Test 1: Try check_status endpoint
  try {
    const url1 = `https://app.instantdeco.ai/api/1.1/wf/check_status?request_id=${request_id || 'test123'}`;
    const response1 = await fetch(url1, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    tests.push({
      endpoint: 'check_status',
      url: url1,
      status: response1.status,
      response: await response1.text()
    });
  } catch (error) {
    tests.push({
      endpoint: 'check_status',
      error: error.message
    });
  }

  // Test 2: Try get_result endpoint
  try {
    const url2 = `https://app.instantdeco.ai/api/1.1/wf/get_result?request_id=${request_id || 'test123'}`;
    const response2 = await fetch(url2, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    tests.push({
      endpoint: 'get_result',
      url: url2,
      status: response2.status,
      response: await response2.text()
    });
  } catch (error) {
    tests.push({
      endpoint: 'get_result',
      error: error.message
    });
  }

  // Test 3: Try status endpoint
  try {
    const url3 = `https://app.instantdeco.ai/api/1.1/wf/status/${request_id || 'test123'}`;
    const response3 = await fetch(url3, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    tests.push({
      endpoint: 'status',
      url: url3,
      status: response3.status,
      response: await response3.text()
    });
  } catch (error) {
    tests.push({
      endpoint: 'status',
      error: error.message
    });
  }

  res.status(200).json({
    message: 'Testing different status check endpoints',
    request_id: request_id || 'test123',
    tests
  });
}
module.exports = function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  res.status(200).json({
    status: 'healthy',
    instantdeco_configured: !!process.env.INSTANTDECO_API_KEY,
    imgbb_configured: !!process.env.IMGBB_API_KEY,
    webhook_ready: false, // No ngrok in production
    webhook_url: null,
    environment: 'production'
  });
}
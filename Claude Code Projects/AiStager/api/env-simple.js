// Simple test without any imports
module.exports = function handler(req, res) {
  res.status(200).json({
    instantdeco: process.env.INSTANTDECO_API_KEY ? 'Found' : 'Not Found',
    imgbb: process.env.IMGBB_API_KEY ? 'Found' : 'Not Found',
    vercelEnv: process.env.VERCEL_ENV || 'Not Set',
    nodeEnv: process.env.NODE_ENV || 'Not Set'
  });
}
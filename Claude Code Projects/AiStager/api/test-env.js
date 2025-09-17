module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  const instantdecoKey = process.env.INSTANTDECO_API_KEY;
  const imgbbKey = process.env.IMGBB_API_KEY;
  
  return res.status(200).json({
    instantdeco_configured: !!instantdecoKey,
    instantdeco_preview: instantdecoKey ? `${instantdecoKey.substring(0, 10)}...` : 'NOT SET',
    imgbb_configured: !!imgbbKey,
    imgbb_preview: imgbbKey ? `${imgbbKey.substring(0, 10)}...` : 'NOT SET',
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV
  });
}
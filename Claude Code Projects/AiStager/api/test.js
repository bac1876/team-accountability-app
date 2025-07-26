module.exports = function handler(req, res) {
  res.status(200).json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    env_check: {
      has_instantdeco_key: !!process.env.INSTANTDECO_API_KEY,
      has_imgbb_key: !!process.env.IMGBB_API_KEY
    }
  });
}
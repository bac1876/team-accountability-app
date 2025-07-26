module.exports = function handler(req, res) {
  // List all env vars that start with VERCEL_ or contain API
  const envVars = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith('VERCEL_') || key.includes('API') || key.includes('INSTANTDECO') || key.includes('IMGBB')) {
      envVars[key] = value ? `${value.substring(0, 5)}...` : 'undefined';
    }
  }
  
  res.status(200).json({
    envVars: envVars,
    hasInstantDeco: !!process.env.INSTANTDECO_API_KEY,
    hasImgBB: !!process.env.IMGBB_API_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV
  });
}
module.exports = function handler(req, res) {
  // Test with a simple environment variable
  const testValue = process.env.INSTANTDECO_API_KEY || 'NOT_FOUND';
  const imgbbValue = process.env.IMGBB_API_KEY || 'NOT_FOUND';
  
  // Also test if we can set and read a variable
  process.env.TEST_VAR = 'test123';
  
  res.status(200).json({
    instantdeco: testValue.substring(0, 10) + '...',
    imgbb: imgbbValue.substring(0, 10) + '...',
    testVar: process.env.TEST_VAR,
    nodeVersion: process.version,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('INSTANT') || k.includes('IMGBB')),
    vercelEnv: process.env.VERCEL_ENV,
    isProduction: process.env.VERCEL_ENV === 'production'
  });
}
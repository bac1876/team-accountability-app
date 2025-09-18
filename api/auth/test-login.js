// Test login endpoint without database dependency
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    // Hardcoded test user
    if (email === 'bob@searchnwa.com' && password === 'pass123') {
      return res.status(200).json({
        success: true,
        user: {
          id: '1',
          email: 'bob@searchnwa.com',
          name: 'Bob',
          role: 'member'
        }
      })
    }

    return res.status(401).json({ error: 'Invalid email or password' })
  } catch (error) {
    console.error('Test login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
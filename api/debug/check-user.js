// Debug endpoint to check if a user exists
import { userQueries } from '../lib/database.js'

export default async function handler(req, res) {
  const { email } = req.query

  if (!email) {
    return res.status(400).json({ error: 'Email parameter required' })
  }

  try {
    const user = await userQueries.getByEmail(email.toLowerCase())

    if (user) {
      // Don't show password in response
      const { password, ...userInfo } = user
      res.status(200).json({
        found: true,
        user: userInfo
      })
    } else {
      res.status(200).json({
        found: false,
        message: `No user found with email: ${email}`
      })
    }
  } catch (error) {
    console.error('Error checking user:', error)
    res.status(500).json({
      error: 'Failed to check user',
      details: error.message
    })
  }
}
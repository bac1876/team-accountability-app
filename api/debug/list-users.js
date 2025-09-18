// Debug endpoint to list all users
import { userQueries } from '../lib/database.js'

export default async function handler(req, res) {
  // Require secret for security
  const { secret } = req.query

  if (secret !== 'debug-2025') {
    return res.status(403).json({ error: 'Forbidden - secret required' })
  }

  try {
    const users = await userQueries.getAll()

    // Remove passwords from response
    const safeUsers = users.map(user => {
      const { password, ...userInfo } = user
      return userInfo
    })

    res.status(200).json({
      count: safeUsers.length,
      users: safeUsers
    })
  } catch (error) {
    console.error('Error listing users:', error)
    res.status(500).json({
      error: 'Failed to list users',
      details: error.message
    })
  }
}
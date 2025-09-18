// API endpoint to list all users (admin only)
import { userQueries } from '../lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const users = await userQueries.getAll()

    // Remove passwords from response
    const safeUsers = users.map(user => {
      const { password, ...userInfo } = user
      return userInfo
    })

    res.status(200).json({
      success: true,
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
// API endpoint to delete user (admin only)
import { userQueries } from '../lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    const deletedUser = await userQueries.delete(userId)

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({
      error: 'Failed to delete user',
      details: error.message
    })
  }
}
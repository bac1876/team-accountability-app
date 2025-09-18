// API endpoint to reset all team member passwords to pass123
import { userQueries } from '../lib/database.js'

export default async function handler(req, res) {
  // Require secret for security
  const { secret } = req.query

  if (secret !== 'reset-passwords-2025') {
    return res.status(403).json({ error: 'Forbidden - secret required' })
  }

  try {
    // Get all users
    const users = await userQueries.getAll()

    // Filter out Brian (admin) and update everyone else
    const updates = []
    for (const user of users) {
      if (user.email !== 'brian@searchnwa.com') {
        try {
          const updated = await userQueries.update(user.id, {
            email: user.email,
            password: 'pass123',
            name: user.name,
            phone: user.phone || '',
            role: user.role || 'member'
          })
          updates.push({
            email: user.email,
            name: user.name,
            status: 'updated'
          })
        } catch (error) {
          updates.push({
            email: user.email,
            name: user.name,
            status: 'failed',
            error: error.message
          })
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated ${updates.filter(u => u.status === 'updated').length} user passwords`,
      updates
    })
  } catch (error) {
    console.error('Error resetting passwords:', error)
    res.status(500).json({
      error: 'Failed to reset passwords',
      details: error.message
    })
  }
}
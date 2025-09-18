// API endpoint to fix Brian's password
import { userQueries } from '../lib/database.js'

export default async function handler(req, res) {
  // Require secret for security
  const { secret } = req.query

  if (secret !== 'fix-brian-2025') {
    return res.status(403).json({ error: 'Forbidden - secret required' })
  }

  try {
    // Get Brian's user
    const brian = await userQueries.getByEmail('brian@searchnwa.com')

    if (!brian) {
      return res.status(404).json({ error: 'Brian user not found' })
    }

    // Update password to the correct one
    const updated = await userQueries.update(brian.id, {
      email: brian.email,
      password: 'Lbbc#2245',
      name: brian.name,
      phone: brian.phone || '',
      role: 'admin'
    })

    res.status(200).json({
      success: true,
      message: 'Brian password updated to Lbbc#2245',
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role
      }
    })
  } catch (error) {
    console.error('Error updating Brian password:', error)
    res.status(500).json({
      error: 'Failed to update password',
      details: error.message
    })
  }
}
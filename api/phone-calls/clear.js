import { query } from '../../../src/lib/database.js'

export default async function handler(req, res) {
  const { method } = req

  if (method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE'])
    return res.status(405).json({ error: `Method ${method} not allowed` })
  }

  try {
    // Get Brian's user ID
    const userResult = await query(
      `SELECT id FROM users WHERE email = $1`,
      ['brian@searchnwa.com']
    )

    if (!userResult.rows.length) {
      return res.status(404).json({ error: 'Brian user not found' })
    }

    const userId = userResult.rows[0].id

    // Clear all phone call data for Brian
    const result = await query(
      `DELETE FROM phone_calls WHERE user_id = $1 RETURNING *`,
      [userId]
    )

    return res.status(200).json({
      success: true,
      message: `Cleared ${result.rows.length} phone call records for Brian`,
      deleted: result.rows
    })
  } catch (error) {
    console.error('Error clearing phone data:', error)
    return res.status(500).json({ error: 'Failed to clear phone data' })
  }
}
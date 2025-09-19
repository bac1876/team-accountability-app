import { query } from '../../../src/lib/database.js'

export default async function handler(req, res) {
  const { method } = req

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST'])
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

    // Insert phone call data for Sept 17 and 18 with 50+ calls each
    const phoneData = [
      { date: '2025-09-17', target: 50, actual: 55, notes: 'Great calling day!' },
      { date: '2025-09-18', target: 50, actual: 52, notes: 'Another productive day!' }
    ]

    const results = []
    for (const data of phoneData) {
      const result = await query(
        `INSERT INTO phone_calls (user_id, call_date, target_calls, actual_calls, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, call_date)
         DO UPDATE SET
           target_calls = EXCLUDED.target_calls,
           actual_calls = EXCLUDED.actual_calls,
           notes = EXCLUDED.notes,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, data.date, data.target, data.actual, data.notes]
      )
      results.push(result.rows[0])
    }

    // Verify the data
    const verification = await query(
      `SELECT * FROM phone_calls
       WHERE user_id = $1
       AND call_date >= '2025-09-17'
       AND call_date <= '2025-09-18'
       ORDER BY call_date`,
      [userId]
    )

    return res.status(200).json({
      success: true,
      message: 'Phone call data successfully inserted for Brian',
      inserted: results,
      verified: verification.rows
    })
  } catch (error) {
    console.error('Error seeding phone data:', error)
    return res.status(500).json({ error: 'Failed to seed phone data' })
  }
}
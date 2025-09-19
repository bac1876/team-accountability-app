import { query } from '../../src/lib/database.js'

export default async function handler(req, res) {
  const { method } = req

  if (method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).json({ error: `Method ${method} not allowed` })
  }

  const { userId, phoneCallData } = req.body

  if (!userId || !phoneCallData) {
    return res.status(400).json({ error: 'User ID and phone call data are required' })
  }

  try {
    const results = []

    // Process each phone call entry from localStorage
    for (const entry of phoneCallData) {
      const { date, targetCalls, actualCalls, notes } = entry

      // Skip entries without dates
      if (!date) continue

      // UPSERT logic - insert or update
      const result = await query(
        `INSERT INTO phone_calls (user_id, call_date, target_calls, actual_calls, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, call_date)
         DO UPDATE SET
           target_calls = GREATEST(EXCLUDED.target_calls, phone_calls.target_calls),
           actual_calls = GREATEST(EXCLUDED.actual_calls, phone_calls.actual_calls),
           notes = CASE
             WHEN LENGTH(EXCLUDED.notes) > LENGTH(phone_calls.notes)
             THEN EXCLUDED.notes
             ELSE phone_calls.notes
           END,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, date, targetCalls || 0, actualCalls || 0, notes || '']
      )

      results.push(result.rows[0])
    }

    return res.status(200).json({
      success: true,
      migratedCount: results.length,
      records: results
    })
  } catch (error) {
    console.error('Error migrating phone call data:', error)
    return res.status(500).json({ error: 'Failed to migrate phone call data' })
  }
}
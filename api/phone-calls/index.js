import { query } from '../../src/lib/database.js'

export default async function handler(req, res) {
  const { method } = req

  switch (method) {
    case 'GET':
      // Get phone calls for a user
      const { userId, startDate, endDate } = req.query

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' })
      }

      try {
        let sql = `
          SELECT * FROM phone_calls
          WHERE user_id = $1
        `
        const params = [userId]

        if (startDate && endDate) {
          sql += ` AND call_date >= $2 AND call_date <= $3`
          params.push(startDate, endDate)
        } else if (startDate) {
          sql += ` AND call_date >= $2`
          params.push(startDate)
        }

        sql += ` ORDER BY call_date DESC`

        const result = await query(sql, params)
        return res.status(200).json(result.rows || [])
      } catch (error) {
        console.error('Error fetching phone calls:', error)
        return res.status(500).json({ error: 'Failed to fetch phone calls' })
      }

    case 'POST':
      // Create or update phone call record
      const { user_id, call_date, target_calls, actual_calls, notes } = req.body

      if (!user_id || !call_date) {
        return res.status(400).json({ error: 'User ID and date are required' })
      }

      try {
        // Use UPSERT to create or update
        // Important: Use null for unset values, not 0
        const result = await query(
          `INSERT INTO phone_calls (user_id, call_date, target_calls, actual_calls, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, call_date)
           DO UPDATE SET
             target_calls = CASE WHEN $3 IS NOT NULL THEN $3 ELSE phone_calls.target_calls END,
             actual_calls = CASE WHEN $4 IS NOT NULL THEN $4 ELSE phone_calls.actual_calls END,
             notes = CASE WHEN $5 IS NOT NULL THEN $5 ELSE phone_calls.notes END,
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [user_id, call_date,
           target_calls !== undefined && target_calls !== null ? target_calls : null,
           actual_calls !== undefined && actual_calls !== null ? actual_calls : null,
           notes || null]
        )

        return res.status(200).json(result.rows[0])
      } catch (error) {
        console.error('Error saving phone call:', error)
        return res.status(500).json({ error: 'Failed to save phone call' })
      }

    case 'PUT':
      // Update phone call goal or actual calls
      const { id: updateId } = req.query
      const updateData = req.body

      if (!updateId) {
        return res.status(400).json({ error: 'Phone call ID is required' })
      }

      try {
        const updates = []
        const values = []
        let paramCount = 1

        if (updateData.target_calls !== undefined) {
          updates.push(`target_calls = $${paramCount++}`)
          values.push(updateData.target_calls)
        }

        if (updateData.actual_calls !== undefined) {
          updates.push(`actual_calls = $${paramCount++}`)
          values.push(updateData.actual_calls)
        }

        if (updateData.notes !== undefined) {
          updates.push(`notes = $${paramCount++}`)
          values.push(updateData.notes)
        }

        if (updates.length === 0) {
          return res.status(400).json({ error: 'No update data provided' })
        }

        updates.push(`updated_at = CURRENT_TIMESTAMP`)
        values.push(updateId)

        const result = await query(
          `UPDATE phone_calls SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`,
          values
        )

        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'Phone call record not found' })
        }

        return res.status(200).json(result.rows[0])
      } catch (error) {
        console.error('Error updating phone call:', error)
        return res.status(500).json({ error: 'Failed to update phone call' })
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT'])
      return res.status(405).json({ error: `Method ${method} not allowed` })
  }
}// Force deployment

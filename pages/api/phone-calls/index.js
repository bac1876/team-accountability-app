import { query } from '../../../src/lib/database.js'

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
        const result = await query(
          `INSERT INTO phone_calls (user_id, call_date, target_calls, actual_calls, notes, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id, call_date)
           DO UPDATE SET
             target_calls = COALESCE($3, phone_calls.target_calls),
             actual_calls = COALESCE($4, phone_calls.actual_calls),
             notes = COALESCE($5, phone_calls.notes),
             updated_at = CURRENT_TIMESTAMP
           RETURNING *`,
          [user_id, call_date, target_calls || 0, actual_calls || 0, notes || '']
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

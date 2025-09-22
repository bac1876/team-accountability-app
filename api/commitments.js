import { query } from '../src/lib/database.js'

export default async function handler(req, res) {
  const { method } = req

  if (method === 'GET') {
    const { userId, date, isAdmin } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' })
    }

    try {
      let commitments
      if (date) {
        // Get commitments for specific date
        commitments = await query(
          `SELECT * FROM daily_commitments
           WHERE user_id = $1 AND commitment_date = $2
           ORDER BY created_at DESC`,
          [userId, date]
        )
      } else {
        // Apply date filtering based on user role
        const today = new Date()
        let dateFilter = ''
        let queryParams = [userId]

        if (isAdmin === 'true') {
          // Admin users can see up to 6 months of data
          const sixMonthsAgo = new Date()
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
          dateFilter = ' AND commitment_date >= $2'
          queryParams.push(sixMonthsAgo.toISOString().split('T')[0])
        } else {
          // Regular users see only last 7 days
          const sevenDaysAgo = new Date()
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
          dateFilter = ' AND commitment_date >= $2'
          queryParams.push(sevenDaysAgo.toISOString().split('T')[0])
        }

        // Get commitments with date filter
        commitments = await query(
          `SELECT * FROM daily_commitments
           WHERE user_id = $1${dateFilter}
           ORDER BY commitment_date DESC, created_at DESC`,
          queryParams
        )
      }

      return res.status(200).json(commitments.rows || [])
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to fetch commitments' })
    }
  }

  if (method === 'POST') {
    const { userId, commitmentText, date, status = 'pending' } = req.body

    if (!userId || !commitmentText || !date) {
      return res.status(400).json({ error: 'User ID, commitment text, and date required' })
    }

    try {
      const result = await query(
        `INSERT INTO daily_commitments (user_id, commitment_text, commitment_date, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, commitment_date)
         DO UPDATE SET
           commitment_text = EXCLUDED.commitment_text,
           status = EXCLUDED.status,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, commitmentText, date, status]
      )
      return res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({
        error: 'Failed to save commitment',
        details: error.message
      })
    }
  }

  if (method === 'PUT') {
    const { id, commitmentText, status } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Commitment ID required' })
    }

    try {
      const updates = []
      const values = []
      let valueIndex = 1

      if (commitmentText !== undefined) {
        updates.push(`commitment_text = $${valueIndex}`)
        values.push(commitmentText)
        valueIndex++
      }

      if (status !== undefined) {
        updates.push(`status = $${valueIndex}`)
        values.push(status)
        valueIndex++
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No updates provided' })
      }

      values.push(id)
      const result = await query(
        `UPDATE daily_commitments
         SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${valueIndex}
         RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Commitment not found' })
      }

      return res.status(200).json(result.rows[0])
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to update commitment' })
    }
  }

  if (method === 'DELETE') {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Commitment ID required' })
    }

    try {
      const result = await query(
        'DELETE FROM daily_commitments WHERE id = $1 RETURNING id',
        [id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Commitment not found' })
      }

      return res.status(200).json({ success: true, deletedId: result.rows[0].id })
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to delete commitment' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
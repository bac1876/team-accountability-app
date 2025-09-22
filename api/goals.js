import { query } from '../src/lib/database.js'

export default async function handler(req, res) {
  const { method } = req

  if (method === 'GET') {
    const { userId } = req.query

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' })
    }

    try {
      const goals = await query(
        'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      )
      return res.status(200).json(goals.rows || [])
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to fetch goals' })
    }
  }

  if (method === 'POST') {
    const { userId, goalText, targetDate, progress = 0 } = req.body

    if (!userId || !goalText) {
      return res.status(400).json({ error: 'User ID and goal text required' })
    }

    try {
      const result = await query(
        `INSERT INTO goals (user_id, goal_text, target_date, progress)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [userId, goalText, targetDate, progress]
      )
      return res.status(201).json(result.rows[0])
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to create goal' })
    }
  }

  if (method === 'PUT') {
    // Accept either id or goalId for backwards compatibility
    const { id, goalId, goalText, progress } = req.body
    const goalIdToUse = goalId || id

    if (!goalIdToUse) {
      return res.status(400).json({ error: 'Goal ID required' })
    }

    try {
      // Build dynamic update query based on provided fields
      const updates = []
      const values = []
      let paramCount = 1

      if (goalText !== undefined) {
        updates.push(`goal_text = $${paramCount}`)
        values.push(goalText)
        paramCount++
      }

      if (progress !== undefined) {
        updates.push(`progress = $${paramCount}`)
        values.push(progress)
        paramCount++
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' })
      }

      updates.push('updated_at = CURRENT_TIMESTAMP')
      values.push(goalIdToUse)

      const result = await query(
        `UPDATE goals
         SET ${updates.join(', ')}
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Goal not found' })
      }

      return res.status(200).json(result.rows[0])
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to update goal' })
    }
  }

  if (method === 'DELETE') {
    // Check for goalId in query params (as frontend sends it)
    const { goalId } = req.query

    if (!goalId) {
      return res.status(400).json({ error: 'Goal ID required in query parameters' })
    }

    try {
      const result = await query('DELETE FROM goals WHERE id = $1 RETURNING id', [goalId])

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Goal not found' })
      }

      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to delete goal' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
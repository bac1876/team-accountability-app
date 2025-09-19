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
    const { id, progress } = req.body

    if (!id || progress === undefined) {
      return res.status(400).json({ error: 'Goal ID and progress required' })
    }

    try {
      const result = await query(
        `UPDATE goals
         SET progress = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        [progress, id]
      )
      return res.status(200).json(result.rows[0])
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to update goal' })
    }
  }

  if (method === 'DELETE') {
    const { id } = req.body

    if (!id) {
      return res.status(400).json({ error: 'Goal ID required' })
    }

    try {
      await query('DELETE FROM goals WHERE id = $1', [id])
      return res.status(200).json({ success: true })
    } catch (error) {
      console.error('Database error:', error)
      return res.status(500).json({ error: 'Failed to delete goal' })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
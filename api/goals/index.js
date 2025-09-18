// API endpoint for weekly goals management
import { goalQueries } from '../lib/database.js'
import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        // Get goals for a user
        const { userId, active } = req.query

        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' })
        }

        // Get all goals for the user (we don't have getActiveByUser)
        const goals = await goalQueries.getByUser(userId)

        // Filter active goals if requested
        if (active === 'true') {
          const activeGoals = goals.filter(g => g.status === 'active')
          res.status(200).json(activeGoals)
        } else {
          res.status(200).json(goals)
        }
        break

      case 'POST':
        // Create new goal
        const { userId: postUserId, goalText, targetDate } = req.body

        console.log('Received goal data:', { userId: postUserId, goalText, targetDate })

        if (!postUserId || !goalText) {
          return res.status(400).json({
            error: 'User ID and goal text are required',
            received: { userId: postUserId, goalText: goalText ? 'provided' : 'missing' }
          })
        }

        try {
          // Use sql`` template literal which is the recommended way
          const result = await sql`
            INSERT INTO weekly_goals (user_id, goal_text, target_date)
            VALUES (${postUserId}, ${goalText}, ${targetDate || null})
            RETURNING *
          `

          console.log('Goal created successfully:', result.rows[0])
          res.status(201).json(result.rows[0])
        } catch (dbError) {
          console.error('Database error creating goal:', dbError)
          res.status(500).json({
            error: 'Database error',
            details: dbError.message,
            userId: postUserId,
            goalText: goalText ? 'provided' : 'missing'
          })
        }
        break

      case 'PUT':
        // Update goal (text and/or progress)
        const { goalId, goalText: putText, progress } = req.body

        if (!goalId) {
          return res.status(400).json({ error: 'Goal ID is required' })
        }

        let updatedGoal
        if (putText !== undefined || progress !== undefined) {
          // Update both text and/or progress
          updatedGoal = await goalQueries.updateGoal(goalId, putText, progress)
        } else {
          return res.status(400).json({ error: 'Either goalText or progress must be provided' })
        }

        if (!updatedGoal) {
          return res.status(404).json({ error: 'Goal not found' })
        }

        res.status(200).json(updatedGoal)
        break

      case 'DELETE':
        // Delete goal
        const { goalId: deleteGoalId } = req.query

        if (!deleteGoalId) {
          return res.status(400).json({ error: 'Goal ID is required' })
        }

        await goalQueries.delete(deleteGoalId)
        res.status(200).json({ success: true })
        break

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Goals API error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
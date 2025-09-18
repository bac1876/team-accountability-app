// API endpoint for weekly goals management
import { goalQueries } from '../lib/database.js'

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        // Get goals for a user
        const { userId, active } = req.query
        
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' })
        }

        if (active === 'true') {
          const goals = await goalQueries.getActiveByUser(userId)
          res.status(200).json(goals)
        } else {
          const goals = await goalQueries.getByUser(userId)
          res.status(200).json(goals)
        }
        break

      case 'POST':
        // Create new goal
        const { userId, goalText, targetDate } = req.body
        
        if (!userId || !goalText) {
          return res.status(400).json({ error: 'User ID and goal text are required' })
        }

        const goal = await goalQueries.create(userId, goalText, targetDate)
        res.status(201).json(goal)
        break

      case 'PUT':
        // Update goal progress
        const { goalId, progress } = req.body
        
        if (!goalId || progress === undefined) {
          return res.status(400).json({ error: 'Goal ID and progress are required' })
        }

        const updatedGoal = await goalQueries.updateProgress(goalId, progress)
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

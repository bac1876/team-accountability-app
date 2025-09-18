// API endpoint for reflection management operations
import { reflectionQueries } from '../lib/database.js'

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        // Get reflections by user
        const { userId, date } = req.query

        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' })
        }

        if (date) {
          // Get specific date's reflection
          const reflection = await reflectionQueries.getByUserAndDate(userId, date)
          res.status(200).json(reflection ? [reflection] : [])
        } else {
          // Get all reflections for user
          const reflections = await reflectionQueries.getByUser(userId)
          res.status(200).json(reflections)
        }
        break

      case 'POST':
        // Create new reflection
        const { userId: postUserId, date: postDate, wins, challenges, tomorrowFocus } = req.body

        if (!postUserId || !postDate) {
          return res.status(400).json({ error: 'User ID and date are required' })
        }

        const newReflection = await reflectionQueries.create({
          userId: postUserId,
          date: postDate,
          wins,
          challenges,
          tomorrowFocus
        })

        res.status(201).json(newReflection)
        break

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Reflection API error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
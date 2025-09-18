// API endpoint to get team analytics
import { analyticsQueries } from '../lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const stats = await analyticsQueries.getTeamStats()
    res.status(200).json(stats)
  } catch (error) {
    console.error('Error fetching team analytics:', error)
    // Return default stats to prevent dashboard from breaking
    res.status(200).json({
      totalUsers: 0,
      activeToday: 0,
      overallCompletion: 0,
      weeklyGoalsCompletion: 0
    })
  }
}
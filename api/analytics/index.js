// API endpoint for team analytics
import { analyticsQueries } from '../../src/lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const analytics = await analyticsQueries.getTeamAnalytics()
    res.status(200).json(analytics)
  } catch (error) {
    console.error('Analytics API error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

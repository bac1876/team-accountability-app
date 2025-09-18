// API endpoint to get today's commitments for all users
import { commitmentQueries } from '../lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const commitments = await commitmentQueries.getTodayForAll()
    res.status(200).json(commitments || [])
  } catch (error) {
    console.error('Error fetching today commitments:', error)
    // Return empty array instead of error to prevent dashboard from breaking
    res.status(200).json([])
  }
}
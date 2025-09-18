// API endpoint to get commitments for a specific user
import { commitmentQueries } from '../lib/database.js'

export default async function handler(req, res) {
  const { userId } = req.query

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    const commitments = await commitmentQueries.getByUser(userId)
    res.status(200).json(commitments || [])
  } catch (error) {
    console.error('Error fetching commitments:', error)
    // Return empty array instead of error to prevent dashboard from breaking
    res.status(200).json([])
  }
}
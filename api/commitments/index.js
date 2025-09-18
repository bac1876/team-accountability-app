// API endpoint for daily commitments management
import { commitmentQueries } from '../lib/database.js'

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        // Get commitments for a user
        const { userId, date, history } = req.query
        
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' })
        }

        if (history === 'true') {
          // Get commitment history
          const commitments = await commitmentQueries.getByUser(userId)
          res.status(200).json(commitments)
        } else if (date) {
          // Get commitment for specific date
          const commitment = await commitmentQueries.getByUserAndDate(userId, date)
          res.status(200).json(commitment || null)
        } else {
          // Get today's commitment
          const today = new Date().toISOString().split('T')[0]
          const commitment = await commitmentQueries.getByUserAndDate(userId, today)
          res.status(200).json(commitment || null)
        }
        break

      case 'POST':
        // Create or update commitment
        const { userId: postUserId, date: postDate, commitmentText, status = 'pending' } = req.body

        if (!postUserId || !postDate || !commitmentText) {
          return res.status(400).json({ error: 'User ID, date, and commitment text are required' })
        }

        // Check if commitment exists for this date
        const existing = await commitmentQueries.getByUserAndDate(postUserId, postDate)

        let commitment
        if (existing) {
          // Update existing commitment's text and status
          commitment = await commitmentQueries.update(postUserId, postDate, commitmentText, status)
        } else {
          // Create new commitment
          commitment = await commitmentQueries.create({
            userId: postUserId,
            date: postDate,
            commitmentText,
            status
          })
        }

        res.status(200).json(commitment)
        break

      case 'PUT':
        // Update commitment status
        const { userId: putUserId, date: putDate, status: putStatus } = req.body
        
        if (!putUserId || !putDate || !putStatus) {
          return res.status(400).json({ error: 'User ID, date, and status are required' })
        }

        const updatedCommitment = await commitmentQueries.updateStatus(putUserId, putDate, putStatus)
        if (!updatedCommitment) {
          return res.status(404).json({ error: 'Commitment not found' })
        }
        
        res.status(200).json(updatedCommitment)
        break

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Commitments API error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

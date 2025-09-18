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
        // Always create new commitment (allowing multiple per day)
        const { userId, date, commitmentText, status = 'pending' } = req.body

        if (!userId || !date || !commitmentText) {
          return res.status(400).json({ error: 'User ID, date, and commitment text are required' })
        }

        // Always create new commitment
        const commitment = await commitmentQueries.create({
          userId,
          date,
          commitmentText,
          status
        })

        res.status(200).json(commitment)
        break

      case 'PUT':
        // Update commitment by ID
        const { commitmentId, commitmentText: putText, status: putStatus } = req.body

        if (!commitmentId) {
          return res.status(400).json({ error: 'Commitment ID is required' })
        }

        const updatedCommitment = await commitmentQueries.updateById(commitmentId, putText, putStatus)
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

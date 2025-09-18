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

        console.log('Received commitment data:', { userId, date, commitmentText, status })

        if (!userId || !date || !commitmentText) {
          return res.status(400).json({
            error: 'User ID, date, and commitment text are required',
            received: { userId, date, commitmentText: commitmentText ? 'provided' : 'missing' }
          })
        }

        // Always create new commitment - using direct SQL to debug issue
        try {
          // Import sql directly for this specific case
          const { sql } = await import('@vercel/postgres')

          // Use sql`` template literal which is the recommended way
          const result = await sql`
            INSERT INTO daily_commitments (user_id, commitment_date, commitment_text, status)
            VALUES (${userId}, ${date}, ${commitmentText}, ${status})
            RETURNING *
          `

          console.log('Commitment created successfully:', result.rows[0])
          res.status(200).json(result.rows[0])
        } catch (dbError) {
          console.error('Database error creating commitment:', dbError)
          res.status(500).json({
            error: 'Database error',
            details: dbError.message,
            userId,
            date
          })
        }
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

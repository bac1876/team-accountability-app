// API endpoint for daily commitments management
import { commitmentQueries } from '../lib/database.js'
import { sql } from '@vercel/postgres'

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
          const result = await sql`
            SELECT * FROM daily_commitments
            WHERE user_id = ${userId}
            ORDER BY commitment_date DESC
          `
          res.status(200).json(result.rows)
        } else if (date) {
          // Get commitment for specific date
          const result = await sql`
            SELECT * FROM daily_commitments
            WHERE user_id = ${userId} AND commitment_date = ${date}
          `
          res.status(200).json(result.rows[0] || null)
        } else {
          // Get today's commitment
          const today = new Date().toISOString().split('T')[0]
          const result = await sql`
            SELECT * FROM daily_commitments
            WHERE user_id = ${userId} AND commitment_date = ${today}
          `
          res.status(200).json(result.rows[0] || null)
        }
        break

      case 'POST':
        // Always create new commitment (allowing multiple per day)
        const { userId: postUserId, date: postDate, commitmentText, status = 'pending' } = req.body

        console.log('Received commitment data:', { userId: postUserId, date: postDate, commitmentText, status })

        if (!postUserId || !postDate || !commitmentText) {
          return res.status(400).json({
            error: 'User ID, date, and commitment text are required',
            received: { userId: postUserId, date: postDate, commitmentText: commitmentText ? 'provided' : 'missing' }
          })
        }

        // Always create new commitment - using direct SQL
        try {
          // Use sql`` template literal which is the recommended way
          const result = await sql`
            INSERT INTO daily_commitments (user_id, commitment_date, commitment_text, status)
            VALUES (${postUserId}, ${postDate}, ${commitmentText}, ${status})
            RETURNING *
          `

          console.log('Commitment created successfully:', result.rows[0])
          res.status(200).json(result.rows[0])
        } catch (dbError) {
          console.error('Database error creating commitment:', dbError)
          res.status(500).json({
            error: 'Database error',
            details: dbError.message,
            userId: postUserId,
            date: postDate
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

      case 'DELETE':
        // Delete commitment
        const { commitmentId: deleteCommitmentId } = req.query

        if (!deleteCommitmentId) {
          return res.status(400).json({ error: 'Commitment ID is required' })
        }

        await sql`
          DELETE FROM daily_commitments
          WHERE id = ${deleteCommitmentId}
        `

        res.status(200).json({ success: true })
        break

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Commitments API error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
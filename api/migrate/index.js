// API endpoint to run database migrations
import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  try {
    // Only allow in development or with admin auth
    if (process.env.NODE_ENV === 'production' && req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    switch (req.method) {
      case 'POST':
        try {
          // Remove the unique constraint on daily_commitments
          await sql`
            ALTER TABLE daily_commitments
            DROP CONSTRAINT IF EXISTS daily_commitments_user_id_commitment_date_key
          `

          console.log('Migration completed: Removed unique constraint from daily_commitments')

          res.status(200).json({
            success: true,
            message: 'Migration completed successfully: Unique constraint removed from daily_commitments'
          })
        } catch (error) {
          console.error('Migration error:', error)
          res.status(500).json({
            error: 'Migration failed',
            details: error.message
          })
        }
        break

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Migration API error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}
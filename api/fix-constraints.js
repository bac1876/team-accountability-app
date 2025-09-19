import { query } from '../src/lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const results = []

    // Fix commitments table - add unique constraint
    try {
      await query(`
        ALTER TABLE daily_commitments
        DROP CONSTRAINT IF EXISTS daily_commitments_user_id_commitment_date_key
      `)

      await query(`
        ALTER TABLE daily_commitments
        ADD CONSTRAINT daily_commitments_user_id_commitment_date_key
        UNIQUE (user_id, commitment_date)
      `)
      results.push('✓ Fixed daily_commitments unique constraint')
    } catch (error) {
      console.error('Commitments constraint error:', error)
      results.push(`✗ Commitments: ${error.message}`)
    }

    // Fix goals table - ensure it exists with proper structure
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS goals (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          goal_text TEXT NOT NULL,
          target_date DATE,
          progress INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)
      results.push('✓ Goals table exists')
    } catch (error) {
      console.error('Goals table error:', error)
      results.push(`✗ Goals table: ${error.message}`)
    }

    // Add index for goals if not exists
    try {
      await query(`
        CREATE INDEX IF NOT EXISTS idx_goals_user_id
        ON goals(user_id)
      `)
      results.push('✓ Goals index created')
    } catch (error) {
      console.error('Goals index error:', error)
      results.push(`✗ Goals index: ${error.message}`)
    }

    res.status(200).json({
      success: true,
      message: 'Database constraints fixed',
      results
    })
  } catch (error) {
    console.error('Fix constraints error:', error)
    res.status(500).json({
      error: 'Failed to fix constraints',
      details: error.message
    })
  }
}
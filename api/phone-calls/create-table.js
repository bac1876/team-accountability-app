import { query } from '../../../src/lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Create phone_calls table if it doesn't exist
    const createTableResult = await query(`
      CREATE TABLE IF NOT EXISTS phone_calls (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        call_date DATE NOT NULL,
        target_calls INTEGER DEFAULT 0,
        actual_calls INTEGER DEFAULT 0,
        notes TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, call_date)
      )
    `)

    // Create index for performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_phone_calls_user_date
      ON phone_calls(user_id, call_date)
    `)

    // Check if table was created
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'phone_calls'
      )
    `)

    return res.status(200).json({
      success: true,
      message: 'Phone calls table created/verified successfully',
      tableExists: tableCheck.rows[0].exists
    })
  } catch (error) {
    console.error('Error creating phone_calls table:', error)
    return res.status(500).json({
      error: 'Failed to create phone_calls table',
      details: error.message
    })
  }
}
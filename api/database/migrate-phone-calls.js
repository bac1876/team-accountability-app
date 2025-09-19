// API endpoint to add phone_calls table to the database
import { query } from '../../../src/lib/database.js'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Create phone_calls table
    await query(`
      CREATE TABLE IF NOT EXISTS phone_calls (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        call_date DATE NOT NULL,
        target_calls INTEGER DEFAULT 0,
        actual_calls INTEGER DEFAULT 0,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, call_date)
      )
    `)

    // Create indexes for better performance
    await query(`CREATE INDEX IF NOT EXISTS idx_phone_calls_user_id ON phone_calls(user_id)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_phone_calls_date ON phone_calls(call_date)`)
    await query(`CREATE INDEX IF NOT EXISTS idx_phone_calls_user_date ON phone_calls(user_id, call_date)`)

    res.status(200).json({
      success: true,
      message: 'Phone calls table created successfully'
    })
  } catch (error) {
    console.error('Migration error:', error)
    res.status(500).json({
      error: 'Failed to create phone_calls table',
      details: error.message
    })
  }
}
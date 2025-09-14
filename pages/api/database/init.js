// API endpoint to initialize the database with schema and default data
import { initializeDatabase } from '../../src/lib/database.js'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Simple authentication check
  const { token } = req.body
  if (token !== process.env.DATABASE_INIT_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    await initializeDatabase()
    
    res.status(200).json({ 
      success: true, 
      message: 'Database initialized successfully' 
    })
  } catch (error) {
    console.error('Database initialization error:', error)
    res.status(500).json({ 
      error: 'Failed to initialize database', 
      details: error.message 
    })
  }
}

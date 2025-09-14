// API endpoint to initialize and populate the database
import { sql } from '@vercel/postgres'
import fs from 'fs'
import path from 'path'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting database setup...')

    // Read and execute the main schema
    const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')
    
    console.log('Executing schema...')
    await sql.query(schema)

    // Read and execute the team population script
    const populatePath = path.join(process.cwd(), 'sql', 'populate_team.sql')
    const populateScript = fs.readFileSync(populatePath, 'utf8')
    
    console.log('Populating team members...')
    const result = await sql.query(populateScript)

    // Get the final count
    const countResult = await sql.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN role = 'member' THEN 1 END) as member_count
      FROM users
    `)

    const counts = countResult.rows[0]

    console.log('Database setup completed successfully')
    
    res.status(200).json({
      success: true,
      message: 'Database initialized and populated successfully',
      userCounts: {
        total: parseInt(counts.total_users),
        admins: parseInt(counts.admin_count),
        members: parseInt(counts.member_count)
      }
    })

  } catch (error) {
    console.error('Database setup error:', error)
    res.status(500).json({ 
      error: 'Database setup failed', 
      details: error.message 
    })
  }
}

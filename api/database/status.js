// API endpoint to check database connection and status
import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Test basic connection
    const connectionTest = await sql.query('SELECT NOW() as current_time')
    
    // Check if tables exist
    const tablesResult = await sql.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `)

    const tables = tablesResult.rows.map(row => row.table_name)

    // Get user counts if users table exists
    let userCounts = null
    if (tables.includes('users')) {
      try {
        const countResult = await sql.query(`
          SELECT 
            COUNT(*) as total_users,
            COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
            COUNT(CASE WHEN role = 'member' THEN 1 END) as member_count
          FROM users
        `)
        userCounts = {
          total: parseInt(countResult.rows[0].total_users),
          admins: parseInt(countResult.rows[0].admin_count),
          members: parseInt(countResult.rows[0].member_count)
        }
      } catch (error) {
        console.error('Error getting user counts:', error)
      }
    }

    // Check for recent activity
    let recentActivity = null
    if (tables.includes('daily_commitments')) {
      try {
        const activityResult = await sql.query(`
          SELECT COUNT(*) as recent_commitments
          FROM daily_commitments 
          WHERE commitment_date >= CURRENT_DATE - INTERVAL '7 days'
        `)
        recentActivity = {
          recentCommitments: parseInt(activityResult.rows[0].recent_commitments)
        }
      } catch (error) {
        console.error('Error getting recent activity:', error)
      }
    }

    res.status(200).json({
      success: true,
      connection: 'active',
      currentTime: connectionTest.rows[0].current_time,
      tables: tables,
      userCounts: userCounts,
      recentActivity: recentActivity,
      databaseInitialized: tables.length > 0
    })

  } catch (error) {
    console.error('Database status check error:', error)
    res.status(500).json({ 
      success: false,
      error: 'Database connection failed', 
      details: error.message 
    })
  }
}

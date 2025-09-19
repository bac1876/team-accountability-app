import { query } from '../../../src/lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check if phone_calls table exists
    const tableExists = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'phone_calls'
      )
    `)

    // Get table structure if it exists
    let tableStructure = null
    if (tableExists.rows[0].exists) {
      tableStructure = await query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'phone_calls'
        ORDER BY ordinal_position
      `)
    }

    // Get indexes
    const indexes = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND tablename = 'phone_calls'
    `)

    // Get sample data (limit 5)
    let sampleData = null
    if (tableExists.rows[0].exists) {
      sampleData = await query(`
        SELECT * FROM phone_calls
        ORDER BY created_at DESC
        LIMIT 5
      `)
    }

    // Get count
    let count = null
    if (tableExists.rows[0].exists) {
      count = await query(`SELECT COUNT(*) FROM phone_calls`)
    }

    return res.status(200).json({
      tableExists: tableExists.rows[0].exists,
      tableStructure: tableStructure?.rows || null,
      indexes: indexes.rows,
      sampleData: sampleData?.rows || null,
      totalRecords: count?.rows[0]?.count || 0
    })
  } catch (error) {
    console.error('Debug error:', error)
    return res.status(500).json({
      error: error.message,
      detail: error.detail || null,
      hint: error.hint || null
    })
  }
}
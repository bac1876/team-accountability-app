import { query } from '../src/lib/database.js'

async function insertPhoneData() {
  console.log('=== Inserting Phone Call Data for Brian ===\n')

  try {
    // Get Brian's user ID
    const userResult = await query(
      `SELECT id FROM users WHERE email = $1`,
      ['brian@searchnwa.com']
    )

    if (!userResult.rows.length) {
      console.error('❌ Brian user not found')
      process.exit(1)
    }

    const userId = userResult.rows[0].id
    console.log(`Found Brian with ID: ${userId}`)

    // Insert phone call data for Sept 17 and 18 with 50+ calls each
    const phoneData = [
      { date: '2025-09-17', target: 50, actual: 55, notes: 'Great calling day!' },
      { date: '2025-09-18', target: 50, actual: 52, notes: 'Another productive day!' }
    ]

    for (const data of phoneData) {
      const result = await query(
        `INSERT INTO phone_calls (user_id, call_date, target_calls, actual_calls, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, call_date)
         DO UPDATE SET
           target_calls = EXCLUDED.target_calls,
           actual_calls = EXCLUDED.actual_calls,
           notes = EXCLUDED.notes,
           updated_at = CURRENT_TIMESTAMP
         RETURNING *`,
        [userId, data.date, data.target, data.actual, data.notes]
      )

      console.log(`✅ Inserted/Updated phone data for ${data.date}:`)
      console.log(`   Target: ${data.target} calls`)
      console.log(`   Actual: ${data.actual} calls`)
      console.log(`   Notes: ${data.notes}`)
    }

    // Verify the data
    console.log('\nVerifying phone call data...')
    const verification = await query(
      `SELECT * FROM phone_calls
       WHERE user_id = $1
       AND call_date >= '2025-09-17'
       AND call_date <= '2025-09-18'
       ORDER BY call_date`,
      [userId]
    )

    console.log(`\nFound ${verification.rows.length} phone call records:`)
    verification.rows.forEach(row => {
      console.log(`   ${row.call_date.toISOString().split('T')[0]}: ${row.actual_calls} calls (target: ${row.target_calls})`)
    })

    console.log('\n✅ Phone call data successfully inserted!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error inserting phone data:', error)
    process.exit(1)
  }
}

insertPhoneData().catch(console.error)
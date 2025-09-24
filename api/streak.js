import { query } from '../lib/database.js'

// Helper function to check if a date is a weekday
function isWeekday(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  const day = date.getDay()
  return day >= 1 && day <= 5 // Monday = 1, Friday = 5
}

// Get the previous weekday from a given date
function getPreviousWeekday(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  date.setDate(date.getDate() - 1)

  // Skip weekends
  while (!isWeekday(date.toISOString().split('T')[0])) {
    date.setDate(date.getDate() - 1)
  }

  return date.toISOString().split('T')[0]
}

// Calculate commitment streak for a user
export async function calculateCommitmentStreak(userId) {
  try {
    // Get all completed commitments for the user, ordered by date descending
    const result = await query(
      `SELECT commitment_date, status
       FROM daily_commitments
       WHERE user_id = $1
       ORDER BY commitment_date DESC`,
      [userId]
    )

    if (!result.rows || result.rows.length === 0) {
      return 0
    }

    // Create a map of dates with completed commitments
    const completedDates = new Set()
    result.rows.forEach(row => {
      if (row.status === 'completed') {
        const dateStr = row.commitment_date.toISOString().split('T')[0]
        if (isWeekday(dateStr)) {
          completedDates.add(dateStr)
        }
      }
    })

    if (completedDates.size === 0) {
      return 0
    }

    // Calculate streak starting from today
    let streak = 0
    const today = new Date().toISOString().split('T')[0]
    let currentDate = isWeekday(today) ? today : getPreviousWeekday(today)

    // Count consecutive completed weekdays
    while (completedDates.has(currentDate)) {
      streak++
      currentDate = getPreviousWeekday(currentDate)

      // Prevent infinite loops (max 365 days streak)
      if (streak > 365) break
    }

    return streak
  } catch (error) {
    console.error('Error calculating commitment streak:', error)
    return 0
  }
}

// API endpoint to get streak
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'User ID required' })
  }

  try {
    const streak = await calculateCommitmentStreak(userId)

    // Also get some debug info
    const debugInfo = await query(
      `SELECT commitment_date, status, commitment_text
       FROM daily_commitments
       WHERE user_id = $1
       ORDER BY commitment_date DESC
       LIMIT 10`,
      [userId]
    )

    res.status(200).json({
      streak,
      debug: {
        recentCommitments: debugInfo.rows.map(row => ({
          date: row.commitment_date.toISOString().split('T')[0],
          status: row.status,
          text: row.commitment_text?.substring(0, 50) + '...'
        }))
      }
    })
  } catch (error) {
    console.error('Streak API error:', error)
    res.status(500).json({ error: 'Failed to calculate streak' })
  }
}
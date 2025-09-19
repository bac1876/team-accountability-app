import { query } from '../../src/lib/database.js'

export default async function handler(req, res) {
  const { method } = req

  if (method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).json({ error: `Method ${method} not allowed` })
  }

  const { userId, startDate, endDate } = req.query

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    // Get the current week's Monday if no dates provided
    let start = startDate
    let end = endDate

    if (!start) {
      const now = new Date()
      const currentDay = now.getDay()
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
      const monday = new Date(now)
      monday.setDate(now.getDate() + mondayOffset)
      start = monday.toISOString().split('T')[0]
    }

    if (!end) {
      const startDate = new Date(start)
      const friday = new Date(startDate)
      friday.setDate(startDate.getDate() + 4) // Get Friday
      end = friday.toISOString().split('T')[0]
    }

    // Get all phone calls for the week
    const result = await query(
      `SELECT * FROM phone_calls
       WHERE user_id = $1
       AND call_date >= $2
       AND call_date <= $3
       ORDER BY call_date ASC`,
      [userId, start, end]
    )

    const calls = result.rows || []

    // Calculate statistics
    let totalTarget = 0
    let totalActual = 0
    const dailyStats = []

    // Generate stats for each weekday
    const startDate = new Date(start)
    for (let i = 0; i < 5; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      // Format the date from database properly for comparison
      const dayCall = calls.find(c => {
        // Handle both Date objects and strings from database
        const callDateStr = typeof c.call_date === 'string'
          ? c.call_date.split('T')[0]
          : c.call_date.toISOString().split('T')[0]
        return callDateStr === dateStr
      })

      const dayData = {
        date: dateStr,
        day: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'][i],
        target_calls: dayCall?.target_calls || 0,
        actual_calls: dayCall?.actual_calls || 0,
        notes: dayCall?.notes || '',
        completion_rate: 0
      }

      if (dayData.target_calls > 0) {
        dayData.completion_rate = Math.round((dayData.actual_calls / dayData.target_calls) * 100)
      }

      totalTarget += dayData.target_calls
      totalActual += dayData.actual_calls
      dailyStats.push(dayData)
    }

    // Calculate week summary
    const weekCompletion = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0

    return res.status(200).json({
      week: {
        start_date: start,
        end_date: end,
        total_target: totalTarget,
        total_actual: totalActual,
        completion_rate: weekCompletion
      },
      days: dailyStats,
      calls: calls
    })
  } catch (error) {
    console.error('Error fetching phone call stats:', error)
    return res.status(500).json({ error: 'Failed to fetch phone call statistics' })
  }
}
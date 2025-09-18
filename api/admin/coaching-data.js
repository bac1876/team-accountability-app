// API endpoint for coaching dashboard data
import { query } from '../lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, startDate, endDate } = req.query

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'Start and end dates are required' })
  }

  try {
    if (userId === 'all') {
      // Get data for all users
      const users = await query(
        "SELECT id, name FROM users WHERE role != 'admin'",
        []
      )

      const userBreakdown = []

      for (const user of users.rows) {
        const userData = await getUserCoachingData(user.id, startDate, endDate)
        userBreakdown.push({
          userId: user.id,
          name: user.name,
          ...userData
        })
      }

      // Calculate aggregate stats
      const totalUsers = userBreakdown.length
      const aggregateData = {
        commitmentRate: Math.round(
          userBreakdown.reduce((sum, u) => sum + u.commitmentRate, 0) / totalUsers
        ),
        totalCommitments: userBreakdown.reduce((sum, u) => sum + u.totalCommitments, 0),
        avgDailyCalls: Math.round(
          userBreakdown.reduce((sum, u) => sum + u.avgCalls, 0) / totalUsers
        ),
        totalCalls: userBreakdown.reduce((sum, u) => sum + u.totalCalls, 0),
        peakCallDay: Math.max(...userBreakdown.map(u => u.peakCallDay || 0)),
        goalsCompleted: userBreakdown.reduce((sum, u) => sum + u.goalsCompleted, 0),
        avgGoalProgress: Math.round(
          userBreakdown.reduce((sum, u) => sum + u.avgGoalProgress, 0) / totalUsers
        ),
        activeGoals: userBreakdown.reduce((sum, u) => sum + u.activeGoals, 0),
        reflectionRate: Math.round(
          userBreakdown.reduce((sum, u) => sum + u.reflectionRate, 0) / totalUsers
        ),
        totalReflections: userBreakdown.reduce((sum, u) => sum + u.totalReflections, 0),
        reflectionStreak: Math.max(...userBreakdown.map(u => u.reflectionStreak || 0)),
        userBreakdown,
        insights: generateInsights(userBreakdown)
      }

      res.status(200).json(aggregateData)
    } else {
      // Get data for specific user
      const userData = await getUserCoachingData(userId, startDate, endDate)

      // Get timeline data
      const timeline = await query(
        `SELECT
          d.date,
          CASE WHEN dc.status = 'completed' THEN true ELSE false END as commitmentCompleted,
          dc.commitment_text,
          r.wins IS NOT NULL as hasReflection,
          COALESCE(wg.avg_progress, 0) as goalProgress
        FROM (
          SELECT generate_series($2::date, $3::date, '1 day'::interval)::date as date
        ) d
        LEFT JOIN daily_commitments dc ON dc.user_id = $1 AND dc.commitment_date = d.date
        LEFT JOIN reflections r ON r.user_id = $1 AND r.reflection_date = d.date
        LEFT JOIN (
          SELECT user_id, target_date, AVG(progress) as avg_progress
          FROM weekly_goals
          GROUP BY user_id, target_date
        ) wg ON wg.user_id = $1 AND wg.target_date = d.date
        ORDER BY d.date DESC`,
        [userId, startDate, endDate]
      )

      // Add phone call data to timeline
      const timelineWithCalls = timeline.rows.map(day => ({
        ...day,
        callsMade: 0 // This would come from phoneCallStore in real implementation
      }))

      const responseData = {
        ...userData,
        timeline: timelineWithCalls,
        insights: generateUserInsights(userData, timelineWithCalls)
      }

      res.status(200).json(responseData)
    }
  } catch (error) {
    console.error('Coaching data error:', error)
    res.status(500).json({ error: 'Failed to fetch coaching data', details: error.message })
  }
}

async function getUserCoachingData(userId, startDate, endDate) {
  // Commitments
  const commitments = await query(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      MAX(CASE WHEN status = 'completed' THEN commitment_date END) as lastCompleted
    FROM daily_commitments
    WHERE user_id = $1 AND commitment_date BETWEEN $2 AND $3`,
    [userId, startDate, endDate]
  )

  const commitmentData = commitments.rows[0]
  const commitmentRate = commitmentData.total > 0
    ? Math.round((commitmentData.completed / commitmentData.total) * 100)
    : 0

  // Calculate commitment streak
  const streakResult = await query(
    `WITH streak_data AS (
      SELECT
        commitment_date,
        status,
        commitment_date - ROW_NUMBER() OVER (
          PARTITION BY status
          ORDER BY commitment_date
        ) * INTERVAL '1 day' as streak_group
      FROM daily_commitments
      WHERE user_id = $1
        AND status = 'completed'
        AND EXTRACT(DOW FROM commitment_date) BETWEEN 1 AND 5
      ORDER BY commitment_date DESC
    )
    SELECT COUNT(*) as streak_length
    FROM streak_data
    WHERE streak_group = (SELECT MAX(streak_group) FROM streak_data)`,
    [userId]
  )

  const commitmentStreak = parseInt(streakResult.rows[0]?.streak_length || 0)

  // Goals
  const goals = await query(
    `SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
      AVG(progress) as avg_progress,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active
    FROM weekly_goals
    WHERE user_id = $1
      AND (created_at BETWEEN $2 AND $3 OR target_date BETWEEN $2 AND $3)`,
    [userId, startDate, endDate]
  )

  const goalData = goals.rows[0]

  // Reflections
  const reflections = await query(
    `SELECT
      COUNT(*) as total,
      COUNT(DISTINCT reflection_date) as days_with_reflections,
      MAX(reflection_date) as last_reflection
    FROM reflections
    WHERE user_id = $1 AND reflection_date BETWEEN $2 AND $3`,
    [userId, startDate, endDate]
  )

  const reflectionData = reflections.rows[0]
  const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
  const reflectionRate = totalDays > 0
    ? Math.round((reflectionData.days_with_reflections / totalDays) * 100)
    : 0

  // Calculate reflection streak (simplified - would need phoneCallStore for full implementation)
  const reflectionStreak = 0

  // Phone calls would come from phoneCallStore
  const phoneCallStreak = 0
  const avgCalls = 0
  const totalCalls = 0
  const peakCallDay = 0

  // Coaching notes
  const coachingNotes = []

  if (commitmentRate < 50) {
    coachingNotes.push('Low commitment completion rate - needs accountability support')
  }
  if (commitmentStreak < 3) {
    coachingNotes.push('No consistent commitment streak - focus on daily habits')
  }
  if (reflectionRate < 30) {
    coachingNotes.push('Low reflection rate - encourage daily reflection practice')
  }
  if (goalData.avg_progress < 50 && goalData.active > 0) {
    coachingNotes.push('Goals need attention - review and adjust targets')
  }

  return {
    commitmentRate,
    totalCommitments: parseInt(commitmentData.total),
    commitmentStreak,
    avgCalls,
    totalCalls,
    phoneCallStreak,
    peakCallDay,
    goalsCompleted: parseInt(goalData.completed || 0),
    avgGoalProgress: Math.round(goalData.avg_progress || 0),
    activeGoals: parseInt(goalData.active || 0),
    reflectionRate,
    totalReflections: parseInt(reflectionData.total),
    reflectionStreak,
    coachingNotes
  }
}

function generateInsights(userBreakdown) {
  const strengths = []
  const improvements = []
  const recommendations = []

  // Analyze strengths
  const avgCommitmentRate = userBreakdown.reduce((sum, u) => sum + u.commitmentRate, 0) / userBreakdown.length
  if (avgCommitmentRate > 70) {
    strengths.push('Strong overall commitment completion rate across the team')
  }

  const highPerformers = userBreakdown.filter(u => u.commitmentRate > 80).length
  if (highPerformers > userBreakdown.length / 2) {
    strengths.push(`${highPerformers} team members maintaining 80%+ commitment rate`)
  }

  const strongStreaks = userBreakdown.filter(u => u.commitmentStreak >= 10).length
  if (strongStreaks > 0) {
    strengths.push(`${strongStreaks} team members with 10+ day commitment streaks`)
  }

  // Analyze areas for improvement
  const lowPerformers = userBreakdown.filter(u => u.commitmentRate < 50)
  if (lowPerformers.length > 0) {
    improvements.push(`${lowPerformers.length} team members below 50% commitment rate`)
  }

  const lowReflections = userBreakdown.filter(u => u.reflectionRate < 30)
  if (lowReflections.length > 0) {
    improvements.push(`${lowReflections.length} team members need to improve reflection habits`)
  }

  const stagnantGoals = userBreakdown.filter(u => u.activeGoals > 0 && u.avgGoalProgress < 30)
  if (stagnantGoals.length > 0) {
    improvements.push(`${stagnantGoals.length} team members have stagnant goals`)
  }

  // Generate recommendations
  if (avgCommitmentRate < 60) {
    recommendations.push('Schedule weekly 1-on-1s to review commitments and provide support')
  }

  if (lowReflections.length > userBreakdown.length / 3) {
    recommendations.push('Implement daily reflection reminders or team reflection sessions')
  }

  const noStreaks = userBreakdown.filter(u => u.commitmentStreak < 3).length
  if (noStreaks > userBreakdown.length / 2) {
    recommendations.push('Focus on building consistency - start with 3-day streak challenges')
  }

  if (stagnantGoals.length > 0) {
    recommendations.push('Review and adjust goals to be more achievable and measurable')
  }

  return {
    strengths,
    improvements,
    recommendations
  }
}

function generateUserInsights(userData, timeline) {
  const strengths = []
  const improvements = []
  const recommendations = []

  // Analyze individual performance
  if (userData.commitmentRate > 80) {
    strengths.push('Excellent commitment completion rate')
  }
  if (userData.commitmentStreak >= 10) {
    strengths.push(`Strong ${userData.commitmentStreak}-day commitment streak`)
  }
  if (userData.reflectionRate > 70) {
    strengths.push('Consistent reflection practice')
  }
  if (userData.avgGoalProgress > 70) {
    strengths.push('Good progress on goals')
  }

  // Areas for improvement
  if (userData.commitmentRate < 50) {
    improvements.push('Commitment completion needs improvement')
  }
  if (userData.commitmentStreak < 3) {
    improvements.push('Build consistent daily habits')
  }
  if (userData.reflectionRate < 30) {
    improvements.push('Increase reflection frequency')
  }
  if (userData.avgCalls < 15) {
    improvements.push('Increase daily phone call activity')
  }

  // Recommendations
  if (userData.commitmentRate < 60) {
    recommendations.push('Break down commitments into smaller, achievable tasks')
  }
  if (userData.reflectionRate < 50) {
    recommendations.push('Set a daily reminder for end-of-day reflection')
  }
  if (userData.commitmentStreak < 5) {
    recommendations.push('Focus on a 5-day streak as your first milestone')
  }
  if (userData.activeGoals > 3) {
    recommendations.push('Consider focusing on fewer goals for better progress')
  }

  return {
    strengths,
    improvements,
    recommendations
  }
}
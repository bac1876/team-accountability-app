// Database connection and utilities for Vercel Postgres - API version
import { sql } from '@vercel/postgres'

// Database connection wrapper with error handling
export async function query(text, params = []) {
  try {
    const result = await sql.query(text, params)
    return result
  } catch (error) {
    console.error('Database query error:', error)
    throw new Error(`Database error: ${error.message}`)
  }
}

// User management functions
export const userQueries = {
  // Get all users
  async getAll() {
    const result = await query('SELECT * FROM users ORDER BY name')
    return result.rows
  },

  // Get user by email
  async getByEmail(email) {
    const result = await query('SELECT * FROM users WHERE email = $1', [email])
    return result.rows[0]
  },

  // Get user by ID
  async getById(id) {
    const result = await query('SELECT * FROM users WHERE id = $1', [id])
    return result.rows[0]
  },

  // Create new user
  async create(userData) {
    const { email, password, name, phone, role = 'member' } = userData
    const result = await query(
      'INSERT INTO users (email, password, name, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email, password, name, phone, role]
    )
    return result.rows[0]
  },

  // Update user
  async update(id, userData) {
    const { email, password, name, phone, role } = userData
    const result = await query(
      'UPDATE users SET email = $1, password = $2, name = $3, phone = $4, role = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [email, password, name, phone, role, id]
    )
    return result.rows[0]
  },

  // Delete user
  async delete(id) {
    const result = await query('DELETE FROM users WHERE id = $1 RETURNING *', [id])
    return result.rows[0]
  }
}

// Commitment management functions
export const commitmentQueries = {
  // Get commitments by user
  async getByUser(userId) {
    const result = await query(
      'SELECT * FROM commitments WHERE user_id = $1 ORDER BY commitment_date DESC',
      [userId]
    )
    return result.rows
  },

  // Get commitments by user and date
  async getByUserAndDate(userId, date) {
    const result = await query(
      'SELECT * FROM commitments WHERE user_id = $1 AND commitment_date = $2',
      [userId, date]
    )
    return result.rows[0]
  },

  // Create new commitment
  async create(commitmentData) {
    const { userId, date, commitmentText, status = 'pending' } = commitmentData
    const result = await query(
      'INSERT INTO commitments (user_id, commitment_date, commitment_text, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, date, commitmentText, status]
    )
    return result.rows[0]
  },

  // Update commitment status
  async updateStatus(userId, date, status) {
    const result = await query(
      'UPDATE commitments SET status = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND commitment_date = $2 RETURNING *',
      [userId, date, status]
    )
    return result.rows[0]
  },

  // Get today's commitments for all users
  async getTodayForAll() {
    const today = new Date().toISOString().split('T')[0]
    const result = await query(
      'SELECT c.*, u.name, u.email FROM commitments c JOIN users u ON c.user_id = u.id WHERE c.commitment_date = $1',
      [today]
    )
    return result.rows
  }
}

// Goal management functions
export const goalQueries = {
  // Get goals by user
  async getByUser(userId) {
    const result = await query(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return result.rows
  },

  // Create new goal
  async create(goalData) {
    const { userId, goalText, targetDate = null } = goalData
    const result = await query(
      'INSERT INTO goals (user_id, goal_text, target_date) VALUES ($1, $2, $3) RETURNING *',
      [userId, goalText, targetDate]
    )
    return result.rows[0]
  },

  // Update goal progress
  async updateProgress(goalId, progress) {
    const status = progress >= 100 ? 'completed' : 'in_progress'
    const result = await query(
      'UPDATE goals SET progress = $2, status = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [goalId, progress, status]
    )
    return result.rows[0]
  },

  // Delete goal
  async delete(goalId) {
    const result = await query('DELETE FROM goals WHERE id = $1 RETURNING *', [goalId])
    return result.rows[0]
  }
}

// Reflection management functions
export const reflectionQueries = {
  // Get reflections by user
  async getByUser(userId) {
    const result = await query(
      'SELECT * FROM reflections WHERE user_id = $1 ORDER BY reflection_date DESC',
      [userId]
    )
    return result.rows
  },

  // Get reflection by user and date
  async getByUserAndDate(userId, date) {
    const result = await query(
      'SELECT * FROM reflections WHERE user_id = $1 AND reflection_date = $2',
      [userId, date]
    )
    return result.rows[0]
  },

  // Create new reflection
  async create(reflectionData) {
    const { userId, date, wins, challenges, tomorrowFocus } = reflectionData
    const result = await query(
      'INSERT INTO reflections (user_id, reflection_date, wins, challenges, tomorrow_focus) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, date, wins, challenges, tomorrowFocus]
    )
    return result.rows[0]
  }
}

// Analytics functions
export const analyticsQueries = {
  // Get team analytics
  async getTeamStats() {
    const today = new Date().toISOString().split('T')[0]

    // Get user count
    const userCount = await query('SELECT COUNT(*) FROM users')

    // Get today's active users
    const activeToday = await query(
      'SELECT COUNT(DISTINCT user_id) FROM commitments WHERE commitment_date = $1',
      [today]
    )

    // Get completion rates
    const completionStats = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM commitments
      WHERE commitment_date >= CURRENT_DATE - INTERVAL '7 days'
    `)

    // Get goal completion rates
    const goalStats = await query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM goals
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
    `)

    return {
      totalUsers: parseInt(userCount.rows[0].count),
      activeToday: parseInt(activeToday.rows[0].count),
      overallCompletion: completionStats.rows[0].total > 0
        ? Math.round((completionStats.rows[0].completed / completionStats.rows[0].total) * 100)
        : 0,
      weeklyGoalsCompletion: goalStats.rows[0].total > 0
        ? Math.round((goalStats.rows[0].completed / goalStats.rows[0].total) * 100)
        : 0
    }
  },

  // Get user analytics
  async getUserAnalytics(userId) {
    const stats = await query(`
      SELECT
        (SELECT COUNT(*) FROM commitments WHERE user_id = $1 AND status = 'completed') as completed_commitments,
        (SELECT COUNT(*) FROM commitments WHERE user_id = $1) as total_commitments,
        (SELECT COUNT(*) FROM goals WHERE user_id = $1 AND status = 'completed') as completed_goals,
        (SELECT COUNT(*) FROM goals WHERE user_id = $1) as total_goals,
        (SELECT COUNT(*) FROM reflections WHERE user_id = $1) as total_reflections
    `, [userId])

    return stats.rows[0]
  }
}
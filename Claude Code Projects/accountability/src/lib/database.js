// Database connection and utilities for Vercel Postgres
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
    await query('DELETE FROM users WHERE id = $1', [id])
    return true
  },

  // Bulk insert users (for import functionality)
  async bulkCreate(users) {
    const results = []
    for (const user of users) {
      try {
        const result = await this.create(user)
        results.push({ success: true, user: result })
      } catch (error) {
        results.push({ success: false, error: error.message, email: user.email })
      }
    }
    return results
  }
}

// Daily commitments functions
export const commitmentQueries = {
  // Get commitments for a user on a specific date
  async getByUserAndDate(userId, date) {
    const result = await query(
      'SELECT * FROM daily_commitments WHERE user_id = $1 AND commitment_date = $2',
      [userId, date]
    )
    return result.rows[0]
  },

  // Get all commitments for a user
  async getByUser(userId, limit = 30) {
    const result = await query(
      'SELECT * FROM daily_commitments WHERE user_id = $1 ORDER BY commitment_date DESC LIMIT $2',
      [userId, limit]
    )
    return result.rows
  },

  // Create or update daily commitment
  async upsert(userId, date, commitmentText, status = 'pending') {
    const result = await query(
      `INSERT INTO daily_commitments (user_id, commitment_date, commitment_text, status) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, commitment_date) 
       DO UPDATE SET commitment_text = $3, status = $4, updated_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [userId, date, commitmentText, status]
    )
    return result.rows[0]
  },

  // Update commitment status
  async updateStatus(userId, date, status) {
    const result = await query(
      'UPDATE daily_commitments SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND commitment_date = $3 RETURNING *',
      [status, userId, date]
    )
    return result.rows[0]
  },

  // Get today's commitments for all users
  async getTodayForAllUsers() {
    const today = new Date().toISOString().split('T')[0]
    const result = await query(
      `SELECT dc.*, u.name, u.email, u.phone 
       FROM daily_commitments dc 
       JOIN users u ON dc.user_id = u.id 
       WHERE dc.commitment_date = $1`,
      [today]
    )
    return result.rows
  }
}

// Weekly goals functions
export const goalQueries = {
  // Get active goals for a user
  async getActiveByUser(userId) {
    const result = await query(
      'SELECT * FROM weekly_goals WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
      [userId, 'active']
    )
    return result.rows
  },

  // Get all goals for a user
  async getByUser(userId) {
    const result = await query(
      'SELECT * FROM weekly_goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    )
    return result.rows
  },

  // Create new goal
  async create(userId, goalText, targetDate = null) {
    const result = await query(
      'INSERT INTO weekly_goals (user_id, goal_text, target_date) VALUES ($1, $2, $3) RETURNING *',
      [userId, goalText, targetDate]
    )
    return result.rows[0]
  },

  // Update goal progress
  async updateProgress(goalId, progress) {
    const status = progress >= 100 ? 'completed' : 'active'
    const result = await query(
      'UPDATE weekly_goals SET progress = $1, status = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [progress, status, goalId]
    )
    return result.rows[0]
  },

  // Delete goal
  async delete(goalId) {
    await query('DELETE FROM weekly_goals WHERE id = $1', [goalId])
    return true
  }
}

// Reflections functions
export const reflectionQueries = {
  // Get reflection for user on specific date
  async getByUserAndDate(userId, date) {
    const result = await query(
      'SELECT * FROM reflections WHERE user_id = $1 AND reflection_date = $2',
      [userId, date]
    )
    return result.rows[0]
  },

  // Get recent reflections for user
  async getByUser(userId, limit = 10) {
    const result = await query(
      'SELECT * FROM reflections WHERE user_id = $1 ORDER BY reflection_date DESC LIMIT $2',
      [userId, limit]
    )
    return result.rows
  },

  // Create or update reflection
  async upsert(userId, date, wins, challenges, tomorrowFocus) {
    const result = await query(
      `INSERT INTO reflections (user_id, reflection_date, wins, challenges, tomorrow_focus) 
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (user_id, reflection_date) 
       DO UPDATE SET wins = $3, challenges = $4, tomorrow_focus = $5, updated_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [userId, date, wins, challenges, tomorrowFocus]
    )
    return result.rows[0]
  }
}

// Message history functions
export const messageQueries = {
  // Log sent message
  async logMessage(userId, messageType, messageText, webhookUrl, success, errorMessage = null) {
    const result = await query(
      'INSERT INTO message_history (user_id, message_type, message_text, webhook_url, success, error_message) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [userId, messageType, messageText, webhookUrl, success, errorMessage]
    )
    return result.rows[0]
  },

  // Get recent messages
  async getRecent(limit = 50) {
    const result = await query(
      `SELECT mh.*, u.name, u.email 
       FROM message_history mh 
       JOIN users u ON mh.user_id = u.id 
       ORDER BY mh.sent_at DESC 
       LIMIT $1`,
      [limit]
    )
    return result.rows
  },

  // Get message stats
  async getStats(days = 30) {
    const result = await query(
      `SELECT 
         COUNT(*) as total,
         COUNT(CASE WHEN success = true THEN 1 END) as successful,
         COUNT(CASE WHEN success = false THEN 1 END) as failed,
         COUNT(CASE WHEN sent_at >= CURRENT_DATE - INTERVAL '7 days' THEN 1 END) as this_week
       FROM message_history 
       WHERE sent_at >= CURRENT_DATE - INTERVAL '${days} days'`
    )
    return result.rows[0]
  }
}

// Webhook configuration functions
export const webhookQueries = {
  // Get all webhook configurations
  async getAll() {
    const result = await query('SELECT * FROM webhook_config ORDER BY webhook_type')
    return result.rows
  },

  // Get webhook URL by type
  async getByType(webhookType) {
    const result = await query('SELECT * FROM webhook_config WHERE webhook_type = $1', [webhookType])
    return result.rows[0]
  },

  // Set webhook URL
  async setWebhook(webhookType, webhookUrl) {
    const result = await query(
      `INSERT INTO webhook_config (webhook_type, webhook_url) 
       VALUES ($1, $2) 
       ON CONFLICT (webhook_type) 
       DO UPDATE SET webhook_url = $2, updated_at = CURRENT_TIMESTAMP 
       RETURNING *`,
      [webhookType, webhookUrl]
    )
    return result.rows[0]
  },

  // Toggle webhook active status
  async toggleActive(webhookType, isActive) {
    const result = await query(
      'UPDATE webhook_config SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE webhook_type = $2 RETURNING *',
      [isActive, webhookType]
    )
    return result.rows[0]
  }
}

// Analytics functions
export const analyticsQueries = {
  // Get comprehensive team analytics
  async getTeamAnalytics() {
    // Get user count
    const userCountResult = await query('SELECT COUNT(*) as total FROM users WHERE role = $1', ['member'])
    const totalUsers = parseInt(userCountResult.rows[0].total)

    // Get today's activity
    const today = new Date().toISOString().split('T')[0]
    const todayActivityResult = await query(
      'SELECT COUNT(DISTINCT user_id) as active FROM daily_commitments WHERE commitment_date = $1',
      [today]
    )
    const activeToday = parseInt(todayActivityResult.rows[0].active)

    // Get completion rates
    const completionResult = await query(
      `SELECT 
         COUNT(*) as total_commitments,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_commitments
       FROM daily_commitments 
       WHERE commitment_date >= CURRENT_DATE - INTERVAL '30 days'`
    )
    const completionData = completionResult.rows[0]
    const overallCompletion = completionData.total_commitments > 0 
      ? Math.round((completionData.completed_commitments / completionData.total_commitments) * 100)
      : 0

    // Get weekly goals completion
    const goalsResult = await query(
      `SELECT 
         COUNT(*) as total_goals,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_goals
       FROM weekly_goals 
       WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'`
    )
    const goalsData = goalsResult.rows[0]
    const weeklyGoalsCompletion = goalsData.total_goals > 0 
      ? Math.round((goalsData.completed_goals / goalsData.total_goals) * 100)
      : 0

    // Get individual user analytics
    const userAnalyticsResult = await query(
      `SELECT 
         u.id, u.name, u.email,
         COUNT(dc.id) as total_commitments,
         COUNT(CASE WHEN dc.status = 'completed' THEN 1 END) as completed_commitments,
         COUNT(wg.id) as total_goals,
         COUNT(CASE WHEN wg.status = 'completed' THEN 1 END) as completed_goals,
         MAX(dc.commitment_date) as last_activity
       FROM users u
       LEFT JOIN daily_commitments dc ON u.id = dc.user_id AND dc.commitment_date >= CURRENT_DATE - INTERVAL '30 days'
       LEFT JOIN weekly_goals wg ON u.id = wg.user_id AND wg.created_at >= CURRENT_DATE - INTERVAL '30 days'
       WHERE u.role = 'member'
       GROUP BY u.id, u.name, u.email
       ORDER BY u.name`
    )

    const users = userAnalyticsResult.rows.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      completionRate: user.total_commitments > 0 
        ? Math.round((user.completed_commitments / user.total_commitments) * 100)
        : 0,
      totalCommitments: parseInt(user.total_commitments),
      completedCommitments: parseInt(user.completed_commitments),
      totalGoals: parseInt(user.total_goals),
      completedGoals: parseInt(user.completed_goals),
      lastActivity: user.last_activity
    }))

    return {
      totalUsers,
      activeToday,
      overallCompletion,
      weeklyGoalsCompletion,
      users
    }
  }
}

// Database initialization function
export async function initializeDatabase() {
  try {
    // Check if tables exist by trying to query users table
    await query('SELECT 1 FROM users LIMIT 1')
    console.log('Database already initialized')
    return true
  } catch (error) {
    console.log('Database not initialized, creating tables...')
    
    // Read and execute schema file
    const fs = await import('fs')
    const path = await import('path')
    const schemaPath = path.join(process.cwd(), 'sql', 'schema.sql')
    
    try {
      const schema = fs.readFileSync(schemaPath, 'utf8')
      await sql.query(schema)
      console.log('Database initialized successfully')
      return true
    } catch (schemaError) {
      console.error('Failed to initialize database:', schemaError)
      throw schemaError
    }
  }
}

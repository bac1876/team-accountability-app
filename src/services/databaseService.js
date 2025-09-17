// Frontend service for database operations
const API_BASE = '/api'

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// Authentication service
export const authService = {
  async login(email, password) {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }
}

// User management service
export const userService = {
  async getAll() {
    return apiCall('/users')
  },

  async create(userData) {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  },

  async update(id, userData) {
    return apiCall('/users', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData })
    })
  },

  async delete(userId) {
    return apiCall(`/users?userId=${userId}`, {
      method: 'DELETE'
    })
  },

  async bulkImportPreview() {
    return apiCall('/users/bulk-import')
  },

  async bulkImport() {
    return apiCall('/users/bulk-import', {
      method: 'POST'
    })
  }
}

// Commitments service
export const commitmentService = {
  async getToday(userId) {
    return apiCall(`/commitments?userId=${userId}`)
  },

  async getHistory(userId) {
    return apiCall(`/commitments?userId=${userId}&history=true`)
  },

  async save(userId, date, commitmentText, status = 'pending') {
    return apiCall('/commitments', {
      method: 'POST',
      body: JSON.stringify({ userId, date, commitmentText, status })
    })
  },

  async updateStatus(userId, date, status) {
    return apiCall('/commitments', {
      method: 'PUT',
      body: JSON.stringify({ userId, date, status })
    })
  }
}

// Goals service
export const goalService = {
  async getActive(userId) {
    return apiCall(`/goals?userId=${userId}&active=true`)
  },

  async getAll(userId) {
    return apiCall(`/goals?userId=${userId}`)
  },

  async create(userId, goalText, targetDate = null) {
    return apiCall('/goals', {
      method: 'POST',
      body: JSON.stringify({ userId, goalText, targetDate })
    })
  },

  async updateProgress(goalId, progress) {
    return apiCall('/goals', {
      method: 'PUT',
      body: JSON.stringify({ goalId, progress })
    })
  },

  async delete(goalId) {
    return apiCall(`/goals?goalId=${goalId}`, {
      method: 'DELETE'
    })
  }
}

// Analytics service
export const analyticsService = {
  async getTeamAnalytics() {
    return apiCall('/analytics')
  }
}

// Database initialization service
export const databaseService = {
  async initialize(token) {
    return apiCall('/database/init', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
  }
}

// Migration helper to move from localStorage to database
export const migrationService = {
  async migrateFromLocalStorage() {
    try {
      // Get existing localStorage data
      const users = JSON.parse(localStorage.getItem('users') || '[]')
      const commitments = JSON.parse(localStorage.getItem('commitments') || '{}')
      const goals = JSON.parse(localStorage.getItem('goals') || '{}')
      const reflections = JSON.parse(localStorage.getItem('reflections') || '{}')

      const results = {
        users: { migrated: 0, errors: [] },
        commitments: { migrated: 0, errors: [] },
        goals: { migrated: 0, errors: [] },
        reflections: { migrated: 0, errors: [] }
      }

      // Migrate users (skip if they already exist in database)
      for (const user of users) {
        try {
          await userService.create(user)
          results.users.migrated++
        } catch (error) {
          if (!error.message.includes('already exists')) {
            results.users.errors.push({ user: user.email, error: error.message })
          }
        }
      }

      // Get user IDs from database for commitment/goal migration
      const dbUsers = await userService.getAll()
      const emailToIdMap = {}
      dbUsers.forEach(user => {
        emailToIdMap[user.email] = user.id
      })

      // Migrate commitments
      for (const [userEmail, userCommitments] of Object.entries(commitments)) {
        const userId = emailToIdMap[userEmail]
        if (!userId) continue

        for (const [date, commitment] of Object.entries(userCommitments)) {
          try {
            await commitmentService.save(userId, date, commitment.text, commitment.status)
            results.commitments.migrated++
          } catch (error) {
            results.commitments.errors.push({ user: userEmail, date, error: error.message })
          }
        }
      }

      // Migrate goals
      for (const [userEmail, userGoals] of Object.entries(goals)) {
        const userId = emailToIdMap[userEmail]
        if (!userId) continue

        for (const goal of userGoals) {
          try {
            const newGoal = await goalService.create(userId, goal.text, goal.targetDate)
            if (goal.progress > 0) {
              await goalService.updateProgress(newGoal.id, goal.progress)
            }
            results.goals.migrated++
          } catch (error) {
            results.goals.errors.push({ user: userEmail, goal: goal.text, error: error.message })
          }
        }
      }

      return results
    } catch (error) {
      throw new Error(`Migration failed: ${error.message}`)
    }
  },

  async clearLocalStorage() {
    localStorage.removeItem('users')
    localStorage.removeItem('commitments')
    localStorage.removeItem('goals')
    localStorage.removeItem('reflections')
    localStorage.removeItem('currentUser')
    localStorage.removeItem('analytics')
  }
}

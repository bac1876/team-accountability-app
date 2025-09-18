// API client for frontend to backend communication

const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? '' // Use relative URLs in production
  : 'http://localhost:3000' // Use local server in development

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`

  console.log('Making API call to:', url)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Include cookies for session management
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }))
      console.error('API response error:', error)
      throw new Error(error.error || `HTTP ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error)
    // If fetch itself failed, it might be a network or CORS issue
    if (error.message === 'Failed to fetch') {
      console.error('Network error - API might be down or CORS issue')
    }
    throw error
  }
}

// Authentication APIs
export const authAPI = {
  async login(email, password) {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  },

  async logout() {
    // Clear local session
    localStorage.removeItem('currentUser')
    return { success: true }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('currentUser')
    return userStr ? JSON.parse(userStr) : null
  },

  setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user))
  }
}

// Users APIs
export const usersAPI = {
  async getAll() {
    return apiCall('/users')
  },

  async getById(id) {
    return apiCall(`/users/${id}`)
  },

  async create(userData) {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  async update(id, userData) {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    })
  },

  async delete(id) {
    return apiCall(`/users/${id}`, {
      method: 'DELETE',
    })
  },

  async bulkImport(users) {
    return apiCall('/users/bulk-import', {
      method: 'POST',
      body: JSON.stringify({ users }),
    })
  }
}

// Commitments APIs
export const commitmentsAPI = {
  async getByUser(userId) {
    return apiCall(`/commitments?userId=${userId}`)
  },

  async getByUserAndDate(userId, date) {
    return apiCall(`/commitments?userId=${userId}&date=${date}`)
  },

  async create(userId, date, commitmentText, status = 'pending') {
    return apiCall('/commitments', {
      method: 'POST',
      body: JSON.stringify({ userId, date, commitmentText, status }),
    })
  },

  async updateStatus(userId, date, status) {
    return apiCall('/commitments/status', {
      method: 'PUT',
      body: JSON.stringify({ userId, date, status }),
    })
  },

  async getTodayForAll() {
    return apiCall('/commitments/today')
  }
}

// Goals APIs
export const goalsAPI = {
  async getByUser(userId) {
    return apiCall(`/goals?userId=${userId}`)
  },

  async create(userId, goalText, targetDate = null) {
    return apiCall('/goals', {
      method: 'POST',
      body: JSON.stringify({ userId, goalText, targetDate }),
    })
  },

  async updateProgress(goalId, progress) {
    return apiCall(`/goals/${goalId}/progress`, {
      method: 'PUT',
      body: JSON.stringify({ progress }),
    })
  },

  async delete(goalId) {
    return apiCall(`/goals/${goalId}`, {
      method: 'DELETE',
    })
  }
}

// Reflections APIs
export const reflectionsAPI = {
  async getByUser(userId) {
    return apiCall(`/reflections?userId=${userId}`)
  },

  async getByUserAndDate(userId, date) {
    return apiCall(`/reflections?userId=${userId}&date=${date}`)
  },

  async create(userId, date, wins, challenges, tomorrowFocus) {
    return apiCall('/reflections', {
      method: 'POST',
      body: JSON.stringify({ userId, date, wins, challenges, tomorrowFocus }),
    })
  }
}

// Analytics APIs
export const analyticsAPI = {
  async getTeamAnalytics() {
    return apiCall('/analytics')
  },

  async getUserAnalytics(userId) {
    return apiCall(`/analytics/user/${userId}`)
  }
}

// Export all APIs
export default {
  auth: authAPI,
  users: usersAPI,
  commitments: commitmentsAPI,
  goals: goalsAPI,
  reflections: reflectionsAPI,
  analytics: analyticsAPI
}
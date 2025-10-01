// API client for frontend to backend communication

// Detect environment based on hostname for more reliable production detection
const isLocalhost = window.location.hostname === 'localhost' ||
                   window.location.hostname === '127.0.0.1' ||
                   window.location.hostname.startsWith('192.168.') ||
                   window.location.hostname.startsWith('10.')

const API_BASE_URL = isLocalhost
  ? 'http://localhost:3000' // Use local server in development
  : '' // Use relative URLs in production

// Helper for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}/api${endpoint}`


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

    const data = await response.json()
    return data
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
    // Fallback to localStorage auth if API is not available
    try {
      return await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
    } catch (error) {
      // If API fails, use localStorage authentication
      console.log('API not available, using localStorage authentication')
      const { userStore } = await import('../utils/dataStore.js')
      const users = userStore.getAll()
      const user = users.find(u => u.email === email || u.username === email)

      if (user && user.password === password) {
        return { success: true, user }
      } else {
        throw new Error('Invalid email or password')
      }
    }
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
  async getByUser(userId, isAdmin = false) {
    return apiCall(`/commitments?userId=${userId}&isAdmin=${isAdmin}`)
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

  async updateById(commitmentId, commitmentText, status) {
    return apiCall('/commitments', {
      method: 'PUT',
      body: JSON.stringify({ id: commitmentId, commitmentText, status }),
    })
  },

  async updateStatus(userId, date, status) {
    return apiCall('/commitments', {
      method: 'PUT',
      body: JSON.stringify({ userId, date, status }),
    })
  },

  async getTodayForAll() {
    return apiCall('/commitments/today')
  },

  async delete(commitmentId) {
    return apiCall('/commitments', {
      method: 'DELETE',
      body: JSON.stringify({ id: commitmentId }),
    })
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

  async updateGoal(goalId, goalText, progress) {
    return apiCall('/goals', {
      method: 'PUT',
      body: JSON.stringify({ goalId, goalText, progress }),
    })
  },

  async updateProgress(goalId, progress) {
    return apiCall('/goals', {
      method: 'PUT',
      body: JSON.stringify({ goalId, progress }),
    })
  },

  async delete(goalId) {
    return apiCall(`/goals?goalId=${goalId}`, {
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

// Phone Calls APIs
export const phoneCallsAPI = {
  async getByUser(userId, startDate = null, endDate = null) {
    let url = `/phone-calls?userId=${userId}`
    if (startDate) url += `&startDate=${startDate}`
    if (endDate) url += `&endDate=${endDate}`
    return apiCall(url)
  },

  async setGoal(userId, date, targetCalls) {
    return apiCall('/phone-calls', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        call_date: date,
        target_calls: targetCalls
      }),
    })
  },

  async logCalls(userId, date, actualCalls, targetCalls = null, notes = '') {
    return apiCall('/phone-calls', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        call_date: date,
        target_calls: targetCalls,
        actual_calls: actualCalls,
        notes
      }),
    })
  },

  async getWeeklyStats(userId, startDate = null, endDate = null) {
    let url = `/phone-calls/stats?userId=${userId}`
    if (startDate) url += `&startDate=${startDate}`
    if (endDate) url += `&endDate=${endDate}`
    return apiCall(url)
  }
}

// Export all APIs
export default {
  auth: authAPI,
  users: usersAPI,
  commitments: commitmentsAPI,
  goals: goalsAPI,
  reflections: reflectionsAPI,
  analytics: analyticsAPI,
  phoneCalls: phoneCallsAPI
}
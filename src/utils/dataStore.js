// Data persistence utilities for the Team Accountability app
// This provides a simple localStorage-based data store that can be easily
// upgraded to a real database later

const STORAGE_KEYS = {
  USERS: 'teamUsers',
  COMMITMENTS: 'userCommitments',
  GOALS: 'userGoals',
  REFLECTIONS: 'userReflections',
  USER_DATA: 'userData'
}

// User Management
export const userStore = {
  getAll: () => {
    const users = localStorage.getItem(STORAGE_KEYS.USERS)
    return users ? JSON.parse(users) : []
  },

  save: (users) => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
  },

  add: (user) => {
    const users = userStore.getAll()
    const newUser = { ...user, id: Math.max(...users.map(u => u.id), 0) + 1 }
    users.push(newUser)
    userStore.save(users)
    return newUser
  },

  update: (userId, userData) => {
    const users = userStore.getAll()
    const index = users.findIndex(u => u.id === userId)
    if (index !== -1) {
      users[index] = { ...users[index], ...userData }
      userStore.save(users)
      return users[index]
    }
    return null
  },

  delete: (userId) => {
    const users = userStore.getAll()
    const filteredUsers = users.filter(u => u.id !== userId)
    userStore.save(filteredUsers)
    return filteredUsers
  },

  findByUsername: (username) => {
    const users = userStore.getAll()
    return users.find(u => u.username === username)
  }
}

// User Data (commitments, goals, reflections)
export const userDataStore = {
  getUserData: (userId) => {
    const allData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    const userData = allData ? JSON.parse(allData) : {}
    return userData[userId] || {
      commitments: [],
      goals: [],
      reflections: [],
      stats: {
        totalCommitments: 0,
        completedCommitments: 0,
        completionRate: 0
      }
    }
  },

  saveUserData: (userId, data) => {
    const allData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    const userData = allData ? JSON.parse(allData) : {}
    userData[userId] = data
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData))
  },

  addCommitment: (userId, commitment) => {
    const userData = userDataStore.getUserData(userId)
    const newCommitment = {
      id: Date.now(),
      text: commitment,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      createdAt: new Date().toISOString()
    }
    userData.commitments.push(newCommitment)
    userData.stats.totalCommitments = userData.commitments.length
    userData.stats.completedCommitments = userData.commitments.filter(c => c.status === 'completed').length
    userData.stats.completionRate = userData.stats.totalCommitments > 0 
      ? Math.round((userData.stats.completedCommitments / userData.stats.totalCommitments) * 100)
      : 0
    userDataStore.saveUserData(userId, userData)
    return newCommitment
  },

  updateCommitmentStatus: (userId, commitmentId, status) => {
    const userData = userDataStore.getUserData(userId)
    const commitment = userData.commitments.find(c => c.id === commitmentId)
    if (commitment) {
      commitment.status = status
      commitment.updatedAt = new Date().toISOString()
      userData.stats.completedCommitments = userData.commitments.filter(c => c.status === 'completed').length
      userData.stats.completionRate = userData.stats.totalCommitments > 0 
        ? Math.round((userData.stats.completedCommitments / userData.stats.totalCommitments) * 100)
        : 0
      userDataStore.saveUserData(userId, userData)
    }
    return commitment
  },

  addGoal: (userId, goal) => {
    const userData = userDataStore.getUserData(userId)
    const newGoal = {
      id: Date.now(),
      text: goal,
      progress: 0,
      completed: false,
      createdAt: new Date().toISOString(),
      weekOf: new Date().toISOString().split('T')[0]
    }
    userData.goals.push(newGoal)
    userDataStore.saveUserData(userId, userData)
    return newGoal
  },

  updateGoalProgress: (userId, goalId, progress) => {
    const userData = userDataStore.getUserData(userId)
    const goal = userData.goals.find(g => g.id === goalId)
    if (goal) {
      goal.progress = progress
      goal.completed = progress >= 100
      goal.updatedAt = new Date().toISOString()
      userDataStore.saveUserData(userId, userData)
    }
    return goal
  },

  addReflection: (userId, reflection) => {
    const userData = userDataStore.getUserData(userId)
    const newReflection = {
      id: Date.now(),
      ...reflection,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    }
    userData.reflections.push(newReflection)
    userDataStore.saveUserData(userId, userData)
    return newReflection
  }
}

// Team Analytics
export const analyticsStore = {
  getTeamStats: () => {
    const users = userStore.getAll()
    const allUserData = localStorage.getItem(STORAGE_KEYS.USER_DATA)
    const userData = allUserData ? JSON.parse(allUserData) : {}

    const stats = {
      totalUsers: users.length,
      activeToday: 0,
      overallCompletion: 0,
      weeklyGoalsCompletion: 0,
      teamData: []
    }

    const today = new Date().toISOString().split('T')[0]
    let totalCompletion = 0
    let totalGoalsCompletion = 0
    let usersWithData = 0

    users.forEach(user => {
      if (user.role !== 'admin') { // Exclude admin from team stats
        const data = userData[user.id] || { commitments: [], goals: [], reflections: [] }
        
        // Check if user is active today (has commitment or recent activity)
        const todayCommitment = data.commitments.find(c => c.date === today)
        const recentActivity = data.commitments.some(c => 
          new Date(c.createdAt).toDateString() === new Date().toDateString()
        )
        
        if (todayCommitment || recentActivity) {
          stats.activeToday++
        }

        // Calculate completion rates
        const completionRate = data.stats?.completionRate || 0
        totalCompletion += completionRate

        // Calculate weekly goals completion
        const currentWeekGoals = data.goals.filter(g => {
          const goalDate = new Date(g.createdAt)
          const weekAgo = new Date()
          weekAgo.setDate(weekAgo.getDate() - 7)
          return goalDate >= weekAgo
        })
        
        const completedWeeklyGoals = currentWeekGoals.filter(g => g.completed).length
        const weeklyGoalsRate = currentWeekGoals.length > 0 
          ? (completedWeeklyGoals / currentWeekGoals.length) * 100 
          : 0
        totalGoalsCompletion += weeklyGoalsRate

        // Add to team data for detailed view
        stats.teamData.push({
          id: user.id,
          name: user.name,
          email: user.email,
          todayCommitment: todayCommitment?.text || '',
          commitmentStatus: todayCommitment?.status || 'pending',
          weeklyGoals: currentWeekGoals.length,
          completedGoals: completedWeeklyGoals,
          lastReflection: data.reflections.length > 0 
            ? data.reflections[data.reflections.length - 1].date 
            : null,
          lastLogin: today, // Simplified - in real app would track actual login times
          completionRate: completionRate
        })

        usersWithData++
      }
    })

    stats.overallCompletion = usersWithData > 0 ? Math.round(totalCompletion / usersWithData) : 0
    stats.weeklyGoalsCompletion = usersWithData > 0 ? Math.round(totalGoalsCompletion / usersWithData) : 0

    return stats
  }
}

// Initialize default data if needed
export const initializeDefaultData = () => {
  const users = userStore.getAll()
  if (users.length === 0) {
    const defaultUsers = [
      { id: 1, username: 'brian@searchnwa.com', password: 'admin123', role: 'admin', name: 'Brian Curtis', email: 'brian@searchnwa.com', phone: '+1-555-0101' },
      { id: 2, username: 'john@example.com', password: 'john123', role: 'member', name: 'John Doe', email: 'john@example.com', phone: '+1-555-0102' },
      { id: 3, username: 'jane@example.com', password: 'jane123', role: 'member', name: 'Jane Smith', email: 'jane@example.com', phone: '+1-555-0103' }
    ]
    userStore.save(defaultUsers)
  }
}

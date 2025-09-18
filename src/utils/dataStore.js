// Data persistence utilities for the Team Accountability app
// This provides a simple localStorage-based data store that can be easily
// upgraded to a real database later

const STORAGE_KEYS = {
  USERS: 'teamUsers',
  COMMITMENTS: 'userCommitments',
  GOALS: 'userGoals',
  REFLECTIONS: 'userReflections',
  USER_DATA: 'userData',
  PHONE_CALLS: 'phoneCallTracking',
  DAILY_FOCUS: 'dailyFocus'
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
  },

  deleteCommitment: (userId, commitmentId) => {
    const userData = userDataStore.getUserData(userId)
    userData.commitments = userData.commitments.filter(c => c.id !== commitmentId)
    userData.stats.totalCommitments = userData.commitments.length
    userData.stats.completedCommitments = userData.commitments.filter(c => c.status === 'completed').length
    userData.stats.completionRate = userData.stats.totalCommitments > 0 
      ? Math.round((userData.stats.completedCommitments / userData.stats.totalCommitments) * 100)
      : 0
    userDataStore.saveUserData(userId, userData)
    return userData.commitments
  },

  updateCommitment: (userId, commitmentId, newText) => {
    const userData = userDataStore.getUserData(userId)
    const commitment = userData.commitments.find(c => c.id === commitmentId)
    if (commitment) {
      commitment.text = newText
      commitment.updatedAt = new Date().toISOString()
      userDataStore.saveUserData(userId, userData)
    }
    return commitment
  },

  deleteGoal: (userId, goalId) => {
    const userData = userDataStore.getUserData(userId)
    userData.goals = userData.goals.filter(g => g.id !== goalId)
    userDataStore.saveUserData(userId, userData)
    return userData.goals
  },

  updateGoal: (userId, goalId, newText) => {
    const userData = userDataStore.getUserData(userId)
    const goal = userData.goals.find(g => g.id === goalId)
    if (goal) {
      goal.text = newText
      goal.updatedAt = new Date().toISOString()
      userDataStore.saveUserData(userId, userData)
    }
    return goal
  }
}

// Admin-specific data access functions
export const adminStore = {
  // Get complete user profile including all data
  getCompleteUserProfile: (userId) => {
    const userData = userDataStore.getUserData(userId)
    const user = userStore.getAll().find(u => u.id === userId)
    
    return {
      user: user,
      userData: userData,
      allCommitments: userData.commitments || [],
      allGoals: userData.goals || [],
      allReflections: userData.reflections || [],
      stats: userData.stats || {
        totalCommitments: 0,
        completedCommitments: 0,
        completionRate: 0
      }
    }
  },

  // Get all users with their complete data
  getAllUsersComplete: () => {
    const users = userStore.getAll()
    return users.map(user => {
      if (user.role !== 'admin') {
        return adminStore.getCompleteUserProfile(user.id)
      }
      return null
    }).filter(profile => profile !== null)
  },

  // Get team member's recent activity (last 7 days)
  getUserRecentActivity: (userId, days = 7) => {
    const profile = adminStore.getCompleteUserProfile(userId)
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    const recentCommitments = profile.allCommitments.filter(c => 
      new Date(c.date) >= cutoffDate
    ).sort((a, b) => new Date(b.date) - new Date(a.date))

    const recentGoals = profile.allGoals.filter(g => 
      new Date(g.createdAt) >= cutoffDate
    ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    const recentReflections = profile.allReflections.filter(r => 
      new Date(r.date) >= cutoffDate
    ).sort((a, b) => new Date(b.date) - new Date(a.date))

    return {
      user: profile.user,
      recentCommitments,
      recentGoals,
      recentReflections,
      stats: profile.stats
    }
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

// Phone Call Tracking
export const phoneCallStore = {
  getAll: () => {
    const calls = localStorage.getItem(STORAGE_KEYS.PHONE_CALLS)
    return calls ? JSON.parse(calls) : []
  },

  save: (calls) => {
    localStorage.setItem(STORAGE_KEYS.PHONE_CALLS, JSON.stringify(calls))
  },

  getUserCalls: (userId) => {
    const calls = phoneCallStore.getAll()
    return calls.filter(call => call.userId === userId)
  },

  addCommitment: (userId, date, targetCalls, description = '') => {
    const calls = phoneCallStore.getAll()
    const existingCommitment = calls.find(call => 
      call.userId === userId && 
      call.date === date && 
      call.type === 'commitment'
    )

    if (existingCommitment) {
      existingCommitment.targetCalls = targetCalls
      existingCommitment.description = description
      existingCommitment.updatedAt = new Date().toISOString()
    } else {
      const newCommitment = {
        id: Math.max(...calls.map(c => c.id), 0) + 1,
        userId,
        date,
        type: 'commitment',
        targetCalls,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      calls.push(newCommitment)
    }
    
    phoneCallStore.save(calls)
    return calls.find(call => 
      call.userId === userId && 
      call.date === date && 
      call.type === 'commitment'
    )
  },

  logActualCalls: (userId, date, actualCalls, notes = '') => {
    const calls = phoneCallStore.getAll()
    const existingLog = calls.find(call => 
      call.userId === userId && 
      call.date === date && 
      call.type === 'actual'
    )

    if (existingLog) {
      existingLog.actualCalls = actualCalls
      existingLog.notes = notes
      existingLog.updatedAt = new Date().toISOString()
    } else {
      const newLog = {
        id: Math.max(...calls.map(c => c.id), 0) + 1,
        userId,
        date,
        type: 'actual',
        actualCalls,
        notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      calls.push(newLog)
    }
    
    phoneCallStore.save(calls)
    return calls.find(call => 
      call.userId === userId && 
      call.date === date && 
      call.type === 'actual'
    )
  },

  getDailyStats: (userId, date) => {
    const calls = phoneCallStore.getAll()
    const commitment = calls.find(call => 
      call.userId === userId && 
      call.date === date && 
      call.type === 'commitment'
    )
    const actual = calls.find(call => 
      call.userId === userId && 
      call.date === date && 
      call.type === 'actual'
    )

    return {
      date,
      targetCalls: commitment?.targetCalls || 0,
      actualCalls: actual?.actualCalls || 0,
      description: commitment?.description || '',
      notes: actual?.notes || '',
      completionRate: commitment?.targetCalls > 0 
        ? Math.round(((actual?.actualCalls || 0) / commitment.targetCalls) * 100)
        : 0
    }
  },

  getWeeklyStats: (userId, startDate = null) => {
    // Helper function to check if date is weekday
    const isWeekday = (date) => {
      const day = date.getDay()
      return day >= 1 && day <= 5 // Monday = 1, Friday = 5
    }

    // Get current week's Monday
    const now = startDate ? new Date(startDate) : new Date()
    const currentDay = now.getDay()
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay // If Sunday, go back 6 days, otherwise go to Monday
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    
    const stats = []
    // Only get weekdays (Monday through Friday)
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      stats.push(phoneCallStore.getDailyStats(userId, dateStr))
    }
    
    const totalTarget = stats.reduce((sum, day) => sum + day.targetCalls, 0)
    const totalActual = stats.reduce((sum, day) => sum + day.actualCalls, 0)
    
    return {
      days: stats,
      totalTarget,
      totalActual,
      weeklyCompletionRate: totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0,
      weekdaysOnly: true
    }
  },

  getMonthlyStats: (userId, year = null, month = null) => {
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month || now.getMonth()
    
    // Helper function to check if date is weekday
    const isWeekday = (date) => {
      const day = date.getDay()
      return day >= 1 && day <= 5 // Monday = 1, Friday = 5
    }
    
    const calls = phoneCallStore.getUserCalls(userId)
    const monthCalls = calls.filter(call => {
      const callDate = new Date(call.date)
      return callDate.getFullYear() === targetYear && 
             callDate.getMonth() === targetMonth &&
             isWeekday(callDate) // Only include weekdays
    })
    
    const commitments = monthCalls.filter(call => call.type === 'commitment')
    const actuals = monthCalls.filter(call => call.type === 'actual')
    
    const totalTarget = commitments.reduce((sum, call) => sum + call.targetCalls, 0)
    const totalActual = actuals.reduce((sum, call) => sum + call.actualCalls, 0)
    
    // Count total weekdays in the month
    const firstDay = new Date(targetYear, targetMonth, 1)
    const lastDay = new Date(targetYear, targetMonth + 1, 0)
    let weekdaysInMonth = 0
    
    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      if (isWeekday(d)) {
        weekdaysInMonth++
      }
    }
    
    return {
      month: targetMonth + 1,
      year: targetYear,
      totalTarget,
      totalActual,
      monthlyCompletionRate: totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0,
      daysWithCommitments: commitments.length,
      daysWithActuals: actuals.length,
      weekdaysInMonth,
      weekdaysOnly: true
    }
  }
}

// Daily Focus Tracking
export const dailyFocusStore = {
  getAll: () => {
    const focus = localStorage.getItem(STORAGE_KEYS.DAILY_FOCUS)
    return focus ? JSON.parse(focus) : []
  },

  save: (focusData) => {
    localStorage.setItem(STORAGE_KEYS.DAILY_FOCUS, JSON.stringify(focusData))
  },

  getUserFocus: (userId) => {
    const allFocus = dailyFocusStore.getAll()
    return allFocus.filter(focus => focus.userId === userId)
  },

  setDailyFocus: (userId, date, focusText, priority = 'high') => {
    const allFocus = dailyFocusStore.getAll()
    const existingFocus = allFocus.find(focus => 
      focus.userId === userId && focus.date === date
    )

    if (existingFocus) {
      existingFocus.focusText = focusText
      existingFocus.priority = priority
      existingFocus.updatedAt = new Date().toISOString()
    } else {
      const newFocus = {
        id: Math.max(...allFocus.map(f => f.id), 0) + 1,
        userId,
        date,
        focusText,
        priority,
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      allFocus.push(newFocus)
    }
    
    dailyFocusStore.save(allFocus)
    return allFocus.find(focus => 
      focus.userId === userId && focus.date === date
    )
  },

  markCompleted: (userId, date, completed = true) => {
    const allFocus = dailyFocusStore.getAll()
    const focus = allFocus.find(f => 
      f.userId === userId && f.date === date
    )

    if (focus) {
      focus.completed = completed
      focus.completedAt = completed ? new Date().toISOString() : null
      focus.updatedAt = new Date().toISOString()
      dailyFocusStore.save(allFocus)
    }

    return focus
  },

  getDailyFocus: (userId, date) => {
    const allFocus = dailyFocusStore.getAll()
    return allFocus.find(focus => 
      focus.userId === userId && focus.date === date
    ) || null
  },

  getWeeklyFocus: (userId, startDate = null) => {
    // Helper function to check if date is weekday
    const isWeekday = (date) => {
      const day = date.getDay()
      return day >= 1 && day <= 5 // Monday = 1, Friday = 5
    }

    // Get current week's Monday
    const now = startDate ? new Date(startDate) : new Date()
    const currentDay = now.getDay()
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
    const monday = new Date(now)
    monday.setDate(now.getDate() + mondayOffset)
    
    const weeklyFocus = []
    // Only get weekdays (Monday through Friday)
    for (let i = 0; i < 5; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const focus = dailyFocusStore.getDailyFocus(userId, dateStr)
      weeklyFocus.push({
        date: dateStr,
        focus: focus || { focusText: '', completed: false, priority: 'medium' }
      })
    }
    
    const completedCount = weeklyFocus.filter(day => day.focus.completed).length
    const totalWithFocus = weeklyFocus.filter(day => day.focus.focusText).length
    
    return {
      days: weeklyFocus,
      completedCount,
      totalWithFocus,
      completionRate: totalWithFocus > 0 ? Math.round((completedCount / totalWithFocus) * 100) : 0,
      weekdaysOnly: true
    }
  },

  getMonthlyFocus: (userId, year = null, month = null) => {
    const now = new Date()
    const targetYear = year || now.getFullYear()
    const targetMonth = month || now.getMonth()
    
    // Helper function to check if date is weekday
    const isWeekday = (date) => {
      const day = date.getDay()
      return day >= 1 && day <= 5
    }
    
    const allFocus = dailyFocusStore.getUserFocus(userId)
    const monthFocus = allFocus.filter(focus => {
      const focusDate = new Date(focus.date)
      return focusDate.getFullYear() === targetYear && 
             focusDate.getMonth() === targetMonth &&
             isWeekday(focusDate)
    })
    
    const completedCount = monthFocus.filter(focus => focus.completed).length
    const totalCount = monthFocus.length
    
    return {
      month: targetMonth + 1,
      year: targetYear,
      totalFocusItems: totalCount,
      completedFocusItems: completedCount,
      monthlyCompletionRate: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      weekdaysOnly: true
    }
  }
}

// Initialize default data if needed
export const initializeDefaultData = () => {
  const users = userStore.getAll()
  if (users.length === 0) {
    const defaultUsers = [
      // Admin
      { id: 1, username: 'brian@searchnwa.com', password: 'Lbbc#2245', role: 'admin', name: 'Brian Curtis', email: 'brian@searchnwa.com', phone: '+1-555-0101' },
      
      // Demo Users
      { id: 2, username: 'john@example.com', password: 'pass123', role: 'member', name: 'John Doe', email: 'john@example.com', phone: '+1-555-0102' },
      { id: 3, username: 'jane@example.com', password: 'pass123', role: 'member', name: 'Jane Smith', email: 'jane@example.com', phone: '+1-555-0103' },
      
      // SearchNWA Team (20 members)
      { id: 4, username: 'brandon@searchnwa.com', password: 'pass123', role: 'member', name: 'Brandon Hollis', email: 'brandon@searchnwa.com', phone: '+1-479-685-8754' },
      { id: 5, username: 'ccarl@searchnwa.com', password: 'pass123', role: 'member', name: 'Carl DeBose', email: 'ccarl@searchnwa.com', phone: '+1-479-461-1333' },
      { id: 6, username: 'chris@searchnwa.com', password: 'pass123', role: 'member', name: 'Chris Adams', email: 'chris@searchnwa.com', phone: '+1-479-685-8755' },
      { id: 7, username: 'chrislee@searchnwa.com', password: 'pass123', role: 'member', name: 'Christopher Lee', email: 'chrislee@searchnwa.com', phone: '+1-479-685-8756' },
      { id: 8, username: 'cindy@searchnwa.com', password: 'pass123', role: 'member', name: 'Cindy Schell', email: 'cindy@searchnwa.com', phone: '+1-479-685-8757' },
      { id: 9, username: 'eujeanie@searchnwa.com', password: 'pass123', role: 'member', name: 'Eujeanie Luker', email: 'eujeanie@searchnwa.com', phone: '+1-479-685-1616' },
      { id: 10, username: 'frank@searchnwa.com', password: 'pass123', role: 'member', name: 'Frank Cardinale', email: 'frank@searchnwa.com', phone: '+1-479-685-8758' },
      { id: 11, username: 'grayson@searchnwa.com', password: 'pass123', role: 'member', name: 'Grayson Geurin', email: 'grayson@searchnwa.com', phone: '+1-479-685-8759' },
      { id: 12, username: 'jacob@searchnwa.com', password: 'pass123', role: 'member', name: 'Jacob Fitzgerald', email: 'jacob@searchnwa.com', phone: '+1-479-685-8760' },
      { id: 13, username: 'kim@searchnwa.com', password: 'pass123', role: 'member', name: 'Kimberly Carter', email: 'kim@searchnwa.com', phone: '+1-479-685-8761' },
      { id: 14, username: 'landon@searchnwa.com', password: 'pass123', role: 'member', name: 'Landon Burkett', email: 'landon@searchnwa.com', phone: '+1-479-685-8762' },
      { id: 15, username: 'luis@searchnwa.com', password: 'pass123', role: 'member', name: 'Luis Jimenez', email: 'luis@searchnwa.com', phone: '+1-479-685-8763' },
      { id: 16, username: 'michael@searchnwa.com', password: 'pass123', role: 'member', name: 'Michael Lyman', email: 'michael@searchnwa.com', phone: '+1-479-685-8764' },
      { id: 17, username: 'michelle@searchnwa.com', password: 'pass123', role: 'member', name: 'Michelle Harrison', email: 'michelle@searchnwa.com', phone: '+1-479-685-8765' },
      { id: 18, username: 'mitch@searchnwa.com', password: 'pass123', role: 'member', name: 'Mitch Sluyter', email: 'mitch@searchnwa.com', phone: '+1-479-685-8766' },
      { id: 19, username: 'lyndsi@searchnwa.com', password: 'pass123', role: 'member', name: 'Lyndsi Sluyter', email: 'lyndsi@searchnwa.com', phone: '+1-479-685-8767' },
      { id: 20, username: 'patrick@searchnwa.com', password: 'pass123', role: 'member', name: 'Patrick Foresee', email: 'patrick@searchnwa.com', phone: '+1-479-685-8768' },
      { id: 21, username: 'bill@searchnwa.com', password: 'pass123', role: 'member', name: 'William Burchit', email: 'bill@searchnwa.com', phone: '+1-479-685-8769' },
      { id: 22, username: 'natalie@searchnwa.com', password: 'pass123', role: 'member', name: 'Natalie Burchit', email: 'natalie@searchnwa.com', phone: '+1-479-685-8770' },
      { id: 23, username: 'thomas@searchnwa.com', password: 'pass123', role: 'member', name: 'Thomas Francis', email: 'thomas@searchnwa.com', phone: '+1-479-685-8771' }
    ]
    userStore.save(defaultUsers)
  }
}

// Streak Calculation Utilities
export const streakStore = {
  // Helper function to check if a date is a weekday
  isWeekday: (dateStr) => {
    const date = new Date(dateStr)
    const day = date.getDay()
    return day >= 1 && day <= 5 // Monday = 1, Friday = 5
  },

  // Calculate commitment streak (excluding weekends)
  calculateCommitmentStreak: (userId, allCommitments) => {
    if (!allCommitments || allCommitments.length === 0) return 0

    // Sort commitments by date descending
    const sortedCommitments = [...allCommitments]
      .filter(c => c.user_id === userId)
      .sort((a, b) => new Date(b.commitment_date) - new Date(a.commitment_date))

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from today and work backwards
    let currentDate = new Date(today)

    // If today is weekend, move to last Friday
    if (!streakStore.isWeekday(currentDate.toISOString().split('T')[0])) {
      while (!streakStore.isWeekday(currentDate.toISOString().split('T')[0])) {
        currentDate.setDate(currentDate.getDate() - 1)
      }
    }

    while (currentDate >= new Date('2024-01-01')) { // Don't go too far back
      const dateStr = currentDate.toISOString().split('T')[0]

      if (streakStore.isWeekday(dateStr)) {
        // Check if there's a completed commitment for this date
        const dayCommitments = sortedCommitments.filter(c =>
          c.commitment_date === dateStr && c.status === 'completed'
        )

        if (dayCommitments.length > 0) {
          streak++
        } else {
          // Streak broken - stop counting
          break
        }
      }

      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  },

  // Calculate phone call streak (25+ calls on weekdays)
  calculatePhoneCallStreak: (userId) => {
    const allCalls = phoneCallStore.getAll()
    const userCalls = allCalls.filter(c => c.userId === userId)

    if (userCalls.length === 0) return 0

    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Start from today and work backwards
    let currentDate = new Date(today)

    // If today is weekend, move to last Friday
    if (!streakStore.isWeekday(currentDate.toISOString().split('T')[0])) {
      while (!streakStore.isWeekday(currentDate.toISOString().split('T')[0])) {
        currentDate.setDate(currentDate.getDate() - 1)
      }
    }

    while (currentDate >= new Date('2024-01-01')) { // Don't go too far back
      const dateStr = currentDate.toISOString().split('T')[0]

      if (streakStore.isWeekday(dateStr)) {
        // Get actual calls for this date
        const dayLog = userCalls.find(c =>
          c.date === dateStr && c.type === 'actual'
        )

        // Check if they made 25+ calls
        if (dayLog && dayLog.actualCalls >= 25) {
          streak++
        } else {
          // Streak broken - stop counting
          break
        }
      }

      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak
  }
}

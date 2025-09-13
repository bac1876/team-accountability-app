// Automated Messaging Service
// Handles daily reminders and team communication via CallAction

import { getCallActionInstance, MessageTemplates } from './callActionAPI.js'
import { getUsers, getUserCommitments, getUserGoals, getAnalytics } from '../utils/dataStore.js'

class MessagingService {
  constructor() {
    this.callAction = null
    this.messageHistory = this.loadMessageHistory()
  }

  // Initialize with CallAction API key
  initialize(apiKey) {
    try {
      this.callAction = getCallActionInstance()
      return { success: true, message: 'Messaging service initialized' }
    } catch (error) {
      console.error('Messaging service initialization failed:', error)
      return { success: false, error: error.message }
    }
  }

  // Send daily reminders to users who haven't set commitments
  async sendDailyReminders(options = {}) {
    if (!this.callAction) {
      throw new Error('Messaging service not initialized')
    }

    const today = new Date().toISOString().split('T')[0]
    const users = getUsers().filter(user => user.role === 'member')
    const remindersToSend = []

    // Identify users who need reminders
    for (const user of users) {
      const commitments = getUserCommitments(user.id)
      const todayCommitment = commitments.find(c => c.date === today)
      
      // Skip if user already has a commitment for today
      if (todayCommitment && todayCommitment.text) {
        continue
      }

      // Skip if already sent reminder today (unless forced)
      if (!options.force && this.wasReminderSentToday(user.id, 'daily')) {
        continue
      }

      remindersToSend.push({
        user,
        type: 'daily_reminder',
        message: MessageTemplates.dailyReminder(user.name.split(' ')[0])
      })
    }

    // Send reminders
    const results = await this.sendBulkMessages(remindersToSend, options)
    
    // Log results
    this.logMessageActivity({
      type: 'daily_reminders',
      date: today,
      sent: results.successful,
      failed: results.failed,
      total: results.total,
      recipients: remindersToSend.map(r => r.user.id)
    })

    return results
  }

  // Send weekly goal reminders
  async sendWeeklyGoalReminders(options = {}) {
    if (!this.callAction) {
      throw new Error('Messaging service not initialized')
    }

    const users = getUsers().filter(user => user.role === 'member')
    const remindersToSend = []

    for (const user of users) {
      const goals = getUserGoals(user.id)
      const activeGoals = goals.filter(g => g.status !== 'completed')
      
      // Send reminder if user has no active goals or hasn't updated in a while
      const shouldRemind = activeGoals.length === 0 || 
        activeGoals.some(g => this.daysSince(g.updatedAt || g.createdAt) > 7)

      if (shouldRemind && (!this.wasReminderSentThisWeek(user.id, 'weekly') || options.force)) {
        remindersToSend.push({
          user,
          type: 'weekly_goal_reminder',
          message: MessageTemplates.weeklyGoalReminder(user.name.split(' ')[0])
        })
      }
    }

    const results = await this.sendBulkMessages(remindersToSend, options)
    
    this.logMessageActivity({
      type: 'weekly_goal_reminders',
      date: new Date().toISOString().split('T')[0],
      sent: results.successful,
      failed: results.failed,
      total: results.total,
      recipients: remindersToSend.map(r => r.user.id)
    })

    return results
  }

  // Send encouragement messages to high performers
  async sendEncouragementMessages(options = {}) {
    if (!this.callAction) {
      throw new Error('Messaging service not initialized')
    }

    const analytics = getAnalytics()
    const users = getUsers().filter(user => user.role === 'member')
    const encouragementMessages = []

    for (const user of users) {
      const userAnalytics = analytics.users.find(u => u.id === user.id)
      if (!userAnalytics) continue

      const completionRate = userAnalytics.completionRate
      
      // Send encouragement to users with high completion rates
      if (completionRate >= 80 && !this.wasReminderSentThisWeek(user.id, 'encouragement')) {
        encouragementMessages.push({
          user,
          type: 'encouragement',
          message: MessageTemplates.encouragement(user.name.split(' ')[0], completionRate)
        })
      }
    }

    const results = await this.sendBulkMessages(encouragementMessages, options)
    
    this.logMessageActivity({
      type: 'encouragement_messages',
      date: new Date().toISOString().split('T')[0],
      sent: results.successful,
      failed: results.failed,
      total: results.total,
      recipients: encouragementMessages.map(r => r.user.id)
    })

    return results
  }

  // Send re-engagement messages to inactive users
  async sendReEngagementMessages(options = {}) {
    if (!this.callAction) {
      throw new Error('Messaging service not initialized')
    }

    const users = getUsers().filter(user => user.role === 'member')
    const reEngagementMessages = []

    for (const user of users) {
      const commitments = getUserCommitments(user.id)
      const lastCommitment = commitments
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0]

      if (!lastCommitment) continue

      const daysSinceLastActivity = this.daysSince(lastCommitment.date)
      
      // Send re-engagement if inactive for 3+ days
      if (daysSinceLastActivity >= 3 && !this.wasReminderSentThisWeek(user.id, 'reengagement')) {
        reEngagementMessages.push({
          user,
          type: 'reengagement',
          message: MessageTemplates.reEngagement(user.name.split(' ')[0], daysSinceLastActivity)
        })
      }
    }

    const results = await this.sendBulkMessages(reEngagementMessages, options)
    
    this.logMessageActivity({
      type: 'reengagement_messages',
      date: new Date().toISOString().split('T')[0],
      sent: results.successful,
      failed: results.failed,
      total: results.total,
      recipients: reEngagementMessages.map(r => r.user.id)
    })

    return results
  }

  // Send custom message to specific users
  async sendCustomMessage(userIds, message, options = {}) {
    if (!this.callAction) {
      throw new Error('Messaging service not initialized')
    }

    const users = getUsers().filter(user => userIds.includes(user.id))
    const messages = users.map(user => ({
      user,
      type: 'custom',
      message: message.replace('{name}', user.name.split(' ')[0])
    }))

    const results = await this.sendBulkMessages(messages, options)
    
    this.logMessageActivity({
      type: 'custom_message',
      date: new Date().toISOString().split('T')[0],
      message: message,
      sent: results.successful,
      failed: results.failed,
      total: results.total,
      recipients: userIds
    })

    return results
  }

  // Send bulk messages with rate limiting and error handling
  async sendBulkMessages(messages, options = {}) {
    const recipients = messages.map(msg => ({
      phone: msg.user.phone,
      message: msg.message,
      id: msg.user.id,
      options: {
        contactId: msg.user.callActionContactId,
        ...options
      }
    }))

    const results = await this.callAction.sendBulkSMS(recipients, '', {
      batchSize: options.batchSize || 5,
      delay: options.delay || 2000,
      ...options
    })

    // Update message history
    messages.forEach((msg, index) => {
      const result = results.results[index]
      this.addToMessageHistory({
        userId: msg.user.id,
        phone: msg.user.phone,
        message: msg.message,
        type: msg.type,
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        timestamp: new Date().toISOString()
      })
    })

    this.saveMessageHistory()
    return results
  }

  // Check if reminder was sent today
  wasReminderSentToday(userId, type) {
    const today = new Date().toISOString().split('T')[0]
    return this.messageHistory.some(msg => 
      msg.userId === userId && 
      msg.type === type && 
      msg.timestamp.startsWith(today) &&
      msg.success
    )
  }

  // Check if reminder was sent this week
  wasReminderSentThisWeek(userId, type) {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    return this.messageHistory.some(msg => 
      msg.userId === userId && 
      msg.type === type && 
      new Date(msg.timestamp) > weekAgo &&
      msg.success
    )
  }

  // Calculate days since a date
  daysSince(dateString) {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  // Add message to history
  addToMessageHistory(messageRecord) {
    this.messageHistory.push(messageRecord)
    
    // Keep only last 1000 messages
    if (this.messageHistory.length > 1000) {
      this.messageHistory = this.messageHistory.slice(-1000)
    }
  }

  // Load message history from localStorage
  loadMessageHistory() {
    try {
      const history = localStorage.getItem('team_accountability_message_history')
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.error('Error loading message history:', error)
      return []
    }
  }

  // Save message history to localStorage
  saveMessageHistory() {
    try {
      localStorage.setItem('team_accountability_message_history', JSON.stringify(this.messageHistory))
    } catch (error) {
      console.error('Error saving message history:', error)
    }
  }

  // Log messaging activity
  logMessageActivity(activity) {
    const activities = this.loadMessageActivities()
    activities.push({
      ...activity,
      timestamp: new Date().toISOString()
    })
    
    // Keep only last 100 activities
    if (activities.length > 100) {
      activities.splice(0, activities.length - 100)
    }
    
    localStorage.setItem('team_accountability_message_activities', JSON.stringify(activities))
  }

  // Load message activities
  loadMessageActivities() {
    try {
      const activities = localStorage.getItem('team_accountability_message_activities')
      return activities ? JSON.parse(activities) : []
    } catch (error) {
      console.error('Error loading message activities:', error)
      return []
    }
  }

  // Get message statistics
  getMessageStats(days = 30) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    const recentMessages = this.messageHistory.filter(msg => 
      new Date(msg.timestamp) > cutoffDate
    )

    const stats = {
      total: recentMessages.length,
      successful: recentMessages.filter(msg => msg.success).length,
      failed: recentMessages.filter(msg => !msg.success).length,
      byType: {},
      byDay: {}
    }

    // Group by type
    recentMessages.forEach(msg => {
      stats.byType[msg.type] = (stats.byType[msg.type] || 0) + 1
    })

    // Group by day
    recentMessages.forEach(msg => {
      const day = msg.timestamp.split('T')[0]
      stats.byDay[day] = (stats.byDay[day] || 0) + 1
    })

    return stats
  }

  // Get recent message history
  getRecentMessages(limit = 50) {
    return this.messageHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit)
  }
}

// Export singleton instance
const messagingService = new MessagingService()
export default messagingService

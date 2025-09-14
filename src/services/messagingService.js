// Automated Messaging Service (Zapier Integration)
// Handles daily reminders and team communication via Zapier webhooks

import zapierIntegration from './zapierIntegration.js'
import { userStore, userDataStore, analyticsStore } from '../utils/dataStore.js'

class MessagingService {
  constructor() {
    this.zapier = zapierIntegration
  }

  // Send daily reminders to users who haven't set commitments
  async sendDailyReminders(options = {}) {
    const today = new Date().toISOString().split('T')[0]
    const users = userStore.getAll().filter(user => user.role === 'member')
    const remindersToSend = []

    // Identify users who need reminders
    for (const user of users) {
      const userData = userDataStore.getUserData(user.id)
      const commitments = userData.commitments
      const todayCommitment = commitments.find(c => c.date === today)
      
      // Skip if user already has a commitment for today
      if (todayCommitment && todayCommitment.text) {
        continue
      }

      // Skip if already sent reminder today (unless forced)
      if (!options.force && this.wasReminderSentToday(user.id, 'daily_reminder')) {
        continue
      }

      remindersToSend.push(user)
    }

    if (remindersToSend.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        message: 'No users need daily reminders'
      }
    }

    // Send reminders via Zapier
    const results = await this.zapier.sendDailyReminders(remindersToSend, options)
    
    // Log results
    this.logMessageActivity({
      type: 'daily_reminders',
      date: today,
      sent: results.successful,
      failed: results.failed,
      total: results.total,
      recipients: remindersToSend.map(r => r.id)
    })

    return results
  }

  // Send weekly goal reminders
  async sendWeeklyGoalReminders(options = {}) {
    const users = userStore.getAll().filter(user => user.role === 'member')
    const remindersToSend = []

    for (const user of users) {
      const userData = userDataStore.getUserData(user.id)
      const goals = userData.goals
      const activeGoals = goals.filter(g => g.status !== 'completed')
      
      // Send reminder if user has no active goals or hasn't updated in a while
      const shouldRemind = activeGoals.length === 0 || 
        activeGoals.some(g => this.daysSince(g.updatedAt || g.createdAt) > 7)

      if (shouldRemind && (!this.wasReminderSentThisWeek(user.id, 'weekly_goal_reminder') || options.force)) {
        remindersToSend.push(user)
      }
    }

    if (remindersToSend.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        message: 'No users need weekly goal reminders'
      }
    }

    const results = await this.zapier.sendWeeklyGoalReminders(remindersToSend, options)
    
    this.logMessageActivity({
      type: 'weekly_goal_reminders',
      date: new Date().toISOString().split('T')[0],
      sent: results.successful,
      failed: results.failed,
      total: results.total,
      recipients: remindersToSend.map(r => r.id)
    })

    return results
  }

  // Send encouragement messages to high performers
  async sendEncouragementMessages(options = {}) {
    const analytics = analyticsStore.getTeamStats()
    const users = userStore.getAll().filter(user => user.role === 'member')
    const encouragementUsers = []

    for (const user of users) {
      const userAnalytics = analytics.users.find(u => u.id === user.id)
      if (!userAnalytics) continue

      const completionRate = userAnalytics.completionRate
      
      // Send encouragement to users with high completion rates
      if (completionRate >= 80 && !this.wasReminderSentThisWeek(user.id, 'encouragement')) {
        encouragementUsers.push({
          ...user,
          completionRate: completionRate
        })
      }
    }

    if (encouragementUsers.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        message: 'No high performers to encourage'
      }
    }

    const results = await this.zapier.sendEncouragementMessages(encouragementUsers, options)
    
    this.logMessageActivity({
      type: 'encouragement_messages',
      date: new Date().toISOString().split('T')[0],
      sent: results.successful,
      failed: results.failed,
      total: results.total,
      recipients: encouragementUsers.map(r => r.id)
    })

    return results
  }

  // Send re-engagement messages to inactive users
  async sendReEngagementMessages(options = {}) {
    const users = userStore.getAll().filter(user => user.role === 'member')
    const reEngagementUsers = []

    for (const user of users) {
      const userData = userDataStore.getUserData(user.id)
      const commitments = userData.commitments
      const lastCommitment = commitments
        .sort((a, b) => new Date(b.date) - new Date(a.date))[0]

      if (!lastCommitment) continue

      const daysSinceLastActivity = this.daysSince(lastCommitment.date)
      
      // Send re-engagement if inactive for 3+ days
      if (daysSinceLastActivity >= 3 && !this.wasReminderSentThisWeek(user.id, 'reengagement')) {
        reEngagementUsers.push({
          ...user,
          daysSinceLastActivity: daysSinceLastActivity
        })
      }
    }

    if (reEngagementUsers.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        message: 'No inactive users to re-engage'
      }
    }

    const results = await this.zapier.sendReEngagementMessages(reEngagementUsers, options)
    
    this.logMessageActivity({
      type: 'reengagement_messages',
      date: new Date().toISOString().split('T')[0],
      sent: results.successful,
      failed: results.failed,
      total: results.total,
      recipients: reEngagementUsers.map(r => r.id)
    })

    return results
  }

  // Send custom message to specific users
  async sendCustomMessage(userIds, message, options = {}) {
    const users = userStore.getAll().filter(user => userIds.includes(user.id))
    
    if (users.length === 0) {
      return {
        total: 0,
        successful: 0,
        failed: 0,
        results: [],
        message: 'No valid users selected'
      }
    }

    const results = await this.zapier.sendCustomMessage(users, message, options)
    
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

  // Check if reminder was sent today
  wasReminderSentToday(userId, type) {
    const today = new Date().toISOString().split('T')[0]
    const messageHistory = this.zapier.messageHistory
    
    return messageHistory.some(msg => 
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
    const messageHistory = this.zapier.messageHistory
    
    return messageHistory.some(msg => 
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
    return this.zapier.getMessageStats(days)
  }

  // Get recent message history
  getRecentMessages(limit = 50) {
    return this.zapier.getRecentMessages(limit)
  }

  // Test webhook connection
  async testWebhook(type) {
    return await this.zapier.testWebhook(type)
  }

  // Get configuration status
  getConfigurationStatus() {
    return this.zapier.getConfigurationStatus()
  }

  // Set webhook URL
  setWebhookUrl(type, url) {
    this.zapier.setWebhookUrl(type, url)
  }

  // Get webhook URL
  getWebhookUrl(type) {
    return this.zapier.getWebhookUrl(type)
  }
}

// Export singleton instance
const messagingService = new MessagingService()
export default messagingService

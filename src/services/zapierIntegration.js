// Zapier Webhook Integration Service
// Handles SMS messaging through Zapier + CallAction integration

class ZapierIntegration {
  constructor() {
    this.webhookUrls = this.loadWebhookUrls()
    this.messageHistory = this.loadMessageHistory()
  }

  // Load webhook URLs from localStorage
  loadWebhookUrls() {
    try {
      const urls = localStorage.getItem('team_accountability_zapier_webhooks')
      return urls ? JSON.parse(urls) : {
        dailyReminders: '',
        weeklyGoals: '',
        encouragement: '',
        reengagement: '',
        custom: ''
      }
    } catch (error) {
      console.error('Error loading webhook URLs:', error)
      return {
        dailyReminders: '',
        weeklyGoals: '',
        encouragement: '',
        reengagement: '',
        custom: ''
      }
    }
  }

  // Save webhook URLs to localStorage
  saveWebhookUrls() {
    try {
      localStorage.setItem('team_accountability_zapier_webhooks', JSON.stringify(this.webhookUrls))
    } catch (error) {
      console.error('Error saving webhook URLs:', error)
    }
  }

  // Update webhook URL for a specific type
  setWebhookUrl(type, url) {
    this.webhookUrls[type] = url
    this.saveWebhookUrls()
  }

  // Get webhook URL for a specific type
  getWebhookUrl(type) {
    return this.webhookUrls[type] || ''
  }

  // Send data to Zapier webhook
  async sendToZapier(webhookUrl, data) {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Zapier webhook failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.text()
      
      return {
        success: true,
        response: result,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('Zapier webhook error:', error)
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // Send daily reminders via Zapier
  async sendDailyReminders(users, options = {}) {
    const webhookUrl = this.getWebhookUrl('dailyReminders')
    if (!webhookUrl) {
      throw new Error('Daily reminders webhook URL not configured')
    }

    const today = new Date().toISOString().split('T')[0]
    const results = []

    // Process users in batches to avoid overwhelming Zapier
    const batchSize = options.batchSize || 5
    const delay = options.delay || 2000

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize)
      
      for (const user of batch) {
        const data = {
          type: 'daily_reminder',
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            firstName: user.name.split(' ')[0]
          },
          message: `Hi ${user.name.split(' ')[0]}! Don't forget to set your daily commitment in the Team Accountability app. Let's keep the momentum going! 💪`,
          date: today,
          timestamp: new Date().toISOString(),
          source: 'Team Accountability App'
        }

        const result = await this.sendToZapier(webhookUrl, data)
        
        results.push({
          userId: user.id,
          phone: user.phone,
          message: data.message,
          success: result.success,
          error: result.error,
          timestamp: result.timestamp,
          type: 'daily_reminder'
        })

        // Add small delay between requests
        if (i + 1 < batch.length) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }

      // Add delay between batches
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    // Update message history
    results.forEach(result => this.addToMessageHistory(result))
    this.saveMessageHistory()

    return {
      total: users.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    }
  }

  // Send weekly goal reminders via Zapier
  async sendWeeklyGoalReminders(users, options = {}) {
    const webhookUrl = this.getWebhookUrl('weeklyGoals')
    if (!webhookUrl) {
      throw new Error('Weekly goals webhook URL not configured')
    }

    const results = []

    for (const user of users) {
      const data = {
        type: 'weekly_goal_reminder',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          firstName: user.name.split(' ')[0]
        },
        message: `Hey ${user.name.split(' ')[0]}! Time to update your weekly goals and reflect on your progress. You've got this! 🎯`,
        timestamp: new Date().toISOString(),
        source: 'Team Accountability App'
      }

      const result = await this.sendToZapier(webhookUrl, data)
      
      results.push({
        userId: user.id,
        phone: user.phone,
        message: data.message,
        success: result.success,
        error: result.error,
        timestamp: result.timestamp,
        type: 'weekly_goal_reminder'
      })

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    results.forEach(result => this.addToMessageHistory(result))
    this.saveMessageHistory()

    return {
      total: users.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    }
  }

  // Send encouragement messages via Zapier
  async sendEncouragementMessages(users, options = {}) {
    const webhookUrl = this.getWebhookUrl('encouragement')
    if (!webhookUrl) {
      throw new Error('Encouragement webhook URL not configured')
    }

    const results = []

    for (const user of users) {
      const completionRate = user.completionRate || 0
      const data = {
        type: 'encouragement',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          firstName: user.name.split(' ')[0],
          completionRate: completionRate
        },
        message: `${user.name.split(' ')[0]}, you're crushing it with ${completionRate}% completion rate! Keep up the excellent work! 🌟`,
        timestamp: new Date().toISOString(),
        source: 'Team Accountability App'
      }

      const result = await this.sendToZapier(webhookUrl, data)
      
      results.push({
        userId: user.id,
        phone: user.phone,
        message: data.message,
        success: result.success,
        error: result.error,
        timestamp: result.timestamp,
        type: 'encouragement'
      })

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    results.forEach(result => this.addToMessageHistory(result))
    this.saveMessageHistory()

    return {
      total: users.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    }
  }

  // Send re-engagement messages via Zapier
  async sendReEngagementMessages(users, options = {}) {
    const webhookUrl = this.getWebhookUrl('reengagement')
    if (!webhookUrl) {
      throw new Error('Re-engagement webhook URL not configured')
    }

    const results = []

    for (const user of users) {
      const daysSince = user.daysSinceLastActivity || 0
      const data = {
        type: 'reengagement',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          firstName: user.name.split(' ')[0],
          daysSinceLastActivity: daysSince
        },
        message: `We miss you ${user.name.split(' ')[0]}! It's been ${daysSince} days since your last activity. Jump back in and let's get back on track! 🚀`,
        timestamp: new Date().toISOString(),
        source: 'Team Accountability App'
      }

      const result = await this.sendToZapier(webhookUrl, data)
      
      results.push({
        userId: user.id,
        phone: user.phone,
        message: data.message,
        success: result.success,
        error: result.error,
        timestamp: result.timestamp,
        type: 'reengagement'
      })

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    results.forEach(result => this.addToMessageHistory(result))
    this.saveMessageHistory()

    return {
      total: users.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    }
  }

  // Send custom message via Zapier
  async sendCustomMessage(users, message, options = {}) {
    const webhookUrl = this.getWebhookUrl('custom')
    if (!webhookUrl) {
      throw new Error('Custom message webhook URL not configured')
    }

    const results = []

    for (const user of users) {
      const personalizedMessage = message.replace(/{name}/g, user.name.split(' ')[0])
      const data = {
        type: 'custom_message',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          firstName: user.name.split(' ')[0]
        },
        message: personalizedMessage,
        originalMessage: message,
        timestamp: new Date().toISOString(),
        source: 'Team Accountability App',
        customData: options.customData || {}
      }

      const result = await this.sendToZapier(webhookUrl, data)
      
      results.push({
        userId: user.id,
        phone: user.phone,
        message: personalizedMessage,
        success: result.success,
        error: result.error,
        timestamp: result.timestamp,
        type: 'custom_message'
      })

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    results.forEach(result => this.addToMessageHistory(result))
    this.saveMessageHistory()

    return {
      total: users.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    }
  }

  // Test webhook connection
  async testWebhook(type) {
    const webhookUrl = this.getWebhookUrl(type)
    if (!webhookUrl) {
      return {
        success: false,
        error: `No webhook URL configured for ${type}`
      }
    }

    const testData = {
      type: 'test',
      message: 'This is a test message from Team Accountability App',
      timestamp: new Date().toISOString(),
      test: true
    }

    return await this.sendToZapier(webhookUrl, testData)
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
      const history = localStorage.getItem('team_accountability_zapier_message_history')
      return history ? JSON.parse(history) : []
    } catch (error) {
      console.error('Error loading message history:', error)
      return []
    }
  }

  // Save message history to localStorage
  saveMessageHistory() {
    try {
      localStorage.setItem('team_accountability_zapier_message_history', JSON.stringify(this.messageHistory))
    } catch (error) {
      console.error('Error saving message history:', error)
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

  // Check if webhook is configured
  isWebhookConfigured(type) {
    const url = this.getWebhookUrl(type)
    return url && url.trim().length > 0 && url.startsWith('https://hooks.zapier.com/')
  }

  // Get configuration status
  getConfigurationStatus() {
    return {
      dailyReminders: this.isWebhookConfigured('dailyReminders'),
      weeklyGoals: this.isWebhookConfigured('weeklyGoals'),
      encouragement: this.isWebhookConfigured('encouragement'),
      reengagement: this.isWebhookConfigured('reengagement'),
      custom: this.isWebhookConfigured('custom')
    }
  }
}

// Export singleton instance
const zapierIntegration = new ZapierIntegration()
export default zapierIntegration

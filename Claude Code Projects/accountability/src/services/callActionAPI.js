// CallAction API Integration Service
// Handles SMS messaging through CallAction platform

class CallActionAPI {
  constructor(apiKey, baseURL = 'https://api.callaction.co/v1') {
    this.apiKey = apiKey
    this.baseURL = baseURL
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json'
    }
  }

  // Send individual SMS message
  async sendSMS(phoneNumber, message, options = {}) {
    try {
      const payload = {
        to: this.formatPhoneNumber(phoneNumber),
        message: message,
        from: options.fromNumber || null, // CallAction assigned number
        campaign_id: options.campaignId || null,
        contact_id: options.contactId || null,
        scheduled_at: options.scheduledAt || null,
        ...options
      }

      const response = await fetch(`${this.baseURL}/sms/send`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`CallAction API Error: ${result.message || response.statusText}`)
      }

      return {
        success: true,
        messageId: result.id,
        status: result.status,
        to: result.to,
        message: result.message,
        cost: result.cost || null,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      console.error('CallAction SMS Error:', error)
      return {
        success: false,
        error: error.message,
        to: phoneNumber,
        timestamp: new Date().toISOString()
      }
    }
  }

  // Send bulk SMS messages
  async sendBulkSMS(recipients, message, options = {}) {
    const results = []
    const batchSize = options.batchSize || 10
    const delay = options.delay || 1000 // 1 second between batches

    // Process in batches to avoid rate limiting
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      const batchPromises = batch.map(recipient => {
        const phone = typeof recipient === 'string' ? recipient : recipient.phone
        const customMessage = typeof recipient === 'object' && recipient.message 
          ? recipient.message 
          : message
        const recipientOptions = typeof recipient === 'object' 
          ? { ...options, contactId: recipient.id, ...recipient.options }
          : options

        return this.sendSMS(phone, customMessage, recipientOptions)
      })

      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)

      // Add delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    return {
      total: recipients.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results: results
    }
  }

  // Create or update contact in CallAction
  async createContact(contactData) {
    try {
      const payload = {
        phone: this.formatPhoneNumber(contactData.phone),
        email: contactData.email,
        first_name: contactData.firstName || contactData.name?.split(' ')[0],
        last_name: contactData.lastName || contactData.name?.split(' ').slice(1).join(' '),
        tags: contactData.tags || [],
        custom_fields: contactData.customFields || {},
        source: 'Team Accountability App'
      }

      const response = await fetch(`${this.baseURL}/contacts`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`CallAction API Error: ${result.message || response.statusText}`)
      }

      return {
        success: true,
        contactId: result.id,
        contact: result
      }
    } catch (error) {
      console.error('CallAction Contact Creation Error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Start automated drip campaign
  async startDripCampaign(contactId, campaignId, options = {}) {
    try {
      const payload = {
        contact_id: contactId,
        campaign_id: campaignId,
        start_immediately: options.startImmediately !== false,
        custom_fields: options.customFields || {}
      }

      const response = await fetch(`${this.baseURL}/campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`CallAction API Error: ${result.message || response.statusText}`)
      }

      return {
        success: true,
        campaignInstanceId: result.id,
        status: result.status
      }
    } catch (error) {
      console.error('CallAction Campaign Start Error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Get message delivery status
  async getMessageStatus(messageId) {
    try {
      const response = await fetch(`${this.baseURL}/sms/${messageId}`, {
        method: 'GET',
        headers: this.headers
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`CallAction API Error: ${result.message || response.statusText}`)
      }

      return {
        success: true,
        status: result.status,
        deliveredAt: result.delivered_at,
        errorCode: result.error_code,
        errorMessage: result.error_message
      }
    } catch (error) {
      console.error('CallAction Status Check Error:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  // Format phone number for CallAction API
  formatPhoneNumber(phone) {
    if (!phone) return null
    
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // Add country code if missing (assume US)
    if (digits.length === 10) {
      return `+1${digits}`
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`
    }
    
    // Return as-is if already formatted or international
    return phone.startsWith('+') ? phone : `+${digits}`
  }

  // Validate API connection
  async testConnection() {
    try {
      const response = await fetch(`${this.baseURL}/account`, {
        method: 'GET',
        headers: this.headers
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`CallAction API Error: ${result.message || response.statusText}`)
      }

      return {
        success: true,
        account: result,
        message: 'CallAction API connection successful'
      }
    } catch (error) {
      console.error('CallAction Connection Test Error:', error)
      return {
        success: false,
        error: error.message,
        message: 'CallAction API connection failed'
      }
    }
  }
}

// Message templates for different scenarios
export const MessageTemplates = {
  dailyReminder: (name) => 
    `Hi ${name}! Don't forget to set your daily commitment in the Team Accountability app. Let's keep the momentum going! 💪`,
  
  weeklyGoalReminder: (name) => 
    `Hey ${name}! Time to update your weekly goals and reflect on your progress. You've got this! 🎯`,
  
  encouragement: (name, completionRate) => 
    `${name}, you're crushing it with ${completionRate}% completion rate! Keep up the excellent work! 🌟`,
  
  reEngagement: (name, daysSince) => 
    `We miss you ${name}! It's been ${daysSince} days since your last activity. Jump back in and let's get back on track! 🚀`,
  
  goalAchievement: (name, goalTitle) => 
    `Congratulations ${name}! You've completed your goal: "${goalTitle}". Time to set your next challenge! 🎉`,
  
  weeklyReport: (name, weeklyStats) => 
    `${name}, here's your week: ${weeklyStats.completed}/${weeklyStats.total} commitments completed (${weeklyStats.rate}%). ${weeklyStats.message}`,
  
  teamUpdate: (name, teamRank, totalMembers) => 
    `${name}, you're ranked #${teamRank} out of ${totalMembers} team members this week. Keep pushing forward! 💪`
}

// Export singleton instance (will be initialized with API key)
let callActionInstance = null

export const initializeCallAction = (apiKey) => {
  callActionInstance = new CallActionAPI(apiKey)
  return callActionInstance
}

export const getCallActionInstance = () => {
  if (!callActionInstance) {
    throw new Error('CallAction API not initialized. Call initializeCallAction(apiKey) first.')
  }
  return callActionInstance
}

export default CallActionAPI

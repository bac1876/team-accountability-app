// Vercel API endpoint for daily reminders via Zapier
// This endpoint can be called by cron jobs or external schedulers

import messagingService from '../../src/services/messagingService.js'

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify API key or authentication
    const authHeader = req.headers.authorization
    const expectedToken = process.env.MESSAGING_API_TOKEN || 'demo-token-zapier-123'
    
    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Get request parameters
    const { 
      type = 'daily', 
      force = false, 
      dryRun = false 
    } = req.body

    let results

    // Handle different message types
    switch (type) {
      case 'daily':
        results = await messagingService.sendDailyReminders({ force, dryRun })
        break
      
      case 'weekly':
        results = await messagingService.sendWeeklyGoalReminders({ force, dryRun })
        break
      
      case 'encouragement':
        results = await messagingService.sendEncouragementMessages({ force, dryRun })
        break
      
      case 'reengagement':
        results = await messagingService.sendReEngagementMessages({ force, dryRun })
        break
      
      default:
        return res.status(400).json({ error: 'Invalid message type' })
    }

    // Return results
    res.status(200).json({
      success: true,
      type,
      timestamp: new Date().toISOString(),
      results: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        message: results.message,
        details: dryRun ? results.results : undefined
      }
    })

  } catch (error) {
    console.error('Daily reminders API error:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}

// Example usage:
// POST /api/messaging/daily-reminders
// Headers: Authorization: Bearer demo-token-zapier-123
// Body: { "type": "daily", "force": false, "dryRun": false }

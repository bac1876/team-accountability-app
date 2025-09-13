import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx'
import { MessageSquare, Send, Users, Clock, CheckCircle, AlertCircle, Settings, Zap, ExternalLink, TestTube } from 'lucide-react'
import { getUsers, getAnalytics } from '../utils/dataStore.js'
import messagingService from '../services/messagingService.js'

const MessagingCenter = () => {
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [message, setMessage] = useState('')
  const [messageTemplate, setMessageTemplate] = useState('')
  const [messageHistory, setMessageHistory] = useState([])
  const [messageStats, setMessageStats] = useState(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [webhookUrls, setWebhookUrls] = useState({
    dailyReminders: '',
    weeklyGoals: '',
    encouragement: '',
    reengagement: '',
    custom: ''
  })
  const [configurationStatus, setConfigurationStatus] = useState({})

  // Message templates
  const templates = {
    daily_reminder: "Hi {name}! Don't forget to set your daily commitment in the Team Accountability app. Let's keep the momentum going! 💪",
    weekly_goals: "Hey {name}! Time to update your weekly goals and reflect on your progress. You've got this! 🎯",
    encouragement: "Great work {name}! Your consistency is paying off. Keep up the excellent progress! 🌟",
    check_in: "Hi {name}, just checking in! How are you doing with your accountability goals this week? 🚀",
    reengagement: "We miss you {name}! It's been a while since your last activity. Jump back in and let's get back on track! 💪"
  }

  // Load data on component mount
  useEffect(() => {
    loadData()
    loadConfiguration()
  }, [])

  const loadData = () => {
    const allUsers = getUsers().filter(user => user.role !== 'admin')
    setUsers(allUsers)
    
    // Load message history and stats
    const history = messagingService.getRecentMessages(50)
    setMessageHistory(history)
    
    const stats = messagingService.getMessageStats(30)
    setMessageStats(stats)
  }

  const loadConfiguration = () => {
    // Load webhook URLs
    const urls = {
      dailyReminders: messagingService.getWebhookUrl('dailyReminders'),
      weeklyGoals: messagingService.getWebhookUrl('weeklyGoals'),
      encouragement: messagingService.getWebhookUrl('encouragement'),
      reengagement: messagingService.getWebhookUrl('reengagement'),
      custom: messagingService.getWebhookUrl('custom')
    }
    setWebhookUrls(urls)
    
    // Load configuration status
    const status = messagingService.getConfigurationStatus()
    setConfigurationStatus(status)
  }

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const handleUserToggle = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map(user => user.id))
    }
  }

  const handleTemplateSelect = (templateKey) => {
    setMessageTemplate(templateKey)
    setMessage(templates[templateKey])
  }

  const saveWebhookUrl = (type, url) => {
    messagingService.setWebhookUrl(type, url)
    setWebhookUrls(prev => ({ ...prev, [type]: url }))
    
    // Update configuration status
    const status = messagingService.getConfigurationStatus()
    setConfigurationStatus(status)
    
    setSuccess(`${type} webhook URL saved successfully!`)
    setTimeout(() => setSuccess(''), 3000)
  }

  const testWebhook = async (type) => {
    if (!webhookUrls[type]) {
      setError(`Please configure ${type} webhook URL first`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const result = await messagingService.testWebhook(type)
      
      if (result.success) {
        setSuccess(`${type} webhook test successful!`)
      } else {
        setError(`${type} webhook test failed: ${result.error}`)
      }
    } catch (err) {
      setError(`Webhook test failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one user')
      return
    }

    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    if (!configurationStatus.custom) {
      setError('Please configure the custom message webhook URL first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const results = await messagingService.sendCustomMessage(selectedUsers, message)
      
      setSuccess(`Messages sent! ${results.successful} successful, ${results.failed} failed`)
      setMessage('')
      setSelectedUsers([])
      setMessageTemplate('')
      
      // Refresh data
      loadData()

    } catch (err) {
      setError(`Failed to send messages: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const sendAutomatedReminders = async (type) => {
    const webhookType = type === 'daily' ? 'dailyReminders' : 
                       type === 'weekly' ? 'weeklyGoals' :
                       type === 'encouragement' ? 'encouragement' : 'reengagement'
    
    if (!configurationStatus[webhookType]) {
      setError(`Please configure ${type} reminders webhook URL first`)
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      let results
      switch (type) {
        case 'daily':
          results = await messagingService.sendDailyReminders()
          break
        case 'weekly':
          results = await messagingService.sendWeeklyGoalReminders()
          break
        case 'encouragement':
          results = await messagingService.sendEncouragementMessages()
          break
        case 'reengagement':
          results = await messagingService.sendReEngagementMessages()
          break
      }

      if (results.total === 0) {
        setSuccess(results.message || `No users need ${type} reminders right now`)
      } else {
        setSuccess(`${type} reminders sent! ${results.successful} successful, ${results.failed} failed`)
      }
      
      loadData() // Refresh data

    } catch (err) {
      setError(`Failed to send ${type} reminders: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getUsersNeedingReminders = () => {
    const analytics = getAnalytics()
    return users.filter(user => {
      const userAnalytics = analytics.users.find(u => u.id === user.id)
      return !userAnalytics || userAnalytics.completionRate < 50
    })
  }

  const getHighPerformers = () => {
    const analytics = getAnalytics()
    return users.filter(user => {
      const userAnalytics = analytics.users.find(u => u.id === user.id)
      return userAnalytics && userAnalytics.completionRate >= 80
    })
  }

  const getConfiguredWebhooksCount = () => {
    return Object.values(configurationStatus).filter(Boolean).length
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Messages This Week</p>
                <p className="text-2xl font-bold">{messageStats?.thisWeek || 0}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">
                  {messageStats && messageStats.total > 0 ? Math.round((messageStats.successful / messageStats.total) * 100) : 0}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Webhooks Configured</p>
                <p className="text-2xl font-bold">{getConfiguredWebhooksCount()}/5</p>
              </div>
              <Settings className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Performers</p>
                <p className="text-2xl font-bold">{getHighPerformers().length}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configure" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configure">Configure Zapier</TabsTrigger>
          <TabsTrigger value="send">Send Messages</TabsTrigger>
          <TabsTrigger value="automated">Automated Reminders</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
          <TabsTrigger value="insights">Team Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="configure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Zapier Webhook Configuration
              </CardTitle>
              <CardDescription>
                Configure Zapier webhook URLs to enable SMS messaging through CallAction
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 gap-6">
                {Object.entries(webhookUrls).map(([type, url]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={type} className="capitalize">
                        {type.replace(/([A-Z])/g, ' $1').trim()} Webhook
                      </Label>
                      <div className="flex items-center gap-2">
                        <Badge variant={configurationStatus[type] ? "default" : "secondary"}>
                          {configurationStatus[type] ? 'Configured' : 'Not Configured'}
                        </Badge>
                        {url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => testWebhook(type)}
                            disabled={loading}
                          >
                            <TestTube className="h-3 w-3 mr-1" />
                            Test
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id={type}
                        value={url}
                        onChange={(e) => setWebhookUrls(prev => ({ ...prev, [type]: e.target.value }))}
                        placeholder="https://hooks.zapier.com/hooks/catch/..."
                        className="flex-1"
                      />
                      <Button
                        onClick={() => saveWebhookUrl(type, webhookUrls[type])}
                        disabled={!webhookUrls[type] || webhookUrls[type] === messagingService.getWebhookUrl(type)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  How to set up Zapier webhooks:
                </h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Go to <a href="https://zapier.com" target="_blank" rel="noopener noreferrer" className="underline">zapier.com</a> and create a new Zap</li>
                  <li>2. Choose "Webhooks by Zapier" as the trigger</li>
                  <li>3. Select "Catch Hook" and copy the webhook URL</li>
                  <li>4. Paste the URL above and save</li>
                  <li>5. Set up CallAction as the action to send SMS</li>
                  <li>6. Map the user data fields (name, phone, message)</li>
                  <li>7. Test and activate your Zap</li>
                </ol>
              </div>

              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Webhook Data Format:</h4>
                <p className="text-sm text-green-800 mb-2">Each webhook sends this data structure:</p>
                <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
{`{
  "type": "daily_reminder",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com", 
    "phone": "+1234567890",
    "firstName": "John"
  },
  "message": "Hi John! Don't forget...",
  "timestamp": "2024-01-01T18:00:00Z"
}`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="send" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Select Recipients</CardTitle>
                <CardDescription>Choose team members to send messages to</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleSelectAll}
                  >
                    {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                  </Button>
                  <span className="text-sm text-gray-600">
                    {selectedUsers.length} of {users.length} selected
                  </span>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {users.map(user => (
                    <div 
                      key={user.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedUsers.includes(user.id) 
                          ? 'bg-blue-50 border border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleUserToggle(user.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.phone}</p>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>Write your message or use a template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template">Quick Templates</Label>
                  <Select value={messageTemplate} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily_reminder">Daily Reminder</SelectItem>
                      <SelectItem value="weekly_goals">Weekly Goals</SelectItem>
                      <SelectItem value="encouragement">Encouragement</SelectItem>
                      <SelectItem value="check_in">Check-in</SelectItem>
                      <SelectItem value="reengagement">Re-engagement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here... Use {name} to personalize"
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {'{name}'} to automatically insert the recipient's first name
                  </p>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={sendMessage} 
                  disabled={loading || selectedUsers.length === 0 || !message.trim() || !configurationStatus.custom}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Clock className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send to {selectedUsers.length} Recipients
                    </>
                  )}
                </Button>

                {!configurationStatus.custom && (
                  <p className="text-sm text-orange-600">
                    Configure the custom message webhook first to send messages
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automated" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Send automated reminders to your team</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={() => sendAutomatedReminders('daily')}
                  disabled={loading || !configurationStatus.dailyReminders}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Daily Reminders
                  {!configurationStatus.dailyReminders && (
                    <Badge variant="secondary" className="ml-auto">Not Configured</Badge>
                  )}
                </Button>
                
                <Button 
                  onClick={() => sendAutomatedReminders('weekly')}
                  disabled={loading || !configurationStatus.weeklyGoals}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Send Weekly Goal Reminders
                  {!configurationStatus.weeklyGoals && (
                    <Badge variant="secondary" className="ml-auto">Not Configured</Badge>
                  )}
                </Button>
                
                <Button 
                  onClick={() => sendAutomatedReminders('encouragement')}
                  disabled={loading || !configurationStatus.encouragement}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Send Encouragement Messages
                  {!configurationStatus.encouragement && (
                    <Badge variant="secondary" className="ml-auto">Not Configured</Badge>
                  )}
                </Button>
                
                <Button 
                  onClick={() => sendAutomatedReminders('reengagement')}
                  disabled={loading || !configurationStatus.reengagement}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Send Re-engagement Messages
                  {!configurationStatus.reengagement && (
                    <Badge variant="secondary" className="ml-auto">Not Configured</Badge>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Automation Schedule</CardTitle>
                <CardDescription>Automated messages are sent daily at 6 PM</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className={`flex items-center justify-between p-3 rounded-lg ${
                    configurationStatus.dailyReminders ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                    <div>
                      <p className={`font-medium ${
                        configurationStatus.dailyReminders ? 'text-green-900' : 'text-gray-700'
                      }`}>Daily Reminders</p>
                      <p className={`text-sm ${
                        configurationStatus.dailyReminders ? 'text-green-700' : 'text-gray-600'
                      }`}>Every day at 6:00 PM</p>
                    </div>
                    <Badge variant={configurationStatus.dailyReminders ? "default" : "secondary"} 
                           className={configurationStatus.dailyReminders ? "bg-green-100 text-green-800" : ""}>
                      {configurationStatus.dailyReminders ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Automatic daily reminders are sent to team members who haven't set their daily commitments.
                      Configure the daily reminders webhook to enable automation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Last 50 messages sent to your team</CardDescription>
            </CardHeader>
            <CardContent>
              {messageHistory.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No messages sent yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {messageHistory.map((msg, index) => {
                    const user = users.find(u => u.id === msg.userId)
                    return (
                      <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {user ? getInitials(user.name) : '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">
                              {user ? user.name : 'Unknown User'}
                            </p>
                            <div className="flex items-center space-x-2">
                              <Badge variant={msg.success ? "default" : "destructive"}>
                                {msg.success ? 'Sent' : 'Failed'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(msg.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 truncate">
                            {msg.message}
                          </p>
                          {!msg.success && msg.error && (
                            <p className="text-xs text-red-600 mt-1">{msg.error}</p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Users Needing Reminders</CardTitle>
                <CardDescription>Team members with low completion rates</CardDescription>
              </CardHeader>
              <CardContent>
                {getUsersNeedingReminders().length === 0 ? (
                  <p className="text-center text-gray-500 py-4">All team members are on track! 🎉</p>
                ) : (
                  <div className="space-y-2">
                    {getUsersNeedingReminders().map(user => {
                      const analytics = getAnalytics()
                      const userAnalytics = analytics.users.find(u => u.id === user.id)
                      return (
                        <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.name}</span>
                          </div>
                          <Badge variant="outline" className="text-orange-600">
                            {userAnalytics ? `${userAnalytics.completionRate}%` : 'No data'}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-green-600">High Performers</CardTitle>
                <CardDescription>Team members excelling in their commitments</CardDescription>
              </CardHeader>
              <CardContent>
                {getHighPerformers().length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No high performers yet</p>
                ) : (
                  <div className="space-y-2">
                    {getHighPerformers().map(user => {
                      const analytics = getAnalytics()
                      const userAnalytics = analytics.users.find(u => u.id === user.id)
                      return (
                        <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.name}</span>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            {userAnalytics.completionRate}%
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MessagingCenter

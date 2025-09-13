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
import { MessageSquare, Send, Users, Clock, CheckCircle, AlertCircle, Settings, Zap } from 'lucide-react'
import { getUsers, getAnalytics } from '../utils/dataStore.js'

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
  const [callActionApiKey, setCallActionApiKey] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)

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
    
    // Load message history from localStorage
    const history = localStorage.getItem('team_accountability_message_history')
    if (history) {
      const parsedHistory = JSON.parse(history)
      setMessageHistory(parsedHistory.slice(-50)) // Show last 50 messages
      
      // Calculate stats
      const stats = calculateMessageStats(parsedHistory)
      setMessageStats(stats)
    }
  }

  const loadConfiguration = () => {
    const apiKey = localStorage.getItem('callaction_api_key')
    if (apiKey) {
      setCallActionApiKey(apiKey)
      setIsConfigured(true)
    }
  }

  const calculateMessageStats = (history) => {
    const last30Days = history.filter(msg => {
      const msgDate = new Date(msg.timestamp)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return msgDate > thirtyDaysAgo
    })

    return {
      total: last30Days.length,
      successful: last30Days.filter(msg => msg.success).length,
      failed: last30Days.filter(msg => !msg.success).length,
      thisWeek: last30Days.filter(msg => {
        const msgDate = new Date(msg.timestamp)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return msgDate > weekAgo
      }).length
    }
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

  const saveConfiguration = () => {
    if (!callActionApiKey.trim()) {
      setError('Please enter your CallAction API key')
      return
    }

    localStorage.setItem('callaction_api_key', callActionApiKey)
    setIsConfigured(true)
    setSuccess('CallAction API key saved successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const sendMessage = async () => {
    if (!isConfigured) {
      setError('Please configure CallAction API key first')
      return
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one user')
      return
    }

    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Simulate API call to send messages
      const selectedUserData = users.filter(user => selectedUsers.includes(user.id))
      const results = []

      for (const user of selectedUserData) {
        const personalizedMessage = message.replace(/{name}/g, user.name.split(' ')[0])
        
        // Simulate message sending (replace with actual CallAction API call)
        const result = {
          userId: user.id,
          phone: user.phone,
          message: personalizedMessage,
          success: Math.random() > 0.1, // 90% success rate simulation
          messageId: `msg_${Date.now()}_${user.id}`,
          timestamp: new Date().toISOString()
        }

        if (!result.success) {
          result.error = 'Failed to deliver message'
        }

        results.push(result)
      }

      // Update message history
      const updatedHistory = [...messageHistory, ...results].slice(-100)
      setMessageHistory(updatedHistory)
      localStorage.setItem('team_accountability_message_history', JSON.stringify(updatedHistory))

      // Update stats
      const stats = calculateMessageStats(updatedHistory)
      setMessageStats(stats)

      const successful = results.filter(r => r.success).length
      const failed = results.filter(r => !r.success).length

      setSuccess(`Messages sent! ${successful} successful, ${failed} failed`)
      setMessage('')
      setSelectedUsers([])
      setMessageTemplate('')

    } catch (err) {
      setError(`Failed to send messages: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const sendAutomatedReminders = async (type) => {
    if (!isConfigured) {
      setError('Please configure CallAction API key first')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      // Call the API endpoint for automated reminders
      const response = await fetch('/api/messaging/daily-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('messaging_api_token') || 'demo-token'}`
        },
        body: JSON.stringify({
          type: type,
          force: false,
          dryRun: false
        })
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(`${type} reminders sent! ${result.results.successful} successful, ${result.results.failed} failed`)
        loadData() // Refresh data
      } else {
        setError(`Failed to send ${type} reminders: ${result.error}`)
      }

    } catch (err) {
      setError(`Failed to send automated reminders: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const getUsersNeedingReminders = () => {
    const today = new Date().toISOString().split('T')[0]
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

  if (!isConfigured) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              CallAction Configuration
            </CardTitle>
            <CardDescription>
              Configure your CallAction API key to enable SMS messaging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="apiKey">CallAction API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={callActionApiKey}
                onChange={(e) => setCallActionApiKey(e.target.value)}
                placeholder="Enter your CallAction API key"
              />
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

            <Button onClick={saveConfiguration} className="w-full">
              Save Configuration
            </Button>

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How to get your CallAction API Key:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Login to your CallAction account</li>
                <li>2. Go to Profile → Settings → Integrations</li>
                <li>3. Find the API section and generate your key</li>
                <li>4. Copy and paste the key above</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
                  {messageStats ? Math.round((messageStats.successful / messageStats.total) * 100) || 0 : 0}%
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
                <p className="text-sm font-medium text-gray-600">Need Reminders</p>
                <p className="text-2xl font-bold">{getUsersNeedingReminders().length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
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
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Send Messages</TabsTrigger>
          <TabsTrigger value="automated">Automated Reminders</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
          <TabsTrigger value="insights">Team Insights</TabsTrigger>
        </TabsList>

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
                  disabled={loading || selectedUsers.length === 0 || !message.trim()}
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
                  disabled={loading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Send Daily Reminders
                </Button>
                
                <Button 
                  onClick={() => sendAutomatedReminders('weekly')}
                  disabled={loading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Send Weekly Goal Reminders
                </Button>
                
                <Button 
                  onClick={() => sendAutomatedReminders('encouragement')}
                  disabled={loading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Send Encouragement Messages
                </Button>
                
                <Button 
                  onClick={() => sendAutomatedReminders('reengagement')}
                  disabled={loading}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Send Re-engagement Messages
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
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">Daily Reminders</p>
                      <p className="text-sm text-green-700">Every day at 6:00 PM</p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Automatic daily reminders are sent to team members who haven't set their daily commitments.
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
                  {messageHistory.slice().reverse().map((msg, index) => {
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

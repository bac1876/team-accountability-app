import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { MessageSquare, Send, Users, Clock, CheckCircle } from 'lucide-react'
import { userStore, analyticsStore } from '../utils/dataStore.js'

const MessagingCenter = () => {
  const [users, setUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [message, setMessage] = useState('')
  const [messageHistory, setMessageHistory] = useState([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  // Load users and message history
  useEffect(() => {
    const allUsers = userStore.getAll().filter(user => user.role !== 'admin')
    setUsers(allUsers)
    
    // Load message history from localStorage
    const history = localStorage.getItem('messageHistory')
    if (history) {
      setMessageHistory(JSON.parse(history))
    }
  }, [])

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

  const handleSendMessage = () => {
    if (!message.trim()) {
      setError('Please enter a message')
      return
    }

    if (selectedUsers.length === 0) {
      setError('Please select at least one user')
      return
    }

    // Create message record
    const messageRecord = {
      id: Date.now(),
      message: message.trim(),
      recipients: selectedUsers.map(userId => {
        const user = users.find(u => u.id === userId)
        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          email: user.email
        }
      }),
      timestamp: new Date().toISOString(),
      status: 'sent' // In real app, this would be updated based on actual delivery
    }

    // Save to message history
    const updatedHistory = [messageRecord, ...messageHistory]
    setMessageHistory(updatedHistory)
    localStorage.setItem('messageHistory', JSON.stringify(updatedHistory))

    // Reset form
    setMessage('')
    setSelectedUsers([])
    setSuccess(`Message sent to ${messageRecord.recipients.length} user(s)`)
    setError('')

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(''), 3000)

    // In a real application, you would integrate with an SMS service like Twilio here
    console.log('Sending SMS to:', messageRecord.recipients.map(r => r.phone))
    console.log('Message:', message.trim())
  }

  const getTeamStats = () => {
    const stats = analyticsStore.getTeamStats()
    return {
      needsReminder: stats.teamData.filter(member => !member.todayCommitment).length,
      lowCompletion: stats.teamData.filter(member => member.completionRate < 70).length,
      noRecentReflection: stats.teamData.filter(member => {
        if (!member.lastReflection) return true
        const daysSince = Math.floor((new Date() - new Date(member.lastReflection)) / (1000 * 60 * 60 * 24))
        return daysSince > 7
      }).length
    }
  }

  const teamStats = getTeamStats()

  const quickMessages = [
    {
      title: "Daily Reminder",
      message: "Hi! Don't forget to set your daily commitment in the Team Accountability app. Let's keep the momentum going! 💪",
      suggestedFor: "Users without today's commitment"
    },
    {
      title: "Weekly Check-in",
      message: "Hope you're having a great week! Remember to update your weekly goals and reflect on your progress in the app. 🎯",
      suggestedFor: "All users"
    },
    {
      title: "Encouragement",
      message: "You're doing great! Keep up the excellent work on your commitments. Your consistency is inspiring! 🌟",
      suggestedFor: "High-performing users"
    },
    {
      title: "Re-engagement",
      message: "We miss you! It's been a while since your last reflection. Jump back in and let's get back on track together! 🚀",
      suggestedFor: "Inactive users"
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Messaging Center</h2>
        <p className="text-muted-foreground">
          Send text messages to team members for reminders and encouragement
        </p>
      </div>

      {/* Team Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Daily Reminder</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.needsReminder}</div>
            <p className="text-xs text-muted-foreground">
              Users without today's commitment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Completion</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.lowCompletion}</div>
            <p className="text-xs text-muted-foreground">
              Users with &lt;70% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Check-in</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.noRecentReflection}</div>
            <p className="text-xs text-muted-foreground">
              No reflection in 7+ days
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="compose" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">Compose Message</TabsTrigger>
          <TabsTrigger value="templates">Quick Templates</TabsTrigger>
          <TabsTrigger value="history">Message History</TabsTrigger>
        </TabsList>

        {/* Compose Message */}
        <TabsContent value="compose" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Select Recipients
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </CardTitle>
                <CardDescription>
                  Choose team members to send the message to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUsers.includes(user.id)
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => handleUserToggle(user.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.phone}</div>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <CheckCircle className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Message Composition */}
            <Card>
              <CardHeader>
                <CardTitle>Compose Message</CardTitle>
                <CardDescription>
                  Write your message to send via SMS
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your message here..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{message.length}/160 characters</span>
                  <span>{selectedUsers.length} recipient(s) selected</span>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleSendMessage}
                  className="w-full"
                  disabled={!message.trim() || selectedUsers.length === 0}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quick Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickMessages.map((template, index) => (
              <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  <CardDescription>{template.suggestedFor}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{template.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMessage(template.message)}
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Message History */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Message History</CardTitle>
              <CardDescription>
                View previously sent messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {messageHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No messages sent yet
                </div>
              ) : (
                <div className="space-y-4">
                  {messageHistory.map((msg) => (
                    <div key={msg.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary">
                          {msg.recipients.length} recipient(s)
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(msg.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mb-2">{msg.message}</p>
                      <div className="text-xs text-muted-foreground">
                        Sent to: {msg.recipients.map(r => r.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MessagingCenter

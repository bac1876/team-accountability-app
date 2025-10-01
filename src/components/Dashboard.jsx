import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNavigation } from '../context/NavigationContext'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Label } from '@/components/ui/label.jsx'
import { CheckCircle, Circle, Clock, Target, MessageSquare, TrendingUp, Edit, Trash2, X, Check, BarChart3, CalendarCheck, Phone } from 'lucide-react'
import { userDataStore, phoneCallStore } from '../utils/dataStore.js'
import PhoneCallTracking from './PhoneCallTracking.jsx'
// import DailyFocus from './DailyFocus.jsx'
import DailyFocusSimple from './DailyFocusSimple.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'
import TransactionsSection from './TransactionsSection.jsx'

const Dashboard = ({ user }) => {
  const { activeTab, navigateToTab } = useNavigation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  const [todayCommitment, setTodayCommitment] = useState('')
  const [commitmentStatus, setCommitmentStatus] = useState('pending')
  const [weeklyGoals, setWeeklyGoals] = useState([])
  const [newGoal, setNewGoal] = useState('')
  const [reflection, setReflection] = useState({
    wentWell: '',
    differently: '',
    needHelp: ''
  })
  const [reflectionSaved, setReflectionSaved] = useState(false)
  const [pastReflections, setPastReflections] = useState([])
  const [recentCommitments, setRecentCommitments] = useState([])
  const [userData, setUserData] = useState(null)
  const [completionRate, setCompletionRate] = useState(0)
  const [editingCommitment, setEditingCommitment] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [editCommitmentText, setEditCommitmentText] = useState('')
  const [editGoalText, setEditGoalText] = useState('')

  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)

  // Log changes for debugging
  useEffect(() => {
    console.log('Active tab changed to:', activeTab)
  }, [activeTab])

  // Handle tab change
  const handleTabChange = (value) => {
    console.log('Changing tab to:', value)
    navigateToTab(value)
  }

  // Load user data from persistent storage
  useEffect(() => {
    if (user?.id) {
      const data = userDataStore.getUserData(user.id)
      setUserData(data)
      loadReflections()
      
      // Load today's commitment status only (not the text)
      const todayCommit = data.commitments.find(c => c.date === todayString)
      if (todayCommit) {
        // Don't reload the text into the input field - it should stay in Recent Commitments
        // Only set the status if a commitment exists
        setCommitmentStatus(todayCommit.status)
      }

      // Load weekly goals
      const currentWeekGoals = data.goals.filter(g => {
        const goalDate = new Date(g.createdAt)
        return goalDate >= weekStart && goalDate <= weekEnd
      })
      setWeeklyGoals(currentWeekGoals)

      // Load recent commitments (last 7 days)
      const recentCommits = data.commitments
        .filter(c => {
          const commitDate = new Date(c.date)
          const daysDiff = (today - commitDate) / (1000 * 60 * 60 * 24)
          return daysDiff <= 7
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecentCommitments(recentCommits)

      // Calculate completion rate
      const completedCommits = recentCommits.filter(c => c.status === 'completed').length
      const rate = recentCommits.length > 0 ? (completedCommits / recentCommits.length) * 100 : 0
      setCompletionRate(Math.round(rate))

      // Load reflection for today
      const todayReflection = data.reflections.find(r => r.date === todayString)
      if (todayReflection) {
        setReflection(todayReflection)
      }
    }
  }, [user?.id, todayString])

  const saveCommitment = () => {
    console.log('Save commitment clicked!', { todayCommitment, user })
    
    if (!todayCommitment.trim()) {
      console.log('No commitment text provided')
      alert('Please enter a commitment before saving')
      return
    }

    // Check if a commitment already exists for today
    const existingData = userDataStore.getUserData(user.id)
    const existingCommitment = existingData.commitments.find(c => c.date === todayString)
    if (existingCommitment) {
      alert('You already have a commitment for today. You can edit it from the Recent Commitments section.')
      setTodayCommitment('')
      return
    }

    try {
      console.log('Adding commitment:', todayCommitment)
      // addCommitment expects just the text string, not an object
      const newCommitment = userDataStore.addCommitment(user.id, todayCommitment)
      console.log('Commitment added:', newCommitment)
      
      // Update the commitment status after saving
      const updatedData = userDataStore.getUserData(user.id)
      console.log('Updated data:', updatedData)
      setUserData(updatedData)
      
      // Find the newly added commitment and update its status if needed
      const todayCommit = updatedData.commitments.find(c => c.date === todayString)
      if (todayCommit && commitmentStatus !== 'pending') {
        console.log('Updating commitment status to:', commitmentStatus)
        userDataStore.updateCommitmentStatus(user.id, todayCommit.id, commitmentStatus)
      }
      
      // Refresh recent commitments to show the new one immediately
      const recentCommits = updatedData.commitments
        .filter(c => {
          const commitDate = new Date(c.date)
          const daysDiff = (today - commitDate) / (1000 * 60 * 60 * 24)
          return daysDiff <= 7
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecentCommitments(recentCommits)
      
      // Calculate completion rate
      const completedCommits = recentCommits.filter(c => c.status === 'completed').length
      const rate = recentCommits.length > 0 ? (completedCommits / recentCommits.length) * 100 : 0
      setCompletionRate(Math.round(rate))
      
      // Clear the form after successful save
      setTodayCommitment('')
      console.log('Commitment saved successfully')
      alert('Commitment saved successfully!')
    } catch (error) {
      console.error('Error saving commitment:', error)
      alert('Failed to save commitment. Please try again.')
    }
  }

  const addWeeklyGoal = () => {
    if (!newGoal.trim()) return

    // addGoal expects just the text string, not an object
    userDataStore.addGoal(user.id, newGoal)
    setNewGoal('')
    
    // Refresh goals
    const updatedData = userDataStore.getUserData(user.id)
    const currentWeekGoals = updatedData.goals.filter(g => {
      const goalDate = new Date(g.createdAt)
      return goalDate >= weekStart && goalDate <= weekEnd
    })
    setWeeklyGoals(currentWeekGoals)
  }

  const toggleGoalCompletion = (goalId) => {
    userDataStore.toggleGoalCompletion(user.id, goalId)
    
    // Refresh goals
    const updatedData = userDataStore.getUserData(user.id)
    const currentWeekGoals = updatedData.goals.filter(g => {
      const goalDate = new Date(g.createdAt)
      return goalDate >= weekStart && goalDate <= weekEnd
    })
    setWeeklyGoals(currentWeekGoals)
  }

  const loadReflections = () => {
    const userData = userDataStore.getUserData(user.id)
    const allReflections = userData.reflections || []
    
    // Check if today's reflection exists
    const todayReflection = allReflections.find(r => r.date === todayString)
    if (todayReflection) {
      // Mark that today's reflection is saved, but DON'T populate the form
      // This keeps the form empty for potential additional reflections
      setReflectionSaved(true)
    } else {
      setReflectionSaved(false)
    }
    
    // Always keep form empty for new entries
    setReflection({
      wentWell: '',
      differently: '',
      needHelp: ''
    })
    
    // Get past reflections (including today's if it exists)
    const pastWeek = allReflections
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7)
    setPastReflections(pastWeek)
  }

  const saveReflection = () => {
    // Validate that at least one field has content
    if (!reflection.wentWell && !reflection.differently && !reflection.needHelp) {
      alert('Please fill in at least one reflection field')
      return
    }

    const reflectionData = {
      id: Date.now().toString(),
      date: todayString,
      wentWell: reflection.wentWell || '',
      differently: reflection.differently || '',
      needHelp: reflection.needHelp || '',
      createdAt: new Date().toISOString()
    }

    try {
      userDataStore.addReflection(user.id, reflectionData)
      // Clear the form after saving
      setReflection({
        wentWell: '',
        differently: '',
        needHelp: ''
      })
      // Mark as saved and reload reflections
      setReflectionSaved(true)
      loadReflections()
      
      // Show success toast instead of alert
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      successDiv.textContent = 'Reflection saved successfully! ✓'
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 2000)
    } catch (error) {
      console.error('Error saving reflection:', error)
      alert('Failed to save reflection. Please try again.')
    }
  }

  const toggleCommitmentStatus = (commitmentId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    userDataStore.updateCommitmentStatus(user.id, commitmentId, newStatus)
    
    // Refresh the commitments list
    const updatedData = userDataStore.getUserData(user.id)
    setRecentCommitments(updatedData.commitments.slice(-7))
    
    // Show success toast
    const successDiv = document.createElement('div')
    successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
    successDiv.textContent = `Commitment marked as ${newStatus}! ✓`
    document.body.appendChild(successDiv)
    setTimeout(() => successDiv.remove(), 2000)
  }

  const updateCommitmentStatus = (status) => {
    setCommitmentStatus(status)
    if (todayCommitment.trim()) {
      const commitmentData = {
        id: Date.now().toString(),
        text: todayCommitment,
        date: todayString,
        status: status,
        createdAt: new Date().toISOString()
      }
      userDataStore.addCommitment(user.id, commitmentData)
    }
  }

  // Edit and Delete Functions
  const startEditingCommitment = (commitment) => {
    setEditingCommitment(commitment.id)
    setEditCommitmentText(commitment.text)
  }

  const cancelEditCommitment = () => {
    setEditingCommitment(null)
    setEditCommitmentText('')
  }

  const saveEditCommitment = (commitmentId) => {
    if (editCommitmentText.trim()) {
      userDataStore.updateCommitment(user.id, commitmentId, editCommitmentText.trim())
      
      // Refresh commitments
      const updatedData = userDataStore.getUserData(user.id)
      const recentCommits = updatedData.commitments
        .filter(c => {
          const commitDate = new Date(c.date)
          const daysDiff = (today - commitDate) / (1000 * 60 * 60 * 24)
          return daysDiff <= 7
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecentCommitments(recentCommits)
      
      setEditingCommitment(null)
      setEditCommitmentText('')
    }
  }

  const deleteCommitment = (commitmentId) => {
    if (confirm('Are you sure you want to delete this commitment?')) {
      userDataStore.deleteCommitment(user.id, commitmentId)
      
      // Refresh commitments
      const updatedData = userDataStore.getUserData(user.id)
      const recentCommits = updatedData.commitments
        .filter(c => {
          const commitDate = new Date(c.date)
          const daysDiff = (today - commitDate) / (1000 * 60 * 60 * 24)
          return daysDiff <= 7
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date))
      setRecentCommitments(recentCommits)
    }
  }

  const startEditingGoal = (goal) => {
    setEditingGoal(goal.id)
    setEditGoalText(goal.text)
  }

  const cancelEditGoal = () => {
    setEditingGoal(null)
    setEditGoalText('')
  }

  const saveEditGoal = (goalId) => {
    if (editGoalText.trim()) {
      userDataStore.updateGoal(user.id, goalId, editGoalText.trim())
      
      // Refresh goals
      const updatedData = userDataStore.getUserData(user.id)
      const currentWeekGoals = updatedData.goals.filter(g => {
        const goalDate = new Date(g.createdAt)
        return goalDate >= weekStart && goalDate <= weekEnd
      })
      setWeeklyGoals(currentWeekGoals)
      
      setEditingGoal(null)
      setEditGoalText('')
    }
  }

  const deleteGoal = (goalId) => {
    if (confirm('Are you sure you want to delete this goal?')) {
      userDataStore.deleteGoal(user.id, goalId)
      
      // Refresh goals
      const updatedData = userDataStore.getUserData(user.id)
      const currentWeekGoals = updatedData.goals.filter(g => {
        const goalDate = new Date(g.createdAt)
        return goalDate >= weekStart && goalDate <= weekEnd
      })
      setWeeklyGoals(currentWeekGoals)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header - Mobile Responsive */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">Welcome back, {user?.name || user?.username}!</h1>
          <p className="text-sm md:text-base text-slate-400">Track your daily commitments and achieve your goals</p>
        </div>

        {/* Stats Overview - Week View - Mobile Responsive */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
          {/* Monday through Friday commitment status */}
          {(() => {
            const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            const currentDate = new Date();
            const currentDay = currentDate.getDay();
            const monday = new Date(currentDate);
            monday.setDate(currentDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
            
            return weekDays.map((day, index) => {
              const dayDate = new Date(monday);
              dayDate.setDate(monday.getDate() + index);
              const dayString = dayDate.toISOString().split('T')[0];
              const dayCommitment = recentCommitments.find(c => c.date === dayString);
              const isToday = dayString === todayString;
              const isFuture = dayDate > currentDate;
              
              // Determine status
              let status = 'none';
              let bgColor = 'bg-slate-800/50';
              let iconColor = 'text-slate-500';
              let icon = Circle;
              
              if (dayCommitment) {
                if (dayCommitment.status === 'completed') {
                  status = 'completed';
                  bgColor = 'bg-green-900/30 border-green-700/50';
                  iconColor = 'text-green-400';
                  icon = CheckCircle;
                } else {
                  status = 'pending';
                  bgColor = 'bg-yellow-900/30 border-yellow-700/50';
                  iconColor = 'text-yellow-400';
                  icon = Clock;
                }
              } else if (isFuture) {
                bgColor = 'bg-slate-800/30';
                iconColor = 'text-slate-600';
              } else if (!isToday) {
                // Past day with no commitment
                bgColor = 'bg-red-900/30 border-red-700/50';
                iconColor = 'text-red-400';
                icon = X;
              }
              
              if (isToday) {
                bgColor = bgColor.replace('/30', '/50').replace('/50', '/70');
              }
              
              return (
                <Card key={day} className={`${bgColor} backdrop-blur border-slate-700/50 ${isToday ? 'ring-2 ring-blue-500/50' : ''}`}>
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col items-center space-y-2">
                      {React.createElement(icon, { className: `h-6 w-6 ${iconColor}` })}
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-400">{day}</p>
                        <p className="text-sm font-bold text-white">
                          {dayDate.getDate()}
                        </p>
                        {isToday && (
                          <Badge variant="secondary" className="mt-1 text-xs bg-blue-600/20 text-blue-300">
                            Today
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            });
          })()}
        </div>

        {/* Phone Call Stats - Mobile Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Phone className="h-8 w-8 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Today's Call Target</p>
                  <p className="text-2xl font-bold text-white">
                    {(() => {
                      const phoneCallData = phoneCallStore?.getDailyStats?.(user.id, todayString);
                      if (phoneCallData && phoneCallData.targetCalls > 0) {
                        return `${phoneCallData.actualCalls || 0}/${phoneCallData.targetCalls} (${phoneCallData.completionRate}%)`;
                      }
                      return 'Not set';
                    })()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <Target className="h-8 w-8 text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-400">Weekly Goals</p>
                  <p className="text-2xl font-bold text-white">{weeklyGoals.filter(g => g.completed).length}/{weeklyGoals.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs - Mobile Responsive */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
            <TabsList className="flex w-max md:w-full md:grid md:grid-cols-7 bg-slate-800/30 backdrop-blur border border-slate-700/50 p-1 min-w-full">
              <TabsTrigger value="commitment" className="min-w-[120px] md:min-w-0 px-3 py-2 md:py-1.5 text-sm md:text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white transition-all">Today's Commitment</TabsTrigger>
              <TabsTrigger value="goals" className="min-w-[120px] md:min-w-0 px-3 py-2 md:py-1.5 text-sm md:text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white transition-all">Weekly Goals</TabsTrigger>
              <TabsTrigger value="reflection" className="min-w-[120px] md:min-w-0 px-3 py-2 md:py-1.5 text-sm md:text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white transition-all">Daily Reflection</TabsTrigger>
              <TabsTrigger value="calls" className="min-w-[120px] md:min-w-0 px-3 py-2 md:py-1.5 text-sm md:text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white transition-all">Phone Calls</TabsTrigger>
              <TabsTrigger value="transactions" className="min-w-[120px] md:min-w-0 px-3 py-2 md:py-1.5 text-sm md:text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white transition-all">Transactions</TabsTrigger>
              <TabsTrigger value="focus" className="min-w-[120px] md:min-w-0 px-3 py-2 md:py-1.5 text-sm md:text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white transition-all">Daily Focus</TabsTrigger>
              <TabsTrigger value="analytics" className="min-w-[120px] md:min-w-0 px-3 py-2 md:py-1.5 text-sm md:text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-slate-300 data-[state=inactive]:hover:text-white transition-all">Analytics</TabsTrigger>
            </TabsList>
          </div>

          {/* Today's Commitment Tab */}
          <TabsContent value="commitment" className="space-y-4">
            <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Target className="h-5 w-5" />
                  <span>Today's Commitment</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  What's your main focus for today? Set a clear, achievable commitment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Enter your commitment for today..."
                  value={todayCommitment}
                  onChange={(e) => setTodayCommitment(e.target.value)}
                  className="min-h-[100px] bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                />
                
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    <Button
                      variant={commitmentStatus === 'pending' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateCommitmentStatus('pending')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Pending
                    </Button>
                    <Button
                      variant={commitmentStatus === 'completed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateCommitmentStatus('completed')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completed
                    </Button>
                  </div>
                  
                  <Button onClick={saveCommitment} className="ml-auto">
                    Save Commitment
                  </Button>
                </div>

                {commitmentStatus && (
                  <div className="mt-4">
                    <Badge 
                      variant={commitmentStatus === 'completed' ? 'default' : 'secondary'}
                      className={commitmentStatus === 'completed' ? 'bg-green-100 text-green-800' : ''}
                    >
                      Status: {commitmentStatus === 'completed' ? 'Completed' : 'Pending'}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Commitments */}
            {recentCommitments.length > 0 && (
              <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
                <CardHeader>
                  <CardTitle>Recent Commitments</CardTitle>
                  <CardDescription>Your commitments from the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentCommitments.slice(0, 5).map((commit) => (
                      <div key={commit.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 mt-1">
                          {commit.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingCommitment === commit.id ? (
                            <div className="space-y-2">
                              <Textarea
                                value={editCommitmentText}
                                onChange={(e) => setEditCommitmentText(e.target.value)}
                                className="text-sm"
                                rows={2}
                              />
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => saveEditCommitment(commit.id)}
                                  className="h-7 px-2"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEditCommitment}
                                  className="h-7 px-2"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-gray-900">{commit.text}</p>
                              <p className="text-xs text-gray-500">{format(new Date(commit.date), 'MMM d, yyyy')}</p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge 
                            variant={commit.status === 'completed' ? 'default' : 'secondary'}
                            className={commit.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                          >
                            {commit.status}
                          </Badge>
                          {editingCommitment !== commit.id && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleCommitmentStatus(commit.id, commit.status)}
                                className={`h-7 w-7 p-0 ${
                                  commit.status === 'completed' 
                                    ? 'hover:bg-yellow-100' 
                                    : 'hover:bg-green-100'
                                }`}
                                title={commit.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
                              >
                                {commit.status === 'completed' ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Circle className="h-3 w-3 text-gray-400" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingCommitment(commit)}
                                className="h-7 w-7 p-0 hover:bg-blue-100"
                              >
                                <Edit className="h-3 w-3 text-blue-600" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteCommitment(commit.id)}
                                className="h-7 w-7 p-0 hover:bg-red-100"
                              >
                                <Trash2 className="h-3 w-3 text-red-600" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Weekly Goals Tab */}
          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Weekly Goals</span>
                </CardTitle>
                <CardDescription>
                  Set and track your goals for this week ({format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')})
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Add a new weekly goal..."
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={addWeeklyGoal} className="self-start">
                    Add Goal
                  </Button>
                </div>

                {weeklyGoals.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-white">This Week's Goals</h4>
                    {weeklyGoals.map((goal) => (
                      <div key={goal.id} className="flex flex-col space-y-4 p-5 bg-slate-700/50 backdrop-blur rounded-xl border border-slate-600/50 hover:bg-slate-700/70 transition-all">
                        <div className="flex items-start space-x-3">
                          <button
                            onClick={() => toggleGoalCompletion(goal.id)}
                            className="flex-shrink-0 mt-1 transition-all hover:scale-110"
                          >
                            {goal.completed ? (
                              <CheckCircle className="h-6 w-6 text-green-400 drop-shadow-lg" />
                            ) : (
                              <Circle className="h-6 w-6 text-slate-400 hover:text-blue-400 transition-colors" />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            {editingGoal === goal.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editGoalText}
                                  onChange={(e) => setEditGoalText(e.target.value)}
                                  className="text-sm bg-slate-600 border-slate-500 text-white"
                                  rows={2}
                                />
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveEditGoal(goal.id)}
                                    className="h-7 px-2"
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={cancelEditGoal}
                                    className="h-7 px-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className={`text-base font-medium ${goal.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                                  {goal.text}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  Added {format(new Date(goal.createdAt), 'MMM d, yyyy')}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="flex flex-col items-end space-y-2">
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={goal.completed ? 'default' : 'secondary'}
                                className={goal.completed 
                                  ? 'bg-green-500/20 text-green-300 border-green-500/50' 
                                  : goal.progress >= 75 
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                    : goal.progress >= 50
                                      ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                      : 'bg-slate-500/20 text-slate-300 border-slate-500/50'
                                }
                              >
                                {goal.completed ? '✓ Complete' : `${goal.progress || 0}%`}
                              </Badge>
                              {editingGoal !== goal.id && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => startEditingGoal(goal)}
                                    className="h-7 w-7 p-0 hover:bg-blue-500/20"
                                  >
                                    <Edit className="h-3 w-3 text-blue-400" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deleteGoal(goal.id)}
                                    className="h-7 w-7 p-0 hover:bg-red-500/20"
                                  >
                                    <Trash2 className="h-3 w-3 text-red-400" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {!goal.completed && (
                          <div className="space-y-3 bg-slate-800/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium text-slate-300">Progress Tracker</Label>
                              <span className="text-sm font-bold text-blue-400">{goal.progress || 0}%</span>
                            </div>
                            <div className="relative">
                              <div className="absolute -top-6 left-0 right-0 flex justify-between text-xs text-slate-500">
                                <span>0%</span>
                                <span>25%</span>
                                <span>50%</span>
                                <span>75%</span>
                                <span>100%</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="100"
                                step="5"
                                value={goal.progress || 0}
                                onChange={(e) => {
                                  const newProgress = parseInt(e.target.value)
                                  const updatedGoals = weeklyGoals.map(g =>
                                    g.id === goal.id ? { ...g, progress: newProgress, completed: newProgress === 100 } : g
                                  )
                                  setWeeklyGoals(updatedGoals)
                                  userDataStore.updateGoalProgress(user.id, goal.id, newProgress)
                                }}
                                className="w-full h-3 bg-slate-700 rounded-full appearance-none cursor-pointer slider-track"
                                style={{
                                  background: `linear-gradient(to right, 
                                    ${goal.progress >= 75 ? '#60a5fa' : goal.progress >= 50 ? '#fbbf24' : '#3b82f6'} 0%, 
                                    ${goal.progress >= 75 ? '#60a5fa' : goal.progress >= 50 ? '#fbbf24' : '#3b82f6'} ${goal.progress || 0}%, 
                                    #475569 ${goal.progress || 0}%, 
                                    #475569 100%)`
                                }}
                              />
                              <div className="flex justify-between mt-1">
                                {[0, 25, 50, 75, 100].map((mark) => (
                                  <div
                                    key={mark}
                                    className={`w-2 h-2 rounded-full ${
                                      (goal.progress || 0) >= mark
                                        ? 'bg-blue-400'
                                        : 'bg-slate-600'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 mt-3">
                              <Progress 
                                value={goal.progress || 0} 
                                className="flex-1 h-2"
                              />
                            </div>
                            <p className="text-xs text-slate-400 text-center mt-2">
                              {goal.progress === 0 && "Let's get started! 🚀"}
                              {goal.progress > 0 && goal.progress < 25 && "Good start, keep going! 💪"}
                              {goal.progress >= 25 && goal.progress < 50 && "Making progress! 📈"}
                              {goal.progress >= 50 && goal.progress < 75 && "Halfway there! 🎯"}
                              {goal.progress >= 75 && goal.progress < 100 && "Almost done! 🏁"}
                              {goal.progress === 100 && "Ready to complete! ✨"}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {weeklyGoals.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{weeklyGoals.filter(g => g.completed).length} of {weeklyGoals.length} completed</span>
                    </div>
                    <Progress 
                      value={weeklyGoals.length > 0 ? (weeklyGoals.filter(g => g.completed).length / weeklyGoals.length) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Daily Reflection Tab */}
          <TabsContent value="reflection" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Daily Reflection</span>
                </CardTitle>
                <CardDescription>
                  Take a moment to reflect on your day and plan for tomorrow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">What went well today?</label>
                  <Textarea
                    placeholder="Reflect on your successes and positive moments..."
                    value={reflection.wentWell}
                    onChange={(e) => setReflection({...reflection, wentWell: e.target.value})}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">What would you do differently?</label>
                  <Textarea
                    placeholder="Think about areas for improvement..."
                    value={reflection.differently}
                    onChange={(e) => setReflection({...reflection, differently: e.target.value})}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">What help or support do you need?</label>
                  <Textarea
                    placeholder="Identify resources or support you might need..."
                    value={reflection.needHelp}
                    onChange={(e) => setReflection({...reflection, needHelp: e.target.value})}
                    className="min-h-[80px]"
                  />
                </div>

                <Button onClick={saveReflection} className="w-full">
                  Save Reflection
                </Button>
              </CardContent>
            </Card>

            {/* Past Reflections */}
            {pastReflections.length > 0 && (
              <Card className="bg-slate-800/50 backdrop-blur border-slate-700/50">
                <CardHeader>
                  <CardTitle>Recent Reflections</CardTitle>
                  <CardDescription>Your reflections from the past week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {pastReflections.map((refl) => (
                      <div key={refl.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-semibold text-gray-900">
                            {format(new Date(refl.date), 'MMM d, yyyy')}
                            {refl.date === todayString && (
                              <Badge className="ml-2 bg-green-100 text-green-800">Today</Badge>
                            )}
                          </span>
                        </div>
                        {refl.wentWell && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">What went well:</p>
                            <p className="text-sm text-gray-800">{refl.wentWell}</p>
                          </div>
                        )}
                        {refl.differently && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Would do differently:</p>
                            <p className="text-sm text-gray-800">{refl.differently}</p>
                          </div>
                        )}
                        {refl.needHelp && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 mb-1">Need help with:</p>
                            <p className="text-sm text-gray-800">{refl.needHelp}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Phone Calls Tab */}
          <TabsContent value="calls">
            <PhoneCallTracking user={user} />
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <TransactionsSection user={user} />
          </TabsContent>

          {/* Daily Focus Tab */}
          <TabsContent value="focus">
            <DailyFocusSimple user={user} />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsDashboard user={user} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default Dashboard

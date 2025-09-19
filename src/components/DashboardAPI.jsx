import React, { useState, useEffect } from 'react'
import { useNavigation } from '../context/NavigationContext'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Slider } from '@/components/ui/slider.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Label } from '@/components/ui/label.jsx'
import { CheckCircle, Circle, Clock, Target, MessageSquare, X, Check, Phone, Edit2, Save, Trash2, Flame, TrendingUp, XCircle } from 'lucide-react'
import { commitmentsAPI, goalsAPI, reflectionsAPI } from '../lib/api-client.js'
import { streakStore } from '../utils/dataStore.js'
import PhoneCallTracking from './PhoneCallTracking.jsx'
import CommitmentsSection from './CommitmentsSection.jsx'
import WeeklyGoalsSection from './WeeklyGoalsSection.jsx'
import ReflectionsSection from './ReflectionsSection.jsx'

const DashboardAPI = ({ user }) => {
  const { activeTab, navigateToTab, navigateToCommitmentDate, selectedDate } = useNavigation()

  // State
  const [todayCommitment, setTodayCommitment] = useState('')
  const [commitmentStatus, setCommitmentStatus] = useState('pending')
  const [weeklyGoals, setWeeklyGoals] = useState([])
  const [newGoal, setNewGoal] = useState('')
  const [reflection, setReflection] = useState({
    wentWell: '',
    differently: '',
    needHelp: ''
  })
  const [recentCommitments, setRecentCommitments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingCommitment, setEditingCommitment] = useState(null)
  const [editingGoal, setEditingGoal] = useState(null)
  const [editingGoalProgress, setEditingGoalProgress] = useState({})
  const [tempGoalProgress, setTempGoalProgress] = useState({})
  const [commitmentStreak, setCommitmentStreak] = useState(0)
  const [phoneCallStreak, setPhoneCallStreak] = useState(0)
  const [allCommitments, setAllCommitments] = useState([])

  const today = new Date()
  const todayString = today.toISOString().split('T')[0]

  // Use selected date for week calculation, or today if not selected
  const baseDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : today
  // Start week on Monday (1) instead of Sunday (0)
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 })

  // Load data from API
  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user?.id, selectedDate]) // Reload when selected date changes

  const loadUserData = async () => {
    setLoading(true)
    try {
      // Load commitments
      const commitments = await commitmentsAPI.getByUser(user.id)
      if (commitments && Array.isArray(commitments)) {
        setAllCommitments(commitments)  // Store all commitments for streak calculation
        // Find today's commitment
        const todayCommit = commitments.find(c => c.commitment_date === todayString)
        if (todayCommit) {
          setTodayCommitment(todayCommit.commitment_text || '')
          setCommitmentStatus(todayCommit.status || 'pending')
        }

        // Get commitments for current week (Mon-Fri)
        // Generate date strings for the week to avoid timezone issues
        const weekDates = []
        for (let i = 0; i < 5; i++) {
          const date = new Date(weekStart)
          date.setDate(weekStart.getDate() + i)
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const day = String(date.getDate()).padStart(2, '0')
          weekDates.push(`${year}-${month}-${day}`)
        }

        const weekCommitments = commitments
          .filter(c => weekDates.includes(c.commitment_date.split('T')[0]))
          .map(c => ({
            id: c.id,
            text: c.commitment_text,
            date: c.commitment_date,
            status: c.status
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        setRecentCommitments(weekCommitments)

        // Debug logging
        console.log('Week Overview Debug:')
        console.log('Week dates:', weekDates)
        console.log('Today:', todayString)
        console.log('All commitments loaded:', commitments.length)
        if (commitments.length > 0) {
          console.log('All commitment dates:', commitments.map(c => c.commitment_date))
        }
        console.log('Week commitments filtered:', weekCommitments.length)

        // Log each day of the week and what commitment it has
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        weekDates.forEach((dateString, i) => {
          const commitment = weekCommitments.find(c => c.date === dateString)
          console.log(`${days[i]} ${dateString}:`, commitment ? `${commitment.status} - "${commitment.text}"` : 'No commitment')
        })

        // Calculate commitment streak
        const streak = streakStore.calculateCommitmentStreak(user.id, commitments)
        setCommitmentStreak(streak)
      }

      // Load goals
      const goals = await goalsAPI.getByUser(user.id)
      if (goals && Array.isArray(goals)) {
        const weekGoals = goals
          .filter(g => {
            const date = new Date(g.created_at)
            return date >= weekStart && date <= weekEnd
          })
          .map(g => ({
            id: g.id,
            text: g.goal_text,
            completed: g.status === 'completed',
            progress: g.progress || 0
          }))

        setWeeklyGoals(weekGoals)
      }

      // Calculate phone call streak
      const callStreak = streakStore.calculatePhoneCallStreak(user.id)
      setPhoneCallStreak(callStreak)

      // Load today's reflection
      const reflections = await reflectionsAPI.getByUser(user.id)
      if (reflections && Array.isArray(reflections)) {
        const todayReflection = reflections.find(r => r.reflection_date === todayString)
        if (todayReflection) {
          setReflection({
            wentWell: todayReflection.wins || '',
            differently: todayReflection.challenges || '',
            needHelp: todayReflection.tomorrow_focus || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Save commitment
  const saveCommitment = async () => {
    if (!todayCommitment.trim()) return

    setSaving(true)
    try {
      await commitmentsAPI.create(user.id, todayString, todayCommitment, commitmentStatus)

      // Clear form after successful save (since we allow multiple commitments now)
      setTodayCommitment('')
      setCommitmentStatus('pending')

      await loadUserData() // Reload to get updated data

      // Show success
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      toast.textContent = 'Commitment saved!'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
    } catch (error) {
      console.error('Error saving commitment:', error)
      alert('Failed to save commitment')
    } finally {
      setSaving(false)
    }
  }

  // Update commitment status
  const updateCommitmentStatus = async (status) => {
    setCommitmentStatus(status)
    if (todayCommitment.trim()) {
      try {
        await commitmentsAPI.updateStatus(user.id, todayString, status)
      } catch (error) {
        console.error('Error updating status:', error)
      }
    }
  }

  // Add weekly goal
  const addWeeklyGoal = async () => {
    if (!newGoal.trim()) return

    setSaving(true)
    try {
      await goalsAPI.create(user.id, newGoal)
      setNewGoal('')
      await loadUserData() // Reload goals
    } catch (error) {
      console.error('Error adding goal:', error)
      alert('Failed to add goal')
    } finally {
      setSaving(false)
    }
  }

  // Toggle goal completion
  const toggleGoalCompletion = async (goalId, currentProgress) => {
    const newProgress = currentProgress >= 100 ? 0 : 100
    try {
      await goalsAPI.updateProgress(goalId, newProgress)
      await loadUserData()
    } catch (error) {
      console.error('Error updating goal:', error)
    }
  }

  // Toggle commitment status
  const toggleCommitmentStatus = async (commitmentId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    try {
      await commitmentsAPI.updateById(commitmentId, undefined, newStatus)
      await loadUserData()
    } catch (error) {
      console.error('Error updating commitment status:', error)
    }
  }

  // Update commitment text
  const updateCommitmentText = async (commitmentId, newText) => {
    try {
      await commitmentsAPI.updateById(commitmentId, newText, undefined)
      setEditingCommitment(null)
      await loadUserData()
    } catch (error) {
      console.error('Error updating commitment:', error)
      alert('Failed to update commitment')
    }
  }

  // Update goal
  const updateGoalText = async (goalId, newText, newProgress) => {
    try {
      await goalsAPI.updateGoal(goalId, newText, newProgress)
      setEditingGoal(null)
      const newProgressState = {...editingGoalProgress}
      delete newProgressState[goalId]
      setEditingGoalProgress(newProgressState)
      await loadUserData()
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Failed to update goal')
    }
  }

  // Quick update goal progress (called when slider is committed)
  const updateGoalProgress = async (goalId, newProgress) => {
    try {
      await goalsAPI.updateGoal(goalId, undefined, newProgress)
      // Clear temp progress after successful update
      const newTemp = {...tempGoalProgress}
      delete newTemp[goalId]
      setTempGoalProgress(newTemp)
      await loadUserData()
    } catch (error) {
      console.error('Error updating goal progress:', error)
      // Only show error if it's a real failure, not just a warning
      if (error.message && !error.message.includes('200')) {
        alert('Failed to update goal progress')
      }
    }
  }

  // Delete goal
  const deleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      await goalsAPI.delete(goalId)
      await loadUserData()
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Failed to delete goal')
    }
  }

  // Delete commitment
  const deleteCommitment = async (commitmentId) => {
    if (!confirm('Are you sure you want to delete this commitment?')) return

    try {
      await commitmentsAPI.delete(commitmentId)
      await loadUserData()
    } catch (error) {
      console.error('Error deleting commitment:', error)
      alert('Failed to delete commitment')
    }
  }

  // Save reflection
  const saveReflection = async () => {
    if (!reflection.wentWell && !reflection.differently && !reflection.needHelp) {
      alert('Please fill in at least one field')
      return
    }

    setSaving(true)
    try {
      await reflectionsAPI.create(
        user.id,
        todayString,
        reflection.wentWell,
        reflection.differently,
        reflection.needHelp  // This gets mapped to tomorrowFocus in the API client
      )

      // Show success
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      toast.textContent = 'Reflection saved!'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
    } catch (error) {
      console.error('Error saving reflection:', error)
      alert('Failed to save reflection')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-sm md:text-base text-slate-400">
          Track your daily commitments and achieve your goals
        </p>
      </div>

      {/* Week Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-3">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => {
          const date = new Date(weekStart)
          date.setDate(weekStart.getDate() + index)
          // Use local date formatting to avoid timezone issues
          const year = date.getFullYear()
          const month = String(date.getMonth() + 1).padStart(2, '0')
          const dayStr = String(date.getDate()).padStart(2, '0')
          const dateString = `${year}-${month}-${dayStr}`
          const commitment = recentCommitments.find(c => c.date.split('T')[0] === dateString)
          const isToday = dateString === todayString

          const isPast = dateString < todayString

          return (
            <Card
              key={day}
              className={`bg-slate-800/50 border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-all ${isToday ? 'ring-2 ring-blue-500/50' : ''}`}
              onClick={() => navigateToCommitmentDate(dateString)}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col items-center space-y-2">
                  {commitment?.status === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : commitment && commitment.status === 'pending' && !isPast ? (
                    <Clock className="h-6 w-6 text-yellow-400" />
                  ) : isPast && !commitment ? (
                    <XCircle className="h-6 w-6 text-red-400" />
                  ) : isPast && commitment?.status === 'pending' ? (
                    <XCircle className="h-6 w-6 text-red-400" />
                  ) : (
                    <Circle className="h-6 w-6 text-slate-500" />
                  )}
                  <div className="text-center">
                    <p className="text-xs font-medium text-slate-400">{day}</p>
                    <p className="text-sm font-bold text-white">{date.getDate()}</p>
                    {isToday && (
                      <Badge variant="secondary" className="mt-1 text-xs">Today</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Main Content - No Tab Bar, controlled by sidebar */}
      <Tabs value={activeTab} onValueChange={navigateToTab} className="space-y-4">
        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Streak Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Commitment Streak */}
            <Card className="bg-gradient-to-br from-orange-500/20 to-red-600/20 border-orange-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Flame className={`h-6 w-6 ${commitmentStreak > 0 ? 'text-orange-500' : 'text-gray-500'}`} />
                    Commitment Streak
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {commitmentStreak >= 60 && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                        PLATINUM
                      </Badge>
                    )}
                    {commitmentStreak >= 30 && commitmentStreak < 60 && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                        GOLD
                      </Badge>
                    )}
                    {commitmentStreak >= 10 && commitmentStreak < 30 && (
                      <Badge className="bg-gradient-to-r from-gray-400 to-gray-300 text-gray-800 border-0">
                        SILVER
                      </Badge>
                    )}
                    {commitmentStreak >= 5 && commitmentStreak < 10 && (
                      <Badge className="bg-gradient-to-r from-amber-700 to-amber-600 text-white border-0">
                        BRONZE
                      </Badge>
                    )}
                    <Badge className={`text-lg px-3 py-1 ${commitmentStreak > 0 ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-gray-700 text-gray-400'}`}>
                      {commitmentStreak} {commitmentStreak === 1 ? 'Day' : 'Days'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  {commitmentStreak >= 60
                    ? `Legendary! ${commitmentStreak} days of dedication!`
                    : commitmentStreak >= 30
                    ? `Outstanding! ${commitmentStreak} days of excellence!`
                    : commitmentStreak >= 10
                    ? `Impressive! ${commitmentStreak} days of consistency!`
                    : commitmentStreak >= 5
                    ? `Great start! ${commitmentStreak} days and building momentum!`
                    : commitmentStreak > 0
                    ? `Keep going! ${5 - commitmentStreak} more days to Bronze!`
                    : 'Start your streak by completing today\'s commitment!'}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progress to next tier</span>
                    <span>
                      {commitmentStreak >= 60
                        ? 'Max tier achieved!'
                        : commitmentStreak >= 30
                        ? `${60 - commitmentStreak} days to Platinum`
                        : commitmentStreak >= 10
                        ? `${30 - commitmentStreak} days to Gold`
                        : commitmentStreak >= 5
                        ? `${10 - commitmentStreak} days to Silver`
                        : `${5 - commitmentStreak} days to Bronze`}
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
                      style={{
                        width: `${
                          commitmentStreak >= 60 ? 100 :
                          commitmentStreak >= 30 ? ((commitmentStreak - 30) / 30) * 100 :
                          commitmentStreak >= 10 ? ((commitmentStreak - 10) / 20) * 100 :
                          commitmentStreak >= 5 ? ((commitmentStreak - 5) / 5) * 100 :
                          (commitmentStreak / 5) * 100
                        }%`
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phone Call Streak */}
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-blue-500/30">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Phone className={`h-6 w-6 ${phoneCallStreak > 0 ? 'text-blue-500' : 'text-gray-500'}`} />
                    Phone Call Streak
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {phoneCallStreak >= 60 && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                        PLATINUM
                      </Badge>
                    )}
                    {phoneCallStreak >= 30 && phoneCallStreak < 60 && (
                      <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0">
                        GOLD
                      </Badge>
                    )}
                    {phoneCallStreak >= 10 && phoneCallStreak < 30 && (
                      <Badge className="bg-gradient-to-r from-gray-400 to-gray-300 text-gray-800 border-0">
                        SILVER
                      </Badge>
                    )}
                    {phoneCallStreak >= 5 && phoneCallStreak < 10 && (
                      <Badge className="bg-gradient-to-r from-amber-700 to-amber-600 text-white border-0">
                        BRONZE
                      </Badge>
                    )}
                    <Badge className={`text-lg px-3 py-1 ${phoneCallStreak > 0 ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-gray-700 text-gray-400'}`}>
                      {phoneCallStreak} {phoneCallStreak === 1 ? 'Day' : 'Days'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  {phoneCallStreak >= 60
                    ? `Legendary outreach! ${phoneCallStreak} days of consistent calls!`
                    : phoneCallStreak >= 30
                    ? `Outstanding performance! ${phoneCallStreak} days strong!`
                    : phoneCallStreak >= 10
                    ? `Impressive consistency! ${phoneCallStreak} days of calls!`
                    : phoneCallStreak >= 5
                    ? `Great momentum! ${phoneCallStreak} days and growing!`
                    : phoneCallStreak > 0
                    ? `Keep going! ${5 - phoneCallStreak} more days to Bronze!`
                    : 'Start your streak with consistent daily calls!'}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Progress to next tier</span>
                    <span>
                      {phoneCallStreak >= 60
                        ? 'Max tier achieved!'
                        : phoneCallStreak >= 30
                        ? `${60 - phoneCallStreak} days to Platinum`
                        : phoneCallStreak >= 10
                        ? `${30 - phoneCallStreak} days to Gold`
                        : phoneCallStreak >= 5
                        ? `${10 - phoneCallStreak} days to Silver`
                        : `${5 - phoneCallStreak} days to Bronze`}
                    </span>
                  </div>
                  <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                      style={{
                        width: `${
                          phoneCallStreak >= 60 ? 100 :
                          phoneCallStreak >= 30 ? ((phoneCallStreak - 30) / 30) * 100 :
                          phoneCallStreak >= 10 ? ((phoneCallStreak - 10) / 20) * 100 :
                          phoneCallStreak >= 5 ? ((phoneCallStreak - 5) / 5) * 100 :
                          (phoneCallStreak / 5) * 100
                        }%`
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                This Week's Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-2xl font-bold text-white">{recentCommitments.filter(c => c.status === 'completed').length}</p>
                  <p className="text-sm text-slate-400">Commitments Done</p>
                </div>
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-2xl font-bold text-white">{weeklyGoals.filter(g => g.progress >= 100).length}</p>
                  <p className="text-sm text-slate-400">Goals Completed</p>
                </div>
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-2xl font-bold text-white">
                    {recentCommitments.length > 0
                      ? Math.round((recentCommitments.filter(c => c.status === 'completed').length / recentCommitments.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-slate-400">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commitment Tab */}
        <TabsContent value="commitment" className="space-y-4">
          <CommitmentsSection user={user} />
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <WeeklyGoalsSection user={user} />
        </TabsContent>

        {/* Reflection Tab */}
        <TabsContent value="reflection" className="space-y-4">
          <ReflectionsSection user={user} />
        </TabsContent>

        {/* Phone Calls Tab */}
        <TabsContent value="phone-calls" className="space-y-4">
          <PhoneCallTracking user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DashboardAPI
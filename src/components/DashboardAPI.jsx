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
import { CheckCircle, Circle, Clock, Target, MessageSquare, X, Check, Phone, Edit2, Save, Trash2 } from 'lucide-react'
import { commitmentsAPI, goalsAPI, reflectionsAPI } from '../lib/api-client.js'
import PhoneCallTracking from './PhoneCallTracking.jsx'

const DashboardAPI = ({ user }) => {
  const { activeTab, navigateToTab } = useNavigation()

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

  const today = new Date()
  const todayString = today.toISOString().split('T')[0]
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)

  // Load data from API
  useEffect(() => {
    if (user?.id) {
      loadUserData()
    }
  }, [user?.id])

  const loadUserData = async () => {
    setLoading(true)
    try {
      // Load commitments
      const commitments = await commitmentsAPI.getByUser(user.id)
      if (commitments && Array.isArray(commitments)) {
        // Find today's commitment
        const todayCommit = commitments.find(c => c.commitment_date === todayString)
        if (todayCommit) {
          setTodayCommitment(todayCommit.commitment_text || '')
          setCommitmentStatus(todayCommit.status || 'pending')
        }

        // Get recent commitments
        const recent = commitments
          .filter(c => {
            const date = new Date(c.commitment_date)
            const diff = (today - date) / (1000 * 60 * 60 * 24)
            return diff <= 7 && diff >= 0
          })
          .map(c => ({
            id: c.id,
            text: c.commitment_text,
            date: c.commitment_date,
            status: c.status
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        setRecentCommitments(recent)
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
      await loadUserData()
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Failed to update goal')
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
        reflection.needHelp
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
          const dateString = date.toISOString().split('T')[0]
          const commitment = recentCommitments.find(c => c.date === dateString)
          const isToday = dateString === todayString

          return (
            <Card key={day} className={`bg-slate-800/50 border-slate-700/50 ${isToday ? 'ring-2 ring-blue-500/50' : ''}`}>
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col items-center space-y-2">
                  {commitment?.status === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  ) : commitment ? (
                    <Clock className="h-6 w-6 text-yellow-400" />
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
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Dashboard Overview</CardTitle>
              <CardDescription className="text-slate-400">
                Your accountability dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">Welcome to your accountability dashboard. Use the sidebar to navigate between different sections.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commitment Tab */}
        <TabsContent value="commitment" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Today's Commitment</CardTitle>
              <CardDescription className="text-slate-400">
                What's your main focus for today?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your commitment..."
                value={todayCommitment}
                onChange={(e) => setTodayCommitment(e.target.value)}
                className="min-h-[100px] bg-slate-700/50 border-slate-600 text-white"
                style={{ fontSize: '16px' }}
              />

              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex gap-2">
                  <Button
                    variant={commitmentStatus === 'pending' ? 'default' : 'outline'}
                    onClick={() => updateCommitmentStatus('pending')}
                    className="flex-1 md:flex-initial min-h-[44px]"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Pending
                  </Button>
                  <Button
                    variant={commitmentStatus === 'completed' ? 'default' : 'outline'}
                    onClick={() => updateCommitmentStatus('completed')}
                    className="flex-1 md:flex-initial min-h-[44px]"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Completed
                  </Button>
                </div>

                <Button
                  onClick={saveCommitment}
                  disabled={saving}
                  className="w-full md:w-auto md:ml-auto min-h-[44px]"
                >
                  {saving ? 'Saving...' : 'Save Commitment'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Commitments */}
          {recentCommitments.length > 0 && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Recent Commitments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentCommitments.slice(0, 10).map(commit => (
                    <div key={commit.id} className="flex items-start space-x-3 p-3 bg-slate-700/50 rounded-lg">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => toggleCommitmentStatus(commit.id, commit.status)}
                      >
                        {commit.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-400" />
                        )}
                      </Button>
                      <div className="flex-1">
                        {editingCommitment === commit.id ? (
                          <div className="flex gap-2">
                            <Textarea
                              defaultValue={commit.text}
                              className="bg-slate-600/50 text-white text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault()
                                  updateCommitmentText(commit.id, e.target.value)
                                }
                              }}
                              autoFocus
                            />
                            <Button
                              size="sm"
                              onClick={(e) => {
                                const textarea = e.target.closest('div').querySelector('textarea')
                                updateCommitmentText(commit.id, textarea.value)
                              }}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingCommitment(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-white">{commit.text}</p>
                            <p className="text-xs text-slate-400">{format(new Date(commit.date), 'MMM d, h:mm a')}</p>
                          </>
                        )}
                      </div>
                      {editingCommitment !== commit.id && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingCommitment(commit.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Badge variant={commit.status === 'completed' ? 'default' : 'secondary'}>
                            {commit.status}
                          </Badge>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Weekly Goals</CardTitle>
              <CardDescription className="text-slate-400">
                Set and track your goals for this week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                <Textarea
                  placeholder="Add a new goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="flex-1 text-base bg-slate-700/50 border-slate-600 text-white"
                  style={{ fontSize: '16px' }}
                />
                <Button
                  onClick={addWeeklyGoal}
                  disabled={saving}
                  className="w-full md:w-auto md:self-start min-h-[44px]"
                >
                  Add Goal
                </Button>
              </div>

              {weeklyGoals.length > 0 && (
                <div className="space-y-3">
                  {weeklyGoals.map(goal => (
                    <div key={goal.id} className="p-4 bg-slate-700/50 rounded-lg">
                      {editingGoal === goal.id ? (
                        <div className="space-y-3">
                          <Textarea
                            defaultValue={goal.text}
                            className="bg-slate-600/50 text-white"
                            id={`goal-text-${goal.id}`}
                          />
                          <div className="flex items-center gap-3">
                            <Label className="text-slate-300">Progress:</Label>
                            <Slider
                              defaultValue={[goal.progress || 0]}
                              max={100}
                              step={10}
                              className="flex-1"
                              id={`goal-progress-${goal.id}`}
                            />
                            <span className="text-white w-12 text-right">
                              {goal.progress || 0}%
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const text = document.getElementById(`goal-text-${goal.id}`).value
                                const progress = document.getElementById(`goal-progress-${goal.id}`).value
                                updateGoalText(goal.id, text, parseInt(progress))
                              }}
                            >
                              <Save className="h-4 w-4 mr-1" /> Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingGoal(null)}
                            >
                              <X className="h-4 w-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-start space-x-3">
                            <button
                              onClick={() => toggleGoalCompletion(goal.id, goal.progress)}
                              className="mt-1"
                            >
                              {goal.completed ? (
                                <CheckCircle className="h-6 w-6 text-green-400" />
                              ) : (
                                <Circle className="h-6 w-6 text-slate-400 hover:text-blue-400" />
                              )}
                            </button>
                            <div className="flex-1">
                              <p className={`text-base ${goal.completed ? 'text-slate-400 line-through' : 'text-white'}`}>
                                {goal.text}
                              </p>
                              {goal.progress !== undefined && goal.progress > 0 && (
                                <div className="mt-2">
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-slate-600 rounded-full h-2">
                                      <div
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ width: `${goal.progress}%` }}
                                      />
                                    </div>
                                    <span className="text-xs text-slate-400">{goal.progress}%</span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingGoal(goal.id)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reflection Tab */}
        <TabsContent value="reflection" className="space-y-4">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Daily Reflection</CardTitle>
              <CardDescription className="text-slate-400">
                Take a moment to reflect on your day
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">What went well today?</Label>
                <Textarea
                  value={reflection.wentWell}
                  onChange={(e) => setReflection({...reflection, wentWell: e.target.value})}
                  className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <Label className="text-slate-300">What could have gone better?</Label>
                <Textarea
                  value={reflection.differently}
                  onChange={(e) => setReflection({...reflection, differently: e.target.value})}
                  className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <Label className="text-slate-300">What's your focus for tomorrow?</Label>
                <Textarea
                  value={reflection.needHelp}
                  onChange={(e) => setReflection({...reflection, needHelp: e.target.value})}
                  className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                  style={{ fontSize: '16px' }}
                />
              </div>

              <Button
                onClick={saveReflection}
                disabled={saving}
                className="w-full min-h-[44px]"
              >
                {saving ? 'Saving...' : 'Save Reflection'}
              </Button>
            </CardContent>
          </Card>
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
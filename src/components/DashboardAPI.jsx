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
import { CheckCircle, Circle, Clock, Target, MessageSquare, X, Check, Phone, Edit2, Save, Trash2, Flame, TrendingUp, XCircle, Star } from 'lucide-react'
import { commitmentsAPI, goalsAPI, reflectionsAPI, phoneCallsAPI } from '../lib/api-client.js'
import { streakStore } from '../utils/dataStore.js'
import PhoneCallTracking from './PhoneCallTracking.jsx'
import CommitmentsSection from './CommitmentsSection.jsx'
import WeeklyGoalsSection from './WeeklyGoalsSection.jsx'
import ReflectionsSection from './ReflectionsSection.jsx'

const DashboardAPI = ({ user }) => {
  const { activeTab, navigateToTab, navigateToCommitmentDate, navigateToPhoneCallsDate, selectedDate } = useNavigation()

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
  const [weeklyPhoneCalls, setWeeklyPhoneCalls] = useState([])

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
      // Load commitments - regular users see 7 days, admins see 6 months
      const isAdmin = user.role === 'admin'
      const commitments = await commitmentsAPI.getByUser(user.id, isAdmin)
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

        console.log('Week calculation debug:')
        console.log('weekStart:', weekStart.toISOString())
        console.log('weekDates generated:', weekDates)
        console.log('Raw commitments from API:', commitments.slice(0, 3).map(c => ({
          date: c.commitment_date,
          status: c.status
        })))

        const weekCommitments = commitments
          .filter(c => {
            // Extract just the date part (YYYY-MM-DD) from the commitment date
            const commitmentDateStr = c.commitment_date.split('T')[0]
            const isInWeek = weekDates.includes(commitmentDateStr)
            console.log(`Checking commitment date ${commitmentDateStr}:`, isInWeek ? 'IN WEEK' : 'not in week', 'weekDates:', weekDates)
            return isInWeek
          })
          .map(c => ({
            id: c.id,
            text: c.commitment_text,
            date: c.commitment_date.split('T')[0], // Store just the date part for easier matching
            status: c.status
          }))
          .sort((a, b) => new Date(b.date) - new Date(a.date))

        setRecentCommitments(weekCommitments)

        // Debug logging
        console.log('Week Overview Debug:')
        console.log('Week dates:', weekDates)
        console.log('Today:', todayString)
        console.log('Week start:', weekStart.toISOString())
        console.log('All commitments:', commitments.map(c => c.commitment_date.split('T')[0]))
        console.log('Filtered week commitments:', weekCommitments)
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

        // Calculate commitment streak using the API endpoint
        try {
          const response = await fetch(`/api/streak?userId=${user.id}`)
          if (response.ok) {
            const data = await response.json()
            console.log('=== STREAK API RESPONSE ===')
            console.log('Streak value from API:', data.streak)
            console.log('Debug info from API:', data.debug)
            setCommitmentStreak(data.streak)
          } else {
            // Fallback to local calculation
            console.log('API failed, using local calculation')
            const streak = streakStore.calculateCommitmentStreak(user.id, commitments)
            setCommitmentStreak(streak)
          }
        } catch (error) {
          console.error('Error fetching streak:', error)
          // Fallback to local calculation
          console.log('=== LOCAL STREAK CALCULATION ===')
          console.log('Calculating streak locally for user:', user.id)
          console.log('Number of commitments:', commitments.length)
          console.log('First 5 commitments:', commitments.slice(0, 5).map(c => ({
            date: c.commitment_date,
            status: c.status,
            text: c.commitment_text?.substring(0, 30)
          })))
          const streak = streakStore.calculateCommitmentStreak(user.id, commitments)
          console.log('Final calculated streak:', streak)
          setCommitmentStreak(streak)
        }
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

      // Calculate phone call streak from database
      try {
        // Get phone calls for the last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const phoneCalls = await phoneCallsAPI.getByUser(
          user.id,
          thirtyDaysAgo.toISOString().split('T')[0]
        )

        // Filter phone calls for current week
        const weekStartStr = weekStart.toISOString().split('T')[0]
        const weekEndStr = weekEnd.toISOString().split('T')[0]

        const weekPhoneCalls = (phoneCalls || []).filter(call => {
          const callDateStr = typeof call.call_date === 'string'
            ? call.call_date.split('T')[0]
            : call.call_date.toISOString().split('T')[0]
          return callDateStr >= weekStartStr && callDateStr <= weekEndStr
        })
        setWeeklyPhoneCalls(weekPhoneCalls)

        // Calculate streak (25+ calls on weekdays)
        let streak = 0
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // Sort calls by date descending
        const sortedCalls = (phoneCalls || [])
          .filter(c => c.actual_calls >= 25)
          .sort((a, b) => new Date(b.call_date) - new Date(a.call_date))

        // Start from today and work backwards
        let currentDate = new Date(today)

        // If today is weekend, move to last Friday
        const isWeekday = (date) => {
          const day = date.getDay()
          return day >= 1 && day <= 5
        }

        if (!isWeekday(currentDate)) {
          while (!isWeekday(currentDate)) {
            currentDate.setDate(currentDate.getDate() - 1)
          }
        }

        while (currentDate >= thirtyDaysAgo) {
          const dateStr = currentDate.toISOString().split('T')[0]

          if (isWeekday(currentDate)) {
            // Check if there's a call with 25+ for this date
            const hasEnoughCalls = sortedCalls.some(c =>
              c.call_date.split('T')[0] === dateStr && c.actual_calls >= 25
            )

            if (hasEnoughCalls) {
              streak++
            } else if (streak > 0) {
              // Streak broken
              break
            }
          }

          // Move to previous day
          currentDate.setDate(currentDate.getDate() - 1)
        }

        setPhoneCallStreak(streak)
      } catch (error) {
        console.error('Error calculating phone call streak:', error)
        setPhoneCallStreak(0)
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

    // Optimistically update the UI
    setCommitments(prev => prev.map(c =>
      c.id === commitmentId ? { ...c, status: newStatus } : c
    ))

    try {
      // Update the backend
      await commitmentsAPI.updateById(commitmentId, undefined, newStatus)

      // Immediately recalculate the streak with the updated commitments
      const updatedCommitments = commitments.map(c =>
        c.id === commitmentId ? { ...c, status: newStatus } : c
      )

      // Recalculate streak with updated data
      const newStreak = streakStore.calculateCommitmentStreak(user.id, updatedCommitments)
      setCommitmentStreak(newStreak)

      // Reload all data to ensure consistency
      // Add a small delay to ensure backend has processed the update
      setTimeout(async () => {
        await loadUserData()
      }, 100)

    } catch (error) {
      console.error('Error updating commitment status:', error)
      // Revert optimistic update on error
      setCommitments(prev => prev.map(c =>
        c.id === commitmentId ? { ...c, status: currentStatus } : c
      ))
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
        <div className="flex items-center gap-4 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, {user?.name}!
          </h1>
          <div className="flex items-center gap-3">
            {/* Commitment Streak Badge - 3D Stars */}
            {commitmentStreak > 0 && (
              <div className="relative group transform transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 animate-pulse"></div>
                <div className="relative flex items-center gap-2 bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 px-5 py-3 rounded-full shadow-2xl border-2 border-orange-400/50 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-full"></div>
                  <Flame className="relative h-6 w-6 text-white drop-shadow-lg animate-pulse z-10" />
                  <div className="relative flex items-center gap-2 z-10">
                    {/* 3D Stars based on tier */}
                    {commitmentStreak >= 60 && (
                      <div className="relative">
                        <Star className="h-7 w-7 text-purple-400 fill-purple-400 drop-shadow-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-purple-400 to-purple-600 mix-blend-overlay rounded-full blur-md"></div>
                        <Star className="absolute top-0 left-0 h-7 w-7 text-white/30 fill-white/20" />
                      </div>
                    )}
                    {commitmentStreak >= 30 && commitmentStreak < 60 && (
                      <div className="relative">
                        <Star className="h-7 w-7 text-yellow-400 fill-yellow-400 drop-shadow-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 mix-blend-overlay rounded-full blur-md"></div>
                        <Star className="absolute top-0 left-0 h-7 w-7 text-white/30 fill-white/20" />
                      </div>
                    )}
                    {commitmentStreak >= 10 && commitmentStreak < 30 && (
                      <div className="relative">
                        <Star className="h-7 w-7 text-gray-400 fill-gray-400 drop-shadow-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-slate-300 to-gray-500 mix-blend-overlay rounded-full blur-md"></div>
                        <Star className="absolute top-0 left-0 h-7 w-7 text-white/30 fill-white/20" />
                      </div>
                    )}
                    {commitmentStreak >= 5 && commitmentStreak < 10 && (
                      <div className="relative">
                        <Star className="h-7 w-7 text-amber-600 fill-amber-600 drop-shadow-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-700 mix-blend-overlay rounded-full blur-md"></div>
                        <Star className="absolute top-0 left-0 h-7 w-7 text-white/30 fill-white/20" />
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-white drop-shadow-lg">{commitmentStreak}</span>
                      <span className="text-xs font-bold text-orange-100 -mt-1">STREAK</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-2 bg-black/20 rounded-full blur-sm"></div>
                </div>
              </div>
            )}

            {/* Phone Call Streak Badge - 3D Stars */}
            {phoneCallStreak > 0 && (
              <div className="relative group transform transition-all duration-300 hover:scale-110 hover:-translate-y-1">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full blur-xl opacity-50 group-hover:opacity-75 animate-pulse"></div>
                <div className="relative flex items-center gap-2 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-600 px-5 py-3 rounded-full shadow-2xl border-2 border-blue-400/50 backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-full"></div>
                  <Phone className="relative h-6 w-6 text-white drop-shadow-lg animate-pulse z-10" />
                  <div className="relative flex items-center gap-2 z-10">
                    {/* 3D Stars based on tier */}
                    {phoneCallStreak >= 60 && (
                      <div className="relative">
                        <Star className="h-7 w-7 text-purple-400 fill-purple-400 drop-shadow-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-purple-400 to-purple-600 mix-blend-overlay rounded-full blur-md"></div>
                        <Star className="absolute top-0 left-0 h-7 w-7 text-white/30 fill-white/20" />
                      </div>
                    )}
                    {phoneCallStreak >= 30 && phoneCallStreak < 60 && (
                      <div className="relative">
                        <Star className="h-7 w-7 text-yellow-400 fill-yellow-400 drop-shadow-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 mix-blend-overlay rounded-full blur-md"></div>
                        <Star className="absolute top-0 left-0 h-7 w-7 text-white/30 fill-white/20" />
                      </div>
                    )}
                    {phoneCallStreak >= 10 && phoneCallStreak < 30 && (
                      <div className="relative">
                        <Star className="h-7 w-7 text-gray-400 fill-gray-400 drop-shadow-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-slate-300 to-gray-500 mix-blend-overlay rounded-full blur-md"></div>
                        <Star className="absolute top-0 left-0 h-7 w-7 text-white/30 fill-white/20" />
                      </div>
                    )}
                    {phoneCallStreak >= 5 && phoneCallStreak < 10 && (
                      <div className="relative">
                        <Star className="h-7 w-7 text-amber-600 fill-amber-600 drop-shadow-2xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-700 mix-blend-overlay rounded-full blur-md"></div>
                        <Star className="absolute top-0 left-0 h-7 w-7 text-white/30 fill-white/20" />
                      </div>
                    )}
                    <div className="flex flex-col items-center">
                      <span className="text-2xl font-black text-white drop-shadow-lg">{phoneCallStreak}</span>
                      <span className="text-xs font-bold text-blue-100 -mt-1">CALLS</span>
                    </div>
                  </div>
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3/4 h-2 bg-black/20 rounded-full blur-sm"></div>
                </div>
              </div>
            )}
          </div>
        </div>
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
          const commitment = recentCommitments.find(c => c.date === dateString)
          const isToday = dateString === todayString

          const isPast = dateString < todayString

          // Find phone call data for this day
          const dayPhoneCall = weeklyPhoneCalls.find(call => {
            const callDateStr = typeof call.call_date === 'string'
              ? call.call_date.split('T')[0]
              : call.call_date.toISOString().split('T')[0]
            return callDateStr === dateString
          })

          const hasCallGoal = dayPhoneCall && dayPhoneCall.target_calls > 0
          const callGoalMet = hasCallGoal && dayPhoneCall.actual_calls >= dayPhoneCall.target_calls
          const commitmentCompleted = commitment?.status === 'completed'

          // Determine overall card status
          const bothComplete = commitmentCompleted && callGoalMet
          const partialComplete = commitmentCompleted || callGoalMet

          return (
            <Card
              key={day}
              className={`bg-slate-800/50 border-slate-700/50 transition-all ${
                isToday ? 'ring-2 ring-blue-500/50' :
                bothComplete ? 'bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-500/30' :
                partialComplete ? 'bg-slate-800/70' : ''
              }`}
            >
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col space-y-2">
                  {/* Day and Date Header */}
                  <div className="text-center border-b border-slate-700/50 pb-2">
                    <p className="text-xs font-medium text-slate-400">{day}</p>
                    <p className="text-xl font-bold text-white">{date.getDate()}</p>
                    {isToday && (
                      <Badge variant="secondary" className="mt-1 text-xs">Today</Badge>
                    )}
                  </div>

                  {/* Two Equal Primary Sections */}
                  <div className="space-y-3">
                    {/* Commitment Section - Clickable */}
                    <div
                      className="bg-slate-700/30 rounded-md p-2 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigateToCommitmentDate(dateString)
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-300">Commitment</span>
                        {commitmentCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : commitment && commitment.status === 'pending' && !isPast ? (
                          <Circle className="h-5 w-5 text-yellow-400" />
                        ) : isPast && !commitment ? (
                          <XCircle className="h-5 w-5 text-red-400" />
                        ) : isPast && commitment?.status === 'pending' ? (
                          <XCircle className="h-5 w-5 text-red-400" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-500" />
                        )}
                      </div>
                      {commitment ? (
                        <p className="text-xs text-slate-400 truncate" title={commitment.text}>
                          {commitment.text ? commitment.text.substring(0, 20) + '...' : 'Set'}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No commitment</p>
                      )}
                    </div>

                    {/* Phone Calls Section - Clickable */}
                    <div
                      className="bg-slate-700/30 rounded-md p-2 cursor-pointer hover:bg-slate-700/50 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        navigateToPhoneCallsDate(dateString)
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Calls
                        </span>
                        {callGoalMet ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : hasCallGoal && dayPhoneCall.actual_calls > 0 ? (
                          <Clock className="h-5 w-5 text-yellow-400" />
                        ) : hasCallGoal && isPast ? (
                          <XCircle className="h-5 w-5 text-red-400" />
                        ) : hasCallGoal ? (
                          <Circle className="h-5 w-5 text-slate-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-slate-600" />
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-bold ${
                          callGoalMet ? 'text-green-400' :
                          dayPhoneCall?.actual_calls > 0 ? 'text-yellow-400' :
                          'text-slate-400'
                        }`}>
                          {dayPhoneCall?.actual_calls || 0} / {dayPhoneCall?.target_calls || 0}
                        </span>
                        {callGoalMet && (
                          <Badge className="text-xs px-1 py-0 bg-green-500/20 text-green-300 border-green-500/30">
                            ✓
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Success Indicator */}
                  {bothComplete && (
                    <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-md p-2">
                      <div className="flex items-center justify-center gap-1">
                        <Flame className="h-4 w-4 text-orange-400 animate-pulse" />
                        <span className="text-xs font-bold bg-gradient-to-r from-orange-400 to-yellow-400 text-transparent bg-clip-text">
                          PERFECT DAY!
                        </span>
                      </div>
                    </div>
                  )}
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
            {/* Commitment Streak - Enhanced 3D */}
            <div className="relative group transform transition-all duration-300 hover:scale-105 hover:-translate-y-2">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl blur-2xl opacity-40 group-hover:opacity-60 animate-pulse"></div>

              <Card className="relative bg-gradient-to-br from-orange-600 via-orange-700 to-red-700 border-2 border-orange-400/50 shadow-2xl overflow-hidden">
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10" />

                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 animate-pulse" />
                </div>

                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
                        <Flame className={`relative h-8 w-8 ${commitmentStreak > 0 ? 'text-white drop-shadow-2xl animate-pulse' : 'text-gray-400'}`} />
                      </div>
                      <span className="font-black text-xl drop-shadow-lg">Commitment Streak</span>
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {commitmentStreak >= 60 && (
                        <div className="relative group/badge">
                          {/* 3D Platinum Star */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative flex flex-col items-center gap-1 px-3 py-2">
                              <div className="relative">
                                <Star className="h-12 w-12 text-purple-500 fill-purple-500 drop-shadow-2xl transform rotate-0 transition-transform group-hover/badge:rotate-12" />
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 mix-blend-overlay rounded-full blur-md"></div>
                                <Star className="absolute top-0 left-0 h-12 w-12 text-white/30 fill-white/20" />
                              </div>
                              <span className="text-xs font-black text-white drop-shadow-lg">PLATINUM</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {commitmentStreak >= 30 && commitmentStreak < 60 && (
                        <div className="relative group/badge">
                          {/* 3D Gold Star */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative flex flex-col items-center gap-1 px-3 py-2">
                              <div className="relative">
                                <Star className="h-12 w-12 text-yellow-500 fill-yellow-500 drop-shadow-2xl transform rotate-0 transition-transform group-hover/badge:rotate-12" />
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 mix-blend-overlay rounded-full blur-md"></div>
                                <Star className="absolute top-0 left-0 h-12 w-12 text-white/30 fill-white/20" />
                              </div>
                              <span className="text-xs font-black text-white drop-shadow-lg">GOLD</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {commitmentStreak >= 10 && commitmentStreak < 30 && (
                        <div className="relative group/badge">
                          {/* 3D Silver Star */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-slate-400 blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative flex flex-col items-center gap-1 px-3 py-2">
                              <div className="relative">
                                <Star className="h-12 w-12 text-gray-400 fill-gray-400 drop-shadow-2xl transform rotate-0 transition-transform group-hover/badge:rotate-12" />
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-slate-300 to-gray-500 mix-blend-overlay rounded-full blur-md"></div>
                                <Star className="absolute top-0 left-0 h-12 w-12 text-white/30 fill-white/20" />
                              </div>
                              <span className="text-xs font-black text-white drop-shadow-lg">SILVER</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {commitmentStreak >= 5 && commitmentStreak < 10 && (
                        <div className="relative group/badge">
                          {/* 3D Bronze Star */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative flex flex-col items-center gap-1 px-3 py-2">
                              <div className="relative">
                                <Star className="h-12 w-12 text-amber-600 fill-amber-600 drop-shadow-2xl transform rotate-0 transition-transform group-hover/badge:rotate-12" />
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-700 mix-blend-overlay rounded-full blur-md"></div>
                                <Star className="absolute top-0 left-0 h-12 w-12 text-white/30 fill-white/20" />
                              </div>
                              <span className="text-xs font-black text-white drop-shadow-lg">BRONZE</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl blur-xl opacity-60"></div>
                        <div className="relative flex flex-col items-center bg-gradient-to-b from-white/20 to-black/20 rounded-xl px-6 py-3 backdrop-blur-sm border-2 border-white/30">
                          <span className={`text-4xl font-black ${commitmentStreak > 0 ? 'text-white drop-shadow-2xl' : 'text-gray-400'}`}>
                            {commitmentStreak}
                          </span>
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wider">{commitmentStreak === 1 ? 'Day' : 'Days'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Bottom shadow for depth */}
                <div className="absolute -bottom-2 left-4 right-4 h-4 bg-black/30 rounded-full blur-xl"></div>
              <CardContent className="relative">
                <p className="text-slate-300 font-medium">
                  {commitmentStreak >= 60
                    ? `🔥 LEGENDARY! ${commitmentStreak} days of pure dedication!`
                    : commitmentStreak >= 30
                    ? `⭐ OUTSTANDING! ${commitmentStreak} days of excellence!`
                    : commitmentStreak >= 10
                    ? `💪 IMPRESSIVE! ${commitmentStreak} days of consistency!`
                    : commitmentStreak >= 5
                    ? `🚀 Great start! ${commitmentStreak} days and building momentum!`
                    : commitmentStreak > 0
                    ? `📈 Keep going! Only ${5 - commitmentStreak} more ${(5 - commitmentStreak) === 1 ? 'day' : 'days'} to Bronze!`
                    : '🎯 Start your streak by completing today\'s commitment!'}
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-orange-400">Next Achievement</span>
                    <span className="text-white">
                      {commitmentStreak >= 60
                        ? '🏆 MAX TIER ACHIEVED!'
                        : commitmentStreak >= 30
                        ? `🏆 ${60 - commitmentStreak} days to PLATINUM`
                        : commitmentStreak >= 10
                        ? `🥇 ${30 - commitmentStreak} days to GOLD`
                        : commitmentStreak >= 5
                        ? `🥈 ${10 - commitmentStreak} days to SILVER`
                        : `🥉 ${5 - commitmentStreak} days to BRONZE`}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 shadow-lg relative"
                        style={{
                          width: `${
                            commitmentStreak >= 60 ? 100 :
                            commitmentStreak >= 30 ? ((commitmentStreak - 30) / 30) * 100 :
                            commitmentStreak >= 10 ? ((commitmentStreak - 10) / 20) * 100 :
                            commitmentStreak >= 5 ? ((commitmentStreak - 5) / 5) * 100 :
                            (commitmentStreak / 5) * 100
                          }%`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Phone Call Streak - Enhanced 3D */}
            <div className="relative group transform transition-all duration-300 hover:scale-105 hover:-translate-y-2">
              {/* Glow effect behind card */}
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur-2xl opacity-40 group-hover:opacity-60 animate-pulse"></div>

              <Card className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-700 border-2 border-blue-400/50 shadow-2xl overflow-hidden">
                {/* Glossy overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-white/10" />

                {/* Animated background pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 animate-pulse" />
                </div>

                <CardHeader className="relative z-10">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
                        <Phone className={`relative h-8 w-8 ${phoneCallStreak > 0 ? 'text-white drop-shadow-2xl animate-pulse' : 'text-gray-400'}`} />
                      </div>
                      <span className="font-black text-xl drop-shadow-lg">Phone Call Streak</span>
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      {phoneCallStreak >= 60 && (
                        <div className="relative group/badge">
                          {/* 3D Platinum Star */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative flex flex-col items-center gap-1 px-3 py-2">
                              <div className="relative">
                                <Star className="h-12 w-12 text-purple-500 fill-purple-500 drop-shadow-2xl transform rotate-0 transition-transform group-hover/badge:rotate-12" />
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-400 via-pink-400 to-purple-600 mix-blend-overlay rounded-full blur-md"></div>
                                <Star className="absolute top-0 left-0 h-12 w-12 text-white/30 fill-white/20" />
                              </div>
                              <span className="text-xs font-black text-white drop-shadow-lg">PLATINUM</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {phoneCallStreak >= 30 && phoneCallStreak < 60 && (
                        <div className="relative group/badge">
                          {/* 3D Gold Star */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-amber-500 blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative flex flex-col items-center gap-1 px-3 py-2">
                              <div className="relative">
                                <Star className="h-12 w-12 text-yellow-500 fill-yellow-500 drop-shadow-2xl transform rotate-0 transition-transform group-hover/badge:rotate-12" />
                                <div className="absolute inset-0 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 mix-blend-overlay rounded-full blur-md"></div>
                                <Star className="absolute top-0 left-0 h-12 w-12 text-white/30 fill-white/20" />
                              </div>
                              <span className="text-xs font-black text-white drop-shadow-lg">GOLD</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {phoneCallStreak >= 10 && phoneCallStreak < 30 && (
                        <div className="relative group/badge">
                          {/* 3D Silver Star */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-gray-400 to-slate-400 blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative flex flex-col items-center gap-1 px-3 py-2">
                              <div className="relative">
                                <Star className="h-12 w-12 text-gray-400 fill-gray-400 drop-shadow-2xl transform rotate-0 transition-transform group-hover/badge:rotate-12" />
                                <div className="absolute inset-0 bg-gradient-to-br from-gray-300 via-slate-300 to-gray-500 mix-blend-overlay rounded-full blur-md"></div>
                                <Star className="absolute top-0 left-0 h-12 w-12 text-white/30 fill-white/20" />
                              </div>
                              <span className="text-xs font-black text-white drop-shadow-lg">SILVER</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {phoneCallStreak >= 5 && phoneCallStreak < 10 && (
                        <div className="relative group/badge">
                          {/* 3D Bronze Star */}
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 blur-xl opacity-60 animate-pulse"></div>
                            <div className="relative flex flex-col items-center gap-1 px-3 py-2">
                              <div className="relative">
                                <Star className="h-12 w-12 text-amber-600 fill-amber-600 drop-shadow-2xl transform rotate-0 transition-transform group-hover/badge:rotate-12" />
                                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-700 mix-blend-overlay rounded-full blur-md"></div>
                                <Star className="absolute top-0 left-0 h-12 w-12 text-white/30 fill-white/20" />
                              </div>
                              <span className="text-xs font-black text-white drop-shadow-lg">BRONZE</span>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="relative">
                        <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur-xl opacity-60"></div>
                        <div className="relative flex flex-col items-center bg-gradient-to-b from-white/20 to-black/20 rounded-xl px-6 py-3 backdrop-blur-sm border-2 border-white/30">
                          <span className={`text-4xl font-black ${phoneCallStreak > 0 ? 'text-white drop-shadow-2xl' : 'text-gray-400'}`}>
                            {phoneCallStreak}
                          </span>
                          <span className="text-xs font-bold text-white/90 uppercase tracking-wider">{phoneCallStreak === 1 ? 'Day' : 'Days'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* Bottom shadow for depth */}
                <div className="absolute -bottom-2 left-4 right-4 h-4 bg-black/30 rounded-full blur-xl"></div>
              <CardContent className="relative">
                <p className="text-slate-300 font-medium">
                  {phoneCallStreak >= 60
                    ? `🔥 LEGENDARY OUTREACH! ${phoneCallStreak} days of calls!`
                    : phoneCallStreak >= 30
                    ? `⭐ OUTSTANDING! ${phoneCallStreak} days strong!`
                    : phoneCallStreak >= 10
                    ? `💪 IMPRESSIVE! ${phoneCallStreak} days of consistency!`
                    : phoneCallStreak >= 5
                    ? `🚀 Great momentum! ${phoneCallStreak} days and growing!`
                    : phoneCallStreak > 0
                    ? `📈 Keep going! Only ${5 - phoneCallStreak} more ${(5 - phoneCallStreak) === 1 ? 'day' : 'days'} to Bronze!`
                    : '🎯 Start your streak with consistent daily calls!'}
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm font-semibold mb-2">
                    <span className="text-blue-400">Next Achievement</span>
                    <span className="text-white">
                      {phoneCallStreak >= 60
                        ? '🏆 MAX TIER ACHIEVED!'
                        : phoneCallStreak >= 30
                        ? `🏆 ${60 - phoneCallStreak} days to PLATINUM`
                        : phoneCallStreak >= 10
                        ? `🥇 ${30 - phoneCallStreak} days to GOLD`
                        : phoneCallStreak >= 5
                        ? `🥈 ${10 - phoneCallStreak} days to SILVER`
                        : `🥉 ${5 - phoneCallStreak} days to BRONZE`}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-500 shadow-lg relative"
                        style={{
                          width: `${
                            phoneCallStreak >= 60 ? 100 :
                            phoneCallStreak >= 30 ? ((phoneCallStreak - 30) / 30) * 100 :
                            phoneCallStreak >= 10 ? ((phoneCallStreak - 10) / 20) * 100 :
                            phoneCallStreak >= 5 ? ((phoneCallStreak - 5) / 5) * 100 :
                            (phoneCallStreak / 5) * 100
                          }%`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 animate-pulse" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                    {(() => {
                      const totalCalls = weeklyPhoneCalls.reduce((sum, call) =>
                        sum + (call.actual_calls || 0), 0
                      )
                      return totalCalls
                    })()}
                  </p>
                  <p className="text-sm text-slate-400">Phone Calls Made</p>
                </div>
                <div className="text-center p-4 bg-slate-700/30 rounded-lg">
                  <p className="text-2xl font-bold text-white">
                    {recentCommitments.length > 0
                      ? Math.round((recentCommitments.filter(c => c.status === 'completed').length / recentCommitments.length) * 100)
                      : 0}%
                  </p>
                  <p className="text-sm text-slate-400">Commitment Rate</p>
                </div>
              </div>

              {/* Phone Call Week Summary */}
              {weeklyPhoneCalls.length > 0 && (
                <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-blue-400" />
                      <span className="text-sm font-medium text-white">Phone Call Summary</span>
                    </div>
                    <span className="text-xs text-slate-400">This Week</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-blue-400">
                        {weeklyPhoneCalls.reduce((sum, call) =>
                          sum + (call.target_calls || 0), 0
                        )}
                      </p>
                      <p className="text-xs text-slate-400">Target</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-400">
                        {weeklyPhoneCalls.reduce((sum, call) =>
                          sum + (call.actual_calls || 0), 0
                        )}
                      </p>
                      <p className="text-xs text-slate-400">Actual</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">
                        {(() => {
                          const totalTarget = weeklyPhoneCalls.reduce((sum, call) =>
                            sum + (call.target_calls || 0), 0
                          )
                          const totalActual = weeklyPhoneCalls.reduce((sum, call) =>
                            sum + (call.actual_calls || 0), 0
                          )
                          return totalTarget > 0
                            ? Math.round((totalActual / totalTarget) * 100) + '%'
                            : '0%'
                        })()}
                      </p>
                      <p className="text-xs text-slate-400">Completion</p>
                    </div>
                  </div>
                </div>
              )}
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
          <PhoneCallTracking user={user} onDataChange={loadUserData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default DashboardAPI
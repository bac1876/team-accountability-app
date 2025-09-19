import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Phone, Target, CheckCircle, TrendingUp, Calendar, ChevronLeft, ChevronRight, Plus, Save } from 'lucide-react'
import { phoneCallStore } from '../utils/dataStore.js'
import { phoneCallsAPI } from '../lib/api-client.js'

const PhoneCallTracking = ({ user }) => {
  const [targetCalls, setTargetCalls] = useState('')
  const [actualCalls, setActualCalls] = useState('')
  const [notes, setNotes] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyStats, setDailyStats] = useState(null)
  const [weeklyStats, setWeeklyStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [hasSetGoal, setHasSetGoal] = useState(false)
  const [hasLoggedCalls, setHasLoggedCalls] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  // Helper functions for weekday logic
  const isWeekday = (dateStr) => {
    const date = new Date(dateStr)
    const day = date.getDay()
    return day >= 1 && day <= 5 // Monday = 1, Friday = 5
  }

  useEffect(() => {
    loadStats()
  }, [selectedDate, user.id])

  const loadStats = async () => {
    try {
      // Get stats from database
      const weeklyData = await phoneCallsAPI.getWeeklyStats(user.id)

      // Find today's data
      const dailyData = weeklyData?.days?.find(d => d.date === selectedDate)

      if (dailyData) {
        setDailyStats({
          targetCalls: dailyData.target_calls,
          actualCalls: dailyData.actual_calls,
          notes: dailyData.notes || '',
          completionRate: dailyData.completion_rate
        })
        setHasSetGoal(dailyData.target_calls > 0)
        setHasLoggedCalls(dailyData.actual_calls > 0)
      } else {
        setDailyStats(null)
        setHasSetGoal(false)
        setHasLoggedCalls(false)
      }

      // Transform weekly data to expected format
      if (weeklyData) {
        setWeeklyStats({
          days: weeklyData.days.map(d => ({
            date: d.date,
            targetCalls: d.target_calls,
            actualCalls: d.actual_calls,
            completionRate: d.completion_rate,
            notes: d.notes
          })),
          totalTarget: weeklyData.week.total_target,
          totalActual: weeklyData.week.total_actual,
          weeklyCompletionRate: weeklyData.week.completion_rate
        })
      }
    } catch (error) {
      console.error('Error loading phone call stats:', error)
      // Fallback to localStorage if API fails
      const daily = phoneCallStore.getDailyStats(user.id, selectedDate)
      const weekly = phoneCallStore.getWeeklyStats(user.id)
      setDailyStats(daily)
      setWeeklyStats(weekly)
      setHasSetGoal(daily && daily.targetCalls > 0)
      setHasLoggedCalls(daily && daily.actualCalls > 0)
    }

    // Clear input fields
    setTargetCalls('')
    setActualCalls('')
    setNotes('')
  }

  const handleSetGoal = async () => {
    if (!targetCalls || targetCalls < 0) return

    setLoading(true)
    try {
      // Save to database
      await phoneCallsAPI.setGoal(
        user.id,
        selectedDate,
        parseInt(targetCalls)
      )

      // Also save to localStorage for offline support
      phoneCallStore.addCommitment(
        user.id,
        selectedDate,
        parseInt(targetCalls),
        ''
      )

      setTargetCalls('')
      setHasSetGoal(true)
      loadStats()

      // Show success
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      successDiv.textContent = `Goal set: ${targetCalls} calls for ${formatDate(selectedDate)}`
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)
    } catch (error) {
      console.error('Error setting goal:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogCalls = async () => {
    if (!actualCalls || actualCalls < 0) return

    setLoading(true)
    try {
      // Save to database
      await phoneCallsAPI.logCalls(
        user.id,
        selectedDate,
        parseInt(actualCalls),
        notes
      )

      // Also save to localStorage for offline support
      phoneCallStore.logActualCalls(
        user.id,
        selectedDate,
        parseInt(actualCalls),
        notes
      )

      setActualCalls('')
      setNotes('')
      setHasLoggedCalls(true)
      loadStats()

      // Show success
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      successDiv.textContent = `Logged ${actualCalls} calls`
      document.body.appendChild(successDiv)
      setTimeout(() => successDiv.remove(), 3000)
    } catch (error) {
      console.error('Error logging calls:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeDate = (days) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)

    if (dateStr === today) return 'Today'

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday'

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getProgressColor = (rate) => {
    if (rate >= 100) return 'text-green-600'
    if (rate >= 80) return 'text-blue-600'
    if (rate >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProgressBg = (rate) => {
    if (rate >= 100) return 'bg-green-100'
    if (rate >= 80) return 'bg-blue-100'
    if (rate >= 50) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Phone Call Tracker</h2>
        <p className="text-gray-600">Set goals and track your daily phone calls</p>
      </div>

      {/* Date Navigation */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{formatDate(selectedDate)}</div>
                <div className="text-blue-100 text-sm">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                {!isWeekday(selectedDate) && (
                  <Badge className="mt-2 bg-yellow-500 text-white">Weekend</Badge>
                )}
              </div>

              <button
                onClick={() => changeDate(1)}
                className="p-2 hover:bg-white/20 rounded-full transition"
                disabled={selectedDate >= today}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Navigation */}
            <div className="flex justify-center gap-2 mt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedDate(today)}
                className={selectedDate === today ? 'bg-white text-blue-600' : 'bg-white/20 text-white hover:bg-white/30'}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  setSelectedDate(yesterday.toISOString().split('T')[0])
                }}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                Yesterday
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const date = new Date()
                  const day = date.getDay()
                  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
                  date.setDate(diff)
                  setSelectedDate(date.toISOString().split('T')[0])
                }}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                This Week
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Set Goal Card */}
        <Card className={hasSetGoal ? 'opacity-75' : ''}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Set Goal
            </CardTitle>
            <CardDescription>
              How many calls will you make {isToday ? 'today' : `on ${formatDate(selectedDate)}`}?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasSetGoal && dailyStats ? (
              <div className="text-center py-8 space-y-2">
                <div className="text-4xl font-bold text-blue-600">{dailyStats.targetCalls}</div>
                <div className="text-gray-600">calls goal set</div>
                <Badge className="bg-green-100 text-green-700">Goal Set ✓</Badge>
              </div>
            ) : (
              <>
                <div>
                  <Label>Number of Calls</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      min="0"
                      value={targetCalls}
                      onChange={(e) => setTargetCalls(e.target.value)}
                      placeholder="10"
                      className="text-lg font-semibold"
                    />
                    <Button
                      onClick={handleSetGoal}
                      disabled={loading || !targetCalls}
                      className="px-8"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Set Goal
                    </Button>
                  </div>
                </div>

                {/* Quick Select Buttons */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600 w-full">Quick select:</span>
                  {[25, 50, 75, 100].map(num => (
                    <Button
                      key={num}
                      size="sm"
                      variant="outline"
                      onClick={() => setTargetCalls(num.toString())}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Log Calls Card */}
        <Card className={!hasSetGoal ? 'opacity-50' : ''}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" />
              Log Actual Calls
            </CardTitle>
            <CardDescription>
              How many calls did you actually make?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasSetGoal ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Set a goal first</p>
              </div>
            ) : hasLoggedCalls && dailyStats ? (
              <div className="text-center py-8 space-y-2">
                <div className="text-4xl font-bold text-green-600">{dailyStats.actualCalls}</div>
                <div className="text-gray-600">calls completed</div>
                <Badge className="bg-green-100 text-green-700">Logged ✓</Badge>
              </div>
            ) : (
              <>
                <div>
                  <Label>Calls Made</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="number"
                      min="0"
                      value={actualCalls}
                      onChange={(e) => setActualCalls(e.target.value)}
                      placeholder="8"
                      className="text-lg font-semibold"
                    />
                    <Button
                      onClick={handleLogCalls}
                      disabled={loading || !actualCalls || !hasSetGoal}
                      className="px-8 bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Log Calls
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="2 appointments set, 3 voicemails..."
                    rows={2}
                    className="mt-2"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress */}
      {dailyStats && (dailyStats.targetCalls > 0 || dailyStats.actualCalls > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Daily Progress</span>
              <Badge
                className={`${getProgressBg(dailyStats.completionRate)} ${getProgressColor(dailyStats.completionRate)} border-0`}
              >
                {dailyStats.completionRate}% Complete
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress</span>
                  <span className="font-semibold">
                    {dailyStats.actualCalls} / {dailyStats.targetCalls} calls
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      dailyStats.completionRate >= 100 ? 'bg-green-500' :
                      dailyStats.completionRate >= 80 ? 'bg-blue-500' :
                      dailyStats.completionRate >= 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(dailyStats.completionRate, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{dailyStats.targetCalls}</div>
                  <div className="text-xs text-gray-600">Goal</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{dailyStats.actualCalls}</div>
                  <div className="text-xs text-gray-600">Actual</div>
                </div>
                <div className={`p-3 rounded-lg ${getProgressBg(dailyStats.completionRate)}`}>
                  <div className={`text-2xl font-bold ${getProgressColor(dailyStats.completionRate)}`}>
                    {dailyStats.completionRate}%
                  </div>
                  <div className="text-xs text-gray-600">Rate</div>
                </div>
              </div>

              {dailyStats.notes && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-700">{dailyStats.notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Summary */}
      {weeklyStats && weeklyStats.days.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              This Week's Performance
            </CardTitle>
            <CardDescription>
              Monday to Friday summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Weekly Stats */}
              <div className="grid grid-cols-3 gap-4 text-center mb-4">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{weeklyStats.totalTarget}</div>
                  <div className="text-xs text-gray-600">Weekly Goal</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">{weeklyStats.totalActual}</div>
                  <div className="text-xs text-gray-600">Calls Made</div>
                </div>
                <div>
                  <div className={`text-2xl font-bold ${getProgressColor(weeklyStats.weeklyCompletionRate)}`}>
                    {weeklyStats.weeklyCompletionRate}%
                  </div>
                  <div className="text-xs text-gray-600">Success Rate</div>
                </div>
              </div>

              {/* Daily Breakdown */}
              <div className="space-y-2">
                {weeklyStats.days.map((day, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      day.date === selectedDate ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
                    }`}
                  >
                    <span className="font-medium">{formatDate(day.date)}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">
                        {day.actualCalls} / {day.targetCalls}
                      </span>
                      <Badge
                        className={`${getProgressBg(day.completionRate)} ${getProgressColor(day.completionRate)} border-0`}
                      >
                        {day.completionRate}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PhoneCallTracking
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Phone, Target, CheckCircle, TrendingUp, Calendar } from 'lucide-react'
import { phoneCallStore } from '../utils/dataStore.js'

const PhoneCallTracking = ({ user }) => {
  const [commitmentData, setCommitmentData] = useState({
    targetCalls: '',
    description: ''
  })
  const [actualData, setActualData] = useState({
    actualCalls: '',
    notes: ''
  })
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [dailyStats, setDailyStats] = useState(null)
  const [weeklyStats, setWeeklyStats] = useState(null)
  const [monthlyStats, setMonthlyStats] = useState(null)
  const [loading, setLoading] = useState(false)

  // Helper functions for weekday logic
  const isWeekday = (dateStr) => {
    const date = new Date(dateStr)
    const day = date.getDay()
    return day >= 1 && day <= 5 // Monday = 1, Friday = 5
  }

  useEffect(() => {
    // Load stats whenever date changes
    loadStats()
  }, [selectedDate, user.id])

  useEffect(() => {
    // Initialize with today's date
    const today = new Date().toISOString().split('T')[0]
    setSelectedDate(today)
  }, [])

  const loadStats = () => {
    const daily = phoneCallStore.getDailyStats(user.id, selectedDate)
    const weekly = phoneCallStore.getWeeklyStats(user.id)
    const monthly = phoneCallStore.getMonthlyStats(user.id)
    
    setDailyStats(daily)
    setWeeklyStats(weekly)
    setMonthlyStats(monthly)
    
    // Pre-fill forms with existing data
    setCommitmentData({
      targetCalls: daily.targetCalls || '',
      description: daily.description || ''
    })
    setActualData({
      actualCalls: daily.actualCalls || '',
      notes: daily.notes || ''
    })
  }

  const handleCommitmentSubmit = async (e) => {
    e.preventDefault()
    if (!commitmentData.targetCalls || commitmentData.targetCalls < 0) return

    setLoading(true)
    try {
      await phoneCallStore.addCommitment(
        user.id,
        selectedDate,
        parseInt(commitmentData.targetCalls),
        commitmentData.description
      )
      loadStats()
    } catch (error) {
      console.error('Error saving commitment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleActualSubmit = async (e) => {
    e.preventDefault()
    if (!actualData.actualCalls || actualData.actualCalls < 0) return

    setLoading(true)
    try {
      await phoneCallStore.logActualCalls(
        user.id,
        selectedDate,
        parseInt(actualData.actualCalls),
        actualData.notes
      )
      loadStats()
    } catch (error) {
      console.error('Error logging calls:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompletionColor = (rate) => {
    if (rate >= 100) return 'bg-green-500'
    if (rate >= 80) return 'bg-blue-500'
    if (rate >= 60) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Phone className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Phone Call Tracking</h2>
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Date for Phone Call Tracking
          </CardTitle>
          <CardDescription>
            Choose a date to set goals or log your phone calls (weekdays recommended for business calls)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-picker">Date</Label>
              <Input
                id="date-picker"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  const newDate = e.target.value
                  if (isWeekday(newDate)) {
                    setSelectedDate(newDate)
                  } else {
                    // Show warning but allow selection
                    setSelectedDate(newDate)
                  }
                }}
                className="w-fit"
              />
            </div>
            <div className="space-y-2">
              <Label>Quick Select</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const yesterday = new Date()
                    yesterday.setDate(yesterday.getDate() - 1)
                    setSelectedDate(yesterday.toISOString().split('T')[0])
                  }}
                >
                  Yesterday
                </Button>
              </div>
            </div>
          </div>
          {!isWeekday(selectedDate) && (
            <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
              <strong>📅 Weekend Selected</strong>
              <p className="mt-1">You've selected {formatDate(selectedDate)} which is a weekend. Business calls are typically made on weekdays, but you can still track personal or weekend calls if needed.</p>
            </div>
          )}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium">Selected Date:</p>
              <p className="text-lg font-bold text-blue-700">{formatDate(selectedDate)}</p>
            </div>
            <Badge variant={isWeekday(selectedDate) ? "default" : "secondary"}>
              {isWeekday(selectedDate) ? 'Weekday' : 'Weekend'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="commitment">Set Goal</TabsTrigger>
          <TabsTrigger value="actual">Log Calls</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Daily Overview */}
        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Overview - {formatDate(selectedDate)}</CardTitle>
              <CardDescription>Your phone call performance for the selected date</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{dailyStats.targetCalls}</div>
                    <div className="text-sm text-gray-600">Target Calls</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{dailyStats.actualCalls}</div>
                    <div className="text-sm text-gray-600">Actual Calls</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">{dailyStats.completionRate}%</div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                </div>
              )}
              
              {dailyStats?.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Goal Description:</Label>
                  <p className="text-sm text-gray-700 mt-1">{dailyStats.description}</p>
                </div>
              )}
              
              {dailyStats?.notes && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <Label className="text-sm font-medium">Notes:</Label>
                  <p className="text-sm text-gray-700 mt-1">{dailyStats.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Set Commitment */}
        <TabsContent value="commitment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Set Call Goal for {formatDate(selectedDate)}
              </CardTitle>
              <CardDescription>Commit to the number of calls you plan to make</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCommitmentSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="targetCalls">Target Number of Calls</Label>
                  <Input
                    id="targetCalls"
                    type="number"
                    min="0"
                    value={commitmentData.targetCalls}
                    onChange={(e) => setCommitmentData(prev => ({
                      ...prev,
                      targetCalls: e.target.value
                    }))}
                    placeholder="e.g., 10"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={commitmentData.description}
                    onChange={(e) => setCommitmentData(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder="e.g., Follow up with prospects, cold calls to new leads..."
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Set Call Goal'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Log Actual Calls */}
        <TabsContent value="actual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Log Actual Calls for {formatDate(selectedDate)}
              </CardTitle>
              <CardDescription>Record the number of calls you actually made</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleActualSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="actualCalls">Number of Calls Made</Label>
                  <Input
                    id="actualCalls"
                    type="number"
                    min="0"
                    value={actualData.actualCalls}
                    onChange={(e) => setActualData(prev => ({
                      ...prev,
                      actualCalls: e.target.value
                    }))}
                    placeholder="e.g., 8"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    value={actualData.notes}
                    onChange={(e) => setActualData(prev => ({
                      ...prev,
                      notes: e.target.value
                    }))}
                    placeholder="e.g., 3 appointments set, 2 voicemails, 3 no answers..."
                    rows={3}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Log Calls'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          {/* Weekly Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Performance (Weekdays Only)
              </CardTitle>
              <CardDescription>Current business week call tracking summary (Monday - Friday)</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyStats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{weeklyStats.totalTarget}</div>
                      <div className="text-sm text-gray-600">Total Target</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{weeklyStats.totalActual}</div>
                      <div className="text-sm text-gray-600">Total Actual</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">{weeklyStats.weeklyCompletionRate}%</div>
                      <div className="text-sm text-gray-600">Completion Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Daily Breakdown:</Label>
                    {weeklyStats.days.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">{formatDate(day.date)}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{day.actualCalls}/{day.targetCalls}</span>
                          <Badge 
                            variant="secondary" 
                            className={`text-white ${getCompletionColor(day.completionRate)}`}
                          >
                            {day.completionRate}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance (Weekdays Only)</CardTitle>
              <CardDescription>Current month call tracking summary - business days only</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyStats && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Target:</span>
                        <span className="font-medium">{monthlyStats.totalTarget}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Actual:</span>
                        <span className="font-medium">{monthlyStats.totalActual}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completion Rate:</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-white ${getCompletionColor(monthlyStats.monthlyCompletionRate)}`}
                        >
                          {monthlyStats.monthlyCompletionRate}%
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Weekdays with Goals:</span>
                        <span className="font-medium">{monthlyStats.daysWithCommitments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Weekdays with Logs:</span>
                        <span className="font-medium">{monthlyStats.daysWithActuals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Weekdays:</span>
                        <span className="font-medium">{monthlyStats.weekdaysInMonth}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    📅 Only business days (Monday-Friday) are tracked. Weekends are excluded from all statistics.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default PhoneCallTracking

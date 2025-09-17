import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Focus, Target, CheckCircle, TrendingUp, Calendar, Star, Zap, AlertCircle } from 'lucide-react'
import { dailyFocusStore } from '../utils/dataStore.js'

const DailyFocus = ({ user }) => {
  // Initialize with a weekday
  const getInitialDate = () => {
    const today = new Date().toISOString().split('T')[0]
    const day = new Date(today).getDay()
    if (day === 0) { // Sunday
      const nextDay = new Date(today)
      nextDay.setDate(nextDay.getDate() + 1)
      return nextDay.toISOString().split('T')[0]
    } else if (day === 6) { // Saturday
      const nextDay = new Date(today)
      nextDay.setDate(nextDay.getDate() + 2)
      return nextDay.toISOString().split('T')[0]
    }
    return today
  }
  
  const [focusData, setFocusData] = useState({
    focusText: '',
    priority: 'high'
  })
  const [selectedDate, setSelectedDate] = useState(getInitialDate())
  const [dailyFocus, setDailyFocus] = useState(null)
  const [weeklyFocus, setWeeklyFocus] = useState(null)
  const [monthlyFocus, setMonthlyFocus] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('today')

  // Helper functions for weekday logic
  const isWeekday = (dateStr) => {
    const date = new Date(dateStr)
    const day = date.getDay()
    return day >= 1 && day <= 5 // Monday = 1, Friday = 5
  }

  const getNextWeekday = (dateStr) => {
    const date = new Date(dateStr)
    const day = date.getDay()
    
    if (day === 0) { // Sunday
      date.setDate(date.getDate() + 1) // Move to Monday
    } else if (day === 6) { // Saturday
      date.setDate(date.getDate() + 2) // Move to Monday
    }
    
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    // Load focus data when selectedDate or user changes
    if (isWeekday(selectedDate)) {
      const daily = dailyFocusStore.getDailyFocus(user.id, selectedDate)
      const weekly = dailyFocusStore.getWeeklyFocus(user.id)
      const monthly = dailyFocusStore.getMonthlyFocus(user.id)
      
      setDailyFocus(daily)
      setWeeklyFocus(weekly)
      setMonthlyFocus(monthly)
      
      // Pre-fill form with existing data
      if (daily) {
        setFocusData({
          focusText: daily.focusText || '',
          priority: daily.priority || 'high'
        })
      } else {
        setFocusData({
          focusText: '',
          priority: 'high'
        })
      }
    }
  }, [selectedDate, user.id])

  const handleFocusSubmit = async (e) => {
    e.preventDefault()
    if (!focusData.focusText.trim()) return

    setLoading(true)
    try {
      await dailyFocusStore.setDailyFocus(
        user.id,
        selectedDate,
        focusData.focusText.trim(),
        focusData.priority
      )
      // Reload focus data
      const daily = dailyFocusStore.getDailyFocus(user.id, selectedDate)
      const weekly = dailyFocusStore.getWeeklyFocus(user.id)
      const monthly = dailyFocusStore.getMonthlyFocus(user.id)
      setDailyFocus(daily)
      setWeeklyFocus(weekly)
      setMonthlyFocus(monthly)
    } catch (error) {
      console.error('Error saving focus:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleCompleted = async () => {
    if (!dailyFocus) return

    setLoading(true)
    try {
      await dailyFocusStore.markCompleted(
        user.id,
        selectedDate,
        !dailyFocus.completed
      )
      // Reload focus data
      const daily = dailyFocusStore.getDailyFocus(user.id, selectedDate)
      const weekly = dailyFocusStore.getWeeklyFocus(user.id)
      const monthly = dailyFocusStore.getMonthlyFocus(user.id)
      setDailyFocus(daily)
      setWeeklyFocus(weekly)
      setMonthlyFocus(monthly)
    } catch (error) {
      console.error('Error updating completion:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'medium': return <Star className="h-4 w-4 text-yellow-500" />
      case 'low': return <Zap className="h-4 w-4 text-blue-500" />
      default: return <Star className="h-4 w-4 text-yellow-500" />
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-yellow-500'
    }
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
        <Focus className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Daily Focus</h2>
      </div>

      {/* Date Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Weekday (Business Days Only)
          </CardTitle>
          <CardDescription>
            Set your daily focus for weekdays only (Monday - Friday)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const newDate = e.target.value
              if (isWeekday(newDate)) {
                setSelectedDate(newDate)
              } else {
                setSelectedDate(getNextWeekday(newDate))
              }
            }}
            className="w-fit"
          />
          {!isWeekday(selectedDate) && (
            <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded-md">
              ⚠️ Weekend selected. Focus tracking is for business days only. Automatically adjusting to next weekday.
            </div>
          )}
          <div className="text-xs text-gray-500">
            Selected: {formatDate(selectedDate)} 
            {isWeekday(selectedDate) ? ' ✅' : ' (Weekend - will adjust)'}
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="set">Set Focus</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
        </TabsList>

        {/* Today's Focus */}
        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Focus - {formatDate(selectedDate)}</CardTitle>
              <CardDescription>Your main focus for the selected date</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyFocus ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                    {getPriorityIcon(dailyFocus.priority)}
                    <div className="flex-1">
                      <div className="font-medium text-lg">{dailyFocus.focusText}</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Priority: <Badge variant="secondary" className={`text-white ${getPriorityColor(dailyFocus.priority)}`}>
                          {dailyFocus.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {dailyFocus.completed ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <div className="h-6 w-6 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Status: {dailyFocus.completed ? (
                        <Badge className="bg-green-500 text-white">Completed ✓</Badge>
                      ) : (
                        <Badge variant="outline">In Progress</Badge>
                      )}
                    </div>
                    <Button 
                      onClick={handleToggleCompleted}
                      disabled={loading}
                      variant={dailyFocus.completed ? "outline" : "default"}
                    >
                      {loading ? 'Updating...' : (dailyFocus.completed ? 'Mark Incomplete' : 'Mark Complete')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Focus className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No focus set for this date</p>
                  <p className="text-sm">Use the "Set Focus" tab to add your daily focus</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Set Focus */}
        <TabsContent value="set" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Set Focus for {formatDate(selectedDate)}
              </CardTitle>
              <CardDescription>Define your main focus and priority for the day</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFocusSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="focusText">Daily Focus</Label>
                  <Textarea
                    id="focusText"
                    value={focusData.focusText}
                    onChange={(e) => setFocusData(prev => ({
                      ...prev,
                      focusText: e.target.value
                    }))}
                    placeholder="e.g., Complete the Johnson proposal and follow up with 3 key prospects"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority Level</Label>
                  <Select 
                    value={focusData.priority} 
                    onValueChange={(value) => setFocusData(prev => ({
                      ...prev,
                      priority: value
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">🔴 High Priority</SelectItem>
                      <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                      <SelectItem value="low">🔵 Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Saving...' : 'Set Daily Focus'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Focus */}
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Weekly Focus Overview
              </CardTitle>
              <CardDescription>Current business week focus summary (Monday - Friday)</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyFocus && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{weeklyFocus.totalWithFocus}</div>
                      <div className="text-sm text-gray-600">Days with Focus</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{weeklyFocus.completedCount}</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <div className="text-xl font-bold text-purple-600">{weeklyFocus.completionRate}%</div>
                      <div className="text-sm text-gray-600">Completion Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Daily Breakdown:</Label>
                    {weeklyFocus.days.map((day, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium">{formatDate(day.date)}</span>
                          {day.focus.focusText && getPriorityIcon(day.focus.priority)}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm max-w-xs truncate">
                            {day.focus.focusText || 'No focus set'}
                          </span>
                          {day.focus.focusText && (
                            <Badge 
                              variant="secondary" 
                              className={`text-white ${day.focus.completed ? 'bg-green-500' : 'bg-gray-400'}`}
                            >
                              {day.focus.completed ? '✓' : '○'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monthly Focus */}
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Focus Performance</CardTitle>
              <CardDescription>Current month focus tracking summary - business days only</CardDescription>
            </CardHeader>
            <CardContent>
              {monthlyFocus && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Focus Items:</span>
                        <span className="font-medium">{monthlyFocus.totalFocusItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completed:</span>
                        <span className="font-medium">{monthlyFocus.completedFocusItems}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Completion Rate:</span>
                        <Badge 
                          variant="secondary" 
                          className={`text-white ${monthlyFocus.monthlyCompletionRate >= 80 ? 'bg-green-500' : monthlyFocus.monthlyCompletionRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        >
                          {monthlyFocus.monthlyCompletionRate}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
                    🎯 Only business days (Monday-Friday) are tracked. Weekends are excluded from all statistics.
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

export default DailyFocus

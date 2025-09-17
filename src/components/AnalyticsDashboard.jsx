import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Calendar, TrendingUp, TrendingDown, Target, Phone, CheckCircle2, XCircle, FileDown, Users } from 'lucide-react'
import { userDataStore, phoneCallStore, adminStore } from '../utils/dataStore.js'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, eachWeekOfInterval, eachMonthOfInterval, isWithinInterval } from 'date-fns'

const AnalyticsDashboard = ({ user }) => {
  const [selectedUser, setSelectedUser] = useState(user.id)
  const [timeRange, setTimeRange] = useState('6months') // 6months, 3months, 1month
  const [viewMode, setViewMode] = useState('total') // total, weekly, monthly
  const [analyticsData, setAnalyticsData] = useState(null)
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load all users if admin
    if (user.role === 'admin') {
      const users = adminStore.getAllUsersComplete()
      setAllUsers(users)
    }
    loadAnalytics()
  }, [selectedUser, timeRange, viewMode])

  const loadAnalytics = () => {
    setLoading(true)
    
    // Calculate date range
    const endDate = new Date()
    let startDate = new Date()
    
    switch(timeRange) {
      case '1month':
        startDate = subMonths(endDate, 1)
        break
      case '3months':
        startDate = subMonths(endDate, 3)
        break
      case '6months':
      default:
        startDate = subMonths(endDate, 6)
        break
    }

    // Get user data
    const userData = userDataStore.getUserData(selectedUser)
    const phoneCallData = phoneCallStore.getUserCalls(selectedUser)
    
    // Process commitments
    const commitments = userData.commitments || []
    const commitmentsInRange = commitments.filter(c => {
      const date = new Date(c.date)
      return isWithinInterval(date, { start: startDate, end: endDate })
    })
    
    // Process goals
    const goals = userData.goals || []
    const goalsInRange = goals.filter(g => {
      const date = new Date(g.createdAt)
      return isWithinInterval(date, { start: startDate, end: endDate })
    })
    
    // Process phone calls
    const callsInRange = phoneCallData.filter(call => {
      const date = new Date(call.date)
      return isWithinInterval(date, { start: startDate, end: endDate })
    })

    // Calculate metrics based on view mode
    let processedData = {}
    
    if (viewMode === 'total') {
      processedData = calculateTotalMetrics(commitmentsInRange, goalsInRange, callsInRange)
    } else if (viewMode === 'weekly') {
      processedData = calculateWeeklyMetrics(commitmentsInRange, goalsInRange, callsInRange, startDate, endDate)
    } else if (viewMode === 'monthly') {
      processedData = calculateMonthlyMetrics(commitmentsInRange, goalsInRange, callsInRange, startDate, endDate)
    }
    
    setAnalyticsData({
      ...processedData,
      startDate,
      endDate,
      rawData: {
        commitments: commitmentsInRange,
        goals: goalsInRange,
        calls: callsInRange
      }
    })
    
    setLoading(false)
  }

  const calculateTotalMetrics = (commitments, goals, calls) => {
    const totalCommitments = commitments.length
    const completedCommitments = commitments.filter(c => c.status === 'completed').length
    const failedCommitments = totalCommitments - completedCommitments
    
    const totalGoals = goals.length
    const completedGoals = goals.filter(g => g.progress >= 100).length
    const inProgressGoals = goals.filter(g => g.progress > 0 && g.progress < 100).length
    
    const commitmentCalls = calls.filter(c => c.type === 'commitment')
    const actualCalls = calls.filter(c => c.type === 'actual')
    
    const totalTargetCalls = commitmentCalls.reduce((sum, c) => sum + (c.targetCalls || 0), 0)
    const totalActualCalls = actualCalls.reduce((sum, c) => sum + (c.actualCalls || 0), 0)
    
    return {
      commitments: {
        total: totalCommitments,
        completed: completedCommitments,
        failed: failedCommitments,
        successRate: totalCommitments > 0 ? Math.round((completedCommitments / totalCommitments) * 100) : 0
      },
      goals: {
        total: totalGoals,
        completed: completedGoals,
        inProgress: inProgressGoals,
        completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0
      },
      phoneCalls: {
        targetTotal: totalTargetCalls,
        actualTotal: totalActualCalls,
        completionRate: totalTargetCalls > 0 ? Math.round((totalActualCalls / totalTargetCalls) * 100) : 0,
        difference: totalActualCalls - totalTargetCalls
      }
    }
  }

  const calculateWeeklyMetrics = (commitments, goals, calls, startDate, endDate) => {
    const weeks = eachWeekOfInterval({ start: startDate, end: endDate })
    
    const weeklyData = weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart)
      
      // Filter data for this week
      const weekCommitments = commitments.filter(c => {
        const date = new Date(c.date)
        return isWithinInterval(date, { start: weekStart, end: weekEnd })
      })
      
      const weekGoals = goals.filter(g => {
        const date = new Date(g.createdAt)
        return isWithinInterval(date, { start: weekStart, end: weekEnd })
      })
      
      const weekCalls = calls.filter(c => {
        const date = new Date(c.date)
        return isWithinInterval(date, { start: weekStart, end: weekEnd })
      })
      
      return {
        week: format(weekStart, 'MMM dd'),
        metrics: calculateTotalMetrics(weekCommitments, weekGoals, weekCalls)
      }
    })
    
    return {
      periods: weeklyData,
      summary: calculateTotalMetrics(commitments, goals, calls)
    }
  }

  const calculateMonthlyMetrics = (commitments, goals, calls, startDate, endDate) => {
    const months = eachMonthOfInterval({ start: startDate, end: endDate })
    
    const monthlyData = months.map(monthStart => {
      const monthEnd = endOfMonth(monthStart)
      
      // Filter data for this month
      const monthCommitments = commitments.filter(c => {
        const date = new Date(c.date)
        return isWithinInterval(date, { start: monthStart, end: monthEnd })
      })
      
      const monthGoals = goals.filter(g => {
        const date = new Date(g.createdAt)
        return isWithinInterval(date, { start: monthStart, end: monthEnd })
      })
      
      const monthCalls = calls.filter(c => {
        const date = new Date(c.date)
        return isWithinInterval(date, { start: monthStart, end: monthEnd })
      })
      
      return {
        month: format(monthStart, 'MMM yyyy'),
        metrics: calculateTotalMetrics(monthCommitments, monthGoals, monthCalls)
      }
    })
    
    return {
      periods: monthlyData,
      summary: calculateTotalMetrics(commitments, goals, calls)
    }
  }

  const exportData = () => {
    if (!analyticsData) return
    
    const csvContent = generateCSV(analyticsData)
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_${selectedUser}_${timeRange}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const generateCSV = (data) => {
    let csv = 'Analytics Report\n'
    csv += `Date Range: ${format(data.startDate, 'MMM dd, yyyy')} - ${format(data.endDate, 'MMM dd, yyyy')}\n\n`
    
    if (viewMode === 'total') {
      csv += 'Commitments\n'
      csv += `Total,Completed,Failed,Success Rate\n`
      csv += `${data.commitments.total},${data.commitments.completed},${data.commitments.failed},${data.commitments.successRate}%\n\n`
      
      csv += 'Goals\n'
      csv += `Total,Completed,In Progress,Completion Rate\n`
      csv += `${data.goals.total},${data.goals.completed},${data.goals.inProgress},${data.goals.completionRate}%\n\n`
      
      csv += 'Phone Calls\n'
      csv += `Target,Actual,Difference,Completion Rate\n`
      csv += `${data.phoneCalls.targetTotal},${data.phoneCalls.actualTotal},${data.phoneCalls.difference},${data.phoneCalls.completionRate}%\n`
    } else {
      csv += `Period,Commitments (Total/Completed),Goals (Total/Completed),Calls (Target/Actual)\n`
      data.periods.forEach(period => {
        const label = period.week || period.month
        csv += `${label},${period.metrics.commitments.total}/${period.metrics.commitments.completed},`
        csv += `${period.metrics.goals.total}/${period.metrics.goals.completed},`
        csv += `${period.metrics.phoneCalls.targetTotal}/${period.metrics.phoneCalls.actualTotal}\n`
      })
    }
    
    return csv
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading analytics...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Accountability Analytics
          </CardTitle>
          <CardDescription>
            Track performance metrics over time for accountability coaching
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {user.role === 'admin' && (
              <Select value={selectedUser.toString()} onValueChange={(v) => setSelectedUser(parseInt(v))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {allUsers.map(u => (
                    <SelectItem key={u.user.id} value={u.user.id.toString()}>
                      {u.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
              </SelectContent>
            </Select>
            
            <Tabs value={viewMode} onValueChange={setViewMode} className="flex-1">
              <TabsList>
                <TabsTrigger value="total">Total</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button onClick={exportData} variant="outline" size="sm">
              <FileDown className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metrics Display */}
      {analyticsData && (
        <>
          {viewMode === 'total' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Commitments Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Commitments</span>
                    <Target className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    {analyticsData.commitments.successRate}%
                  </div>
                  <Progress value={analyticsData.commitments.successRate} className="h-2" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium">{analyticsData.commitments.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Completed:
                      </span>
                      <span className="font-medium">{analyticsData.commitments.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                        <XCircle className="h-3 w-3" />
                        Failed:
                      </span>
                      <span className="font-medium">{analyticsData.commitments.failed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Goals Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Weekly Goals</span>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    {analyticsData.goals.completionRate}%
                  </div>
                  <Progress value={analyticsData.goals.completionRate} className="h-2" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="font-medium">{analyticsData.goals.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600 dark:text-green-400">Completed:</span>
                      <span className="font-medium">{analyticsData.goals.completed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-yellow-600 dark:text-yellow-400">In Progress:</span>
                      <span className="font-medium">{analyticsData.goals.inProgress}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phone Calls Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Phone Calls</span>
                    <Phone className="h-5 w-5 text-muted-foreground" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold">
                    {analyticsData.phoneCalls.completionRate}%
                  </div>
                  <Progress value={analyticsData.phoneCalls.completionRate} className="h-2" />
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target:</span>
                      <span className="font-medium">{analyticsData.phoneCalls.targetTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Actual:</span>
                      <span className="font-medium">{analyticsData.phoneCalls.actualTotal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={analyticsData.phoneCalls.difference >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        Difference:
                      </span>
                      <span className="font-medium">
                        {analyticsData.phoneCalls.difference >= 0 ? '+' : ''}{analyticsData.phoneCalls.difference}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>
                  {viewMode === 'weekly' ? 'Weekly' : 'Monthly'} Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Success Rate</div>
                      <div className="text-2xl font-bold">
                        {analyticsData.summary.commitments.successRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Goals Completed</div>
                      <div className="text-2xl font-bold">
                        {analyticsData.summary.goals.completed}/{analyticsData.summary.goals.total}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Call Achievement</div>
                      <div className="text-2xl font-bold">
                        {analyticsData.summary.phoneCalls.completionRate}%
                      </div>
                    </div>
                  </div>

                  {/* Period Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Period</th>
                          <th className="text-center py-2">Commitments</th>
                          <th className="text-center py-2">Goals</th>
                          <th className="text-center py-2">Phone Calls</th>
                          <th className="text-center py-2">Overall</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analyticsData.periods.map((period, idx) => {
                          const label = period.week || period.month
                          const m = period.metrics
                          const overallRate = Math.round(
                            (m.commitments.successRate + m.goals.completionRate + m.phoneCalls.completionRate) / 3
                          )
                          
                          return (
                            <tr key={idx} className="border-b">
                              <td className="py-2">{label}</td>
                              <td className="text-center py-2">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm">{m.commitments.completed}/{m.commitments.total}</span>
                                  <span className="text-xs text-muted-foreground">{m.commitments.successRate}%</span>
                                </div>
                              </td>
                              <td className="text-center py-2">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm">{m.goals.completed}/{m.goals.total}</span>
                                  <span className="text-xs text-muted-foreground">{m.goals.completionRate}%</span>
                                </div>
                              </td>
                              <td className="text-center py-2">
                                <div className="flex flex-col items-center">
                                  <span className="text-sm">{m.phoneCalls.actualTotal}/{m.phoneCalls.targetTotal}</span>
                                  <span className="text-xs text-muted-foreground">{m.phoneCalls.completionRate}%</span>
                                </div>
                              </td>
                              <td className="text-center py-2">
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                                  overallRate >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                                  overallRate >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                }`}>
                                  {overallRate >= 80 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                  {overallRate}%
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.commitments.successRate < 50 && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-900 dark:text-red-300">Low Commitment Success Rate</div>
                      <div className="text-sm text-red-700 dark:text-red-400">
                        Consider setting more achievable daily commitments or breaking them into smaller tasks.
                      </div>
                    </div>
                  </div>
                )}
                
                {analyticsData.phoneCalls.completionRate < analyticsData.commitments.successRate && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <Phone className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-900 dark:text-yellow-300">Phone Call Target Gap</div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-400">
                        Phone call achievement is below commitment success rate. Focus on consistent daily calling.
                      </div>
                    </div>
                  </div>
                )}
                
                {analyticsData.commitments.successRate >= 80 && (
                  <div className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-900 dark:text-green-300">Excellent Commitment Rate!</div>
                      <div className="text-sm text-green-700 dark:text-green-400">
                        Maintaining {analyticsData.commitments.successRate}% success rate. Keep up the great work!
                      </div>
                    </div>
                  </div>
                )}
                
                {viewMode !== 'total' && analyticsData.periods.length > 1 && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900 dark:text-blue-300">Trend Analysis</div>
                      <div className="text-sm text-blue-700 dark:text-blue-400">
                        {(() => {
                          const recent = analyticsData.periods[analyticsData.periods.length - 1].metrics
                          const older = analyticsData.periods[0].metrics
                          const trend = recent.commitments.successRate - older.commitments.successRate
                          
                          if (trend > 0) {
                            return `Improving trend! Success rate increased by ${Math.abs(trend)}% over the period.`
                          } else if (trend < 0) {
                            return `Declining trend. Success rate decreased by ${Math.abs(trend)}%. Time to refocus.`
                          } else {
                            return `Consistent performance maintained throughout the period.`
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default AnalyticsDashboard
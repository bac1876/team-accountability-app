import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select } from '@/components/ui/select.jsx'
import { Calendar, TrendingUp, TrendingDown, Users, Target, Phone, MessageSquare, Award, AlertCircle, ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { format, subMonths, addDays, differenceInDays } from 'date-fns'

const CoachingDashboard = ({ user }) => {
  const [selectedUser, setSelectedUser] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 6).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })
  const [users, setUsers] = useState([])
  const [coachingData, setCoachingData] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (selectedUser && dateRange.start && dateRange.end) {
      loadCoachingData()
    }
  }, [selectedUser, dateRange])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/admin/list-users')
      const data = await response.json()
      setUsers(data.filter(u => u.role !== 'admin'))
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadCoachingData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        userId: selectedUser,
        startDate: dateRange.start,
        endDate: dateRange.end
      })

      const response = await fetch(`/api/admin/coaching-data?${params}`)
      const data = await response.json()
      setCoachingData(data)
    } catch (error) {
      console.error('Error loading coaching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTrends = (data) => {
    if (!data || !data.length) return { trend: 'neutral', percentage: 0 }

    const midPoint = Math.floor(data.length / 2)
    const firstHalf = data.slice(0, midPoint)
    const secondHalf = data.slice(midPoint)

    const firstAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length

    const change = ((secondAvg - firstAvg) / firstAvg) * 100

    return {
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(Math.round(change))
    }
  }

  const getStreakTier = (days) => {
    if (days >= 60) return { name: 'PLATINUM', color: 'from-purple-500 to-pink-500' }
    if (days >= 30) return { name: 'GOLD', color: 'from-yellow-500 to-amber-500' }
    if (days >= 10) return { name: 'SILVER', color: 'from-gray-400 to-gray-300' }
    if (days >= 5) return { name: 'BRONZE', color: 'from-amber-700 to-amber-600' }
    return null
  }

  const formatDateRange = () => {
    const start = new Date(dateRange.start)
    const end = new Date(dateRange.end)
    const days = differenceInDays(end, start)

    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')} (${days} days)`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-white">Coaching Dashboard</h2>
          <p className="text-gray-400">Review team performance and identify coaching opportunities</p>
        </div>
        <Badge className="bg-purple-600/20 text-purple-300 border-purple-500/30">
          Admin View
        </Badge>
      </div>

      {/* Controls */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Data Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* User Selector */}
            <div>
              <Label className="text-slate-300 mb-2 block">Select User</Label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full bg-slate-700 text-white border-slate-600 rounded-md p-2"
              >
                <option value="all">All Team Members</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-slate-300 mb-2 block">Start Date</Label>
              <input
                type="date"
                value={dateRange.start}
                max={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full bg-slate-700 text-white border-slate-600 rounded-md p-2"
              />
            </div>

            <div>
              <Label className="text-slate-300 mb-2 block">End Date</Label>
              <input
                type="date"
                value={dateRange.end}
                min={dateRange.start}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full bg-slate-700 text-white border-slate-600 rounded-md p-2"
              />
            </div>
          </div>

          {/* Quick Ranges */}
          <div className="flex gap-2 mt-4">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDateRange({
                start: subMonths(new Date(), 1).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              })}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              Last Month
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDateRange({
                start: subMonths(new Date(), 3).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              })}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              Last 3 Months
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDateRange({
                start: subMonths(new Date(), 6).toISOString().split('T')[0],
                end: new Date().toISOString().split('T')[0]
              })}
              className="bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              Last 6 Months
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Date Range Display */}
      <div className="text-center">
        <Badge className="bg-blue-600/20 text-blue-300 border-blue-500/30 px-4 py-2 text-lg">
          {formatDateRange()}
        </Badge>
      </div>

      {loading ? (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading coaching data...</p>
          </CardContent>
        </Card>
      ) : coachingData ? (
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Commitment Completion */}
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="text-sm">Commitment Rate</span>
                  {coachingData.commitmentTrend?.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-green-400" />
                  ) : coachingData.commitmentTrend?.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4 text-red-400" />
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {coachingData.commitmentRate}%
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {coachingData.totalCommitments} total commitments
                </p>
                {coachingData.commitmentTrend && (
                  <p className={`text-xs mt-2 ${
                    coachingData.commitmentTrend.trend === 'up' ? 'text-green-400' :
                    coachingData.commitmentTrend.trend === 'down' ? 'text-red-400' :
                    'text-slate-400'
                  }`}>
                    {coachingData.commitmentTrend.trend === 'up' ? '↑' :
                     coachingData.commitmentTrend.trend === 'down' ? '↓' : '→'}
                    {coachingData.commitmentTrend.percentage}% vs previous period
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Phone Calls */}
            <Card className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border-blue-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="text-sm">Avg Daily Calls</span>
                  <Phone className="h-4 w-4 text-blue-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {coachingData.avgDailyCalls}
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {coachingData.totalCalls} total calls
                </p>
                <p className="text-xs text-blue-400 mt-2">
                  Peak: {coachingData.peakCallDay} calls/day
                </p>
              </CardContent>
            </Card>

            {/* Goals Progress */}
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="text-sm">Goals Completed</span>
                  <Target className="h-4 w-4 text-purple-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {coachingData.goalsCompleted}
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {coachingData.avgGoalProgress}% avg progress
                </p>
                <p className="text-xs text-purple-400 mt-2">
                  {coachingData.activeGoals} active goals
                </p>
              </CardContent>
            </Card>

            {/* Reflections */}
            <Card className="bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border-indigo-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="text-sm">Reflections</span>
                  <MessageSquare className="h-4 w-4 text-indigo-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {coachingData.reflectionRate}%
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  {coachingData.totalReflections} submitted
                </p>
                <p className="text-xs text-indigo-400 mt-2">
                  {coachingData.reflectionStreak} day streak
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Individual User Cards (if viewing all users) */}
          {selectedUser === 'all' && coachingData.userBreakdown && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Team Member Performance</CardTitle>
                <CardDescription className="text-slate-400">
                  Click on a team member for detailed view
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {coachingData.userBreakdown.map(userData => {
                    const commitStreak = getStreakTier(userData.commitmentStreak)
                    const callStreak = getStreakTier(userData.phoneCallStreak)

                    return (
                      <Card
                        key={userData.userId}
                        className="bg-slate-700/50 border-slate-600/50 hover:bg-slate-700/70 cursor-pointer transition-all"
                        onClick={() => setSelectedUser(userData.userId)}
                      >
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-white text-lg">{userData.name}</CardTitle>
                            <div className="flex gap-2">
                              {commitStreak && (
                                <Badge className={`bg-gradient-to-r ${commitStreak.color} text-white text-xs`}>
                                  {commitStreak.name}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Commitments</p>
                              <p className="text-white font-semibold">{userData.commitmentRate}% complete</p>
                              <p className="text-xs text-slate-500">{userData.commitmentStreak} day streak</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Daily Calls</p>
                              <p className="text-white font-semibold">{userData.avgCalls} avg</p>
                              <p className="text-xs text-slate-500">{userData.phoneCallStreak} day streak</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Goals</p>
                              <p className="text-white font-semibold">{userData.goalsCompleted} done</p>
                              <p className="text-xs text-slate-500">{userData.avgGoalProgress}% avg</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Reflections</p>
                              <p className="text-white font-semibold">{userData.reflectionRate}%</p>
                              <p className="text-xs text-slate-500">{userData.totalReflections} total</p>
                            </div>
                          </div>

                          {/* Coaching Notes */}
                          {userData.coachingNotes && userData.coachingNotes.length > 0 && (
                            <div className="mt-4 p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                              <div className="flex items-center gap-2 mb-1">
                                <AlertCircle className="h-4 w-4 text-amber-400" />
                                <p className="text-amber-400 text-xs font-semibold">Coaching Opportunities</p>
                              </div>
                              {userData.coachingNotes.map((note, idx) => (
                                <p key={idx} className="text-xs text-amber-200">• {note}</p>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detailed Timeline (for individual user) */}
          {selectedUser !== 'all' && coachingData.timeline && (
            <Card className="bg-slate-800/50 border-slate-700/50">
              <CardHeader>
                <CardTitle className="text-white">Performance Timeline</CardTitle>
                <CardDescription className="text-slate-400">
                  Day-by-day breakdown of activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {coachingData.timeline.map((day, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-slate-700/30 rounded-lg">
                      <div className="text-sm text-slate-400 min-w-[100px]">
                        {format(new Date(day.date), 'MMM d, yyyy')}
                      </div>
                      <div className="flex gap-4 flex-1">
                        <Badge className={day.commitmentCompleted ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300'}>
                          Commitment: {day.commitmentCompleted ? '✓' : '✗'}
                        </Badge>
                        <Badge className="bg-blue-600/20 text-blue-300">
                          Calls: {day.callsMade || 0}
                        </Badge>
                        {day.hasReflection && (
                          <Badge className="bg-indigo-600/20 text-indigo-300">
                            Reflection ✓
                          </Badge>
                        )}
                        {day.goalProgress > 0 && (
                          <Badge className="bg-purple-600/20 text-purple-300">
                            Goal: {day.goalProgress}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Coaching Insights */}
          {coachingData.insights && (
            <Card className="bg-gradient-to-br from-amber-500/20 to-orange-600/20 border-amber-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-400" />
                  Coaching Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {coachingData.insights.strengths && coachingData.insights.strengths.length > 0 && (
                    <div>
                      <p className="text-green-400 font-semibold mb-2">Strengths</p>
                      {coachingData.insights.strengths.map((strength, idx) => (
                        <p key={idx} className="text-slate-300 text-sm mb-1">✓ {strength}</p>
                      ))}
                    </div>
                  )}

                  {coachingData.insights.improvements && coachingData.insights.improvements.length > 0 && (
                    <div>
                      <p className="text-amber-400 font-semibold mb-2">Areas for Improvement</p>
                      {coachingData.insights.improvements.map((area, idx) => (
                        <p key={idx} className="text-slate-300 text-sm mb-1">• {area}</p>
                      ))}
                    </div>
                  )}

                  {coachingData.insights.recommendations && coachingData.insights.recommendations.length > 0 && (
                    <div>
                      <p className="text-blue-400 font-semibold mb-2">Recommendations</p>
                      {coachingData.insights.recommendations.map((rec, idx) => (
                        <p key={idx} className="text-slate-300 text-sm mb-1">→ {rec}</p>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="py-12 text-center">
            <Users className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">Select filters to view coaching data</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CoachingDashboard
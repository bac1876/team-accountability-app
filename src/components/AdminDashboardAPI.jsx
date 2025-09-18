import { useState, useEffect } from 'react'
import { useNavigation } from '../context/NavigationContext'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx'
import { Users, Target, TrendingUp, Calendar, CheckCircle, Clock, XCircle, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import UserManagementAPI from './UserManagementAPI.jsx'
import MessagingCenter from './MessagingCenter.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'
import { usersAPI, commitmentsAPI, goalsAPI, reflectionsAPI, analyticsAPI } from '../lib/api-client.js'

const AdminDashboardAPI = ({ user }) => {
  const { activeTab, navigateToTab } = useNavigation()
  const [teamData, setTeamData] = useState([])
  const [teamStats, setTeamStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    overallCompletion: 0,
    weeklyGoalsCompletion: 0
  })
  const [expandedUsers, setExpandedUsers] = useState(new Set())
  const [detailedUserData, setDetailedUserData] = useState({})
  const [loading, setLoading] = useState(true)

  const today = new Date()
  const todayString = today.toISOString().split('T')[0]

  // Load team data from API
  useEffect(() => {
    if (user?.role === 'admin') {
      loadTeamData()
    }
  }, [user?.role])

  const loadTeamData = async () => {
    setLoading(true)
    try {
      // Get all users
      const users = await usersAPI.getAll()

      // Get today's commitments for all users
      const todayCommitments = await commitmentsAPI.getTodayForAll()

      // Get team analytics
      const analytics = await analyticsAPI.getTeamAnalytics()

      // Build team data array
      const teamDataArray = await Promise.all(users.map(async (member) => {
        // Find today's commitment for this user
        const todayCommit = todayCommitments?.find(c => c.user_id === member.id)

        // Get user's goals
        const userGoals = await goalsAPI.getByUser(member.id)
        const weeklyGoals = userGoals?.filter(g => {
          const createdAt = new Date(g.created_at)
          const weekStart = new Date(today)
          weekStart.setDate(today.getDate() - today.getDay())
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          return createdAt >= weekStart && createdAt <= weekEnd
        }) || []

        const completedGoals = weeklyGoals.filter(g => g.progress >= 100).length

        // Get user's reflections
        const userReflections = await reflectionsAPI.getByUser(member.id)
        const lastReflection = userReflections?.[0]

        // Calculate completion rate
        const userCommitments = await commitmentsAPI.getByUser(member.id)
        const recentCommitments = userCommitments?.filter(c => {
          const date = new Date(c.commitment_date)
          const diff = (today - date) / (1000 * 60 * 60 * 24)
          return diff <= 7
        }) || []
        const completedCommitments = recentCommitments.filter(c => c.status === 'completed').length
        const completionRate = recentCommitments.length > 0
          ? Math.round((completedCommitments / recentCommitments.length) * 100)
          : 0

        return {
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role,
          lastLogin: member.last_login || new Date().toISOString(),
          todayCommitment: todayCommit?.commitment_text || null,
          commitmentStatus: todayCommit?.status || 'pending',
          weeklyGoals: weeklyGoals.length,
          completedGoals: completedGoals,
          lastReflection: lastReflection?.reflection_date || new Date().toISOString(),
          completionRate: completionRate
        }
      }))

      setTeamData(teamDataArray)

      // Calculate team stats
      const activeToday = teamDataArray.filter(m => m.todayCommitment).length
      const avgCompletion = teamDataArray.reduce((acc, m) => acc + m.completionRate, 0) / teamDataArray.length
      const totalGoals = teamDataArray.reduce((acc, m) => acc + m.weeklyGoals, 0)
      const totalCompletedGoals = teamDataArray.reduce((acc, m) => acc + m.completedGoals, 0)
      const goalsCompletion = totalGoals > 0 ? Math.round((totalCompletedGoals / totalGoals) * 100) : 0

      setTeamStats({
        totalUsers: teamDataArray.length,
        activeToday: activeToday,
        overallCompletion: Math.round(avgCompletion),
        weeklyGoalsCompletion: goalsCompletion
      })

    } catch (error) {
      console.error('Error loading team data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserDetails = async (userId) => {
    try {
      // Get detailed user data
      const [commitments, goals, reflections] = await Promise.all([
        commitmentsAPI.getByUser(userId),
        goalsAPI.getByUser(userId),
        reflectionsAPI.getByUser(userId)
      ])

      // Format the data
      const formattedCommitments = commitments?.slice(0, 7).map(c => ({
        text: c.commitment_text,
        date: c.commitment_date,
        status: c.status
      })) || []

      const formattedGoals = goals?.map(g => ({
        text: g.goal_text,
        status: g.status,
        createdAt: g.created_at,
        progress: g.progress || 0
      })) || []

      const formattedReflections = reflections?.slice(0, 3).map(r => ({
        text: [r.wins, r.challenges, r.tomorrow_focus].filter(Boolean).join(' | '),
        date: r.reflection_date
      })) || []

      return {
        commitments: formattedCommitments,
        goals: formattedGoals,
        reflections: formattedReflections
      }
    } catch (error) {
      console.error('Error loading user details:', error)
      return { commitments: [], goals: [], reflections: [] }
    }
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />
      case 'pending':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <XCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'default',
      in_progress: 'secondary',
      pending: 'destructive'
    }

    const labels = {
      completed: 'Completed',
      in_progress: 'In Progress',
      pending: 'Pending'
    }

    return (
      <Badge variant={variants[status] || 'outline'}>
        {labels[status] || 'Unknown'}
      </Badge>
    )
  }

  const toggleUserExpansion = async (userId) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
      // Load detailed data when expanding
      if (!detailedUserData[userId]) {
        const userData = await loadUserDetails(userId)
        setDetailedUserData(prev => ({
          ...prev,
          [userId]: userData
        }))
      }
    }
    setExpandedUsers(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading team data...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400">
            Team overview for {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Team Members</CardTitle>
            <Users className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{teamStats.totalUsers}</div>
            <p className="text-xs text-slate-400">
              Active users in the system
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Today</CardTitle>
            <Calendar className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{teamStats.activeToday}</div>
            <p className="text-xs text-slate-400">
              Set commitments today
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Overall Completion</CardTitle>
            <Target className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{teamStats.overallCompletion}%</div>
            <p className="text-xs text-slate-400">
              Average completion rate
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Weekly Goals</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{teamStats.weeklyGoalsCompletion}%</div>
            <p className="text-xs text-slate-400">
              Goals completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={navigateToTab} defaultValue="team-overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/30">
          <TabsTrigger value="team-overview">Team Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="user-management">User Management</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
        </TabsList>

        {/* Team Overview */}
        <TabsContent value="team-overview" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Team Summary</CardTitle>
              <CardDescription className="text-slate-400">
                Quick overview of all team members' current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-slate-300">Member</TableHead>
                    <TableHead className="text-slate-300">Today's Commitment</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Weekly Goals</TableHead>
                    <TableHead className="text-slate-300">Last Reflection</TableHead>
                    <TableHead className="text-slate-300">Completion Rate</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamData.map((member) => (
                    <>
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-slate-700 text-white">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-white">{member.name}</p>
                              <p className="text-sm text-slate-400">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {member.todayCommitment ? (
                              <p className="text-sm truncate text-white">{member.todayCommitment}</p>
                            ) : (
                              <p className="text-sm text-slate-400 italic">No commitment set</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(member.commitmentStatus)}
                            {getStatusBadge(member.commitmentStatus)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm text-white">
                              {member.completedGoals} / {member.weeklyGoals}
                            </div>
                            <Progress
                              value={member.weeklyGoals > 0 ? (member.completedGoals / member.weeklyGoals) * 100 : 0}
                              className="h-2 w-16"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-white">
                            {format(new Date(member.lastReflection), 'MMM d')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-white">{member.completionRate}%</span>
                            <Progress value={member.completionRate} className="h-2 w-16" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserExpansion(member.id)}
                            className="flex items-center space-x-1"
                          >
                            {expandedUsers.has(member.id) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <Eye className="w-4 h-4" />
                            <span>Details</span>
                          </Button>
                        </TableCell>
                      </TableRow>

                      {expandedUsers.has(member.id) && detailedUserData[member.id] && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-slate-700/30 p-6">
                            <div className="space-y-6">
                              <h4 className="font-semibold text-lg text-white">Complete Profile: {member.name}</h4>

                              {/* Recent Commitments */}
                              <div>
                                <h5 className="font-medium mb-3 text-white">Recent Commitments (Last 7 Days)</h5>
                                <div className="space-y-2">
                                  {detailedUserData[member.id].commitments?.length > 0 ? (
                                    detailedUserData[member.id].commitments.map((commitment, index) => (
                                      <div key={index} className="flex items-start justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                        <div className="flex-1">
                                          <p className="text-sm text-white">{commitment.text}</p>
                                          <p className="text-xs text-slate-400 mt-1">
                                            {format(new Date(commitment.date), 'MMM d, yyyy')}
                                          </p>
                                        </div>
                                        <div className="ml-4">
                                          {getStatusBadge(commitment.status)}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">No recent commitments</p>
                                  )}
                                </div>
                              </div>

                              {/* All Goals */}
                              <div>
                                <h5 className="font-medium mb-3 text-white">All Goals</h5>
                                <div className="space-y-2">
                                  {detailedUserData[member.id].goals?.length > 0 ? (
                                    detailedUserData[member.id].goals.map((goal, index) => (
                                      <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <p className="text-sm font-medium text-white">{goal.text}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                              Created: {format(new Date(goal.createdAt), 'MMM d, yyyy')}
                                            </p>
                                          </div>
                                          <div className="ml-4">
                                            {getStatusBadge(goal.status)}
                                          </div>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">No goals set</p>
                                  )}
                                </div>
                              </div>

                              {/* Recent Reflections */}
                              <div>
                                <h5 className="font-medium mb-3 text-white">Recent Reflections</h5>
                                <div className="space-y-2">
                                  {detailedUserData[member.id].reflections?.length > 0 ? (
                                    detailedUserData[member.id].reflections.slice(0, 3).map((reflection, index) => (
                                      <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                        <p className="text-sm text-white">{reflection.text}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                          {format(new Date(reflection.date), 'MMM d, yyyy')}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-slate-400 italic">No reflections yet</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard user={user} />
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="user-management" className="space-y-6">
          <UserManagementAPI />
        </TabsContent>

        {/* Messaging Tab */}
        <TabsContent value="messaging" className="space-y-6">
          <MessagingCenter />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboardAPI
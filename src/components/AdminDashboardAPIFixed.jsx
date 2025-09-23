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
import { Users, Target, TrendingUp, Calendar, CheckCircle, Clock, XCircle, ChevronDown, ChevronRight, Eye, Award } from 'lucide-react'
import UserManagementAPI from './UserManagementAPI.jsx'
import MessagingCenter from './MessagingCenter.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'
import CoachingDashboard from './CoachingDashboard.jsx'
import { usersAPI, commitmentsAPI, goalsAPI, reflectionsAPI, analyticsAPI } from '../lib/api-client.js'

const AdminDashboardAPIFixed = ({ user }) => {
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
      console.log('Loading team data...')

      // Get all users - this is the most important
      let users = []
      try {
        users = await usersAPI.getAll()
        console.log(`Loaded ${users.length} users`)
      } catch (error) {
        console.error('Failed to load users:', error)
        setLoading(false)
        return
      }

      // Try to get today's commitments (optional)
      let todayCommitments = []
      try {
        todayCommitments = await commitmentsAPI.getTodayForAll()
      } catch (error) {
        console.log('Could not load commitments, continuing...')
      }

      // Try to get team analytics (optional)
      let analytics = {
        totalUsers: users.length,
        activeToday: 0,
        overallCompletion: 0,
        weeklyGoalsCompletion: 0
      }
      try {
        analytics = await analyticsAPI.getTeamAnalytics()
      } catch (error) {
        console.log('Could not load analytics, using defaults...')
      }

      // Build team data array with error handling for each user
      const teamDataArray = await Promise.all(users.map(async (member) => {
        try {
          // Find today's commitment for this user
          const todayCommit = todayCommitments?.find(c => c.user_id === member.id)

          // Try to get user's goals (with error handling)
          let userGoals = []
          try {
            userGoals = await goalsAPI.getByUser(member.id) || []
          } catch (error) {
            console.log(`Could not load goals for user ${member.id}`)
          }

          const weeklyGoals = userGoals.filter(g => {
            try {
              const createdAt = new Date(g.created_at)
              const weekStart = new Date(today)
              weekStart.setDate(today.getDate() - today.getDay())
              const weekEnd = new Date(weekStart)
              weekEnd.setDate(weekStart.getDate() + 6)
              return createdAt >= weekStart && createdAt <= weekEnd
            } catch {
              return false
            }
          })

          const completedGoals = weeklyGoals.filter(g => g.progress >= 100).length

          // Try to get user's reflections (with error handling)
          let userReflections = []
          try {
            userReflections = await reflectionsAPI.getByUser(member.id) || []
          } catch (error) {
            console.log(`Could not load reflections for user ${member.id}`)
          }
          const lastReflection = userReflections[0]

          // Try to get user's commitments for completion rate
          let completionRate = 0
          try {
            // Admin view - get 6 months of commitments
            const userCommitments = await commitmentsAPI.getByUser(member.id, true) || []
            const recentCommitments = userCommitments.filter(c => {
              try {
                const date = new Date(c.commitment_date)
                const diff = (today - date) / (1000 * 60 * 60 * 24)
                return diff <= 7
              } catch {
                return false
              }
            })
            const completedCommitments = recentCommitments.filter(c => c.status === 'completed').length
            completionRate = recentCommitments.length > 0
              ? Math.round((completedCommitments / recentCommitments.length) * 100)
              : 0
          } catch (error) {
            console.log(`Could not calculate completion rate for user ${member.id}`)
          }

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
        } catch (error) {
          console.error(`Error processing user ${member.id}:`, error)
          // Return basic user data even if processing fails
          return {
            id: member.id,
            name: member.name,
            email: member.email,
            role: member.role,
            lastLogin: new Date().toISOString(),
            todayCommitment: null,
            commitmentStatus: 'pending',
            weeklyGoals: 0,
            completedGoals: 0,
            lastReflection: new Date().toISOString(),
            completionRate: 0
          }
        }
      }))

      console.log(`Successfully processed ${teamDataArray.length} users`)
      setTeamData(teamDataArray)

      // Calculate team stats
      const activeToday = teamDataArray.filter(m => m.todayCommitment).length
      const avgCompletion = teamDataArray.length > 0
        ? teamDataArray.reduce((acc, m) => acc + m.completionRate, 0) / teamDataArray.length
        : 0
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
      const [commitments, goals, reflections] = await Promise.all([
        commitmentsAPI.getByUser(userId, true).catch(() => []),  // Admin view - 6 months
        goalsAPI.getByUser(userId).catch(() => []),
        reflectionsAPI.getByUser(userId).catch(() => [])
      ])

      setDetailedUserData(prev => ({
        ...prev,
        [userId]: {
          commitments: commitments || [],
          goals: goals || [],
          reflections: reflections || []
        }
      }))
    } catch (error) {
      console.error('Error loading user details:', error)
      setDetailedUserData(prev => ({
        ...prev,
        [userId]: {
          commitments: [],
          goals: [],
          reflections: []
        }
      }))
    }
  }

  const toggleUserExpanded = async (userId) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
      // Load detailed data when expanding
      if (!detailedUserData[userId]) {
        await loadUserDetails(userId)
      }
    }
    setExpandedUsers(newExpanded)
  }

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { color: 'bg-green-500', icon: CheckCircle, text: 'Completed' },
      pending: { color: 'bg-yellow-500', icon: Clock, text: 'Pending' },
      missed: { color: 'bg-red-500', icon: XCircle, text: 'Missed' }
    }

    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading team data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 mt-2">
          Team overview for {format(today, 'EEEE, MMMM do, yyyy')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={navigateToTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-slate-800/30 border border-slate-700/50">
          <TabsTrigger value="team-overview" className="data-[state=active]:bg-slate-700/50 text-white">
            Team Overview
          </TabsTrigger>
          <TabsTrigger value="detailed-view" className="data-[state=active]:bg-slate-700/50 text-white">
            Detailed View
          </TabsTrigger>
          <TabsTrigger value="coaching" className="data-[state=active]:bg-slate-700/50 text-white">
            Coaching
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700/50 text-white">
            Analytics
          </TabsTrigger>
          <TabsTrigger value="user-management" className="data-[state=active]:bg-slate-700/50 text-white">
            User Management
          </TabsTrigger>
          <TabsTrigger value="messaging" className="data-[state=active]:bg-slate-700/50 text-white">
            Messaging
          </TabsTrigger>
        </TabsList>

        {/* Team Overview Tab */}
        <TabsContent value="team-overview" className="space-y-6">
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Team Summary</CardTitle>
              <CardDescription className="text-slate-400">
                Quick overview of all team members' current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50">
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
                          {getStatusBadge(member.commitmentStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-white">{member.completedGoals}/{member.weeklyGoals}</span>
                            {member.weeklyGoals > 0 && (
                              <Progress
                                value={(member.completedGoals / member.weeklyGoals) * 100}
                                className="w-16 h-2"
                              />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-slate-300">
                            {format(new Date(member.lastReflection), 'MMM d, yyyy')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-white">{member.completionRate}%</span>
                            <Progress value={member.completionRate} className="w-16 h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserExpanded(member.id)}
                            className="text-slate-300 hover:text-white"
                          >
                            {expandedUsers.has(member.id) ? (
                              <>
                                <ChevronDown className="w-4 h-4 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronRight className="w-4 h-4 mr-1" />
                                Details
                              </>
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* Expanded Details Row */}
                      {expandedUsers.has(member.id) && detailedUserData[member.id] && (
                        <TableRow>
                          <TableCell colSpan={7} className="bg-slate-800/20 p-6">
                            <div className="grid grid-cols-3 gap-6">
                              {/* Recent Commitments */}
                              <div>
                                <h5 className="font-medium mb-3 text-white">Recent Commitments</h5>
                                <div className="space-y-2">
                                  {detailedUserData[member.id].commitments?.slice(0, 3).length > 0 ? (
                                    detailedUserData[member.id].commitments.slice(0, 3).map((commitment, index) => (
                                      <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                        <p className="text-sm font-medium text-white">{commitment.commitment_text}</p>
                                        <div className="flex items-center justify-between mt-2">
                                          <p className="text-xs text-slate-400">
                                            {format(new Date(commitment.commitment_date), 'MMM d, yyyy')}
                                          </p>
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
                                            <p className="text-sm font-medium text-white">{goal.goal_text}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                              Created: {format(new Date(goal.created_at), 'MMM d, yyyy')}
                                            </p>
                                          </div>
                                          <div className="ml-4">
                                            {goal.progress >= 100 ? getStatusBadge('completed') : getStatusBadge('pending')}
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
                                  {detailedUserData[member.id].reflections?.slice(0, 2).length > 0 ? (
                                    detailedUserData[member.id].reflections.slice(0, 2).map((reflection, index) => (
                                      <div key={index} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                                        <p className="text-xs text-slate-400 mb-2">
                                          {format(new Date(reflection.reflection_date), 'MMM d, yyyy')}
                                        </p>
                                        {reflection.wins && (
                                          <div className="mb-2">
                                            <p className="text-xs font-medium text-green-400">Wins:</p>
                                            <p className="text-sm text-white">{reflection.wins}</p>
                                          </div>
                                        )}
                                        {reflection.challenges && (
                                          <div>
                                            <p className="text-xs font-medium text-yellow-400">Challenges:</p>
                                            <p className="text-sm text-white">{reflection.challenges}</p>
                                          </div>
                                        )}
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

        {/* Detailed View Tab */}
        <TabsContent value="detailed-view" className="space-y-6">
          <Card className="bg-slate-800/30 border-slate-700/50">
            <CardHeader>
              <CardTitle className="text-white">Detailed Team View</CardTitle>
              <CardDescription className="text-slate-400">
                In-depth information about each team member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-slate-400 py-8">
                Detailed view coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coaching Tab */}
        <TabsContent value="coaching" className="space-y-6">
          <CoachingDashboard user={user} />
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

export default AdminDashboardAPIFixed
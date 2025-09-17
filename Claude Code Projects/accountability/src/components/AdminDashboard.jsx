import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx'
import { Users, Target, TrendingUp, Calendar, CheckCircle, Clock, XCircle, ChevronDown, ChevronRight, Eye } from 'lucide-react'
import UserManagement from './UserManagement.jsx'
import MessagingCenter from './MessagingCenter.jsx'
import AnalyticsDashboard from './AnalyticsDashboard.jsx'
import { analyticsStore, adminStore } from '../utils/dataStore.js'

// Cache bust: 2025-09-14-16:35 - Force deployment update
const AdminDashboard = ({ user }) => {
  const location = useLocation()
  const [teamData, setTeamData] = useState([])
  const [teamStats, setTeamStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    overallCompletion: 0,
    weeklyGoalsCompletion: 0
  })
  const [expandedUsers, setExpandedUsers] = useState(new Set())
  const [detailedUserData, setDetailedUserData] = useState({})

  // Load real team data from analytics store
  useEffect(() => {
    const stats = analyticsStore.getTeamStats()
    setTeamData(stats.teamData)
    setTeamStats({
      totalUsers: stats.totalUsers,
      activeToday: stats.activeToday,
      overallCompletion: stats.overallCompletion,
      weeklyGoalsCompletion: stats.weeklyGoalsCompletion
    })
  }, [location.pathname])

  const getInitials = (name) => {
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

  const toggleUserExpansion = (userId) => {
    const newExpanded = new Set(expandedUsers)
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId)
    } else {
      newExpanded.add(userId)
      // Load detailed data when expanding
      if (!detailedUserData[userId]) {
        const userData = adminStore.getUserRecentActivity(userId)
        setDetailedUserData(prev => ({
          ...prev,
          [userId]: userData
        }))
      }
    }
    setExpandedUsers(newExpanded)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Team overview for {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Active users in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.activeToday}</div>
            <p className="text-xs text-muted-foreground">
              Logged in today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Completion</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.overallCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              Average completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goals</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.weeklyGoalsCompletion}%</div>
            <p className="text-xs text-muted-foreground">
              Goals completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
        </TabsList>

        {/* Team Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Summary</CardTitle>
              <CardDescription>
                Quick overview of all team members' current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Today's Commitment</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Weekly Goals</TableHead>
                    <TableHead>Last Reflection</TableHead>
                    <TableHead>Completion Rate</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamData.map((member) => (
                    <>
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            {member.todayCommitment ? (
                              <p className="text-sm truncate">{member.todayCommitment}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No commitment set</p>
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
                            <div className="text-sm">
                              {member.completedGoals} / {member.weeklyGoals}
                            </div>
                            <Progress 
                              value={(member.completedGoals / member.weeklyGoals) * 100} 
                              className="h-2 w-16"
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {format(new Date(member.lastReflection), 'MMM d')}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{member.completionRate}%</span>
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
                          <TableCell colSpan={7} className="bg-muted/50 p-6">
                            <div className="space-y-6">
                              <h4 className="font-semibold text-lg">Complete Profile: {member.name}</h4>
                              
                              {/* Recent Commitments */}
                              <div>
                                <h5 className="font-medium mb-3">Recent Commitments (Last 7 Days)</h5>
                                <div className="space-y-2">
                                  {detailedUserData[member.id].commitments?.length > 0 ? (
                                    detailedUserData[member.id].commitments.map((commitment, index) => (
                                      <div key={index} className="flex items-start justify-between p-3 bg-background rounded-lg border">
                                        <div className="flex-1">
                                          <p className="text-sm">{commitment.text}</p>
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(commitment.date), 'MMM d, yyyy')}
                                          </p>
                                        </div>
                                        <div className="ml-4">
                                          {getStatusBadge(commitment.status)}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">No recent commitments</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* All Goals */}
                              <div>
                                <h5 className="font-medium mb-3">All Goals</h5>
                                <div className="space-y-2">
                                  {detailedUserData[member.id].goals?.length > 0 ? (
                                    detailedUserData[member.id].goals.map((goal, index) => (
                                      <div key={index} className="p-3 bg-background rounded-lg border">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <p className="text-sm font-medium">{goal.text}</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                              Created: {format(new Date(goal.createdAt), 'MMM d, yyyy')}
                                            </p>
                                          </div>
                                          <div className="ml-4">
                                            {getStatusBadge(goal.status)}
                                          </div>
                                        </div>
                                        {goal.description && (
                                          <p className="text-xs mt-2 text-muted-foreground">{goal.description}</p>
                                        )}
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">No goals set</p>
                                  )}
                                </div>
                              </div>
                              
                              {/* Recent Reflections */}
                              <div>
                                <h5 className="font-medium mb-3">Recent Reflections</h5>
                                <div className="space-y-2">
                                  {detailedUserData[member.id].reflections?.length > 0 ? (
                                    detailedUserData[member.id].reflections.slice(0, 3).map((reflection, index) => (
                                      <div key={index} className="p-3 bg-background rounded-lg border">
                                        <p className="text-sm">{reflection.text}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          {format(new Date(reflection.date), 'MMM d, yyyy')}
                                        </p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">No reflections yet</p>
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

        {/* Detailed View */}
        <TabsContent value="detailed" className="space-y-6">
          <div className="grid gap-6">
            {teamData.map((member) => {
              // Load detailed data for this user if not already loaded
              if (!detailedUserData[member.id]) {
                const userData = adminStore.getUserRecentActivity(member.id)
                setDetailedUserData(prev => ({
                  ...prev,
                  [member.id]: userData
                }))
              }
              
              const userDetails = detailedUserData[member.id]
              
              return (
                <Card key={member.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg">{member.name}</CardTitle>
                          <CardDescription>{member.email}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline">
                        Last login: {format(new Date(member.lastLogin), 'MMM d')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Today's Commitment */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Today's Commitment</h4>
                        {member.todayCommitment ? (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm">{member.todayCommitment}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              {getStatusIcon(member.commitmentStatus)}
                              {getStatusBadge(member.commitmentStatus)}
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">No commitment set</p>
                        )}
                      </div>
                      
                      {/* All Goals with Full Text */}
                      <div className="space-y-2">
                        <h4 className="font-medium">All Goals ({userDetails?.goals?.length || 0})</h4>
                        <div className="space-y-3">
                          {userDetails?.goals?.length > 0 ? (
                            userDetails.goals.map((goal, index) => (
                              <div key={index} className="p-4 bg-muted rounded-lg border-l-4 border-l-blue-500">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{goal.text}</p>
                                    {goal.description && (
                                      <p className="text-xs text-muted-foreground mt-1">{goal.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-2">
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
                            <p className="text-sm text-muted-foreground italic">No goals set</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Recent Commitments History */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Recent Commitments (Last 7 Days)</h4>
                        <div className="space-y-2">
                          {userDetails?.commitments?.length > 0 ? (
                            userDetails.commitments.map((commitment, index) => (
                              <div key={index} className="p-3 bg-muted rounded-lg">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="text-sm">{commitment.text}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {format(new Date(commitment.date), 'MMM d, yyyy')}
                                    </p>
                                  </div>
                                  <div className="ml-4">
                                    {getStatusBadge(commitment.status)}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No recent commitments</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Recent Reflections */}
                      <div className="space-y-2">
                        <h4 className="font-medium">Recent Reflections</h4>
                        <div className="space-y-2">
                          {userDetails?.reflections?.length > 0 ? (
                            userDetails.reflections.slice(0, 3).map((reflection, index) => (
                              <div key={index} className="p-3 bg-muted rounded-lg">
                                <p className="text-sm">{reflection.text}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(reflection.date), 'MMM d, yyyy')}
                                </p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No reflections yet</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Performance Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Weekly Goals Progress</span>
                            <span>{member.completedGoals} / {member.weeklyGoals}</span>
                          </div>
                          <Progress value={(member.completedGoals / member.weeklyGoals) * 100} />
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Overall Completion Rate</span>
                            <span>{member.completionRate}%</span>
                          </div>
                          <Progress value={member.completionRate} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsDashboard user={user} />
        </TabsContent>

        {/* User Management */}
        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        {/* Messaging Center */}
        <TabsContent value="messaging" className="space-y-6">
          <MessagingCenter />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboard

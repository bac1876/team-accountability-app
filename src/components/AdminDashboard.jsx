import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx'
import { Users, Target, TrendingUp, Calendar, CheckCircle, Clock, XCircle, Database, AlertCircle } from 'lucide-react'
import UserManagement from './UserManagement.jsx'
import MessagingCenter from './MessagingCenter.jsx'
import { analyticsStore } from '../utils/dataStore.js'
import { analyticsService, databaseService } from '../services/databaseService.js'

const AdminDashboard = ({ user }) => {
  const [teamData, setTeamData] = useState([])
  const [teamStats, setTeamStats] = useState({
    totalUsers: 0,
    activeToday: 0,
    overallCompletion: 0,
    weeklyGoalsCompletion: 0
  })
  const [databaseStatus, setDatabaseStatus] = useState(null)
  const [useDatabase, setUseDatabase] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Check database status and load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // First check database status
      const dbStatus = await checkDatabaseStatus()
      setDatabaseStatus(dbStatus)

      if (dbStatus.success && dbStatus.databaseInitialized) {
        // Try to load from database
        try {
          const analytics = await analyticsService.getTeamAnalytics()
          setTeamData(analytics.users || [])
          setTeamStats({
            totalUsers: analytics.totalUsers || 0,
            activeToday: analytics.activeToday || 0,
            overallCompletion: analytics.overallCompletion || 0,
            weeklyGoalsCompletion: analytics.weeklyGoalsCompletion || 0
          })
          setUseDatabase(true)
        } catch (dbError) {
          console.error('Database load failed, falling back to localStorage:', dbError)
          loadFromLocalStorage()
        }
      } else {
        // Fall back to localStorage
        loadFromLocalStorage()
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError(error.message)
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    const stats = analyticsStore.getTeamStats()
    setTeamData(stats.teamData)
    setTeamStats({
      totalUsers: stats.totalUsers,
      activeToday: stats.activeToday,
      overallCompletion: stats.overallCompletion,
      weeklyGoalsCompletion: stats.weeklyGoalsCompletion
    })
    setUseDatabase(false)
  }

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/database/status')
      return await response.json()
    } catch (error) {
      console.error('Database status check failed:', error)
      return { success: false, error: error.message }
    }
  }

  const initializeDatabase = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/database/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      const result = await response.json()
      
      if (result.success) {
        // Reload data after successful initialization
        await loadData()
      } else {
        setError(result.error || 'Database initialization failed')
      }
    } catch (error) {
      console.error('Database initialization error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

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
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.replace('_', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Team overview for {format(new Date(), 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {databaseStatus && (
            <Badge variant={databaseStatus.success ? 'default' : 'destructive'}>
              <Database className="w-3 h-3 mr-1" />
              {useDatabase ? 'Database' : 'Local Storage'}
            </Badge>
          )}
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {databaseStatus && !databaseStatus.databaseInitialized && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-yellow-600">
                <AlertCircle className="w-4 h-4" />
                <span>Database not initialized. Click to set up the database with all team members.</span>
              </div>
              <Button onClick={initializeDatabase} variant="outline">
                Initialize Database
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active users in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.activeToday}</div>
            <p className="text-xs text-muted-foreground">Logged in today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Completion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.overallCompletion}%</div>
            <p className="text-xs text-muted-foreground">Average completion rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamStats.weeklyGoalsCompletion}%</div>
            <p className="text-xs text-muted-foreground">Goals completion rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Team Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed View</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Summary</CardTitle>
              <CardDescription>Quick overview of all team members' current status</CardDescription>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamData.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">{member.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          {member.todayCommitment || (
                            <span className="text-muted-foreground italic">No commitment set</span>
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
                        <div className="text-sm">
                          {member.completedGoals} / {member.weeklyGoals}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {member.lastReflection || 'Jan 1'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={member.completionRate} className="w-16" />
                          <span className="text-sm">{member.completionRate}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Team View</CardTitle>
              <CardDescription>Comprehensive view of team member activities and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Detailed view implementation coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Team Analytics</CardTitle>
              <CardDescription>Performance metrics and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Analytics dashboard implementation coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserManagement />
        </TabsContent>

        <TabsContent value="messaging" className="space-y-4">
          <MessagingCenter />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default AdminDashboard

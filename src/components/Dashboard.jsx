import { useState, useEffect } from 'react'
import { format, startOfWeek, endOfWeek } from 'date-fns'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { CheckCircle, Circle, Clock, Target, MessageSquare, TrendingUp } from 'lucide-react'

const Dashboard = ({ user }) => {
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

  const today = new Date()
  const weekStart = startOfWeek(today)
  const weekEnd = endOfWeek(today)

  // Mock data initialization
  useEffect(() => {
    // Load mock data
    const mockCommitments = [
      { date: '2024-09-12', text: 'Complete project proposal', status: 'completed' },
      { date: '2024-09-11', text: 'Review team feedback', status: 'completed' },
      { date: '2024-09-10', text: 'Prepare presentation slides', status: 'not_completed' },
      { date: '2024-09-09', text: 'Update project timeline', status: 'completed' },
      { date: '2024-09-08', text: 'Client meeting preparation', status: 'completed' }
    ]

    const mockGoals = [
      { id: 1, text: 'Complete quarterly review', status: 'in_progress' },
      { id: 2, text: 'Improve team communication', status: 'completed' },
      { id: 3, text: 'Learn new project management tool', status: 'in_progress' }
    ]

    setRecentCommitments(mockCommitments)
    setWeeklyGoals(mockGoals)
  }, [])

  const handleCommitmentSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving commitment:', todayCommitment)
  }

  const handleStatusUpdate = (status) => {
    setCommitmentStatus(status)
    // In a real app, this would update the backend
  }

  const handleAddGoal = () => {
    if (newGoal.trim()) {
      const goal = {
        id: Date.now(),
        text: newGoal,
        status: 'in_progress'
      }
      setWeeklyGoals([...weeklyGoals, goal])
      setNewGoal('')
    }
  }

  const handleGoalStatusChange = (goalId, status) => {
    setWeeklyGoals(goals => 
      goals.map(goal => 
        goal.id === goalId ? { ...goal, status } : goal
      )
    )
  }

  const handleReflectionSave = () => {
    // In a real app, this would save to the backend
    console.log('Saving reflection:', reflection)
  }

  const completionRate = recentCommitments.length > 0 
    ? (recentCommitments.filter(c => c.status === 'completed').length / recentCommitments.length) * 100 
    : 0

  const completedGoals = weeklyGoals.filter(g => g.status === 'completed').length
  const goalProgress = weeklyGoals.length > 0 ? (completedGoals / weeklyGoals.length) * 100 : 0

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">
            Today is {format(today, 'EEEE, MMMM do, yyyy')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{Math.round(completionRate)}%</div>
            <div className="text-sm text-muted-foreground">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="today" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="goals">Weekly Goals</TabsTrigger>
          <TabsTrigger value="reflection">Reflection</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Today's Commitment */}
        <TabsContent value="today" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Today's Commitment</span>
              </CardTitle>
              <CardDescription>
                What do you commit to accomplishing today?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your commitment for today..."
                value={todayCommitment}
                onChange={(e) => setTodayCommitment(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex space-x-2">
                <Button onClick={handleCommitmentSave}>
                  Save Commitment
                </Button>
              </div>
              
              {todayCommitment && (
                <div className="border-t pt-4">
                  <p className="font-medium mb-3">Mark your progress:</p>
                  <div className="flex space-x-2">
                    <Button
                      variant={commitmentStatus === 'completed' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusUpdate('completed')}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Completed</span>
                    </Button>
                    <Button
                      variant={commitmentStatus === 'in_progress' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusUpdate('in_progress')}
                      className="flex items-center space-x-2"
                    >
                      <Clock className="w-4 h-4" />
                      <span>In Progress</span>
                    </Button>
                    <Button
                      variant={commitmentStatus === 'not_completed' ? 'destructive' : 'outline'}
                      size="sm"
                      onClick={() => handleStatusUpdate('not_completed')}
                      className="flex items-center space-x-2"
                    >
                      <Circle className="w-4 h-4" />
                      <span>Not Completed</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Weekly Goals */}
        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5" />
                  <span>Weekly Goals</span>
                </div>
                <Badge variant="secondary">
                  {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
                </Badge>
              </CardTitle>
              <CardDescription>
                Set and track your goals for this week
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Add a new weekly goal..."
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddGoal}>Add Goal</Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {completedGoals} of {weeklyGoals.length} completed
                  </span>
                </div>
                <Progress value={goalProgress} className="h-2" />
              </div>

              <div className="space-y-2">
                {weeklyGoals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className={goal.status === 'completed' ? 'line-through text-muted-foreground' : ''}>
                      {goal.text}
                    </span>
                    <div className="flex space-x-2">
                      <Button
                        variant={goal.status === 'completed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleGoalStatusChange(goal.id, 'completed')}
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={goal.status === 'in_progress' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleGoalStatusChange(goal.id, 'in_progress')}
                      >
                        <Clock className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reflection */}
        <TabsContent value="reflection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>Daily Reflection</span>
              </CardTitle>
              <CardDescription>
                Take a moment to reflect on your day
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="font-medium">What went well today?</label>
                <Textarea
                  placeholder="Reflect on your successes and positive moments..."
                  value={reflection.wentWell}
                  onChange={(e) => setReflection({...reflection, wentWell: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="font-medium">What would you have done differently?</label>
                <Textarea
                  placeholder="Think about areas for improvement..."
                  value={reflection.differently}
                  onChange={(e) => setReflection({...reflection, differently: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="font-medium">Areas where you need help</label>
                <Textarea
                  placeholder="What support or resources do you need?"
                  value={reflection.needHelp}
                  onChange={(e) => setReflection({...reflection, needHelp: e.target.value})}
                />
              </div>

              <Button onClick={handleReflectionSave}>
                Save Reflection
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Commitments</CardTitle>
              <CardDescription>
                Your commitment history over the past week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCommitments.map((commitment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{commitment.text}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(commitment.date), 'EEEE, MMM d')}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        commitment.status === 'completed' ? 'default' : 
                        commitment.status === 'in_progress' ? 'secondary' : 'destructive'
                      }
                    >
                      {commitment.status === 'completed' ? 'Completed' :
                       commitment.status === 'in_progress' ? 'In Progress' : 'Not Completed'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Dashboard

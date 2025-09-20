import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Target, Plus, Edit2, Trash2, Save, X, TrendingUp, Calendar, CheckCircle } from 'lucide-react'
import { goalsAPI } from '../lib/api-client.js'

const WeeklyGoalsSection = ({ user }) => {
  const [goals, setGoals] = useState([])
  const [newGoalText, setNewGoalText] = useState('')
  const [editingGoal, setEditingGoal] = useState(null)
  const [editText, setEditText] = useState('')
  const [editProgress, setEditProgress] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadGoals()
  }, [user?.id])

  const loadGoals = async () => {
    if (!user?.id) return

    try {
      const response = await goalsAPI.getByUser(user.id)
      const userGoals = Array.isArray(response) ? response : []
      setGoals(userGoals)
    } catch (error) {
      console.error('Error loading goals:', error)
    }
  }

  const saveGoal = async () => {
    if (!newGoalText.trim()) return

    setLoading(true)
    try {
      await goalsAPI.create(user.id, newGoalText.trim())
      setNewGoalText('')
      await loadGoals()

      // Show success message
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      toast.textContent = 'Goal added successfully!'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
    } catch (error) {
      console.error('Error saving goal:', error)
      alert('Failed to save goal')
    } finally {
      setLoading(false)
    }
  }

  const updateGoal = async (goalId) => {
    if (!editText.trim()) return

    try {
      const progress = parseInt(editProgress) || 0
      await goalsAPI.updateGoal(goalId, editText.trim(), progress)
      setEditingGoal(null)
      setEditText('')
      setEditProgress('')
      await loadGoals()
    } catch (error) {
      console.error('Error updating goal:', error)
      alert('Failed to update goal')
    }
  }

  const quickUpdateProgress = async (goalId, progress) => {
    try {
      await goalsAPI.updateProgress(goalId, progress)
      await loadGoals()
    } catch (error) {
      console.error('Error updating progress:', error)
    }
  }

  const deleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return

    try {
      await goalsAPI.delete(goalId)
      await loadGoals()
    } catch (error) {
      console.error('Error deleting goal:', error)
      alert('Failed to delete goal')
    }
  }

  const getAverageProgress = () => {
    if (goals.length === 0) return 0
    const total = goals.reduce((sum, goal) => sum + (goal.progress || 0), 0)
    return Math.round(total / goals.length)
  }

  const getCompletedCount = () => {
    return goals.filter(g => g.progress >= 100).length
  }

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    if (progress >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getProgressBadgeColor = (progress) => {
    if (progress >= 100) return 'bg-green-100 text-green-700'
    if (progress >= 75) return 'bg-blue-100 text-blue-700'
    if (progress >= 50) return 'bg-yellow-100 text-yellow-700'
    if (progress >= 25) return 'bg-orange-100 text-orange-700'
    return 'bg-red-100 text-red-700'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Weekly Goals</h2>
        <p className="text-gray-600">Set and track your progress on weekly goals</p>
      </div>

      {/* Overview Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">{getAverageProgress()}%</div>
              <div className="text-emerald-100 text-lg">Average Progress</div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{goals.length}</div>
                <div className="text-emerald-100 text-sm">Total Goals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{getCompletedCount()}</div>
                <div className="text-emerald-100 text-sm">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{goals.length - getCompletedCount()}</div>
                <div className="text-emerald-100 text-sm">In Progress</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-600" />
            Add New Goal
          </CardTitle>
          <CardDescription>
            What do you want to accomplish this week?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              value={newGoalText}
              onChange={(e) => setNewGoalText(e.target.value)}
              placeholder="e.g., Complete project documentation, Read 2 chapters, Exercise 4 times..."
              className="text-lg"
              rows={3}
            />
          </div>
          <Button
            onClick={saveGoal}
            disabled={loading || !newGoalText.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Goal
          </Button>
        </CardContent>
      </Card>

      {/* Goals List */}
      {goals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Goals</CardTitle>
            <CardDescription>
              Track your progress and update as you go
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goals.map((goal) => (
              <div
                key={goal.id}
                className="p-4 rounded-lg border bg-white"
              >
                {editingGoal === goal.id ? (
                  <div className="space-y-4">
                    <Textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full"
                      rows={2}
                    />
                    <div className="flex items-center gap-4">
                      <Label>Progress:</Label>
                      <Input
                        type="number"
                        value={editProgress}
                        onChange={(e) => setEditProgress(e.target.value)}
                        min="0"
                        max="100"
                        className="w-24"
                      />
                      <span>%</span>
                      <div className="ml-auto flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => updateGoal(goal.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingGoal(null)
                            setEditText('')
                            setEditProgress('')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="text-lg font-medium">{goal.goal_text}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`${getProgressBadgeColor(goal.progress || 0)} border-0`}>
                            {goal.progress || 0}% Complete
                          </Badge>
                          {goal.progress >= 100 && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingGoal(goal.id)
                            setEditText(goal.goal_text)
                            setEditProgress(goal.progress || 0)
                          }}
                          className="h-8 w-8 p-0 border-gray-300 hover:bg-gray-100"
                          title="Edit goal"
                        >
                          <Edit2 className="h-4 w-4 text-gray-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteGoal(goal.id)}
                          className="h-8 w-8 p-0 border-red-300 text-red-500 hover:bg-red-50 hover:border-red-400"
                          title="Delete goal"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress value={goal.progress || 0} className="h-3" />

                      {/* Quick Progress Update Buttons */}
                      <div className="flex gap-2">
                        <span className="text-sm text-gray-600">Quick update:</span>
                        {[0, 25, 50, 75, 100].map(percent => (
                          <Button
                            key={percent}
                            size="sm"
                            variant={goal.progress === percent ? "default" : "outline"}
                            onClick={() => quickUpdateProgress(goal.id, percent)}
                            className="h-7 px-2 text-xs"
                          >
                            {percent}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {goals.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-gray-600">
              Set your first weekly goal to get started
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default WeeklyGoalsSection
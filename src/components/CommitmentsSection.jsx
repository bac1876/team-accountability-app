import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Label } from '@/components/ui/label.jsx'
import { CheckCircle, Circle, Calendar, Plus, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { commitmentsAPI } from '../lib/api-client.js'
import { useNavigation } from '../context/NavigationContext.jsx'

const CommitmentsSection = ({ user }) => {
  const { selectedDate: contextDate, setSelectedDate: setContextDate } = useNavigation()
  const [todayCommitment, setTodayCommitment] = useState('')
  const [commitments, setCommitments] = useState([])
  const [recentCommitments, setRecentCommitments] = useState([])
  const [editingCommitment, setEditingCommitment] = useState(null)
  const [editText, setEditText] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState(contextDate || new Date().toISOString().split('T')[0])
  const [hasCommitment, setHasCommitment] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  useEffect(() => {
    if (contextDate && contextDate !== selectedDate) {
      setSelectedDate(contextDate)
    }
  }, [contextDate])

  useEffect(() => {
    loadCommitments()
  }, [selectedDate, user?.id])

  const loadCommitments = async () => {
    if (!user?.id) return

    try {
      // Get commitments for selected date
      const response = await commitmentsAPI.getByUserAndDate(user.id, selectedDate)
      const dayCommitments = Array.isArray(response) ? response : (response ? [response] : [])
      setCommitments(dayCommitments)
      setHasCommitment(dayCommitments.length > 0)

      // Get recent commitments for editing (last 7 days for users, 6 months for admins)
      const isAdmin = user.role === 'admin'
      const allCommitments = await commitmentsAPI.getByUser(user.id, isAdmin)
      if (allCommitments && Array.isArray(allCommitments)) {
        const recent = allCommitments
          .filter(c => c.commitment_date) // Ensure commitment_date exists
          .sort((a, b) => new Date(b.commitment_date) - new Date(a.commitment_date))
          .slice(0, 10) // Show last 10 commitments
        setRecentCommitments(recent)
      }

      // Also log for debugging
      console.log('Loaded commitments for date:', selectedDate)
      console.log('Commitments found:', dayCommitments.length)
      console.log('Recent commitments loaded:', allCommitments?.length || 0)
    } catch (error) {
      console.error('Error loading commitments:', error)
    }
  }

  const saveCommitment = async () => {
    if (!todayCommitment.trim()) return

    setLoading(true)
    try {
      await commitmentsAPI.create(user.id, selectedDate, todayCommitment.trim(), 'pending')
      setTodayCommitment('')
      await loadCommitments()

      // Show success message
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      toast.textContent = 'Commitment saved successfully!'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
    } catch (error) {
      console.error('Error saving commitment:', error)
      alert('Failed to save commitment')
    } finally {
      setLoading(false)
    }
  }

  const updateCommitmentStatus = async (commitment) => {
    const newStatus = commitment.status === 'completed' ? 'pending' : 'completed'
    try {
      await commitmentsAPI.updateById(commitment.id, commitment.commitment_text, newStatus)
      await loadCommitments()

      // Show success message
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      toast.textContent = `Commitment marked as ${newStatus}!`
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
    } catch (error) {
      console.error('Error updating commitment status:', error)
      alert('Failed to update commitment status')
    }
  }

  const updateCommitmentText = async (commitmentId) => {
    if (!editText.trim()) return

    try {
      // Find commitment in either today's or recent commitments
      const commitment = commitments.find(c => c.id === commitmentId) ||
                        recentCommitments.find(c => c.id === commitmentId)

      if (!commitment) {
        alert('Commitment not found')
        return
      }

      await commitmentsAPI.updateById(commitmentId, editText.trim(), commitment.status)
      setEditingCommitment(null)
      setEditText('')
      await loadCommitments()
    } catch (error) {
      console.error('Error updating commitment:', error)
      alert('Failed to update commitment')
    }
  }

  const deleteCommitment = async (commitmentId) => {
    if (!confirm('Are you sure you want to delete this commitment?')) return

    try {
      await commitmentsAPI.delete(commitmentId)
      await loadCommitments()
    } catch (error) {
      console.error('Error deleting commitment:', error)
      alert('Failed to delete commitment')
    }
  }

  const changeDate = (days) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    const newDate = date.toISOString().split('T')[0]
    setSelectedDate(newDate)
    setContextDate(newDate)  // Update context as well
  }

  const formatDateDisplay = (dateStr) => {
    if (dateStr === today) return 'Today'

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday'

    const [year, month, day] = dateStr.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCompletedCount = () => {
    return commitments.filter(c => c.status === 'completed').length
  }

  const getCompletionRate = () => {
    if (commitments.length === 0) return 0
    return Math.round((getCompletedCount() / commitments.length) * 100)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Daily Commitments</h2>
        <p className="text-gray-600">Set and track your daily commitments</p>
      </div>

      {/* Date Navigation */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{formatDateDisplay(selectedDate)}</div>
                <div className="text-purple-100 text-sm">
                  {(() => {
                    const [year, month, day] = selectedDate.split('-').map(Number)
                    const date = new Date(year, month - 1, day)
                    return date.toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  })()}
                </div>
              </div>

              <button
                onClick={() => changeDate(1)}
                className="p-2 hover:bg-white/20 rounded-full transition"
                disabled={selectedDate >= today}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Quick Navigation */}
            <div className="flex justify-center gap-2 mt-4">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setSelectedDate(today)
                  setContextDate(today)  // Update context to sync week overview
                }}
                className={selectedDate === today ? 'bg-white text-purple-600' : 'bg-white/20 text-white hover:bg-white/30'}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  const yesterdayString = yesterday.toISOString().split('T')[0]
                  setSelectedDate(yesterdayString)
                  setContextDate(yesterdayString)  // Update context to sync week overview
                }}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                Yesterday
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Commitment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-purple-600" />
            Add Commitment
          </CardTitle>
          <CardDescription>
            What will you commit to {isToday ? 'today' : `on ${formatDateDisplay(selectedDate)}`}?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              value={todayCommitment}
              onChange={(e) => setTodayCommitment(e.target.value)}
              placeholder="e.g., Complete project proposal, Call 5 clients, Finish report..."
              className="text-lg"
              rows={3}
            />
          </div>
          <Button
            onClick={saveCommitment}
            disabled={loading || !todayCommitment.trim()}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Commitment
          </Button>
        </CardContent>
      </Card>

      {/* Progress Overview */}
      {commitments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Progress Overview</span>
              <Badge
                className={`${
                  getCompletionRate() >= 100 ? 'bg-green-100 text-green-700' :
                  getCompletionRate() >= 50 ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                } border-0`}
              >
                {getCompletionRate()}% Complete
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Daily Progress</span>
                  <span className="font-semibold">
                    {getCompletedCount()} / {commitments.length} completed
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      getCompletionRate() >= 100 ? 'bg-green-500' :
                      getCompletionRate() >= 50 ? 'bg-blue-500' :
                      'bg-yellow-500'
                    }`}
                    style={{ width: `${getCompletionRate()}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{commitments.length}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{getCompletedCount()}</div>
                  <div className="text-xs text-gray-600">Completed</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {commitments.length - getCompletedCount()}
                  </div>
                  <div className="text-xs text-gray-600">Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Commitments List */}
      {(commitments.length > 0 || recentCommitments.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle>Your Commitments</CardTitle>
            <CardDescription>
              Click the circle to mark as complete, or use the buttons to edit/delete
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Today's commitments first */}
            {commitments.map((commit) => (
              <div
                key={commit.id}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  commit.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'
                }`}
              >
                <button
                  onClick={() => updateCommitmentStatus(commit)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                  aria-label={commit.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                >
                  {commit.status === 'completed' ? (
                    <CheckCircle className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                  )}
                </button>

                <div className="flex-1">
                  {editingCommitment === commit.id ? (
                    <div className="flex gap-2">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex flex-col gap-1">
                        <Button
                          size="sm"
                          onClick={() => updateCommitmentText(commit.id)}
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCommitment(null)
                            setEditText('')
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className={`${
                      commit.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                    }`}>
                      {commit.commitment_text}
                    </p>
                  )}
                </div>

                {editingCommitment !== commit.id ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingCommitment(commit.id)
                        setEditText(commit.commitment_text)
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteCommitment(commit.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}

            {/* Recent commitments for editing */}
            {recentCommitments.length > 0 && (
              <>
                {commitments.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Commitments</h4>
                  </div>
                )}
                {recentCommitments
                  .filter(recent => !commitments.find(today => today.id === recent.id)) // Don't duplicate today's commitments
                  .map((commit) => (
                  <div
                    key={commit.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      commit.status === 'completed' ? 'bg-green-50' : 'bg-gray-50'
                    }`}
                  >
                    <button
                      onClick={() => updateCommitmentStatus(commit)}
                      className="p-1 hover:bg-gray-200 rounded-full transition-colors cursor-pointer"
                      aria-label={commit.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      {commit.status === 'completed' ? (
                        <CheckCircle className="h-6 w-6 text-green-500" />
                      ) : (
                        <Circle className="h-6 w-6 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>

                    <div className="flex-1">
                      {editingCommitment === commit.id ? (
                        <div className="flex gap-2">
                          <Textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="flex-1"
                            rows={2}
                            autoFocus
                          />
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              onClick={() => updateCommitmentText(commit.id)}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingCommitment(null)
                                setEditText('')
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className={`${
                            commit.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                          }`}>
                            {commit.commitment_text}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {format(new Date(commit.commitment_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>

                    {editingCommitment !== commit.id ? (
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCommitment(commit.id)
                            setEditText(commit.commitment_text)
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteCommitment(commit.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {commitments.length === 0 && recentCommitments.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Circle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No commitments yet</h3>
            <p className="text-gray-600">
              Add your first commitment for {formatDateDisplay(selectedDate)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default CommitmentsSection
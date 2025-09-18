import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Label } from '@/components/ui/label.jsx'
import { MessageSquare, Calendar, ChevronLeft, ChevronRight, Save, Trophy, AlertCircle, Target } from 'lucide-react'
import { reflectionsAPI } from '../lib/api-client.js'

const ReflectionsSection = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [reflection, setReflection] = useState(null)
  const [wins, setWins] = useState('')
  const [challenges, setChallenges] = useState('')
  const [tomorrowFocus, setTomorrowFocus] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasReflection, setHasReflection] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isToday = selectedDate === today

  useEffect(() => {
    loadReflection()
  }, [selectedDate, user?.id])

  const loadReflection = async () => {
    if (!user?.id) return

    try {
      const response = await reflectionsAPI.getByUserAndDate(user.id, selectedDate)
      if (response && response.length > 0) {
        const todayReflection = response[0]
        setReflection(todayReflection)
        setWins(todayReflection.wins || '')
        setChallenges(todayReflection.challenges || '')
        setTomorrowFocus(todayReflection.tomorrow_focus || '')
        setHasReflection(true)
      } else {
        setReflection(null)
        setWins('')
        setChallenges('')
        setTomorrowFocus('')
        setHasReflection(false)
      }
    } catch (error) {
      console.error('Error loading reflection:', error)
      setHasReflection(false)
    }
  }

  const saveReflection = async () => {
    if (!wins.trim() && !challenges.trim() && !tomorrowFocus.trim()) {
      alert('Please fill in at least one reflection field')
      return
    }

    setLoading(true)
    try {
      await reflectionsAPI.create(
        user.id,
        selectedDate,
        wins.trim(),
        challenges.trim(),
        tomorrowFocus.trim()
      )

      await loadReflection()

      // Show success message
      const toast = document.createElement('div')
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50'
      toast.textContent = 'Reflection saved successfully!'
      document.body.appendChild(toast)
      setTimeout(() => toast.remove(), 2000)
    } catch (error) {
      console.error('Error saving reflection:', error)
      alert('Failed to save reflection')
    } finally {
      setLoading(false)
    }
  }

  const changeDate = (days) => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + days)
    setSelectedDate(date.toISOString().split('T')[0])
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

  const getPrompts = () => {
    const prompts = {
      wins: [
        "What went well today?",
        "What are you proud of?",
        "What achievements did you make?",
        "What positive moments stood out?"
      ],
      challenges: [
        "What was challenging today?",
        "What obstacles did you face?",
        "What could have gone better?",
        "What lessons did you learn?"
      ],
      tomorrow: [
        "What's your main focus for tomorrow?",
        "What do you want to accomplish?",
        "What's your top priority?",
        "What will make tomorrow successful?"
      ]
    }

    const dayOfWeek = new Date(selectedDate).getDay()
    return {
      wins: prompts.wins[dayOfWeek % prompts.wins.length],
      challenges: prompts.challenges[dayOfWeek % prompts.challenges.length],
      tomorrow: prompts.tomorrow[dayOfWeek % prompts.tomorrow.length]
    }
  }

  const currentPrompts = getPrompts()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Daily Reflections</h2>
        <p className="text-gray-600">Reflect on your day and plan for tomorrow</p>
      </div>

      {/* Date Navigation */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => changeDate(-1)}
                className="p-2 hover:bg-white/20 rounded-full transition"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <div className="text-center">
                <div className="text-3xl font-bold mb-1">{formatDateDisplay(selectedDate)}</div>
                <div className="text-indigo-100 text-sm">
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
                onClick={() => setSelectedDate(today)}
                className={selectedDate === today ? 'bg-white text-indigo-600' : 'bg-white/20 text-white hover:bg-white/30'}
              >
                Today
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  const yesterday = new Date()
                  yesterday.setDate(yesterday.getDate() - 1)
                  setSelectedDate(yesterday.toISOString().split('T')[0])
                }}
                className="bg-white/20 text-white hover:bg-white/30"
              >
                Yesterday
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reflection Form */}
      {!hasReflection ? (
        <>
          {/* Wins */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Wins & Achievements
              </CardTitle>
              <CardDescription>
                {currentPrompts.wins}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={wins}
                onChange={(e) => setWins(e.target.value)}
                placeholder="e.g., Completed all my tasks, Had a great meeting, Helped a colleague..."
                className="text-lg"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Challenges */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Challenges & Learnings
              </CardTitle>
              <CardDescription>
                {currentPrompts.challenges}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                placeholder="e.g., Time management was difficult, Technical issues with project, Communication breakdown..."
                className="text-lg"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Tomorrow's Focus */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Tomorrow's Focus
              </CardTitle>
              <CardDescription>
                {currentPrompts.tomorrow}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={tomorrowFocus}
                onChange={(e) => setTomorrowFocus(e.target.value)}
                placeholder="e.g., Finish the presentation, Start new project phase, Follow up with clients..."
                className="text-lg"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={saveReflection}
                disabled={loading || (!wins.trim() && !challenges.trim() && !tomorrowFocus.trim())}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
                size="lg"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Reflection
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        /* Display Saved Reflection */
        <div className="space-y-4">
          {wins && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Wins & Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{wins}</p>
              </CardContent>
            </Card>
          )}

          {challenges && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertCircle className="h-5 w-5 text-orange-500" />
                  Challenges & Learnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{challenges}</p>
              </CardContent>
            </Card>
          )}

          {tomorrowFocus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-blue-500" />
                  Tomorrow's Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{tomorrowFocus}</p>
              </CardContent>
            </Card>
          )}

          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <Badge className="bg-green-100 text-green-700 border-0 text-lg px-4 py-2">
                  Reflection Complete
                </Badge>
                <p className="text-gray-600 mt-2">
                  Your reflection for {formatDateDisplay(selectedDate)} has been saved
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State for past dates without reflection */}
      {!hasReflection && selectedDate < today && (
        <Card className="text-center py-12 bg-gray-50">
          <CardContent>
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No reflection for this day</h3>
            <p className="text-gray-600">
              You can still add a reflection for {formatDateDisplay(selectedDate)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ReflectionsSection
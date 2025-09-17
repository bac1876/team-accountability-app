import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Focus, Target } from 'lucide-react'

const DailyFocusSimple = ({ user }) => {
  const [focusText, setFocusText] = useState('')
  const [priority, setPriority] = useState('high')
  const [showForm, setShowForm] = useState(false)
  const [savedFocus, setSavedFocus] = useState(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!focusText.trim()) return
    
    const focusData = {
      text: focusText.trim(),
      priority,
      date: new Date().toISOString().split('T')[0],
      completed: false
    }
    
    setSavedFocus(focusData)
    setShowForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Focus className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">Daily Focus</h2>
      </div>

      {/* Display current focus or form */}
      {savedFocus && !showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Today's Focus</CardTitle>
            <CardDescription>Your main focus for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-lg font-medium">{savedFocus.text}</p>
              <p className="text-sm text-gray-600 mt-2">
                Priority: <span className="font-medium capitalize">{savedFocus.priority}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowForm(true)} variant="outline">
                Edit Focus
              </Button>
              <Button 
                onClick={() => setSavedFocus({...savedFocus, completed: !savedFocus.completed})}
                variant={savedFocus.completed ? "default" : "outline"}
              >
                {savedFocus.completed ? '✓ Completed' : 'Mark Complete'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Set Daily Focus
            </CardTitle>
            <CardDescription>Define your main focus for today</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="focusText">Daily Focus</Label>
                <Textarea
                  id="focusText"
                  value={focusText}
                  onChange={(e) => setFocusText(e.target.value)}
                  placeholder="What's your main focus for today?"
                  rows={3}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priority">Priority Level</Label>
                <select
                  id="priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="high">🔴 High Priority</option>
                  <option value="medium">🟡 Medium Priority</option>
                  <option value="low">🔵 Low Priority</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Set Daily Focus</Button>
                {savedFocus && (
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DailyFocusSimple
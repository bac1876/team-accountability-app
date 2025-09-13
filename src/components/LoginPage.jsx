import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Eye, EyeOff } from 'lucide-react'

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Get users from localStorage or use default users
  const getUsers = () => {
    const savedUsers = localStorage.getItem('teamUsers')
    if (savedUsers) {
      return JSON.parse(savedUsers)
    } else {
      // Default users if none exist
      const defaultUsers = [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User', email: 'admin@example.com' },
        { id: 2, username: 'john', password: 'john123', role: 'member', name: 'John Doe', email: 'john@example.com' },
        { id: 3, username: 'jane', password: 'jane123', role: 'member', name: 'Jane Smith', email: 'jane@example.com' }
      ]
      localStorage.setItem('teamUsers', JSON.stringify(defaultUsers))
      return defaultUsers
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Dynamic authentication using current users
    const currentUsers = getUsers()
    const user = currentUsers.find(
      u => u.username === formData.username && u.password === formData.password
    )

    if (user) {
      const { password, ...userWithoutPassword } = user
      onLogin(userWithoutPassword)
    } else {
      setError('Invalid username or password')
    }

    setLoading(false)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Team Accountability</CardTitle>
          <CardDescription className="text-center">
            Sign in to track your daily commitments and goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                placeholder="Enter your username"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="Enter your password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Demo Accounts:</p>
            <div className="text-xs space-y-1">
              <div><strong>Admin:</strong> admin / admin123</div>
              <div><strong>Member:</strong> john / john123</div>
              <div><strong>Member:</strong> jane / jane123</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage

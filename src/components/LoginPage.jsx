import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Eye, EyeOff, Database, HardDrive } from 'lucide-react'
import { authService } from '../services/databaseService.js'

const LoginPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [authMethod, setAuthMethod] = useState('auto') // auto, database, localStorage

  // Get users from localStorage or use default users
  const getUsers = () => {
    const savedUsers = localStorage.getItem('teamUsers')
    if (savedUsers) {
      return JSON.parse(savedUsers)
    } else {
      // Default users if none exist
      const defaultUsers = [
        { id: 1, username: 'brian@searchnwa.com', password: 'admin123', role: 'admin', name: 'Brian Curtis', email: 'brian@searchnwa.com', phone: '+1-555-0101' },
        { id: 2, username: 'john@example.com', password: 'john123', role: 'member', name: 'John Doe', email: 'john@example.com', phone: '+1-555-0102' },
        { id: 3, username: 'jane@example.com', password: 'jane123', role: 'member', name: 'Jane Smith', email: 'jane@example.com', phone: '+1-555-0103' }
      ]
      localStorage.setItem('teamUsers', JSON.stringify(defaultUsers))
      return defaultUsers
    }
  }

  const authenticateWithDatabase = async (email, password) => {
    try {
      const result = await authService.login(email, password)
      return result.user
    } catch (error) {
      console.error('Database authentication failed:', error)
      throw error
    }
  }

  const authenticateWithLocalStorage = (email, password) => {
    const currentUsers = getUsers()
    const user = currentUsers.find(
      u => u.username === email && u.password === password
    )
    if (!user) {
      throw new Error('Invalid username or password')
    }
    return user
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let user = null
      let usedMethod = 'localStorage'

      // Try database authentication first (if auto or database mode)
      if (authMethod === 'auto' || authMethod === 'database') {
        try {
          user = await authenticateWithDatabase(formData.username, formData.password)
          usedMethod = 'database'
        } catch (dbError) {
          console.log('Database auth failed, trying localStorage...', dbError.message)
          
          // If auto mode and database fails, try localStorage
          if (authMethod === 'auto') {
            try {
              user = authenticateWithLocalStorage(formData.username, formData.password)
              usedMethod = 'localStorage'
            } catch (localError) {
              throw new Error('Authentication failed with both database and localStorage')
            }
          } else {
            throw dbError
          }
        }
      } else {
        // localStorage only mode
        user = authenticateWithLocalStorage(formData.username, formData.password)
        usedMethod = 'localStorage'
      }

      if (user) {
        // Remove password from user object before storing
        const { password, ...userWithoutPassword } = user
        
        // Add auth method info for debugging
        userWithoutPassword.authMethod = usedMethod
        
        onLogin(userWithoutPassword)
      } else {
        setError('Authentication failed')
      }

    } catch (error) {
      console.error('Authentication error:', error)
      setError(error.message || 'Invalid username or password')
    } finally {
      setLoading(false)
    }
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
          {/* Authentication Method Selector */}
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Authentication Method</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={authMethod === 'auto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAuthMethod('auto')}
                className="flex-1"
              >
                Auto
              </Button>
              <Button
                type="button"
                variant={authMethod === 'database' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAuthMethod('database')}
                className="flex-1"
              >
                <Database className="w-3 h-3 mr-1" />
                Database
              </Button>
              <Button
                type="button"
                variant={authMethod === 'localStorage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAuthMethod('localStorage')}
                className="flex-1"
              >
                <HardDrive className="w-3 h-3 mr-1" />
                Local
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {authMethod === 'auto' && 'Try database first, fallback to localStorage'}
              {authMethod === 'database' && 'Use database authentication only'}
              {authMethod === 'localStorage' && 'Use localStorage authentication only'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email</Label>
              <Input
                id="username"
                name="username"
                type="email"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
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
            <p className="text-sm font-medium mb-2">Available Accounts (23 Total):</p>
            
            {/* Admin Account */}
            <div className="mb-3">
              <p className="text-xs font-medium text-blue-600 mb-1">Admin Account:</p>
              <div className="text-xs space-y-1">
                <div><strong>Brian Curtis:</strong> brian@searchnwa.com / admin123</div>
              </div>
            </div>

            {/* Demo Accounts */}
            <div className="mb-3">
              <p className="text-xs font-medium text-green-600 mb-1">Demo Accounts:</p>
              <div className="text-xs space-y-1">
                <div><strong>John Doe:</strong> john@example.com / john123</div>
                <div><strong>Jane Smith:</strong> jane@example.com / jane123</div>
              </div>
            </div>

            {/* SearchNWA Team */}
            <div className="mb-3">
              <p className="text-xs font-medium text-purple-600 mb-1">SearchNWA Team (20 members):</p>
              <div className="text-xs space-y-1 max-h-32 overflow-y-auto">
                <div><strong>Brandon Hollis:</strong> brandon@searchnwa.com / temp123</div>
                <div><strong>Carl DeBose:</strong> ccarl@searchnwa.com / temp123</div>
                <div><strong>Chris Adams:</strong> chris@searchnwa.com / temp123</div>
                <div><strong>Christopher Lee:</strong> chrislee@searchnwa.com / temp123</div>
                <div><strong>Cindy Schell:</strong> cindy@searchnwa.com / temp123</div>
                <div><strong>Eujeanie Luker:</strong> eujeanie@searchnwa.com / temp123</div>
                <div><strong>Frank Cardinale:</strong> frank@searchnwa.com / temp123</div>
                <div><strong>Grayson Geurin:</strong> grayson@searchnwa.com / temp123</div>
                <div><strong>Jacob Fitzgerald:</strong> jacob@searchnwa.com / temp123</div>
                <div><strong>Kimberly Carter:</strong> kim@searchnwa.com / temp123</div>
                <div><strong>Landon Burkett:</strong> landon@searchnwa.com / temp123</div>
                <div><strong>Luis Jimenez:</strong> luis@searchnwa.com / temp123</div>
                <div><strong>Michael Lyman:</strong> michael@searchnwa.com / temp123</div>
                <div><strong>Michelle Harrison:</strong> michelle@searchnwa.com / temp123</div>
                <div><strong>Mitch Sluyter:</strong> mitch@searchnwa.com / temp123</div>
                <div><strong>Lyndsi Sluyter:</strong> lyndsi@searchnwa.com / temp123</div>
                <div><strong>Patrick Foresee:</strong> patrick@searchnwa.com / temp123</div>
                <div><strong>William Burchit:</strong> bill@searchnwa.com / temp123</div>
                <div><strong>Natalie Burchit:</strong> natalie@searchnwa.com / temp123</div>
                <div><strong>Thomas Francis:</strong> thomas@searchnwa.com / temp123</div>
              </div>
            </div>

            <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
              <p><strong>Total:</strong> 23 team members available for login</p>
              <p><strong>Note:</strong> All SearchNWA team members use password: temp123</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default LoginPage

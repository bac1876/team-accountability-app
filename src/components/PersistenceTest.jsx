import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { CheckCircle, XCircle, Clock, Database, HardDrive, Plus, Trash2 } from 'lucide-react'
import { commitmentService, goalService, userService } from '../services/databaseService.js'
import { userDataStore } from '../utils/dataStore.js'

const PersistenceTest = () => {
  const [testResults, setTestResults] = useState([])
  const [testing, setTesting] = useState(false)
  const [testData, setTestData] = useState({
    commitment: '',
    goal: '',
    testUserId: null
  })
  const [users, setUsers] = useState([])
  const [persistenceMode, setPersistenceMode] = useState('auto') // auto, database, localStorage

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      // Try to load from database first
      const dbUsers = await userService.getAll()
      setUsers(dbUsers)
      if (dbUsers.length > 0) {
        setTestData(prev => ({ ...prev, testUserId: dbUsers[0].id }))
      }
    } catch (error) {
      console.error('Failed to load database users, using localStorage:', error)
      // Fallback to localStorage
      const localUsers = JSON.parse(localStorage.getItem('teamUsers') || '[]')
      setUsers(localUsers)
      if (localUsers.length > 0) {
        setTestData(prev => ({ ...prev, testUserId: localUsers[0].id }))
      }
    }
  }

  const testDatabasePersistence = async (userId, commitment, goal) => {
    const results = []
    const today = new Date().toISOString().split('T')[0]

    try {
      // Test commitment persistence
      const commitmentResult = await commitmentService.save(userId, today, commitment, 'pending')
      results.push({
        operation: 'Save Commitment (DB)',
        success: true,
        data: commitmentResult,
        timestamp: new Date().toISOString()
      })

      // Retrieve commitment
      const retrievedCommitment = await commitmentService.getToday(userId)
      results.push({
        operation: 'Retrieve Commitment (DB)',
        success: retrievedCommitment && retrievedCommitment.commitment_text === commitment,
        data: retrievedCommitment,
        timestamp: new Date().toISOString()
      })

      // Test goal persistence
      const goalResult = await goalService.create(userId, goal)
      results.push({
        operation: 'Save Goal (DB)',
        success: true,
        data: goalResult,
        timestamp: new Date().toISOString()
      })

      // Retrieve goals
      const retrievedGoals = await goalService.getActive(userId)
      const goalExists = retrievedGoals.some(g => g.goal_text === goal)
      results.push({
        operation: 'Retrieve Goal (DB)',
        success: goalExists,
        data: retrievedGoals,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      results.push({
        operation: 'Database Persistence Test',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }

    return results
  }

  const testLocalStoragePersistence = (userId, commitment, goal) => {
    const results = []

    try {
      // Test commitment persistence
      const commitmentResult = userDataStore.addCommitment(userId, commitment)
      results.push({
        operation: 'Save Commitment (LS)',
        success: true,
        data: commitmentResult,
        timestamp: new Date().toISOString()
      })

      // Retrieve commitment
      const userData = userDataStore.getUserData(userId)
      const commitmentExists = userData.commitments.some(c => c.text === commitment)
      results.push({
        operation: 'Retrieve Commitment (LS)',
        success: commitmentExists,
        data: userData.commitments,
        timestamp: new Date().toISOString()
      })

      // Test goal persistence
      const goalResult = userDataStore.addGoal(userId, goal)
      results.push({
        operation: 'Save Goal (LS)',
        success: true,
        data: goalResult,
        timestamp: new Date().toISOString()
      })

      // Retrieve goals
      const updatedUserData = userDataStore.getUserData(userId)
      const goalExists = updatedUserData.goals.some(g => g.text === goal)
      results.push({
        operation: 'Retrieve Goal (LS)',
        success: goalExists,
        data: updatedUserData.goals,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      results.push({
        operation: 'localStorage Persistence Test',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }

    return results
  }

  const runPersistenceTests = async () => {
    if (!testData.testUserId || !testData.commitment || !testData.goal) {
      alert('Please fill in all test data fields')
      return
    }

    setTesting(true)
    setTestResults([])

    const allResults = []
    const timestamp = Date.now()
    const testCommitment = `${testData.commitment} (Test ${timestamp})`
    const testGoal = `${testData.goal} (Test ${timestamp})`

    try {
      // Test database persistence
      if (persistenceMode === 'auto' || persistenceMode === 'database') {
        const dbResults = await testDatabasePersistence(testData.testUserId, testCommitment, testGoal)
        allResults.push(...dbResults)
      }

      // Test localStorage persistence
      if (persistenceMode === 'auto' || persistenceMode === 'localStorage') {
        const lsResults = testLocalStoragePersistence(testData.testUserId, testCommitment, testGoal)
        allResults.push(...lsResults)
      }

      // Test cross-session simulation (reload localStorage)
      if (persistenceMode === 'auto' || persistenceMode === 'localStorage') {
        const reloadedData = userDataStore.getUserData(testData.testUserId)
        allResults.push({
          operation: 'Cross-session Test (LS)',
          success: reloadedData.commitments.length > 0 && reloadedData.goals.length > 0,
          data: { commitments: reloadedData.commitments.length, goals: reloadedData.goals.length },
          timestamp: new Date().toISOString()
        })
      }

    } catch (error) {
      allResults.push({
        operation: 'Persistence Test Suite',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    }

    setTestResults(allResults)
    setTesting(false)
  }

  const clearTestData = async () => {
    try {
      if (persistenceMode === 'auto' || persistenceMode === 'localStorage') {
        // Clear localStorage test data
        const userData = userDataStore.getUserData(testData.testUserId)
        userData.commitments = userData.commitments.filter(c => !c.text.includes('(Test '))
        userData.goals = userData.goals.filter(g => !g.text.includes('(Test '))
        userDataStore.saveUserData(testData.testUserId, userData)
      }

      // Note: Database cleanup would require additional API endpoints
      // For now, we'll just show a message
      alert('Test data cleared from localStorage. Database test data remains for verification.')
    } catch (error) {
      console.error('Failed to clear test data:', error)
    }
  }

  const getStatusIcon = (success) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    )
  }

  const getStatusBadge = (success) => {
    return (
      <Badge variant={success ? 'default' : 'destructive'}>
        {success ? 'Pass' : 'Fail'}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data Persistence Test</CardTitle>
          <CardDescription>
            Test data persistence and cross-session functionality across database and localStorage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Persistence Mode Selector */}
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-sm font-medium mb-2 block">Persistence Mode</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={persistenceMode === 'auto' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPersistenceMode('auto')}
                className="flex-1"
              >
                Auto
              </Button>
              <Button
                type="button"
                variant={persistenceMode === 'database' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPersistenceMode('database')}
                className="flex-1"
              >
                <Database className="w-3 h-3 mr-1" />
                Database
              </Button>
              <Button
                type="button"
                variant={persistenceMode === 'localStorage' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPersistenceMode('localStorage')}
                className="flex-1"
              >
                <HardDrive className="w-3 h-3 mr-1" />
                localStorage
              </Button>
            </div>
          </div>

          {/* Test Data Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="testUser">Test User</Label>
              <select
                id="testUser"
                value={testData.testUserId || ''}
                onChange={(e) => setTestData(prev => ({ ...prev, testUserId: parseInt(e.target.value) }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Select a user</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="commitment">Test Commitment</Label>
              <Input
                id="commitment"
                value={testData.commitment}
                onChange={(e) => setTestData(prev => ({ ...prev, commitment: e.target.value }))}
                placeholder="Enter test commitment"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Test Goal</Label>
            <Textarea
              id="goal"
              value={testData.goal}
              onChange={(e) => setTestData(prev => ({ ...prev, goal: e.target.value }))}
              placeholder="Enter test goal"
              rows={2}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={runPersistenceTests} disabled={testing} className="flex-1">
              {testing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Run Persistence Tests
                </>
              )}
            </Button>
            <Button onClick={clearTestData} variant="outline">
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Test Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Data persistence test results across different storage systems
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testResults.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{result.operation}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.success)}
                        {getStatusBadge(result.success)}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </TableCell>
                    <TableCell className="text-sm">
                      {result.error ? (
                        <span className="text-red-600">{result.error}</span>
                      ) : (
                        <span className="text-green-600">
                          {typeof result.data === 'object' ? 'Data saved/retrieved' : result.data}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Test Summary: {testResults.filter(r => r.success).length} passed, {' '}
                  {testResults.filter(r => !r.success).length} failed out of {testResults.length} operations
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Persistence Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Database Persistence:</strong> Data is stored in Neon PostgreSQL and persists across all sessions and devices.</p>
            <p><strong>localStorage Persistence:</strong> Data is stored in browser localStorage and persists across browser sessions on the same device.</p>
            <p><strong>Cross-session Testing:</strong> Verifies that data remains available after simulated page reloads and user sessions.</p>
            <p><strong>Auto Mode:</strong> Tests both systems to ensure redundancy and fallback capabilities.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PersistenceTest

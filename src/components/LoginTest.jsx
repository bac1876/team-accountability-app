import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { CheckCircle, XCircle, Clock, Database, HardDrive } from 'lucide-react'
import { authService, userService } from '../services/databaseService.js'

const LoginTest = () => {
  const [testResults, setTestResults] = useState([])
  const [testing, setTesting] = useState(false)
  const [databaseUsers, setDatabaseUsers] = useState([])
  const [localStorageUsers, setLocalStorageUsers] = useState([])

  // Test users for authentication
  const testUsers = [
    { email: 'brian@searchnwa.com', password: 'admin123', expectedRole: 'admin', source: 'localStorage' },
    { email: 'brian@searchnwa.com', password: 'temp123', expectedRole: 'admin', source: 'database' },
    { email: 'john@example.com', password: 'john123', expectedRole: 'member', source: 'localStorage' },
    { email: 'john@example.com', password: 'temp123', expectedRole: 'member', source: 'database' },
    { email: 'brandon@searchnwa.com', password: 'temp123', expectedRole: 'member', source: 'database' },
    { email: 'chris@searchnwa.com', password: 'temp123', expectedRole: 'member', source: 'database' },
    { email: 'invalid@test.com', password: 'wrong', expectedRole: null, source: 'both' }
  ]

  const loadUserData = async () => {
    try {
      // Load database users
      const dbUsers = await userService.getAll()
      setDatabaseUsers(dbUsers)
    } catch (error) {
      console.error('Failed to load database users:', error)
      setDatabaseUsers([])
    }

    // Load localStorage users
    const localUsers = JSON.parse(localStorage.getItem('teamUsers') || '[]')
    setLocalStorageUsers(localUsers)
  }

  const testDatabaseAuth = async (email, password) => {
    try {
      const result = await authService.login(email, password)
      return { success: true, user: result.user, method: 'database' }
    } catch (error) {
      return { success: false, error: error.message, method: 'database' }
    }
  }

  const testLocalStorageAuth = (email, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('teamUsers') || '[]')
      const user = users.find(u => u.username === email && u.password === password)
      if (user) {
        return { success: true, user, method: 'localStorage' }
      } else {
        return { success: false, error: 'User not found', method: 'localStorage' }
      }
    } catch (error) {
      return { success: false, error: error.message, method: 'localStorage' }
    }
  }

  const runAuthTests = async () => {
    setTesting(true)
    setTestResults([])
    
    await loadUserData()

    const results = []

    for (const testUser of testUsers) {
      const result = {
        email: testUser.email,
        password: testUser.password,
        expectedRole: testUser.expectedRole,
        source: testUser.source,
        databaseResult: null,
        localStorageResult: null,
        overallStatus: 'pending'
      }

      // Test database authentication
      if (testUser.source === 'database' || testUser.source === 'both') {
        result.databaseResult = await testDatabaseAuth(testUser.email, testUser.password)
      }

      // Test localStorage authentication
      if (testUser.source === 'localStorage' || testUser.source === 'both') {
        result.localStorageResult = testLocalStorageAuth(testUser.email, testUser.password)
      }

      // Determine overall status
      const dbSuccess = result.databaseResult?.success
      const localSuccess = result.localStorageResult?.success
      
      if (testUser.expectedRole === null) {
        // Should fail
        result.overallStatus = (!dbSuccess && !localSuccess) ? 'pass' : 'fail'
      } else {
        // Should succeed with at least one method
        const hasValidAuth = (dbSuccess && result.databaseResult.user.role === testUser.expectedRole) ||
                            (localSuccess && result.localStorageResult.user.role === testUser.expectedRole)
        result.overallStatus = hasValidAuth ? 'pass' : 'fail'
      }

      results.push(result)
    }

    setTestResults(results)
    setTesting(false)
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'fail':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      pass: 'default',
      fail: 'destructive',
      pending: 'secondary'
    }
    return (
      <Badge variant={variants[status] || 'outline'}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Login System Test</CardTitle>
          <CardDescription>
            Test authentication with multiple users across database and localStorage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="font-medium">Database Users</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{databaseUsers.length}</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="w-4 h-4 text-green-600" />
                <span className="font-medium">localStorage Users</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{localStorageUsers.length}</div>
            </div>
          </div>

          <Button onClick={runAuthTests} disabled={testing} className="w-full">
            {testing ? 'Running Tests...' : 'Run Authentication Tests'}
          </Button>
        </CardContent>
      </Card>

      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Authentication test results for various user scenarios
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Password</TableHead>
                  <TableHead>Expected Role</TableHead>
                  <TableHead>Database Auth</TableHead>
                  <TableHead>localStorage Auth</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testResults.map((result, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{result.email}</TableCell>
                    <TableCell className="font-mono text-sm">{result.password}</TableCell>
                    <TableCell>
                      {result.expectedRole ? (
                        <Badge variant={result.expectedRole === 'admin' ? 'default' : 'secondary'}>
                          {result.expectedRole}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Should fail</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.databaseResult ? (
                        <div className="flex items-center gap-1">
                          {result.databaseResult.success ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span className="text-xs">
                            {result.databaseResult.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not tested</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.localStorageResult ? (
                        <div className="flex items-center gap-1">
                          {result.localStorageResult.success ? (
                            <CheckCircle className="w-3 h-3 text-green-600" />
                          ) : (
                            <XCircle className="w-3 h-3 text-red-600" />
                          )}
                          <span className="text-xs">
                            {result.localStorageResult.success ? 'Success' : 'Failed'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not tested</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.overallStatus)}
                        {getStatusBadge(result.overallStatus)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Test Summary: {testResults.filter(r => r.overallStatus === 'pass').length} passed, {' '}
                  {testResults.filter(r => r.overallStatus === 'fail').length} failed out of {testResults.length} tests
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default LoginTest

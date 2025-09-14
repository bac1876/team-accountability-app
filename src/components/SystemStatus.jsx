import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, HardDrive, Users, Globe } from 'lucide-react'
import { userService } from '../services/databaseService.js'
import { userStore } from '../utils/dataStore.js'

const SystemStatus = () => {
  const [status, setStatus] = useState({
    database: { status: 'checking', users: 0, error: null },
    localStorage: { status: 'checking', users: 0, error: null },
    deployment: { status: 'checking', url: null, error: null },
    overall: 'checking'
  })
  const [checking, setChecking] = useState(false)

  useEffect(() => {
    checkSystemStatus()
  }, [])

  const checkDatabaseStatus = async () => {
    try {
      const response = await fetch('/api/database/status')
      const result = await response.json()
      
      if (result.success) {
        const users = await userService.getAll()
        return {
          status: 'healthy',
          users: users.length,
          error: null,
          details: result
        }
      } else {
        return {
          status: 'error',
          users: 0,
          error: result.error || 'Database connection failed',
          details: result
        }
      }
    } catch (error) {
      return {
        status: 'error',
        users: 0,
        error: error.message,
        details: null
      }
    }
  }

  const checkLocalStorageStatus = () => {
    try {
      const users = userStore.getAll()
      const testKey = 'system_status_test'
      
      // Test localStorage write/read
      localStorage.setItem(testKey, 'test')
      const testValue = localStorage.getItem(testKey)
      localStorage.removeItem(testKey)
      
      if (testValue === 'test') {
        return {
          status: 'healthy',
          users: users.length,
          error: null
        }
      } else {
        return {
          status: 'error',
          users: 0,
          error: 'localStorage read/write test failed'
        }
      }
    } catch (error) {
      return {
        status: 'error',
        users: 0,
        error: error.message
      }
    }
  }

  const checkDeploymentStatus = async () => {
    try {
      // Check if we're running in production
      const isProduction = window.location.hostname !== 'localhost'
      const currentUrl = window.location.origin
      
      if (isProduction) {
        // Test a simple API endpoint
        const response = await fetch('/api/database/status')
        const isApiWorking = response.status !== 404
        
        return {
          status: isApiWorking ? 'healthy' : 'warning',
          url: currentUrl,
          error: isApiWorking ? null : 'API endpoints may not be deployed'
        }
      } else {
        return {
          status: 'development',
          url: currentUrl,
          error: null
        }
      }
    } catch (error) {
      return {
        status: 'error',
        url: window.location.origin,
        error: error.message
      }
    }
  }

  const checkSystemStatus = async () => {
    setChecking(true)
    
    try {
      // Run all checks in parallel
      const [dbStatus, lsStatus, deployStatus] = await Promise.all([
        checkDatabaseStatus(),
        checkLocalStorageStatus(),
        checkDeploymentStatus()
      ])

      // Determine overall status
      let overall = 'healthy'
      if (dbStatus.status === 'error' && lsStatus.status === 'error') {
        overall = 'critical'
      } else if (dbStatus.status === 'error' || lsStatus.status === 'error' || deployStatus.status === 'error') {
        overall = 'warning'
      } else if (deployStatus.status === 'warning') {
        overall = 'warning'
      }

      setStatus({
        database: dbStatus,
        localStorage: lsStatus,
        deployment: deployStatus,
        overall
      })
    } catch (error) {
      setStatus(prev => ({
        ...prev,
        overall: 'critical'
      }))
    } finally {
      setChecking(false)
    }
  }

  const getStatusIcon = (statusType) => {
    switch (statusType) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'warning':
      case 'development':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'error':
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <RefreshCw className="w-4 h-4 text-gray-400 animate-spin" />
    }
  }

  const getStatusBadge = (statusType) => {
    const variants = {
      healthy: 'default',
      warning: 'secondary',
      development: 'outline',
      error: 'destructive',
      critical: 'destructive',
      checking: 'outline'
    }
    
    const labels = {
      healthy: 'Healthy',
      warning: 'Warning',
      development: 'Development',
      error: 'Error',
      critical: 'Critical',
      checking: 'Checking...'
    }

    return (
      <Badge variant={variants[statusType] || 'outline'}>
        {labels[statusType] || statusType}
      </Badge>
    )
  }

  const getOverallHealthScore = () => {
    const scores = {
      healthy: 100,
      warning: 75,
      development: 85,
      error: 25,
      critical: 0,
      checking: 50
    }
    
    const dbScore = scores[status.database.status] || 0
    const lsScore = scores[status.localStorage.status] || 0
    const deployScore = scores[status.deployment.status] || 0
    
    return Math.round((dbScore + lsScore + deployScore) / 3)
  }

  const healthScore = getOverallHealthScore()

  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            System Status
          </CardTitle>
          <CardDescription>
            Overall health and status of the Team Accountability application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(status.overall)}
              <span className="font-medium">Overall Status</span>
              {getStatusBadge(status.overall)}
            </div>
            <Button onClick={checkSystemStatus} disabled={checking} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>System Health Score</span>
              <span>{healthScore}%</span>
            </div>
            <Progress value={healthScore} className="w-full" />
          </div>

          {status.overall === 'critical' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Critical system issues detected. Both database and localStorage are experiencing problems.
              </AlertDescription>
            </Alert>
          )}

          {status.overall === 'warning' && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some system components are experiencing issues. The application may have reduced functionality.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Component Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Database Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Database className="w-4 h-4" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              {getStatusIcon(status.database.status)}
              {getStatusBadge(status.database.status)}
            </div>
            
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Users:</span>
                <span className="font-medium">{status.database.users}</span>
              </div>
              {status.database.error && (
                <div className="text-red-600 text-xs">
                  {status.database.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* localStorage Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              localStorage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              {getStatusIcon(status.localStorage.status)}
              {getStatusBadge(status.localStorage.status)}
            </div>
            
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Users:</span>
                <span className="font-medium">{status.localStorage.users}</span>
              </div>
              {status.localStorage.error && (
                <div className="text-red-600 text-xs">
                  {status.localStorage.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Deployment Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Deployment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              {getStatusIcon(status.deployment.status)}
              {getStatusBadge(status.deployment.status)}
            </div>
            
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>URL:</span>
                <span className="font-medium text-xs break-all">
                  {status.deployment.url}
                </span>
              </div>
              {status.deployment.error && (
                <div className="text-red-600 text-xs">
                  {status.deployment.error}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Application</h4>
              <div className="space-y-1 text-muted-foreground">
                <div>Environment: {window.location.hostname === 'localhost' ? 'Development' : 'Production'}</div>
                <div>URL: {window.location.origin}</div>
                <div>Protocol: {window.location.protocol}</div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Browser</h4>
              <div className="space-y-1 text-muted-foreground">
                <div>User Agent: {navigator.userAgent.split(' ')[0]}</div>
                <div>localStorage: {typeof Storage !== 'undefined' ? 'Supported' : 'Not supported'}</div>
                <div>Cookies: {navigator.cookieEnabled ? 'Enabled' : 'Disabled'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SystemStatus

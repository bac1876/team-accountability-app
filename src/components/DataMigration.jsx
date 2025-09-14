import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { CheckCircle, AlertCircle, Database, HardDrive, ArrowRight } from 'lucide-react'
import { migrationService } from '../services/databaseService.js'
import { userStore, userDataStore } from '../utils/dataStore.js'

const DataMigration = ({ onMigrationComplete }) => {
  const [migrationStatus, setMigrationStatus] = useState('idle') // idle, running, completed, error
  const [migrationResults, setMigrationResults] = useState(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState('')
  const [error, setError] = useState(null)

  // Check if there's data to migrate
  const checkLocalStorageData = () => {
    const users = userStore.getAll()
    const hasUserData = users.some(user => {
      const userData = userDataStore.getUserData(user.id)
      return userData.commitments.length > 0 || userData.goals.length > 0 || userData.reflections.length > 0
    })

    return {
      userCount: users.length,
      hasUserData: hasUserData,
      hasData: users.length > 0 || hasUserData
    }
  }

  const localData = checkLocalStorageData()

  const runMigration = async () => {
    setMigrationStatus('running')
    setProgress(0)
    setError(null)

    try {
      setCurrentStep('Analyzing localStorage data...')
      setProgress(10)

      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 500))

      setCurrentStep('Migrating users to database...')
      setProgress(30)

      const results = await migrationService.migrateFromLocalStorage()
      
      setCurrentStep('Migrating commitments and goals...')
      setProgress(60)

      // Another small delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setCurrentStep('Finalizing migration...')
      setProgress(90)

      // Final delay
      await new Promise(resolve => setTimeout(resolve, 500))

      setProgress(100)
      setMigrationResults(results)
      setMigrationStatus('completed')
      setCurrentStep('Migration completed successfully!')

      // Notify parent component
      if (onMigrationComplete) {
        onMigrationComplete(results)
      }

    } catch (error) {
      console.error('Migration failed:', error)
      setError(error.message)
      setMigrationStatus('error')
      setCurrentStep('Migration failed')
    }
  }

  const clearLocalStorage = async () => {
    try {
      await migrationService.clearLocalStorage()
      // Refresh the page to reload with database data
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear localStorage:', error)
      setError('Failed to clear localStorage: ' + error.message)
    }
  }

  if (!localData.hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Migration
          </CardTitle>
          <CardDescription>
            No localStorage data found to migrate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your application is ready to use the database. No migration needed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Data Migration
        </CardTitle>
        <CardDescription>
          Migrate your localStorage data to the database for better persistence and performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Data Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <HardDrive className="w-4 h-4 text-blue-600" />
            <div>
              <div className="font-medium">Local Storage</div>
              <div className="text-sm text-muted-foreground">{localData.userCount} users</div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
            <Database className="w-4 h-4 text-green-600" />
            <div>
              <div className="font-medium">Database</div>
              <div className="text-sm text-muted-foreground">Ready</div>
            </div>
          </div>
        </div>

        {/* Migration Status */}
        {migrationStatus === 'idle' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Found {localData.userCount} users in localStorage. 
                {localData.hasUserData && ' User activity data will also be migrated.'}
              </AlertDescription>
            </Alert>
            
            <div className="flex items-center justify-center gap-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4" />
                <span>localStorage</span>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span>Database</span>
              </div>
            </div>

            <Button onClick={runMigration} className="w-full">
              Start Migration
            </Button>
          </div>
        )}

        {migrationStatus === 'running' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </div>
        )}

        {migrationStatus === 'completed' && migrationResults && (
          <div className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Migration completed successfully! Your data is now stored in the database.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800">Users Migrated</div>
                <div className="text-2xl font-bold text-green-600">
                  {migrationResults.users.migrated}
                </div>
                {migrationResults.users.errors.length > 0 && (
                  <div className="text-sm text-red-600">
                    {migrationResults.users.errors.length} errors
                  </div>
                )}
              </div>
              
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800">Commitments</div>
                <div className="text-2xl font-bold text-green-600">
                  {migrationResults.commitments.migrated}
                </div>
                {migrationResults.commitments.errors.length > 0 && (
                  <div className="text-sm text-red-600">
                    {migrationResults.commitments.errors.length} errors
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Button onClick={clearLocalStorage} variant="outline" className="w-full">
                Clear localStorage & Reload
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                This will remove the old localStorage data and reload the app with database data
              </p>
            </div>
          </div>
        )}

        {migrationStatus === 'error' && (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Migration failed: {error}
              </AlertDescription>
            </Alert>
            
            <Button onClick={runMigration} variant="outline" className="w-full">
              Retry Migration
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default DataMigration

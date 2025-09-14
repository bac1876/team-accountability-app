import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Upload, Users, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { userService } from '../services/databaseService.js'

const UserImport = () => {
  const [importResults, setImportResults] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState([])

  // Predefined SearchNWA team data
  const searchNWATeam = [
    { email: 'brian@searchnwa.com', name: 'Brian Curtis', phone: '+1-555-0101', role: 'admin' },
    { email: 'brandon@searchnwa.com', name: 'Brandon Hollis', phone: '+1-479-685-8754', role: 'member' },
    { email: 'ccarl@searchnwa.com', name: 'Carl DeBose', phone: '+1-479-461-1333', role: 'member' },
    { email: 'chris@searchnwa.com', name: 'Chris Adams', phone: '+1-479-685-8754', role: 'member' },
    { email: 'chrislee@searchnwa.com', name: 'Christopher Lee', phone: '+1-479-685-8754', role: 'member' },
    { email: 'cindy@searchnwa.com', name: 'Cindy Schell', phone: '+1-479-685-8754', role: 'member' },
    { email: 'eujeanie@searchnwa.com', name: 'Eujeanie Luker', phone: '+1-479-685-8754', role: 'member' },
    { email: 'frank@searchnwa.com', name: 'Frank Cardinale', phone: '+1-479-685-8754', role: 'member' },
    { email: 'grayson@searchnwa.com', name: 'Grayson Geurin', phone: '+1-479-685-8754', role: 'member' },
    { email: 'jacob@searchnwa.com', name: 'Jacob Fitzgerald', phone: '+1-479-685-8754', role: 'member' },
    { email: 'kim@searchnwa.com', name: 'Kimberly Carter', phone: '+1-479-685-8754', role: 'member' },
    { email: 'landon@searchnwa.com', name: 'Landon Burkett', phone: '+1-479-685-8754', role: 'member' },
    { email: 'luis@searchnwa.com', name: 'Luis Jimenez', phone: '+1-479-685-8754', role: 'member' },
    { email: 'michael@searchnwa.com', name: 'Michael Lyman', phone: '+1-479-685-8754', role: 'member' },
    { email: 'michelle@searchnwa.com', name: 'Michelle Harrison', phone: '+1-479-685-8754', role: 'member' },
    { email: 'mitch@searchnwa.com', name: 'Mitch Sluyter', phone: '+1-479-685-8754', role: 'member' },
    { email: 'lyndsi@searchnwa.com', name: 'Lyndsi Sluyter', phone: '+1-479-685-8754', role: 'member' },
    { email: 'patrick@searchnwa.com', name: 'Patrick Foresee', phone: '+1-479-685-8754', role: 'member' },
    { email: 'bill@searchnwa.com', name: 'William Burchit', phone: '+1-479-685-8754', role: 'member' },
    { email: 'natalie@searchnwa.com', name: 'Natalie Burchit', phone: '+1-479-685-8754', role: 'member' },
    { email: 'thomas@searchnwa.com', name: 'Thomas Francis', phone: '+1-479-685-8754', role: 'member' },
    // Demo users
    { email: 'john@example.com', name: 'John Doe', phone: '+1-555-0102', role: 'member' },
    { email: 'jane@example.com', name: 'Jane Smith', phone: '+1-555-0103', role: 'member' }
  ]

  const handlePreview = async () => {
    try {
      // Get existing users from database
      const existingUsers = await userService.getAll()
      const existingEmails = new Set(existingUsers.map(u => u.email))
      
      // Mark which users will be added vs already exist
      const preview = searchNWATeam.map(user => ({
        ...user,
        exists: existingEmails.has(user.email),
        willBeAdded: !existingEmails.has(user.email)
      }))
      
      setPreviewData(preview)
      setShowPreview(true)
    } catch (error) {
      console.error('Failed to load preview:', error)
      // Fallback to showing all users as new
      const preview = searchNWATeam.map(user => ({
        ...user,
        exists: false,
        willBeAdded: true
      }))
      setPreviewData(preview)
      setShowPreview(true)
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    
    try {
      const results = []
      let added = 0
      let skipped = 0
      
      for (const user of previewData) {
        if (user.willBeAdded) {
          try {
            const userData = {
              ...user,
              password: 'temp123' // Default password
            }
            await userService.create(userData)
            results.push({ ...user, status: 'added' })
            added++
          } catch (error) {
            if (error.message.includes('already exists') || error.message.includes('duplicate')) {
              results.push({ ...user, status: 'skipped' })
              skipped++
            } else {
              throw error
            }
          }
        } else {
          results.push({ ...user, status: 'skipped' })
          skipped++
        }
      }
      
      setImportResults({ added, skipped, results })
      setIsImporting(false)
      setShowPreview(false)
      
      // Refresh the page to show new users
      setTimeout(() => {
        window.location.reload()
      }, 3000)
      
    } catch (error) {
      console.error('Import failed:', error)
      setIsImporting(false)
      // You might want to show an error message here
    }
  }

  const newUsersToAdd = previewData.filter(user => user.willBeAdded).length
  const existingUsers = previewData.filter(user => user.exists).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">User Import</h2>
        <p className="text-muted-foreground">
          Import team members from the SearchNWA Excel file
        </p>
      </div>

      {/* Import Status */}
      {importResults && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Import completed! Added {importResults.added} users, skipped {importResults.skipped} existing users.
            Page will refresh in 3 seconds to show new users.
          </AlertDescription>
        </Alert>
      )}

      {/* Import Actions */}
      <div className="flex gap-4">
        <Button onClick={handlePreview} variant="outline">
          <Users className="w-4 h-4 mr-2" />
          Preview Import
        </Button>
        
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Import Preview</DialogTitle>
              <DialogDescription>
                Review the users that will be imported from the SearchNWA team list
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">New Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{newUsersToAdd}</div>
                    <p className="text-xs text-muted-foreground">Will be added</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Existing Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{existingUsers}</div>
                    <p className="text-xs text-muted-foreground">Will be skipped</p>
                  </CardContent>
                </Card>
              </div>

              {/* User List */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((user, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        {user.willBeAdded ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Will Add
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Exists
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={isImporting || newUsersToAdd === 0}
              >
                {isImporting ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Import {newUsersToAdd} Users
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="w-5 h-5 mr-2" />
            SearchNWA Team Import
          </CardTitle>
          <CardDescription>
            Import all team members from the provided Excel file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">What will be imported:</h4>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>• 20 team members from SearchNWA</li>
              <li>• All users will have temporary password: <code className="bg-background px-1 rounded">temp123</code></li>
              <li>• Users can change their password after first login</li>
              <li>• Phone numbers formatted for SMS messaging</li>
              <li>• All users assigned as "member" role</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium mb-2 text-blue-800">Note about Eujeanie Luker:</h4>
            <p className="text-sm text-blue-700">
              Eujeanie Luker is already in the system and will be skipped during import to avoid duplicates.
            </p>
          </div>

          {importResults && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Import Results:</h4>
              <div className="space-y-2">
                {importResults.results.map((result, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 rounded border">
                    <span>{result.name} ({result.email})</span>
                    <Badge variant={result.status === 'added' ? 'default' : 'secondary'}>
                      {result.status === 'added' ? 'Added' : 'Skipped'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default UserImport

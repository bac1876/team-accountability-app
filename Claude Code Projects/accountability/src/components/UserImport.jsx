import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog.jsx'
import { Upload, Users, CheckCircle, AlertCircle, Download } from 'lucide-react'
import { importAllUsers, getImportPreview } from '../utils/importUsers.js'

const UserImport = () => {
  const [importResults, setImportResults] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState([])

  const handlePreview = () => {
    const preview = getImportPreview()
    setPreviewData(preview)
    setShowPreview(true)
  }

  const handleImport = async () => {
    setIsImporting(true)
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const results = importAllUsers()
    setImportResults(results)
    setIsImporting(false)
    setShowPreview(false)
    
    // Refresh the page to show new users
    setTimeout(() => {
      window.location.reload()
    }, 3000)
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

// API endpoint for bulk user import
import { userQueries } from '../lib/database.js'

// SearchNWA team data for import
const searchNWATeam = [
  { name: 'Brandon Hollis', email: 'brandon@searchnwa.com', phone: '+1-479-685-8754', password: 'temp123', role: 'member' },
  { name: 'Carl DeBose', email: 'ccarl@searchnwa.com', phone: '+1-479-461-1333', password: 'temp123', role: 'member' },
  { name: 'Chris Adams', email: 'chris@searchnwa.com', phone: '+1-479-270-4146', password: 'temp123', role: 'member' },
  { name: 'Christopher Lee', email: 'chrislee@searchnwa.com', phone: '+1-479-544-3975', password: 'temp123', role: 'member' },
  { name: 'Cindy Schell', email: 'cindy@searchnwa.com', phone: '+1-479-903-3090', password: 'temp123', role: 'member' },
  { name: 'Eujeanie Luker', email: 'eujeanie@searchnwa.com', phone: '+1-479-685-1616', password: 'temp123', role: 'member' },
  { name: 'Frank Cardinale', email: 'frank@searchnwa.com', phone: '+1-479-306-3379', password: 'temp123', role: 'member' },
  { name: 'Grayson Geurin', email: 'grayson@searchnwa.com', phone: '+1-501-316-9384', password: 'temp123', role: 'member' },
  { name: 'Jacob Fitzgerald', email: 'jacob@searchnwa.com', phone: '+1-979-248-9020', password: 'temp123', role: 'member' },
  { name: 'Kimberly Carter', email: 'kim@searchnwa.com', phone: '+1-479-381-2140', password: 'temp123', role: 'member' },
  { name: 'Landon Burkett', email: 'landon@searchnwa.com', phone: '+1-972-567-6204', password: 'temp123', role: 'member' },
  { name: 'Luis Jimenez', email: 'luis@searchnwa.com', phone: '+1-479-366-7956', password: 'temp123', role: 'member' },
  { name: 'Michael Lyman', email: 'michael@searchnwa.com', phone: '+1-479-236-7459', password: 'temp123', role: 'member' },
  { name: 'Michelle Harrison', email: 'michelle@searchnwa.com', phone: '+1-405-757-8999', password: 'temp123', role: 'member' },
  { name: 'Mitch Sluyter', email: 'mitch@searchnwa.com', phone: '+1-479-790-0151', password: 'temp123', role: 'member' },
  { name: 'Lyndsi Sluyter', email: 'lyndsi@searchnwa.com', phone: '+1-479-466-0006', password: 'temp123', role: 'member' },
  { name: 'Patrick Foresee', email: 'patrick@searchnwa.com', phone: '+1-479-368-4477', password: 'temp123', role: 'member' },
  { name: 'William Burchit', email: 'bill@searchnwa.com', phone: '+1-479-270-0716', password: 'temp123', role: 'member' },
  { name: 'Natalie Burchit', email: 'natalie@searchnwa.com', phone: '+1-479-270-0718', password: 'temp123', role: 'member' },
  { name: 'Thomas Francis', email: 'thomas@searchnwa.com', phone: '+1-606-205-4349', password: 'temp123', role: 'member' }
]

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        // Return preview of users to be imported
        const existingUsers = await userQueries.getAll()
        const existingEmails = new Set(existingUsers.map(u => u.email))
        
        const newUsers = searchNWATeam.filter(user => !existingEmails.has(user.email))
        const existingCount = searchNWATeam.length - newUsers.length
        
        res.status(200).json({
          newUsers,
          existingCount,
          totalToImport: newUsers.length
        })
        break

      case 'POST':
        // Perform bulk import
        const results = await userQueries.bulkCreate(searchNWATeam)
        
        const successful = results.filter(r => r.success)
        const failed = results.filter(r => !r.success)
        
        res.status(200).json({
          success: true,
          imported: successful.length,
          skipped: failed.length,
          results: {
            successful: successful.map(r => r.user),
            failed: failed.map(r => ({ email: r.email, error: r.error }))
          }
        })
        break

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Bulk import error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

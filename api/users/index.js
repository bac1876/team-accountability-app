// API endpoint for user management operations
import { userQueries } from '../../src/lib/database.js'

export default async function handler(req, res) {
  try {
    switch (req.method) {
      case 'GET':
        // Get all users
        const users = await userQueries.getAll()
        res.status(200).json(users)
        break

      case 'POST':
        // Create new user
        const userData = req.body
        
        // Validate required fields
        if (!userData.email || !userData.password || !userData.name) {
          return res.status(400).json({ error: 'Email, password, and name are required' })
        }

        try {
          const newUser = await userQueries.create(userData)
          res.status(201).json(newUser)
        } catch (error) {
          if (error.message.includes('duplicate key')) {
            res.status(409).json({ error: 'User with this email already exists' })
          } else {
            throw error
          }
        }
        break

      case 'PUT':
        // Update user
        const { id, ...updateData } = req.body
        
        if (!id) {
          return res.status(400).json({ error: 'User ID is required' })
        }

        const updatedUser = await userQueries.update(id, updateData)
        if (!updatedUser) {
          return res.status(404).json({ error: 'User not found' })
        }
        
        res.status(200).json(updatedUser)
        break

      case 'DELETE':
        // Delete user
        const { userId } = req.query
        
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' })
        }

        await userQueries.delete(userId)
        res.status(200).json({ success: true })
        break

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('User API error:', error)
    res.status(500).json({ error: 'Internal server error', details: error.message })
  }
}

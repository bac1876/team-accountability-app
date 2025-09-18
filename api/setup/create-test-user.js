// API endpoint to create test user
import { userQueries } from '../lib/database.js'

export default async function handler(req, res) {
  // Only allow in development or with secret key
  const secret = req.query.secret
  if (secret !== 'create-test-user-2025') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    // Check if user already exists
    const existingUser = await userQueries.getByEmail('bob@searchnwa.com')

    if (existingUser) {
      return res.status(200).json({
        message: 'User already exists',
        user: existingUser
      })
    }

    // Create the test user
    const newUser = await userQueries.create({
      email: 'bob@searchnwa.com',
      password: 'pass123',
      name: 'Bob',
      phone: '',
      role: 'member'
    })

    res.status(201).json({
      success: true,
      message: 'Test user created successfully',
      user: newUser
    })
  } catch (error) {
    console.error('Error creating test user:', error)
    res.status(500).json({
      error: 'Failed to create test user',
      details: error.message
    })
  }
}
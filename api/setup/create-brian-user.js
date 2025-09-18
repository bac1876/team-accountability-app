// API endpoint to create Brian's user account
import { userQueries } from '../lib/database.js'

export default async function handler(req, res) {
  // Only allow with secret key
  const secret = req.query.secret
  if (secret !== 'create-brian-2025') {
    return res.status(403).json({ error: 'Forbidden' })
  }

  try {
    // Check if user already exists
    const existingUser = await userQueries.getByEmail('brian@searchnwa.com')

    if (existingUser) {
      return res.status(200).json({
        message: 'User already exists',
        user: existingUser
      })
    }

    // Create Brian's user account
    const newUser = await userQueries.create({
      email: 'brian@searchnwa.com',
      password: 'Lbbc#2245',
      name: 'Brian',
      phone: '',
      role: 'admin'  // Setting as admin since you're the owner
    })

    res.status(201).json({
      success: true,
      message: 'Brian user created successfully',
      user: newUser
    })
  } catch (error) {
    console.error('Error creating Brian user:', error)
    res.status(500).json({
      error: 'Failed to create user',
      details: error.message
    })
  }
}
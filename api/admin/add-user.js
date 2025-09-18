// API endpoint to add new user (admin only)
import { userQueries } from '../lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password, name, phone, role = 'member' } = req.body

  // Validation
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required' })
  }

  try {
    // Check if email already exists
    const existingUser = await userQueries.getByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    // Create new user
    const newUser = await userQueries.create({
      email,
      password,
      name,
      phone: phone || '',
      role
    })

    // Remove password from response
    const { password: _, ...safeUser } = newUser

    res.status(201).json({
      success: true,
      user: safeUser
    })
  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({
      error: 'Failed to create user',
      details: error.message
    })
  }
}
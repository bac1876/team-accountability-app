// API endpoint to update user information (admin only)
import { userQueries } from '../lib/database.js'

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { userId, email, password, name, phone, role } = req.body

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' })
  }

  try {
    // Get existing user
    const existingUser = await userQueries.getById(userId)

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await userQueries.getByEmail(email)
      if (emailTaken) {
        return res.status(400).json({ error: 'Email already exists' })
      }
    }

    // Update user with provided fields or keep existing values
    const updatedUser = await userQueries.update(userId, {
      email: email || existingUser.email,
      password: password || existingUser.password, // Only update if new password provided
      name: name || existingUser.name,
      phone: phone !== undefined ? phone : existingUser.phone,
      role: role || existingUser.role
    })

    // Remove password from response
    const { password: _, ...safeUser } = updatedUser

    res.status(200).json({
      success: true,
      user: safeUser
    })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({
      error: 'Failed to update user',
      details: error.message
    })
  }
}
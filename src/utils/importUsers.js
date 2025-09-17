// User import utility for bulk adding users to the Team Accountability app
import { userStore } from './dataStore.js'

// New users from Excel file
const newUsers = [
  {
    "id": 4,
    "username": "brandon@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Brandon Hollis",
    "email": "brandon@searchnwa.com",
    "phone": "+1-479-685-8754"
  },
  {
    "id": 5,
    "username": "ccarl@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Carl DeBose",
    "email": "ccarl@searchnwa.com",
    "phone": "+1-479-461-1333"
  },
  {
    "id": 6,
    "username": "chris@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Chris Adams",
    "email": "chris@searchnwa.com",
    "phone": "+1-479-270-4146"
  },
  {
    "id": 7,
    "username": "chrislee@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Christopher Lee",
    "email": "chrislee@searchnwa.com",
    "phone": "+1-479-544-3975"
  },
  {
    "id": 8,
    "username": "cindy@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Cindy Schell",
    "email": "cindy@searchnwa.com",
    "phone": "+1-479-903-3090"
  },
  {
    "id": 9,
    "username": "eujeanie@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Eujeanie Luker",
    "email": "eujeanie@searchnwa.com",
    "phone": "+1-479-685-1616"
  },
  {
    "id": 10,
    "username": "frank@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Frank Cardinale",
    "email": "frank@searchnwa.com",
    "phone": "+1-479-306-3379"
  },
  {
    "id": 11,
    "username": "grayson@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Grayson Geurin",
    "email": "grayson@searchnwa.com",
    "phone": "+1-501-316-9384"
  },
  {
    "id": 12,
    "username": "jacob@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Jacob Fitzgerald",
    "email": "jacob@searchnwa.com",
    "phone": "+1-979-248-9020"
  },
  {
    "id": 13,
    "username": "kim@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Kimberly Carter",
    "email": "kim@searchnwa.com",
    "phone": "+1-479-381-2140"
  },
  {
    "id": 14,
    "username": "landon@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Landon Burkett",
    "email": "landon@searchnwa.com",
    "phone": "+1-972-567-6204"
  },
  {
    "id": 15,
    "username": "luis@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Luis Jimenez",
    "email": "luis@searchnwa.com",
    "phone": "+1-479-366-7956"
  },
  {
    "id": 16,
    "username": "michael@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Michael Lyman",
    "email": "michael@searchnwa.com",
    "phone": "+1-479-236-7459"
  },
  {
    "id": 17,
    "username": "michelle@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Michelle Harrison",
    "email": "michelle@searchnwa.com",
    "phone": "+1-405-757-8999"
  },
  {
    "id": 18,
    "username": "mitch@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Mitch Sluyter",
    "email": "mitch@searchnwa.com",
    "phone": "+1-479-790-0151"
  },
  {
    "id": 19,
    "username": "lyndsi@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Lyndsi Sluyter",
    "email": "lyndsi@searchnwa.com",
    "phone": "+1-479-466-0006"
  },
  {
    "id": 20,
    "username": "patrick@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Patrick Foresee",
    "email": "patrick@searchnwa.com",
    "phone": "+1-479-368-4477"
  },
  {
    "id": 21,
    "username": "bill@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "William Burchit",
    "email": "bill@searchnwa.com",
    "phone": "+1-479-270-0716"
  },
  {
    "id": 22,
    "username": "natalie@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Natalie Burchit",
    "email": "natalie@searchnwa.com",
    "phone": "+1-479-270-0718"
  },
  {
    "id": 23,
    "username": "thomas@searchnwa.com",
    "password": "temp123",
    "role": "member",
    "name": "Thomas Francis",
    "email": "thomas@searchnwa.com",
    "phone": "+1-606-205-4349"
  }
]

// Function to import all users
export const importAllUsers = () => {
  const existingUsers = userStore.getAll()
  const existingEmails = existingUsers.map(user => user.email.toLowerCase())
  
  let addedCount = 0
  let skippedCount = 0
  const results = []

  newUsers.forEach(user => {
    // Check if user already exists by email
    if (existingEmails.includes(user.email.toLowerCase())) {
      skippedCount++
      results.push({
        name: user.name,
        email: user.email,
        status: 'skipped',
        reason: 'Email already exists'
      })
    } else {
      // Add the user
      const allUsers = userStore.getAll()
      const newId = Math.max(...allUsers.map(u => u.id), 0) + 1
      const userToAdd = { ...user, id: newId }
      
      allUsers.push(userToAdd)
      userStore.save(allUsers)
      
      addedCount++
      results.push({
        name: user.name,
        email: user.email,
        status: 'added',
        reason: 'Successfully added'
      })
    }
  })

  return {
    total: newUsers.length,
    added: addedCount,
    skipped: skippedCount,
    results: results
  }
}

// Function to get import preview
export const getImportPreview = () => {
  const existingUsers = userStore.getAll()
  const existingEmails = existingUsers.map(user => user.email.toLowerCase())
  
  return newUsers.map(user => ({
    name: user.name,
    email: user.email,
    phone: user.phone,
    willBeAdded: !existingEmails.includes(user.email.toLowerCase()),
    exists: existingEmails.includes(user.email.toLowerCase())
  }))
}

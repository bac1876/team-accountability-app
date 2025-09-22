// Debug streak calculation for Brian
const fetch = require('node-fetch')

async function debugStreak() {
  try {
    // Login as Brian
    console.log('1. Logging in as Brian...')
    const loginResponse = await fetch('https://communitynwa.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'brian@searchnwa.com',
        password: 'Lbbc#2245'
      })
    })

    if (!loginResponse.ok) {
      throw new Error('Login failed')
    }

    const { user } = await loginResponse.json()
    console.log(`Logged in as: ${user.name} (ID: ${user.id})`)

    // Fetch commitments
    console.log('\n2. Fetching commitments...')
    const commitmentsResponse = await fetch(`https://communitynwa.com/api/commitments?userId=${user.id}&isAdmin=false`)

    if (!commitmentsResponse.ok) {
      throw new Error('Failed to fetch commitments')
    }

    const commitments = await commitmentsResponse.json()
    console.log(`Total commitments: ${commitments.length}`)

    // Show completed commitments
    const completed = commitments.filter(c => c.status === 'completed')
    console.log(`\n3. Completed commitments: ${completed.length}`)

    // Sort by date and show
    const sorted = completed.sort((a, b) => new Date(b.commitment_date) - new Date(a.commitment_date))

    console.log('\nCompleted commitments by date:')
    sorted.forEach(c => {
      const date = new Date(c.commitment_date)
      const dateStr = c.commitment_date.split('T')[0]
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]
      console.log(`  ${dateStr} (${dayOfWeek}): ${c.commitment_text.substring(0, 50)}...`)
    })

    // Calculate streak manually
    console.log('\n4. Calculating streak manually...')
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let currentDate = new Date(today)

    // Skip weekends
    while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
      currentDate.setDate(currentDate.getDate() - 1)
    }

    console.log(`Starting from: ${currentDate.toISOString().split('T')[0]}`)

    while (currentDate >= new Date('2024-01-01')) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const dayOfWeek = currentDate.getDay()

      // Only count weekdays
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        // Check if there's a completed commitment for this date
        const hasCompleted = sorted.some(c => {
          const commitDateStr = c.commitment_date.split('T')[0]
          return commitDateStr === dateStr
        })

        if (hasCompleted) {
          streak++
          console.log(`  ${dateStr}: ✓ Completed (streak: ${streak})`)
        } else {
          // If today and no completion yet, continue
          if (dateStr === today.toISOString().split('T')[0]) {
            console.log(`  ${dateStr}: - Today, no completion yet`)
          } else if (streak > 0) {
            console.log(`  ${dateStr}: ✗ Streak broken`)
            break
          } else {
            console.log(`  ${dateStr}: - No commitment`)
          }
        }
      }

      currentDate.setDate(currentDate.getDate() - 1)
    }

    console.log(`\nFinal calculated streak: ${streak} days`)

  } catch (error) {
    console.error('Error:', error)
  }
}

debugStreak()
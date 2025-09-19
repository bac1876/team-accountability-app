// Test to verify commitment display issue
import fetch from 'node-fetch'

const API_URL = 'https://communitynwa.com'

async function testCommitmentDisplay() {
  console.log('=== Testing Commitment Display Issue ===\n')

  try {
    // Login as Brian
    console.log('1. Logging in as Brian...')
    const loginResponse = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'ba1876@gmail.com',
        password: 'Lbbc#2245'
      })
    })

    const loginData = await loginResponse.json()
    console.log('Login successful:', loginData.user.name)
    const userId = loginData.user.id

    // Get all commitments
    console.log('\n2. Fetching all commitments...')
    const commitmentsResponse = await fetch(`${API_URL}/api/commitments?userId=${userId}`)
    const commitments = await commitmentsResponse.json()

    console.log(`Total commitments found: ${commitments.length}`)

    // Show recent commitments
    console.log('\n3. Recent commitments (last 10):')
    const recentCommitments = commitments
      .sort((a, b) => new Date(b.commitment_date) - new Date(a.commitment_date))
      .slice(0, 10)

    recentCommitments.forEach(c => {
      console.log(`  - ${c.commitment_date}: "${c.commitment_text}" [${c.status}]`)
    })

    // Check January 18, 2025 specifically
    console.log('\n4. Checking January 18, 2025 commitment:')
    const jan18Commitment = commitments.find(c => c.commitment_date === '2025-01-18')
    if (jan18Commitment) {
      console.log('  Found commitment:')
      console.log(`    Text: "${jan18Commitment.commitment_text}"`)
      console.log(`    Status: ${jan18Commitment.status}`)
      console.log(`    ID: ${jan18Commitment.id}`)
    } else {
      console.log('  No commitment found for 2025-01-18')
    }

    // Check current week (for debugging)
    console.log('\n5. Current week analysis:')
    const today = new Date()
    const currentWeekStart = new Date(today)
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1) // Monday
    const currentWeekEnd = new Date(currentWeekStart)
    currentWeekEnd.setDate(currentWeekStart.getDate() + 4) // Friday

    const formatDate = (date) => {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    console.log(`  Current week: ${formatDate(currentWeekStart)} to ${formatDate(currentWeekEnd)}`)
    console.log(`  Today: ${formatDate(today)}`)

    // Check if week calculation would include January 18
    const jan18 = new Date('2025-01-18')
    console.log(`\n6. January 18, 2025 week analysis:`)
    const jan18WeekStart = new Date(jan18)
    jan18WeekStart.setDate(jan18.getDate() - jan18.getDay() + 1) // Monday of that week
    const jan18WeekEnd = new Date(jan18WeekStart)
    jan18WeekEnd.setDate(jan18WeekStart.getDate() + 4) // Friday of that week

    console.log(`  Week containing Jan 18: ${formatDate(jan18WeekStart)} to ${formatDate(jan18WeekEnd)}`)
    console.log(`  Day of week: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][jan18.getDay()]}`)

    // Get commitments for that specific week
    const jan18WeekCommitments = commitments.filter(c => {
      const date = new Date(c.commitment_date + 'T00:00:00')
      return date >= jan18WeekStart && date <= jan18WeekEnd
    })

    console.log(`\n7. Commitments in Jan 18's week:`)
    jan18WeekCommitments.forEach(c => {
      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(c.commitment_date + 'T00:00:00').getDay()]
      console.log(`  ${dayName} ${c.commitment_date}: "${c.commitment_text}" [${c.status}]`)
    })

  } catch (error) {
    console.error('Error:', error.message)
  }
}

testCommitmentDisplay()
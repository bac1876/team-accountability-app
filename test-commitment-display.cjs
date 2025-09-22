// Test commitment display issue
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args))

async function testCommitmentDisplay() {
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
      const errorText = await loginResponse.text()
      console.log('Login response status:', loginResponse.status)
      console.log('Login response:', errorText)
      throw new Error(`Login failed: ${loginResponse.status}`)
    }

    const { user } = await loginResponse.json()
    console.log(`Logged in as: ${user.name} (ID: ${user.id})`)

    // Test dates
    const dates = [
      '2025-09-19',  // Friday - should have "hgjyhjgj" commitment
      '2025-09-18',  // Thursday
      '2025-09-17',  // Wednesday
      '2025-09-22'   // Today (Sunday)
    ]

    console.log('\n2. Testing commitment retrieval by date...')
    for (const date of dates) {
      // Get commitment using the API endpoint used by CommitmentsSection
      const response = await fetch(`https://communitynwa.com/api/commitments?userId=${user.id}&date=${date}`)

      if (!response.ok) {
        console.log(`  ${date}: API error (${response.status})`)
        continue
      }

      const commitment = await response.json()
      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(date + 'T00:00:00').getDay()]

      if (commitment && commitment.commitment_text) {
        console.log(`  ${date} (${dayOfWeek}): ✓ Found - "${commitment.commitment_text.substring(0, 30)}..." (${commitment.status})`)
      } else {
        console.log(`  ${date} (${dayOfWeek}): ✗ No commitment found`)
      }
    }

    // Also get all commitments to compare
    console.log('\n3. Getting all commitments...')
    const allResponse = await fetch(`https://communitynwa.com/api/commitments?userId=${user.id}&isAdmin=false`)

    if (!allResponse.ok) {
      throw new Error('Failed to fetch all commitments')
    }

    const allCommitments = await allResponse.json()
    console.log(`Total commitments: ${allCommitments.length}`)

    // Check specifically for Sep 19
    const sep19Commitments = allCommitments.filter(c => {
      const commitDateStr = c.commitment_date.split('T')[0]
      return commitDateStr === '2025-09-19'
    })

    if (sep19Commitments.length > 0) {
      console.log('\n4. Sep 19 commitments found in all commitments:')
      sep19Commitments.forEach(c => {
        console.log(`  - "${c.commitment_text}" (status: ${c.status}, id: ${c.id})`)
        console.log(`    Full date: ${c.commitment_date}`)
      })
    } else {
      console.log('\n4. No Sep 19 commitments found in all commitments')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

testCommitmentDisplay().catch(console.error)
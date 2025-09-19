// Script to check what commitments are actually in the database
import fetch from 'node-fetch'

const API_URL = 'https://communitynwa.com'

async function checkCommitments() {
  console.log('=== Checking Brian\'s Commitments ===\n')

  try {
    // Login as Brian
    const loginResponse = await fetch(`${API_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'brian@searchnwa.com',
        password: 'Lbbc#2245'
      })
    })

    const loginData = await loginResponse.json()
    console.log('Logged in as:', loginData.user.name)
    const userId = loginData.user.id
    console.log('User ID:', userId)

    // Get all commitments
    const commitmentsResponse = await fetch(`${API_URL}/api/commitments?userId=${userId}`)
    const commitments = await commitmentsResponse.json()

    console.log(`\nTotal commitments found: ${commitments.length}`)

    if (commitments.length > 0) {
      console.log('\nAll commitments:')
      commitments.forEach((c, i) => {
        console.log(`\n${i + 1}. Commitment:`)
        console.log(`   Date: ${c.commitment_date}`)
        console.log(`   Text: "${c.commitment_text}"`)
        console.log(`   Status: ${c.status}`)
        console.log(`   ID: ${c.id}`)
        console.log(`   User ID: ${c.user_id}`)
      })

      // Check for September 2025 commitments
      const sept2025 = commitments.filter(c => c.commitment_date && c.commitment_date.startsWith('2025-09'))
      console.log(`\nSeptember 2025 commitments: ${sept2025.length}`)
      if (sept2025.length > 0) {
        sept2025.forEach(c => {
          console.log(`   - ${c.commitment_date}: "${c.commitment_text}" [${c.status}]`)
        })
      }

      // Check current week (Sept 15-19, 2025)
      const weekDates = ['2025-09-15', '2025-09-16', '2025-09-17', '2025-09-18', '2025-09-19']
      console.log('\nCurrent week (Sept 15-19) commitments:')
      weekDates.forEach(date => {
        const dayCommitment = commitments.find(c => c.commitment_date === date)
        if (dayCommitment) {
          console.log(`   ${date}: "${dayCommitment.commitment_text}" [${dayCommitment.status}]`)
        } else {
          console.log(`   ${date}: No commitment`)
        }
      })
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkCommitments()
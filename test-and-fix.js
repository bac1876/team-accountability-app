import { chromium } from 'playwright'
import fetch from 'node-fetch'

const API_URL = 'https://communitynwa.com'

async function createTestCommitments() {
  console.log('=== Creating Test Commitments for Brian ===\n')

  try {
    // Login as Brian via API
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

    // Create commitments for this week (Sept 15-19, 2025)
    const commitments = [
      { date: '2025-09-15', text: 'Monday: Complete project proposal', status: 'completed' },
      { date: '2025-09-16', text: 'Tuesday: Team meeting prep', status: 'completed' },
      { date: '2025-09-17', text: 'Wednesday: Code review session', status: 'completed' },
      { date: '2025-09-18', text: 'Thursday: Deploy new features', status: 'completed' },
      { date: '2025-09-19', text: 'Friday: Weekly report', status: 'pending' }
    ]

    console.log('\nCreating commitments for the week:')
    for (const commitment of commitments) {
      // First check if commitment exists
      const checkResponse = await fetch(`${API_URL}/api/commitments/user/${userId}/date/${commitment.date}`)
      const existingData = await checkResponse.json()

      if (existingData && !existingData.error) {
        // Update existing commitment
        console.log(`Updating ${commitment.date}: "${commitment.text}" [${commitment.status}]`)
        await fetch(`${API_URL}/api/commitments/${existingData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            commitment_text: commitment.text,
            status: commitment.status
          })
        })
      } else {
        // Create new commitment
        console.log(`Creating ${commitment.date}: "${commitment.text}" [${commitment.status}]`)
        await fetch(`${API_URL}/api/commitments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            commitment_date: commitment.date,
            commitment_text: commitment.text,
            status: commitment.status
          })
        })
      }
    }

    console.log('\n✅ Commitments created/updated successfully')

  } catch (error) {
    console.error('Error:', error.message)
  }
}

async function testWeekOverview() {
  console.log('\n=== Testing Week Overview Display ===\n')

  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    // Navigate to the app
    console.log('1. Navigating to app...')
    await page.goto('https://communitynwa.com')
    await page.waitForTimeout(2000)

    // Login as Brian
    console.log('2. Logging in as Brian...')
    await page.fill('input[placeholder="Enter your email address"]', 'brian@searchnwa.com')
    await page.fill('input[placeholder="Enter your password"]', 'Lbbc#2245')
    await page.click('button:has-text("Sign In")')

    // Wait for dashboard to load
    await page.waitForTimeout(3000)
    console.log('3. Dashboard loaded')

    // Check the week overview at the top
    console.log('\n4. Checking week overview icons...')

    // Look for the week overview grid
    const weekOverview = await page.locator('.grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-5').first()

    // Get all day cards
    const dayCards = await weekOverview.locator('.bg-slate-800\\/50').all()
    console.log(`Found ${dayCards.length} day cards in week overview`)

    // Check each day's status
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    let checkmarkCount = 0
    for (let i = 0; i < dayCards.length && i < 5; i++) {
      const card = dayCards[i]

      // Check for icons
      const hasCheckmark = await card.locator('svg.text-green-400').count() > 0
      const hasXmark = await card.locator('svg.text-red-400').count() > 0
      const hasClock = await card.locator('svg.text-yellow-400').count() > 0
      const hasEmptyCircle = await card.locator('svg.text-slate-500').count() > 0

      const dayText = await card.locator('p.text-xs.font-medium').textContent()
      const dateNum = await card.locator('p.text-sm.font-bold').textContent()

      let status = 'Unknown'
      if (hasCheckmark) {
        status = '✅ Completed'
        checkmarkCount++
      } else if (hasXmark) status = '❌ Missed'
      else if (hasClock) status = '⏰ Pending'
      else if (hasEmptyCircle) status = '⭕ No commitment'

      console.log(`  ${days[i]} (${dateNum}): ${status}`)
    }

    console.log(`\n✅ Total checkmarks found: ${checkmarkCount}`)

    // Check streak display
    const streakText = await page.locator('text=day streak').first().textContent()
    console.log(`\n5. Current streak: ${streakText}`)

    // Take a screenshot
    console.log('\n6. Taking screenshot...')
    await page.screenshot({ path: 'test-results-screenshot.png', fullPage: true })
    console.log('Screenshot saved as test-results-screenshot.png')

    // Return test results
    const success = checkmarkCount >= 3 // We should have at least 3 completed commitments
    if (success) {
      console.log('\n✅ TEST PASSED: Week overview is showing checkmarks correctly!')
    } else {
      console.log('\n❌ TEST FAILED: Expected at least 3 checkmarks but found ' + checkmarkCount)
    }

  } catch (error) {
    console.error('Test failed:', error)
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
  } finally {
    await browser.close()
  }
}

// Run both functions
async function main() {
  await createTestCommitments()
  console.log('\nWaiting 5 seconds for data to propagate...')
  await new Promise(resolve => setTimeout(resolve, 5000))
  await testWeekOverview()
}

main().catch(console.error)
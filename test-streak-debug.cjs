// Debug test to find where streak is getting set to 1
const { chromium } = require('playwright')

async function testStreakDebug() {
  console.log('=== DEBUGGING STREAK CALCULATION ===\n')
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300,
    devtools: true  // Open devtools to see console logs
  })
  const page = await browser.newPage()

  // Listen to console messages
  page.on('console', msg => {
    if (msg.text().includes('streak') || msg.text().includes('Streak')) {
      console.log(`[CONSOLE] ${msg.text()}`)
    }
  })

  try {
    // Login as Brian
    console.log('1. Logging in as Brian...')
    await page.goto('https://communitynwa.com/login', { waitUntil: 'networkidle' })
    await page.fill('input[placeholder*="email" i]', 'brian@searchnwa.com')
    await page.fill('input[type="password"]', 'Lbbc#2245')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)

    // Go to dashboard
    console.log('\n2. Navigating to dashboard...')
    await page.click('text="Dashboard"')
    await page.waitForTimeout(2000)

    // Check what the API returns for commitments
    console.log('\n3. Checking API responses...')

    // Intercept API calls
    page.on('response', async response => {
      const url = response.url()
      if (url.includes('/api/commitments') || url.includes('/api/streak')) {
        console.log(`\n[API] ${url}`)
        try {
          const json = await response.json()
          console.log('[RESPONSE]', JSON.stringify(json, null, 2))
        } catch (e) {
          console.log('[RESPONSE] Non-JSON response')
        }
      }
    })

    // Refresh to trigger API calls
    await page.reload({ waitUntil: 'networkidle' })
    await page.waitForTimeout(3000)

    // Check the streak display
    console.log('\n4. Checking streak display...')
    const streakCard = await page.locator('.rounded-xl').filter({ hasText: 'Commitment Streak' }).first()

    if (await streakCard.count() > 0) {
      const streakBadge = await streakCard.locator('.text-lg').first()
      const streakText = await streakBadge.textContent()
      console.log(`   Streak shows: "${streakText}"`)

      // Extract the actual number
      const match = streakText.match(/(\d+)/)
      const streakValue = match ? parseInt(match[1]) : null
      console.log(`   Parsed value: ${streakValue}`)
    }

    // Check week overview for completed days
    console.log('\n5. Checking week overview...')
    const weekDays = await page.locator('.text-xs').filter({ hasText: /Mon|Tue|Wed|Thu|Fri/ }).all()

    let completedCount = 0
    for (let i = 0; i < weekDays.length; i++) {
      const dayText = await weekDays[i].textContent()
      const parent = await weekDays[i].locator('..').first()

      // Check for green checkmark
      const hasCheckmark = await parent.locator('svg.text-green-500').count() > 0

      if (hasCheckmark) {
        completedCount++
        console.log(`   ✓ ${dayText} - COMPLETED`)
      } else {
        console.log(`   ○ ${dayText} - Not completed`)
      }
    }

    console.log(`\n   Total completed days: ${completedCount}`)

    // Execute JavaScript to check the actual data
    console.log('\n6. Checking localStorage and React state...')
    const localData = await page.evaluate(() => {
      const commitments = localStorage.getItem('commitments')
      return {
        commitments: commitments ? JSON.parse(commitments) : null,
        user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
      }
    })

    if (localData.commitments) {
      console.log(`   Found ${localData.commitments.length} commitments in localStorage`)

      // Filter for Brian's completed commitments
      const brianCompleted = localData.commitments.filter(c =>
        c.user_id === 1 && c.status === 'completed'
      )
      console.log(`   Brian has ${brianCompleted.length} completed commitments`)

      // Show recent ones
      if (brianCompleted.length > 0) {
        console.log('   Recent completed:')
        brianCompleted.slice(0, 5).forEach(c => {
          console.log(`     - ${c.commitment_date}: ${c.commitment_text?.substring(0, 30)}...`)
        })
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'streak-debug.png', fullPage: true })
    console.log('\nScreenshot saved as streak-debug.png')

  } catch (error) {
    console.error('Error during debug:', error)
    await page.screenshot({ path: 'streak-debug-error.png', fullPage: true })
  } finally {
    console.log('\nPress Ctrl+C to close browser and exit...')
    // Keep browser open for manual inspection
    await new Promise(() => {})  // Never resolves, keeps browser open
  }
}

testStreakDebug().catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})
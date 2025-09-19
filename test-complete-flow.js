import { chromium } from 'playwright'

async function testCompleteFlow() {
  console.log('=== Complete Week Overview Test ===\n')

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

    // Navigate to Commitments section
    console.log('\n4. Navigating to Commitments section...')
    const commitmentNav = await page.locator('text=Commitment').first()
    await commitmentNav.click()
    await page.waitForTimeout(2000)

    // Create commitments for this week
    console.log('\n5. Creating commitments for this week...')

    // Get dates for this week (Sept 15-19, 2025)
    const commitments = [
      { date: '2025-09-17', text: 'Complete code review' },
      { date: '2025-09-18', text: 'Deploy new features' }
    ]

    for (const commitment of commitments) {
      // Navigate to the specific date
      console.log(`   Setting commitment for ${commitment.date}...`)

      // Check if there's a commitment already and update it
      const commitmentTextarea = await page.locator('textarea[placeholder*="What\'s your commitment"]').first()

      if (await commitmentTextarea.count() > 0) {
        await commitmentTextarea.fill(commitment.text)

        // Save the commitment
        const saveButton = await page.locator('button:has-text("Save Commitment")').first()
        if (await saveButton.count() > 0) {
          await saveButton.click()
          console.log(`   ✓ Saved: "${commitment.text}"`)
          await page.waitForTimeout(1000)
        }

        // Mark as completed
        const completeButton = await page.locator('button:has-text("Mark Complete")').first()
        if (await completeButton.count() > 0) {
          await completeButton.click()
          console.log(`   ✓ Marked as completed`)
          await page.waitForTimeout(1000)
        }
      }
    }

    // Go back to dashboard
    console.log('\n6. Navigating back to Dashboard...')
    await page.locator('text=Dashboard').first().click()
    await page.waitForTimeout(3000)

    // Check the week overview at the top
    console.log('\n7. Checking week overview icons...')
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

    // Check streak display
    const streakElement = await page.locator('text=Commitment Streak').first()
    if (await streakElement.count() > 0) {
      const streakCard = await streakElement.locator('..').first()
      const streakText = await streakCard.textContent()
      console.log(`\n8. Streak info: ${streakText}`)
    }

    // Take a final screenshot
    console.log('\n9. Taking final screenshot...')
    await page.screenshot({ path: 'final-test-screenshot.png', fullPage: true })
    console.log('Screenshot saved as final-test-screenshot.png')

    // Summary
    console.log('\n=== TEST RESULTS ===')
    if (checkmarkCount > 0) {
      console.log(`✅ SUCCESS: Found ${checkmarkCount} checkmarks in week overview!`)
    } else {
      console.log(`❌ FAILURE: No checkmarks found in week overview`)
    }

  } catch (error) {
    console.error('Test failed:', error)
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
  } finally {
    await browser.close()
  }
}

testCompleteFlow().catch(console.error)
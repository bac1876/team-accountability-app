import { chromium } from 'playwright'

async function testWeekOverview() {
  console.log('=== Testing Week Overview Display ===\n')

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
      if (hasCheckmark) status = '✅ Completed'
      else if (hasXmark) status = '❌ Missed'
      else if (hasClock) status = '⏰ Pending'
      else if (hasEmptyCircle) status = '⭕ No commitment'

      console.log(`  ${days[i]} (${dateNum}): ${status}`)
    }

    // Navigate to Commitments tab to check data
    console.log('\n5. Navigating to Commitments tab...')
    const commitmentTab = await page.locator('button:has-text("Commitment")').first()
    if (await commitmentTab.count() > 0) {
      await commitmentTab.click()
    } else {
      // Try sidebar navigation
      await page.locator('text=Daily Commitments').click()
    }
    await page.waitForTimeout(2000)

    // Check if there are any commitments displayed
    const progressOverview = await page.locator('text=Progress Overview').count()
    if (progressOverview > 0) {
      const progressText = await page.locator('.bg-purple-50').textContent()
      console.log('\n6. Commitments found:')
      console.log(`  ${progressText}`)
    }

    // Get console logs to see debug output
    page.on('console', msg => {
      if (msg.text().includes('Week Overview Debug:')) {
        console.log('\n7. Debug output from console:')
        console.log(msg.text())
      }
    })

    // Reload to trigger debug logs
    console.log('\n8. Reloading page to capture debug logs...')
    await page.reload()
    await page.waitForTimeout(3000)

    // Take a screenshot
    console.log('\n9. Taking screenshot...')
    await page.screenshot({ path: 'week-overview-test.png', fullPage: true })
    console.log('Screenshot saved as week-overview-test.png')

  } catch (error) {
    console.error('Test failed:', error)
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
  } finally {
    await browser.close()
  }
}

testWeekOverview().catch(console.error)
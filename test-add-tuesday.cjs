// Add Tuesday commitment for Brian to fix streak
const { chromium } = require('playwright')

async function addTuesdayCommitment() {
  console.log('=== ADDING TUESDAY COMMITMENT ===\n')
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  })
  const page = await browser.newPage()

  try {
    // Login as Brian
    console.log('1. Logging in as Brian...')
    await page.goto('https://communitynwa.com/login', { waitUntil: 'networkidle' })
    await page.fill('input[placeholder*="email" i]', 'brian@searchnwa.com')
    await page.fill('input[type="password"]', 'Lbbc#2245')
    await page.click('button[type="submit"]')
    await page.waitForTimeout(3000)

    // Navigate to Commitments
    console.log('2. Navigating to Commitments...')
    await page.click('text="Commitments"')
    await page.waitForTimeout(2000)

    // Navigate to Tuesday (Sept 24)
    console.log('3. Navigating to Tuesday Sept 24...')

    // Click the right arrow to go to Tuesday
    const rightArrow = await page.locator('button').filter({ hasText: '▶' }).first()
    if (await rightArrow.count() > 0) {
      await rightArrow.click()
      await page.waitForTimeout(1500)
    }

    // Check what date we're on
    const dateElement = await page.locator('h2, h3').filter({ hasText: /Tuesday.*Sept.*24|September 24/ }).first()
    if (await dateElement.count() > 0) {
      console.log('   ✓ On Tuesday, September 24')

      // Add a commitment
      console.log('4. Adding commitment for Tuesday...')
      const textarea = await page.locator('textarea[placeholder*="commitment" i]').first()
      await textarea.fill('Complete important tasks and meetings')

      const addButton = await page.locator('button').filter({ hasText: /Add|Save/ }).first()
      await addButton.click()
      await page.waitForTimeout(2000)

      console.log('   ✓ Commitment added')

      // Mark it as complete
      console.log('5. Marking Tuesday commitment as complete...')
      const completeButton = await page.locator('button').filter({ hasText: /Complete|Mark.*Complete/i }).first()
      if (await completeButton.count() > 0) {
        await completeButton.click()
        await page.waitForTimeout(2000)
        console.log('   ✓ Tuesday commitment marked as complete')
      }
    } else {
      console.log('   ❌ Could not navigate to Tuesday Sept 24')
    }

    // Go back to dashboard to check streak
    console.log('\n6. Checking updated streak...')
    await page.click('text="Dashboard"')
    await page.waitForTimeout(2000)

    const streakBadge = await page.locator('.rounded-xl').filter({ hasText: 'Commitment Streak' }).first().locator('.text-lg').first()
    const streakText = await streakBadge.textContent()
    console.log(`   Current streak: ${streakText}`)

    const match = streakText.match(/(\d+)/)
    const streakValue = match ? parseInt(match[1]) : 0

    if (streakValue === 2) {
      console.log('   ✅ SUCCESS! Streak now shows 2 days (Monday + Tuesday)')
    } else {
      console.log(`   ⚠️ Streak still shows ${streakValue} day(s)`)
    }

    // Take screenshot
    await page.screenshot({ path: 'streak-after-tuesday.png', fullPage: true })
    console.log('\nScreenshot saved as streak-after-tuesday.png')

  } catch (error) {
    console.error('Error:', error)
    await page.screenshot({ path: 'add-tuesday-error.png', fullPage: true })
  } finally {
    await browser.close()
  }
}

addTuesdayCommitment().then(() => {
  console.log('\n✅ Test completed')
  process.exit(0)
}).catch(error => {
  console.error('Test failed:', error)
  process.exit(1)
})
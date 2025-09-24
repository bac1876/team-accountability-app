// Test actual streak functionality with Brian's account
const { chromium } = require('playwright')

async function testStreakReal() {
  console.log('=== TESTING ACTUAL STREAK CALCULATION ===\n')
  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
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

    // Go to dashboard
    console.log('2. Navigating to dashboard...')
    await page.click('text="Dashboard"')
    await page.waitForTimeout(2000)

    // Check week overview
    console.log('3. Checking week overview...')
    const weekDays = await page.locator('.text-xs').filter({ hasText: /Mon|Tue|Wed|Thu|Fri/ }).all()

    let completedDays = []
    for (let i = 0; i < weekDays.length; i++) {
      const dayText = await weekDays[i].textContent()
      const parent = await weekDays[i].locator('..').first()

      // Check for green checkmark
      const hasCheckmark = await parent.locator('svg.text-green-500').count() > 0

      if (hasCheckmark) {
        completedDays.push(dayText)
        console.log(`   ✓ ${dayText} - COMPLETED`)
      } else {
        console.log(`   ○ ${dayText} - Not completed`)
      }
    }

    console.log(`\n   Total completed weekdays: ${completedDays.length}`)

    // Check streak display
    console.log('\n4. Checking streak display...')
    const streakBadge = await page.locator('.rounded-xl').filter({ hasText: 'Commitment Streak' }).first().locator('.text-lg').first()
    const streakText = await streakBadge.textContent()
    console.log(`   Current streak shows: ${streakText}`)

    // Extract number from streak
    const streakMatch = streakText.match(/(\d+)\s+Day/)
    const displayedStreak = streakMatch ? parseInt(streakMatch[1]) : 0

    console.log(`\n5. Analysis:`)
    console.log(`   - Consecutive completed days: ${completedDays.length}`)
    console.log(`   - Streak displayed: ${displayedStreak}`)

    if (displayedStreak !== completedDays.length) {
      console.log(`   ❌ ERROR: Streak should be ${completedDays.length} but shows ${displayedStreak}`)
    } else {
      console.log(`   ✅ Streak is correct!`)
    }

    // Take screenshot
    await page.screenshot({ path: 'streak-actual-test.png', fullPage: true })
    console.log('\nScreenshot saved as streak-actual-test.png')

    return displayedStreak === completedDays.length

  } catch (error) {
    console.error('Test failed:', error)
    await page.screenshot({ path: 'streak-test-error.png', fullPage: true })
    return false
  } finally {
    await browser.close()
  }
}

testStreakReal().then(success => {
  console.log(success ? '\n✅ TEST PASSED' : '\n❌ TEST FAILED - STREAK IS INCORRECT')
  process.exit(success ? 0 : 1)
})
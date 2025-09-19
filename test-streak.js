import { chromium } from 'playwright'

async function testStreak() {
  console.log('=== Testing Commitment Streak ===\n')

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

    // Check the commitment streak display
    console.log('\n4. Checking Commitment Streak...')

    // Look for the commitment streak card
    const streakCard = await page.locator('.rounded-xl').filter({ hasText: 'Commitment Streak' }).first()

    if (await streakCard.count() > 0) {
      // Get the streak number
      const streakBadge = await streakCard.locator('.text-lg').first()
      const streakText = await streakBadge.textContent()
      console.log(`   Current streak: ${streakText}`)

      // Get the streak message
      const streakMessage = await streakCard.locator('.text-slate-400').first()
      const messageText = await streakMessage.textContent()
      console.log(`   Message: ${messageText}`)

      // Check if it shows 2 days (for Sept 17 and 18)
      if (streakText.includes('2')) {
        console.log('   ✅ SUCCESS: Streak correctly shows 2 days!')
      } else {
        console.log('   ❌ ISSUE: Streak should show 2 days for Sept 17-18')
      }
    } else {
      console.log('   ❌ ERROR: Could not find Commitment Streak card')
    }

    // Take screenshot
    console.log('\n5. Taking screenshot...')
    await page.screenshot({ path: 'streak-test.png', fullPage: true })
    console.log('Screenshot saved as streak-test.png')

  } catch (error) {
    console.error('Test failed:', error)
    await page.screenshot({ path: 'streak-error.png', fullPage: true })
  } finally {
    console.log('\nClosing browser...')
    await browser.close()
  }
}

testStreak().catch(console.error)
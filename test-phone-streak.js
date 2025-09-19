import { chromium } from 'playwright'

async function testPhoneStreak() {
  console.log('=== Testing Phone Call Streak ===\n')

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

    // Check the phone call streak display
    console.log('\n4. Checking Phone Call Streak...')

    // Look for the phone call streak card
    const streakCard = await page.locator('.rounded-xl').filter({ hasText: 'Phone Call Streak' }).first()

    if (await streakCard.count() > 0) {
      // Get the streak number
      const streakBadge = await streakCard.locator('.text-lg').first()
      const streakText = await streakBadge.textContent()
      console.log(`   Current phone streak: ${streakText}`)

      // Get the streak message
      const streakMessage = await streakCard.locator('.text-slate-400').first()
      const messageText = await streakMessage.textContent()
      console.log(`   Message: ${messageText}`)

      // Check if it shows 2 days (for Sept 17 and 18 with 50+ calls each)
      if (streakText.includes('2')) {
        console.log('   ✅ SUCCESS: Phone streak correctly shows 2 days!')
      } else {
        console.log('   ❌ ISSUE: Phone streak should show 2 days for Sept 17-18 with 50+ calls each')
      }
    } else {
      console.log('   ❌ ERROR: Could not find Phone Call Streak card')
    }

    // Take screenshot
    console.log('\n5. Taking screenshot...')
    await page.screenshot({ path: 'phone-streak-test.png', fullPage: true })
    console.log('Screenshot saved as phone-streak-test.png')

  } catch (error) {
    console.error('Test failed:', error)
    await page.screenshot({ path: 'phone-error.png', fullPage: true })
  } finally {
    console.log('\nClosing browser...')
    await browser.close()
  }
}

testPhoneStreak().catch(console.error)
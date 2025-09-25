import { chromium } from 'playwright'

async function testStreak() {
  console.log('=== Testing Final Streak on Production ===\n')

  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    console.log('1. Navigating to https://communitynwa.com...')
    await page.goto('https://communitynwa.com')
    await page.waitForTimeout(2000)

    console.log('2. Logging in as Brian...')
    await page.fill('input[placeholder="Enter your email address"]', 'brian@searchnwa.com')
    await page.fill('input[placeholder="Enter your password"]', 'Lbbc#2245')
    await page.click('button:has-text("Sign In")')

    await page.waitForTimeout(3000)
    console.log('3. Dashboard loaded\n')

    // Check the commitment streak
    console.log('4. Checking Commitment Streak...')
    const streakCard = await page.locator('.rounded-xl').filter({ hasText: 'Commitment Streak' }).first()

    if (await streakCard.count() > 0) {
      const streakBadge = await streakCard.locator('.text-lg').first()
      const streakText = await streakBadge.textContent()
      console.log(`\n=== STREAK RESULT: ${streakText} ===`)

      // Check for expected value
      if (streakText.includes('2 Days')) {
        console.log('✅ SUCCESS: Streak correctly shows 2 Days!')
        console.log('   Sept 22 (Mon) and Sept 23 (Tue) both completed')
      } else if (streakText.includes('7 Days')) {
        console.log('❌ ISSUE: Streak shows 7 Days')
        console.log('   This means it\'s counting weekend commitments (Sept 15 is Sunday)')
      } else {
        console.log(`⚠️  Unexpected: Streak shows ${streakText}`)
      }
    }

    console.log('\n5. Taking screenshot...')
    await page.screenshot({ path: 'streak-final.png', fullPage: true })

  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    console.log('\nClosing browser...')
    await browser.close()
  }
}

testStreak().catch(console.error)
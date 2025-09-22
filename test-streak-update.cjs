const { chromium } = require('playwright')

async function testStreakUpdate() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    console.log('1. Navigating to login page...')
    await page.goto('https://communitynwa.com/login', { waitUntil: 'networkidle' })

    console.log('2. Logging in as Brian...')
    await page.fill('input[type="email"]', 'brian@searchnwa.com')
    await page.fill('input[type="password"]', 'Lbbc#2245')
    await page.click('button[type="submit"]')

    console.log('3. Waiting for dashboard to load...')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForTimeout(2000)

    console.log('4. Getting initial streak value...')
    const initialStreakElement = await page.locator('text=/\\d+ Day Streak/').first()
    const initialStreakText = await initialStreakElement.textContent()
    const initialStreak = parseInt(initialStreakText.match(/(\d+)/)[1])
    console.log(`Initial streak: ${initialStreak}`)

    console.log('5. Finding Week Overview section...')
    await page.locator('h2:has-text("Week Overview")').waitFor({ timeout: 5000 })

    console.log('6. Finding commitment checkboxes...')
    const checkboxes = await page.locator('.week-overview input[type="checkbox"]').all()

    if (checkboxes.length === 0) {
      console.log('No commitment checkboxes found in week overview')
      await browser.close()
      return
    }

    console.log(`Found ${checkboxes.length} commitment checkboxes`)

    console.log('7. Finding unchecked commitment...')
    let targetCheckbox = null
    for (const checkbox of checkboxes) {
      const isChecked = await checkbox.isChecked()
      if (!isChecked) {
        targetCheckbox = checkbox
        break
      }
    }

    if (!targetCheckbox) {
      console.log('All commitments already completed, unchecking one...')
      targetCheckbox = checkboxes[0]
      await targetCheckbox.click()
      await page.waitForTimeout(1000)
    }

    console.log('8. Marking commitment as complete...')
    await targetCheckbox.click()

    console.log('9. Waiting for streak to update...')
    await page.waitForTimeout(2000)

    console.log('10. Checking updated streak value...')
    const updatedStreakElement = await page.locator('text=/\\d+ Day Streak/').first()
    const updatedStreakText = await updatedStreakElement.textContent()
    const updatedStreak = parseInt(updatedStreakText.match(/(\d+)/)[1])
    console.log(`Updated streak: ${updatedStreak}`)

    console.log('11. Verifying streak updated correctly...')
    if (updatedStreak >= initialStreak) {
      console.log('✅ SUCCESS: Streak updated or maintained correctly')
      console.log(`Streak went from ${initialStreak} to ${updatedStreak}`)
    } else {
      console.log('❌ ISSUE: Streak decreased unexpectedly')
      console.log(`Streak went from ${initialStreak} to ${updatedStreak}`)
    }

    console.log('12. Toggling commitment back to test immediate update...')
    await targetCheckbox.click()
    await page.waitForTimeout(1000)

    const revertedStreakElement = await page.locator('text=/\\d+ Day Streak/').first()
    const revertedStreakText = await revertedStreakElement.textContent()
    const revertedStreak = parseInt(revertedStreakText.match(/(\d+)/)[1])
    console.log(`Reverted streak: ${revertedStreak}`)

    console.log('13. Testing complete!')

  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await browser.close()
  }
}

testStreakUpdate().catch(console.error)
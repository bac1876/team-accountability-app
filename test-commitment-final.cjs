// Final test to verify commitment display after date navigation
const { chromium } = require('playwright')

async function testCommitmentDisplay() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  })
  const page = await browser.newPage()

  try {
    console.log('=== TESTING COMMITMENT DISPLAY AFTER NAVIGATION ===\n')

    // Login
    console.log('1. Logging in...')
    await page.goto('https://communitynwa.com/login', { waitUntil: 'networkidle' })
    await page.locator('input[placeholder*="email" i]').fill('brian@searchnwa.com')
    await page.locator('input[type="password"]').fill('Lbbc#2245')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(3000)

    // Navigate to commitments
    console.log('2. Going to commitments page...')
    await page.locator('text="Commitment"').click()
    await page.waitForTimeout(2000)

    console.log('3. Starting navigation to Sep 19...')

    // Navigate to Sep 19 by clicking left arrow 3 times (from Sep 22 -> Sep 21 -> Sep 20 -> Sep 19)
    for (let i = 0; i < 3; i++) {
      const currentDate = await page.locator('.text-3xl.font-bold.mb-1').textContent()
      console.log(`   Step ${i + 1}: Currently showing "${currentDate}"`)

      const leftArrow = await page.locator('button:has(svg[class*="lucide-chevron-left"])').first()
      await leftArrow.click()
      await page.waitForTimeout(1000)
    }

    const finalDate = await page.locator('.text-3xl.font-bold.mb-1').textContent()
    console.log(`4. Final date after navigation: "${finalDate}"`)

    // Check if we're on Sep 19
    if (finalDate.includes('19') || finalDate.includes('Fri')) {
      console.log('   ✓ Successfully navigated to Sep 19!')
    } else {
      console.log('   ✗ Did not reach Sep 19 as expected')
    }

    // Wait for any data loading
    await page.waitForTimeout(2000)

    // Check what's displayed in the commitments section
    console.log('5. Checking commitment display...')

    // Look for existing commitments
    const commitmentsList = await page.locator('[data-testid="commitments-list"], .space-y-2').last()
    const commitmentItems = await commitmentsList.locator('div[class*="flex items-center gap-3"]').all()

    console.log(`   Found ${commitmentItems.length} commitment items`)

    if (commitmentItems.length > 0) {
      for (let i = 0; i < commitmentItems.length; i++) {
        const commitmentText = await commitmentItems[i].locator('p').first().textContent()
        console.log(`   Commitment ${i + 1}: "${commitmentText}"`)

        if (commitmentText.includes('hgjyhjgj')) {
          console.log('   ✓ FOUND: "hgjyhjgj" commitment is displayed!')
        }
      }
    }

    // Check if Add Commitment form is shown
    const addCommitmentCard = await page.locator('text="Add Commitment"').first()
    if (await addCommitmentCard.isVisible()) {
      console.log('   📝 Add Commitment form is visible')

      // Check if there's a textarea for adding new commitments
      const textarea = await page.locator('textarea[placeholder*="e.g., Complete project"]')
      if (await textarea.isVisible()) {
        console.log('   📄 New commitment textarea is visible and ready for input')
      }
    }

    // Check for empty state
    const emptyState = await page.locator('text="No commitments yet"')
    if (await emptyState.isVisible()) {
      console.log('   ❌ PROBLEM: Empty state showing "No commitments yet"')
      console.log('   This indicates the Sep 19 commitment is not being displayed properly')
    }

    // Take screenshot for debugging
    await page.screenshot({ path: 'sep19-commitment-check.png' })
    console.log('6. Screenshot saved: sep19-commitment-check.png')

    // Also check the browser console for any React errors
    const logs = []
    page.on('console', msg => logs.push(msg.text()))

    // Force a reload to see console logs
    await page.reload()
    await page.waitForTimeout(3000)

    console.log('7. Browser console logs:')
    logs.forEach(log => {
      if (log.includes('error') || log.includes('Error') || log.includes('failed') || log.includes('undefined')) {
        console.log(`   ERROR: ${log}`)
      }
    })

  } catch (error) {
    console.error('\nTest failed with error:', error.message)
    await page.screenshot({ path: 'commitment-test-error.png' })
  } finally {
    await browser.close()
  }
}

testCommitmentDisplay().catch(console.error)
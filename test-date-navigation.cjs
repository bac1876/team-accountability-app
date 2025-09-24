// Test specifically the date navigation functionality
const { chromium } = require('playwright')

async function testDateNavigation() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down to see what's happening
  })
  const page = await browser.newPage()

  try {
    console.log('=== TESTING DATE NAVIGATION ===\n')

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

    // Check initial date
    console.log('3. Checking initial date display...')
    const initialDateText = await page.locator('text=/Today|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/').first().textContent()
    console.log(`   Initial date: "${initialDateText}"`)

    // Take screenshot before clicking
    await page.screenshot({ path: 'before-click.png' })
    console.log('   Screenshot saved: before-click.png')

    // Find and log all buttons on the page
    console.log('4. Finding all buttons...')
    const allButtons = await page.locator('button').all()
    console.log(`   Found ${allButtons.length} buttons total`)

    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const buttonText = await allButtons[i].textContent()
      const isVisible = await allButtons[i].isVisible()
      console.log(`   Button ${i}: "${buttonText}" (visible: ${isVisible})`)
    }

    // Try different ways to find the left arrow
    console.log('5. Trying to find left arrow button...')

    // Method 1: First button
    const firstButton = await page.locator('button').first()
    if (await firstButton.isVisible()) {
      console.log('   Found first button, clicking...')
      await firstButton.click()
      await page.waitForTimeout(1000)

      const newDateText = await page.locator('text=/Today|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/').first().textContent()
      console.log(`   Date after first button click: "${newDateText}"`)

      if (newDateText !== initialDateText) {
        console.log('   ✓ Date changed successfully!')
      } else {
        console.log('   ✗ Date did not change')
      }
    }

    // Take screenshot after clicking
    await page.screenshot({ path: 'after-click.png' })
    console.log('   Screenshot saved: after-click.png')

    // Method 2: Try clicking in the purple header area where arrows should be
    console.log('6. Trying to click in left area of purple header...')
    const purpleHeader = await page.locator('.bg-gradient-to-r').first()
    if (await purpleHeader.isVisible()) {
      const box = await purpleHeader.boundingBox()
      if (box) {
        // Click on the left side of the purple header (where left arrow should be)
        await page.mouse.click(box.x + 50, box.y + box.height / 2)
        await page.waitForTimeout(1000)

        const newDateText2 = await page.locator('text=/Today|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/').first().textContent()
        console.log(`   Date after purple header click: "${newDateText2}"`)
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'final-state.png' })
    console.log('   Screenshot saved: final-state.png')

  } catch (error) {
    console.error('\nTest failed with error:', error.message)
    await page.screenshot({ path: 'error-debug.png' })
    console.log('Error screenshot saved as error-debug.png')
  } finally {
    await browser.close()
  }
}

testDateNavigation().catch(console.error)
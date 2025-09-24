// Test admin dashboard Details functionality after fix
const { chromium } = require('playwright')

async function testAdminDetails() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  })
  const page = await browser.newPage()

  try {
    console.log('=== TESTING ADMIN DASHBOARD DETAILS FUNCTIONALITY ===\n')

    // Login as admin
    console.log('1. Logging in as admin...')
    await page.goto('https://communitynwa.com/login', { waitUntil: 'networkidle' })
    await page.locator('input[placeholder*="email" i]').fill('brian@searchnwa.com')
    await page.locator('input[type="password"]').fill('Lbbc#2245')
    await page.locator('button[type="submit"]').click()
    await page.waitForTimeout(3000)

    // Navigate to Team Overview (Admin dashboard)
    console.log('2. Going to Team Overview (admin dashboard)...')
    await page.locator('text="Team Overview"').click()
    await page.waitForTimeout(2000)

    // Wait for admin dashboard to load
    console.log('3. Waiting for admin dashboard to load...')
    await page.waitForSelector('text="Admin Dashboard"', { timeout: 10000 })
    await page.waitForTimeout(2000)

    // Take screenshot before clicking Details
    await page.screenshot({ path: 'admin-before-details.png' })
    console.log('   Screenshot saved: admin-before-details.png')

    // Find and click the Details button
    console.log('4. Looking for Details button...')
    const detailsButtons = await page.locator('text="Details"').all()
    console.log(`   Found ${detailsButtons.length} Details buttons`)

    if (detailsButtons.length > 0) {
      console.log('5. Clicking the first Details button...')
      await detailsButtons[0].click()
      await page.waitForTimeout(3000)

      // Check for any error dialogs or messages
      const errorDialog = await page.locator('text="The application encountered an error"')
      if (await errorDialog.isVisible()) {
        console.log('   ❌ ERROR: Still getting application error after fix!')

        // Take screenshot of error
        await page.screenshot({ path: 'admin-details-error.png' })
        console.log('   Error screenshot saved: admin-details-error.png')

        return false
      } else {
        console.log('   ✅ SUCCESS: No error dialog appeared!')

        // Check if Details section expanded
        const expandedDetails = await page.locator('text=/Recent Commitments|All Goals|Recent Reflections/')
        if (await expandedDetails.first().isVisible()) {
          console.log('   ✅ SUCCESS: Details section expanded properly!')

          // Check for specific content
          const commitments = await page.locator('text="Recent Commitments"')
          const goals = await page.locator('text="All Goals"')
          const reflections = await page.locator('text="Recent Reflections"')

          if (await commitments.isVisible()) {
            console.log('   ✓ Recent Commitments section visible')
          }
          if (await goals.isVisible()) {
            console.log('   ✓ All Goals section visible')
          }
          if (await reflections.isVisible()) {
            console.log('   ✓ Recent Reflections section visible')
          }

        } else {
          console.log('   ⚠️ WARNING: Details section may not have expanded properly')
        }
      }

      // Take screenshot after clicking Details
      await page.screenshot({ path: 'admin-after-details.png' })
      console.log('   Screenshot saved: admin-after-details.png')

      return true

    } else {
      console.log('   ⚠️ WARNING: No Details buttons found')
      return false
    }

  } catch (error) {
    console.error('\nTest failed with error:', error.message)
    await page.screenshot({ path: 'admin-details-test-error.png' })
    console.log('Error screenshot saved: admin-details-test-error.png')
    return false
  } finally {
    await browser.close()
  }
}

testAdminDetails().then(success => {
  if (success) {
    console.log('\n🎉 ADMIN DETAILS TEST PASSED!')
  } else {
    console.log('\n❌ ADMIN DETAILS TEST FAILED!')
  }
}).catch(console.error)
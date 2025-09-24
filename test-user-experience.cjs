// Test the actual user experience on the live site
const { chromium } = require('playwright')

async function testUserExperience() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down actions to see what's happening
  })
  const page = await browser.newPage()

  try {
    console.log('=== TESTING AS END USER - BRIAN ===\n')

    // 1. Go to the live site
    console.log('1. Going to communitynwa.com...')
    await page.goto('https://communitynwa.com', { waitUntil: 'networkidle', timeout: 60000 })

    // Check if we're redirected to login or already on a page
    const currentUrl = page.url()
    console.log(`   Current URL: ${currentUrl}`)

    // 2. Navigate to login if needed
    if (!currentUrl.includes('/login')) {
      console.log('2. Navigating to login page...')
      // Try to find and click login link/button
      const loginLink = await page.locator('a[href*="login"], button:has-text("Login"), a:has-text("Login")').first()
      if (await loginLink.isVisible()) {
        await loginLink.click()
        await page.waitForURL('**/login', { timeout: 10000 })
      } else {
        // Direct navigation
        await page.goto('https://communitynwa.com/login', { waitUntil: 'networkidle' })
      }
    }

    console.log('3. On login page. Looking for email field...')

    // Wait for the page to be ready and check what's on it
    await page.waitForTimeout(2000)

    // Take a screenshot to see what's on the page
    await page.screenshot({ path: 'login-page.png' })
    console.log('   Screenshot saved as login-page.png')

    // Try different selectors for email field
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[id*="email" i]',
      '#email'
    ]

    let emailField = null
    for (const selector of emailSelectors) {
      try {
        const field = await page.locator(selector).first()
        if (await field.isVisible({ timeout: 1000 })) {
          emailField = field
          console.log(`   Found email field with selector: ${selector}`)
          break
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!emailField) {
      console.log('   ERROR: Could not find email field!')
      console.log('   Page title:', await page.title())
      console.log('   Page URL:', page.url())

      // Log what inputs are on the page
      const inputs = await page.locator('input').all()
      console.log(`   Found ${inputs.length} input fields on page`)
      for (let i = 0; i < Math.min(inputs.length, 5); i++) {
        const type = await inputs[i].getAttribute('type')
        const name = await inputs[i].getAttribute('name')
        const placeholder = await inputs[i].getAttribute('placeholder')
        console.log(`     Input ${i + 1}: type="${type}" name="${name}" placeholder="${placeholder}"`)
      }
      return
    }

    // 4. Fill in login credentials
    console.log('4. Filling in login credentials...')
    await emailField.fill('brian@searchnwa.com')

    // Find password field
    const passwordField = await page.locator('input[type="password"]').first()
    await passwordField.fill('Lbbc#2245')

    // Find and click submit button
    const submitButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first()
    await submitButton.click()

    console.log('5. Waiting for navigation after login...')
    await page.waitForTimeout(3000) // Give it time to redirect

    // Check where we ended up
    const afterLoginUrl = page.url()
    console.log(`   Redirected to: ${afterLoginUrl}`)

    // If we're on admin page, navigate to main dashboard
    if (afterLoginUrl.includes('/admin')) {
      console.log('   Admin page detected, navigating to main dashboard...')
      await page.goto('https://communitynwa.com/dashboard', { waitUntil: 'networkidle' })
      await page.waitForTimeout(2000)
    }

    console.log('6. On dashboard page! Now checking commitments...')

    // Take screenshot of dashboard
    await page.screenshot({ path: 'dashboard.png' })
    console.log('   Screenshot saved as dashboard.png')

    // Click on Commitment in the sidebar to navigate to commitment page
    console.log('7. Clicking on Commitment in sidebar...')
    const commitmentLink = await page.locator('text="Commitment"').first()
    await commitmentLink.click()
    await page.waitForTimeout(2000) // Wait for page to load

    // Take screenshot of commitment page
    await page.screenshot({ path: 'commitment-page.png' })
    console.log('   Screenshot saved as commitment-page.png')

    // Find the date navigation - the page uses arrow buttons to navigate dates
    console.log('\n8. Current date shown: Monday, September 22, 2025')

    // We need to navigate back to Sep 19 (Friday) - that's 3 days back
    console.log('\n9. Navigating to 2025-09-19 (Friday)...')

    // Click the left arrow button 3 times to go back to Friday Sep 19
    // Look for the ChevronLeft icon button in the date navigation
    const leftArrowButton = await page.locator('button').first() // First button in the date navigation

    await leftArrowButton.click()  // Sep 21 (Sunday)
    await page.waitForTimeout(1000)
    await leftArrowButton.click()  // Sep 20 (Saturday)
    await page.waitForTimeout(1000)
    await leftArrowButton.click()  // Sep 19 (Friday)
    await page.waitForTimeout(2000) // Wait for component to update

    // Check what's displayed now
    console.log('10. Checking what displays for Sep 19...')

    // Look for the commitment text
    const commitmentText = await page.locator('text="hgjyhjgj"').first()
    if (await commitmentText.isVisible({ timeout: 3000 })) {
      console.log('   ✓ SUCCESS: "hgjyhjgj" commitment is displayed!')
    } else {
      console.log('   ✗ ISSUE: "hgjyhjgj" commitment NOT displayed')

      // Check if we see "Add Commitment" form instead
      const addForm = await page.locator('textarea[placeholder*="commitment" i], input[placeholder*="commitment" i], button:has-text("Add Commitment")').first()
      if (await addForm.isVisible({ timeout: 1000 })) {
        console.log('   ✗ Shows "Add Commitment" form instead of existing commitment')
      }
    }

    // Take screenshot of Sep 19 view
    await page.screenshot({ path: 'sep-19-view.png' })
    console.log('   Screenshot saved as sep-19-view.png')

    // Check if we can see the date changed
    console.log('\n11. Checking if date changed to Friday...')
    const dateText = await page.locator('text=/Friday|September 19/').first()
    if (await dateText.isVisible({ timeout: 2000 })) {
      console.log('   ✓ Successfully navigated to Friday, September 19')
    } else {
      console.log('   ✗ Date navigation may not have worked as expected')
    }

    console.log('\n=== TEST COMPLETE ===')
    console.log('Screenshots saved: login-page.png, dashboard.png, sep-19-view.png')

  } catch (error) {
    console.error('\nTest failed with error:', error.message)
    await page.screenshot({ path: 'error-screenshot.png' })
    console.log('Error screenshot saved as error-screenshot.png')
  } finally {
    await browser.close()
  }
}

testUserExperience().catch(console.error)
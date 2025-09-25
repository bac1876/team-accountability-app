import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

// Create test results directory
const resultsDir = './test-results'
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir)
}

async function testPhoneCalls() {
  console.log('🚀 Starting Phone Call Functionality Test...\n')

  const browser = await chromium.launch({
    headless: false,  // Show browser for debugging
    slowMo: 500       // Slow down actions to see what's happening
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  })

  const page = await context.newPage()

  // Capture console logs
  const consoleLogs = []
  page.on('console', msg => {
    const logEntry = `[${msg.type()}] ${msg.text()}`
    consoleLogs.push(logEntry)
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text())
    }
  })

  // Capture network errors
  const networkErrors = []
  page.on('requestfailed', request => {
    const error = `Failed: ${request.method()} ${request.url()} - ${request.failure().errorText}`
    networkErrors.push(error)
    console.log('❌ Network Error:', error)
  })

  // Monitor API calls
  const apiCalls = []
  page.on('request', request => {
    if (request.url().includes('/api/phone-calls')) {
      const callInfo = {
        method: request.method(),
        url: request.url(),
        postData: request.postData()
      }
      apiCalls.push(callInfo)
      console.log('📡 API Call:', callInfo)
    }
  })

  page.on('response', response => {
    if (response.url().includes('/api/phone-calls')) {
      console.log(`📡 API Response: ${response.status()} from ${response.url()}`)
    }
  })

  try {
    // Step 1: Navigate to the site
    console.log('Step 1: Navigating to site...')
    await page.goto('https://team-accountability-app.vercel.app/', {
      waitUntil: 'networkidle',
      timeout: 30000
    })
    await page.screenshot({ path: path.join(resultsDir, '1-homepage.png') })

    // Step 2: Login
    console.log('Step 2: Logging in...')
    await page.fill('input[type="text"], input[placeholder*="username" i], input[name="username"]', 'ba1876')
    await page.fill('input[type="password"], input[placeholder*="password" i], input[name="password"]', 'Lbbc#2245')
    await page.click('button:has-text("Login"), button[type="submit"]')

    // Wait for navigation
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(resultsDir, '2-after-login.png') })

    // Step 3: Navigate to Phone Calls
    console.log('Step 3: Navigating to Phone Calls section...')

    // Try clicking on Phone Calls in sidebar or navigation
    const phoneCallsNav = await page.locator('text="Phone Calls"').first()
    if (await phoneCallsNav.isVisible()) {
      await phoneCallsNav.click()
    } else {
      // Try tab if no sidebar link
      const phoneTab = await page.locator('[role="tab"]:has-text("Phone Calls"), button:has-text("Phone Calls")')
      if (await phoneTab.isVisible()) {
        await phoneTab.click()
      }
    }

    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(resultsDir, '3-phone-calls-section.png') })

    // Step 4: Set a goal
    console.log('Step 4: Setting phone call goal...')

    // Find the goal input field
    const goalInputs = await page.locator('input[type="number"]').all()
    console.log(`Found ${goalInputs.length} number inputs`)

    if (goalInputs.length > 0) {
      // First input should be for goal
      await goalInputs[0].fill('50')
      await page.screenshot({ path: path.join(resultsDir, '4a-goal-entered.png') })

      // Click Set Goal button
      const setGoalButton = await page.locator('button:has-text("Set Goal")')
      if (await setGoalButton.isVisible()) {
        console.log('Clicking Set Goal button...')
        await setGoalButton.click()

        // Wait for potential success message
        await page.waitForTimeout(3000)
        await page.screenshot({ path: path.join(resultsDir, '4b-after-set-goal.png') })

        // Check if goal was saved
        const goalDisplay = await page.locator('text=/50.*calls/i')
        if (await goalDisplay.isVisible()) {
          console.log('✅ Goal appears to be set!')
        } else {
          console.log('⚠️ Goal may not have been saved')
        }
      } else {
        console.log('❌ Set Goal button not found')
      }
    } else {
      console.log('❌ No number inputs found for goal')
    }

    // Step 5: Try to log calls
    console.log('Step 5: Attempting to log calls...')

    // Refresh to check persistence
    await page.reload()
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(resultsDir, '5a-after-refresh.png') })

    // Find actual calls input (should be second number input)
    const actualInputs = await page.locator('input[type="number"]').all()
    if (actualInputs.length > 1) {
      await actualInputs[1].fill('45')
      await page.screenshot({ path: path.join(resultsDir, '5b-actual-entered.png') })

      // Try to click Log Calls button
      const logButton = await page.locator('button:has-text("Log Calls")')
      if (await logButton.isVisible()) {
        const isDisabled = await logButton.isDisabled()
        console.log(`Log Calls button disabled: ${isDisabled}`)

        if (!isDisabled) {
          console.log('Clicking Log Calls button...')
          await logButton.click()
          await page.waitForTimeout(3000)
          await page.screenshot({ path: path.join(resultsDir, '5c-after-log-calls.png') })
        } else {
          console.log('❌ Log Calls button is disabled!')
        }
      } else {
        console.log('❌ Log Calls button not found')
      }
    }

    // Final screenshot
    await page.screenshot({ path: path.join(resultsDir, '6-final-state.png') })

    // Report results
    console.log('\n📊 TEST RESULTS:')
    console.log('================')
    console.log(`Console Logs: ${consoleLogs.length} entries`)
    consoleLogs.forEach(log => console.log(`  ${log}`))

    console.log(`\nNetwork Errors: ${networkErrors.length}`)
    networkErrors.forEach(error => console.log(`  ${error}`))

    console.log(`\nAPI Calls to phone-calls: ${apiCalls.length}`)
    apiCalls.forEach(call => {
      console.log(`  ${call.method} ${call.url}`)
      if (call.postData) console.log(`    Body: ${call.postData}`)
    })

    console.log('\n📸 Screenshots saved to ./test-results/')

  } catch (error) {
    console.error('Test failed:', error)
    await page.screenshot({ path: path.join(resultsDir, 'error-state.png') })
  } finally {
    await browser.close()
  }
}

// Run the test
testPhoneCalls().catch(console.error)
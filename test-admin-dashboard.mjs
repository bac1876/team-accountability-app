import { chromium } from 'playwright'

async function testAdminDashboard() {
  console.log('Starting admin dashboard test...')

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  })

  const page = await browser.newPage()

  // Enable console logging
  page.on('console', msg => {
    console.log(`Browser console [${msg.type()}]:`, msg.text())
  })

  // Monitor network requests
  page.on('response', response => {
    if (response.url().includes('/api/')) {
      console.log(`API Response: ${response.url()} - Status: ${response.status()}`)
    }
  })

  try {
    console.log('\n1. Navigating to site...')
    await page.goto('https://team-accountability-app.vercel.app', {
      waitUntil: 'networkidle'
    })
    await page.screenshot({ path: 'admin-test-1-homepage.png' })

    console.log('\n2. Filling login form...')
    // Use placeholder text to find the inputs
    await page.locator('input[placeholder*="email"]').fill('brian@searchnwa.com')
    await page.locator('input[placeholder*="password"]').fill('Lbbc#2245')
    await page.screenshot({ path: 'admin-test-2-login-filled.png' })

    console.log('\n3. Clicking login button...')
    await page.click('button:has-text("Sign In")')

    // Wait for navigation or error
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'admin-test-3-after-login.png' })

    // Check current URL
    const currentUrl = page.url()
    console.log('\n4. Current URL after login:', currentUrl)

    // Check if we're on dashboard
    const isDashboard = currentUrl.includes('dashboard') || currentUrl === 'https://team-accountability-app.vercel.app/'
    console.log('   On dashboard?', isDashboard)

    if (isDashboard || true) { // Force check even if URL doesn't change
      console.log('\n5. Checking for dashboard content...')

      // Wait for dashboard to load
      await page.waitForTimeout(2000)

      // Check for Team Overview tab and click it
      try {
        const teamOverviewTab = await page.locator('button:has-text("Team Overview")').first()
        if (await teamOverviewTab.isVisible()) {
          console.log('\n6. Clicking Team Overview tab...')
          await teamOverviewTab.click()
          await page.waitForTimeout(2000)
          await page.screenshot({ path: 'admin-test-4-team-overview.png' })
        } else {
          console.log('\n6. Team Overview tab not found, checking page content...')
        }
      } catch (e) {
        console.log('\n6. Could not find Team Overview tab')
      }

      // Check for user count in stats cards
      try {
        // Look for the stats cards
        const statsCards = await page.locator('.text-2xl.font-bold').all()
        if (statsCards.length > 0) {
          console.log('\n7. Stats cards found:')
          for (let i = 0; i < statsCards.length; i++) {
            const value = await statsCards[i].textContent()
            console.log(`   Card ${i + 1}: ${value}`)
          }

          // First card should be total users
          const userCount = await statsCards[0].textContent()
          if (userCount === '0') {
            console.log('   ⚠️  WARNING: Dashboard shows 0 users!')
          } else {
            console.log('   ✓  Users are displayed:', userCount)
          }
        } else {
          console.log('\n7. No stats cards found')
        }
      } catch (e) {
        console.log('\n7. Error checking stats:', e.message)
      }

      // Check for team table
      try {
        const teamTable = await page.locator('table').first()
        if (await teamTable.isVisible()) {
          // Count table rows (excluding header)
          const rowCount = await page.locator('tbody tr').count()
          console.log('\n8. Number of users in table:', rowCount)

          if (rowCount === 0) {
            console.log('   ⚠️  WARNING: No users in team table!')
          } else {
            console.log('   ✓  Users found in table')

            // Get first few user names
            const firstUsers = await page.locator('tbody tr').locator('.font-medium').allTextContents()
            console.log('   First users:', firstUsers.slice(0, 5))
          }
        } else {
          console.log('\n8. No team table found on page')
        }
      } catch (e) {
        console.log('\n8. Error checking table:', e.message)
      }

      // Check for any error messages
      const errorElements = await page.locator('text=/error/i').all()
      if (errorElements.length > 0) {
        console.log('\n⚠️  Error messages found on page:')
        for (const error of errorElements) {
          const text = await error.textContent()
          console.log('   -', text)
        }
      }

      // Check if still on login page (login failed)
      const loginButton = await page.locator('button:has-text("Sign In")').first()
      if (await loginButton.isVisible()) {
        console.log('\n⚠️  Still on login page - login failed!')

        // Check for error message
        const errorMsg = await page.locator('.text-red-500, .text-destructive, [role="alert"]').first()
        if (await errorMsg.isVisible()) {
          const errorText = await errorMsg.textContent()
          console.log('   Error message:', errorText)
        }
      }

    }

    console.log('\n10. Test complete! Check screenshots:')
    console.log('    - admin-test-1-homepage.png')
    console.log('    - admin-test-2-login-filled.png')
    console.log('    - admin-test-3-after-login.png')
    console.log('    - admin-test-4-team-overview.png')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message)
    await page.screenshot({ path: 'admin-test-error.png' })
  } finally {
    await browser.close()
  }
}

// Run the test
testAdminDashboard().catch(console.error)
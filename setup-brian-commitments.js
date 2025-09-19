import { chromium } from 'playwright'

async function setupBrianCommitments() {
  console.log('=== Setting up Brian\'s Commitments ===\n')

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

    // Navigate to Commitments section
    console.log('\n4. Navigating to Daily Commitments...')
    // Try clicking on the sidebar link
    const commitmentLink = await page.locator('text=Commitment').first()
    await commitmentLink.click()
    await page.waitForTimeout(2000)

    // Create commitments for Wed (17th) and Thu (18th)
    const dates = [
      { day: 'Wednesday', date: 17, text: 'Complete project documentation' },
      { day: 'Thursday', date: 18, text: 'Deploy application updates' }
    ]

    for (const dateInfo of dates) {
      console.log(`\n5. Setting up ${dateInfo.day} (Sept ${dateInfo.date})...`)

      // Navigate to the specific date by clicking the date navigation
      // First, let's see if we're on the right date
      const dateDisplay = await page.locator('text=September ' + dateInfo.date).count()

      if (dateDisplay === 0) {
        // Navigate to the date - click on Yesterday if needed
        if (dateInfo.date === 18) {
          const yesterdayBtn = await page.locator('button:has-text("Yesterday")').first()
          if (await yesterdayBtn.count() > 0) {
            await yesterdayBtn.click()
            await page.waitForTimeout(1000)
          }
        } else if (dateInfo.date === 17) {
          // Click yesterday twice to get to the 17th
          const yesterdayBtn = await page.locator('button:has-text("Yesterday")').first()
          if (await yesterdayBtn.count() > 0) {
            await yesterdayBtn.click()
            await page.waitForTimeout(1000)
            await yesterdayBtn.click()
            await page.waitForTimeout(1000)
          }
        }
      }

      // Enter the commitment
      const commitmentInput = await page.locator('textarea[placeholder*="What\'s your commitment"]').first()
      if (await commitmentInput.count() > 0) {
        await commitmentInput.fill(dateInfo.text)
        console.log(`   Entered: "${dateInfo.text}"`)

        // Save the commitment
        const saveBtn = await page.locator('button:has-text("Save Commitment")').first()
        if (await saveBtn.count() > 0) {
          await saveBtn.click()
          console.log('   ✓ Commitment saved')
          await page.waitForTimeout(1500)
        }

        // Mark as completed
        const completeBtn = await page.locator('button:has-text("Mark Complete")').first()
        if (await completeBtn.count() > 0) {
          await completeBtn.click()
          console.log('   ✓ Marked as completed')
          await page.waitForTimeout(1500)
        }
      }
    }

    // Navigate back to Dashboard
    console.log('\n6. Going back to Dashboard...')
    await page.locator('text=Dashboard').first().click()
    await page.waitForTimeout(3000)

    // Take screenshot of dashboard with week overview
    console.log('7. Taking screenshot of dashboard...')
    await page.screenshot({ path: 'brian-dashboard-after-setup.png', fullPage: true })

    // Check the week overview
    console.log('\n8. Checking week overview...')
    const weekOverview = await page.locator('.grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-5').first()
    const dayCards = await weekOverview.locator('.bg-slate-800\\/50').all()

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    let checkmarkCount = 0

    for (let i = 0; i < dayCards.length && i < 5; i++) {
      const card = dayCards[i]
      const hasCheckmark = await card.locator('svg.text-green-400').count() > 0
      const hasXmark = await card.locator('svg.text-red-400').count() > 0
      const hasClock = await card.locator('svg.text-yellow-400').count() > 0
      const hasEmptyCircle = await card.locator('svg.text-slate-500').count() > 0

      const dateNum = await card.locator('p.text-sm.font-bold').textContent()

      let status = 'Unknown'
      if (hasCheckmark) {
        status = '✅ Completed'
        checkmarkCount++
      } else if (hasXmark) status = '❌ Missed'
      else if (hasClock) status = '⏰ Pending'
      else if (hasEmptyCircle) status = '⭕ No commitment'

      console.log(`  ${days[i]} (${dateNum}): ${status}`)
    }

    console.log(`\n✅ Setup complete! Found ${checkmarkCount} checkmarks in week overview.`)

  } catch (error) {
    console.error('Setup failed:', error)
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true })
  } finally {
    console.log('\nClosing browser...')
    await browser.close()
  }
}

setupBrianCommitments().catch(console.error)
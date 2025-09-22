// Test commitment view display issue with Playwright
const { chromium } = require('playwright')

async function testCommitmentView() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    console.log('1. Navigating to login page...')
    await page.goto('https://communitynwa.com/login', { waitUntil: 'networkidle' })

    console.log('2. Logging in as Brian...')
    await page.fill('input[type="email"]', 'ba1876@gmail.com')
    await page.fill('input[type="password"]', 'Lbbc#2245')
    await page.click('button[type="submit"]')

    console.log('3. Waiting for dashboard to load...')
    await page.waitForURL('**/dashboard', { timeout: 10000 })
    await page.waitForTimeout(2000)

    console.log('4. Finding Daily Commitment section...')
    const dailyCommitmentSection = await page.locator('h2:has-text("Daily Commitment")').first()
    await dailyCommitmentSection.waitFor({ timeout: 5000 })

    console.log('5. Checking current selected date...')
    // Find the date selector and get current date
    const dateInput = await page.locator('input[type="date"]').first()
    const selectedDate = await dateInput.inputValue()
    console.log(`Selected date: ${selectedDate}`)

    console.log('6. Navigating to Friday Sep 19...')
    await dateInput.fill('2025-09-19')
    await page.waitForTimeout(1500) // Wait for component to update

    console.log('7. Checking what displays for Sep 19...')
    // Check if "Add Commitment" form is visible
    const addCommitmentForm = await page.locator('textarea[placeholder*="commitment"], input[placeholder*="commitment"]')
    const isAddFormVisible = await addCommitmentForm.isVisible().catch(() => false)

    // Check if existing commitment is visible
    const existingCommitmentElement = await page.locator('.commitment-content, .commitment-text')
    const hasExistingCommitment = await existingCommitmentElement.isVisible().catch(() => false)

    console.log(`  Add Commitment form visible: ${isAddFormVisible}`)
    console.log(`  Existing commitment visible: ${hasExistingCommitment}`)

    if (isAddFormVisible) {
      console.log('  ❌ ISSUE CONFIRMED: Shows "Add Commitment" form for Sep 19')
    }
    if (hasExistingCommitment) {
      const commitmentText = await existingCommitmentElement.textContent()
      console.log(`  ✓ Shows existing commitment: "${commitmentText.substring(0, 50)}..."`)
    }

    console.log('\n8. Checking "Your Commitments" section for Sep 19...')
    const commitmentsSection = await page.locator('h2:has-text("Your Commitments")').first()
    await commitmentsSection.scrollIntoViewIfNeeded()

    // Look for Sep 19 in the commitments list
    const sep19Commitments = await page.locator('text=/Sep.*19/').all()
    console.log(`Found ${sep19Commitments.length} commitments mentioning Sep 19`)

    for (const commitment of sep19Commitments) {
      const parent = await commitment.locator('..').first()
      const text = await parent.textContent()
      if (text.includes('hgjyhjgj') || text.includes('2025-09-19')) {
        console.log(`  ✓ Found Sep 19 commitment in list: "${text.substring(0, 100)}..."`)
      }
    }

    console.log('\n9. Testing different dates to find the pattern...')
    const testDates = [
      '2025-09-18', // Thursday
      '2025-09-17', // Wednesday
      '2025-09-16', // Tuesday
      '2025-09-15'  // Monday
    ]

    for (const date of testDates) {
      await dateInput.fill(date)
      await page.waitForTimeout(1000)

      const isFormVisible = await addCommitmentForm.isVisible().catch(() => false)
      const hasCommitment = await existingCommitmentElement.isVisible().catch(() => false)

      const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(date + 'T12:00:00').getDay()]

      if (isFormVisible && !hasCommitment) {
        console.log(`  ${date} (${dayOfWeek}): Shows Add form (no commitment found)`)
      } else if (hasCommitment) {
        const text = await existingCommitmentElement.textContent().catch(() => 'N/A')
        console.log(`  ${date} (${dayOfWeek}): Shows commitment: "${text.substring(0, 30)}..."`)
      } else {
        console.log(`  ${date} (${dayOfWeek}): Unknown state`)
      }
    }

    console.log('\n10. Test complete!')
    console.log('\nSummary:')
    console.log('The issue is that the Daily Commitment section shows "Add Commitment" form')
    console.log('even when a commitment exists for that date (visible in "Your Commitments" list).')
    console.log('This indicates the daily view is not properly loading existing commitments.')

  } catch (error) {
    console.error('Test failed:', error)
  } finally {
    await browser.close()
  }
}

testCommitmentView().catch(console.error)
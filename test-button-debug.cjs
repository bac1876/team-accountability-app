// Debug test to understand why arrow buttons aren't working
const { chromium } = require('playwright')

async function testButtonDebug() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  })
  const page = await browser.newPage()

  try {
    console.log('=== DEBUGGING BUTTON CLICKS ===\n')

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

    // Take initial screenshot
    await page.screenshot({ path: 'debug-initial.png' })
    console.log('3. Initial screenshot saved: debug-initial.png')

    // Check initial date
    const initialDate = await page.locator('.text-3xl.font-bold.mb-1').textContent()
    console.log(`   Initial date display: "${initialDate}"`)

    // Add console listeners to catch React state changes
    page.on('console', msg => {
      if (msg.text().includes('Date changed') || msg.text().includes('changeDate')) {
        console.log(`   [BROWSER CONSOLE]: ${msg.text()}`)
      }
    })

    // Try clicking the left arrow specifically
    console.log('4. Looking for left arrow button...')

    // Method 1: Find by ChevronLeft SVG
    const chevronLeft = await page.locator('svg[class*="lucide-chevron-left"]').first()
    if (await chevronLeft.isVisible()) {
      console.log('   Found ChevronLeft SVG, clicking...')
      await chevronLeft.click()
      await page.waitForTimeout(2000)

      const newDate = await page.locator('.text-3xl.font-bold.mb-1').textContent()
      console.log(`   Date after ChevronLeft click: "${newDate}"`)

      if (newDate !== initialDate) {
        console.log('   ✓ SUCCESS: Date changed!')
      } else {
        console.log('   ✗ FAILED: Date did not change')
      }
    } else {
      console.log('   ChevronLeft SVG not found')
    }

    // Method 2: Find the actual button containing the ChevronLeft
    console.log('5. Looking for button containing ChevronLeft...')
    const leftButton = await page.locator('button:has(svg[class*="lucide-chevron-left"])').first()
    if (await leftButton.isVisible()) {
      console.log('   Found button with ChevronLeft, clicking...')
      await leftButton.click()
      await page.waitForTimeout(2000)

      const newDate2 = await page.locator('.text-3xl.font-bold.mb-1').textContent()
      console.log(`   Date after button click: "${newDate2}"`)

      if (newDate2 !== initialDate) {
        console.log('   ✓ SUCCESS: Date changed!')
      } else {
        console.log('   ✗ FAILED: Date did not change')
      }
    } else {
      console.log('   Button with ChevronLeft not found')
    }

    // Method 3: Use more specific selector
    console.log('6. Using specific arrow button selector...')
    const arrowButton = await page.locator('button[class*="hover:bg-white/20"]').first()
    if (await arrowButton.isVisible()) {
      console.log('   Found arrow button by class, clicking...')
      await arrowButton.click()
      await page.waitForTimeout(2000)

      const newDate3 = await page.locator('.text-3xl.font-bold.mb-1').textContent()
      console.log(`   Date after arrow button click: "${newDate3}"`)

      if (newDate3 !== initialDate) {
        console.log('   ✓ SUCCESS: Date changed!')
      } else {
        console.log('   ✗ FAILED: Date did not change')
      }
    } else {
      console.log('   Arrow button by class not found')
    }

    // Take final screenshot
    await page.screenshot({ path: 'debug-final.png' })
    console.log('7. Final screenshot saved: debug-final.png')

  } catch (error) {
    console.error('\nTest failed with error:', error.message)
    await page.screenshot({ path: 'debug-error.png' })
  } finally {
    await browser.close()
  }
}

testButtonDebug().catch(console.error)
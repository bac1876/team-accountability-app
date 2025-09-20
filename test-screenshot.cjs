const { chromium } = require('playwright');

(async () => {
  console.log('Taking screenshots of live app...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate and login
    console.log('1. Navigating to app...');
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(2000);

    console.log('2. Logging in as Brian...');
    await page.fill('input[type="text"]', 'brian@searchnwa.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Take screenshots of main view
    console.log('3. Taking screenshot of dashboard...');
    await page.screenshot({ path: 'test-dashboard.png', fullPage: true });

    // Navigate to commitments if not already there
    const hasCommitmentsTab = await page.isVisible('text=Daily Commitments');
    if (hasCommitmentsTab) {
      console.log('4. Navigating to commitments...');
      await page.click('text=Daily Commitments');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'test-commitments.png', fullPage: true });

      // Try to navigate to yesterday
      console.log('5. Looking for date navigation...');
      const hasYesterdayButton = await page.isVisible('button:has(svg.lucide-chevron-left)');
      if (hasYesterdayButton) {
        console.log('   - Found left arrow, clicking to go to yesterday...');
        await page.click('button:has(svg.lucide-chevron-left)');
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'test-yesterday.png', fullPage: true });

        // Check for commitments
        const commitmentElements = await page.$$('button:has(svg.lucide-circle), button:has(svg.lucide-check-circle)');
        console.log(`   - Found ${commitmentElements.length} commitment checkboxes`);

        if (commitmentElements.length > 0) {
          console.log('6. Testing marking commitment as complete...');
          await commitmentElements[0].click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'test-marked-complete.png', fullPage: true });
          console.log('   - Successfully clicked checkbox!');
        }
      }
    }

    console.log('\n✅ Screenshots saved successfully!');
    console.log('Check: test-dashboard.png, test-commitments.png, test-yesterday.png, test-marked-complete.png');

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
import { chromium } from 'playwright';

async function testPhoneCallUI() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down for visibility
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Opening Community NWA...');
  await page.goto('https://communitynwa.com');

  // Login as Brian
  console.log('Logging in as Brian...');
  await page.fill('input[name="email"]', 'brian@searchnwa.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button:has-text("Login")');

  // Wait for dashboard to load
  await page.waitForSelector('text=/Dashboard/i', { timeout: 10000 });
  console.log('✓ Logged in successfully');

  // Navigate to Phone Calls tab
  console.log('Navigating to Phone Calls tab...');
  await page.click('button:has-text("Phone Calls")');

  // Wait for phone call section to load
  await page.waitForSelector('text=/Phone Call Tracking/i', { timeout: 5000 });
  console.log('✓ Phone Calls section loaded');

  // Try to set a goal
  console.log('Setting goal for 50 calls...');

  // Check if goal input is visible
  const goalInput = await page.locator('input[placeholder*="target"]');
  const isGoalInputVisible = await goalInput.isVisible();

  if (isGoalInputVisible) {
    await goalInput.fill('50');
    console.log('✓ Entered goal: 50');

    // Click Set Goal button
    const setGoalButton = await page.locator('button:has-text("Set Goal")');
    await setGoalButton.click();
    console.log('✓ Clicked Set Goal button');

    // Wait and check for success or error
    await page.waitForTimeout(2000); // Wait for response

    // Check for error message
    const errorVisible = await page.locator('text=/Error/i').isVisible();
    if (errorVisible) {
      const errorText = await page.locator('text=/Error/i').textContent();
      console.error('✗ Error occurred:', errorText);

      // Take screenshot
      await page.screenshot({ path: 'phone-error.png' });
      console.log('Screenshot saved as phone-error.png');

      // Check browser console for errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Browser console error:', msg.text());
        }
      });

      // Check network errors
      page.on('requestfailed', request => {
        console.log('Request failed:', request.url(), request.failure().errorText);
      });
    } else {
      // Check if goal was saved
      const savedGoal = await page.locator('text=/Target: 50/').isVisible();
      if (savedGoal) {
        console.log('✓ Goal saved successfully!');
      } else {
        console.log('⚠ Goal may have been saved but UI didn\'t update');
      }
    }
  } else {
    console.log('⚠ Goal input not visible - may already have a goal set for today');

    // Check if already has a goal
    const hasGoal = await page.locator('text=/Target:/').isVisible();
    if (hasGoal) {
      console.log('✓ Already has a goal set for today');
    }
  }

  // Take final screenshot
  await page.screenshot({ path: 'phone-final.png' });
  console.log('Final screenshot saved as phone-final.png');

  await page.waitForTimeout(2000);
  await browser.close();
}

testPhoneCallUI().catch(console.error);
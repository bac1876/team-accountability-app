const { chromium } = require('playwright');

(async () => {
  console.log('Starting Playwright test of live app...\n');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down to see what's happening
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Console Error:', msg.text());
    }
  });

  page.on('response', response => {
    if (response.status() >= 400) {
      console.log(`API Error: ${response.status()} ${response.url()}`);
    }
  });

  try {
    // Navigate to the app
    console.log('1. Navigating to app...');
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(2000);

    // Login with Brian's credentials
    console.log('2. Logging in as Brian...');
    await page.fill('input[type="text"]', 'brian@searchnwa.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Test Commitments
    console.log('\n3. Testing Commitments...');
    await page.click('text=Daily Commitments');
    await page.waitForTimeout(2000);

    // Try to add a commitment
    console.log('   - Adding a commitment...');
    const commitmentText = `Test commitment ${Date.now()}`;
    await page.fill('textarea[placeholder*="Complete project proposal"]', commitmentText);
    await page.click('button:has-text("Add Commitment")');
    await page.waitForTimeout(2000);

    // Check if commitment appears
    const commitmentVisible = await page.isVisible(`text="${commitmentText}"`);
    console.log(`   - Commitment visible: ${commitmentVisible}`);

    // Try to mark it complete
    if (commitmentVisible) {
      console.log('   - Clicking complete checkbox...');
      const circles = await page.$$('svg.lucide-circle');
      if (circles.length > 0) {
        await circles[0].click();
        await page.waitForTimeout(2000);
        const checkCircleVisible = await page.isVisible('svg.lucide-check-circle');
        console.log(`   - Checkbox marked complete: ${checkCircleVisible}`);
      }

      // Try to delete
      console.log('   - Testing delete...');
      const deleteButtons = await page.$$('button:has(svg.lucide-trash2)');
      if (deleteButtons.length > 0) {
        await deleteButtons[0].click();
        await page.waitForTimeout(1000);
        // Handle confirm dialog if it appears
        page.on('dialog', async dialog => {
          console.log(`   - Confirm dialog: ${dialog.message()}`);
          await dialog.accept();
        });
        await page.waitForTimeout(2000);
        const stillVisible = await page.isVisible(`text="${commitmentText}"`);
        console.log(`   - Commitment deleted: ${!stillVisible}`);
      }
    }

    // Test Goals
    console.log('\n4. Testing Weekly Goals...');
    await page.click('text=Weekly Goals');
    await page.waitForTimeout(2000);

    // Try to add a goal
    console.log('   - Adding a goal...');
    const goalText = `Test goal ${Date.now()}`;
    await page.fill('textarea[placeholder*="Write your goal here"]', goalText);

    // Set a target date
    const dateInputs = await page.$$('input[type="date"]');
    if (dateInputs.length > 0) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split('T')[0];
      await dateInputs[0].fill(dateStr);
    }

    await page.click('button:has-text("Add Goal")');
    await page.waitForTimeout(2000);

    // Check if goal appears
    const goalVisible = await page.isVisible(`text="${goalText}"`);
    console.log(`   - Goal visible: ${goalVisible}`);

    // Try to update progress
    if (goalVisible) {
      console.log('   - Testing progress update...');
      const progressButtons = await page.$$('button:has-text("50%")');
      if (progressButtons.length > 0) {
        await progressButtons[0].click();
        await page.waitForTimeout(2000);
        console.log('   - Progress updated');
      }

      // Try to delete
      console.log('   - Testing delete...');
      const deleteButtons = await page.$$('button:has(svg.lucide-trash2)');
      if (deleteButtons.length > 0) {
        await deleteButtons[0].click();
        await page.waitForTimeout(1000);
        // Handle confirm dialog if it appears
        page.on('dialog', async dialog => {
          await dialog.accept();
        });
        await page.waitForTimeout(2000);
        const stillVisible = await page.isVisible(`text="${goalText}"`);
        console.log(`   - Goal deleted: ${!stillVisible}`);
      }
    }

    // Check Phone Calls too
    console.log('\n5. Testing Phone Calls...');
    await page.click('text=Phone Call Tracker');
    await page.waitForTimeout(2000);

    // Set a goal
    console.log('   - Setting phone call goal...');
    await page.fill('input[placeholder="Enter target calls"]', '25');
    await page.click('button:has-text("Set Goal")');
    await page.waitForTimeout(2000);

    // Check if goal persists
    const phoneGoalVisible = await page.isVisible('text=/Daily Goal.*25/');
    console.log(`   - Phone goal persists: ${phoneGoalVisible}`);

    // Take screenshots for review
    console.log('\n6. Taking screenshots...');
    await page.click('text=Daily Commitments');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'playwright-commitments.png', fullPage: true });

    await page.click('text=Weekly Goals');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'playwright-goals.png', fullPage: true });

    await page.click('text=Phone Call Tracker');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'playwright-phone-calls.png', fullPage: true });

    console.log('\nTest complete! Check the screenshots.');

  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'playwright-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
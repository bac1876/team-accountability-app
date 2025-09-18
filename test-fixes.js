import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. Navigating to the app...');
    await page.goto('https://accountability-theta.vercel.app/');

    // Wait for login page to load
    await page.waitForSelector('input[name="username"]', { timeout: 10000 });

    console.log('2. Logging in as test user...');
    await page.fill('input[name="username"]', 'john@example.com');
    await page.fill('input[name="password"]', 'john123');
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForSelector('h1:has-text("Welcome back")', { timeout: 10000 });
    console.log('3. Successfully logged in!');

    // Test 1: Save a commitment
    console.log('\n4. Testing commitment saving...');
    const commitmentText = 'Test commitment ' + new Date().toISOString();

    // Find and fill the commitment textarea
    await page.fill('textarea[placeholder*="What will you commit"]', commitmentText);

    // Click save button
    await page.click('button:has-text("Save Commitment")');

    // Wait for success toast
    await page.waitForSelector('text=Commitment saved!', { timeout: 5000 });
    console.log('✓ Commitment saved successfully!');

    // Check if commitment is still displayed
    await page.waitForTimeout(2000);
    const commitmentValue = await page.inputValue('textarea[placeholder*="What will you commit"]');
    if (commitmentValue === commitmentText) {
      console.log('✓ Commitment text remains displayed after saving!');
    } else {
      console.log('✗ Issue: Commitment text disappeared. Current value:', commitmentValue);
    }

    // Test 2: Add a goal
    console.log('\n5. Testing goal creation...');
    const goalText = 'Test goal ' + new Date().getTime();

    // Find the goals section - click on Goals tab if needed
    const goalsTab = await page.$('button:has-text("Goals")');
    if (goalsTab) {
      await goalsTab.click();
      await page.waitForTimeout(1000);
    }

    // Find and fill the goal input
    await page.fill('input[placeholder*="Add a new weekly goal"]', goalText);

    // Click add goal button
    await page.click('button:has-text("Add Goal")');

    // Wait to see if goal appears or error occurs
    await page.waitForTimeout(3000);

    // Check for error
    const errorAlert = await page.$('text=Failed to add goal');
    if (errorAlert) {
      console.log('✗ Error: "Failed to add goal" still appears');
    } else {
      // Check if goal was added to the list
      const goalElement = await page.$(`text=${goalText}`);
      if (goalElement) {
        console.log('✓ Goal added successfully!');
      } else {
        console.log('? Goal may have been added but not displayed');
      }
    }

    console.log('\n6. Test completed!');

    // Keep browser open for manual inspection
    console.log('\nBrowser will remain open for inspection. Press Ctrl+C to exit.');
    await page.waitForTimeout(60000);

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
})();
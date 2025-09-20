const { chromium } = require('playwright');

async function testGoals() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log('📊 Console:', msg.text());
  });

  try {
    console.log('🔍 TESTING GOALS FUNCTIONALITY\n');
    console.log('==================================================\n');

    // 1. Navigate to app
    console.log('1️⃣ NAVIGATING TO APP...');
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(3000);

    // Check if logged in or need to login
    const loggedIn = await page.locator('.dashboard-container').count() > 0;

    if (!loggedIn) {
      // 2. Login
      console.log('\n2️⃣ LOGGING IN...');
      await page.fill('input[type="email"]', 'ba1876@gmail.com');
      await page.fill('input[type="password"]', 'Lbbc#2245');
      await page.click('button:has-text("Login")');
      await page.waitForTimeout(3000);
    }

    // 3. Navigate to Goals tab
    console.log('\n3️⃣ NAVIGATING TO GOALS...');
    await page.click('nav button:has-text("Weekly Goals")');
    await page.waitForTimeout(2000);

    // 4. Check current goals
    console.log('\n4️⃣ CHECKING CURRENT GOALS...');
    const existingGoals = await page.locator('.goal-item').count();
    console.log(`   Found ${existingGoals} existing goals`);

    // 5. Add a new goal
    console.log('\n5️⃣ ADDING NEW GOAL...');
    const goalInput = await page.locator('input[placeholder*="goal" i], input[placeholder*="Goal" i]').first();
    const testGoal = `Test goal ${Date.now()}`;
    await goalInput.fill(testGoal);
    console.log(`   Entered goal: "${testGoal}"`);

    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    // 6. Check if goal was added
    console.log('\n6️⃣ VERIFYING GOAL WAS ADDED...');
    const goalFound = await page.locator(`text="${testGoal}"`).count() > 0;

    if (goalFound) {
      console.log('   ✅ Goal successfully added and persists!');
    } else {
      console.log('   ❌ Goal disappeared after adding');

      // Check console for errors
      console.log('\n7️⃣ CHECKING FOR API ERRORS...');

      // Try to check network tab for failed requests
      const failedRequests = [];
      page.on('requestfailed', request => {
        failedRequests.push({
          url: request.url(),
          failure: request.failure()
        });
      });

      // Try adding another goal to capture network activity
      await goalInput.fill('Test goal 2');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);

      if (failedRequests.length > 0) {
        console.log('   Failed requests:', failedRequests);
      }
    }

    // Take screenshot
    await page.screenshot({ path: 'goals-test.png' });
    console.log('\n📸 Screenshot saved as goals-test.png');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'goals-error.png' });
  } finally {
    console.log('\n==================================================');
    console.log('✅ TEST COMPLETE');
    await browser.close();
  }
}

testGoals();
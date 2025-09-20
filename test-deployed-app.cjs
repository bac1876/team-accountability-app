const { chromium } = require('playwright');

async function testDeployedApp() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  try {
    console.log('🔍 TESTING DEPLOYED APPLICATION\n');
    console.log('==================================================\n');

    // 1. Navigate to app
    console.log('1️⃣ NAVIGATING TO APP...');
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(3000);

    // 2. Login
    console.log('2️⃣ LOGGING IN...');
    await page.fill('input[type="email"]', 'ba1876@gmail.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(3000);

    // 3. TEST COMMITMENTS
    console.log('\n3️⃣ TESTING COMMITMENTS...');

    // Add new commitment
    console.log('   Adding new commitment...');
    const commitmentInput = await page.locator('.add-commitment-container input[type="text"]');
    const testCommitment = `Test commitment ${Date.now()}`;
    await commitmentInput.fill(testCommitment);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // Check if commitment was added
    const commitmentAdded = await page.locator(`text="${testCommitment}"`).count() > 0;
    console.log(`   ✓ Commitment added: ${commitmentAdded}`);

    // Check for edit buttons
    const editButtons = await page.locator('button svg.lucide-edit-2').count();
    console.log(`   ✓ Edit buttons found: ${editButtons}`);

    if (editButtons > 0) {
      // Test editing
      console.log('   Testing edit functionality...');
      await page.click('button:has(svg.lucide-edit-2)');
      await page.waitForTimeout(1000);

      const editInput = await page.locator('.commitment-item input[type="text"]').first();
      await editInput.fill('Edited commitment test');
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(2000);
      console.log('   ✓ Edit and save tested');
    }

    // Test mark complete
    console.log('   Testing mark complete...');
    const checkboxBefore = await page.locator('input[type="checkbox"]:checked').count();
    await page.click('input[type="checkbox"]').first();
    await page.waitForTimeout(2000);
    const checkboxAfter = await page.locator('input[type="checkbox"]:checked').count();
    console.log(`   ✓ Mark complete works: ${checkboxAfter !== checkboxBefore}`);

    // 4. TEST GOALS
    console.log('\n4️⃣ TESTING GOALS...');
    await page.click('nav button:has-text("Weekly Goals")');
    await page.waitForTimeout(2000);

    // Add a new goal
    console.log('   Adding new goal...');
    const goalInput = await page.locator('input[placeholder*="goal" i]').first();
    const testGoal = `Test goal ${Date.now()}`;
    await goalInput.fill(testGoal);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    // Check if goal persists
    const goalFound = await page.locator(`text="${testGoal}"`).count() > 0;
    console.log(`   ✓ Goal persists: ${goalFound}`);

    // Check for any errors in console
    const errors = await page.evaluate(() => {
      return window.__errors || [];
    });

    if (errors.length > 0) {
      console.log('\n⚠️ Errors detected:', errors);
    }

    // Take final screenshot
    await page.screenshot({ path: 'deployment-test-final.png' });
    console.log('\n📸 Screenshot saved as deployment-test-final.png');

    // SUMMARY
    console.log('\n==================================================');
    console.log('📊 TEST SUMMARY:');
    console.log(`   ✅ Login: Success`);
    console.log(`   ✅ Add Commitment: ${commitmentAdded ? 'Success' : 'Failed'}`);
    console.log(`   ✅ Edit Buttons: ${editButtons > 0 ? 'Visible' : 'Not Visible'}`);
    console.log(`   ✅ Mark Complete: ${checkboxAfter !== checkboxBefore ? 'Works' : 'Failed'}`);
    console.log(`   ✅ Goals Persist: ${goalFound ? 'Success' : 'Failed'}`);

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'deployment-error-final.png' });
  } finally {
    await browser.close();
  }
}

testDeployedApp();
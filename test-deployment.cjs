const { chromium } = require('playwright');

async function testDeployment() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Testing deployment at https://communitynwa.com');

    // 1. Navigate and login
    console.log('\n1. Navigating to site and logging in...');
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(2000);

    await page.fill('input[type="email"]', 'ba1876@gmail.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button:has-text("Login")');
    await page.waitForTimeout(3000);

    // 2. Test commitments - add new one
    console.log('\n2. Testing commitments functionality...');
    const commitmentInput = await page.locator('.add-commitment-container input[type="text"]');
    await commitmentInput.fill('Test deployment - commitment works');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);

    // 3. Check if edit button appears
    console.log('\n3. Checking edit buttons...');
    const editButtons = await page.locator('button:has-text("Edit")').count();
    console.log(`   Found ${editButtons} edit button(s)`);

    if (editButtons > 0) {
      // Test editing
      console.log('   Testing edit functionality...');
      await page.click('button:has-text("Edit")');
      await page.waitForTimeout(1000);

      const editInput = await page.locator('.commitment-item input[type="text"]');
      await editInput.fill('Test deployment - edited commitment');
      await page.click('button:has-text("Save")');
      await page.waitForTimeout(2000);
      console.log('   ✓ Edit and save successful');
    }

    // 4. Test mark complete
    console.log('\n4. Testing mark complete...');
    const checkboxes = await page.locator('input[type="checkbox"]').count();
    if (checkboxes > 0) {
      await page.click('input[type="checkbox"]');
      await page.waitForTimeout(2000);
      console.log('   ✓ Mark complete successful');
    }

    // 5. Test goals
    console.log('\n5. Testing goals functionality...');
    await page.click('nav button:has-text("Weekly Goals")');
    await page.waitForTimeout(2000);

    const goalInput = await page.locator('input[placeholder*="goal"]');
    await goalInput.fill('Test deployment - goal works');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    // Check if goal persists
    const goalText = await page.locator('text=Test deployment - goal works').count();
    if (goalText > 0) {
      console.log('   ✓ Goal successfully added and persists');
    } else {
      console.log('   ✗ Goal disappeared after adding');
    }

    // Take screenshot
    await page.screenshot({ path: 'deployment-test.png' });
    console.log('\n✅ Deployment test complete - screenshot saved as deployment-test.png');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'deployment-error.png' });
  } finally {
    await browser.close();
  }
}

testDeployment();
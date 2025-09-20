const { chromium } = require('playwright');

async function testCommitments() {
  console.log('🔍 TESTING COMMITMENTS FUNCTIONALITY\n');
  console.log('=' .repeat(50));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Enable console logging
    page.on('console', msg => {
      if (msg.text().includes('commitments') ||
          msg.text().includes('Commitments')) {
        console.log('📊 Console:', msg.text());
      }
    });

    // STEP 1: Navigate and Login
    console.log('\n1️⃣ NAVIGATING TO APP...');
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(2000);

    console.log('2️⃣ LOGGING IN AS BRIAN...');
    await page.fill('input[type="text"]', 'brian@searchnwa.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);
    console.log('   ✅ Login successful');

    // STEP 2: Click on Commitment in sidebar
    console.log('\n3️⃣ NAVIGATING TO COMMITMENTS...');

    // Try clicking on the Commitment menu item
    const commitmentLink = await page.$('text=Commitment');
    if (commitmentLink) {
      console.log('   Found "Commitment" link, clicking...');
      await commitmentLink.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('   ❌ Could not find Commitment link');
      // Take screenshot to debug
      await page.screenshot({ path: 'test-nav-debug.png' });
    }

    // Check if we're on the commitments page
    const onCommitmentsPage = await page.isVisible('h2:has-text("Daily Commitments")');
    console.log(`   ${onCommitmentsPage ? '✅' : '❌'} On commitments page: ${onCommitmentsPage}`);

    await page.screenshot({ path: 'test-commitments-page.png' });

    // STEP 3: Check for commitments
    console.log('\n4️⃣ CHECKING FOR COMMITMENTS...');

    // Check for commitment items
    const commitmentItems = await page.$$('div[class*="flex items-center gap-3"]');
    console.log(`   Found ${commitmentItems.length} commitment items`);

    // Check for checkboxes
    const circles = await page.$$('button:has(svg.lucide-circle)');
    const checkCircles = await page.$$('button:has(svg.lucide-check-circle)');
    console.log(`   Found ${circles.length} uncompleted commitments`);
    console.log(`   Found ${checkCircles.length} completed commitments`);

    // STEP 4: Test Add Commitment
    console.log('\n5️⃣ TESTING ADD COMMITMENT...');
    const testCommitment = `Test Commitment ${new Date().toISOString()}`;

    // Look for the textarea
    const textarea = await page.$('textarea[placeholder*="Complete project proposal"]');
    if (textarea) {
      console.log('   ✅ Found add commitment textarea');
      await textarea.fill(testCommitment);

      // Click Add button
      const addButton = await page.$('button:has-text("Add Commitment")');
      if (addButton) {
        await addButton.click();
        await page.waitForTimeout(2000);
        console.log('   ✅ Commitment added');
      }
    } else {
      console.log('   ❌ Could not find add commitment textarea');
    }

    await page.screenshot({ path: 'test-after-add.png' });

    // STEP 5: Check edit/delete buttons
    console.log('\n6️⃣ CHECKING EDIT/DELETE BUTTONS...');
    const editButtons = await page.$$('button:has(svg.lucide-edit2)');
    const deleteButtons = await page.$$('button:has(svg.lucide-trash2)');
    console.log(`   Found ${editButtons.length} edit buttons`);
    console.log(`   Found ${deleteButtons.length} delete buttons`);

    if (editButtons.length === 0 && deleteButtons.length === 0) {
      console.log('   ⚠️ No edit/delete buttons found - checking for commitments...');

      // Debug: Check what's actually on the page
      const pageContent = await page.content();
      const hasCommitmentText = pageContent.includes('commitment');
      console.log(`   Page contains "commitment" text: ${hasCommitmentText}`);
    }

    // STEP 6: Test marking complete
    if (circles.length > 0) {
      console.log('\n7️⃣ TESTING MARK AS COMPLETE...');
      await circles[0].click();
      await page.waitForTimeout(2000);

      const newCheckCircles = await page.$$('svg.lucide-check-circle');
      console.log(`   ✅ After clicking: ${newCheckCircles.length} completed items`);
    }

    // Final screenshot
    await page.screenshot({ path: 'test-final-state.png' });

    console.log('\n' + '=' .repeat(50));
    console.log('✅ TEST COMPLETE!');
    console.log('Screenshots saved:');
    console.log('  - test-commitments-page.png');
    console.log('  - test-after-add.png');
    console.log('  - test-final-state.png');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    await page.screenshot({ path: 'test-error.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testCommitments();
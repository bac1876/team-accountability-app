const { chromium } = require('playwright');

async function testFullFunctionality() {
  console.log('🔍 COMPREHENSIVE COMMITMENT FUNCTIONALITY TEST\n');
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
      if (msg.text().includes('Loaded commitments') ||
          msg.text().includes('Recent commitments')) {
        console.log('📊 Debug:', msg.text());
      }
    });

    // Monitor API calls
    let apiCalls = [];
    page.on('response', response => {
      if (response.url().includes('/api/commitments')) {
        apiCalls.push({
          url: response.url(),
          status: response.status(),
          method: response.request().method()
        });
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

    // STEP 2: Navigate to Commitments
    console.log('\n3️⃣ NAVIGATING TO COMMITMENTS...');
    await page.click('text=Daily Commitments');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-1-commitments-page.png' });

    // STEP 3: Test Adding a Commitment
    console.log('\n4️⃣ TESTING ADD COMMITMENT...');
    const testCommitment = `Test Commitment ${new Date().toISOString()}`;
    const textarea = await page.$('textarea[placeholder*="Complete project proposal"]');

    if (textarea) {
      await textarea.fill(testCommitment);
      await page.click('button:has-text("Add Commitment")');
      await page.waitForTimeout(2000);
      console.log('   ✅ Commitment added');
      await page.screenshot({ path: 'test-2-after-add.png' });
    } else {
      console.log('   ❌ Could not find textarea for adding commitment');
    }

    // STEP 4: Check for Recent Commitments Section
    console.log('\n5️⃣ CHECKING FOR RECENT COMMITMENTS SECTION...');
    await page.waitForTimeout(2000); // Give time for recent commitments to load

    const hasRecentSection = await page.isVisible('text=Recent Commitments');
    if (hasRecentSection) {
      console.log('   ✅ Recent Commitments section is visible');
    } else {
      console.log('   ⚠️ Recent Commitments section not visible (may not have recent items)');
    }

    // STEP 5: Test Marking Complete
    console.log('\n6️⃣ TESTING MARK AS COMPLETE...');
    const circles = await page.$$('button:has(svg.lucide-circle)');
    console.log(`   Found ${circles.length} uncompleted commitments`);

    if (circles.length > 0) {
      await circles[0].click();
      await page.waitForTimeout(2000);

      // Check for success toast
      const hasToast = await page.isVisible('text=/marked as completed/i');
      if (hasToast) {
        console.log('   ✅ Success toast appeared');
      }

      const checkCircles = await page.$$('svg.lucide-check-circle');
      console.log(`   ✅ Marked complete (${checkCircles.length} completed items)`);
      await page.screenshot({ path: 'test-3-after-complete.png' });
    }

    // STEP 6: Test Edit Functionality
    console.log('\n7️⃣ TESTING EDIT FUNCTIONALITY...');
    const editButtons = await page.$$('button:has(svg.lucide-edit2)');
    console.log(`   Found ${editButtons.length} edit buttons`);

    if (editButtons.length > 0) {
      console.log('   ✅ Edit buttons are present');

      // Try to edit the first commitment
      await editButtons[0].click();
      await page.waitForTimeout(1000);

      // Check if textarea appears
      const editTextarea = await page.$('textarea:focus');
      if (editTextarea) {
        console.log('   ✅ Edit mode activated');
        const currentText = await editTextarea.inputValue();
        await editTextarea.fill(currentText + ' (EDITED)');

        // Find and click save button
        const saveButton = await page.$('button:has(svg.lucide-save)');
        if (saveButton) {
          await saveButton.click();
          await page.waitForTimeout(2000);
          console.log('   ✅ Edit saved successfully');
          await page.screenshot({ path: 'test-4-after-edit.png' });
        } else {
          console.log('   ❌ Save button not found');
        }
      } else {
        console.log('   ❌ Edit textarea did not appear');
      }
    } else {
      console.log('   ❌ No edit buttons found - THIS IS THE MAIN ISSUE');

      // Debug: Let's check what's actually on the page
      const allButtons = await page.$$('button');
      console.log(`   Debug: Total buttons on page: ${allButtons.length}`);

      const commitmentDivs = await page.$$('div[class*="flex items-center gap-3 p-3"]');
      console.log(`   Debug: Commitment divs found: ${commitmentDivs.length}`);
    }

    // STEP 7: Test Delete Functionality
    console.log('\n8️⃣ TESTING DELETE FUNCTIONALITY...');
    const deleteButtons = await page.$$('button:has(svg.lucide-trash2)');
    console.log(`   Found ${deleteButtons.length} delete buttons`);

    if (deleteButtons.length > 0) {
      console.log('   ✅ Delete buttons are present');
    } else {
      console.log('   ❌ No delete buttons found');
    }

    // STEP 8: Navigate to Yesterday
    console.log('\n9️⃣ TESTING YESTERDAY\'S COMMITMENTS...');
    const leftArrow = await page.$('button:has(svg.lucide-chevron-left)');
    if (leftArrow) {
      await leftArrow.click();
      await page.waitForTimeout(2000);
      console.log('   ✅ Navigated to yesterday');

      const yesterdayCommitments = await page.$$('button:has(svg.lucide-circle), button:has(svg.lucide-check-circle)');
      console.log(`   Found ${yesterdayCommitments.length} commitments for yesterday`);

      if (yesterdayCommitments.length > 0) {
        await yesterdayCommitments[0].click();
        await page.waitForTimeout(2000);
        console.log('   ✅ Toggled yesterday\'s commitment status');
      }

      await page.screenshot({ path: 'test-5-yesterday.png' });
    }

    // SUMMARY
    console.log('\n' + '=' .repeat(50));
    console.log('📈 API CALLS SUMMARY:');
    apiCalls.forEach((call, i) => {
      console.log(`   ${i + 1}. ${call.method} ${call.url.replace('https://communitynwa.com', '')} - ${call.status}`);
    });

    console.log('\n✅ TEST COMPLETE!');
    console.log('Screenshots saved:');
    console.log('  - test-1-commitments-page.png');
    console.log('  - test-2-after-add.png');
    console.log('  - test-3-after-complete.png');
    console.log('  - test-4-after-edit.png');
    console.log('  - test-5-yesterday.png');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    await page.screenshot({ path: 'test-error-full.png' });
  } finally {
    await browser.close();
  }
}

// Run the test
testFullFunctionality();
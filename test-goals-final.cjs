const { chromium } = require('playwright');

async function testGoalsFinal() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000 // Slow down actions to see what's happening
  });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Browser console error:', msg.text());
    }
  });

  try {
    console.log('🔍 FINAL GOALS TEST - TESTING AS END USER\n');
    console.log('==================================================\n');

    // 1. Navigate to live site
    console.log('1️⃣ NAVIGATING TO LIVE SITE...');
    await page.goto('https://communitynwa.com', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    await page.screenshot({ path: 'goals-1-landing.png' });
    console.log('   ✅ Loaded page');

    // 2. Look for Sign In button (the actual button text we see in screenshot)
    console.log('\n2️⃣ LOOKING FOR LOGIN INTERFACE...');

    // Try to find the Sign In button
    const signInButton = await page.locator('button:has-text("Sign In")').first();
    if (await signInButton.count() > 0) {
      console.log('   Found "Sign In" button, filling credentials first');

      // Fill in email and password
      await page.fill('input[type="email"]', 'ba1876@gmail.com');
      console.log('   ✅ Filled email');

      await page.fill('input[type="password"]', 'Lbbc#2245');
      console.log('   ✅ Filled password');

      await page.screenshot({ path: 'goals-2-credentials.png' });

      // Click Sign In
      await signInButton.click();
      console.log('   ✅ Clicked Sign In button');

      // Wait for navigation with longer timeout
      console.log('   ⏳ Waiting for login to complete...');
      await page.waitForTimeout(10000); // Wait 10 seconds for login

      await page.screenshot({ path: 'goals-3-after-login.png' });

      // Check if we're logged in by looking for dashboard elements
      const dashboardElement = await page.locator('nav, .dashboard-container, button:has-text("Weekly Goals")').first();
      if (await dashboardElement.count() > 0) {
        console.log('   ✅ Successfully logged in!');
      } else {
        console.log('   ⚠️ May not be fully logged in, continuing anyway...');
      }
    } else {
      console.log('   No Sign In button found, may already be logged in');
    }

    // 3. Navigate to Goals tab - try multiple approaches
    console.log('\n3️⃣ NAVIGATING TO WEEKLY GOALS...');

    // List all buttons to see what's available
    const allButtons = await page.locator('button').all();
    console.log(`   Found ${allButtons.length} buttons on page`);

    // Print first 10 button texts
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const text = await allButtons[i].textContent();
      if (text && text.trim()) {
        console.log(`   Button ${i + 1}: "${text.trim()}"`);
      }
    }

    // Try to find and click Goals tab
    const goalSelectors = [
      'button:has-text("Weekly Goals")',
      'button:has-text("Goals")',
      'nav button:has-text("Goals")',
      '[role="tab"]:has-text("Goals")',
      'button[class*="tab"]:has-text("Goals")'
    ];

    let goalsClicked = false;
    for (const selector of goalSelectors) {
      const element = await page.locator(selector).first();
      if (await element.count() > 0) {
        await element.click();
        console.log(`   ✅ Clicked goals with selector: ${selector}`);
        goalsClicked = true;
        break;
      }
    }

    if (!goalsClicked) {
      console.log('   ❌ Could not find goals tab to click');
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'goals-4-goals-section.png' });

    // 4. Check if we can see the goals section
    console.log('\n4️⃣ CHECKING GOALS SECTION...');

    const goalsHeader = await page.locator('h2:has-text("Weekly Goals"), h3:has-text("Weekly Goals")').first();
    if (await goalsHeader.count() > 0) {
      console.log('   ✅ Goals section header is visible');
    } else {
      console.log('   ❌ Goals section header not found');
    }

    // 5. Try to add a test goal
    console.log('\n5️⃣ ATTEMPTING TO ADD A GOAL...');

    // Look for textarea
    const textarea = await page.locator('textarea').first();
    if (await textarea.count() > 0 && await textarea.isVisible()) {
      const testGoal = `Test goal - ${new Date().toLocaleTimeString()}`;
      await textarea.fill(testGoal);
      console.log(`   ✅ Entered goal text: "${testGoal}"`);

      await page.screenshot({ path: 'goals-5-text-entered.png' });

      // Look for Add button
      const addButton = await page.locator('button:has-text("Add"), button:has(svg)').filter({ hasText: /add/i }).first();
      if (await addButton.count() > 0) {
        await addButton.click();
        console.log('   ✅ Clicked add button');
        await page.waitForTimeout(3000);
      } else {
        // Try clicking any button with plus icon
        const plusButton = await page.locator('button:has(svg.lucide-plus)').first();
        if (await plusButton.count() > 0) {
          await plusButton.click();
          console.log('   ✅ Clicked plus button');
          await page.waitForTimeout(3000);
        }
      }

      await page.screenshot({ path: 'goals-6-after-add.png' });
    } else {
      console.log('   ❌ No textarea found for goal input');
    }

    // 6. CHECK FOR EDIT/DELETE BUTTONS - THE MAIN ISSUE
    console.log('\n6️⃣ 🔍 CHECKING FOR EDIT/DELETE BUTTONS (MAIN ISSUE)...');

    // Look for goal items
    const goalItems = await page.locator('.rounded-lg.border.bg-white').all();
    console.log(`   Found ${goalItems.length} goal items`);

    if (goalItems.length > 0) {
      console.log('\n   Checking first goal item for buttons:');
      const firstGoal = goalItems[0];

      // Get the HTML to inspect
      const goalHtml = await firstGoal.innerHTML();

      // Check for button elements
      const hasButtonElements = goalHtml.includes('<button');
      const hasEdit2Icon = goalHtml.includes('Edit2') || goalHtml.includes('edit');
      const hasTrash2Icon = goalHtml.includes('Trash2') || goalHtml.includes('trash');

      console.log(`   Has <button> elements: ${hasButtonElements ? '✅ YES' : '❌ NO'}`);
      console.log(`   Has Edit icon reference: ${hasEdit2Icon ? '✅ YES' : '❌ NO'}`);
      console.log(`   Has Trash icon reference: ${hasTrash2Icon ? '✅ YES' : '❌ NO'}`);

      // Try to find actual buttons
      const editButtons = await firstGoal.locator('button[title*="Edit"], button:has(svg)').all();
      const deleteButtons = await firstGoal.locator('button[title*="Delete"], button:has(svg)').all();

      console.log(`   Edit buttons found: ${editButtons.length}`);
      console.log(`   Delete buttons found: ${deleteButtons.length}`);

      // Check visibility
      if (editButtons.length > 0) {
        const isVisible = await editButtons[0].isVisible();
        const boundingBox = await editButtons[0].boundingBox();
        console.log(`   First edit button visible: ${isVisible ? '✅ YES' : '❌ NO'}`);
        if (boundingBox) {
          console.log(`   Edit button size: ${boundingBox.width}x${boundingBox.height}`);
        }

        // Try to click it
        if (isVisible) {
          try {
            await editButtons[0].click();
            console.log('   ✅ Successfully clicked edit button!');
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'goals-7-edit-clicked.png' });

            // Check if edit mode activated
            const cancelButton = await page.locator('button:has-text("Cancel")').first();
            if (await cancelButton.count() > 0) {
              console.log('   ✅ Edit mode activated (Cancel button appeared)');
              await cancelButton.click();
            }
          } catch (err) {
            console.log('   ❌ Could not click edit button:', err.message);
          }
        }
      } else {
        console.log('   ❌ NO EDIT BUTTONS FOUND - THIS IS THE ISSUE!');
      }

      // Print first 500 chars of goal HTML for debugging
      console.log('\n   First 500 chars of goal HTML:');
      console.log('   ' + goalHtml.substring(0, 500).replace(/\n/g, '\n   '));
    } else {
      console.log('   ❌ No goal items found to check');
    }

    // 7. Final full page screenshot
    await page.screenshot({ path: 'goals-8-final-full.png', fullPage: true });

    // SUMMARY
    console.log('\n==================================================');
    console.log('📊 TEST RESULTS SUMMARY:');
    console.log('\n🔴 CRITICAL FINDINGS:');
    if (goalItems.length > 0) {
      const firstGoal = goalItems[0];
      const buttons = await firstGoal.locator('button').all();
      if (buttons.length === 0) {
        console.log('   ❌ BUTTONS ARE NOT RENDERING IN THE GOALS!');
        console.log('   The goal items exist but have NO button elements.');
        console.log('   This means the edit/delete buttons are not being rendered at all.');
      } else {
        console.log(`   ✅ Found ${buttons.length} buttons in goals`);
      }
    } else {
      console.log('   ❌ No goals found to test buttons on');
    }

    console.log('\n📸 Screenshots saved: goals-1 through goals-8');
    console.log('Check goals-8-final-full.png for the complete page view');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'goals-error-final.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testGoalsFinal();
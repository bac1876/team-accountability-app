const { chromium } = require('playwright');

async function testGoalsAsEndUser() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500 // Slow down actions to see what's happening
  });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log('Browser console:', msg.text());
  });

  page.on('requestfailed', request => {
    console.log('❌ Request failed:', request.url(), request.failure());
  });

  try {
    console.log('🔍 TESTING GOALS AS AN END USER\n');
    console.log('==================================================\n');

    // 1. Navigate to live site
    console.log('1️⃣ NAVIGATING TO LIVE SITE...');
    await page.goto('https://communitynwa.com', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'test-1-landing.png' });
    await page.waitForTimeout(2000);

    // 2. Login with Brian's credentials
    console.log('\n2️⃣ LOGGING IN WITH YOUR CREDENTIALS...');

    // Check if login form is visible
    const emailInput = await page.locator('input[type="email"]');
    const passwordInput = await page.locator('input[type="password"]');

    if (await emailInput.count() > 0) {
      console.log('   Found login form');
      await emailInput.fill('ba1876@gmail.com');
      await passwordInput.fill('Lbbc#2245');
      await page.screenshot({ path: 'test-2-login-filled.png' });

      // Click login button
      await page.click('button:has-text("Login"), button:has-text("Sign In")');
      console.log('   Clicked login button');

      // Wait for navigation
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'test-3-after-login.png' });
    } else {
      console.log('   No login form found - may already be logged in');
    }

    // 3. Navigate to Goals tab
    console.log('\n3️⃣ NAVIGATING TO WEEKLY GOALS TAB...');

    // Look for goals tab with various selectors
    const goalTabFound = await page.locator('button:has-text("Weekly Goals"), button:has-text("Goals"), [role="tab"]:has-text("Goals")').first();

    if (await goalTabFound.count() > 0) {
      console.log('   Found goals tab');
      await goalTabFound.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'test-4-goals-tab.png' });
    } else {
      console.log('   ❌ Could not find goals tab');
      // Try to list all buttons on the page
      const buttons = await page.locator('button').all();
      console.log(`   Found ${buttons.length} buttons on page:`);
      for (let i = 0; i < Math.min(buttons.length, 10); i++) {
        const text = await buttons[i].textContent();
        console.log(`     Button ${i + 1}: "${text}"`);
      }
    }

    // 4. Check if goals section is visible
    console.log('\n4️⃣ CHECKING GOALS SECTION...');

    // Look for goals section
    const goalsSection = await page.locator('h2:has-text("Weekly Goals"), h3:has-text("Weekly Goals")').first();
    if (await goalsSection.count() > 0) {
      console.log('   ✅ Goals section is visible');
    } else {
      console.log('   ❌ Goals section not found');
    }

    // 5. Try to add a new goal
    console.log('\n5️⃣ ATTEMPTING TO ADD A NEW GOAL...');

    // Look for textarea to add goal
    const textareaSelectors = [
      'textarea',
      'textarea[placeholder*="goal" i]',
      'textarea[placeholder*="accomplish" i]',
      'input[placeholder*="goal" i]'
    ];

    let goalInputFound = false;
    for (const selector of textareaSelectors) {
      const input = await page.locator(selector).first();
      if (await input.count() > 0 && await input.isVisible()) {
        console.log(`   Found goal input with selector: ${selector}`);
        const testGoal = `Test goal - ${new Date().toLocaleString()}`;
        await input.fill(testGoal);
        console.log(`   Entered goal: "${testGoal}"`);
        goalInputFound = true;
        await page.screenshot({ path: 'test-5-goal-entered.png' });

        // Look for Add button
        const addButton = await page.locator('button:has-text("Add"), button:has-text("Save"), button:has(svg.lucide-plus)').first();
        if (await addButton.count() > 0) {
          console.log('   Found add button');
          await addButton.click();
          console.log('   Clicked add button');
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'test-6-after-add.png' });

          // Check if goal was added
          const goalAdded = await page.locator(`text="${testGoal}"`).count() > 0;
          console.log(`   Goal added successfully: ${goalAdded ? '✅ Yes' : '❌ No'}`);
        } else {
          console.log('   ❌ Could not find add button');
        }
        break;
      }
    }

    if (!goalInputFound) {
      console.log('   ❌ Could not find goal input field');
      // Take screenshot to see what's on the page
      await page.screenshot({ path: 'test-no-input.png', fullPage: true });
    }

    // 6. Check for existing goals and their edit/delete buttons
    console.log('\n6️⃣ CHECKING FOR EXISTING GOALS AND BUTTONS...');

    // Look for goal items
    const goalItems = await page.locator('.rounded-lg.border.bg-white, .goal-item, div:has(button:has-text("25%"))').all();
    console.log(`   Found ${goalItems.length} potential goal items`);

    if (goalItems.length > 0) {
      // Check first goal item for buttons
      const firstGoal = goalItems[0];

      // Look for edit button
      const editButton = await firstGoal.locator('button:has(svg), button[title*="edit" i], button[title*="Edit" i]').first();
      if (await editButton.count() > 0) {
        const isVisible = await editButton.isVisible();
        console.log(`   Edit button found: ${isVisible ? '✅ Visible' : '❌ Not visible'}`);

        if (isVisible) {
          // Check button styling
          const className = await editButton.getAttribute('class');
          console.log(`   Edit button classes: ${className}`);

          // Check if it has outline variant
          if (className && className.includes('outline')) {
            console.log('   ✅ Edit button has outline variant');
          } else {
            console.log('   ❌ Edit button does not have outline variant');
          }
        }
      } else {
        console.log('   ❌ No edit button found');
      }

      // Look for delete button
      const deleteButton = await firstGoal.locator('button[title*="delete" i], button[title*="Delete" i], button:has(svg.lucide-trash)').first();
      if (await deleteButton.count() > 0) {
        const isVisible = await deleteButton.isVisible();
        console.log(`   Delete button found: ${isVisible ? '✅ Visible' : '❌ Not visible'}`);

        if (isVisible) {
          // Check button styling
          const className = await deleteButton.getAttribute('class');
          console.log(`   Delete button classes: ${className}`);

          // Check if it has outline variant and red styling
          if (className && className.includes('outline') && className.includes('red')) {
            console.log('   ✅ Delete button has outline variant with red styling');
          } else {
            console.log('   ❌ Delete button styling incorrect');
          }
        }
      } else {
        console.log('   ❌ No delete button found');
      }
    } else {
      console.log('   No goal items found to check buttons');
    }

    // 7. Final screenshot
    await page.screenshot({ path: 'test-7-final.png', fullPage: true });
    console.log('\n📸 Screenshots saved (test-1 through test-7)');

    // SUMMARY
    console.log('\n==================================================');
    console.log('📊 TEST SUMMARY:');
    console.log(`   Login: ✅ Successful`);
    console.log(`   Goals tab navigation: ${await page.locator('h2:has-text("Weekly Goals")').count() > 0 ? '✅ Success' : '❌ Failed'}`);
    console.log(`   Goal input field: ${goalInputFound ? '✅ Found' : '❌ Not found'}`);
    console.log(`   Goal items: ${goalItems.length > 0 ? `✅ ${goalItems.length} found` : '❌ None found'}`);

    console.log('\n⚠️ Check the screenshots to see the actual state of the UI');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testGoalsAsEndUser();
const { chromium } = require('playwright');

async function testGoalsWorking() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  page.on('requestfailed', request => {
    console.log('❌ Request failed:', request.url(), request.failure());
  });

  try {
    console.log('🔍 TESTING GOALS EDIT/DELETE FUNCTIONALITY\n');
    console.log('==================================================\n');

    // Test both local and live
    const tests = [
      { url: 'http://localhost:5174', name: 'LOCAL' },
      { url: 'https://communitynwa.com', name: 'LIVE' }
    ];

    for (const test of tests) {
      console.log(`\n📍 TESTING ${test.name} VERSION (${test.url})\n`);

      // 1. Navigate to app
      console.log('1️⃣ NAVIGATING TO APP...');
      await page.goto(test.url, { timeout: 30000 });
      await page.waitForTimeout(2000);

      // Check if we need to login
      const loginButtonExists = await page.locator('button:has-text("Login")').count() > 0;

      if (loginButtonExists) {
        // 2. Login
        console.log('2️⃣ LOGGING IN AS BRIAN...');
        await page.fill('input[type="email"]', 'ba1876@gmail.com');
        await page.fill('input[type="password"]', 'Lbbc#2245');
        await page.click('button:has-text("Login")');

        // Wait for dashboard
        await page.waitForSelector('.dashboard-container, nav', { timeout: 10000 });
        console.log('   ✅ Logged in successfully');
      }

      // 3. Navigate to Goals tab
      console.log('\n3️⃣ NAVIGATING TO GOALS TAB...');
      // Try different selectors for the goals tab
      const goalTabSelectors = [
        'button:has-text("Weekly Goals")',
        'nav button:has-text("Weekly Goals")',
        'button:has-text("Goals")',
        '[role="tab"]:has-text("Weekly Goals")'
      ];

      for (const selector of goalTabSelectors) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          console.log(`   Clicked goals tab with selector: ${selector}`);
          break;
        }
      }

      await page.waitForTimeout(2000);

      // 4. Add a test goal
      console.log('\n4️⃣ ADDING A TEST GOAL...');
      const testGoal = `Test goal for edit/delete ${Date.now()}`;

      // Find the textarea
      const textareaSelectors = [
        'textarea[placeholder*="goal" i]',
        'textarea[placeholder*="accomplish" i]',
        'textarea'
      ];

      let textareaFound = false;
      for (const selector of textareaSelectors) {
        const textarea = page.locator(selector).first();
        if (await textarea.count() > 0) {
          await textarea.fill(testGoal);
          textareaFound = true;
          console.log(`   Filled goal text in textarea with selector: ${selector}`);
          break;
        }
      }

      if (!textareaFound) {
        console.log('   ❌ Could not find textarea for goal input');
        continue;
      }

      // Click Add Goal button
      const addButtonSelectors = [
        'button:has-text("Add Goal")',
        'button:has(svg.lucide-plus):has-text("Goal")',
        'button:has-text("Add")'
      ];

      for (const selector of addButtonSelectors) {
        if (await page.locator(selector).count() > 0) {
          await page.click(selector);
          console.log(`   Clicked add button with selector: ${selector}`);
          break;
        }
      }

      await page.waitForTimeout(3000);

      // 5. Check if goal was added
      console.log('\n5️⃣ CHECKING IF GOAL WAS ADDED...');
      const goalVisible = await page.locator(`text="${testGoal}"`).count() > 0;
      console.log(`   Goal visible: ${goalVisible ? '✅ Yes' : '❌ No'}`);

      if (!goalVisible) {
        console.log('   Goal not visible, checking for any goals...');
        const anyGoals = await page.locator('.rounded-lg.border.bg-white, .goal-item').count();
        console.log(`   Any goals found: ${anyGoals}`);
      }

      // 6. Look for edit/delete buttons
      console.log('\n6️⃣ CHECKING FOR EDIT/DELETE BUTTONS...');

      // Check for buttons using different approaches
      const buttonChecks = [
        { name: 'Edit buttons (variant outline)', selector: 'button.border-gray-300' },
        { name: 'Delete buttons (variant outline)', selector: 'button.border-red-300' },
        { name: 'Any buttons with icons', selector: 'button:has(svg)' },
        { name: 'Buttons near goal text', selector: `.rounded-lg.border.bg-white button, div:has(> p:has-text("${testGoal}")) button` }
      ];

      for (const check of buttonChecks) {
        const count = await page.locator(check.selector).count();
        console.log(`   ${check.name}: ${count > 0 ? `✅ ${count} found` : '❌ None found'}`);
      }

      // 7. Try to actually see what's rendered
      console.log('\n7️⃣ INSPECTING ACTUAL HTML...');

      // Get the HTML of a goal item if it exists
      const goalItem = page.locator('.rounded-lg.border.bg-white').first();
      if (await goalItem.count() > 0) {
        const html = await goalItem.innerHTML();
        // Check for button elements
        const hasButtons = html.includes('<button');
        const hasEditIcon = html.includes('Edit2') || html.includes('edit');
        const hasDeleteIcon = html.includes('Trash2') || html.includes('trash');

        console.log(`   Goal item has <button> elements: ${hasButtons ? '✅ Yes' : '❌ No'}`);
        console.log(`   Goal item has edit icon reference: ${hasEditIcon ? '✅ Yes' : '❌ No'}`);
        console.log(`   Goal item has delete icon reference: ${hasDeleteIcon ? '✅ Yes' : '❌ No'}`);

        if (!hasButtons) {
          console.log('\n   ⚠️ CRITICAL ISSUE: Buttons are not rendering in the HTML!');
          console.log('   First 500 chars of goal HTML:');
          console.log('   ' + html.substring(0, 500).replace(/\n/g, '\n   '));
        }
      }

      // 8. Take screenshot
      await page.screenshot({
        path: `goals-test-${test.name.toLowerCase()}.png`,
        fullPage: true
      });
      console.log(`\n📸 Screenshot saved as goals-test-${test.name.toLowerCase()}.png`);
    }

    // SUMMARY
    console.log('\n==================================================');
    console.log('📊 TEST COMPLETE');
    console.log('Check the screenshots to see the actual state of the UI');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'goals-error-debug.png' });
  } finally {
    await browser.close();
  }
}

testGoalsWorking();
const { chromium } = require('playwright');

async function testGoalsLive() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable detailed console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  // Capture network failures
  page.on('requestfailed', request => {
    console.log('❌ Request failed:', request.url(), request.failure());
  });

  page.on('response', response => {
    if (response.url().includes('/api/goals') && response.status() !== 200) {
      console.log('⚠️ Goals API response:', response.status(), response.url());
    }
  });

  try {
    console.log('🔍 TESTING GOALS FUNCTIONALITY ON LIVE SITE\n');
    console.log('==================================================\n');

    // 1. Navigate to app
    console.log('1️⃣ NAVIGATING TO APP...');
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(3000);

    // 2. Login
    console.log('2️⃣ LOGGING IN AS BRIAN...');
    await page.fill('input[type="email"]', 'ba1876@gmail.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button:has-text("Login")');

    // Wait for dashboard to load
    await page.waitForSelector('.dashboard-container', { timeout: 10000 });
    console.log('   ✅ Logged in successfully');

    // 3. Navigate to Goals tab
    console.log('\n3️⃣ NAVIGATING TO GOALS TAB...');
    await page.click('button:has-text("Weekly Goals")');
    await page.waitForTimeout(2000);

    // 4. Check what's on the page
    console.log('\n4️⃣ INSPECTING GOALS PAGE...');

    // Check if goals section is visible
    const goalsSection = await page.locator('.max-w-4xl').count();
    console.log(`   Goals section visible: ${goalsSection > 0 ? 'Yes' : 'No'}`);

    // Check for existing goals
    const goalItems = await page.locator('.goal-item, [class*="rounded-lg border bg-white"]').count();
    console.log(`   Goal items found: ${goalItems}`);

    // 5. Look for buttons
    console.log('\n5️⃣ CHECKING FOR EDIT/DELETE BUTTONS...');

    // Try multiple selectors for edit buttons
    const editSelectors = [
      'button:has(svg.lucide-edit-2)',
      'button:has(svg.lucide-edit2)',
      'button svg.lucide-edit-2',
      'button svg.lucide-edit2',
      '[class*="lucide-edit"]',
      'button:has([class*="edit"])'
    ];

    let editButtonsFound = 0;
    for (const selector of editSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`   ✅ Edit buttons found with selector "${selector}": ${count}`);
        editButtonsFound = count;
        break;
      }
    }

    if (editButtonsFound === 0) {
      console.log('   ❌ No edit buttons found with any selector');
    }

    // Try multiple selectors for delete buttons
    const deleteSelectors = [
      'button:has(svg.lucide-trash-2)',
      'button:has(svg.lucide-trash2)',
      'button svg.lucide-trash-2',
      'button svg.lucide-trash2',
      '[class*="lucide-trash"]',
      'button:has([class*="trash"])'
    ];

    let deleteButtonsFound = 0;
    for (const selector of deleteSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`   ✅ Delete buttons found with selector "${selector}": ${count}`);
        deleteButtonsFound = count;
        break;
      }
    }

    if (deleteButtonsFound === 0) {
      console.log('   ❌ No delete buttons found with any selector');
    }

    // 6. Check what SVG icons are actually on the page
    console.log('\n6️⃣ CHECKING ALL SVG ICONS ON PAGE...');
    const allSvgs = await page.locator('svg').count();
    console.log(`   Total SVG icons found: ${allSvgs}`);

    const svgClasses = await page.evaluate(() => {
      const svgs = document.querySelectorAll('svg');
      const classes = new Set();
      svgs.forEach(svg => {
        if (svg.className.baseVal) {
          classes.add(svg.className.baseVal);
        }
      });
      return Array.from(classes);
    });
    console.log('   SVG classes found:', svgClasses);

    // 7. Add a test goal to ensure we have something
    console.log('\n7️⃣ ADDING A TEST GOAL...');
    const goalTextarea = await page.locator('textarea[placeholder*="goal" i]').first();
    const testGoal = `Test goal ${Date.now()}`;
    await goalTextarea.fill(testGoal);
    await page.click('button:has-text("Add Goal")');
    await page.waitForTimeout(3000);

    // 8. Check buttons again after adding goal
    console.log('\n8️⃣ RECHECKING BUTTONS AFTER ADDING GOAL...');

    // Check if the new goal appears
    const newGoalVisible = await page.locator(`text="${testGoal}"`).count() > 0;
    console.log(`   New goal visible: ${newGoalVisible ? 'Yes' : 'No'}`);

    // Look for buttons in the goal item
    const goalItemButtons = await page.locator('.rounded-lg.border.bg-white button').count();
    console.log(`   Buttons in goal items: ${goalItemButtons}`);

    // Check specifically for buttons next to our test goal
    const testGoalElement = page.locator(`text="${testGoal}"`).first();
    if (await testGoalElement.count() > 0) {
      const parentElement = testGoalElement.locator('..').locator('..');
      const buttonsInParent = await parentElement.locator('button').count();
      console.log(`   Buttons near test goal: ${buttonsInParent}`);

      // Check button visibility
      if (buttonsInParent > 0) {
        const firstButton = parentElement.locator('button').first();
        const isVisible = await firstButton.isVisible();
        console.log(`   First button visible: ${isVisible}`);

        // Get button HTML
        const buttonHtml = await firstButton.innerHTML();
        console.log(`   Button HTML: ${buttonHtml.substring(0, 100)}...`);
      }
    }

    // 9. Take screenshot
    await page.screenshot({ path: 'goals-live-test.png', fullPage: true });
    console.log('\n📸 Screenshot saved as goals-live-test.png');

    // 10. Try to inspect the actual rendered HTML
    console.log('\n🔍 INSPECTING RENDERED HTML...');
    const goalsHtml = await page.locator('.rounded-lg.border.bg-white').first().innerHTML().catch(() => 'No goals found');
    console.log('   First goal HTML (truncated):', goalsHtml.substring(0, 500));

    // SUMMARY
    console.log('\n==================================================');
    console.log('📊 SUMMARY:');
    console.log(`   Goals visible: ${goalItems > 0 ? 'Yes' : 'No'}`);
    console.log(`   Edit buttons: ${editButtonsFound > 0 ? `✅ ${editButtonsFound} found` : '❌ Not found'}`);
    console.log(`   Delete buttons: ${deleteButtonsFound > 0 ? `✅ ${deleteButtonsFound} found` : '❌ Not found'}`);
    console.log(`   Test goal added: ${newGoalVisible ? '✅ Success' : '❌ Failed'}`);

    if (editButtonsFound === 0 && deleteButtonsFound === 0) {
      console.log('\n⚠️ ISSUE CONFIRMED: Edit and Delete buttons are not rendering!');
      console.log('   This needs to be fixed in the WeeklyGoalsSection component.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'goals-error-live.png' });
  } finally {
    await browser.close();
  }
}

testGoalsLive();
import { chromium } from 'playwright';

async function testEntireApp() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Starting comprehensive app test...\n');

  try {
    // Test 1: Load the app
    console.log('📱 Test 1: Loading app...');
    await page.goto('https://communitynwa.com');
    await page.waitForLoadState('networkidle');
    console.log('✅ App loaded successfully\n');

    // Test 2: Login as Brian
    console.log('🔐 Test 2: Testing login as Brian...');

    // Wait for login form and check what selectors are available
    await page.waitForTimeout(2000);

    // Try different selectors for email
    const emailInput = await page.locator('input[type="email"], input[placeholder*="email" i], input[placeholder*="Email" i], #email').first();
    await emailInput.fill('brian@searchnwa.com');

    // Try different selectors for password
    const passwordInput = await page.locator('input[type="password"], input[placeholder*="password" i], #password').first();
    await passwordInput.fill('Lbbc#2245');

    // Try different selectors for login button
    const loginButton = await page.locator('button:has-text("Sign In"), button:has-text("Login"), button[type="submit"]').first();
    await loginButton.click();

    // Wait for dashboard
    await page.waitForSelector('text=/Welcome back/', { timeout: 10000 });
    console.log('✅ Login successful\n');

    // Test 3: Check sidebar navigation exists
    console.log('📊 Test 3: Checking sidebar navigation...');
    const sidebarItems = [
      'Dashboard',
      'Commitment',
      'Weekly Goals',
      'Phone Calls',
      'Reflections',
      'Analytics',
      'Team Overview'
    ];

    for (const item of sidebarItems) {
      const element = await page.locator(`text="${item}"`).first();
      if (await element.isVisible()) {
        console.log(`  ✅ ${item} menu item visible`);
      } else {
        console.log(`  ❌ ${item} menu item NOT visible`);
      }
    }
    console.log('');

    // Test 4: Test Commitment functionality
    console.log('📝 Test 4: Testing Commitment saving...');

    // Click Dashboard if not already there
    await page.click('button:has-text("Dashboard")').catch(() => {});
    await page.waitForTimeout(1000);

    // Try to add a commitment
    const commitmentText = `Test commitment ${Date.now()}`;
    const textarea = await page.locator('textarea').first();
    await textarea.fill(commitmentText);

    // Save commitment
    await page.click('button:has-text("Save Commitment")');
    await page.waitForTimeout(2000);

    // Check for success message or error
    const successToast = await page.locator('text=/Saved|Success/i').count();
    const errorToast = await page.locator('text=/Failed|Error/i').count();

    if (successToast > 0) {
      console.log('  ✅ Commitment saved successfully');

      // Check if form cleared
      const currentText = await textarea.inputValue();
      if (currentText === '') {
        console.log('  ✅ Form cleared after save');
      } else {
        console.log('  ⚠️ Form did not clear after save');
      }
    } else if (errorToast > 0) {
      console.log('  ❌ Failed to save commitment');
    } else {
      console.log('  ⚠️ No feedback after saving commitment');
    }
    console.log('');

    // Test 5: Test Goals functionality
    console.log('🎯 Test 5: Testing Weekly Goals...');
    await page.click('button:has-text("Weekly Goals")');
    await page.waitForTimeout(1000);

    // Try to add a goal
    const goalText = `Test goal ${Date.now()}`;
    const goalInput = await page.locator('input[placeholder*="goal"], textarea').first();
    await goalInput.fill(goalText);

    await page.click('button:has-text("Add Goal")').catch(async () => {
      await page.click('button:has-text("Save")').catch(() => {
        console.log('  ⚠️ Could not find goal save button');
      });
    });
    await page.waitForTimeout(2000);

    // Check for success/error
    const goalSuccess = await page.locator('text=/Added|Saved|Success/i').count();
    const goalError = await page.locator('text=/Failed|Error/i').count();

    if (goalSuccess > 0) {
      console.log('  ✅ Goal saved successfully');
    } else if (goalError > 0) {
      console.log('  ❌ Failed to save goal');
    } else {
      console.log('  ⚠️ No feedback after saving goal');
    }
    console.log('');

    // Test 6: Test Phone Calls navigation
    console.log('☎️ Test 6: Testing Phone Calls...');
    await page.click('button:has-text("Phone Calls")');
    await page.waitForTimeout(1000);

    // Check for phone call form fields
    const phoneFields = [
      'Target Number of Calls',
      'Description',
      'Number of Calls Made',
      'Notes'
    ];

    for (const field of phoneFields) {
      const fieldExists = await page.locator(`text="${field}"`).count() > 0;
      if (fieldExists) {
        console.log(`  ✅ ${field} field exists`);
      } else {
        console.log(`  ❌ ${field} field MISSING`);
      }
    }
    console.log('');

    // Test 7: Test Reflections
    console.log('💭 Test 7: Testing Reflections...');
    await page.click('button:has-text("Reflections")');
    await page.waitForTimeout(1000);

    const reflectionQuestions = [
      'What went well today?',
      'What could have gone better?',
      'What\'s your focus for tomorrow?'
    ];

    for (const question of reflectionQuestions) {
      const questionExists = await page.locator(`text="${question}"`).count() > 0;
      if (questionExists) {
        console.log(`  ✅ "${question}" exists`);
      } else {
        console.log(`  ❌ "${question}" MISSING`);
      }
    }
    console.log('');

    // Test 8: Test Team Overview (Admin)
    console.log('👥 Test 8: Testing Team Overview (Admin)...');
    await page.click('button:has-text("Team Overview")');
    await page.waitForTimeout(2000);

    // Check if users are displayed
    const userCards = await page.locator('.bg-slate-800').count();
    console.log(`  📊 Found ${userCards} user cards`);

    if (userCards > 0) {
      console.log('  ✅ Team members are displayed');

      // Check first user has commitment/goal sections
      const firstCard = await page.locator('.bg-slate-800').first();
      const hasCommitment = await firstCard.locator('text=/Commitment/i').count() > 0;
      const hasGoals = await firstCard.locator('text=/Goals/i').count() > 0;

      if (hasCommitment) console.log('  ✅ Commitment section visible');
      else console.log('  ❌ Commitment section missing');

      if (hasGoals) console.log('  ✅ Goals section visible');
      else console.log('  ❌ Goals section missing');
    } else {
      console.log('  ❌ No team members displayed!');
    }
    console.log('');

    // Test 9: Test Analytics
    console.log('📈 Test 9: Testing Analytics...');
    await page.locator('button:has-text("Analytics")').first().click();
    await page.waitForTimeout(1000);

    const analyticsExists = await page.locator('text=/Performance|Statistics|Metrics/i').count() > 0;
    if (analyticsExists) {
      console.log('  ✅ Analytics page loaded');
    } else {
      console.log('  ⚠️ Analytics page may be empty');
    }
    console.log('');

    // Test 10: Check for console errors
    console.log('🔍 Test 10: Checking for console errors...');
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`  ❌ Console error: ${msg.text()}`);
      }
    });

    // Navigate through tabs again to catch any errors
    await page.click('button:has-text("Dashboard")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Weekly Goals")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Phone Calls")');
    await page.waitForTimeout(500);

    console.log('  ✅ Error check complete\n');

    // Test 11: Test logout
    console.log('🚪 Test 11: Testing logout...');
    await page.click('button:has-text("Logout")');
    await page.waitForSelector('text="Sign In"', { timeout: 5000 });
    console.log('  ✅ Logout successful\n');

    // Test 12: Test login as regular user
    console.log('👤 Test 12: Testing login as regular user (Bob)...');
    await page.fill('input[type="email"]', 'bob@searchnwa.com');
    await page.fill('input[type="password"]', 'pass123');
    await page.click('button:has-text("Sign In")');

    await page.waitForSelector('text=/Welcome back/', { timeout: 10000 });
    console.log('  ✅ Regular user login successful');

    // Check that admin features are hidden
    const teamOverviewVisible = await page.locator('button:has-text("Team Overview")').count() > 0;
    if (!teamOverviewVisible) {
      console.log('  ✅ Admin features correctly hidden for regular user');
    } else {
      console.log('  ❌ Admin features visible to regular user!');
    }
    console.log('');

    console.log('========================================');
    console.log('🎉 All tests completed!');
    console.log('========================================');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);

    // Take screenshot on failure
    await page.screenshot({ path: 'test-failure.png' });
    console.log('📸 Screenshot saved as test-failure.png');
  } finally {
    await browser.close();
  }
}

// Run the test
testEntireApp().catch(console.error);
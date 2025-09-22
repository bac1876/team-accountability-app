const { chromium } = require('playwright');

async function testGoalsBrian() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  const page = await browser.newPage();

  try {
    console.log('🔍 TESTING GOALS WITH BRIAN\'S CORRECT CREDENTIALS\n');

    // Navigate to live site
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(2000);

    // Login with correct credentials
    console.log('Logging in as brian@searchnwa.com...');
    await page.fill('input[placeholder*="email" i]', 'brian@searchnwa.com');
    await page.fill('input[placeholder*="password" i]', 'Lbbc#2245');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard
    console.log('Waiting for dashboard to load...');
    await page.waitForTimeout(8000);

    // Navigate to Goals tab
    console.log('Looking for Weekly Goals tab...');
    const goalsTab = await page.locator('button:has-text("Weekly Goals"), button:has-text("Goals")').first();
    if (await goalsTab.count() > 0) {
      await goalsTab.click();
      console.log('✅ Clicked Goals tab');
      await page.waitForTimeout(3000);
    }

    // Check for edit/delete buttons
    console.log('\nCHECKING FOR EDIT/DELETE BUTTONS:');

    const goalItems = await page.locator('.rounded-lg.border.bg-white').all();
    console.log(`Found ${goalItems.length} goal items`);

    if (goalItems.length > 0) {
      // Check first goal for buttons
      const firstGoal = goalItems[0];

      const editButton = await firstGoal.locator('button[title*="Edit" i], button:has(svg.lucide-edit)').first();
      const deleteButton = await firstGoal.locator('button[title*="Delete" i], button:has(svg.lucide-trash)').first();

      const hasEdit = await editButton.count() > 0 && await editButton.isVisible();
      const hasDelete = await deleteButton.count() > 0 && await deleteButton.isVisible();

      console.log(`Edit button visible: ${hasEdit ? '✅ YES' : '❌ NO'}`);
      console.log(`Delete button visible: ${hasDelete ? '✅ YES' : '❌ NO'}`);

      if (hasEdit) {
        // Try clicking edit button
        await editButton.click();
        console.log('✅ Successfully clicked edit button!');
        await page.waitForTimeout(2000);

        // Look for cancel button to confirm edit mode
        const cancelButton = await page.locator('button:has-text("Cancel")').first();
        if (await cancelButton.count() > 0) {
          console.log('✅ Edit mode activated');
          await cancelButton.click();
        }
      }
    } else {
      console.log('No goals found - adding a test goal...');

      const textarea = await page.locator('textarea').first();
      if (await textarea.count() > 0) {
        await textarea.fill('Test goal to check buttons');
        const addButton = await page.locator('button:has(svg.lucide-plus)').first();
        if (await addButton.count() > 0) {
          await addButton.click();
          console.log('Added test goal');
          await page.waitForTimeout(3000);

          // Check again for buttons
          const newGoal = await page.locator('.rounded-lg.border.bg-white').first();
          const editBtn = await newGoal.locator('button:has(svg)').first();
          console.log(`Edit/Delete buttons visible: ${await editBtn.count() > 0 ? '✅ YES' : '❌ NO'}`);
        }
      }
    }

    await page.screenshot({ path: 'goals-brian-final.png', fullPage: true });
    console.log('\n📸 Screenshot saved as goals-brian-final.png');

  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'goals-brian-error.png' });
  } finally {
    await page.waitForTimeout(5000); // Keep open for viewing
    await browser.close();
  }
}

testGoalsBrian();
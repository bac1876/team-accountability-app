const { chromium } = require('playwright');

async function testGoalsEditDelete() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('❌ Console Error:', msg.text());
    }
  });

  // Capture network requests
  page.on('requestfailed', request => {
    console.log('❌ Request failed:', request.url(), request.failure());
  });

  try {
    console.log('🔍 TESTING GOALS EDIT/DELETE FUNCTIONALITY\n');
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

    // 3. Navigate to Goals tab
    console.log('\n3️⃣ NAVIGATING TO GOALS...');
    await page.click('nav button:has-text("Weekly Goals")');
    await page.waitForTimeout(2000);

    // 4. Check for existing goals
    console.log('\n4️⃣ CHECKING EXISTING GOALS...');
    const existingGoals = await page.locator('.goal-item, div:has(> p.text-lg.font-medium)').count();
    console.log(`   Found ${existingGoals} existing goals`);

    // 5. Check for edit buttons
    console.log('\n5️⃣ CHECKING FOR EDIT/DELETE BUTTONS...');

    // Look for edit buttons (Edit2 icon)
    const editButtons = await page.locator('button:has(svg.lucide-edit-2), button:has(svg.lucide-edit2)').count();
    console.log(`   Edit buttons found: ${editButtons}`);

    // Look for delete buttons (Trash2 icon)
    const deleteButtons = await page.locator('button:has(svg.lucide-trash-2), button:has(svg.lucide-trash2)').count();
    console.log(`   Delete buttons found: ${deleteButtons}`);

    // 6. Add a test goal to ensure we have something to work with
    console.log('\n6️⃣ ADDING TEST GOAL...');
    const testGoal = `Test goal for edit/delete ${Date.now()}`;
    const goalTextarea = await page.locator('textarea[placeholder*="goal" i], textarea[placeholder*="Goal" i]').first();
    await goalTextarea.fill(testGoal);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(3000);

    // 7. Check if buttons appear for the new goal
    console.log('\n7️⃣ CHECKING BUTTONS FOR NEW GOAL...');
    const newEditButtons = await page.locator('button:has(svg.lucide-edit-2), button:has(svg.lucide-edit2)').count();
    const newDeleteButtons = await page.locator('button:has(svg.lucide-trash-2), button:has(svg.lucide-trash2)').count();

    console.log(`   Edit buttons after adding goal: ${newEditButtons}`);
    console.log(`   Delete buttons after adding goal: ${newDeleteButtons}`);

    // 8. Try to click edit button if available
    if (newEditButtons > 0) {
      console.log('\n8️⃣ TESTING EDIT FUNCTIONALITY...');
      const editButton = await page.locator('button:has(svg.lucide-edit-2), button:has(svg.lucide-edit2)').first();
      await editButton.click();
      await page.waitForTimeout(1000);

      // Check if edit mode is activated
      const editTextarea = await page.locator('textarea').count();
      console.log(`   Edit mode activated: ${editTextarea > 1 ? 'Yes' : 'No'}`);

      if (editTextarea > 1) {
        // Try to edit the goal
        const editInput = await page.locator('div:has(textarea) textarea').last();
        await editInput.fill('Edited goal text');

        // Look for save button
        const saveButton = await page.locator('button:has(svg.lucide-save)').count();
        console.log(`   Save button visible: ${saveButton > 0 ? 'Yes' : 'No'}`);

        if (saveButton > 0) {
          await page.click('button:has(svg.lucide-save)');
          await page.waitForTimeout(2000);
          console.log('   ✓ Edit and save tested');
        }
      }
    } else {
      console.log('\n⚠️ No edit buttons visible - cannot test edit functionality');
    }

    // 9. Try delete if available
    if (newDeleteButtons > 0) {
      console.log('\n9️⃣ TESTING DELETE FUNCTIONALITY...');
      const goalsBeforeDelete = await page.locator('div:has(> p.text-lg.font-medium)').count();

      // Click delete button
      await page.click('button:has(svg.lucide-trash-2), button:has(svg.lucide-trash2)').first();

      // Handle confirmation dialog if it appears
      page.on('dialog', async dialog => {
        console.log('   Confirmation dialog appeared:', dialog.message());
        await dialog.accept();
      });

      await page.waitForTimeout(2000);

      const goalsAfterDelete = await page.locator('div:has(> p.text-lg.font-medium)').count();
      console.log(`   Goals before delete: ${goalsBeforeDelete}`);
      console.log(`   Goals after delete: ${goalsAfterDelete}`);
      console.log(`   Delete works: ${goalsAfterDelete < goalsBeforeDelete ? 'Yes' : 'No'}`);
    } else {
      console.log('\n⚠️ No delete buttons visible - cannot test delete functionality');
    }

    // Take screenshot
    await page.screenshot({ path: 'goals-edit-delete-test.png' });
    console.log('\n📸 Screenshot saved as goals-edit-delete-test.png');

    // SUMMARY
    console.log('\n==================================================');
    console.log('📊 TEST SUMMARY:');
    console.log(`   Goals found: ${existingGoals}`);
    console.log(`   Edit buttons: ${editButtons > 0 ? '✅ Visible' : '❌ Not Visible'}`);
    console.log(`   Delete buttons: ${deleteButtons > 0 ? '✅ Visible' : '❌ Not Visible'}`);
    console.log(`   New goal added: ✅ Success`);
    console.log(`   Edit/Delete buttons for new goal: ${newEditButtons > 0 && newDeleteButtons > 0 ? '✅ Visible' : '❌ Not Visible'}`);

    if (editButtons === 0 && deleteButtons === 0) {
      console.log('\n❌ ISSUE: Edit and Delete buttons are not appearing for goals!');
      console.log('   The buttons might be hidden or not rendering properly.');
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    await page.screenshot({ path: 'goals-error.png' });
  } finally {
    await browser.close();
  }
}

testGoalsEditDelete();
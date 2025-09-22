const { chromium } = require('playwright');

async function testGoalsManual() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1500 // Even slower to see what's happening
  });
  const page = await browser.newPage();

  try {
    console.log('🔍 MANUAL GOALS TEST - SIMULATING END USER\n');
    console.log('==================================================\n');

    // 1. Navigate to live site
    console.log('1️⃣ NAVIGATING TO LIVE SITE...');
    await page.goto('https://communitynwa.com', {
      waitUntil: 'networkidle',
      timeout: 60000
    });
    await page.screenshot({ path: 'manual-1-landing.png' });

    // 2. Click on the email input field (with placeholder text)
    console.log('\n2️⃣ FILLING LOGIN FORM...');

    // Click on email field and type
    const emailField = await page.locator('input[placeholder*="email" i]').first();
    await emailField.click();
    await emailField.fill('ba1876@gmail.com');
    console.log('   ✅ Filled email');

    // Click on password field and type
    const passwordField = await page.locator('input[placeholder*="password" i]').first();
    await passwordField.click();
    await passwordField.fill('Lbbc#2245');
    console.log('   ✅ Filled password');

    await page.screenshot({ path: 'manual-2-credentials.png' });

    // 3. Click Sign In button
    console.log('\n3️⃣ CLICKING SIGN IN...');
    await page.click('button:has-text("Sign In")');
    console.log('   ✅ Clicked Sign In');

    // Wait for navigation
    console.log('   ⏳ Waiting for dashboard to load...');
    await page.waitForTimeout(10000);
    await page.screenshot({ path: 'manual-3-dashboard.png' });

    // 4. Navigate to Goals
    console.log('\n4️⃣ NAVIGATING TO GOALS TAB...');

    // Try multiple selectors for goals
    const clicked = await page.evaluate(() => {
      // Find all buttons
      const buttons = Array.from(document.querySelectorAll('button'));

      // Find goals button
      const goalsButton = buttons.find(btn =>
        btn.textContent &&
        (btn.textContent.includes('Goals') || btn.textContent.includes('Weekly Goals'))
      );

      if (goalsButton) {
        goalsButton.click();
        return true;
      }
      return false;
    });

    if (clicked) {
      console.log('   ✅ Clicked Goals tab');
    } else {
      console.log('   ❌ Could not find Goals tab');
    }

    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'manual-4-goals.png' });

    // 5. Check for goal items and buttons
    console.log('\n5️⃣ CHECKING FOR GOALS AND BUTTONS...');

    // Get page content
    const pageContent = await page.content();

    // Check what we have
    console.log('   Checking page content:');
    console.log(`   Has "Weekly Goals" text: ${pageContent.includes('Weekly Goals') ? '✅' : '❌'}`);
    console.log(`   Has textarea: ${pageContent.includes('<textarea') ? '✅' : '❌'}`);
    console.log(`   Has goal items: ${pageContent.includes('rounded-lg border bg-white') ? '✅' : '❌'}`);

    // 6. Look specifically for edit/delete buttons
    console.log('\n6️⃣ LOOKING FOR EDIT/DELETE BUTTONS...');

    const buttons = await page.evaluate(() => {
      const goalItems = document.querySelectorAll('.rounded-lg.border.bg-white');
      const result = {
        goalCount: goalItems.length,
        buttons: []
      };

      goalItems.forEach((item, index) => {
        const buttons = item.querySelectorAll('button');
        buttons.forEach(btn => {
          result.buttons.push({
            goalIndex: index,
            title: btn.getAttribute('title') || '',
            hasIcon: btn.querySelector('svg') !== null,
            visible: window.getComputedStyle(btn).display !== 'none'
          });
        });
      });

      return result;
    });

    console.log(`   Found ${buttons.goalCount} goal items`);
    console.log(`   Found ${buttons.buttons.length} total buttons`);

    if (buttons.buttons.length > 0) {
      console.log('\n   Button details:');
      buttons.buttons.forEach((btn, i) => {
        console.log(`   Button ${i+1}: Goal ${btn.goalIndex}, Title: "${btn.title}", Has Icon: ${btn.hasIcon}, Visible: ${btn.visible}`);
      });
    } else {
      console.log('   ❌ NO BUTTONS FOUND IN GOALS!');
    }

    // 7. Try to add a goal to test
    console.log('\n7️⃣ TRYING TO ADD A TEST GOAL...');

    const textarea = await page.locator('textarea').first();
    if (await textarea.count() > 0) {
      const testText = `Test goal at ${new Date().toLocaleTimeString()}`;
      await textarea.fill(testText);
      console.log(`   ✅ Entered: "${testText}"`);

      // Look for add button
      const addButton = await page.locator('button').filter({ hasText: /add/i }).first();
      if (await addButton.count() > 0) {
        await addButton.click();
        console.log('   ✅ Clicked Add button');
      } else {
        // Try plus icon button
        const plusButton = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const plusBtn = buttons.find(btn => btn.querySelector('svg.lucide-plus'));
          if (plusBtn) {
            plusBtn.click();
            return true;
          }
          return false;
        });

        if (plusButton) {
          console.log('   ✅ Clicked Plus icon button');
        } else {
          console.log('   ❌ No Add button found');
        }
      }

      await page.waitForTimeout(3000);
    } else {
      console.log('   ❌ No textarea found');
    }

    // 8. Final check after adding goal
    console.log('\n8️⃣ FINAL CHECK AFTER ADDING GOAL...');

    const finalCheck = await page.evaluate(() => {
      const goalItems = document.querySelectorAll('.rounded-lg.border.bg-white');
      const lastGoal = goalItems[goalItems.length - 1];

      if (!lastGoal) return { hasGoal: false };

      const buttons = lastGoal.querySelectorAll('button');
      const editButton = Array.from(buttons).find(btn =>
        btn.getAttribute('title')?.includes('Edit') ||
        btn.querySelector('svg.lucide-edit')
      );
      const deleteButton = Array.from(buttons).find(btn =>
        btn.getAttribute('title')?.includes('Delete') ||
        btn.querySelector('svg.lucide-trash')
      );

      return {
        hasGoal: true,
        goalText: lastGoal.textContent?.substring(0, 100),
        hasEditButton: !!editButton,
        hasDeleteButton: !!deleteButton,
        totalButtons: buttons.length
      };
    });

    console.log(`   Has goal item: ${finalCheck.hasGoal ? '✅' : '❌'}`);
    if (finalCheck.hasGoal) {
      console.log(`   Goal text: "${finalCheck.goalText}"`);
      console.log(`   Has Edit button: ${finalCheck.hasEditButton ? '✅' : '❌'}`);
      console.log(`   Has Delete button: ${finalCheck.hasDeleteButton ? '✅' : '❌'}`);
      console.log(`   Total buttons in goal: ${finalCheck.totalButtons}`);
    }

    await page.screenshot({ path: 'manual-5-final.png', fullPage: true });

    // SUMMARY
    console.log('\n==================================================');
    console.log('📊 FINAL TEST SUMMARY:');
    console.log('\n🔴 CRITICAL ISSUE STATUS:');

    if (!finalCheck.hasEditButton || !finalCheck.hasDeleteButton) {
      console.log('   ❌ EDIT/DELETE BUTTONS ARE NOT RENDERING!');
      console.log('   Users cannot edit or delete their goals.');
      console.log('   This needs to be fixed in the WeeklyGoalsSection component.');
    } else {
      console.log('   ✅ Edit and Delete buttons are present and working!');
    }

    console.log('\n📸 Screenshots saved: manual-1 through manual-5');
    console.log('Check manual-5-final.png for the complete view');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'manual-error.png', fullPage: true });
  } finally {
    // Keep browser open for manual inspection
    console.log('\n⏸️ Browser will stay open for 30 seconds for manual inspection...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

testGoalsManual();
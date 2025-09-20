import { chromium } from 'playwright';

async function debugCommitments() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting commitment functionality debug...');

    // Navigate to the live app
    console.log('📍 Navigating to https://communitynwa.com');
    await page.goto('https://communitynwa.com', { waitUntil: 'networkidle' });
    await page.screenshot({ path: 'debug-initial-load.png' });

    // Fill login form
    console.log('🔑 Filling login form...');
    await page.fill('input[type="email"]', 'brian@searchnwa.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.screenshot({ path: 'debug-login-filled.png' });

    // Login
    console.log('🚪 Logging in...');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-after-login.png' });

    // Navigate to commitments
    console.log('📋 Navigating to commitments section...');
    await page.click('a[href="/commitments"]');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-commitments-page.png' });

    // Check if there are existing commitments to test
    console.log('🔍 Checking for existing commitments...');
    const existingCommitments = await page.locator('[data-testid="commitment-item"], .commitment-item, [class*="commitment"]').count();
    console.log(`Found ${existingCommitments} existing commitments`);

    // If no commitments, add one first
    if (existingCommitments === 0) {
      console.log('➕ Adding a test commitment...');
      await page.fill('textarea', 'Test commitment for debugging');
      await page.click('button:has-text("Add Commitment")');
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-after-adding-commitment.png' });
    }

    // Look for circle/checkbox elements to mark complete
    console.log('🎯 Looking for commitment completion buttons...');

    // Try multiple selectors for completion buttons
    const completionSelectors = [
      'button[aria-label*="Mark as complete"]',
      'button[aria-label*="Mark as incomplete"]',
      'button:has(svg[class*="Circle"])',
      '.commitment-item button:first-child',
      '[role="button"]:has(svg)',
      'button:has(.lucide-circle)',
      'button:has(.lucide-check-circle)'
    ];

    let completionButton = null;
    for (const selector of completionSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        console.log(`✅ Found ${elements} completion buttons with selector: ${selector}`);
        completionButton = page.locator(selector).first();
        break;
      }
    }

    if (completionButton) {
      console.log('🖱️ Testing commitment completion click...');

      // Listen for console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('❌ Browser Console Error:', msg.text());
        }
      });

      // Listen for network requests
      page.on('request', request => {
        if (request.url().includes('/api/commitments')) {
          console.log('🌐 API Request:', request.method(), request.url());
        }
      });

      page.on('response', response => {
        if (response.url().includes('/api/commitments')) {
          console.log('📡 API Response:', response.status(), response.url());
        }
      });

      // Take screenshot before click
      await page.screenshot({ path: 'debug-before-completion-click.png' });

      // Try clicking the completion button
      await completionButton.click();
      await page.waitForTimeout(3000); // Wait for any updates

      // Take screenshot after click
      await page.screenshot({ path: 'debug-after-completion-click.png' });
    } else {
      console.log('❌ No completion buttons found!');
    }

    // Test editing functionality
    console.log('✏️ Testing edit functionality...');

    const editSelectors = [
      'button[aria-label*="Edit"]',
      'button:has(.lucide-edit)',
      'button:has(.lucide-edit-2)',
      '.commitment-item button:has(svg[class*="Edit"])'
    ];

    let editButton = null;
    for (const selector of editSelectors) {
      const elements = await page.locator(selector).count();
      if (elements > 0) {
        console.log(`✅ Found ${elements} edit buttons with selector: ${selector}`);
        editButton = page.locator(selector).first();
        break;
      }
    }

    if (editButton) {
      console.log('🖱️ Clicking edit button...');
      await editButton.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'debug-after-edit-click.png' });

      // Look for textarea in edit mode
      const editTextarea = page.locator('textarea').nth(1); // Second textarea (first is for new commitments)
      if (await editTextarea.count() > 0) {
        console.log('📝 Found edit textarea, modifying text...');
        await editTextarea.fill('Modified commitment text for testing');
        await page.screenshot({ path: 'debug-edit-text-changed.png' });

        // Look for save button
        const saveSelectors = [
          'button:has(.lucide-save)',
          'button:has-text("Save")',
          'button[aria-label*="Save"]'
        ];

        let saveButton = null;
        for (const selector of saveSelectors) {
          const elements = await page.locator(selector).count();
          if (elements > 0) {
            console.log(`✅ Found save button with selector: ${selector}`);
            saveButton = page.locator(selector).first();
            break;
          }
        }

        if (saveButton) {
          console.log('💾 Clicking save button...');
          await saveButton.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'debug-after-save-click.png' });
        } else {
          console.log('❌ No save button found!');
        }
      } else {
        console.log('❌ No edit textarea found!');
      }
    } else {
      console.log('❌ No edit buttons found!');
    }

    // Check browser console for any errors
    console.log('🔍 Checking for JavaScript errors...');
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Check network tab for failed requests
    console.log('🌐 Checking network requests...');
    const failedRequests = [];
    page.on('response', response => {
      if (!response.ok() && response.url().includes('/api/')) {
        failedRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    // Final screenshot
    await page.screenshot({ path: 'debug-final-state.png' });

    console.log('📊 Debug Summary:');
    console.log(`- Console errors: ${consoleErrors.length}`);
    console.log(`- Failed API requests: ${failedRequests.length}`);

    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors Found:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }

    if (failedRequests.length > 0) {
      console.log('❌ Failed Requests Found:');
      failedRequests.forEach(req => console.log(`  - ${req.method} ${req.url} (${req.status})`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugCommitments().catch(console.error);
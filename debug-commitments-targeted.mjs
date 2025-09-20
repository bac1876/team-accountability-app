import { chromium } from 'playwright';

async function debugCommitments() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting targeted commitment functionality debug...');

    // Track console errors and network requests
    const consoleErrors = [];
    const networkRequests = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Browser Console Error:', msg.text());
        consoleErrors.push(msg.text());
      }
    });

    page.on('request', request => {
      if (request.url().includes('/api/commitments')) {
        console.log('🌐 Commitments API Request:', request.method(), request.url());
        networkRequests.push({ method: request.method(), url: request.url() });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/commitments')) {
        console.log('📡 Commitments API Response:', response.status(), response.url());
        if (!response.ok()) {
          failedRequests.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      }
    });

    // Navigate to the live app
    console.log('📍 Navigating to https://communitynwa.com');
    await page.goto('https://communitynwa.com', { waitUntil: 'networkidle' });

    // Login
    console.log('🔑 Logging in...');
    await page.fill('input[placeholder*="email" i]', 'brian@searchnwa.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    // Click on Commitment navigation
    console.log('📋 Clicking on Commitment navigation...');
    await page.click('text=Commitment');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'debug-commitments-section.png' });

    // Wait a moment for the page to fully load
    await page.waitForTimeout(2000);

    // Test 1: Add a new commitment
    console.log('➕ Testing add commitment functionality...');
    const commitmentText = `Test commitment added at ${new Date().toLocaleTimeString()}`;

    // Find the textarea for adding commitments
    const textareaSelector = 'textarea[placeholder*="e.g." i]';
    await page.fill(textareaSelector, commitmentText);
    await page.screenshot({ path: 'debug-filled-commitment.png' });

    // Click the Add Commitment button
    await page.click('button:has-text("Add Commitment")');
    await page.waitForTimeout(3000); // Wait for API call and UI update
    await page.screenshot({ path: 'debug-after-adding-commitment.png' });

    // Test 2: Find and test commitment completion
    console.log('🎯 Testing commitment completion functionality...');

    // Look for commitment items - specifically the circle buttons
    const circleButtons = page.locator('button:has(svg.lucide-circle), button:has(svg.lucide-check-circle)');
    const circleCount = await circleButtons.count();
    console.log(`Found ${circleCount} circle buttons for marking complete`);

    if (circleCount > 0) {
      console.log('🖱️ Testing click on completion circle...');

      // Take screenshot before clicking
      await page.screenshot({ path: 'debug-before-circle-click.png' });

      // Click the first circle button
      await circleButtons.first().click();

      // Wait for potential API call and UI update
      await page.waitForTimeout(3000);

      // Take screenshot after clicking
      await page.screenshot({ path: 'debug-after-circle-click.png' });

      console.log('✅ Clicked completion circle');
    } else {
      console.log('❌ No circle buttons found for completion testing');
    }

    // Test 3: Test editing functionality
    console.log('✏️ Testing edit functionality...');

    const editButtons = page.locator('button:has(svg.lucide-edit-2)');
    const editCount = await editButtons.count();
    console.log(`Found ${editCount} edit buttons`);

    if (editCount > 0) {
      console.log('🖱️ Testing click on edit button...');

      // Take screenshot before clicking
      await page.screenshot({ path: 'debug-before-edit-click.png' });

      // Click the first edit button
      await editButtons.first().click();

      // Wait for edit mode to activate
      await page.waitForTimeout(1000);

      // Take screenshot after clicking
      await page.screenshot({ path: 'debug-after-edit-click.png' });

      // Look for the edit textarea (should be the second textarea on the page)
      const editTextareas = page.locator('textarea');
      const editTextareaCount = await editTextareas.count();
      console.log(`Found ${editTextareaCount} textareas after edit click`);

      if (editTextareaCount >= 2) {
        console.log('📝 Found edit textarea, modifying text...');
        const editTextarea = editTextareas.nth(1); // Second textarea
        await editTextarea.clear();
        await editTextarea.fill('Modified commitment text for testing');
        await page.screenshot({ path: 'debug-edit-text-modified.png' });

        // Look for save button
        const saveButtons = page.locator('button:has(svg.lucide-save)');
        const saveCount = await saveButtons.count();
        console.log(`Found ${saveCount} save buttons`);

        if (saveCount > 0) {
          console.log('💾 Clicking save button...');
          await saveButtons.first().click();
          await page.waitForTimeout(3000); // Wait for API call
          await page.screenshot({ path: 'debug-after-save-click.png' });
          console.log('✅ Clicked save button');
        } else {
          console.log('❌ No save button found');
        }
      } else {
        console.log('❌ Edit textarea not found');
      }
    } else {
      console.log('❌ No edit buttons found');
    }

    // Final analysis
    console.log('📊 Debug Summary:');
    console.log(`- Console errors related to commitments: ${consoleErrors.filter(e => e.toLowerCase().includes('commitment')).length}`);
    console.log(`- Total console errors: ${consoleErrors.length}`);
    console.log(`- Commitment API requests made: ${networkRequests.length}`);
    console.log(`- Failed commitment API requests: ${failedRequests.length}`);

    console.log('\n🌐 Commitment API Requests:');
    networkRequests.forEach(req => console.log(`  - ${req.method} ${req.url}`));

    if (failedRequests.length > 0) {
      console.log('\n❌ Failed Commitment API Requests:');
      failedRequests.forEach(req => console.log(`  - ${req.url} (${req.status})`));
    }

    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors (showing first 5):');
      consoleErrors.slice(0, 5).forEach(error => console.log(`  - ${error}`));
    }

    // Final screenshot
    await page.screenshot({ path: 'debug-final-commitments-state.png' });

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugCommitments().catch(console.error);
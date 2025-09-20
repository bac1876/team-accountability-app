import { chromium } from 'playwright';

async function debugCommitments() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting final commitment functionality debug...');

    // Track console errors and network requests
    const consoleErrors = [];
    const commitmentRequests = [];
    const failedRequests = [];

    page.on('console', msg => {
      console.log(`[${msg.type().toUpperCase()}]`, msg.text());
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('request', request => {
      if (request.url().includes('/api/commitments')) {
        console.log('🌐 Commitments API Request:', request.method(), request.url());
        commitmentRequests.push({ method: request.method(), url: request.url() });
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
    await page.screenshot({ path: 'debug-1-initial.png' });

    // Login
    console.log('🔑 Logging in...');
    await page.fill('input[placeholder*="email" i]', 'brian@searchnwa.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button[type="submit"]');

    // Wait longer for login to complete
    console.log('⏳ Waiting for login to complete...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'debug-2-after-login.png' });

    // Check if we're still on login page
    const isLoginPage = await page.locator('h1:has-text("Team Accountability")').count() > 0;
    if (isLoginPage) {
      console.log('❌ Still on login page - login failed or session issue');
      return;
    }

    // Check current URL
    const currentUrl = page.url();
    console.log(`Current URL: ${currentUrl}`);

    // Look for navigation elements
    const navElements = await page.locator('nav a, [role="navigation"] a, a[href*="/"]').count();
    console.log(`Found ${navElements} navigation elements`);

    // Try to find and click commitment navigation
    const commitmentNavSelectors = [
      'text=Commitment',
      'a:has-text("Commitment")',
      'nav a:has-text("Commitment")',
      '[href*="/commitment"]',
      '[href="/commitments"]'
    ];

    let foundCommitmentNav = false;
    for (const selector of commitmentNavSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found commitment nav with selector: ${selector}`);
        await page.click(selector);
        foundCommitmentNav = true;
        break;
      }
    }

    if (!foundCommitmentNav) {
      console.log('❌ Commitment navigation not found, checking current page content');
    }

    // Wait for page to load
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'debug-3-commitments-page.png' });

    // Check if we have commitment-related content on the page
    console.log('🔍 Looking for commitment content...');

    // Look for commitment-related text
    const commitmentTexts = [
      'Daily Commitments',
      'Add Commitment',
      'Your Commitments',
      'Progress Overview'
    ];

    for (const text of commitmentTexts) {
      const count = await page.locator(`text=${text}`).count();
      if (count > 0) {
        console.log(`✅ Found commitment text: "${text}"`);
      }
    }

    // Look for commitment form elements
    const textareas = await page.locator('textarea').count();
    const addButtons = await page.locator('button:has-text("Add")').count();
    console.log(`Found ${textareas} textareas and ${addButtons} add buttons`);

    // If we find a textarea, try to add a commitment
    if (textareas > 0) {
      console.log('➕ Testing add commitment...');
      const textarea = page.locator('textarea').first();
      await textarea.fill('Test commitment for debugging');
      await page.screenshot({ path: 'debug-4-filled-textarea.png' });

      // Look for add button
      const addButton = page.locator('button:has-text("Add")').first();
      if (await addButton.count() > 0) {
        console.log('🖱️ Clicking add button...');
        await addButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'debug-5-after-add.png' });
      }
    }

    // Look for existing commitments to test
    console.log('🎯 Looking for existing commitments...');

    // Look for circle buttons (completion toggles)
    const circleSelectors = [
      'svg.lucide-circle',
      'svg.lucide-check-circle',
      'button:has(svg[class*="circle"])',
      '[aria-label*="Mark as"]'
    ];

    let foundCircles = 0;
    for (const selector of circleSelectors) {
      const count = await page.locator(selector).count();
      foundCircles += count;
      if (count > 0) {
        console.log(`✅ Found ${count} circle elements with selector: ${selector}`);
      }
    }

    if (foundCircles > 0) {
      console.log('🖱️ Testing commitment completion...');

      // Try clicking the first circle button found
      const firstCircle = page.locator('button:has(svg[class*="circle"])').first();
      if (await firstCircle.count() > 0) {
        await page.screenshot({ path: 'debug-6-before-circle-click.png' });
        await firstCircle.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'debug-7-after-circle-click.png' });
        console.log('✅ Clicked completion circle');
      }
    } else {
      console.log('❌ No completion circles found');
    }

    // Look for edit buttons
    const editButtons = await page.locator('button:has(svg.lucide-edit-2)').count();
    console.log(`Found ${editButtons} edit buttons`);

    if (editButtons > 0) {
      console.log('✏️ Testing edit functionality...');
      const editButton = page.locator('button:has(svg.lucide-edit-2)').first();
      await page.screenshot({ path: 'debug-8-before-edit.png' });
      await editButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'debug-9-after-edit-click.png' });

      // Check if more textareas appeared (edit mode)
      const textareasAfterEdit = await page.locator('textarea').count();
      console.log(`Textareas after edit click: ${textareasAfterEdit}`);

      if (textareasAfterEdit > textareas) {
        console.log('📝 Found edit textarea, testing save...');
        const editTextarea = page.locator('textarea').nth(1); // Second textarea
        await editTextarea.clear();
        await editTextarea.fill('Modified commitment text');

        const saveButton = page.locator('button:has(svg.lucide-save)').first();
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'debug-10-after-save.png' });
          console.log('✅ Clicked save button');
        }
      }
    }

    // Final analysis
    await page.screenshot({ path: 'debug-11-final.png' });

    console.log('\n📊 DEBUG SUMMARY:');
    console.log(`- Total commitment API requests: ${commitmentRequests.length}`);
    console.log(`- Failed commitment requests: ${failedRequests.length}`);
    console.log(`- Console errors: ${consoleErrors.length}`);

    if (commitmentRequests.length > 0) {
      console.log('\n🌐 Commitment API Requests:');
      commitmentRequests.forEach(req => console.log(`  - ${req.method} ${req.url}`));
    }

    if (failedRequests.length > 0) {
      console.log('\n❌ Failed Commitment Requests:');
      failedRequests.forEach(req => console.log(`  - ${req.url} (${req.status})`));
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugCommitments().catch(console.error);
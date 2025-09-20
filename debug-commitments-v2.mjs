import { chromium } from 'playwright';

async function debugCommitments() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🚀 Starting commitment functionality debug...');

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
      if (request.url().includes('/api/')) {
        console.log('🌐 API Request:', request.method(), request.url());
        networkRequests.push({ method: request.method(), url: request.url() });
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log('📡 API Response:', response.status(), response.url());
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
    await page.screenshot({ path: 'debug-initial-load.png' });

    // Explore login form structure
    console.log('🔍 Exploring login form structure...');
    const inputs = await page.locator('input').count();
    console.log(`Found ${inputs} input elements`);

    // Try different selectors for email input
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email" i]',
      'input[id*="email" i]',
      'input:first-of-type'
    ];

    let emailInput = null;
    for (const selector of emailSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found email input with selector: ${selector}`);
        emailInput = selector;
        break;
      }
    }

    // Try different selectors for password input
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password" i]',
      'input[id*="password" i]'
    ];

    let passwordInput = null;
    for (const selector of passwordSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found password input with selector: ${selector}`);
        passwordInput = selector;
        break;
      }
    }

    if (emailInput && passwordInput) {
      console.log('🔑 Filling login form...');
      await page.fill(emailInput, 'brian@searchnwa.com');
      await page.fill(passwordInput, 'Lbbc#2245');
      await page.screenshot({ path: 'debug-login-filled.png' });

      // Find and click login button
      const loginSelectors = [
        'button[type="submit"]',
        'button:has-text("Login")',
        'button:has-text("Sign In")',
        'button:has-text("Log In")',
        'input[type="submit"]'
      ];

      let loginButton = null;
      for (const selector of loginSelectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          console.log(`✅ Found login button with selector: ${selector}`);
          loginButton = selector;
          break;
        }
      }

      if (loginButton) {
        console.log('🚪 Logging in...');
        await page.click(loginButton);
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'debug-after-login.png' });
      } else {
        console.log('❌ No login button found!');
        await page.screenshot({ path: 'debug-no-login-button.png' });
        return;
      }
    } else {
      console.log('❌ Login form inputs not found!');
      await page.screenshot({ path: 'debug-no-login-form.png' });
      return;
    }

    // Check if login was successful by looking for navigation links
    console.log('🔍 Checking if login was successful...');
    const navLinks = await page.locator('a[href*="/commitments"], a:has-text("Commitments"), nav a').count();
    console.log(`Found ${navLinks} navigation links`);

    // Try to navigate to commitments
    const commitmentNavSelectors = [
      'a[href="/commitments"]',
      'a[href*="/commitments"]',
      'a:has-text("Commitments")',
      'nav a:has-text("Commitments")'
    ];

    let commitmentNav = null;
    for (const selector of commitmentNavSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found commitments nav with selector: ${selector}`);
        commitmentNav = selector;
        break;
      }
    }

    if (commitmentNav) {
      console.log('📋 Navigating to commitments section...');
      await page.click(commitmentNav);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: 'debug-commitments-page.png' });
    } else {
      console.log('❌ Commitments navigation not found!');
      // Check if we're already on a dashboard with commitments
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      await page.screenshot({ path: 'debug-current-page.png' });
    }

    // Look for commitment elements on the page
    console.log('🔍 Looking for commitment elements...');

    // Check for various commitment-related elements
    const commitmentSelectors = [
      '[data-testid*="commitment"]',
      '.commitment',
      '[class*="commitment"]',
      'h2:has-text("Commitments")',
      'h3:has-text("Commitments")',
      'textarea[placeholder*="commitment" i]',
      'button:has-text("Add Commitment")'
    ];

    for (const selector of commitmentSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found ${count} elements with selector: ${selector}`);
      }
    }

    // Look for the add commitment form
    console.log('➕ Testing add commitment functionality...');
    const addCommitmentTextarea = await page.locator('textarea').first();
    const addCommitmentButton = await page.locator('button:has-text("Add Commitment")').first();

    if (await addCommitmentTextarea.count() > 0 && await addCommitmentButton.count() > 0) {
      console.log('📝 Found add commitment form, testing...');
      await addCommitmentTextarea.fill('Test commitment for debugging functionality');
      await page.screenshot({ path: 'debug-commitment-text-filled.png' });

      await addCommitmentButton.click();
      await page.waitForTimeout(3000); // Wait for API call and UI update
      await page.screenshot({ path: 'debug-after-adding-commitment.png' });
    }

    // Look for existing commitments to test completion
    console.log('🎯 Looking for existing commitments to test...');

    // More comprehensive selectors for commitment items
    const commitmentItemSelectors = [
      '[class*="commitment"] button:has(svg)',
      '.space-y-2 > div', // Based on the JSX structure
      '[class*="bg-green-50"], [class*="bg-gray-50"]', // Commitment item backgrounds
      'button[aria-label*="Mark as"]',
      'button:has(.lucide-circle), button:has(.lucide-check-circle)'
    ];

    let foundCommitments = false;
    for (const selector of commitmentItemSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`✅ Found ${count} commitment items with selector: ${selector}`);
        foundCommitments = true;

        // Test clicking the first one
        const firstCommitment = page.locator(selector).first();
        await page.screenshot({ path: 'debug-before-commitment-click.png' });

        try {
          await firstCommitment.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'debug-after-commitment-click.png' });
          console.log('✅ Successfully clicked commitment item');
        } catch (error) {
          console.log('❌ Failed to click commitment item:', error.message);
        }
        break;
      }
    }

    if (!foundCommitments) {
      console.log('❌ No commitment items found for testing');
    }

    // Final analysis
    console.log('📊 Debug Summary:');
    console.log(`- Console errors: ${consoleErrors.length}`);
    console.log(`- API requests made: ${networkRequests.length}`);
    console.log(`- Failed API requests: ${failedRequests.length}`);

    if (consoleErrors.length > 0) {
      console.log('❌ Console Errors:');
      consoleErrors.forEach(error => console.log(`  - ${error}`));
    }

    if (failedRequests.length > 0) {
      console.log('❌ Failed API Requests:');
      failedRequests.forEach(req => console.log(`  - ${req.url} (${req.status})`));
    }

    // Final screenshot
    await page.screenshot({ path: 'debug-final-state.png' });

  } catch (error) {
    console.error('❌ Test failed:', error);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await browser.close();
  }
}

debugCommitments().catch(console.error);
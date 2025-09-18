// Playwright test to debug login issue
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    devtools: true
  });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Enable console logging
  page.on('console', msg => {
    console.log('Browser console:', msg.type(), msg.text());
  });

  // Log network requests
  page.on('request', request => {
    console.log('Request:', request.method(), request.url());
  });

  // Log network responses
  page.on('response', response => {
    console.log('Response:', response.status(), response.url());
  });

  // Log errors
  page.on('pageerror', error => {
    console.error('Page error:', error);
  });

  try {
    console.log('Testing production site: https://communitynwa.com');

    // First test the API endpoint directly
    console.log('\n1. Testing API endpoint directly...');
    const testResponse = await page.goto('https://communitynwa.com/api/test');
    if (testResponse) {
      console.log('Test API response status:', testResponse.status());
      const testData = await testResponse.text();
      console.log('Test API response:', testData);
    }

    // Now test the login page
    console.log('\n2. Going to login page...');
    await page.goto('https://communitynwa.com/login', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Take screenshot of login page
    await page.screenshot({ path: 'login-page.png' });
    console.log('Screenshot saved as login-page.png');

    // Wait for the login form to be visible
    await page.waitForSelector('input[name="username"]', { timeout: 5000 });

    console.log('\n3. Filling login form...');
    await page.fill('input[name="username"]', 'bob@searchnwa.com');
    await page.fill('input[name="password"]', 'pass123');

    // Take screenshot after filling
    await page.screenshot({ path: 'login-filled.png' });

    console.log('\n4. Clicking Sign In button...');

    // Start waiting for the API response before clicking
    const responsePromise = page.waitForResponse(response =>
      response.url().includes('/api/auth/login'),
      { timeout: 10000 }
    ).catch(err => {
      console.error('No login API call detected:', err.message);
      return null;
    });

    // Click the sign in button
    await page.click('button[type="submit"]');

    // Wait for the response
    const loginResponse = await responsePromise;

    if (loginResponse) {
      console.log('\n5. Login API Response:');
      console.log('Status:', loginResponse.status());
      console.log('URL:', loginResponse.url());
      const responseBody = await loginResponse.text();
      console.log('Body:', responseBody);
    } else {
      console.log('\n5. No login API response detected');
    }

    // Check for any error messages on the page
    await page.waitForTimeout(2000);
    const errorElement = await page.$('.text-destructive, [role="alert"]');
    if (errorElement) {
      const errorText = await errorElement.textContent();
      console.log('Error on page:', errorText);
    }

    // Take final screenshot
    await page.screenshot({ path: 'login-result.png' });
    console.log('Final screenshot saved as login-result.png');

    // Check if we're still on login page or redirected
    const currentUrl = page.url();
    console.log('\nFinal URL:', currentUrl);

    if (currentUrl.includes('dashboard')) {
      console.log('✅ Login successful! Redirected to dashboard');
    } else if (currentUrl.includes('login')) {
      console.log('❌ Login failed - still on login page');
    }

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  }

  // Keep browser open for manual inspection
  console.log('\nTest complete. Browser will stay open for inspection.');
  console.log('Press Ctrl+C to close.');
})();
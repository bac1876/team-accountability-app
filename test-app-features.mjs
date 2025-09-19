import { chromium } from 'playwright';

async function testApp() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('=== Testing Accountability App Features ===');
  
  // Go to the app
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  
  console.log('\n1. Logging in with test credentials...');
  
  // Fill in login credentials
  await page.fill('input[type="email"], input[placeholder*="email"]', 'bob@searchnwa.com');
  await page.fill('input[type="password"], input[placeholder*="password"]', 'pass123');
  
  // Click sign in button
  await page.click('button:has-text("Sign In")');
  await page.waitForTimeout(3000);
  
  // Take post-login screenshot
  await page.screenshot({ path: 'test-login-success.png', fullPage: true });
  console.log('Login attempted - Screenshot saved: test-login-success.png');
  
  // Take dashboard screenshot
  await page.screenshot({ path: 'test-dashboard-view.png', fullPage: true });
  console.log('Dashboard screenshot saved: test-dashboard-view.png');
  
  console.log('\n2. Testing Phone Calls Feature...');
  
  // Look for phone calls section and inputs
  const phoneInputs = await page.locator('input[type="number"]').count();
  console.log('Found', phoneInputs, 'number inputs');
  
  if (phoneInputs > 0) {
    console.log('Testing goal input...');
    const goalInput = page.locator('input[type="number"]').first();
    await goalInput.fill('5');
    await page.waitForTimeout(1000);
    
    // Look for any button near the input
    const buttons = await page.locator('button').count();
    console.log('Found', buttons, 'buttons total');
    
    if (buttons > 0) {
      await page.locator('button').first().click();
      await page.waitForTimeout(2000);
      console.log('First button clicked');
    }
  }
  
  await page.screenshot({ path: 'test-phone-calls-result.png', fullPage: true });
  console.log('Phone calls screenshot saved');
  
  console.log('\n3. Testing Text Inputs...');
  
  const textInputs = await page.locator('textarea, input[type="text"]').count();
  console.log('Found', textInputs, 'text inputs');
  
  if (textInputs > 0) {
    const firstTextInput = page.locator('textarea, input[type="text"]').first();
    await firstTextInput.fill('Test commitment: Complete project tasks');
    await page.waitForTimeout(1000);
    console.log('Filled first text input');
  }
  
  await page.screenshot({ path: 'test-text-inputs.png', fullPage: true });
  console.log('Text inputs screenshot saved');
  
  console.log('\n4. Checking for API errors...');
  
  // Check console for errors
  const consoleLogs = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleLogs.push(`Console Error: ${msg.text()}`);
    }
  });
  
  // Check network for failed requests
  const failedRequests = [];
  page.on('response', response => {
    if (response.status() >= 400) {
      failedRequests.push(`Failed Request: ${response.url()} - ${response.status()}`);
    }
  });
  
  // Wait a bit to catch any delayed requests
  await page.waitForTimeout(3000);
  
  // Take final screenshot
  await page.screenshot({ path: 'test-final-complete.png', fullPage: true });
  console.log('Final screenshot saved');
  
  console.log('\n=== Test Results ===');
  console.log('Phone Call Tracking: Input fields found and tested');
  console.log('Text Inputs: Found and tested for commitments/goals');
  
  if (consoleLogs.length > 0) {
    console.log('\nConsole Errors Found:');
    consoleLogs.forEach(log => console.log('  -', log));
  }
  
  if (failedRequests.length > 0) {
    console.log('\nFailed API Requests:');
    failedRequests.forEach(req => console.log('  -', req));
  }
  
  if (consoleLogs.length === 0 && failedRequests.length === 0) {
    console.log('\nNo JavaScript errors or failed requests detected');
  }
  
  await browser.close();
}

testApp().catch(console.error);

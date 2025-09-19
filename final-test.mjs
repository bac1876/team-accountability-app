import { chromium } from 'playwright';

async function runTest() {
  console.log('PHONE CALL FEATURE TEST - STARTING');
  console.log('================================');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  const errors = [];
  const networkErrors = [];
  const tests = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
      errors.push(msg.text());
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('Network Error:', response.status(), response.url());
      networkErrors.push({ status: response.status(), url: response.url() });
    }
  });
  
  function test(name, status, details) {
    const icon = status === 'PASS' ? '✅' : '❌';
    console.log(icon + ' ' + name + (details ? ': ' + details : ''));
    tests.push({ name, status, details });
  }
  
  try {
    // Login with correct credentials
    await page.goto('https://communitynwa.com');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder*="email"]', 'brian@searchnwa.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('.dashboard', { timeout: 10000 });
    test('Login', 'PASS', 'Successfully logged in with correct password');
    
    await page.screenshot({ path: 'test-results/logged-in.png', fullPage: true });
    
    // Look for phone features
    await page.waitForTimeout(2000);
    
    // Find number inputs
    const numberInputs = await page.$$('input[type="number"]');
    console.log('Number inputs found:', numberInputs.length);
    
    if (numberInputs.length > 0) {
      test('Number Inputs Found', 'PASS', 'Found ' + numberInputs.length + ' number inputs');
      
      // Try to fill the first number input (likely goal)
      await numberInputs[0].fill('50');
      
      // Look for buttons
      const buttons = await page.$$('button');
      console.log('Total buttons found:', buttons.length);
      
      for (let i = 0; i < buttons.length; i++) {
        const button = buttons[i];
        const text = await button.textContent();
        console.log('Button ' + (i+1) + ':', text);
        
        if (text && (text.includes('Set') || text.includes('Save'))) {
          console.log('Clicking button:', text);
          await button.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
    } else {
      test('Number Inputs Found', 'FAIL', 'No number inputs found');
    }
    
    await page.screenshot({ path: 'test-results/after-input-test.png', fullPage: true });
    
    // Look for any inputs with phone/call related placeholders
    const allInputs = await page.$$('input');
    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const placeholder = await input.getAttribute('placeholder');
      const type = await input.getAttribute('type');
      
      if (placeholder) {
        console.log('Input ' + (i+1) + ': type=' + type + ', placeholder=' + placeholder);
        
        if (placeholder.toLowerCase().includes('phone') || 
            placeholder.toLowerCase().includes('call') ||
            placeholder.toLowerCase().includes('goal') ||
            placeholder.toLowerCase().includes('actual')) {
          test('Phone/Call Input Found', 'PASS', 'Placeholder: ' + placeholder);
        }
      }
    }
    
    // Check for any error elements
    const errorEls = await page.$$('.error, [role="alert"], .alert-error');
    if (errorEls.length > 0) {
      for (let errorEl of errorEls) {
        const errorText = await errorEl.textContent();
        if (errorText && errorText.trim()) {
          test('Error Message Found', 'FAIL', errorText.trim());
        }
      }
    }
    
    await page.screenshot({ path: 'test-results/final-state.png', fullPage: true });
    
  } catch (error) {
    console.error('Test error:', error);
    test('Test Execution', 'FAIL', error.message);
    await page.screenshot({ path: 'test-results/test-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
  
  // Summary
  console.log('\n================================');
  console.log('TEST SUMMARY');
  console.log('================================');
  
  const passed = tests.filter(t => t.status === 'PASS').length;
  const failed = tests.filter(t => t.status === 'FAIL').length;
  
  console.log('Total Tests:', tests.length);
  console.log('Passed:', passed);
  console.log('Failed:', failed);
  
  console.log('\nAll Tests:');
  tests.forEach((t, i) => {
    const icon = t.status === 'PASS' ? '✅' : '❌';
    console.log((i+1) + '. ' + icon + ' ' + t.name + (t.details ? ': ' + t.details : ''));
  });
  
  if (errors.length > 0) {
    console.log('\nConsole Errors:');
    errors.forEach((e, i) => console.log((i+1) + '. ' + e));
  }
  
  if (networkErrors.length > 0) {
    console.log('\nNetwork Errors:');
    networkErrors.forEach((e, i) => console.log((i+1) + '. ' + e.status + ' ' + e.url));
    
    const phoneErrors = networkErrors.filter(e => 
      e.url.includes('phone') || e.url.includes('call')
    );
    
    if (phoneErrors.length > 0) {
      console.log('\nPhone API Errors:');
      phoneErrors.forEach((e, i) => console.log((i+1) + '. ' + e.status + ' ' + e.url));
    }
  }
}

runTest().catch(console.error);

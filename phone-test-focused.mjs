import { chromium } from 'playwright';

async function testPhoneFeature() {
  console.log('Testing Phone Call Feature...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  const consoleErrors = [];
  const networkErrors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console Error:', msg.text());
      consoleErrors.push(msg.text());
    }
  });
  
  page.on('response', response => {
    if (response.status() >= 400) {
      console.log('Network Error:', response.status(), response.url());
      networkErrors.push({ status: response.status(), url: response.url() });
    }
  });
  
  try {
    // Login
    await page.goto('https://communitynwa.com');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="email"]', 'brian@searchnwa.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    // Wait for dashboard
    await page.waitForSelector('.dashboard', { timeout: 10000 });
    console.log('✅ Login successful');
    
    // Take screenshot of dashboard
    await page.screenshot({ path: 'test-results/dashboard-loaded.png', fullPage: true });
    
    // Look for phone call elements
    await page.waitForTimeout(2000);
    
    // Try to find goal input
    const goalInput = await page.$('input[placeholder*="goal"], input[type="number"]');
    if (goalInput) {
      console.log('✅ Found goal input');
      await goalInput.fill('50');
      
      const setGoalButton = await page.$('button:has-text("Set Goal"), button:has-text("Save")');
      if (setGoalButton) {
        console.log('✅ Found set goal button');
        await setGoalButton.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'test-results/phone-goal-attempt.png', fullPage: true });
        
        // Check for errors
        const errorMessage = await page.$('.error, .alert-error, [role="alert"]');
        if (errorMessage) {
          const errorText = await errorMessage.textContent();
          console.log('❌ Goal setting error:', errorText);
        } else {
          console.log('✅ Goal setting appears successful');
        }
      } else {
        console.log('❌ Set goal button not found');
      }
    } else {
      console.log('❌ Goal input not found');
    }
    
    // Try to find actual calls input
    const actualInput = await page.$('input[placeholder*="actual"], input[placeholder*="made"]');
    if (actualInput) {
      console.log('✅ Found actual calls input');
      await actualInput.fill('45');
      
      const logButton = await page.$('button:has-text("Log"), button:has-text("Update")');
      if (logButton) {
        console.log('✅ Found log button');
        await logButton.click();
        await page.waitForTimeout(3000);
        
        await page.screenshot({ path: 'test-results/phone-log-attempt.png', fullPage: true });
      } else {
        console.log('❌ Log button not found');
      }
    } else {
      console.log('❌ Actual calls input not found');
    }
    
    // Check for streak display
    const streakElement = await page.$('.streak, [data-testid="streak"]');
    if (streakElement) {
      const streakText = await streakElement.textContent();
      console.log('✅ Streak found:', streakText);
    } else {
      console.log('❌ Streak element not found');
    }
    
    await page.screenshot({ path: 'test-results/final-state.png', fullPage: true });
    
    // Summary
    console.log('\n=== SUMMARY ===');
    console.log('Console Errors:', consoleErrors.length);
    consoleErrors.forEach(err => console.log('  -', err));
    
    console.log('Network Errors:', networkErrors.length);
    networkErrors.forEach(err => console.log('  -', err.status, err.url));
    
    const phoneErrors = networkErrors.filter(e => 
      e.url.includes('phone') || e.url.includes('call')
    );
    
    if (phoneErrors.length > 0) {
      console.log('❌ Phone Call API Issues:');
      phoneErrors.forEach(err => console.log('  -', err.status, err.url));
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-results/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testPhoneFeature().catch(console.error);

import { chromium } from 'playwright';

async function phoneCallTest() {
  console.log('Testing Phone Call Feature...');
  
  const browser = await chromium.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  const errors = [];
  const networkErrors = [];
  
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
  
  try {
    // Login
    await page.goto('https://communitynwa.com');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[placeholder*="email"]', 'brian@searchnwa.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    await page.waitForSelector('.dashboard', { timeout: 10000 });
    console.log('✅ Login successful');
    
    await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
    
    // Test phone features
    await page.waitForTimeout(2000);
    
    // Look for goal input
    const goalInput = await page.$('input[type="number"]');
    if (goalInput) {
      console.log('✅ Found goal input');
      await goalInput.fill('50');
      
      const setButton = await page.$('button:has-text("Set Goal")');
      if (setButton) {
        console.log('✅ Found set goal button, clicking...');
        await setButton.click();
        await page.waitForTimeout(3000);
        
        const errorEl = await page.$('.error, [role="alert"]');
        if (errorEl) {
          const errorText = await errorEl.textContent();
          console.log('❌ Goal setting error:', errorText);
        } else {
          console.log('✅ Goal setting completed without visible errors');
        }
      } else {
        console.log('❌ Set goal button not found');
      }
    } else {
      console.log('❌ Goal input not found');
    }
    
    await page.screenshot({ path: 'test-results/after-goal-test.png', fullPage: true });
    
    // Test actual calls input
    const actualInput = await page.$('input[placeholder*="actual"]');
    if (actualInput) {
      console.log('✅ Found actual calls input');
      await actualInput.fill('45');
      
      const logButton = await page.$('button:has-text("Log")');
      if (logButton) {
        console.log('✅ Found log button, clicking...');
        await logButton.click();
        await page.waitForTimeout(3000);
      } else {
        console.log('❌ Log button not found');
      }
    } else {
      console.log('❌ Actual calls input not found');
    }
    
    await page.screenshot({ path: 'test-results/after-calls-test.png', fullPage: true });
    
    // Check for streak
    const streak = await page.$('.streak');
    if (streak) {
      const streakText = await streak.textContent();
      console.log('✅ Streak found:', streakText);
    } else {
      console.log('❌ Streak not found');
    }
    
    console.log('\n=== SUMMARY ===');
    console.log('Console Errors:', errors.length);
    console.log('Network Errors:', networkErrors.length);
    
    const phoneErrors = networkErrors.filter(e => 
      e.url.includes('phone') || e.url.includes('call')
    );
    
    if (phoneErrors.length > 0) {
      console.log('\n❌ PHONE API ERRORS:');
      phoneErrors.forEach(e => console.log(`  ${e.status} ${e.url}`));
    }
    
    if (errors.length > 0) {
      console.log('\n❌ CONSOLE ERRORS:');
      errors.forEach(e => console.log(`  ${e}`));
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    await page.screenshot({ path: 'test-results/test-failed.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

phoneCallTest().catch(console.error);

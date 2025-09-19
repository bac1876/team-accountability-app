import { chromium } from 'playwright';

async function debugSite() {
  console.log('Debugging site access...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to site...');
    await page.goto('https://communitynwa.com', { timeout: 30000 });
    
    console.log('Waiting for page to load...');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'test-results/site-loaded.png', fullPage: true });
    
    console.log('Getting page title...');
    const title = await page.title();
    console.log('Page title:', title);
    
    console.log('Looking for login elements...');
    
    // Try different selectors for email input
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[placeholder*="email"]',
      'input[placeholder*="Email"]',
      '#email',
      '.email'
    ];
    
    for (const selector of emailSelectors) {
      const element = await page.$(selector);
      if (element) {
        console.log('✅ Found email input with selector:', selector);
        break;
      } else {
        console.log('❌ Not found:', selector);
      }
    }
    
    // Try different selectors for password input
    const passwordSelectors = [
      'input[type="password"]',
      'input[name="password"]',
      'input[placeholder*="password"]',
      'input[placeholder*="Password"]',
      '#password',
      '.password'
    ];
    
    for (const selector of passwordSelectors) {
      const element = await page.$(selector);
      if (element) {
        console.log('✅ Found password input with selector:', selector);
        break;
      } else {
        console.log('❌ Not found:', selector);
      }
    }
    
    // Get all input elements
    const allInputs = await page.$$('input');
    console.log('Total input elements found:', allInputs.length);
    
    for (let i = 0; i < allInputs.length; i++) {
      const input = allInputs[i];
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const id = await input.getAttribute('id');
      
      console.log(`Input ${i}: type="${type}", placeholder="${placeholder}", name="${name}", id="${id}"`);
    }
    
    // Get all button elements
    const allButtons = await page.$$('button');
    console.log('Total button elements found:', allButtons.length);
    
    for (let i = 0; i < allButtons.length; i++) {
      const button = allButtons[i];
      const text = await button.textContent();
      const type = await button.getAttribute('type');
      
      console.log(`Button ${i}: text="${text}", type="${type}"`);
    }
    
    console.log('Waiting 5 seconds to observe...');
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('Debug failed:', error);
    await page.screenshot({ path: 'test-results/debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

debugSite().catch(console.error);

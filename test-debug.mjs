import { chromium } from 'playwright';

async function debugTest() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔍 Debug test starting...\n');

  try {
    console.log('Loading app...');
    await page.goto('https://accountability-one.vercel.app');
    await page.waitForLoadState('networkidle');

    // Take screenshot
    await page.screenshot({ path: 'debug-page-load.png' });
    console.log('Screenshot saved as debug-page-load.png');

    // Get page content
    const pageContent = await page.content();
    console.log('\n📄 Page title:', await page.title());

    // Check for any visible text
    const visibleText = await page.locator('body').innerText();
    console.log('\n📝 Visible text on page (first 500 chars):');
    console.log(visibleText.substring(0, 500));

    // Check for input fields
    const inputs = await page.locator('input').count();
    console.log(`\n🔍 Number of input fields found: ${inputs}`);

    // Check for buttons
    const buttons = await page.locator('button').count();
    console.log(`🔍 Number of buttons found: ${buttons}`);

    // Check if already logged in
    const welcomeText = await page.locator('text=/Welcome back/i').count();
    if (welcomeText > 0) {
      console.log('\n✅ User appears to be already logged in!');

      // Get user name
      const userName = await page.locator('text=/Welcome back/i').innerText();
      console.log('User:', userName);
    } else {
      console.log('\n📋 Not logged in - should see login form');

      // List all input types
      const allInputs = await page.locator('input').all();
      for (let i = 0; i < allInputs.length; i++) {
        const type = await allInputs[i].getAttribute('type');
        const placeholder = await allInputs[i].getAttribute('placeholder');
        const id = await allInputs[i].getAttribute('id');
        console.log(`  Input ${i + 1}: type="${type}", placeholder="${placeholder}", id="${id}"`);
      }
    }

    // Check for any errors
    const errors = await page.locator('text=/error|failed|invalid/i').count();
    if (errors > 0) {
      console.log(`\n⚠️ Found ${errors} potential error messages`);
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    console.log('\n⏸️  Browser will stay open for inspection. Press Ctrl+C to close.');
    // Keep browser open for manual inspection
    await new Promise(() => {});
  }
}

debugTest().catch(console.error);
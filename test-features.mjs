import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: false });
const page = await browser.newPage();

console.log('=== Testing Accountability App Features ===');

await page.goto('http://localhost:5173');
await page.waitForTimeout(2000);

console.log('1. Attempting login...');
await page.fill('input[type="email"]', 'bob@searchnwa.com');
await page.fill('input[type="password"]', 'pass123');
await page.click('button:has-text("Sign In")');
await page.waitForTimeout(3000);

await page.screenshot({ path: 'test-login-result.png', fullPage: true });
console.log('Login screenshot saved');

console.log('2. Testing phone calls...');
const phoneInputs = await page.locator('input[type="number"]').count();
console.log('Found phone inputs:', phoneInputs);

if (phoneInputs > 0) {
  await page.locator('input[type="number"]').first().fill('5');
  await page.waitForTimeout(1000);
}

await page.screenshot({ path: 'test-phone-result.png', fullPage: true });

console.log('3. Testing text areas...');
const textAreas = await page.locator('textarea').count();
console.log('Found text areas:', textAreas);

if (textAreas > 0) {
  await page.locator('textarea').first().fill('Test commitment');
  await page.waitForTimeout(1000);
}

await page.screenshot({ path: 'test-final-result.png', fullPage: true });
console.log('Final screenshot saved');

await browser.close();
console.log('Test complete!');

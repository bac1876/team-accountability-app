const { chromium } = require('playwright');

async function testPhoneDates() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 1000
  });
  const page = await browser.newPage();

  try {
    console.log('🔍 TESTING PHONE CALL TRACKER DATE SYNCHRONIZATION\n');

    // Navigate to the site
    console.log('1️⃣ NAVIGATING TO SITE...');
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(2000);

    // Login with Brian's credentials
    console.log('\n2️⃣ LOGGING IN...');
    await page.fill('input[placeholder*="email" i]', 'brian@searchnwa.com');
    await page.fill('input[placeholder*="password" i]', 'Lbbc#2245');
    await page.click('button:has-text("Sign In")');

    // Wait for dashboard to load
    console.log('   ⏳ Waiting for dashboard...');
    await page.waitForTimeout(8000);

    // Get the date from the top right corner
    console.log('\n3️⃣ CHECKING SYSTEM DATE...');
    const systemDateText = await page.locator('.text-gray-600').first().textContent();
    console.log(`   📅 System date shows: ${systemDateText}`);

    // Navigate to Phone Call Tracker tab
    console.log('\n4️⃣ NAVIGATING TO PHONE CALL TRACKER...');
    const phoneTab = await page.locator('button:has-text("Phone Call Tracker"), button:has-text("Phone Calls")').first();
    if (await phoneTab.count() > 0) {
      await phoneTab.click();
      console.log('   ✅ Clicked Phone Call Tracker tab');
      await page.waitForTimeout(3000);
    }

    // Check the date displayed in the Phone Call Tracker
    console.log('\n5️⃣ CHECKING PHONE TRACKER DATE...');

    // Get the "Today" label
    const todayLabel = await page.locator('.text-3xl.font-bold').first().textContent();
    console.log(`   📱 Phone tracker shows: "${todayLabel}"`);

    // Get the full date display
    const fullDate = await page.locator('.text-blue-100.text-sm').first().textContent();
    console.log(`   📱 Full date display: ${fullDate}`);

    // Extract the actual date to verify
    const today = new Date();
    const expectedDate = today.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    console.log(`   📅 Expected date: ${expectedDate}`);

    // Check if dates match
    if (fullDate === expectedDate) {
      console.log('   ✅ DATES ARE SYNCHRONIZED CORRECTLY!');
    } else {
      console.log('   ❌ DATE MISMATCH DETECTED');
      console.log(`      Expected: ${expectedDate}`);
      console.log(`      Got: ${fullDate}`);
    }

    // Test navigation forward and back
    console.log('\n6️⃣ TESTING DATE NAVIGATION...');

    // Click next day
    const nextButton = await page.locator('button:has(svg.lucide-chevron-right)').first();
    await nextButton.click();
    await page.waitForTimeout(1000);

    const tomorrowLabel = await page.locator('.text-3xl.font-bold').first().textContent();
    const tomorrowDate = await page.locator('.text-blue-100.text-sm').first().textContent();
    console.log(`   ➡️ Next day shows: "${tomorrowLabel}" - ${tomorrowDate}`);

    // Click previous day twice to go to yesterday
    const prevButton = await page.locator('button:has(svg.lucide-chevron-left)').first();
    await prevButton.click();
    await page.waitForTimeout(1000);
    await prevButton.click();
    await page.waitForTimeout(1000);

    const yesterdayLabel = await page.locator('.text-3xl.font-bold').first().textContent();
    const yesterdayDate = await page.locator('.text-blue-100.text-sm').first().textContent();
    console.log(`   ⬅️ Yesterday shows: "${yesterdayLabel}" - ${yesterdayDate}`);

    // Go back to today
    await nextButton.click();
    await page.waitForTimeout(1000);

    // Final screenshot
    await page.screenshot({ path: 'phone-dates-fixed.png', fullPage: true });

    // SUMMARY
    console.log('\n==================================================');
    console.log('✅ TEST SUMMARY:');
    console.log('   • System date and Phone Tracker date checked');
    console.log('   • Date navigation tested (forward/back)');
    console.log('   • Date formatting verified');

    if (fullDate === expectedDate) {
      console.log('\n🎉 DATE SYNCHRONIZATION IS FIXED!');
    } else {
      console.log('\n❌ DATE SYNCHRONIZATION STILL HAS ISSUES');
    }

    console.log('📸 Screenshot saved as phone-dates-fixed.png');

  } catch (error) {
    console.error('\n❌ Test error:', error.message);
    await page.screenshot({ path: 'phone-dates-error.png', fullPage: true });
  } finally {
    await page.waitForTimeout(5000); // Keep open for viewing
    await browser.close();
  }
}

testPhoneDates();
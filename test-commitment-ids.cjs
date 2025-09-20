const { chromium } = require('playwright');

async function testCommitmentIds() {
  console.log('🔍 TESTING COMMITMENT IDS\n');
  console.log('=' .repeat(50));

  const browser = await chromium.launch({
    headless: false,
    slowMo: 500
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Log all console messages to capture commitment data
    page.on('console', msg => {
      console.log('📊 Console:', msg.text());
    });

    // Navigate and Login
    console.log('\n1️⃣ NAVIGATING TO APP...');
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(2000);

    console.log('2️⃣ LOGGING IN AS BRIAN...');
    await page.fill('input[type="text"]', 'brian@searchnwa.com');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Navigate to commitments
    console.log('\n3️⃣ NAVIGATING TO COMMITMENTS...');
    await page.click('text=Commitment');
    await page.waitForTimeout(3000);

    // Inject script to check commitment data
    console.log('\n4️⃣ CHECKING COMMITMENT DATA...');
    const commitmentData = await page.evaluate(() => {
      // Find all commitment items
      const commitmentDivs = document.querySelectorAll('div[class*="flex items-center gap-3"]');
      const commitments = [];

      commitmentDivs.forEach((div, index) => {
        const text = div.querySelector('p')?.textContent || 'No text';
        const hasEditButton = !!div.querySelector('button svg.lucide-edit2');
        const hasDeleteButton = !!div.querySelector('button svg.lucide-trash2');

        commitments.push({
          index,
          text: text.substring(0, 50),
          hasEditButton,
          hasDeleteButton
        });
      });

      return commitments;
    });

    console.log('\n📊 COMMITMENT DATA:');
    commitmentData.forEach(c => {
      console.log(`  ${c.index}: "${c.text}..." Edit: ${c.hasEditButton} Delete: ${c.hasDeleteButton}`);
    });

    // Check React component state
    console.log('\n5️⃣ CHECKING REACT STATE...');
    const reactState = await page.evaluate(() => {
      // Try to access React fiber to get component state
      const commitmentSection = document.querySelector('[class*="commitments"]');
      if (!commitmentSection) return 'No commitment section found';

      // Check for any data attributes that might contain IDs
      const allElements = commitmentSection.querySelectorAll('*');
      const dataAttrs = [];
      allElements.forEach(el => {
        Array.from(el.attributes).forEach(attr => {
          if (attr.name.startsWith('data-')) {
            dataAttrs.push(`${attr.name}: ${attr.value}`);
          }
        });
      });

      return dataAttrs.length > 0 ? dataAttrs : 'No data attributes found';
    });

    console.log('React/Data attributes:', reactState);

    console.log('\n' + '=' .repeat(50));
    console.log('✅ TEST COMPLETE!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
  } finally {
    await browser.close();
  }
}

// Run the test
testCommitmentIds();
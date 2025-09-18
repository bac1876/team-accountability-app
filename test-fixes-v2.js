import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. Navigating to the app...');
    await page.goto('https://accountability-theta.vercel.app/');

    // Take a screenshot of the login page
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'login-page.png' });
    console.log('Screenshot saved to login-page.png');

    // Try to find input fields with different selectors
    console.log('2. Looking for login fields...');

    // Try various selectors for username/email field
    const emailSelectors = [
      'input[name="username"]',
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="username" i]',
      'input#username',
      'input#email'
    ];

    let emailField = null;
    for (const selector of emailSelectors) {
      try {
        emailField = await page.$(selector);
        if (emailField) {
          console.log(`Found email field with selector: ${selector}`);
          break;
        }
      } catch (e) {}
    }

    if (!emailField) {
      // Get all inputs on the page for debugging
      const inputs = await page.$$eval('input', els =>
        els.map(el => ({
          name: el.name,
          type: el.type,
          placeholder: el.placeholder,
          id: el.id
        }))
      );
      console.log('All input fields on page:', inputs);
    }

    // Now fill the fields if found
    if (emailField) {
      const firstInput = await page.$('input:first-of-type');
      const secondInput = await page.$('input:nth-of-type(2)');

      if (firstInput && secondInput) {
        console.log('3. Filling login fields...');
        await firstInput.fill('john@example.com');
        await secondInput.fill('john123');

        // Find and click submit button
        const submitButton = await page.$('button[type="submit"]') || await page.$('button:has-text("Sign")') || await page.$('button:has-text("Log")');
        if (submitButton) {
          await submitButton.click();
          console.log('4. Clicked submit button');

          // Wait for navigation
          await page.waitForTimeout(5000);

          // Check if logged in
          const welcomeText = await page.$('h1:has-text("Welcome")');
          if (welcomeText) {
            console.log('5. Successfully logged in!');

            // Now test the fixes
            await testCommitments(page);
            await testGoals(page);
          } else {
            console.log('Login may have failed');
            await page.screenshot({ path: 'after-login.png' });
          }
        }
      }
    }

    console.log('\nTest completed!');
    console.log('Browser will remain open for 30 seconds for inspection...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'error-state.png' });
  } finally {
    await browser.close();
  }
})();

async function testCommitments(page) {
  console.log('\n--- Testing Commitments ---');
  const commitmentText = 'Test commitment ' + new Date().toISOString();

  try {
    // Find commitment textarea
    const textareas = await page.$$('textarea');
    if (textareas.length > 0) {
      await textareas[0].fill(commitmentText);
      console.log('Filled commitment text');

      // Find save button
      const saveButtons = await page.$$('button:has-text("Save")');
      if (saveButtons.length > 0) {
        await saveButtons[0].click();
        console.log('Clicked save button');

        await page.waitForTimeout(3000);

        // Check if text remains
        const currentValue = await textareas[0].inputValue();
        if (currentValue === commitmentText) {
          console.log('✓ Commitment text remains after saving!');
        } else {
          console.log('✗ Commitment text disappeared');
        }
      }
    }
  } catch (e) {
    console.log('Error testing commitments:', e.message);
  }
}

async function testGoals(page) {
  console.log('\n--- Testing Goals ---');
  const goalText = 'Test goal ' + Date.now();

  try {
    // Look for Goals tab/button
    const goalsTab = await page.$('button:has-text("Goals")') || await page.$('text=Goals');
    if (goalsTab) {
      await goalsTab.click();
      await page.waitForTimeout(2000);
    }

    // Find goal input
    const inputs = await page.$$('input[type="text"]');
    for (const input of inputs) {
      const placeholder = await input.getAttribute('placeholder');
      if (placeholder && placeholder.toLowerCase().includes('goal')) {
        await input.fill(goalText);
        console.log('Filled goal text');

        // Find add button
        const addButton = await page.$('button:has-text("Add")');
        if (addButton) {
          await addButton.click();
          console.log('Clicked add button');

          await page.waitForTimeout(3000);

          // Check for error
          const errorText = await page.$('text=Failed to add goal');
          if (errorText) {
            console.log('✗ Error: "Failed to add goal" appears');
          } else {
            console.log('✓ No error message - goal may have been added');
          }
        }
        break;
      }
    }
  } catch (e) {
    console.log('Error testing goals:', e.message);
  }
}
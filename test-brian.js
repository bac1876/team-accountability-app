import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('1. Navigating to communitynwa.com...');
    await page.goto('https://communitynwa.com');

    // Wait for login page
    await page.waitForTimeout(3000);

    console.log('2. Logging in as Brian...');

    // Try to find and fill login fields
    const emailInput = await page.$('input[name="username"]') || await page.$('input[type="email"]') || await page.$('input:first-of-type');
    const passwordInput = await page.$('input[name="password"]') || await page.$('input[type="password"]') || await page.$('input:nth-of-type(2)');

    if (emailInput && passwordInput) {
      await emailInput.fill('brian@searchnwa.com');
      await passwordInput.fill('Lbbc#2245');

      // Find and click submit button
      const submitButton = await page.$('button[type="submit"]') || await page.$('button:has-text("Sign")') || await page.$('button:has-text("Log")');

      if (submitButton) {
        await submitButton.click();
        console.log('3. Submitted login form...');

        // Wait for navigation
        await page.waitForTimeout(5000);

        // Check if logged in
        const url = page.url();
        console.log('Current URL:', url);

        // Test adding a commitment
        console.log('\n4. Testing commitment creation...');

        // Find commitment textarea
        const commitmentTextarea = await page.$('textarea[placeholder*="commitment"]') || await page.$('textarea:first-of-type');

        if (commitmentTextarea) {
          const testCommitment = 'Test commitment ' + new Date().toLocaleString();
          await commitmentTextarea.fill(testCommitment);
          console.log('Filled commitment:', testCommitment);

          // Find and click save button
          const saveButton = await page.$('button:has-text("Save Commitment")');
          if (saveButton) {
            // Intercept the API request to see what's being sent
            page.on('response', response => {
              if (response.url().includes('/api/commitments') && response.request().method() === 'POST') {
                console.log('API Request Body:', response.request().postData());
                response.json().then(data => {
                  console.log('API Response:', data);
                }).catch(err => {
                  response.text().then(text => {
                    console.log('API Error Response:', text);
                  });
                });
              }
            });

            await saveButton.click();
            console.log('Clicked Save Commitment button');

            await page.waitForTimeout(3000);

            // Check for error or success
            const successToast = await page.$('text=Commitment saved!');
            const errorAlert = await page.$('text=Failed to save commitment');

            if (successToast) {
              console.log('✓ Commitment saved successfully!');
            } else if (errorAlert) {
              console.log('✗ Error: Failed to save commitment');
              // Try to get error details
              const alerts = await page.$$eval('[role="alert"], .alert', els => els.map(el => el.textContent));
              console.log('Error details:', alerts);
            }
          } else {
            console.log('Could not find Save Commitment button');
          }
        } else {
          console.log('Could not find commitment textarea');
        }

        // Test adding a goal
        console.log('\n5. Testing goal creation...');

        // Click on Goals tab if exists
        const goalsTab = await page.$('button:has-text("Goals")');
        if (goalsTab) {
          await goalsTab.click();
          await page.waitForTimeout(2000);
        }

        // Find goal input
        const goalInput = await page.$('textarea[placeholder*="goal"]') || await page.$('input[placeholder*="goal"]');

        if (goalInput) {
          const testGoal = 'Test goal ' + Date.now();
          await goalInput.fill(testGoal);
          console.log('Filled goal:', testGoal);

          // Find and click add button
          const addGoalButton = await page.$('button:has-text("Add Goal")');
          if (addGoalButton) {
            await addGoalButton.click();
            console.log('Clicked Add Goal button');

            await page.waitForTimeout(3000);

            // Check for error or success
            const errorAlert = await page.$('text=Failed to add goal');
            const goalElement = await page.$(`text=${testGoal}`);

            if (goalElement) {
              console.log('✓ Goal added successfully!');
            } else if (errorAlert) {
              console.log('✗ Error: Failed to add goal');
            }
          }
        }

      } else {
        console.log('Could not find submit button');
      }
    } else {
      console.log('Could not find login fields');
    }

    console.log('\n6. Test completed. Browser will remain open for 30 seconds...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Test error:', error);
    await page.screenshot({ path: 'error.png' });
  } finally {
    await browser.close();
  }
})();
const { chromium } = require('playwright');
const https = require('https');

const API_BASE = 'https://communitynwa.com/api';
const BRIAN_EMAIL = 'brian@searchnwa.com';
const BRIAN_PASSWORD = 'Lbbc#2245';
const BRIAN_ID = 1;

// Simple HTTPS request wrapper to replace fetch
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// Helper function to get yesterday's date
function getYesterdayDate() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

// Helper function to get today's date
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

async function testCommitments() {
  console.log('\n=== TESTING COMMITMENTS ===');
  const yesterday = getYesterdayDate();
  const today = getTodayDate();

  console.log(`Testing commitments for yesterday (${yesterday}) and today (${today})`);

  // Test 1: Get commitments for yesterday
  console.log('\n1. Getting yesterday\'s commitments:');
  const yesterdayCommitments = await makeRequest(`${API_BASE}/commitments?userId=${BRIAN_ID}&date=${yesterday}`);
  console.log('Yesterday\'s commitments:', yesterdayCommitments);

  // Test 2: Create a commitment for yesterday if none exists
  if (!yesterdayCommitments || yesterdayCommitments.length === 0) {
    console.log('\n2. Creating commitment for yesterday:');
    const created = await makeRequest(`${API_BASE}/commitments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: BRIAN_ID,
        commitmentText: 'Test yesterday commitment',
        date: yesterday,
        status: 'pending'
      })
    });
    console.log('Created:', created);

    // Get the ID for the update test
    if (created.id) {
      // Test 3: Update commitment status to complete
      console.log('\n3. Marking yesterday\'s commitment as complete:');
      const updated = await makeRequest(`${API_BASE}/commitments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: created.id,
          status: 'completed'
        })
      });
      console.log('Updated:', updated);
    }
  } else if (yesterdayCommitments[0]) {
    // Test updating existing commitment
    console.log('\n2. Updating existing yesterday\'s commitment:');
    const commitment = yesterdayCommitments[0];
    const newStatus = commitment.status === 'completed' ? 'pending' : 'completed';

    const updated = await makeRequest(`${API_BASE}/commitments`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: commitment.id,
        status: newStatus
      })
    });
    console.log(`Changed status from ${commitment.status} to ${newStatus}:`, updated);
  }

  // Test 4: Create commitment for today
  console.log('\n4. Creating commitment for today:');
  const todayCreated = await makeRequest(`${API_BASE}/commitments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: BRIAN_ID,
      commitmentText: `Test commitment ${Date.now()}`,
      date: today,
      status: 'pending'
    })
  });
  console.log('Created today:', todayCreated);

  // Test 5: Delete test
  if (todayCreated.id) {
    console.log('\n5. Testing delete:');
    const deleteResult = await makeRequest(`${API_BASE}/commitments`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: todayCreated.id })
    });
    console.log('Deleted:', deleteResult);
  }
}

async function testGoals() {
  console.log('\n=== TESTING GOALS ===');

  // Test 1: Get all goals
  console.log('\n1. Getting all goals:');
  const goals = await makeRequest(`${API_BASE}/goals?userId=${BRIAN_ID}`);
  console.log('Goals:', goals);

  // Test 2: Create a goal
  console.log('\n2. Creating a goal:');
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 7);
  const created = await makeRequest(`${API_BASE}/goals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: BRIAN_ID,
      goalText: `Test goal ${Date.now()}`,
      targetDate: futureDate.toISOString().split('T')[0],
      progress: 0
    })
  });
  console.log('Created:', created);

  // Test 3: Update progress
  if (created.id) {
    console.log('\n3. Updating goal progress:');
    const updated = await makeRequest(`${API_BASE}/goals`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: created.id,
        progress: 50
      })
    });
    console.log('Updated:', updated);

    // Test 4: Delete goal
    console.log('\n4. Deleting goal:');
    const deleteResult = await makeRequest(`${API_BASE}/goals`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: created.id })
    });
    console.log('Deleted:', deleteResult);
  }
}

async function testUI() {
  console.log('\n=== TESTING UI WITH PLAYWRIGHT ===');

  const browser = await chromium.launch({
    headless: false,
    slowMo: 300
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to app
    console.log('\n1. Navigating to app...');
    await page.goto('https://communitynwa.com');
    await page.waitForTimeout(2000);

    // Login
    console.log('2. Logging in...');
    await page.fill('input[type="text"]', 'ba1876');
    await page.fill('input[type="password"]', 'Lbbc#2245');
    await page.click('button:has-text("Sign In")');
    await page.waitForTimeout(3000);

    // Go to commitments
    console.log('3. Testing commitments section...');
    await page.click('text=Daily Commitments');
    await page.waitForTimeout(2000);

    // Navigate to yesterday
    console.log('4. Navigating to yesterday...');
    await page.click('button:has-text("Yesterday")');
    await page.waitForTimeout(2000);

    // Check if there are commitments for yesterday
    const commitmentElements = await page.$$('div[class*="flex items-center gap-3 p-3"]');
    console.log(`Found ${commitmentElements.length} commitments for yesterday`);

    if (commitmentElements.length > 0) {
      console.log('5. Testing checkbox click...');
      // Try to click the first checkbox
      const circles = await page.$$('svg.lucide-circle, svg.lucide-check-circle');
      if (circles.length > 0) {
        console.log('   - Found checkbox, clicking...');
        await circles[0].click();
        await page.waitForTimeout(2000);

        // Check if the status changed
        const afterCircles = await page.$$('svg.lucide-check-circle');
        console.log(`   - Check circles after click: ${afterCircles.length}`);
      } else {
        console.log('   - No checkboxes found');
      }
    } else {
      console.log('5. Adding commitment for yesterday...');
      const textarea = await page.$('textarea[placeholder*="Complete project proposal"]');
      if (textarea) {
        await textarea.fill('Yesterday commitment test');
        await page.click('button:has-text("Add Commitment")');
        await page.waitForTimeout(2000);
        console.log('   - Commitment added');
      }
    }

    // Navigate back to today
    console.log('6. Going back to today...');
    await page.click('button:has-text("Today")');
    await page.waitForTimeout(2000);

    // Test goals
    console.log('7. Testing goals...');
    await page.click('text=Weekly Goals');
    await page.waitForTimeout(2000);

    // Try to add a goal
    const goalTextarea = await page.$('textarea[placeholder*="Write your goal here"]');
    if (goalTextarea) {
      console.log('   - Adding a goal...');
      await goalTextarea.fill('Test goal from UI');

      // Set date
      const dateInputs = await page.$$('input[type="date"]');
      if (dateInputs.length > 0) {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 7);
        await dateInputs[0].fill(futureDate.toISOString().split('T')[0]);
      }

      await page.click('button:has-text("Add Goal")');
      await page.waitForTimeout(2000);
      console.log('   - Goal added');
    }

    // Take screenshots
    console.log('8. Taking screenshots...');
    await page.screenshot({ path: 'test-comprehensive-goals.png', fullPage: true });

    await page.click('text=Daily Commitments');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-comprehensive-commitments.png', fullPage: true });

    console.log('\n✅ UI tests completed!');

  } catch (error) {
    console.error('UI test failed:', error);
    const page = browser.contexts()[0]?.pages()[0];
    if (page) {
      await page.screenshot({ path: 'test-error.png', fullPage: true });
    }
  } finally {
    await browser.close();
  }
}

async function runAllTests() {
  try {
    // Test API endpoints
    await testCommitments();
    await testGoals();

    // Test UI
    await testUI();

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run tests
runAllTests();
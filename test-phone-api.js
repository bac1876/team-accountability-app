// Test phone call API directly
const API_BASE = 'http://localhost:3000';

async function testPhoneAPI() {
  console.log('Testing phone call API directly...\n');

  // Test 1: Get Brian's user ID
  console.log('1. Getting Brian\'s user info...');
  const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'brian@searchnwa.com',
      password: 'Lbbc#2245'
    })
  });

  const loginResult = await loginResponse.json();
  console.log('Login response:', loginResult);

  if (!loginResult.user) {
    console.error('Failed to login as Brian');
    return;
  }

  const userId = loginResult.user.id;
  console.log('Brian\'s user ID:', userId, '\n');

  // Test 2: Set a goal for today
  console.log('2. Setting goal for today...');
  const today = new Date().toISOString().split('T')[0];
  console.log('Date:', today);
  console.log('Payload:', {
    user_id: userId,
    call_date: today,
    target_calls: 50,
    actual_calls: null,
    notes: ''
  });

  const setGoalResponse = await fetch(`${API_BASE}/api/phone-calls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      call_date: today,
      target_calls: 50,
      actual_calls: null,
      notes: ''
    })
  });

  console.log('Response status:', setGoalResponse.status);
  console.log('Response headers:', Object.fromEntries(setGoalResponse.headers.entries()));

  const responseText = await setGoalResponse.text();
  console.log('Response body (raw):', responseText);

  try {
    const result = JSON.parse(responseText);
    console.log('Response body (parsed):', result);

    if (setGoalResponse.ok) {
      console.log('✓ Goal set successfully!\n');
    } else {
      console.error('✗ Failed to set goal:', result.error || 'Unknown error');
    }
  } catch (e) {
    console.error('Failed to parse response as JSON:', e.message);
  }

  // Test 3: Verify the goal was saved
  console.log('3. Verifying saved goal...');
  const getResponse = await fetch(`${API_BASE}/api/phone-calls?userId=${userId}`, {
    headers: { 'Content-Type': 'application/json' }
  });

  const getResult = await getResponse.json();
  console.log('Saved phone calls:', getResult);
}

testPhoneAPI().catch(console.error);
// Test GET request for commitments
async function testGetCommitments() {
  try {
    console.log('Testing GET commitments...');

    // Test getting commitments for user 1
    const response = await fetch('https://communitynwa.com/api/commitments?userId=1&history=true');

    if (response.ok) {
      const data = await response.json();
      console.log('✓ GET commitments successful');
      console.log('Number of commitments:', data.length);
      if (data.length > 0) {
        console.log('Latest commitment:', data[0]);
      }
    } else {
      const error = await response.text();
      console.log('✗ GET commitments failed');
      console.log('Status:', response.status);
      console.log('Error:', error);
    }

    // Test getting goals for comparison
    console.log('\nTesting GET goals...');
    const goalsResponse = await fetch('https://communitynwa.com/api/goals?userId=1');

    if (goalsResponse.ok) {
      const data = await goalsResponse.json();
      console.log('✓ GET goals successful');
      console.log('Number of goals:', data.length);
      if (data.length > 0) {
        console.log('Latest goal:', data[0]);
      }
    } else {
      const error = await goalsResponse.text();
      console.log('✗ GET goals failed');
      console.log('Status:', goalsResponse.status);
      console.log('Error:', error);
    }

  } catch (error) {
    console.error('Test error:', error);
  }
}

testGetCommitments();
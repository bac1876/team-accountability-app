// Test all three fixes with correct user ID

async function testAllFixes() {
  const BASE_URL = 'https://communitynwa.com'
  const BRIAN_USER_ID = 1  // Brian's actual user ID (integer)

  console.log('\n📝 Testing all fixes with Brian\'s account (ID: 1)...')

  // Test 1: Test reflection creation (should now save properly)
  console.log('\n1️⃣ Testing reflection save (field name fix)...')
  try {
    const reflectionResponse = await fetch(`${BASE_URL}/api/reflections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: BRIAN_USER_ID,
        date: new Date().toISOString().split('T')[0],
        wins: 'Fixed three critical issues',
        challenges: 'Took longer than expected',
        tomorrowFocus: 'Test all functionality thoroughly'
      })
    })

    if (reflectionResponse.ok) {
      const reflection = await reflectionResponse.json()
      console.log('✅ Reflection saved successfully!')
      console.log('   - ID:', reflection.id)
      console.log('   - Tomorrow focus:', reflection.tomorrow_focus)
    } else {
      const error = await reflectionResponse.json()
      console.log('❌ Failed to save reflection:', error)
    }
  } catch (error) {
    console.log('❌ Error saving reflection:', error.message)
  }

  // Test 2: Test goal creation and deletion
  console.log('\n2️⃣ Testing goal creation and deletion...')
  try {
    // Create a test goal
    const goalResponse = await fetch(`${BASE_URL}/api/goals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: BRIAN_USER_ID,
        goalText: 'Test goal for deletion - can be removed',
        targetDate: null
      })
    })

    if (goalResponse.ok) {
      const goal = await goalResponse.json()
      console.log('✅ Goal created successfully!')
      console.log('   - ID:', goal.id)
      console.log('   - Text:', goal.goal_text)

      // Now test deletion
      const deleteResponse = await fetch(`${BASE_URL}/api/goals?goalId=${goal.id}`, {
        method: 'DELETE'
      })

      if (deleteResponse.ok) {
        console.log('✅ Goal deleted successfully')
      } else {
        console.log('❌ Failed to delete goal')
      }
    } else {
      const error = await goalResponse.json()
      console.log('❌ Failed to create goal:', error)
    }
  } catch (error) {
    console.log('❌ Error with goal operations:', error.message)
  }

  // Test 3: Test commitment creation and deletion
  console.log('\n3️⃣ Testing commitment creation and deletion...')
  try {
    // Create a test commitment
    const commitmentResponse = await fetch(`${BASE_URL}/api/commitments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: BRIAN_USER_ID,
        date: new Date().toISOString().split('T')[0],
        commitmentText: 'Test commitment for deletion - can be removed',
        status: 'pending'
      })
    })

    if (commitmentResponse.ok) {
      const commitment = await commitmentResponse.json()
      console.log('✅ Commitment created successfully!')
      console.log('   - ID:', commitment.id)
      console.log('   - Text:', commitment.commitment_text)

      // Now test deletion
      const deleteResponse = await fetch(`${BASE_URL}/api/commitments?commitmentId=${commitment.id}`, {
        method: 'DELETE'
      })

      if (deleteResponse.ok) {
        console.log('✅ Commitment deleted successfully')
      } else {
        console.log('❌ Failed to delete commitment')
      }
    } else {
      const error = await commitmentResponse.json()
      console.log('❌ Failed to create commitment:', error)
    }
  } catch (error) {
    console.log('❌ Error with commitment operations:', error.message)
  }

  console.log('\n✨ All API tests completed!')
  console.log('\n📌 Summary:')
  console.log('- Reflections should now save with proper field mapping')
  console.log('- Goals and commitments should have delete buttons')
  console.log('- Goal slider should be more responsive')
  console.log('\nPlease test the slider functionality in the browser UI at https://communitynwa.com')
}

testAllFixes().catch(console.error)
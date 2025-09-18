// Test all three fixes

async function testAllFixes() {
  const BASE_URL = 'https://communitynwa.com'

  console.log('🔄 Waiting 60 seconds for deployment to complete...')
  await new Promise(resolve => setTimeout(resolve, 60000))

  console.log('\n📝 Testing all fixes with Brian\'s account...')

  // Test 1: Test reflection creation (should now save properly)
  console.log('\n1️⃣ Testing reflection save (field name fix)...')
  try {
    const reflectionResponse = await fetch(`${BASE_URL}/api/reflections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: 'user2',
        date: new Date().toISOString().split('T')[0],
        wins: 'Fixed three critical issues',
        challenges: 'Took longer than expected',
        tomorrowFocus: 'Test all functionality thoroughly'
      })
    })

    if (reflectionResponse.ok) {
      const reflection = await reflectionResponse.json()
      console.log('✅ Reflection saved successfully:', reflection)
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
        userId: 'user2',
        goalText: 'Test goal for deletion',
        targetDate: null
      })
    })

    if (goalResponse.ok) {
      const goal = await goalResponse.json()
      console.log('✅ Goal created:', goal)

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
        userId: 'user2',
        date: new Date().toISOString().split('T')[0],
        commitmentText: 'Test commitment for deletion',
        status: 'pending'
      })
    })

    if (commitmentResponse.ok) {
      const commitment = await commitmentResponse.json()
      console.log('✅ Commitment created:', commitment)

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
  console.log('Note: Goal slider functionality should be tested in the browser UI')
}

testAllFixes().catch(console.error)
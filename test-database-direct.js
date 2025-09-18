// Test database connection directly to debug commitment creation
import { db } from '@vercel/postgres';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testDatabase() {
  try {
    console.log('Testing database connection...');

    const client = await db.connect();
    console.log('✓ Connected to database');

    // Test 1: Check if table exists and structure
    console.log('\n1. Checking daily_commitments table structure...');
    const tableInfo = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'daily_commitments'
      ORDER BY ordinal_position
    `);
    console.log('Table columns:', tableInfo.rows);

    // Test 2: Check existing commitments for user 1
    console.log('\n2. Checking existing commitments for user 1...');
    const existing = await client.query(
      'SELECT * FROM daily_commitments WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [1]
    );
    console.log('Existing commitments:', existing.rows.length);

    // Test 3: Try to insert a commitment exactly as the API would
    console.log('\n3. Testing commitment insertion...');
    const testData = {
      userId: 1,
      date: '2025-09-18',
      commitmentText: 'Direct test commitment ' + new Date().toISOString(),
      status: 'pending'
    };

    try {
      const result = await client.query(
        'INSERT INTO daily_commitments (user_id, commitment_date, commitment_text, status) VALUES ($1, $2, $3, $4) RETURNING *',
        [testData.userId, testData.date, testData.commitmentText, testData.status]
      );
      console.log('✓ Commitment created successfully:', result.rows[0]);
    } catch (insertError) {
      console.error('✗ Failed to create commitment:', insertError.message);
      console.error('Error details:', insertError);
    }

    // Test 4: Compare with goal insertion
    console.log('\n4. Testing goal insertion for comparison...');
    const goalData = {
      userId: 1,
      goalText: 'Direct test goal ' + new Date().toISOString(),
      targetDate: null
    };

    try {
      const result = await client.query(
        'INSERT INTO weekly_goals (user_id, goal_text, target_date) VALUES ($1, $2, $3) RETURNING *',
        [goalData.userId, goalData.goalText, goalData.targetDate]
      );
      console.log('✓ Goal created successfully:', result.rows[0]);
    } catch (goalError) {
      console.error('✗ Failed to create goal:', goalError.message);
    }

    client.release();
    console.log('\n✓ All tests completed');

  } catch (error) {
    console.error('Database connection error:', error);
  }
}

testDatabase();
import Database from 'better-sqlite3';

const db = new Database('./sql/accountability.db');

try {
  const users = db.prepare('SELECT id, email, name FROM users').all();
  console.log('Available users in database:');
  users.forEach(user => {
    console.log(`ID: ${user.id}, Email: ${user.email}, Name: ${user.name}`);
  });
  
  // Check if Brian exists
  const brian = db.prepare('SELECT * FROM users WHERE email = ?').get('brian@searchnwa.com');
  if (brian) {
    console.log('\nBrian user found:', brian);
  } else {
    console.log('\nBrian user NOT found');
  }
  
} catch (error) {
  console.error('Database error:', error);
} finally {
  db.close();
}

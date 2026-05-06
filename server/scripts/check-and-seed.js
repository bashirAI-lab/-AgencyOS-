const { getDb } = require('../db/init');
const { seed } = require('./seed-prod');

async function checkAndSeed() {
  try {
    const db = getDb();
    
    // Check if users table is empty
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    
    if (userCount === 0) {
      console.log('📂 Database is empty. Running production seed...');
      await seed();
    } else {
      console.log(`📂 Database already contains ${userCount} users. Skipping seed.`);
    }
  } catch (error) {
    console.error('❌ Error checking database or seeding:', error);
    process.exit(1);
  }
}

checkAndSeed();

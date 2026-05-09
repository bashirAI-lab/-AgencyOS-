const { getDb } = require('../db/init');
const { seed, seedUsers } = require('./seed-prod');

async function checkAndSeed() {
  try {
    const db = getDb();
    const force = process.argv.includes('--force');
    
    // Check if users table is empty
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    
    if (userCount === 0) {
      console.log('📂 Database is empty. Running production seed...');
      await seed();
    } else {
      console.log(`📂 Database already contains ${userCount} users. Ensuring demo users exist...`);
      // Re-seed just the main users to ensure they have the correct password
      await seedUsers(true);
      
      if (force) {
        console.log('🔄 Force flag detected. (User seeding handled above)');
      }
    }
  } catch (error) {
    console.error('❌ Error checking database or seeding:', error);
    process.exit(1);
  }
}

checkAndSeed();

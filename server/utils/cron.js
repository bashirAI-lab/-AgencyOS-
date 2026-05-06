const cron = require('node-cron');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');

function startCronJobs() {
  // Auto-sync simulation every 24h (runs at midnight)
  cron.schedule('0 0 * * *', () => {
    console.log('🔄 Running auto-sync simulation...');
    simulateApiSync();
  });

  console.log('⏰ Cron jobs scheduled (auto-sync every 24h at midnight)');
}

function simulateApiSync() {
  const db = getDb();
  const creators = db.prepare('SELECT * FROM creators WHERE is_agency_account = 0').all();
  const platforms = ['tiktok', 'instagram', 'x'];
  const today = new Date().toISOString().split('T')[0];

  for (const creator of creators) {
    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const views = Math.floor(Math.random() * 80000) + 2000;
    const likes = Math.floor(views * (Math.random() * 0.12 + 0.03));
    const comments = Math.floor(likes * (Math.random() * 0.08 + 0.01));
    const shares = Math.floor(comments * (Math.random() * 0.4 + 0.1));
    const engagement = ((likes + comments + shares) / views * 100).toFixed(2);
    const followers = Math.floor(Math.random() * 500000) + 10000;

    const existing = db.prepare('SELECT id FROM analytics WHERE creator_id=? AND platform=? AND date=?').get(creator.id, platform, today);
    if (!existing) {
      db.prepare('INSERT INTO analytics (id,creator_id,platform,date,views,likes,comments,shares,followers,engagement_rate) VALUES (?,?,?,?,?,?,?,?,?,?)').run(uuidv4(), creator.id, platform, today, views, likes, comments, shares, followers, parseFloat(engagement));
    }
  }
  console.log(`✅ Auto-sync complete for ${creators.length} creators`);
}

module.exports = { startCronJobs };

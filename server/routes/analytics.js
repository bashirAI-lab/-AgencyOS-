const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get analytics with filters
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { creator_id, platform, tag_id, start_date, end_date } = req.query;
    
    let query = `
      SELECT a.*, c.display_name as creator_name, c.display_name_ar as creator_name_ar
      FROM analytics a
      LEFT JOIN creators c ON a.creator_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (creator_id) { query += ' AND a.creator_id = ?'; params.push(creator_id); }
    if (platform) { query += ' AND a.platform = ?'; params.push(platform); }
    if (start_date) { query += ' AND a.date >= ?'; params.push(start_date); }
    if (end_date) { query += ' AND a.date <= ?'; params.push(end_date); }
    if (tag_id) {
      query += ' AND a.id IN (SELECT analytics_id FROM analytics_tags WHERE tag_id = ?)';
      params.push(tag_id);
    }

    query += ' ORDER BY a.date DESC';
    const analytics = db.prepare(query).all(...params);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get analytics summary
router.get('/summary', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { period, platform } = req.query;
    let dateFilter = '';
    
    if (period === '7d') dateFilter = "AND date >= date('now', '-7 days')";
    else if (period === '30d') dateFilter = "AND date >= date('now', '-30 days')";
    else if (period === '90d') dateFilter = "AND date >= date('now', '-90 days')";

    let pFilter = '';
    const params = [];
    if (platform && platform !== 'all') {
      pFilter = 'AND platform = ?';
      params.push(platform);
    }

    const summary = db.prepare(`
      SELECT 
        SUM(views) as total_views,
        SUM(likes) as total_likes,
        SUM(comments) as total_comments,
        SUM(shares) as total_shares,
        AVG(engagement_rate) as avg_engagement,
        COUNT(DISTINCT creator_id) as active_creators
      FROM analytics WHERE 1=1 ${dateFilter} ${pFilter}
    `).get(...params);

    const platformBreakdown = db.prepare(`
      SELECT platform, SUM(views) as views, SUM(likes) as likes, 
             SUM(comments) as comments, AVG(engagement_rate) as engagement
      FROM analytics WHERE 1=1 ${dateFilter}
      GROUP BY platform
    `).all();

    const viewsOverTime = db.prepare(`
      SELECT date, SUM(views) as views, SUM(likes) as likes
      FROM analytics WHERE 1=1 ${dateFilter} ${pFilter}
      GROUP BY date ORDER BY date
    `).all(...params);

    const topCreators = db.prepare(`
      SELECT c.id, c.display_name, c.display_name_ar, c.platform,
             SUM(a.views) as total_views, AVG(a.engagement_rate) as avg_engagement, MAX(a.followers) as latest_followers
      FROM analytics a
      JOIN creators c ON a.creator_id = c.id
      WHERE 1=1 ${dateFilter} ${pFilter.replace('platform', 'a.platform')}
      GROUP BY a.creator_id
      ORDER BY total_views DESC
      LIMIT 10
    `).all(...params);

    res.json({ summary, platformBreakdown, viewsOverTime, topCreators });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get creators
router.get('/creators', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const creators = db.prepare(`
      SELECT c.*, u.full_name, u.full_name_ar,
        (SELECT SUM(views) FROM analytics WHERE creator_id = c.id) as total_views,
        (SELECT MAX(followers) FROM analytics WHERE creator_id = c.id) as latest_followers,
        (SELECT AVG(engagement_rate) FROM analytics WHERE creator_id = c.id) as avg_engagement
      FROM creators c
      LEFT JOIN users u ON c.user_id = u.id
    `).all();
    res.json(creators);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get tags
router.get('/tags', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const tags = db.prepare('SELECT * FROM tags ORDER BY type, name').all();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manual entry (Snapchat)
router.post('/manual', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { creator_id, platform, date, views, likes, comments, shares, followers, screenshot } = req.body;
    const engagement = ((likes + comments + shares) / views * 100).toFixed(2);
    
    const id = uuidv4();
    db.prepare(`
      INSERT INTO analytics (id, creator_id, platform, date, views, likes, comments, shares, followers, engagement_rate, is_manual, screenshot)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).run(id, creator_id, platform || 'snapchat', date, views, likes, comments, shares, followers, parseFloat(engagement), screenshot || null);

    res.json({ id, message: 'Manual entry added' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all kanban cards
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    let query = `
      SELECT k.*, c.display_name as creator_name, c.display_name_ar as creator_name_ar,
             u.full_name as assigned_name, u.full_name_ar as assigned_name_ar
      FROM kanban_cards k
      LEFT JOIN creators c ON k.creator_id = c.id
      LEFT JOIN users u ON k.assigned_to = u.id
    `;
    
    // Content creators only see their own cards
    if (req.user.role === 'content_creator') {
      query += ` WHERE k.assigned_to = ? OR k.creator_id IN (SELECT id FROM creators WHERE user_id = ?)`;
      const cards = db.prepare(query + ' ORDER BY k.position').all(req.user.id, req.user.id);
      return res.json(cards);
    }

    const cards = db.prepare(query + ' ORDER BY k.position').all();
    
    // Add votes to each card
    for (const card of cards) {
      card.votes = db.prepare(`
        SELECT kv.*, u.full_name as voter_name FROM kanban_votes kv
        JOIN users u ON kv.user_id = u.id
        WHERE kv.card_id = ?
      `).all(card.id);
      card.voters = db.prepare(`
        SELECT kvo.user_id, u.full_name as voter_name FROM kanban_voters kvo
        JOIN users u ON kvo.user_id = u.id
        WHERE kvo.card_id = ?
      `).all(card.id);
    }

    res.json(cards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create card
router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { title, title_ar, description, description_ar, thumbnail, stage, priority, creator_id, assigned_to, shooting_date } = req.body;
    const id = uuidv4();
    
    const maxPos = db.prepare('SELECT MAX(position) as max FROM kanban_cards WHERE stage = ?').get(stage || 'ideation');
    
    db.prepare(`
      INSERT INTO kanban_cards (id, title, title_ar, description, description_ar, thumbnail, stage, priority, creator_id, assigned_to, shooting_date, position)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, title, title_ar, description, description_ar, thumbnail, stage || 'ideation', priority || 'medium', creator_id, assigned_to, shooting_date, (maxPos?.max || 0) + 1);

    const card = db.prepare('SELECT * FROM kanban_cards WHERE id = ?').get(id);
    res.status(201).json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update card stage (drag & drop)
router.patch('/:id/stage', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { stage, position } = req.body;
    
    db.prepare('UPDATE kanban_cards SET stage = ?, position = ?, updated_at = datetime("now") WHERE id = ?')
      .run(stage, position || 0, req.params.id);

    const card = db.prepare('SELECT * FROM kanban_cards WHERE id = ?').get(req.params.id);
    
    // If approved and moved to shooting, create calendar event
    if (stage === 'shooting' && card.shooting_date) {
      const existingEvent = db.prepare('SELECT id FROM calendar_events WHERE kanban_card_id = ? AND type = ?').get(card.id, 'shoot');
      if (!existingEvent) {
        db.prepare(`
          INSERT INTO calendar_events (id, title, title_ar, type, date, color, kanban_card_id, created_by)
          VALUES (?, ?, ?, 'shoot', ?, '#3B82F6', ?, ?)
        `).run(uuidv4(), `Shoot: ${card.title}`, card.title_ar ? `تصوير: ${card.title_ar}` : null, card.shooting_date, card.id, req.user.id);
      }
    }

    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PM approve card
router.patch('/:id/approve', authMiddleware, roleMiddleware('project_manager'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE kanban_cards SET pm_approved = 1, updated_at = datetime("now") WHERE id = ?').run(req.params.id);
    
    const card = db.prepare('SELECT * FROM kanban_cards WHERE id = ?').get(req.params.id);
    
    // Create parallel tasks on approval
    const taskRoles = ['scriptwriter', 'camera_operator'];
    for (const role of taskRoles) {
      db.prepare(`
        INSERT INTO tasks (id, title, title_ar, kanban_card_id, assigned_role, status, created_by)
        VALUES (?, ?, ?, ?, ?, 'pending', ?)
      `).run(
        uuidv4(),
        `${role.replace('_', ' ')} for: ${card.title}`,
        `${role} لـ: ${card.title_ar || card.title}`,
        card.id, role, req.user.id
      );
    }

    res.json({ message: 'Card approved, tasks created', card });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vote on card
router.post('/:id/vote', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { vote } = req.body; // 1 = up, -1 = down
    
    db.prepare(`
      INSERT INTO kanban_votes (id, card_id, user_id, vote)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(card_id, user_id) DO UPDATE SET vote = excluded.vote
    `).run(uuidv4(), req.params.id, req.user.id, vote);

    const votes = db.prepare(`
      SELECT kv.*, u.full_name as voter_name 
      FROM kanban_votes kv
      JOIN users u ON kv.user_id = u.id
      WHERE kv.card_id = ?
    `).all(req.params.id);
    res.json(votes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update card
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { title, title_ar, description, description_ar, thumbnail, priority, creator_id, assigned_to, shooting_date } = req.body;
    
    db.prepare(`
      UPDATE kanban_cards SET title=?, title_ar=?, description=?, description_ar=?, thumbnail=?, priority=?, creator_id=?, assigned_to=?, shooting_date=?, updated_at=datetime('now')
      WHERE id = ?
    `).run(title, title_ar, description, description_ar, thumbnail, priority, creator_id, assigned_to, shooting_date, req.params.id);

    const card = db.prepare('SELECT * FROM kanban_cards WHERE id = ?').get(req.params.id);
    res.json(card);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete card
router.delete('/:id', authMiddleware, roleMiddleware('project_manager'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM kanban_cards WHERE id = ?').run(req.params.id);
    res.json({ message: 'Card deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

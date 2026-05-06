const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { kanban_card_id, assigned_to, status } = req.query;
    let q = 'SELECT t.*,u.full_name as assigned_name,u.full_name_ar as assigned_name_ar,k.title as card_title FROM tasks t LEFT JOIN users u ON t.assigned_to=u.id LEFT JOIN kanban_cards k ON t.kanban_card_id=k.id WHERE 1=1';
    const p = [];
    if (req.user.role === 'content_creator' || req.user.role === 'production_team') {
      q += ' AND t.assigned_to=?'; p.push(req.user.id);
    }
    if (kanban_card_id) { q += ' AND t.kanban_card_id=?'; p.push(kanban_card_id); }
    if (assigned_to) { q += ' AND t.assigned_to=?'; p.push(assigned_to); }
    if (status) { q += ' AND t.status=?'; p.push(status); }
    q += ' ORDER BY t.created_at DESC';
    res.json(db.prepare(q).all(...p));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { title, title_ar, description, kanban_card_id, assigned_to, assigned_role, due_date } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO tasks (id,title,title_ar,description,kanban_card_id,assigned_to,assigned_role,status,due_date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id, title, title_ar, description, kanban_card_id, assigned_to, assigned_role, 'pending', due_date, req.user.id);
    if (assigned_to) {
      db.prepare('INSERT INTO notifications (id,user_id,title,message,type,link) VALUES (?,?,?,?,?,?)').run(uuidv4(), assigned_to, 'New Task Assigned', `You have been assigned: ${title}`, 'task', `/tasks`);
    }
    res.status(201).json(db.prepare('SELECT * FROM tasks WHERE id=?').get(id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    db.prepare('UPDATE tasks SET status=?,updated_at=datetime("now") WHERE id=?').run(status, req.params.id);
    res.json(db.prepare('SELECT * FROM tasks WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM tasks WHERE id=?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Notifications
router.get('/notifications', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    res.json(db.prepare('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50').all(req.user.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/notifications/:id/read', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read=1 WHERE id=?').run(req.params.id);
    res.json({ message: 'Marked read' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

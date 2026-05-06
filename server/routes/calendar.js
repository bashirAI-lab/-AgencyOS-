const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { month, year, type } = req.query;
    let q = 'SELECT * FROM calendar_events WHERE 1=1';
    const p = [];
    if (month && year) {
      q += " AND strftime('%Y-%m',date)=?";
      p.push(`${year}-${String(month).padStart(2,'0')}`);
    }
    if (type) { q += ' AND type=?'; p.push(type); }
    q += ' ORDER BY date, start_time';
    res.json(db.prepare(q).all(...p));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { title, title_ar, description, type, date, start_time, end_time, color } = req.body;
    const id = uuidv4();
    const colors = { shoot: '#3B82F6', meeting: '#EAB308', deadline: '#EF4444', general: '#6366f1' };
    db.prepare('INSERT INTO calendar_events (id,title,title_ar,description,type,date,start_time,end_time,color,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id, title, title_ar, description, type||'general', date, start_time, end_time, color||colors[type]||'#6366f1', req.user.id);
    res.status(201).json(db.prepare('SELECT * FROM calendar_events WHERE id=?').get(id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { title, title_ar, description, type, date, start_time, end_time, color } = req.body;
    db.prepare('UPDATE calendar_events SET title=?,title_ar=?,description=?,type=?,date=?,start_time=?,end_time=?,color=? WHERE id=?').run(title, title_ar, description, type, date, start_time, end_time, color, req.params.id);
    res.json(db.prepare('SELECT * FROM calendar_events WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM calendar_events WHERE id=?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

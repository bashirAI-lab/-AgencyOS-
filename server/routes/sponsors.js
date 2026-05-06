const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.query;
    let query = 'SELECT * FROM sponsors';
    const params = [];
    if (status) { query += ' WHERE status = ?'; params.push(status); }
    query += ' ORDER BY created_at DESC';
    const sponsors = db.prepare(query).all(...params);
    for (const s of sponsors) {
      s.financial = db.prepare(`SELECT COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) as paid, COALESCE(SUM(CASE WHEN status='sent' THEN total ELSE 0 END),0) as invoiced, COALESCE(SUM(CASE WHEN status='overdue' THEN total ELSE 0 END),0) as outstanding FROM invoices WHERE client_name=? OR sponsor_id=?`).get(s.name, s.id);
    }
    res.json(sponsors);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const s = db.prepare('SELECT * FROM sponsors WHERE id=?').get(req.params.id);
    if (!s) return res.status(404).json({ error: 'Not found' });
    s.interactions = db.prepare('SELECT si.*,u.full_name as created_by_name FROM sponsor_interactions si LEFT JOIN users u ON si.created_by=u.id WHERE si.sponsor_id=? ORDER BY si.date DESC').all(req.params.id);
    s.invoices = db.prepare('SELECT * FROM invoices WHERE client_name=? OR sponsor_id=? ORDER BY issue_date DESC').all(s.name, s.id);
    s.financial = db.prepare(`SELECT COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) as paid, COALESCE(SUM(CASE WHEN status='sent' THEN total ELSE 0 END),0) as invoiced, COALESCE(SUM(CASE WHEN status='overdue' THEN total ELSE 0 END),0) as outstanding FROM invoices WHERE client_name=? OR sponsor_id=?`).get(s.name, s.id);
    res.json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { name, name_ar, contact_person, email, phone, website, status, notes, deal_value } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO sponsors (id,name,name_ar,contact_person,email,phone,website,status,notes,deal_value) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id, name, name_ar, contact_person, email, phone, website, status||'lead', notes, deal_value||0);
    res.status(201).json(db.prepare('SELECT * FROM sponsors WHERE id=?').get(id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { name, name_ar, contact_person, email, phone, website, status, notes, deal_value } = req.body;
    db.prepare('UPDATE sponsors SET name=?,name_ar=?,contact_person=?,email=?,phone=?,website=?,status=?,notes=?,deal_value=?,updated_at=datetime("now") WHERE id=?').run(name, name_ar, contact_person, email, phone, website, status, notes, deal_value, req.params.id);
    res.json(db.prepare('SELECT * FROM sponsors WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/interactions', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { type, subject, notes, date } = req.body;
    const id = uuidv4();
    db.prepare('INSERT INTO sponsor_interactions (id,sponsor_id,type,subject,notes,date,created_by) VALUES (?,?,?,?,?,?,?)').run(id, req.params.id, type, subject, notes, date||new Date().toISOString(), req.user.id);
    res.status(201).json(db.prepare('SELECT * FROM sponsor_interactions WHERE id=?').get(id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM sponsor_interactions WHERE sponsor_id=?').run(req.params.id);
    db.prepare('DELETE FROM sponsors WHERE id=?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

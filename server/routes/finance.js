const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { status, type } = req.query;
    let q = 'SELECT i.*,s.name as sponsor_name FROM invoices i LEFT JOIN sponsors s ON i.sponsor_id=s.id WHERE 1=1';
    const p = [];
    if (status) { q += ' AND i.status=?'; p.push(status); }
    if (type) { q += ' AND i.type=?'; p.push(type); }
    q += ' ORDER BY i.created_at DESC';
    const invoices = db.prepare(q).all(...p);
    for (const inv of invoices) {
      inv.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY position').all(inv.id);
    }
    res.json(invoices);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/summary', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const summary = db.prepare(`SELECT COALESCE(SUM(total),0) as total_revenue, COALESCE(SUM(CASE WHEN status='paid' THEN total ELSE 0 END),0) as paid, COALESCE(SUM(CASE WHEN status='sent' THEN total ELSE 0 END),0) as pending, COALESCE(SUM(CASE WHEN status='overdue' THEN total ELSE 0 END),0) as overdue, COALESCE(SUM(CASE WHEN status='draft' THEN total ELSE 0 END),0) as draft, COUNT(*) as count FROM invoices WHERE type='invoice'`).get();
    const monthly = db.prepare(`SELECT strftime('%Y-%m',issue_date) as month, SUM(total) as revenue FROM invoices GROUP BY month ORDER BY month`).all();
    res.json({ summary, monthly });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const inv = db.prepare('SELECT i.*,s.name as sponsor_name FROM invoices i LEFT JOIN sponsors s ON i.sponsor_id=s.id WHERE i.id=?').get(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Not found' });
    inv.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY position').all(inv.id);
    res.json(inv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { type, sponsor_id, client_name, client_email, items, tax_rate, due_date, notes } = req.body;
    const id = uuidv4();
    const count = db.prepare('SELECT COUNT(*) as c FROM invoices').get().c;
    const inv_number = `${type === 'quotation' ? 'QT' : 'INV'}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    let subtotal = 0;
    if (items) items.forEach(it => { subtotal += (it.quantity || 1) * (it.unit_price || 0); });
    const tr = tax_rate || 0.15;
    const tax_amount = subtotal * tr;
    const total = subtotal + tax_amount;
    db.prepare('INSERT INTO invoices (id,invoice_number,type,sponsor_id,client_name,client_email,status,subtotal,tax_rate,tax_amount,total,due_date,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id, inv_number, type||'invoice', sponsor_id, client_name, client_email, 'draft', subtotal, tr, tax_amount, total, due_date, notes, req.user.id);
    if (items) {
      const stmt = db.prepare('INSERT INTO invoice_items (id,invoice_id,description,quantity,unit_price,total,position) VALUES (?,?,?,?,?,?,?)');
      items.forEach((it, i) => {
        stmt.run(uuidv4(), id, it.description, it.quantity||1, it.unit_price||0, (it.quantity||1)*(it.unit_price||0), i);
      });
    }
    const inv = db.prepare('SELECT * FROM invoices WHERE id=?').get(id);
    inv.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id=?').all(id);
    res.status(201).json(inv);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { status } = req.body;
    const updates = { status };
    if (status === 'paid') updates.paid_date = new Date().toISOString().split('T')[0];
    db.prepare(`UPDATE invoices SET status=?,paid_date=?,updated_at=datetime('now') WHERE id=?`).run(status, updates.paid_date || null, req.params.id);
    res.json(db.prepare('SELECT * FROM invoices WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM invoice_items WHERE invoice_id=?').run(req.params.id);
    db.prepare('DELETE FROM invoices WHERE id=?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/pdf', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const inv = db.prepare('SELECT i.*,s.name as sponsor_name FROM invoices i LEFT JOIN sponsors s ON i.sponsor_id=s.id WHERE i.id=?').get(req.params.id);
    if (!inv) return res.status(404).json({ error: 'Not found' });
    inv.items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY position').all(inv.id);
    
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${inv.invoice_number}.pdf`);
    doc.pipe(res);
    
    doc.fontSize(24).fillColor('#6366f1').text('AgencyOS', { align: 'left' });
    doc.fontSize(10).fillColor('#666666').text(inv.type === 'quotation' ? 'QUOTATION' : 'INVOICE');
    doc.moveDown(2);
    
    doc.fontSize(12).fillColor('#000000')
       .text(`Invoice Number: ${inv.invoice_number}`, { align: 'right' })
       .text(`Date: ${inv.issue_date}`, { align: 'right' });
    if (inv.due_date) doc.text(`Due Date: ${inv.due_date}`, { align: 'right' });
    doc.moveDown(1);
    
    doc.text(`Bill To:`, { underline: true });
    doc.text(inv.client_name || inv.sponsor_name);
    if (inv.client_email) doc.text(inv.client_email);
    doc.moveDown(2);
    
    const startY = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Description', 50, startY);
    doc.text('Qty', 350, startY, { width: 50, align: 'right' });
    doc.text('Unit Price', 400, startY, { width: 70, align: 'right' });
    doc.text('Total', 470, startY, { width: 70, align: 'right' });
    
    doc.moveTo(50, startY + 15).lineTo(540, startY + 15).stroke();
    doc.font('Helvetica');
    
    let y = startY + 25;
    inv.items.forEach(it => {
      doc.text(it.description, 50, y);
      doc.text(it.quantity.toString(), 350, y, { width: 50, align: 'right' });
      doc.text(`$${it.unit_price.toFixed(2)}`, 400, y, { width: 70, align: 'right' });
      doc.text(`$${it.total.toFixed(2)}`, 470, y, { width: 70, align: 'right' });
      y += 20;
    });
    
    doc.moveTo(50, y).lineTo(540, y).stroke();
    y += 15;
    
    doc.text('Subtotal:', 350, y, { width: 100, align: 'right' });
    doc.text(`$${inv.subtotal.toFixed(2)}`, 450, y, { width: 90, align: 'right' });
    y += 20;
    
    doc.text(`Tax (${(inv.tax_rate * 100).toFixed(0)}%):`, 350, y, { width: 100, align: 'right' });
    doc.text(`$${inv.tax_amount.toFixed(2)}`, 450, y, { width: 90, align: 'right' });
    y += 25;
    
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#6366f1');
    doc.text('Total:', 350, y, { width: 100, align: 'right' });
    doc.text(`$${inv.total.toFixed(2)}`, 450, y, { width: 90, align: 'right' });
    
    doc.end();
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

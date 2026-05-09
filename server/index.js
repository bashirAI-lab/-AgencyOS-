const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
require('dotenv').config();

const { getDb } = require('./db/init');
const { startCronJobs } = require('./utils/cron');

const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const kanbanRoutes = require('./routes/kanban');
const sponsorRoutes = require('./routes/sponsors');
const financeRoutes = require('./routes/finance');
const calendarRoutes = require('./routes/calendar');
const taskRoutes = require('./routes/tasks');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadDir));

// File upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Upload endpoint
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/kanban', kanbanRoutes);
app.use('/api/sponsors', sponsorRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '../client/dist');
  console.log('📂 dist path:', distPath);
  console.log('🔍 dist exists:', fs.existsSync(distPath));
  console.log('📑 dist contents:', fs.existsSync(distPath) ? fs.readdirSync(distPath) : 'FOLDER NOT FOUND');
  
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Initialize DB and start
const db = getDb();

// Force update demo user passwords on every startup to resolve production login issues
(async () => {
  try {
    const hash = await bcrypt.hash('password123', 10);
    console.log('✅ omar_creator hash:', hash.substring(0, 20));

    // Check table info for debugging
    const tableInfo = db.prepare('PRAGMA table_info(users)').all();
    console.log('📑 users table info:', tableInfo);

    // Use INSERT OR REPLACE to ensure they exist and have correct data
    const upsertStmt = db.prepare(`
      INSERT OR REPLACE INTO users (id, username, password, role, full_name, email) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    upsertStmt.run('admin-001', 'admin', hash, 'super_admin', 'Abdalla Bashir', 'admin@agencyos.com');
    upsertStmt.run('sarah-001', 'sarah_pm', hash, 'project_manager', 'Sarah Al-Rashid', 'sarah@agencyos.com');
    upsertStmt.run('omar-001', 'omar_creator', hash, 'content_creator', 'Omar Hassan', 'omar@agencyos.com');
    
    console.log('🔒 Demo users ensured (INSERT OR REPLACE)');
  } catch (err) {
    console.error('❌ Failed to ensure demo users:', err);
  }
})();

startCronJobs();

app.listen(PORT, () => {
  console.log(`\n🚀 AgencyOS Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api\n`);
});

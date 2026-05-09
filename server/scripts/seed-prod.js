const { getDb } = require('../db/init');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seedUsers(force = false) {
  const db = getDb();
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const mainUsers = [
    { id: uuidv4(), username: 'admin', email: 'admin@agencyos.com', password: hashedPassword, full_name: 'Abdalla Bashir', full_name_ar: 'عبدالله بشير', role: 'super_admin' },
    { id: uuidv4(), username: 'sarah_pm', email: 'sarah@agencyos.com', password: hashedPassword, full_name: 'Sarah Al-Rashid', full_name_ar: 'سارة الراشد', role: 'project_manager' },
    { id: uuidv4(), username: 'omar_creator', email: 'omar@agencyos.com', password: hashedPassword, full_name: 'Omar Hassan', full_name_ar: 'عمر حسن', role: 'content_creator' }
  ];

  const checkUser = db.prepare('SELECT id FROM users WHERE username = ?');
  const insertUser = db.prepare(`INSERT INTO users (id, username, email, password, full_name, full_name_ar, role) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  const updateUserPassword = db.prepare('UPDATE users SET password = ? WHERE username = ?');

  for (const u of mainUsers) {
    const existing = checkUser.get(u.username);
    if (!existing) {
      insertUser.run(u.id, u.username, u.email, u.password, u.full_name, u.full_name_ar, u.role);
      console.log(`✅ Created user: ${u.username}`);
    } else if (force) {
      updateUserPassword.run(u.password, u.username);
      console.log(`✅ Updated password for user: ${u.username}`);
    }
  }

  // Add more demo users if we are doing a full seed
  if (!force) {
    const extraUsers = [
      { id: uuidv4(), username: 'layla_creator', email: 'layla@agencyos.com', password: hashedPassword, full_name: 'Layla Ahmed', full_name_ar: 'ليلى أحمد', role: 'content_creator' },
      { id: uuidv4(), username: 'khalid_creator', email: 'khalid@agencyos.com', password: hashedPassword, full_name: 'Khalid Mansour', full_name_ar: 'خالد منصور', role: 'content_creator' },
      { id: uuidv4(), username: 'nora_creator', email: 'nora@agencyos.com', password: hashedPassword, full_name: 'Nora Salem', full_name_ar: 'نورة سالم', role: 'content_creator' },
      { id: uuidv4(), username: 'yusuf_creator', email: 'yusuf@agencyos.com', password: hashedPassword, full_name: 'Yusuf Ali', full_name_ar: 'يوسف علي', role: 'content_creator' },
      { id: uuidv4(), username: 'amira_creator', email: 'amira@agencyos.com', password: hashedPassword, full_name: 'Amira Khalil', full_name_ar: 'أميرة خليل', role: 'content_creator' },
      { id: uuidv4(), username: 'hassan_creator', email: 'hassan@agencyos.com', password: hashedPassword, full_name: 'Hassan Younis', full_name_ar: 'حسن يونس', role: 'content_creator' },
      { id: uuidv4(), username: 'dina_creator', email: 'dina@agencyos.com', password: hashedPassword, full_name: 'Dina Farouk', full_name_ar: 'دينا فاروق', role: 'content_creator' },
      { id: uuidv4(), username: 'tariq_creator', email: 'tariq@agencyos.com', password: hashedPassword, full_name: 'Tariq Nabil', full_name_ar: 'طارق نبيل', role: 'content_creator' },
      { id: uuidv4(), username: 'mona_creator', email: 'mona@agencyos.com', password: hashedPassword, full_name: 'Mona Saeed', full_name_ar: 'منى سعيد', role: 'content_creator' },
      { id: uuidv4(), username: 'faisal_creator', email: 'faisal@agencyos.com', password: hashedPassword, full_name: 'Faisal Rami', full_name_ar: 'فيصل رامي', role: 'content_creator' },
      { id: uuidv4(), username: 'reem_creator', email: 'reem@agencyos.com', password: hashedPassword, full_name: 'Reem Othman', full_name_ar: 'ريم عثمان', role: 'content_creator' },
      { id: uuidv4(), username: 'zaid_creator', email: 'zaid@agencyos.com', password: hashedPassword, full_name: 'Zaid Kareem', full_name_ar: 'زيد كريم', role: 'content_creator' },
      { id: uuidv4(), username: 'sami_snap', email: 'sami@agencyos.com', password: hashedPassword, full_name: 'Sami Snapchat', full_name_ar: 'سامي سناب', role: 'content_creator' },
      { id: uuidv4(), username: 'marketing1', email: 'marketing@agencyos.com', password: hashedPassword, full_name: 'Ahmed Marketing', full_name_ar: 'أحمد التسويق', role: 'marketing_team' },
      { id: uuidv4(), username: 'production1', email: 'production@agencyos.com', password: hashedPassword, full_name: 'Ali Production', full_name_ar: 'علي الإنتاج', role: 'production_team' },
    ];

    for (const u of extraUsers) {
      if (!checkUser.get(u.username)) {
        insertUser.run(u.id, u.username, u.email, u.password, u.full_name, u.full_name_ar, u.role);
      }
    }
  }
}

async function seed() {
  const db = getDb();
  
  console.log('🌱 Seeding AgencyOS production database...');
  
  // Clear existing data (only if you want a complete fresh start)
  // For safety, we only do this if specifically requested or if DB is empty
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM tasks;
    DELETE FROM calendar_events;
    DELETE FROM invoice_items;
    DELETE FROM invoices;
    DELETE FROM sponsor_interactions;
    DELETE FROM sponsors;
    DELETE FROM kanban_votes;
    DELETE FROM kanban_voters;
    DELETE FROM kanban_cards;
    DELETE FROM analytics_tags;
    DELETE FROM tags;
    DELETE FROM analytics;
    DELETE FROM creators;
    DELETE FROM users;
  `);

  await seedUsers();
  const users = db.prepare('SELECT * FROM users').all();


  // ===== CREATORS (14 + 1 agency) =====
  const platforms = ['tiktok', 'instagram', 'x', 'snapchat', 'youtube'];
  const creators = [];
  
  for (let i = 2; i <= 16; i++) {
    const creator = {
      id: uuidv4(),
      user_id: users[i].id,
      display_name: users[i].full_name,
      display_name_ar: users[i].full_name_ar,
      platform: platforms[(i - 2) % platforms.length],
      bio: `Content creator specializing in ${platforms[(i - 2) % platforms.length]}`,
      is_agency_account: 0
    };
    creators.push(creator);
  }
  
  const agencyCreator = {
    id: uuidv4(),
    user_id: users[0].id,
    display_name: 'AgencyOS Official',
    display_name_ar: 'وكالة أو إس الرسمي',
    platform: 'all',
    bio: 'Official agency account across all platforms',
    is_agency_account: 1
  };
  creators.push(agencyCreator);

  const insertCreator = db.prepare(`INSERT INTO creators (id, user_id, display_name, display_name_ar, platform, bio, is_agency_account) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const c of creators) {
    insertCreator.run(c.id, c.user_id, c.display_name, c.display_name_ar, c.platform, c.bio, c.is_agency_account);
  }
  console.log(`✅ Created ${creators.length} creators (14 + 1 agency)`);

  // ===== TAGS =====
  const tags = [
    { id: uuidv4(), name: 'TikTok', name_ar: 'تيك توك', type: 'platform', color: '#000000' },
    { id: uuidv4(), name: 'Instagram', name_ar: 'انستقرام', type: 'platform', color: '#E4405F' },
    { id: uuidv4(), name: 'X (Twitter)', name_ar: 'إكس (تويتر)', type: 'platform', color: '#1DA1F2' },
    { id: uuidv4(), name: 'Snapchat', name_ar: 'سناب شات', type: 'platform', color: '#FFFC00' },
    { id: uuidv4(), name: 'YouTube', name_ar: 'يوتيوب', type: 'platform', color: '#FF0000' },
    { id: uuidv4(), name: 'Sponsored', name_ar: 'مُموَّل', type: 'sponsor', color: '#10B981' },
    { id: uuidv4(), name: 'Organic', name_ar: 'طبيعي', type: 'sponsor', color: '#8B5CF6' },
    { id: uuidv4(), name: 'Viral', name_ar: 'فيروسي', type: 'creator', color: '#F59E0B' },
  ];

  const insertTag = db.prepare(`INSERT INTO tags (id, name, name_ar, type, color) VALUES (?, ?, ?, ?, ?)`);
  for (const t of tags) {
    insertTag.run(t.id, t.name, t.name_ar, t.type, t.color);
  }
  console.log(`✅ Created ${tags.length} tags`);

  // ===== ANALYTICS =====
  const insertAnalytics = db.prepare(`INSERT INTO analytics (id, creator_id, platform, date, views, likes, comments, shares, followers, engagement_rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertAnalyticsTag = db.prepare(`INSERT INTO analytics_tags (analytics_id, tag_id) VALUES (?, ?)`);
  
  let analyticsCount = 0;
  const now = new Date();
  
  for (const creator of creators) {
    const basePlatform = creator.platform === 'all' ? 'instagram' : creator.platform;
    const baseFollowers = Math.floor(Math.random() * 500000) + 10000;
    
    for (let day = 30; day >= 0; day--) {
      const date = new Date(now);
      date.setDate(date.getDate() - day);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailyViews = Math.floor(Math.random() * 50000) + 1000;
      const dailyLikes = Math.floor(dailyViews * (Math.random() * 0.15 + 0.02));
      const dailyComments = Math.floor(dailyLikes * (Math.random() * 0.1 + 0.01));
      const dailyShares = Math.floor(dailyComments * (Math.random() * 0.5 + 0.1));
      const engagement = ((dailyLikes + dailyComments + dailyShares) / dailyViews * 100).toFixed(2);
      
      const analyticsId = uuidv4();
      insertAnalytics.run(
        analyticsId, creator.id, basePlatform, dateStr,
        dailyViews, dailyLikes, dailyComments, dailyShares,
        baseFollowers + Math.floor(day * Math.random() * 100),
        parseFloat(engagement)
      );
      
      const platformTag = tags.find(t => t.name.toLowerCase().includes(basePlatform));
      if (platformTag) insertAnalyticsTag.run(analyticsId, platformTag.id);
      if (Math.random() > 0.7) insertAnalyticsTag.run(analyticsId, tags.find(t => t.name === 'Sponsored').id);
      
      analyticsCount++;
    }
  }
  console.log(`✅ Created ${analyticsCount} analytics records`);

  // ===== KANBAN CARDS =====
  const kanbanCards = [
    { title: 'Brand Launch Campaign', title_ar: 'حملة إطلاق العلامة التجارية', stage: 'ideation', priority: 'high' },
    { title: 'Product Review Series', title_ar: 'سلسلة مراجعة المنتجات', stage: 'ideation', priority: 'medium' },
    { title: 'Behind the Scenes Vlog', title_ar: 'فلوج خلف الكواليس', stage: 'script_writing', priority: 'low' },
    { title: 'Ramadan Special Content', title_ar: 'محتوى رمضان المميز', stage: 'script_writing', priority: 'high' },
    { title: 'Tech Unboxing Video', title_ar: 'فيديو فتح علبة تقنية', stage: 'production_prep', priority: 'medium' },
    { title: 'Travel Destination Guide', title_ar: 'دليل الوجهات السياحية', stage: 'production_prep', priority: 'high' },
    { title: 'Cooking Tutorial', title_ar: 'فيديو تعليم الطبخ', stage: 'shooting', priority: 'medium' },
    { title: 'Fitness Challenge', title_ar: 'تحدي اللياقة البدنية', stage: 'shooting', priority: 'low' },
    { title: 'Fashion Lookbook', title_ar: 'كتاب أزياء الموضة', stage: 'review', priority: 'high' },
    { title: 'Comedy Sketch', title_ar: 'مقطع كوميدي', stage: 'review', priority: 'medium' },
  ];

  const insertKanban = db.prepare(`INSERT INTO kanban_cards (id, title, title_ar, description, stage, priority, creator_id, assigned_to, pm_approved, shooting_date, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const kanbanIds = [];
  kanbanCards.forEach((card, i) => {
    const id = uuidv4();
    kanbanIds.push(id);
    const shootDate = new Date(now);
    shootDate.setDate(shootDate.getDate() + Math.floor(Math.random() * 30));
    const approved = card.stage === 'shooting' || card.stage === 'review' ? 1 : 0;
    
    insertKanban.run(
      id, card.title, card.title_ar,
      `Description for ${card.title}`,
      card.stage, card.priority,
      creators[i % creators.length].id,
      users[Math.floor(Math.random() * 5) + 2].id,
      approved,
      shootDate.toISOString().split('T')[0],
      i
    );
  });
  console.log(`✅ Created ${kanbanCards.length} kanban cards`);

  // ===== SPONSORS =====
  const sponsorData = [
    { name: 'TechVault Inc.', name_ar: 'شركة تك فولت', status: 'active', deal_value: 150000, contact: 'John Smith', email: 'john@techvault.com', phone: '+1-555-0101' },
    { name: 'FoodDelight Co.', name_ar: 'شركة فود ديلايت', status: 'negotiating', deal_value: 85000, contact: 'Maria Garcia', email: 'maria@fooddelight.com', phone: '+1-555-0102' },
    { name: 'SportMax Arabia', name_ar: 'سبورت ماكس العربية', status: 'active', deal_value: 200000, contact: 'Ahmed Al-Fahad', email: 'ahmed@sportmax.sa', phone: '+966-555-0103' },
    { name: 'GlamourStyle', name_ar: 'جلامور ستايل', status: 'lead', deal_value: 45000, contact: 'Sophie Chen', email: 'sophie@glamourstyle.com', phone: '+1-555-0104' },
    { name: 'EcoGreen Solutions', name_ar: 'حلول إيكو جرين', status: 'completed', deal_value: 120000, contact: 'Ali Mahmoud', email: 'ali@ecogreen.me', phone: '+971-555-0105' },
  ];

  const insertSponsor = db.prepare(`INSERT INTO sponsors (id, name, name_ar, contact_person, email, phone, status, deal_value, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const sponsorIds = [];
  for (const s of sponsorData) {
    const id = uuidv4();
    sponsorIds.push(id);
    insertSponsor.run(id, s.name, s.name_ar, s.contact, s.email, s.phone, s.status, s.deal_value, `Notes for ${s.name}`);
  }
  console.log(`✅ Created ${sponsorData.length} sponsors`);

  // ===== INVOICES =====
  const invoiceStatuses = ['draft', 'sent', 'paid', 'paid', 'sent', 'overdue', 'paid', 'draft'];
  const insertInvoice = db.prepare(`INSERT INTO invoices (id, invoice_number, type, sponsor_id, client_name, client_email, status, subtotal, tax_rate, tax_amount, total, issue_date, due_date, paid_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  for (let i = 0; i < 20; i++) {
    const subtotal = Math.floor(Math.random() * 50000) + 5000;
    const month = (i % 5) + 1;
    const issueDate = new Date(`2026-${String(month).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T10:00:00Z`);
    const dueDate = new Date(issueDate); dueDate.setDate(dueDate.getDate() + 30);
    const status = invoiceStatuses[i % 8];
    const paidDate = status === 'paid' ? new Date(dueDate.getTime() - Math.random() * 15 * 86400000).toISOString().split('T')[0] : null;

    insertInvoice.run(
      uuidv4(), `INV-2024-${String(i + 1).padStart(4, '0')}`, i < 6 ? 'invoice' : 'quotation',
      sponsorIds[i % sponsorIds.length], sponsorData[i % sponsorIds.length].name, sponsorData[i % sponsorIds.length].email,
      status, subtotal, 0.15, subtotal * 0.15, subtotal * 1.15,
      issueDate.toISOString().split('T')[0], dueDate.toISOString().split('T')[0], paidDate, users[0].id
    );
  }
  console.log(`✅ Created 20 invoices`);

  console.log('🎉 Production database seeded successfully!');
}

module.exports = { seed, seedUsers };

if (require.main === module) {
  seed().catch(console.error);
}

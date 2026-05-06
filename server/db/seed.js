const { getDb } = require('./init');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function seed() {
  const db = getDb();
  
  console.log('🌱 Seeding AgencyOS database...');
  
  // Clear existing data
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

  const hashedPassword = bcrypt.hashSync('password123', 10);

  // ===== USERS =====
  const users = [
    { id: uuidv4(), username: 'admin', email: 'admin@agencyos.com', password: hashedPassword, full_name: 'Abdalla Bashir', full_name_ar: 'عبدالله بشير', role: 'super_admin' },
    { id: uuidv4(), username: 'sarah_pm', email: 'sarah@agencyos.com', password: hashedPassword, full_name: 'Sarah Al-Rashid', full_name_ar: 'سارة الراشد', role: 'project_manager' },
    { id: uuidv4(), username: 'omar_creator', email: 'omar@agencyos.com', password: hashedPassword, full_name: 'Omar Hassan', full_name_ar: 'عمر حسن', role: 'content_creator' },
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

  const insertUser = db.prepare(`INSERT INTO users (id, username, email, password, full_name, full_name_ar, role) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  for (const u of users) {
    insertUser.run(u.id, u.username, u.email, u.password, u.full_name, u.full_name_ar, u.role);
  }
  console.log(`✅ Created ${users.length} users`);

  // ===== CREATORS (14 + 1 agency) =====
  const platforms = ['tiktok', 'instagram', 'x', 'snapchat', 'youtube'];
  const creators = [];
  
  // 15 creator accounts
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
  
  // 1 agency account
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

  // ===== ANALYTICS (1 month of mock data) =====
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
      
      // Assign platform tag
      const platformTag = tags.find(t => t.name.toLowerCase().includes(basePlatform));
      if (platformTag) {
        insertAnalyticsTag.run(analyticsId, platformTag.id);
      }
      
      // Randomly assign sponsor tag
      if (Math.random() > 0.7) {
        insertAnalyticsTag.run(analyticsId, tags.find(t => t.name === 'Sponsored').id);
      }
      
      analyticsCount++;
    }
  }
  console.log(`✅ Created ${analyticsCount} analytics records (1 month)`);

  // ===== KANBAN CARDS (10 across all stages) =====
  const stages = ['ideation', 'script_writing', 'production_prep', 'shooting', 'review'];
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
    const creatorIdx = i % creators.length;
    const shootDate = new Date(now);
    shootDate.setDate(shootDate.getDate() + Math.floor(Math.random() * 30));
    const approved = card.stage === 'shooting' || card.stage === 'review' ? 1 : 0;
    
    insertKanban.run(
      id, card.title, card.title_ar,
      `Description for ${card.title}`,
      card.stage, card.priority,
      creators[creatorIdx].id,
      users[Math.floor(Math.random() * 5) + 2].id,
      approved,
      shootDate.toISOString().split('T')[0],
      i
    );
  });
  console.log(`✅ Created ${kanbanCards.length} kanban cards`);

  // ===== SPONSORS (5) =====
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

  // ===== SPONSOR INTERACTIONS =====
  const interactionTypes = ['meeting', 'email', 'call'];
  const insertInteraction = db.prepare(`INSERT INTO sponsor_interactions (id, sponsor_id, type, subject, notes, date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)`);
  
  let interactionCount = 0;
  for (const sponsorId of sponsorIds) {
    for (let i = 0; i < 3; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      insertInteraction.run(
        uuidv4(), sponsorId,
        interactionTypes[i % 3],
        `${interactionTypes[i % 3]} about campaign progress`,
        `Discussion notes for interaction ${i + 1}`,
        date.toISOString(),
        users[1].id
      );
      interactionCount++;
    }
  }
  console.log(`✅ Created ${interactionCount} sponsor interactions`);

  // ===== INVOICES (8) =====
  const invoiceStatuses = ['draft', 'sent', 'paid', 'paid', 'sent', 'overdue', 'paid', 'draft'];
  const insertInvoice = db.prepare(`INSERT INTO invoices (id, invoice_number, type, sponsor_id, client_name, client_email, status, subtotal, tax_rate, tax_amount, total, issue_date, due_date, paid_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const insertInvoiceItem = db.prepare(`INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total, position) VALUES (?, ?, ?, ?, ?, ?, ?)`);

  for (let i = 0; i < 20; i++) {
    const invoiceId = uuidv4();
    const sponsorIdx = i % sponsorIds.length;
    const subtotal = Math.floor(Math.random() * 50000) + 5000;
    const taxRate = 0.15;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;
    
    // Distribute invoices from Jan to May 2026
    const month = (i % 5) + 1; // 1 to 5
    const issueDate = new Date(`2026-${String(month).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}T10:00:00Z`);
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);
    const paidDate = invoiceStatuses[i % 8] === 'paid' ? new Date(dueDate.getTime() - Math.random() * 15 * 86400000).toISOString().split('T')[0] : null;

    insertInvoice.run(
      invoiceId,
      `INV-2024-${String(i + 1).padStart(4, '0')}`,
      i < 6 ? 'invoice' : 'quotation',
      sponsorIds[sponsorIdx],
      sponsorData[sponsorIdx].name,
      sponsorData[sponsorIdx].email,
      invoiceStatuses[i % 8],
      subtotal, taxRate, taxAmount, total,
      issueDate.toISOString().split('T')[0],
      dueDate.toISOString().split('T')[0],
      paidDate,
      users[0].id
    );

    // Add 2-3 items per invoice
    const itemCount = Math.floor(Math.random() * 2) + 2;
    const itemDescriptions = ['Social Media Campaign', 'Video Production', 'Content Strategy', 'Brand Photography', 'Influencer Management'];
    for (let j = 0; j < itemCount; j++) {
      const qty = Math.floor(Math.random() * 5) + 1;
      const price = Math.floor(Math.random() * 10000) + 1000;
      insertInvoiceItem.run(
        uuidv4(), invoiceId,
        itemDescriptions[j % itemDescriptions.length],
        qty, price, qty * price, j
      );
    }
  }
  console.log(`✅ Created 20 invoices with items`);

  // ===== CALENDAR EVENTS =====
  const insertEvent = db.prepare(`INSERT INTO calendar_events (id, title, title_ar, description, type, date, start_time, end_time, color, kanban_card_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  const eventTypes = [
    { type: 'shoot', color: '#3B82F6', title: 'Video Shoot', title_ar: 'تصوير فيديو' },
    { type: 'meeting', color: '#EAB308', title: 'Sponsor Meeting', title_ar: 'اجتماع مع راعي' },
    { type: 'deadline', color: '#EF4444', title: 'Content Deadline', title_ar: 'موعد تسليم المحتوى' },
  ];

  let eventCount = 0;
  for (let i = 0; i < 15; i++) {
    const eventType = eventTypes[i % 3];
    const date = new Date(now);
    date.setDate(date.getDate() + Math.floor(Math.random() * 30) - 5);
    
    insertEvent.run(
      uuidv4(),
      `${eventType.title} ${i + 1}`,
      `${eventType.title_ar} ${i + 1}`,
      `Scheduled ${eventType.type} event`,
      eventType.type,
      date.toISOString().split('T')[0],
      '09:00', '17:00',
      eventType.color,
      i < kanbanIds.length ? kanbanIds[i] : null,
      users[1].id
    );
    eventCount++;
  }
  console.log(`✅ Created ${eventCount} calendar events`);

  // ===== TASKS =====
  const taskRoles = ['scriptwriter', 'camera_operator', 'set_manager', 'editor', 'sound_engineer'];
  const insertTask = db.prepare(`INSERT INTO tasks (id, title, title_ar, description, kanban_card_id, assigned_to, assigned_role, status, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  
  let taskCount = 0;
  const taskStatuses = ['pending', 'in_progress', 'completed'];
  
  for (let i = 0; i < kanbanIds.length; i++) {
    for (let j = 0; j < 2; j++) {
      const role = taskRoles[(i + j) % taskRoles.length];
      const date = new Date(now);
      date.setDate(date.getDate() + Math.floor(Math.random() * 14));
      
      insertTask.run(
        uuidv4(),
        `${role.replace('_', ' ')} — ${kanbanCards[i].title}`,
        `مهمة ${role} لـ ${kanbanCards[i].title_ar}`,
        `Task description for ${role}`,
        kanbanIds[i],
        users[Math.floor(Math.random() * 5) + 2].id,
        role,
        taskStatuses[Math.floor(Math.random() * 3)],
        date.toISOString().split('T')[0],
        users[1].id
      );
      taskCount++;
    }
  }
  console.log(`✅ Created ${taskCount} tasks`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('   Super Admin:     admin / password123');
  console.log('   Project Manager: sarah_pm / password123');
  console.log('   Content Creator: omar_creator / password123');
  console.log('   Marketing:       marketing1 / password123');
  console.log('   Production:      production1 / password123');
}

seed().catch(console.error);

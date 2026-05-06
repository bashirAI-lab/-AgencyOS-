const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_PATH = process.env.DB_PATH || './db/agencyos.db';

let db;

function getDb() {
  if (!db) {
    db = new Database(path.resolve(__dirname, '..', DB_PATH));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    -- Users & Auth
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      full_name TEXT NOT NULL,
      full_name_ar TEXT,
      role TEXT NOT NULL DEFAULT 'content_creator',
      avatar TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Creators (linked to users)
    CREATE TABLE IF NOT EXISTS creators (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      display_name TEXT NOT NULL,
      display_name_ar TEXT,
      platform TEXT,
      bio TEXT,
      is_agency_account INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Analytics Data
    CREATE TABLE IF NOT EXISTS analytics (
      id TEXT PRIMARY KEY,
      creator_id TEXT REFERENCES creators(id),
      platform TEXT NOT NULL,
      date TEXT NOT NULL,
      views INTEGER DEFAULT 0,
      likes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      shares INTEGER DEFAULT 0,
      followers INTEGER DEFAULT 0,
      engagement_rate REAL DEFAULT 0,
      is_manual INTEGER DEFAULT 0,
      screenshot TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Tags for analytics filtering
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      name_ar TEXT,
      type TEXT NOT NULL,
      color TEXT DEFAULT '#6366f1',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS analytics_tags (
      analytics_id TEXT REFERENCES analytics(id),
      tag_id TEXT REFERENCES tags(id),
      PRIMARY KEY (analytics_id, tag_id)
    );

    -- Kanban Board
    CREATE TABLE IF NOT EXISTS kanban_cards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_ar TEXT,
      description TEXT,
      description_ar TEXT,
      thumbnail TEXT,
      stage TEXT NOT NULL DEFAULT 'ideation',
      priority TEXT DEFAULT 'medium',
      creator_id TEXT REFERENCES creators(id),
      assigned_to TEXT REFERENCES users(id),
      pm_approved INTEGER DEFAULT 0,
      shooting_date TEXT,
      position INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Kanban Votes
    CREATE TABLE IF NOT EXISTS kanban_votes (
      id TEXT PRIMARY KEY,
      card_id TEXT REFERENCES kanban_cards(id),
      user_id TEXT REFERENCES users(id),
      vote INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(card_id, user_id)
    );

    -- Kanban Voters (PM assigns who can vote)
    CREATE TABLE IF NOT EXISTS kanban_voters (
      card_id TEXT REFERENCES kanban_cards(id),
      user_id TEXT REFERENCES users(id),
      PRIMARY KEY (card_id, user_id)
    );

    -- Sponsors CRM
    CREATE TABLE IF NOT EXISTS sponsors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      name_ar TEXT,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      website TEXT,
      status TEXT DEFAULT 'lead',
      notes TEXT,
      deal_value REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Sponsor Interactions
    CREATE TABLE IF NOT EXISTS sponsor_interactions (
      id TEXT PRIMARY KEY,
      sponsor_id TEXT REFERENCES sponsors(id),
      type TEXT NOT NULL,
      subject TEXT,
      notes TEXT,
      date TEXT DEFAULT (datetime('now')),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Finance - Invoices
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      type TEXT DEFAULT 'invoice',
      sponsor_id TEXT REFERENCES sponsors(id),
      client_name TEXT,
      client_email TEXT,
      status TEXT DEFAULT 'draft',
      subtotal REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0.15,
      tax_amount REAL DEFAULT 0,
      total REAL DEFAULT 0,
      issue_date TEXT DEFAULT (date('now')),
      due_date TEXT,
      paid_date TEXT,
      notes TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Invoice Items
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT REFERENCES invoices(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit_price REAL DEFAULT 0,
      total REAL DEFAULT 0,
      position INTEGER DEFAULT 0
    );

    -- Calendar Events
    CREATE TABLE IF NOT EXISTS calendar_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_ar TEXT,
      description TEXT,
      type TEXT DEFAULT 'general',
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      color TEXT DEFAULT '#6366f1',
      kanban_card_id TEXT REFERENCES kanban_cards(id),
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    -- Tasks
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      title_ar TEXT,
      description TEXT,
      kanban_card_id TEXT REFERENCES kanban_cards(id),
      assigned_to TEXT REFERENCES users(id),
      assigned_role TEXT,
      status TEXT DEFAULT 'pending',
      due_date TEXT,
      created_by TEXT REFERENCES users(id),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT REFERENCES users(id),
      title TEXT NOT NULL,
      message TEXT,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

module.exports = { getDb };

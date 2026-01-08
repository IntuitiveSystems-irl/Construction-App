import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize sqlite3 with verbose mode
const { verbose } = sqlite3;
const sqlite = verbose();

// Database path
const DB_PATH = process.env.DB_FILENAME || path.join(__dirname, '../../rooster.db');

// Create database connection
export const db = new sqlite.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
    process.exit(1);
  }
  console.log('Connected to the SQLite database');
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Database initialization functions
export const initializeTables = async () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          company_name TEXT,
          contact_name TEXT,
          phone TEXT,
          phone_number TEXT,
          sms_notifications BOOLEAN DEFAULT 0,
          carrier TEXT,
          is_verified BOOLEAN DEFAULT 0,
          verification_token TEXT,
          user_type TEXT DEFAULT 'client',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) console.error('Users table error:', err);
        else console.log('Users table is ready');
      });

      // Documents table
      db.run(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          filename TEXT NOT NULL,
          original_name TEXT NOT NULL,
          description TEXT,
          document_type TEXT,
          mime_type TEXT,
          size INTEGER,
          expires_at TEXT,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          job_site_id INTEGER,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Documents table error:', err);
        else console.log('Documents table is ready');
      });

      // Contracts table
      db.run(`
        CREATE TABLE IF NOT EXISTS contracts (
          id TEXT PRIMARY KEY,
          user_id INTEGER NOT NULL,
          admin_id INTEGER,
          project_name TEXT NOT NULL,
          project_description TEXT,
          contractor_name TEXT DEFAULT 'Veritas Building Group',
          contractor_email TEXT DEFAULT 'niko@veribuilds.com',
          start_date TEXT,
          end_date TEXT,
          total_amount REAL,
          payment_terms TEXT,
          scope TEXT,
          contract_content TEXT,
          contract_type TEXT DEFAULT 'general',
          file_path TEXT,
          original_filename TEXT,
          mime_type TEXT,
          file_size INTEGER,
          status TEXT DEFAULT 'pending',
          signature_data TEXT,
          signature_status TEXT DEFAULT 'not_requested',
          signature_requested_at DATETIME,
          signed_at DATETIME,
          user_comments TEXT,
          admin_notes TEXT,
          attached_documents TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Contracts table error:', err);
        else console.log('Contracts table created or already exists');
      });

      // Job sites table
      db.run(`
        CREATE TABLE IF NOT EXISTS job_sites (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          address TEXT NOT NULL,
          city TEXT NOT NULL,
          state TEXT NOT NULL,
          zip_code TEXT NOT NULL,
          client_id INTEGER NOT NULL,
          project_manager_id INTEGER,
          start_date TEXT,
          end_date TEXT,
          budget REAL,
          status TEXT DEFAULT 'planning',
          safety_requirements TEXT,
          client_notes TEXT,
          contractor_notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Job sites table error:', err);
        else console.log('Job sites table created or already exists');
      });

      // Notifications table
      db.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          link TEXT,
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) console.error('Notifications table error:', err);
        else console.log('Notifications table created or already exists');
      });

      resolve();
    });
  });
};

export default db;

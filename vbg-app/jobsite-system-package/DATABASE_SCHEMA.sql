-- Job Site System Database Schema
-- Extracted from Rooster Construction

-- Job Sites table
CREATE TABLE IF NOT EXISTS job_sites (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  client_id INTEGER,
  project_manager TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  budget REAL DEFAULT 0,
  status TEXT DEFAULT 'planning', -- planning, active, completed, on_hold
  client_notes TEXT, -- Notes visible to clients
  contractor_notes TEXT, -- Notes visible to contractors/subcontractors
  safety_requirements TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  
  FOREIGN KEY (client_id) REFERENCES users(id)
);

-- Job Assignments table (links users to job sites)
CREATE TABLE IF NOT EXISTS job_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_site_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL, -- client, subcontractor
  role TEXT, -- e.g., "Foreman", "Electrician", "Project Owner"
  assigned_date TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- active, completed, removed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_site_id) REFERENCES job_sites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(job_site_id, user_id)
);

-- Job Messages table (for job site communications)
CREATE TABLE IF NOT EXISTS job_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_site_id TEXT NOT NULL,
  admin_id INTEGER NOT NULL, -- User who sent the message
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'update', -- update, safety, schedule, weather, question
  priority TEXT DEFAULT 'normal', -- normal, high, urgent
  send_sms BOOLEAN DEFAULT 0, -- Whether to send email notification
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_site_id) REFERENCES job_sites(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

-- Job Site Uploads table (optional - for file sharing)
CREATE TABLE IF NOT EXISTS job_site_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_site_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL, -- admin, client, subcontractor
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT,
  file_size INTEGER,
  category TEXT DEFAULT 'other', -- plans, photos, documents, reports, other
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_site_id) REFERENCES job_sites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Job Site Comments table (optional - for threaded discussions)
CREATE TABLE IF NOT EXISTS job_site_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_site_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  comment_type TEXT DEFAULT 'update', -- update, question, issue, resolved
  priority TEXT DEFAULT 'normal',
  reply_to INTEGER, -- For threaded comments
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (job_site_id) REFERENCES job_sites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (reply_to) REFERENCES job_site_comments(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_job_sites_client_id ON job_sites(client_id);
CREATE INDEX IF NOT EXISTS idx_job_sites_status ON job_sites(status);
CREATE INDEX IF NOT EXISTS idx_job_sites_start_date ON job_sites(start_date);
CREATE INDEX IF NOT EXISTS idx_job_assignments_job_site_id ON job_assignments(job_site_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_user_id ON job_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_job_site_id ON job_messages(job_site_id);
CREATE INDEX IF NOT EXISTS idx_job_site_uploads_job_site_id ON job_site_uploads(job_site_id);
CREATE INDEX IF NOT EXISTS idx_job_site_comments_job_site_id ON job_site_comments(job_site_id);

-- Note: This schema integrates with the contracts table for notifications
-- Job site assignments create entries in the contracts table with contract_type = 'job_site'
-- This allows the notification system to work seamlessly

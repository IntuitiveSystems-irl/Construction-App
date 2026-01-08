-- Complete Database Initialization Script
-- Creates all tables for Rooster Multi-Tenant SaaS

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- TENANTS & MULTI-TENANCY TABLES
-- ============================================

CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  owner_email TEXT UNIQUE NOT NULL,
  owner_name TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  plan TEXT DEFAULT 'trial',
  status TEXT DEFAULT 'active',
  trial_ends_at DATETIME DEFAULT (datetime('now', '+14 days')),
  subscription_started_at DATETIME,
  max_users INTEGER DEFAULT 10,
  max_clients INTEGER DEFAULT 50,
  max_job_sites INTEGER DEFAULT 25,
  max_storage_mb INTEGER DEFAULT 5000,
  current_storage_mb INTEGER DEFAULT 0,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#059669',
  secondary_color TEXT DEFAULT '#0891b2',
  company_email TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
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
  role TEXT DEFAULT 'client',
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);

-- ============================================
-- JOB SITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS job_sites (
  id TEXT PRIMARY KEY,
  tenant_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
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
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_job_sites_tenant_id ON job_sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_sites_client_id ON job_sites(client_id);
CREATE INDEX IF NOT EXISTS idx_job_sites_status ON job_sites(status);

-- ============================================
-- CONTRACTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  tenant_id INTEGER,
  user_id INTEGER NOT NULL,
  admin_id INTEGER,
  project_name TEXT NOT NULL,
  project_description TEXT,
  contractor_name TEXT DEFAULT 'Rooster Construction LLC',
  contractor_email TEXT DEFAULT 'niko@roosterconstruction.org',
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
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);

-- ============================================
-- DOCUMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  description TEXT,
  document_type TEXT,
  mime_type TEXT,
  size INTEGER,
  expires_at TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  job_site_id TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (job_site_id) REFERENCES job_sites(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_job_site_id ON documents(job_site_id);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);

-- ============================================
-- JOB ASSIGNMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS job_assignments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  job_site_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  user_type TEXT NOT NULL,
  role TEXT,
  assigned_date TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (job_site_id) REFERENCES job_sites(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(job_site_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_job_assignments_tenant_id ON job_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_job_site_id ON job_assignments(job_site_id);
CREATE INDEX IF NOT EXISTS idx_job_assignments_user_id ON job_assignments(user_id);

-- ============================================
-- JOB MESSAGES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS job_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  job_site_id TEXT NOT NULL,
  admin_id INTEGER NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'update',
  priority TEXT DEFAULT 'normal',
  send_sms BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (job_site_id) REFERENCES job_sites(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_job_messages_tenant_id ON job_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_messages_job_site_id ON job_messages(job_site_id);

-- ============================================
-- CONTRACT TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS contract_templates (
  id TEXT PRIMARY KEY,
  tenant_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  content TEXT NOT NULL,
  sections TEXT,
  is_default BOOLEAN DEFAULT 0,
  is_global BOOLEAN DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_tenant_id ON contract_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);

-- ============================================
-- TENANT SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL UNIQUE,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#059669',
  secondary_color TEXT DEFAULT '#0891b2',
  timezone TEXT DEFAULT 'America/New_York',
  date_format TEXT DEFAULT 'MM/DD/YYYY',
  currency TEXT DEFAULT 'USD',
  tax_rate REAL DEFAULT 0,
  email_notifications BOOLEAN DEFAULT 1,
  sms_notifications BOOLEAN DEFAULT 0,
  custom_domain TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

-- ============================================
-- TENANT USAGE TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value INTEGER NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tenant_usage_tenant_metric ON tenant_usage(tenant_id, metric_type);

-- ============================================
-- TENANT INVITATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_invitations (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  invited_by TEXT,
  token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  accepted_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_tenant_invitations_email ON tenant_invitations(email);
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_token ON tenant_invitations(token);

-- ============================================
-- INSERT DEFAULT TENANT
-- ============================================

INSERT OR IGNORE INTO tenants (id, business_name, subdomain, owner_email, owner_name, plan, status, max_users, max_clients, max_job_sites)
VALUES (1, 'Rooster Construction', 'rooster', 'admin@rooster.app', 'Admin User', 'pro', 'active', 100, 500, 100);

INSERT OR IGNORE INTO tenant_settings (tenant_id, primary_color, secondary_color, timezone, currency)
VALUES (1, '#059669', '#0891b2', 'America/New_York', 'USD');

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Database initialized successfully!' as message;
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

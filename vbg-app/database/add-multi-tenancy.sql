-- Multi-Tenancy Migration Script
-- Adds tenant support to existing Rooster database

-- ============================================
-- 1. CREATE TENANTS TABLE
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
  
  -- Subscription
  plan TEXT DEFAULT 'trial',
  status TEXT DEFAULT 'active',
  trial_ends_at DATETIME DEFAULT (datetime('now', '+14 days')),
  subscription_started_at DATETIME,
  
  -- Limits
  max_users INTEGER DEFAULT 10,
  max_clients INTEGER DEFAULT 50,
  max_job_sites INTEGER DEFAULT 25,
  max_storage_mb INTEGER DEFAULT 5000,
  current_storage_mb INTEGER DEFAULT 0,
  
  -- Branding
  logo_url TEXT,
  primary_color TEXT DEFAULT '#059669',
  secondary_color TEXT DEFAULT '#0891b2',
  company_email TEXT,
  
  -- Billing
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_owner_email ON tenants(owner_email);

-- ============================================
-- 2. ADD TENANT_ID TO EXISTING TABLES
-- ============================================

-- Check if tenant_id column exists before adding
-- SQLite doesn't have IF NOT EXISTS for ALTER TABLE, so we'll handle errors gracefully

-- Users table
ALTER TABLE users ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'client';
ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active';

-- Job Sites table
ALTER TABLE job_sites ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Contracts table  
ALTER TABLE contracts ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Documents table
ALTER TABLE documents ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Notifications table (if exists)
ALTER TABLE notifications ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Job Assignments table (if exists)
ALTER TABLE job_assignments ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Job Messages table (if exists)
ALTER TABLE job_messages ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);

-- Contract Templates table (if exists)
ALTER TABLE contract_templates ADD COLUMN tenant_id INTEGER REFERENCES tenants(id);
ALTER TABLE contract_templates ADD COLUMN is_global BOOLEAN DEFAULT 0;

-- ============================================
-- 3. CREATE INDEXES FOR TENANT QUERIES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_tenant_role ON users(tenant_id, role);
CREATE INDEX IF NOT EXISTS idx_users_tenant_status ON users(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_job_sites_tenant_id ON job_sites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_sites_tenant_status ON job_sites(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_contracts_tenant_id ON contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_tenant_status ON contracts(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON documents(tenant_id);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);

CREATE INDEX IF NOT EXISTS idx_job_assignments_tenant_id ON job_assignments(tenant_id);

CREATE INDEX IF NOT EXISTS idx_job_messages_tenant_id ON job_messages(tenant_id);

CREATE INDEX IF NOT EXISTS idx_contract_templates_tenant_id ON contract_templates(tenant_id);

-- ============================================
-- 4. CREATE TENANT SETTINGS TABLE
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
-- 5. CREATE TENANT USAGE TRACKING TABLE
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
CREATE INDEX IF NOT EXISTS idx_tenant_usage_recorded_at ON tenant_usage(recorded_at);

-- ============================================
-- 6. CREATE TENANT INVITATIONS TABLE
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
CREATE INDEX IF NOT EXISTS idx_tenant_invitations_status ON tenant_invitations(status);

-- ============================================
-- 7. INSERT DEFAULT TENANT FOR DEVELOPMENT
-- ============================================

INSERT OR IGNORE INTO tenants (id, business_name, subdomain, owner_email, owner_name, plan, status, max_users, max_clients, max_job_sites)
VALUES (1, 'Rooster Construction', 'rooster', 'admin@rooster.app', 'Admin User', 'pro', 'active', 100, 500, 100);

-- ============================================
-- 8. MIGRATE EXISTING DATA TO DEFAULT TENANT
-- ============================================

-- Update existing users to belong to default tenant (ID: 1)
UPDATE users SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Update existing job sites
UPDATE job_sites SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Update existing contracts
UPDATE contracts SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Update existing documents
UPDATE documents SET tenant_id = 1 WHERE tenant_id IS NULL;

-- Update existing notifications (if table exists)
UPDATE notifications SET tenant_id = 1 WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='notifications');

-- Update existing job assignments (if table exists)
UPDATE job_assignments SET tenant_id = 1 WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='job_assignments');

-- Update existing job messages (if table exists)
UPDATE job_messages SET tenant_id = 1 WHERE tenant_id IS NULL AND EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='job_messages');

-- ============================================
-- 9. CREATE DEFAULT TENANT SETTINGS
-- ============================================

INSERT OR IGNORE INTO tenant_settings (tenant_id, primary_color, secondary_color, timezone, currency)
VALUES (1, '#059669', '#0891b2', 'America/New_York', 'USD');

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 'Multi-tenancy migration completed successfully!' as message;
SELECT COUNT(*) as tenant_count FROM tenants;
SELECT COUNT(*) as users_with_tenant FROM users WHERE tenant_id IS NOT NULL;

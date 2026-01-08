-- Modular Services System
-- Allows tenants to enable/disable specific features

-- ============================================
-- 1. CREATE TENANT SERVICES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS tenant_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT 0,
  enabled_at DATETIME,
  disabled_at DATETIME,
  settings TEXT, -- JSON string for service-specific settings
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, service_name)
);

CREATE INDEX IF NOT EXISTS idx_tenant_services_tenant ON tenant_services(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_services_enabled ON tenant_services(tenant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_tenant_services_name ON tenant_services(service_name);

-- ============================================
-- 2. CREATE SERVICE DEFINITIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS service_definitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  price_monthly REAL DEFAULT 0,
  price_yearly REAL DEFAULT 0,
  features TEXT, -- JSON array of features
  requires_tables TEXT, -- JSON array of required tables
  is_active BOOLEAN DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_service_definitions_active ON service_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_service_definitions_category ON service_definitions(category);

-- ============================================
-- 3. INSERT SERVICE DEFINITIONS
-- ============================================

INSERT OR IGNORE INTO service_definitions (
  service_name, 
  display_name, 
  description, 
  icon, 
  category, 
  price_monthly, 
  price_yearly,
  features,
  requires_tables,
  sort_order
) VALUES 
(
  'contracts',
  'Contract Management',
  'Generate, sign, and manage construction contracts with digital signatures',
  'FileText',
  'construction',
  10.00,
  100.00,
  '["Contract generation from templates","Digital signature collection","PDF generation","Email notifications","Contract status tracking","Template management"]',
  '["contracts","contract_templates"]',
  1
),
(
  'job_sites',
  'Job Site Management',
  'Manage job sites, assign teams, track progress, and communicate with workers',
  'Building',
  'construction',
  15.00,
  150.00,
  '["Job site creation","Team assignments","Progress tracking","Safety requirements","Site communications","Activity logs"]',
  '["job_sites","job_assignments","job_messages","job_site_comments","job_site_activity"]',
  2
),
(
  'documents',
  'Document Management',
  'Upload, organize, and share documents with expiration tracking',
  'Folder',
  'construction',
  5.00,
  50.00,
  '["Document upload/storage","Expiration tracking","Document sharing","Version control","Categories & tags","Document viewer"]',
  '["documents","job_site_uploads"]',
  3
),
(
  'estimates',
  'Estimates & Invoicing',
  'Create estimates, generate invoices, and track payments',
  'DollarSign',
  'financial',
  10.00,
  100.00,
  '["Estimate creation","Invoice generation","Payment tracking","Receipt management","Financial reports","Tax calculations"]',
  '["estimates","invoices","receipts"]',
  4
),
(
  'client_portal',
  'Client & Subcontractor Portal',
  'Dedicated portals for clients and subcontractors with role-based access',
  'Users',
  'communication',
  5.00,
  50.00,
  '["Client dashboard","Subcontractor management","Role-based permissions","Communication tools","Activity tracking","Notifications"]',
  '["notifications","notification_preferences"]',
  5
);

-- ============================================
-- 4. ENABLE DEFAULT SERVICES FOR EXISTING TENANT
-- ============================================

-- Enable all services for the default tenant (for testing)
INSERT OR IGNORE INTO tenant_services (tenant_id, service_name, enabled, enabled_at)
SELECT 1, service_name, 1, datetime('now')
FROM service_definitions
WHERE is_active = 1;

-- ============================================
-- 5. CREATE SERVICE USAGE TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS service_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  usage_date DATE NOT NULL,
  api_calls INTEGER DEFAULT 0,
  storage_mb REAL DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  UNIQUE(tenant_id, service_name, usage_date)
);

CREATE INDEX IF NOT EXISTS idx_service_usage_tenant ON service_usage(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_usage_date ON service_usage(usage_date);

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 'Services system created successfully!' as message;
SELECT COUNT(*) as service_count FROM service_definitions;
SELECT COUNT(*) as enabled_services FROM tenant_services WHERE enabled = 1;

-- Create contracts table if it doesn't exist
CREATE TABLE IF NOT EXISTS contracts (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  admin_id INTEGER,
  
  -- Project details
  project_name TEXT NOT NULL,
  project_description TEXT,
  start_date TEXT,
  end_date TEXT,
  total_amount TEXT,
  payment_terms TEXT,
  scope TEXT,
  
  -- Contract content
  contract_content TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending', -- pending, signed, approved, rejected, cancelled
  
  -- Client signature
  signature_data TEXT,
  signature_status TEXT DEFAULT 'not_requested', -- not_requested, requested, signed
  signed_at DATETIME,
  
  -- Admin/Contractor signature
  admin_signature_data TEXT,
  admin_signature_status TEXT DEFAULT 'not_signed', -- not_signed, signed
  admin_signed_at DATETIME,
  
  -- Guest signing fields
  guest_token TEXT UNIQUE,
  guest_email TEXT,
  guest_name TEXT,
  token_expires_at DATETIME,
  guest_signed_at DATETIME,
  
  -- Additional fields
  user_comments TEXT,
  admin_notes TEXT,
  viewed INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_admin_id ON contracts(admin_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_contracts_guest_token ON contracts(guest_token);
CREATE INDEX IF NOT EXISTS idx_contracts_guest_email ON contracts(guest_email);

-- Contract templates table
CREATE TABLE IF NOT EXISTS contract_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- construction, maintenance, consulting, service, etc.
  content TEXT NOT NULL, -- Template with placeholders
  sections TEXT, -- JSON array of section names
  is_default BOOLEAN DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);

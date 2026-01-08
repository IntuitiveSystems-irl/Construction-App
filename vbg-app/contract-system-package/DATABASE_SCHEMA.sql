-- Contract System Database Schema
-- Extracted from Rooster Construction

-- Contracts table
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
  
  -- Additional fields
  user_comments TEXT,
  admin_notes TEXT,
  viewed INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contracts_user_id ON contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_contracts_admin_id ON contracts(admin_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);

-- Insert default template (optional)
INSERT OR IGNORE INTO contract_templates (id, name, description, category, content, is_default)
VALUES (
  'default-construction',
  'Default Construction Contract',
  'Standard construction contract template',
  'construction',
  'CONSTRUCTION CONTRACT

Contract Date: {{DATE}}
Contract ID: {{CONTRACT_ID}}

PARTIES:
Contractor: {{CONTRACTOR_NAME}}
Client: {{CLIENT_NAME}}
Email: {{CLIENT_EMAIL}}
Address: {{CLIENT_ADDRESS}}

PROJECT DETAILS:
Project Name: {{PROJECT_NAME}}
Description: {{PROJECT_DESCRIPTION}}
Start Date: {{START_DATE}}
Completion Date: {{END_DATE}}
Total Contract Amount: {{TOTAL_AMOUNT}}
Payment Terms: {{PAYMENT_TERMS}}

SCOPE OF WORK:
{{SCOPE_OF_WORK}}

TERMS AND CONDITIONS:
1. The Contractor agrees to provide all labor, materials, and services necessary for the completion of the project.
2. Payment shall be made according to the payment terms specified above.
3. Any changes to the scope of work must be agreed upon in writing by both parties.
4. The Contractor shall maintain appropriate insurance coverage throughout the project.
5. This contract shall be governed by the laws of the applicable jurisdiction.

SIGNATURES:

The Owner:
_______________________________________
Date: ___________________

Contractor:
_______________________________________
Date: ___________________

This contract will be executed through digital signature upon client approval.',
  1
);

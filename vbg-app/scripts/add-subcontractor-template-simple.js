import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { randomUUID } from 'crypto';
import Database from 'better-sqlite3-multiple-ciphers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Database configuration
const DB_PATH = join(projectRoot, 'vbg_encrypted.db');
const DB_KEY = '6fbe1452c3372498229386479270a0d4f697ce321c38e33a30579df97c2c6b2f';

// Read template file
const templatePath = join(projectRoot, 'contract-templates', 'subcontractor-services-agreement.txt');
const templateContent = readFileSync(templatePath, 'utf8');

// Connect to database
const db = new Database(DB_PATH);
const keyBuffer = Buffer.from(DB_KEY, 'hex');
db.pragma("cipher='sqlcipher'");
db.pragma('legacy=4');
db.key(keyBuffer);

console.log('✅ Connected to encrypted database');

// Check if template already exists
const existing = db.prepare('SELECT id FROM contract_templates WHERE name = ?').get('Subcontractor Services Agreement');

if (existing) {
  console.log('Template already exists with ID:', existing.id);
  console.log('Updating template...');
  
  const update = db.prepare(`
    UPDATE contract_templates 
    SET template_content = ?,
        description = ?,
        category = ?,
        updated_at = datetime('now')
    WHERE name = ?
  `);
  
  update.run(
    templateContent,
    'Agreement between Veritas Building Group and subcontractors for construction services',
    'subcontractor',
    'Subcontractor Services Agreement'
  );
  
  console.log('✅ Template updated successfully!');
} else {
  console.log('Inserting new template...');
  
  const templateId = randomUUID();
  
  const insert = db.prepare(`
    INSERT INTO contract_templates (
      id, name, category, description, template_content, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, 15, datetime('now'))
  `);
  
  const result = insert.run(
    templateId,
    'Subcontractor Services Agreement',
    'subcontractor',
    'Agreement between Veritas Building Group and subcontractors for construction services',
    templateContent
  );
  
  console.log('✅ Template inserted successfully with ID:', templateId);
}

// Verify
const templates = db.prepare('SELECT id, name, category FROM contract_templates').all();
console.log('\n📋 All templates in database:');
templates.forEach(t => console.log(`  - ${t.name} (${t.category})`));

db.close();
console.log('\n✅ Done!');

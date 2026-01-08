import Database from 'better-sqlite3-multiple-ciphers';

const db = new Database('rooster_production.db');

console.log('\n=== Checking if rooster_production.db is encrypted ===');
try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('✅ Database is NOT encrypted');
  console.log('\nTables:', tables.map(t => t.name).join(', '));
  
  // Check if contract_templates exists
  const hasContractTemplates = tables.find(t => t.name === 'contract_templates');
  if (hasContractTemplates) {
    console.log('\n=== contract_templates schema ===');
    const schema = db.prepare('PRAGMA table_info(contract_templates)').all();
    console.log(JSON.stringify(schema, null, 2));
    
    console.log('\n=== Existing templates ===');
    const templates = db.prepare('SELECT id, name, category FROM contract_templates').all();
    console.log(JSON.stringify(templates, null, 2));
  } else {
    console.log('\n❌ contract_templates table does NOT exist in rooster_production.db');
  }
} catch (err) {
  console.log('❌ Database appears to be encrypted or corrupted:', err.message);
}

db.close();

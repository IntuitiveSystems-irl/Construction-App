import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDbPath = path.join(__dirname, '../rooster.db');
const remoteDbPath = path.join(__dirname, '../remote_rooster.db');

// Check if remote database exists
if (!fs.existsSync(remoteDbPath)) {
  console.error('❌ Remote database not found at:', remoteDbPath);
  console.log('📝 Please download the remote database first:');
  console.log('   scp root@31.97.144.132:/path/to/rooster.db ./remote_rooster.db');
  process.exit(1);
}

// Create backup of local database
const backupPath = `${localDbPath}.backup.${new Date().toISOString().replace(/[:.]/g, '-')}`;
if (fs.existsSync(localDbPath)) {
  fs.copyFileSync(localDbPath, backupPath);
  console.log('✅ Local database backed up to:', backupPath);
}

const db = new sqlite3.Database(localDbPath);

// Define tables to migrate in order (respecting foreign key constraints)
const tables = [
  'users',
  'admin_users',
  'password_reset_tokens',
  'notification_preferences',
  'invitations',
  'admin_requests',
  'contract_templates',
  'contracts',
  'job_sites',
  'job_site_uploads',
  'job_site_comments',
  'job_site_activity',
  'documents',
  'estimates',
  'invoices',
  'receipts',
  'payment_requests',
  'notifications',
  'jobs',
  'job_assignments',
  'job_messages'
];

async function getTableInfo(tableName, dbName = 'main') {
  return new Promise((resolve, reject) => {
    const query = dbName === 'main' 
      ? `PRAGMA table_info(${tableName})`
      : `PRAGMA ${dbName}.table_info(${tableName})`;
    
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function getRowCount(tableName, dbName = 'main') {
  return new Promise((resolve, reject) => {
    const query = dbName === 'main'
      ? `SELECT COUNT(*) as count FROM ${tableName}`
      : `SELECT COUNT(*) as count FROM ${dbName}.${tableName}`;
    
    db.get(query, (err, row) => {
      if (err) reject(err);
      else resolve(row.count);
    });
  });
}

async function tableExists(tableName, dbName = 'main') {
  return new Promise((resolve, reject) => {
    const query = dbName === 'main'
      ? `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
      : `SELECT name FROM ${dbName}.sqlite_master WHERE type='table' AND name=?`;
    
    db.get(query, [tableName], (err, row) => {
      if (err) reject(err);
      else resolve(!!row);
    });
  });
}

async function migrateTable(tableName) {
  try {
    // Check if table exists in both databases
    const localExists = await tableExists(tableName, 'main');
    const remoteExists = await tableExists(tableName, 'remote');

    if (!remoteExists) {
      console.log(`⚠️  Table '${tableName}' does not exist in remote database, skipping...`);
      return { success: true, skipped: true };
    }

    if (!localExists) {
      console.log(`⚠️  Table '${tableName}' does not exist in local database, skipping...`);
      return { success: true, skipped: true };
    }

    // Get row counts
    const remoteCount = await getRowCount(tableName, 'remote');
    const localCountBefore = await getRowCount(tableName, 'main');

    if (remoteCount === 0) {
      console.log(`ℹ️  Table '${tableName}' is empty in remote database, skipping...`);
      return { success: true, skipped: true, remoteCount: 0 };
    }

    // Migrate data
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO ${tableName} SELECT * FROM remote.${tableName}`,
        async (err) => {
          if (err) {
            console.error(`❌ Error migrating ${tableName}:`, err.message);
            resolve({ success: false, error: err.message });
          } else {
            const localCountAfter = await getRowCount(tableName, 'main');
            const migrated = localCountAfter - localCountBefore;
            console.log(
              `✅ Migrated ${tableName}: ${migrated} new records (${remoteCount} in remote, ${localCountAfter} total in local)`
            );
            resolve({ 
              success: true, 
              migrated, 
              remoteCount, 
              localCountBefore, 
              localCountAfter 
            });
          }
        }
      );
    });
  } catch (err) {
    console.error(`❌ Error processing ${tableName}:`, err.message);
    return { success: false, error: err.message };
  }
}

async function migrateDatabase() {
  console.log('🚀 Starting database migration...\n');

  return new Promise((resolve, reject) => {
    db.serialize(async () => {
      try {
        // Attach remote database
        await new Promise((res, rej) => {
          db.run(`ATTACH DATABASE '${remoteDbPath}' AS remote`, (err) => {
            if (err) {
              console.error('❌ Error attaching remote database:', err);
              rej(err);
            } else {
              console.log('✅ Remote database attached\n');
              res();
            }
          });
        });

        // Disable foreign key constraints during migration
        await new Promise((res, rej) => {
          db.run('PRAGMA foreign_keys = OFF', (err) => {
            if (err) rej(err);
            else {
              console.log('🔓 Foreign key constraints disabled\n');
              res();
            }
          });
        });

        // Migrate each table
        const results = [];
        for (const table of tables) {
          const result = await migrateTable(table);
          results.push({ table, ...result });
        }

        // Re-enable foreign key constraints
        await new Promise((res, rej) => {
          db.run('PRAGMA foreign_keys = ON', (err) => {
            if (err) rej(err);
            else {
              console.log('\n🔒 Foreign key constraints re-enabled');
              res();
            }
          });
        });

        // Detach remote database
        await new Promise((res, rej) => {
          db.run('DETACH DATABASE remote', (err) => {
            if (err) {
              console.error('❌ Error detaching remote database:', err);
              rej(err);
            } else {
              console.log('✅ Remote database detached\n');
              res();
            }
          });
        });

        // Run integrity check
        await new Promise((res, rej) => {
          db.get('PRAGMA integrity_check', (err, row) => {
            if (err) {
              rej(err);
            } else {
              console.log('🔍 Database integrity check:', row.integrity_check);
              res();
            }
          });
        });

        // Print summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 MIGRATION SUMMARY');
        console.log('='.repeat(60));

        let totalMigrated = 0;
        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;

        results.forEach(({ table, success, migrated, skipped, error }) => {
          if (skipped) {
            skippedCount++;
          } else if (success) {
            successCount++;
            totalMigrated += migrated || 0;
          } else {
            failedCount++;
            console.log(`❌ ${table}: ${error}`);
          }
        });

        console.log(`\n✅ Successfully migrated: ${successCount} tables`);
        console.log(`⚠️  Skipped: ${skippedCount} tables`);
        console.log(`❌ Failed: ${failedCount} tables`);
        console.log(`📝 Total records migrated: ${totalMigrated}`);
        console.log('\n🎉 Migration completed!\n');

        if (failedCount > 0) {
          console.log('⚠️  Some tables failed to migrate. Please review the errors above.');
        }

        resolve(results);
      } catch (err) {
        console.error('❌ Migration failed:', err);
        reject(err);
      }
    });
  });
}

// Run migration
migrateDatabase()
  .then(() => {
    console.log('✅ All done!');
    db.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    db.close();
    process.exit(1);
  });

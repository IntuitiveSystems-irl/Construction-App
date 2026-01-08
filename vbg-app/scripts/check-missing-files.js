import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../rooster.db');
const db = new sqlite3.Database(dbPath);

console.log('🔍 Checking for missing files referenced in database...\n');

const checks = [
  {
    name: 'Documents',
    query: 'SELECT id, filename, original_name, user_id FROM documents',
    fileField: 'filename'
  },
  {
    name: 'Contracts',
    query: 'SELECT id, file_path, original_filename, user_id FROM contracts WHERE file_path IS NOT NULL',
    fileField: 'file_path'
  },
  {
    name: 'Job Site Uploads',
    query: 'SELECT id, file_path, original_filename, job_site_id FROM job_site_uploads WHERE file_path IS NOT NULL',
    fileField: 'file_path'
  },
  {
    name: 'Estimates',
    query: 'SELECT id, file_path, user_id FROM estimates WHERE file_path IS NOT NULL',
    fileField: 'file_path'
  },
  {
    name: 'Invoices',
    query: 'SELECT id, file_path, user_id FROM invoices WHERE file_path IS NOT NULL',
    fileField: 'file_path'
  },
  {
    name: 'Receipts',
    query: 'SELECT id, file_path, user_id FROM receipts WHERE file_path IS NOT NULL',
    fileField: 'file_path'
  }
];

async function checkTable(check) {
  return new Promise((resolve, reject) => {
    db.all(check.query, (err, rows) => {
      if (err) {
        if (err.message.includes('no such table')) {
          console.log(`⚠️  Table for ${check.name} does not exist, skipping...`);
          resolve({ name: check.name, total: 0, missing: [], skipped: true });
          return;
        }
        reject(err);
        return;
      }

      const missing = [];
      const total = rows.length;

      rows.forEach(row => {
        const filePath = row[check.fileField];
        if (!filePath) return;

        // Try different path resolutions
        const possiblePaths = [
          path.join(__dirname, '..', filePath),
          path.join(__dirname, '../uploads', path.basename(filePath)),
          filePath
        ];

        const exists = possiblePaths.some(p => {
          try {
            return fs.existsSync(p);
          } catch (e) {
            return false;
          }
        });

        if (!exists) {
          missing.push({
            id: row.id,
            path: filePath,
            ...row
          });
        }
      });

      resolve({ name: check.name, total, missing, skipped: false });
    });
  });
}

async function runChecks() {
  const results = [];

  for (const check of checks) {
    try {
      const result = await checkTable(check);
      results.push(result);

      if (result.skipped) {
        continue;
      }

      if (result.missing.length === 0) {
        console.log(`✅ ${result.name}: All ${result.total} files found`);
      } else {
        console.log(`❌ ${result.name}: ${result.missing.length} of ${result.total} files missing`);
        
        // Show first 5 missing files
        const showCount = Math.min(5, result.missing.length);
        result.missing.slice(0, showCount).forEach(item => {
          console.log(`   - ID ${item.id}: ${item.path}`);
        });
        
        if (result.missing.length > 5) {
          console.log(`   ... and ${result.missing.length - 5} more`);
        }
      }
    } catch (err) {
      console.error(`❌ Error checking ${check.name}:`, err.message);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));

  let totalFiles = 0;
  let totalMissing = 0;

  results.forEach(result => {
    if (!result.skipped) {
      totalFiles += result.total;
      totalMissing += result.missing.length;
    }
  });

  console.log(`Total files in database: ${totalFiles}`);
  console.log(`Missing files: ${totalMissing}`);
  
  if (totalMissing === 0) {
    console.log('\n✅ All files are present!');
  } else {
    console.log(`\n⚠️  ${totalMissing} files are missing (${((totalMissing / totalFiles) * 100).toFixed(2)}%)`);
    console.log('\nPossible solutions:');
    console.log('1. Run the file migration script: ./scripts/migrate-files.sh');
    console.log('2. Check if files are in a different location');
    console.log('3. Update file paths in database if needed');
  }

  // Generate detailed report
  if (totalMissing > 0) {
    const reportPath = path.join(__dirname, '../missing-files-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Detailed report saved to: missing-files-report.json`);
  }

  db.close();
}

runChecks().catch(err => {
  console.error('❌ Error:', err);
  db.close();
  process.exit(1);
});

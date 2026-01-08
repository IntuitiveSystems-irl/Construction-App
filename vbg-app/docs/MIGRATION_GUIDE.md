# Data Migration Guide
## Migrating from 31.97.144.132 to Local Project

This guide provides a comprehensive approach to migrate users, documents, settings, and all data from the remote server at `31.97.144.132` to this local project.

---

## Overview

**Current Project Stack:**
- **Framework:** Next.js 15.3.0
- **Database:** SQLite (`rooster.db`)
- **Backend:** Express.js API server
- **File Storage:** Local filesystem (`/uploads` directory)

**Database Tables to Migrate:**
- `users`
- `admin_users`
- `documents`
- `contracts`
- `contract_templates`
- `job_sites`
- `job_site_uploads`
- `job_site_comments`
- `job_site_activity`
- `estimates`
- `invoices`
- `receipts`
- `payment_requests`
- `notifications`
- `notification_preferences`
- `admin_requests`
- `invitations`
- `password_reset_tokens`
- `jobs`
- `job_assignments`
- `job_messages`

---

## Migration Strategy

### Phase 1: Pre-Migration Preparation

#### 1.1 Backup Current Local Database
```bash
# Create backup of current local database
cp rooster.db rooster.db.backup.$(date +%Y%m%d_%H%M%S)
```

#### 1.2 Verify Remote Server Access
```bash
# Test SSH connection
ssh root@31.97.144.132 "echo 'Connection successful'"
```

#### 1.3 Identify Remote Database Location
```bash
# Connect to remote server and locate database
ssh root@31.97.144.132 "find /root /home /var/www -name '*.db' -o -name '*.sqlite' 2>/dev/null"
```

---

### Phase 2: Database Migration

#### Option A: Direct SQLite Database Transfer (Recommended)

**Step 1: Download Remote Database**
```bash
# Download the remote database file
scp root@31.97.144.132:/path/to/remote/rooster.db ./remote_rooster.db

# Verify database integrity
sqlite3 remote_rooster.db "PRAGMA integrity_check;"
```

**Step 2: Analyze Remote Schema**
```bash
# Export remote database schema
sqlite3 remote_rooster.db ".schema" > remote_schema.sql

# Compare with local schema
sqlite3 rooster.db ".schema" > local_schema.sql
diff local_schema.sql remote_schema.sql
```

**Step 3: Merge Databases**

Use the provided migration script (see `scripts/migrate-database.js` below) or manual SQL:

```bash
# Attach remote database and copy data
sqlite3 rooster.db <<EOF
ATTACH DATABASE 'remote_rooster.db' AS remote;

-- Migrate users (avoiding duplicates)
INSERT OR IGNORE INTO users 
SELECT * FROM remote.users;

-- Migrate admin_users
INSERT OR IGNORE INTO admin_users 
SELECT * FROM remote.admin_users;

-- Migrate documents
INSERT OR IGNORE INTO documents 
SELECT * FROM remote.documents;

-- Migrate contracts
INSERT OR IGNORE INTO contracts 
SELECT * FROM remote.contracts;

-- Migrate job_sites
INSERT OR IGNORE INTO job_sites 
SELECT * FROM remote.job_sites;

-- Continue for all tables...

DETACH DATABASE remote;
EOF
```

#### Option B: SQL Dump and Import

**Step 1: Create SQL Dump on Remote Server**
```bash
# SSH into remote server
ssh root@31.97.144.132

# Create SQL dump
sqlite3 /path/to/rooster.db .dump > rooster_dump.sql

# Exit SSH
exit
```

**Step 2: Download and Import**
```bash
# Download dump file
scp root@31.97.144.132:/path/to/rooster_dump.sql ./rooster_dump.sql

# Import into local database
sqlite3 rooster.db < rooster_dump.sql
```

---

### Phase 3: File Migration

#### 3.1 Migrate Uploaded Files

**Step 1: Identify Upload Directory on Remote Server**
```bash
ssh root@31.97.144.132 "ls -la /root/*/uploads /var/www/*/uploads /home/*/uploads 2>/dev/null"
```

**Step 2: Download Files with rsync**
```bash
# Sync uploads directory (preserves permissions and timestamps)
rsync -avz --progress root@31.97.144.132:/path/to/remote/uploads/ ./uploads/

# Alternative: Use scp for smaller directories
scp -r root@31.97.144.132:/path/to/remote/uploads/* ./uploads/
```

**Step 3: Verify File Integrity**
```bash
# Count files
echo "Local files: $(find ./uploads -type f | wc -l)"
ssh root@31.97.144.132 "echo 'Remote files: \$(find /path/to/remote/uploads -type f | wc -l)'"

# Check disk usage
du -sh ./uploads
ssh root@31.97.144.132 "du -sh /path/to/remote/uploads"
```

#### 3.2 Update File Paths in Database

If file paths are absolute and need updating:
```bash
sqlite3 rooster.db <<EOF
-- Update document file paths
UPDATE documents 
SET filename = REPLACE(filename, '/old/path/', './uploads/');

-- Update contract file paths
UPDATE contracts 
SET file_path = REPLACE(file_path, '/old/path/', './uploads/');

-- Update job site uploads
UPDATE job_site_uploads 
SET file_path = REPLACE(file_path, '/old/path/', './uploads/');
EOF
```

---

### Phase 4: Configuration Migration

#### 4.1 Migrate Environment Variables

**Step 1: Download Remote .env File**
```bash
# Download remote environment configuration
scp root@31.97.144.132:/path/to/project/.env ./remote.env

# Review differences
diff .env remote.env
```

**Step 2: Merge Critical Settings**

Update your local `.env` file with:
- `JWT_SECRET` (use the same secret to maintain session compatibility)
- Email configuration (`MAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`)
- API keys and third-party service credentials
- Domain/URL settings (update to local or new production URLs)

**Important:** Do NOT copy database paths or server-specific settings.

#### 4.2 Migrate SSL Certificates (if applicable)

```bash
# Download SSL certificates
scp -r root@31.97.144.132:/path/to/ssl/ ./ssl/
```

---

### Phase 5: Post-Migration Verification

#### 5.1 Database Integrity Checks

```bash
# Run integrity check
sqlite3 rooster.db "PRAGMA integrity_check;"

# Count records in key tables
sqlite3 rooster.db <<EOF
SELECT 'users', COUNT(*) FROM users
UNION ALL
SELECT 'documents', COUNT(*) FROM documents
UNION ALL
SELECT 'contracts', COUNT(*) FROM contracts
UNION ALL
SELECT 'job_sites', COUNT(*) FROM job_sites;
EOF
```

#### 5.2 Test Application Functionality

1. **Start the application:**
   ```bash
   npm run dev
   ```

2. **Test user authentication:**
   - Try logging in with existing user credentials
   - Verify JWT tokens work correctly

3. **Test file access:**
   - Navigate to documents section
   - Verify uploaded files are accessible
   - Check document downloads work

4. **Test database operations:**
   - Create a test user
   - Upload a test document
   - Create a test contract

#### 5.3 Verify Data Consistency

```bash
# Check for orphaned records
sqlite3 rooster.db <<EOF
-- Documents without users
SELECT COUNT(*) as orphaned_documents 
FROM documents d 
LEFT JOIN users u ON d.user_id = u.id 
WHERE u.id IS NULL;

-- Contracts without users
SELECT COUNT(*) as orphaned_contracts 
FROM contracts c 
LEFT JOIN users u ON c.user_id = u.id 
WHERE u.id IS NULL;
EOF
```

---

## Migration Scripts

### Script 1: Automated Database Migration

Create `scripts/migrate-database.js`:

```javascript
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localDbPath = path.join(__dirname, '../rooster.db');
const remoteDbPath = path.join(__dirname, '../remote_rooster.db');

const db = new sqlite3.Database(localDbPath);

async function migrateDatabase() {
  console.log('🚀 Starting database migration...');

  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Attach remote database
      db.run(`ATTACH DATABASE '${remoteDbPath}' AS remote`, (err) => {
        if (err) {
          console.error('❌ Error attaching remote database:', err);
          reject(err);
          return;
        }
        console.log('✅ Remote database attached');
      });

      // Define tables to migrate
      const tables = [
        'users',
        'admin_users',
        'documents',
        'contracts',
        'contract_templates',
        'job_sites',
        'job_site_uploads',
        'job_site_comments',
        'job_site_activity',
        'estimates',
        'invoices',
        'receipts',
        'payment_requests',
        'notifications',
        'notification_preferences',
        'admin_requests',
        'invitations',
        'password_reset_tokens',
        'jobs',
        'job_assignments',
        'job_messages'
      ];

      let completed = 0;

      tables.forEach((table) => {
        db.run(`INSERT OR IGNORE INTO ${table} SELECT * FROM remote.${table}`, (err) => {
          if (err) {
            console.error(`❌ Error migrating ${table}:`, err.message);
          } else {
            console.log(`✅ Migrated ${table}`);
          }

          completed++;
          if (completed === tables.length) {
            // Detach remote database
            db.run('DETACH DATABASE remote', (err) => {
              if (err) {
                console.error('❌ Error detaching remote database:', err);
                reject(err);
              } else {
                console.log('✅ Remote database detached');
                console.log('🎉 Migration completed successfully!');
                resolve();
              }
            });
          }
        });
      });
    });
  });
}

// Run migration
migrateDatabase()
  .then(() => {
    console.log('✅ All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  });
```

### Script 2: File Migration with Progress

Create `scripts/migrate-files.sh`:

```bash
#!/bin/bash

# Configuration
REMOTE_HOST="root@31.97.144.132"
REMOTE_UPLOADS_PATH="/path/to/remote/uploads"
LOCAL_UPLOADS_PATH="./uploads"

echo "🚀 Starting file migration..."

# Create local uploads directory if it doesn't exist
mkdir -p "$LOCAL_UPLOADS_PATH"

# Use rsync for efficient transfer with progress
rsync -avz --progress \
  --exclude='*.tmp' \
  --exclude='.DS_Store' \
  "$REMOTE_HOST:$REMOTE_UPLOADS_PATH/" \
  "$LOCAL_UPLOADS_PATH/"

if [ $? -eq 0 ]; then
  echo "✅ File migration completed successfully!"
  
  # Count files
  LOCAL_COUNT=$(find "$LOCAL_UPLOADS_PATH" -type f | wc -l)
  echo "📁 Total files migrated: $LOCAL_COUNT"
  
  # Show disk usage
  du -sh "$LOCAL_UPLOADS_PATH"
else
  echo "❌ File migration failed!"
  exit 1
fi
```

---

## Rollback Plan

If migration fails or issues arise:

### 1. Restore Database Backup
```bash
# Restore from backup
cp rooster.db.backup.YYYYMMDD_HHMMSS rooster.db
```

### 2. Remove Migrated Files
```bash
# Remove newly migrated files (if needed)
rm -rf uploads/*
# Restore from backup if you created one
```

### 3. Revert Configuration
```bash
# Restore original .env
git checkout .env
# Or restore from backup
```

---

## Troubleshooting

### Issue: Schema Mismatch

**Problem:** Remote database has different schema than local.

**Solution:**
1. Export remote schema: `sqlite3 remote_rooster.db ".schema" > remote_schema.sql`
2. Identify differences
3. Create migration SQL to add missing columns/tables
4. Apply migrations before data import

### Issue: Duplicate Primary Keys

**Problem:** ID conflicts when merging databases.

**Solution:**
Use `INSERT OR IGNORE` or manually offset IDs:

```sql
-- Offset remote IDs by 1000000
INSERT INTO users (id, name, email, password, ...)
SELECT id + 1000000, name, email, password, ...
FROM remote.users;
```

### Issue: File Path Mismatches

**Problem:** Database references files with wrong paths.

**Solution:**
```bash
# Update all file paths in database
sqlite3 rooster.db <<EOF
UPDATE documents SET filename = './uploads/' || basename(filename);
UPDATE contracts SET file_path = './uploads/' || basename(file_path);
EOF
```

### Issue: Missing Files

**Problem:** Database references files that don't exist.

**Solution:**
```bash
# Find missing files
node scripts/check-missing-files.js
```

Create `scripts/check-missing-files.js`:
```javascript
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

const db = new sqlite3.Database('./rooster.db');

db.all('SELECT id, filename FROM documents', (err, rows) => {
  if (err) throw err;
  
  rows.forEach(row => {
    const filePath = path.join(__dirname, '..', row.filename);
    if (!fs.existsSync(filePath)) {
      console.log(`Missing file: ${row.filename} (document ID: ${row.id})`);
    }
  });
  
  db.close();
});
```

---

## Security Considerations

1. **Password Hashes:** Ensure password hashing algorithm is consistent
2. **JWT Secrets:** Use the same `JWT_SECRET` to maintain session compatibility
3. **API Keys:** Update any hardcoded API keys or tokens
4. **File Permissions:** Set appropriate permissions on uploads directory:
   ```bash
   chmod -R 755 uploads/
   ```
5. **Database Permissions:** Protect database file:
   ```bash
   chmod 600 rooster.db
   ```

---

## Post-Migration Checklist

- [ ] Database backup created
- [ ] Remote database downloaded
- [ ] Schema compatibility verified
- [ ] All tables migrated
- [ ] Upload files transferred
- [ ] File paths updated in database
- [ ] Environment variables configured
- [ ] Database integrity check passed
- [ ] Application starts without errors
- [ ] User login works
- [ ] File uploads/downloads work
- [ ] All API endpoints tested
- [ ] Email notifications work
- [ ] No orphaned records
- [ ] Performance is acceptable
- [ ] Remote server data backed up (keep for 30 days)

---

## Next Steps

After successful migration:

1. **Monitor application logs** for any errors
2. **Test all critical user workflows**
3. **Keep remote server backup** for at least 30 days
4. **Document any custom changes** made during migration
5. **Update deployment scripts** if needed
6. **Notify users** of any changes (if applicable)

---

## Support

If you encounter issues during migration:

1. Check the troubleshooting section above
2. Review application logs: `tail -f logs/*.log`
3. Verify database integrity: `sqlite3 rooster.db "PRAGMA integrity_check;"`
4. Check file permissions: `ls -la uploads/`

---

**Created:** $(date)
**Project:** Rooster Master
**Migration Source:** 31.97.144.132

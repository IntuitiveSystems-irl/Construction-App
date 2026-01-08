# Migration Quick Start Guide

## 🚀 Fast Track Migration (5 Steps)

### Prerequisites
- SSH access to `root@31.97.144.132`
- Node.js and npm installed locally
- SQLite3 installed locally

---

## Step 1: Pre-Migration Check (5 minutes)

Run the pre-migration check to verify access and locate files:

```bash
./scripts/pre-migration-check.sh
```

This will:
- ✅ Test SSH connection
- 📁 Locate database files
- 📁 Find uploads directory
- 🔍 Identify project structure

**Action Required:** Note the paths shown for database and uploads directory.

---

## Step 2: Download Remote Database (2 minutes)

```bash
# Replace /path/to/remote/rooster.db with the actual path from Step 1
scp root@31.97.144.132:/path/to/remote/rooster.db ./remote_rooster.db
```

**Verify download:**
```bash
sqlite3 remote_rooster.db "PRAGMA integrity_check;"
# Should output: ok
```

---

## Step 3: Migrate Database (5 minutes)

```bash
node scripts/migrate-database.js
```

This will:
- 🔄 Backup your current database
- 📊 Migrate all tables
- ✅ Verify data integrity
- 📈 Show migration summary

**Expected Output:**
```
✅ Successfully migrated: 21 tables
📝 Total records migrated: XXXX
🎉 Migration completed!
```

---

## Step 4: Migrate Files (10-30 minutes depending on size)

First, update the remote path in the script:

```bash
# Edit scripts/migrate-files.sh
# Update line 17: REMOTE_UPLOADS_PATH="/path/to/remote/uploads"
```

Then run:

```bash
./scripts/migrate-files.sh
```

This will:
- 📦 Backup existing uploads
- 🔄 Transfer all files
- ✅ Verify file counts
- 🔒 Set proper permissions

---

## Step 5: Verify Migration (5 minutes)

```bash
# Check for missing files
node scripts/check-missing-files.js

# Start the application
npm run dev
```

**Test these features:**
- [ ] User login
- [ ] View documents
- [ ] Download a file
- [ ] View contracts
- [ ] Check job sites

---

## 🔧 Troubleshooting

### Issue: "Remote database not found"
```bash
# Find the database on remote server
ssh root@31.97.144.132 "find /root /home /var/www -name '*.db' 2>/dev/null"
```

### Issue: "Cannot connect to remote server"
```bash
# Test SSH connection
ssh root@31.97.144.132 "echo 'Connection test'"
```

### Issue: "Missing files after migration"
```bash
# Check what files are missing
node scripts/check-missing-files.js

# Re-run file migration
./scripts/migrate-files.sh
```

### Issue: "Schema mismatch"
```bash
# Compare schemas
sqlite3 remote_rooster.db ".schema" > remote_schema.sql
sqlite3 rooster.db ".schema" > local_schema.sql
diff local_schema.sql remote_schema.sql
```

---

## 📋 Post-Migration Checklist

- [ ] Database backup created
- [ ] All tables migrated successfully
- [ ] Files transferred and verified
- [ ] Application starts without errors
- [ ] User authentication works
- [ ] File uploads/downloads work
- [ ] No missing files reported
- [ ] Environment variables updated

---

## 🆘 Need Help?

1. **Check detailed guide:** See `MIGRATION_GUIDE.md` for comprehensive instructions
2. **Review logs:** Check application logs for errors
3. **Verify database:** Run `sqlite3 rooster.db "PRAGMA integrity_check;"`
4. **Check file permissions:** Run `ls -la uploads/`

---

## 📊 Migration Scripts Reference

| Script | Purpose | Duration |
|--------|---------|----------|
| `pre-migration-check.sh` | Verify access and locate files | 5 min |
| `migrate-database.js` | Migrate SQLite database | 5 min |
| `migrate-files.sh` | Transfer uploaded files | 10-30 min |
| `check-missing-files.js` | Verify file integrity | 2 min |

---

## 🔄 Rollback Instructions

If something goes wrong:

```bash
# Restore database from backup
cp rooster.db.backup.YYYYMMDD_HHMMSS rooster.db

# Restore uploads from backup (if needed)
rm -rf uploads
mv uploads.backup.YYYYMMDD_HHMMSS uploads
```

---

## ✅ Success Criteria

Migration is successful when:
- ✅ All database tables have data
- ✅ File count matches between local and remote
- ✅ Application starts without errors
- ✅ Users can log in
- ✅ Files can be viewed and downloaded
- ✅ No missing file errors

---

**Total Estimated Time:** 30-60 minutes

**Last Updated:** $(date)

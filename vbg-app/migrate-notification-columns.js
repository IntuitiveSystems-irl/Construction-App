#!/usr/bin/env node

/**
 * Database Migration Script
 * Adds new notification columns to existing notification_preferences table
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'rooster.db');

console.log('🔄 Starting database migration...\n');

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  
  console.log('✅ Connected to database');
  
  // Check if columns already exist
  db.all("PRAGMA table_info(notification_preferences)", (err, columns) => {
    if (err) {
      console.error('❌ Error checking table:', err.message);
      db.close();
      process.exit(1);
    }
    
    const existingColumns = columns.map(col => col.name);
    console.log('\n📋 Existing columns:', existingColumns.join(', '));
    
    const newColumns = [
      'contract_notifications',
      'estimate_notifications',
      'invoice_notifications',
      'document_notifications'
    ];
    
    const columnsToAdd = newColumns.filter(col => !existingColumns.includes(col));
    
    if (columnsToAdd.length === 0) {
      console.log('\n✅ All columns already exist. No migration needed.');
      db.close();
      return;
    }
    
    console.log('\n🔧 Adding new columns:', columnsToAdd.join(', '));
    
    // Add columns one by one
    let completed = 0;
    
    columnsToAdd.forEach((column) => {
      const sql = `ALTER TABLE notification_preferences ADD COLUMN ${column} INTEGER DEFAULT 1`;
      
      db.run(sql, (err) => {
        if (err) {
          console.error(`❌ Error adding column ${column}:`, err.message);
        } else {
          console.log(`✅ Added column: ${column}`);
        }
        
        completed++;
        
        if (completed === columnsToAdd.length) {
          console.log('\n✅ Migration completed successfully!');
          console.log('\n📊 Verifying table structure...');
          
          db.all("PRAGMA table_info(notification_preferences)", (err, updatedColumns) => {
            if (err) {
              console.error('❌ Error verifying table:', err.message);
            } else {
              console.log('\n📋 Updated columns:');
              updatedColumns.forEach(col => {
                console.log(`  - ${col.name} (${col.type}) ${col.notnull ? 'NOT NULL' : 'NULL'} DEFAULT ${col.dflt_value || 'N/A'}`);
              });
            }
            
            db.close();
          });
        }
      });
    });
  });
});

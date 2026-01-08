/**
 * Encrypted Database Wrapper
 * Uses better-sqlite3-multiple-ciphers with SQLCipher encryption
 * Provides callback-style API compatible with existing sqlite3 code
 */

import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use package.json path for proper module resolution
const require = createRequire(path.join(__dirname, '..', 'package.json'));
const Database = require('better-sqlite3-multiple-ciphers');

class EncryptedDatabase {
  constructor(dbPath, encryptionKey) {
    this.db = new Database(dbPath);
    
    if (encryptionKey) {
      const keyBuffer = Buffer.from(encryptionKey, 'hex');
      this.db.pragma("cipher='sqlcipher'");
      this.db.pragma('legacy=4');
      this.db.key(keyBuffer);
      
      // Verify the key works by running a test query
      try {
        const result = this.db.prepare('SELECT count(*) as cnt FROM sqlite_master').get();
        console.log(`🔐 Connected to AES-256 encrypted SQLite database (SQLCipher) - ${result.cnt} tables`);
      } catch (verifyErr) {
        console.error('❌ Failed to verify encryption key:', verifyErr.message);
        throw new Error('Database encryption key is invalid or database is corrupted');
      }
    } else {
      console.log('Connected to SQLite database (unencrypted)');
    }
  }

  // Callback-style run (for INSERT, UPDATE, DELETE)
  run(sql, params = [], callback) {
    // Handle case where callback is passed as second argument
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    try {
      const stmt = this.db.prepare(sql);
      const result = Array.isArray(params) && params.length > 0 ? stmt.run(...params) : stmt.run();
      if (callback) {
        // Simulate sqlite3 callback with 'this' context
        callback.call({ lastID: result.lastInsertRowid, changes: result.changes }, null);
      }
      return result;
    } catch (err) {
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
    }
  }

  // Callback-style get (for single row SELECT)
  get(sql, params = [], callback) {
    // Handle case where callback is passed as second argument
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    try {
      const stmt = this.db.prepare(sql);
      const row = Array.isArray(params) && params.length > 0 ? stmt.get(...params) : stmt.get();
      if (callback) {
        callback(null, row);
      }
      return row;
    } catch (err) {
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
    }
  }

  // Callback-style all (for multiple row SELECT)
  all(sql, params = [], callback) {
    // Handle case where callback is passed as second argument
    if (typeof params === 'function') {
      callback = params;
      params = [];
    }
    
    try {
      const stmt = this.db.prepare(sql);
      const rows = Array.isArray(params) && params.length > 0 ? stmt.all(...params) : stmt.all();
      if (callback) {
        callback(null, rows);
      }
      return rows;
    } catch (err) {
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
    }
  }

  // Execute raw SQL (for schema changes)
  exec(sql, callback) {
    try {
      this.db.exec(sql);
      if (callback) {
        callback(null);
      }
    } catch (err) {
      if (callback) {
        callback(err);
      } else {
        throw err;
      }
    }
  }

  // Serialize - just run the function (better-sqlite3 is synchronous)
  serialize(fn) {
    if (fn) fn();
  }

  // Close the database
  close(callback) {
    try {
      this.db.close();
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }
}

export function createEncryptedDatabase(dbPath, encryptionKey) {
  return new EncryptedDatabase(dbPath, encryptionKey);
}

export default EncryptedDatabase;

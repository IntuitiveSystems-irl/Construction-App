import db from '../config/database.js';

// Generic CRUD controller
export class CRUDController {
  constructor(tableName) {
    this.table = tableName;
  }

  // Get all records with optional filters
  getAll(filters = {}, userId = null, isAdmin = false) {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM ${this.table}`;
      const params = [];
      const conditions = [];

      // Add user filter if not admin
      if (!isAdmin && userId) {
        conditions.push('user_id = ?');
        params.push(userId);
      }

      // Add custom filters
      Object.entries(filters).forEach(([key, value]) => {
        conditions.push(`${key} = ?`);
        params.push(value);
      });

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      // Use uploaded_at for documents table, created_at for others
      const orderColumn = this.table === 'documents' ? 'uploaded_at' : 'created_at';
      query += ` ORDER BY ${orderColumn} DESC`;

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Get single record by ID
  getById(id, userId = null, isAdmin = false) {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM ${this.table} WHERE id = ?`;
      const params = [id];

      // Add user check if not admin
      if (!isAdmin && userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Create new record
  create(data) {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const placeholders = keys.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`;

      db.run(query, values, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, ...data });
      });
    });
  }

  // Update record
  update(id, data, userId = null, isAdmin = false) {
    return new Promise((resolve, reject) => {
      const keys = Object.keys(data);
      const values = Object.values(data);
      const setClause = keys.map(key => `${key} = ?`).join(', ');
      
      let query = `UPDATE ${this.table} SET ${setClause} WHERE id = ?`;
      const params = [...values, id];

      // Add user check if not admin
      if (!isAdmin && userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  // Delete record
  delete(id, userId = null, isAdmin = false) {
    return new Promise((resolve, reject) => {
      let query = `DELETE FROM ${this.table} WHERE id = ?`;
      const params = [id];

      // Add user check if not admin
      if (!isAdmin && userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }

      db.run(query, params, function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      });
    });
  }

  // Execute custom query
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Execute custom single row query
  queryOne(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

// Pre-configured controllers for each resource
export const Users = new CRUDController('users');
export const Documents = new CRUDController('documents');
export const Contracts = new CRUDController('contracts');
export const JobSites = new CRUDController('job_sites');
export const Notifications = new CRUDController('notifications');

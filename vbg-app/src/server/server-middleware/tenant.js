/**
 * Multi-Tenant Middleware
 * Handles tenant identification, validation, and isolation
 */

import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database connection
const DB_PATH = process.env.DB_FILENAME || path.join(__dirname, '../rooster.db');
const db = new sqlite3.Database(DB_PATH);

/**
 * Identify tenant from request
 * Checks subdomain, custom domain, header, or user token
 */
export const identifyTenant = async (req, res, next) => {
  try {
    let tenant = null;
    
    // Method 1: Subdomain (e.g., acme.rooster.app)
    const host = req.get('host') || '';
    const parts = host.split('.');
    
    // Extract subdomain if exists
    if (parts.length >= 3 && parts[0] !== 'www' && !host.includes('localhost')) {
      const subdomain = parts[0];
      
      tenant = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM tenants WHERE subdomain = ? AND status = ?',
          [subdomain, 'active'],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      if (tenant) {
        console.log(`✅ Tenant identified by subdomain: ${subdomain}`);
      }
    }
    
    // Method 2: Header (for API calls, mobile apps)
    if (!tenant) {
      const tenantHeader = req.get('X-Tenant-ID');
      if (tenantHeader) {
        tenant = await new Promise((resolve, reject) => {
          db.get(
            'SELECT * FROM tenants WHERE id = ? AND status = ?',
            [tenantHeader, 'active'],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });
        
        if (tenant) {
          console.log(`✅ Tenant identified by header: ${tenantHeader}`);
        }
      }
    }
    
    // Method 3: From authenticated user (fallback)
    if (!tenant && req.user && req.user.tenant_id) {
      tenant = await new Promise((resolve, reject) => {
        db.get(
          'SELECT * FROM tenants WHERE id = ? AND status = ?',
          [req.user.tenant_id, 'active'],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      if (tenant) {
        console.log(`✅ Tenant identified from user token: ${req.user.tenant_id}`);
      }
    }
    
    // Method 4: Development fallback (single tenant mode)
    if (!tenant && (process.env.NODE_ENV === 'development' || process.env.MULTI_TENANT_MODE === 'single')) {
      // In development, create or use default tenant
      tenant = await new Promise((resolve, reject) => {
        db.get('SELECT * FROM tenants LIMIT 1', (err, row) => {
          if (err) reject(err);
          else if (row) {
            resolve(row);
          } else {
            // Create default tenant if none exists
            const defaultTenant = {
              business_name: 'Default Company',
              subdomain: 'default',
              owner_email: 'admin@rooster.app',
              owner_name: 'Admin',
              plan: 'pro',
              status: 'active'
            };
            
            db.run(
              `INSERT INTO tenants (business_name, subdomain, owner_email, owner_name, plan, status)
               VALUES (?, ?, ?, ?, ?, ?)`,
              [defaultTenant.business_name, defaultTenant.subdomain, defaultTenant.owner_email, 
               defaultTenant.owner_name, defaultTenant.plan, defaultTenant.status],
              function(err) {
                if (err) reject(err);
                else {
                  defaultTenant.id = this.lastID;
                  console.log('✅ Created default tenant for development');
                  resolve(defaultTenant);
                }
              }
            );
          }
        });
      });
      
      if (tenant) {
        console.log(`⚠️  Using development tenant: ${tenant.business_name} (ID: ${tenant.id})`);
      }
    }
    
    // If still no tenant found, return error
    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant not found',
        message: 'No tenant could be identified from this request. Please check your subdomain or contact support.'
      });
    }
    
    // Check tenant status
    if (tenant.status !== 'active') {
      return res.status(403).json({ 
        error: 'Tenant account suspended',
        message: 'This account has been suspended. Please contact support.'
      });
    }
    
    // Attach tenant to request
    req.tenant = tenant;
    
    next();
  } catch (error) {
    console.error('❌ Tenant identification error:', error);
    res.status(500).json({ 
      error: 'Failed to identify tenant',
      message: 'An error occurred while identifying your account. Please try again.'
    });
  }
};

/**
 * Validate that authenticated user belongs to the identified tenant
 */
export const validateTenantUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'You must be logged in to access this resource.'
    });
  }
  
  if (!req.tenant) {
    return res.status(404).json({ 
      error: 'Tenant not identified',
      message: 'No tenant could be identified for this request.'
    });
  }
  
  // In development mode, skip validation if user doesn't have tenant_id yet
  if (process.env.NODE_ENV === 'development' && !req.user.tenant_id) {
    console.log('⚠️  Development mode: Skipping tenant validation for user without tenant_id');
    return next();
  }
  
  if (req.user.tenant_id && req.user.tenant_id !== req.tenant.id) {
    console.warn(`⚠️  User ${req.user.id} attempted to access tenant ${req.tenant.id} but belongs to ${req.user.tenant_id}`);
    return res.status(403).json({ 
      error: 'Access denied',
      message: 'You do not have permission to access this organization.'
    });
  }
  
  next();
};

/**
 * Check if user has required role within their tenant
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'You must be logged in to access this resource.'
      });
    }
    
    const userRole = req.user.role || req.user.user_type;
    
    // Map old user_type to new role system
    const roleMapping = {
      'admin': 'tenant_admin',
      'client': 'client',
      'subcontractor': 'subcontractor'
    };
    
    const mappedRole = roleMapping[userRole] || userRole;
    
    if (!allowedRoles.includes(mappedRole) && !allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }
    
    next();
  };
};

/**
 * Check tenant usage limits before creating resources
 */
export const checkTenantLimit = (resourceType) => {
  return async (req, res, next) => {
    try {
      const tenant = req.tenant;
      
      if (!tenant) {
        return res.status(404).json({ error: 'Tenant not identified' });
      }
      
      let currentCount = 0;
      let maxAllowed = 0;
      
      switch (resourceType) {
        case 'users':
          currentCount = await new Promise((resolve, reject) => {
            db.get(
              'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND (status = ? OR status IS NULL)',
              [tenant.id, 'active'],
              (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
              }
            );
          });
          maxAllowed = tenant.max_users || 10;
          break;
          
        case 'job_sites':
          currentCount = await new Promise((resolve, reject) => {
            db.get(
              'SELECT COUNT(*) as count FROM job_sites WHERE tenant_id = ?',
              [tenant.id],
              (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
              }
            );
          });
          maxAllowed = tenant.max_job_sites || 25;
          break;
          
        case 'clients':
          currentCount = await new Promise((resolve, reject) => {
            db.get(
              'SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND user_type = ? AND (status = ? OR status IS NULL)',
              [tenant.id, 'client', 'active'],
              (err, row) => {
                if (err) reject(err);
                else resolve(row.count);
              }
            );
          });
          maxAllowed = tenant.max_clients || 50;
          break;
          
        case 'storage':
          currentCount = tenant.current_storage_mb || 0;
          maxAllowed = tenant.max_storage_mb || 5000;
          break;
      }
      
      if (currentCount >= maxAllowed) {
        return res.status(403).json({
          error: 'Tenant limit reached',
          message: `You have reached your plan limit for ${resourceType}. Current: ${currentCount}, Max: ${maxAllowed}. Please upgrade your plan.`,
          current: currentCount,
          max: maxAllowed,
          resourceType: resourceType
        });
      }
      
      // Log usage for monitoring
      console.log(`📊 Tenant ${tenant.id} usage: ${resourceType} = ${currentCount}/${maxAllowed}`);
      
      next();
    } catch (error) {
      console.error('❌ Limit check error:', error);
      next(error);
    }
  };
};

/**
 * Helper function to get tenant by ID
 */
export const getTenantById = (tenantId) => {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT * FROM tenants WHERE id = ?',
      [tenantId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });
};

/**
 * Helper function to update tenant
 */
export const updateTenant = (tenantId, updates) => {
  return new Promise((resolve, reject) => {
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(tenantId);
    
    db.run(
      `UPDATE tenants SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      values,
      function(err) {
        if (err) reject(err);
        else resolve({ changes: this.changes });
      }
    );
  });
};

export default {
  identifyTenant,
  validateTenantUser,
  requireRole,
  checkTenantLimit,
  getTenantById,
  updateTenant
};

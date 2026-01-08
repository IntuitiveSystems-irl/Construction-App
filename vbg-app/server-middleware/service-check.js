/**
 * Service Access Control Middleware
 * Checks if tenant has enabled a specific service before allowing access
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
 * Middleware to check if tenant has a specific service enabled
 * @param {string} serviceName - Name of the service to check
 * @returns {Function} Express middleware function
 */
export const requireService = (serviceName) => {
  return async (req, res, next) => {
    try {
      // Ensure tenant is identified
      if (!req.tenant) {
        return res.status(404).json({
          error: 'Tenant not identified',
          message: 'Unable to verify service access without tenant context'
        });
      }

      const tenantId = req.tenant.id;

      // Check if service is enabled for this tenant
      const service = await new Promise((resolve, reject) => {
        db.get(
          `SELECT ts.*, sd.display_name, sd.description 
           FROM tenant_services ts
           JOIN service_definitions sd ON ts.service_name = sd.service_name
           WHERE ts.tenant_id = ? AND ts.service_name = ? AND ts.enabled = 1`,
          [tenantId, serviceName],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!service) {
        // Get service info for better error message
        const serviceInfo = await new Promise((resolve, reject) => {
          db.get(
            'SELECT display_name, description FROM service_definitions WHERE service_name = ?',
            [serviceName],
            (err, row) => {
              if (err) reject(err);
              else resolve(row);
            }
          );
        });

        return res.status(403).json({
          error: 'Service not enabled',
          message: `This feature requires the "${serviceInfo?.display_name || serviceName}" service. Please enable it in your Settings.`,
          service: serviceName,
          serviceName: serviceInfo?.display_name,
          upgradeUrl: '/settings/services'
        });
      }

      // Attach service info to request for potential use in route handlers
      req.service = service;

      // Track usage (async, don't wait)
      trackServiceUsage(tenantId, serviceName).catch(err => {
        console.error('Error tracking service usage:', err);
      });

      next();
    } catch (error) {
      console.error('Service check error:', error);
      return res.status(500).json({
        error: 'Service verification failed',
        message: 'An error occurred while checking service access'
      });
    }
  };
};

/**
 * Middleware to check if tenant has ANY of the specified services enabled
 * @param {string[]} serviceNames - Array of service names
 * @returns {Function} Express middleware function
 */
export const requireAnyService = (...serviceNames) => {
  return async (req, res, next) => {
    try {
      if (!req.tenant) {
        return res.status(404).json({
          error: 'Tenant not identified'
        });
      }

      const tenantId = req.tenant.id;

      // Check if any of the services are enabled
      const placeholders = serviceNames.map(() => '?').join(',');
      const service = await new Promise((resolve, reject) => {
        db.get(
          `SELECT * FROM tenant_services 
           WHERE tenant_id = ? AND service_name IN (${placeholders}) AND enabled = 1
           LIMIT 1`,
          [tenantId, ...serviceNames],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (!service) {
        return res.status(403).json({
          error: 'Service not enabled',
          message: `This feature requires one of these services: ${serviceNames.join(', ')}`,
          services: serviceNames
        });
      }

      req.service = service;
      next();
    } catch (error) {
      console.error('Service check error:', error);
      return res.status(500).json({
        error: 'Service verification failed'
      });
    }
  };
};

/**
 * Get all enabled services for a tenant
 * @param {number} tenantId - Tenant ID
 * @returns {Promise<Array>} Array of enabled services
 */
export const getEnabledServices = (tenantId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT ts.service_name, ts.enabled_at, ts.settings,
              sd.display_name, sd.description, sd.icon, sd.category
       FROM tenant_services ts
       JOIN service_definitions sd ON ts.service_name = sd.service_name
       WHERE ts.tenant_id = ? AND ts.enabled = 1
       ORDER BY sd.sort_order`,
      [tenantId],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

/**
 * Get all available services (for marketplace/settings page)
 * @returns {Promise<Array>} Array of all service definitions
 */
export const getAllServices = () => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM service_definitions 
       WHERE is_active = 1 
       ORDER BY sort_order`,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      }
    );
  });
};

/**
 * Enable a service for a tenant
 * @param {number} tenantId - Tenant ID
 * @param {string} serviceName - Service name
 * @returns {Promise<Object>} Result object
 */
export const enableService = async (tenantId, serviceName) => {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO tenant_services (tenant_id, service_name, enabled, enabled_at)
       VALUES (?, ?, 1, datetime('now'))
       ON CONFLICT(tenant_id, service_name) 
       DO UPDATE SET enabled = 1, enabled_at = datetime('now'), updated_at = datetime('now')`,
      [tenantId, serviceName],
      function(err) {
        if (err) reject(err);
        else resolve({ success: true, changes: this.changes });
      }
    );
  });
};

/**
 * Disable a service for a tenant
 * @param {number} tenantId - Tenant ID
 * @param {string} serviceName - Service name
 * @returns {Promise<Object>} Result object
 */
export const disableService = async (tenantId, serviceName) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tenant_services 
       SET enabled = 0, disabled_at = datetime('now'), updated_at = datetime('now')
       WHERE tenant_id = ? AND service_name = ?`,
      [tenantId, serviceName],
      function(err) {
        if (err) reject(err);
        else resolve({ success: true, changes: this.changes });
      }
    );
  });
};

/**
 * Track service usage (for analytics and billing)
 * @param {number} tenantId - Tenant ID
 * @param {string} serviceName - Service name
 */
const trackServiceUsage = async (tenantId, serviceName) => {
  const today = new Date().toISOString().split('T')[0];
  
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO service_usage (tenant_id, service_name, usage_date, api_calls)
       VALUES (?, ?, ?, 1)
       ON CONFLICT(tenant_id, service_name, usage_date)
       DO UPDATE SET api_calls = api_calls + 1`,
      [tenantId, serviceName, today],
      (err) => {
        if (err) reject(err);
        else resolve();
      }
    );
  });
};

export default {
  requireService,
  requireAnyService,
  getEnabledServices,
  getAllServices,
  enableService,
  disableService
};

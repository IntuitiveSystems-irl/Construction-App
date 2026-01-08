/**
 * Tenant Services Management API
 * Allows tenants to enable/disable services and view available services
 */

import express from 'express';
import {
  getEnabledServices,
  getAllServices,
  enableService,
  disableService
} from '../server-middleware/service-check.js';

const router = express.Router();

/**
 * GET /api/tenant/services
 * Get all enabled services for the authenticated tenant
 */
router.get('/', async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const services = await getEnabledServices(tenantId);
    
    res.json({
      success: true,
      data: services,
      count: services.length
    });
  } catch (error) {
    console.error('Error fetching enabled services:', error);
    res.status(500).json({
      error: 'Failed to fetch services',
      message: error.message
    });
  }
});

/**
 * GET /api/tenant/services/available
 * Get all available services (marketplace view)
 */
router.get('/available', async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    
    // Get all service definitions
    const allServices = await getAllServices();
    
    // Get tenant's enabled services
    const enabledServices = await getEnabledServices(tenantId);
    const enabledServiceNames = enabledServices.map(s => s.service_name);
    
    // Mark which services are enabled
    const servicesWithStatus = allServices.map(service => ({
      ...service,
      enabled: enabledServiceNames.includes(service.service_name),
      features: service.features ? JSON.parse(service.features) : [],
      requires_tables: service.requires_tables ? JSON.parse(service.requires_tables) : []
    }));
    
    res.json({
      success: true,
      data: servicesWithStatus
    });
  } catch (error) {
    console.error('Error fetching available services:', error);
    res.status(500).json({
      error: 'Failed to fetch available services',
      message: error.message
    });
  }
});

/**
 * POST /api/tenant/services/enable
 * Enable a service for the tenant
 */
router.post('/enable', async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { service } = req.body;
    
    if (!service) {
      return res.status(400).json({
        error: 'Service name required',
        message: 'Please specify which service to enable'
      });
    }
    
    // Verify service exists
    const allServices = await getAllServices();
    const serviceExists = allServices.find(s => s.service_name === service);
    
    if (!serviceExists) {
      return res.status(404).json({
        error: 'Service not found',
        message: `Service "${service}" does not exist`
      });
    }
    
    // Enable the service
    await enableService(tenantId, service);
    
    // Get updated service info
    const enabledServices = await getEnabledServices(tenantId);
    const enabledService = enabledServices.find(s => s.service_name === service);
    
    res.json({
      success: true,
      message: `${serviceExists.display_name} enabled successfully`,
      data: enabledService
    });
  } catch (error) {
    console.error('Error enabling service:', error);
    res.status(500).json({
      error: 'Failed to enable service',
      message: error.message
    });
  }
});

/**
 * POST /api/tenant/services/disable
 * Disable a service for the tenant
 */
router.post('/disable', async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { service } = req.body;
    
    if (!service) {
      return res.status(400).json({
        error: 'Service name required',
        message: 'Please specify which service to disable'
      });
    }
    
    // Disable the service
    const result = await disableService(tenantId, service);
    
    if (result.changes === 0) {
      return res.status(404).json({
        error: 'Service not found',
        message: 'Service was not enabled for this tenant'
      });
    }
    
    res.json({
      success: true,
      message: 'Service disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling service:', error);
    res.status(500).json({
      error: 'Failed to disable service',
      message: error.message
    });
  }
});

/**
 * POST /api/tenant/services/toggle
 * Toggle a service on/off
 */
router.post('/toggle', async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { service } = req.body;
    
    if (!service) {
      return res.status(400).json({
        error: 'Service name required'
      });
    }
    
    // Check current status
    const enabledServices = await getEnabledServices(tenantId);
    const isEnabled = enabledServices.some(s => s.service_name === service);
    
    // Toggle
    if (isEnabled) {
      await disableService(tenantId, service);
      res.json({
        success: true,
        message: 'Service disabled',
        enabled: false
      });
    } else {
      await enableService(tenantId, service);
      const updated = await getEnabledServices(tenantId);
      const enabledService = updated.find(s => s.service_name === service);
      
      res.json({
        success: true,
        message: 'Service enabled',
        enabled: true,
        data: enabledService
      });
    }
  } catch (error) {
    console.error('Error toggling service:', error);
    res.status(500).json({
      error: 'Failed to toggle service',
      message: error.message
    });
  }
});

/**
 * GET /api/tenant/services/usage
 * Get service usage statistics for billing
 */
router.get('/usage', async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const { startDate, endDate } = req.query;
    
    // TODO: Implement usage tracking query
    // For now, return placeholder
    res.json({
      success: true,
      data: {
        period: { startDate, endDate },
        services: [],
        totalCost: 0
      }
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({
      error: 'Failed to fetch usage data',
      message: error.message
    });
  }
});

export default router;

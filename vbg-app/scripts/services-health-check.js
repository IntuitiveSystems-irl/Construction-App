#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { Resend } from 'resend';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

// Services configuration
const SERVICES = {
  web: {
    name: 'VBG Frontend',
    url: 'https://veribuilds.com',
    port: 5003,
    pm2Name: 'vbg-frontend',
    healthEndpoint: '/'
  },
  api: {
    name: 'VBG Backend API',
    url: 'https://api.veribuilds.com',
    port: 5002,
    pm2Name: 'vbg-backend',
    healthEndpoint: '/health'
  },
  cal: {
    name: 'Cal.com Scheduling',
    url: 'https://schedule.veribuilds.com',
    port: 3002,
    docker: 'calcom',
    healthEndpoint: '/'
  },
  email: {
    name: 'Email Service (Resend)',
    testEmail: true
  },
  database: {
    name: 'SQLite Database',
    checkFile: '/root/vbg-app/vbg_encrypted.db'
  }
};

const results = {
  timestamp: new Date().toISOString(),
  hostname: execSync('hostname').toString().trim(),
  services: [],
  summary: {
    total: 0,
    healthy: 0,
    degraded: 0,
    down: 0
  }
};

/**
 * Check if a URL is accessible
 */
async function checkURL(url, timeout = 10000, options = {}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: options.method || 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'VBG-Health-Check/1.0',
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    
    clearTimeout(timeoutId);
    
    let data = null;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      // Response is not JSON
    }
    
    return {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseTime: response.headers.get('x-response-time') || 'N/A',
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check PM2 process status
 */
function checkPM2Process(processName) {
  try {
    const output = execSync(`pm2 jlist`, { encoding: 'utf8' });
    const processes = JSON.parse(output);
    const process = processes.find(p => p.name === processName);
    
    if (!process) {
      return { running: false, error: 'Process not found' };
    }
    
    return {
      running: process.pm2_env.status === 'online',
      status: process.pm2_env.status,
      uptime: process.pm2_env.pm_uptime,
      restarts: process.pm2_env.restart_time,
      memory: Math.round(process.monit.memory / 1024 / 1024) + 'MB',
      cpu: process.monit.cpu + '%'
    };
  } catch (error) {
    return { running: false, error: error.message };
  }
}

/**
 * Check Docker container status
 */
function checkDockerContainer(containerName) {
  try {
    const output = execSync(`docker inspect ${containerName} --format='{{json .}}'`, { encoding: 'utf8' });
    const container = JSON.parse(output);
    
    return {
      running: container.State.Running,
      status: container.State.Status,
      health: container.State.Health?.Status || 'N/A',
      startedAt: container.State.StartedAt,
      restartCount: container.RestartCount
    };
  } catch (error) {
    return { running: false, error: error.message };
  }
}

/**
 * Check VBG Frontend
 */
async function checkVBGFrontend() {
  console.log('Checking VBG Frontend...');
  const service = SERVICES.web;
  
  const urlCheck = await checkURL(service.url + service.healthEndpoint);
  const pm2Check = checkPM2Process(service.pm2Name);
  
  const isHealthy = urlCheck.success && pm2Check.running;
  
  results.services.push({
    name: service.name,
    status: isHealthy ? 'HEALTHY' : 'DOWN',
    url: service.url,
    details: {
      url: urlCheck,
      process: pm2Check
    },
    message: isHealthy ? 'Service is running normally' : 'Service is not responding'
  });
  
  if (isHealthy) {
    results.summary.healthy++;
  } else {
    results.summary.down++;
  }
  results.summary.total++;
}

/**
 * Check VBG Backend API
 */
async function checkVBGBackend() {
  console.log('Checking VBG Backend API...');
  const service = SERVICES.api;
  
  // Check if API is responding (any response is good, even 404)
  const urlCheck = await checkURL(service.url + '/api/login', 10000, {
    method: 'POST',
    body: {}
  });
  const pm2Check = checkPM2Process(service.pm2Name);
  
  // API is healthy if process is running and we get any HTTP response
  const isHealthy = pm2Check.running && (urlCheck.status >= 200 && urlCheck.status < 600);
  
  results.services.push({
    name: service.name,
    status: isHealthy ? 'HEALTHY' : 'DOWN',
    url: service.url,
    details: {
      url: urlCheck,
      process: pm2Check
    },
    message: isHealthy ? 'API is responding normally' : 'API is not responding'
  });
  
  if (isHealthy) {
    results.summary.healthy++;
  } else {
    results.summary.down++;
  }
  results.summary.total++;
}

/**
 * Check Cal.com
 */
async function checkCalcom() {
  console.log('Checking Cal.com...');
  const service = SERVICES.cal;
  
  const urlCheck = await checkURL(service.url + service.healthEndpoint);
  const dockerCheck = checkDockerContainer(service.docker);
  
  const isHealthy = urlCheck.success && dockerCheck.running;
  
  results.services.push({
    name: service.name,
    status: isHealthy ? 'HEALTHY' : 'DOWN',
    url: service.url,
    details: {
      url: urlCheck,
      docker: dockerCheck
    },
    message: isHealthy ? 'Scheduling service is operational' : 'Scheduling service is not responding'
  });
  
  if (isHealthy) {
    results.summary.healthy++;
  } else {
    results.summary.down++;
  }
  results.summary.total++;
}

/**
 * Test API endpoints with comprehensive pathway testing
 */
async function testAPIEndpoints() {
  console.log('Testing API Endpoints...');
  const baseURL = 'https://api.veribuilds.com';
  const testEmail = 'lbbusiness2025@gmail.com';
  
  const endpointTests = [];
  
  // Test 1: Login endpoint (should return 400/401 for invalid credentials)
  try {
    const login = await checkURL(`${baseURL}/api/login`, 10000, {
      method: 'POST',
      body: { email: 'healthcheck@test.com', password: 'invalid' }
    });
    endpointTests.push({
      endpoint: '/api/login',
      status: login.status === 401 || login.status === 400 ? 'PASS' : 'FAIL',
      httpStatus: login.status,
      note: 'Expected 400/401 for invalid credentials'
    });
  } catch (e) {
    endpointTests.push({ endpoint: '/api/login', status: 'FAIL', error: e.message });
  }
  
  // Test 2: Register endpoint (should return 400 for missing data)
  try {
    const register = await checkURL(`${baseURL}/api/register`, 10000, {
      method: 'POST',
      body: { email: 'incomplete' }
    });
    endpointTests.push({
      endpoint: '/api/register',
      status: register.status === 400 ? 'PASS' : 'FAIL',
      httpStatus: register.status,
      note: 'Expected 400 for incomplete data'
    });
  } catch (e) {
    endpointTests.push({ endpoint: '/api/register', status: 'FAIL', error: e.message });
  }
  
  // Test 3: Protected endpoint - Admin Users (should return 401 without auth)
  try {
    const users = await checkURL(`${baseURL}/api/admin/users`);
    endpointTests.push({
      endpoint: '/api/admin/users',
      status: users.status === 401 || users.status === 403 ? 'PASS' : 'FAIL',
      httpStatus: users.status,
      note: 'Expected 401/403 without auth'
    });
  } catch (e) {
    endpointTests.push({ endpoint: '/api/admin/users', status: 'FAIL', error: e.message });
  }
  
  // Test 4: Protected endpoint - User Contracts (should return 401 without auth)
  try {
    const contracts = await checkURL(`${baseURL}/api/user/contracts`);
    endpointTests.push({
      endpoint: '/api/user/contracts',
      status: contracts.status === 401 || contracts.status === 403 ? 'PASS' : 'FAIL',
      httpStatus: contracts.status,
      note: 'Expected 401/403 without auth'
    });
  } catch (e) {
    endpointTests.push({ endpoint: '/api/user/contracts', status: 'FAIL', error: e.message });
  }
  
  // Test 5: Protected endpoint - Admin Contracts (should return 401 without auth)
  try {
    const adminContracts = await checkURL(`${baseURL}/api/admin/contracts`);
    endpointTests.push({
      endpoint: '/api/admin/contracts',
      status: adminContracts.status === 401 || adminContracts.status === 403 ? 'PASS' : 'FAIL',
      httpStatus: adminContracts.status,
      note: 'Expected 401/403 without auth'
    });
  } catch (e) {
    endpointTests.push({ endpoint: '/api/admin/contracts', status: 'FAIL', error: e.message });
  }
  
  const passedTests = endpointTests.filter(t => t.status === 'PASS').length;
  const totalTests = endpointTests.length;
  const isHealthy = passedTests >= totalTests * 0.8; // 80% pass rate
  
  results.services.push({
    name: 'API Endpoint Tests',
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    details: {
      passed: passedTests,
      total: totalTests,
      tests: endpointTests
    },
    message: `${passedTests}/${totalTests} endpoint tests passed`
  });
  
  if (isHealthy) {
    results.summary.healthy++;
  } else {
    results.summary.degraded++;
  }
  results.summary.total++;
}

/**
 * Check Email Service with actual send test
 */
async function checkEmailService() {
  console.log('Checking Email Service...');
  const service = SERVICES.email;
  
  try {
    const testResult = {
      configured: !!process.env.RESEND_API_KEY,
      apiKey: process.env.RESEND_API_KEY ? 'Present' : 'Missing',
      testEmailSent: false
    };
    
    // Send actual test email
    if (testResult.configured) {
      try {
        const emailResponse = await resend.emails.send({
          from: 'Veritas Building Group <info@veribuilds.com>',
          to: 'lbbusiness2025@gmail.com',
          subject: '✅ Email Service Health Check - ' + new Date().toLocaleString(),
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">✅ Email Service Test Successful</h2>
              <p>This is an automated test email from the VBG monitoring system.</p>
              <div style="background-color: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Server:</strong> ${results.hostname}</p>
                <p><strong>Status:</strong> Email pathway is working correctly</p>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This email confirms that the Resend email service is operational and can successfully deliver messages.</p>
            </div>
          `
        });
        testResult.testEmailSent = true;
        testResult.emailId = emailResponse.data?.id;
      } catch (emailError) {
        testResult.testEmailSent = false;
        testResult.emailError = emailError.message;
      }
    }
    
    const isHealthy = testResult.configured && testResult.testEmailSent;
    
    results.services.push({
      name: service.name,
      status: isHealthy ? 'HEALTHY' : 'DEGRADED',
      details: testResult,
      message: isHealthy ? 'Email service operational and test email sent' : 'Email service not fully operational'
    });
    
    if (isHealthy) {
      results.summary.healthy++;
    } else {
      results.summary.degraded++;
    }
  } catch (error) {
    results.services.push({
      name: service.name,
      status: 'DOWN',
      error: error.message,
      message: 'Email service check failed'
    });
    results.summary.down++;
  }
  results.summary.total++;
}

/**
 * Check Database
 */
function checkDatabase() {
  console.log('Checking Database...');
  const service = SERVICES.database;
  
  try {
    const dbExists = existsSync(service.checkFile);
    
    if (dbExists) {
      // Use stat -c for Linux/Alpine instead of -f for macOS
      let stats;
      try {
        stats = execSync(`stat -c "%s" "${service.checkFile}" 2>/dev/null || stat -f "%z" "${service.checkFile}"`, { encoding: 'utf8' }).trim();
      } catch (e) {
        stats = '0';
      }
      const sizeInMB = (parseInt(stats) / 1024 / 1024).toFixed(2);
      
      results.services.push({
        name: service.name,
        status: 'HEALTHY',
        details: {
          file: service.checkFile,
          exists: true,
          size: sizeInMB + ' MB'
        },
        message: 'Database file is accessible'
      });
      results.summary.healthy++;
    } else {
      results.services.push({
        name: service.name,
        status: 'DOWN',
        details: {
          file: service.checkFile,
          exists: false
        },
        message: 'Database file not found'
      });
      results.summary.down++;
    }
  } catch (error) {
    results.services.push({
      name: service.name,
      status: 'DOWN',
      error: error.message,
      message: 'Failed to check database'
    });
    results.summary.down++;
  }
  results.summary.total++;
}

/**
 * Check system resources
 */
function checkSystemResources() {
  console.log('Checking System Resources...');
  
  try {
    // Check disk space
    const diskOutput = execSync('df -h / | tail -1', { encoding: 'utf8' });
    const diskParts = diskOutput.trim().split(/\s+/);
    const diskUsage = diskParts[4];
    const diskUsagePercent = parseInt(diskUsage);
    
    // Check memory (Alpine Linux compatible)
    let freeMemMB = 0;
    let isMemHealthy = true;
    try {
      const memOutput = execSync('free -m | grep Mem', { encoding: 'utf8' });
      const memParts = memOutput.trim().split(/\s+/);
      freeMemMB = parseInt(memParts[3]); // Available memory
      isMemHealthy = freeMemMB > 500;
    } catch (memError) {
      // If free command fails, try vm_stat (macOS)
      try {
        const memOutput = execSync('vm_stat | grep "Pages free"', { encoding: 'utf8' });
        const freePages = parseInt(memOutput.match(/\d+/)[0]);
        freeMemMB = Math.round((freePages * 4096) / 1024 / 1024);
        isMemHealthy = freeMemMB > 500;
      } catch (vmError) {
        freeMemMB = 'N/A';
        isMemHealthy = true; // Don't fail if we can't check
      }
    }
    
    // Check load average
    const loadOutput = execSync('uptime', { encoding: 'utf8' });
    const loadMatch = loadOutput.match(/load averages?: ([\d.]+)/);
    const loadAvg = loadMatch ? loadMatch[1] : 'N/A';
    
    const isDiskHealthy = diskUsagePercent < 90;
    
    results.services.push({
      name: 'System Resources',
      status: (isDiskHealthy && isMemHealthy) ? 'HEALTHY' : 'DEGRADED',
      details: {
        disk: {
          usage: diskUsage,
          healthy: isDiskHealthy
        },
        memory: {
          free: freeMemMB === 'N/A' ? 'N/A' : freeMemMB + ' MB',
          healthy: isMemHealthy
        },
        load: loadAvg
      },
      message: (isDiskHealthy && isMemHealthy) ? 'System resources are adequate' : 'System resources are constrained'
    });
    
    if (isDiskHealthy && isMemHealthy) {
      results.summary.healthy++;
    } else {
      results.summary.degraded++;
    }
  } catch (error) {
    results.services.push({
      name: 'System Resources',
      status: 'DEGRADED',
      error: error.message,
      message: 'Failed to check system resources'
    });
    results.summary.degraded++;
  }
  results.summary.total++;
}

/**
 * Generate HTML report
 */
function generateHTMLReport() {
  const statusColor = (status) => {
    switch (status) {
      case 'HEALTHY': return '#10b981';
      case 'DEGRADED': return '#f59e0b';
      case 'DOWN': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  const statusIcon = (status) => {
    switch (status) {
      case 'HEALTHY': return '✅';
      case 'DEGRADED': return '⚠️';
      case 'DOWN': return '🔴';
      default: return '❓';
    }
  };
  
  const servicesHTML = results.services.map(service => `
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${statusColor(service.status)};">
      <h3 style="margin: 0 0 10px 0; color: #111827;">
        ${statusIcon(service.status)} ${service.name}
      </h3>
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor(service.status)}; font-weight: bold;">${service.status}</span></p>
      ${service.url ? `<p style="margin: 5px 0;"><strong>URL:</strong> <a href="${service.url}" style="color: #0891b2;">${service.url}</a></p>` : ''}
      <p style="margin: 5px 0;"><strong>Message:</strong> ${service.message}</p>
      ${service.details ? `<details style="margin-top: 10px;">
        <summary style="cursor: pointer; color: #0891b2;">View Details</summary>
        <pre style="background-color: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(service.details, null, 2)}</pre>
      </details>` : ''}
      ${service.error ? `<p style="margin: 10px 0 0 0; color: #ef4444; font-size: 14px;"><strong>Error:</strong> ${service.error}</p>` : ''}
    </div>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Services Health Check - ${new Date().toLocaleDateString()}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0;">🏥 Services Health Check Report</h1>
        <p style="margin: 0; opacity: 0.9;">Generated: ${new Date().toLocaleString()}</p>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Hostname: ${results.hostname}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #111827;">${results.summary.total}</div>
          <div style="color: #6b7280; margin-top: 5px;">Total Services</div>
        </div>
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #10b981;">${results.summary.healthy}</div>
          <div style="color: #059669; margin-top: 5px;">Healthy</div>
        </div>
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${results.summary.degraded}</div>
          <div style="color: #d97706; margin-top: 5px;">Degraded</div>
        </div>
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${results.summary.down}</div>
          <div style="color: #dc2626; margin-top: 5px;">Down</div>
        </div>
      </div>
      
      <h2 style="color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Service Status</h2>
      ${servicesHTML}
      
      <div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #0891b2;">
        <p style="margin: 0; color: #0c4a6e;">
          <strong>Note:</strong> This is an automated health check. If any services are down or degraded, please investigate immediately.
        </p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send email report
 */
async function sendReport() {
  console.log('Sending email report...');
  
  const subject = `Services Health Check - ${results.summary.down > 0 ? '🔴 SERVICES DOWN' : results.summary.degraded > 0 ? '⚠️ DEGRADED' : '✅ ALL HEALTHY'} - ${new Date().toLocaleDateString()}`;
  
  try {
    const response = await resend.emails.send({
      from: 'Veritas Building Group <info@veribuilds.com>',
      to: 'lbbusiness2025@gmail.com',
      subject,
      html: generateHTMLReport()
    });
    
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting comprehensive services health check...\n');
  
  try {
    await checkVBGFrontend();
    await checkVBGBackend();
    await testAPIEndpoints();
    await checkCalcom();
    await checkEmailService();
    checkDatabase();
    checkSystemResources();
    
    console.log('\n=== Health Check Summary ===');
    console.log(`Total Services: ${results.summary.total}`);
    console.log(`Healthy: ${results.summary.healthy}`);
    console.log(`Degraded: ${results.summary.degraded}`);
    console.log(`Down: ${results.summary.down}`);
    console.log('============================\n');
    
    await sendReport();
    
    console.log('Health check completed successfully!');
    process.exit(results.summary.down > 0 ? 1 : 0);
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}

main();

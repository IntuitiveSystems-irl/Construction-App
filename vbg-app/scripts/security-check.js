#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Resend } from 'resend';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const resend = new Resend(process.env.RESEND_API_KEY);

// Security checks configuration
const CHECKS = {
  npmAudit: true,
  outdatedPackages: true,
  envFilePermissions: true,
  sslCertificates: true,
  filePermissions: true,
  suspiciousFiles: true
};

const results = {
  timestamp: new Date().toISOString(),
  hostname: execSync('hostname').toString().trim(),
  checks: [],
  summary: {
    total: 0,
    passed: 0,
    warnings: 0,
    critical: 0
  }
};

/**
 * Run npm audit to check for vulnerabilities
 */
function checkNpmAudit() {
  console.log('Running npm audit...');
  try {
    const output = execSync('npm audit --json', { 
      cwd: join(__dirname, '..'),
      encoding: 'utf8'
    });
    const audit = JSON.parse(output);
    
    const vulnerabilities = audit.metadata?.vulnerabilities || {};
    const total = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
    
    results.checks.push({
      name: 'NPM Security Audit',
      status: total === 0 ? 'PASS' : (vulnerabilities.critical > 0 || vulnerabilities.high > 0 ? 'CRITICAL' : 'WARNING'),
      details: {
        total: total,
        critical: vulnerabilities.critical || 0,
        high: vulnerabilities.high || 0,
        moderate: vulnerabilities.moderate || 0,
        low: vulnerabilities.low || 0
      },
      message: total === 0 ? 'No vulnerabilities found' : `Found ${total} vulnerabilities`
    });
    
    if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
      results.summary.critical++;
    } else if (total > 0) {
      results.summary.warnings++;
    } else {
      results.summary.passed++;
    }
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities found
    try {
      const audit = JSON.parse(error.stdout || '{}');
      const vulnerabilities = audit.metadata?.vulnerabilities || {};
      const total = Object.values(vulnerabilities).reduce((sum, count) => sum + count, 0);
      
      results.checks.push({
        name: 'NPM Security Audit',
        status: vulnerabilities.critical > 0 || vulnerabilities.high > 0 ? 'CRITICAL' : 'WARNING',
        details: vulnerabilities,
        message: `Found ${total} vulnerabilities`
      });
      
      if (vulnerabilities.critical > 0 || vulnerabilities.high > 0) {
        results.summary.critical++;
      } else {
        results.summary.warnings++;
      }
    } catch (parseError) {
      results.checks.push({
        name: 'NPM Security Audit',
        status: 'WARNING',
        message: 'Failed to parse audit results',
        error: error.message
      });
      results.summary.warnings++;
    }
  }
  results.summary.total++;
}

/**
 * Check for outdated packages
 */
function checkOutdatedPackages() {
  console.log('Checking for outdated packages...');
  try {
    const output = execSync('npm outdated --json', { 
      cwd: join(__dirname, '..'),
      encoding: 'utf8'
    });
    
    const outdated = output ? JSON.parse(output) : {};
    const count = Object.keys(outdated).length;
    
    results.checks.push({
      name: 'Outdated Packages',
      status: count === 0 ? 'PASS' : 'WARNING',
      details: { count, packages: Object.keys(outdated) },
      message: count === 0 ? 'All packages up to date' : `${count} packages outdated`
    });
    
    if (count > 0) {
      results.summary.warnings++;
    } else {
      results.summary.passed++;
    }
  } catch (error) {
    // npm outdated returns exit code 1 when packages are outdated
    const outdated = error.stdout ? JSON.parse(error.stdout) : {};
    const count = Object.keys(outdated).length;
    
    results.checks.push({
      name: 'Outdated Packages',
      status: 'WARNING',
      details: { count, packages: Object.keys(outdated).slice(0, 10) },
      message: `${count} packages outdated`
    });
    results.summary.warnings++;
  }
  results.summary.total++;
}

/**
 * Check environment file permissions
 */
function checkEnvFilePermissions() {
  console.log('Checking .env file permissions...');
  const envPath = join(__dirname, '..', '.env');
  
  if (!existsSync(envPath)) {
    results.checks.push({
      name: 'Environment File Permissions',
      status: 'WARNING',
      message: '.env file not found'
    });
    results.summary.warnings++;
    results.summary.total++;
    return;
  }
  
  try {
    const stats = execSync(`stat -f "%Lp" "${envPath}"`, { encoding: 'utf8' }).trim();
    const isSecure = stats === '600' || stats === '400';
    
    results.checks.push({
      name: 'Environment File Permissions',
      status: isSecure ? 'PASS' : 'WARNING',
      details: { permissions: stats },
      message: isSecure ? 'Secure permissions (600)' : `Insecure permissions (${stats}), should be 600`
    });
    
    if (isSecure) {
      results.summary.passed++;
    } else {
      results.summary.warnings++;
    }
  } catch (error) {
    results.checks.push({
      name: 'Environment File Permissions',
      status: 'WARNING',
      message: 'Failed to check permissions',
      error: error.message
    });
    results.summary.warnings++;
  }
  results.summary.total++;
}

/**
 * Check SSL certificate expiration
 */
function checkSSLCertificates() {
  console.log('Checking SSL certificates...');
  const domains = ['veribuilds.com', 'api.veribuilds.com', 'schedule.veribuilds.com'];
  const certResults = [];
  
  for (const domain of domains) {
    try {
      const output = execSync(
        `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates`,
        { encoding: 'utf8' }
      );
      
      const notAfterMatch = output.match(/notAfter=(.+)/);
      if (notAfterMatch) {
        const expiryDate = new Date(notAfterMatch[1]);
        const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
        
        certResults.push({
          domain,
          expiryDate: expiryDate.toISOString(),
          daysUntilExpiry,
          status: daysUntilExpiry > 30 ? 'OK' : (daysUntilExpiry > 7 ? 'WARNING' : 'CRITICAL')
        });
      }
    } catch (error) {
      certResults.push({
        domain,
        status: 'ERROR',
        message: 'Failed to check certificate'
      });
    }
  }
  
  const hasCritical = certResults.some(r => r.status === 'CRITICAL');
  const hasWarning = certResults.some(r => r.status === 'WARNING');
  
  results.checks.push({
    name: 'SSL Certificates',
    status: hasCritical ? 'CRITICAL' : (hasWarning ? 'WARNING' : 'PASS'),
    details: certResults,
    message: hasCritical ? 'Certificate(s) expiring soon!' : (hasWarning ? 'Certificate(s) expiring within 30 days' : 'All certificates valid')
  });
  
  if (hasCritical) {
    results.summary.critical++;
  } else if (hasWarning) {
    results.summary.warnings++;
  } else {
    results.summary.passed++;
  }
  results.summary.total++;
}

/**
 * Check for suspicious files
 */
function checkSuspiciousFiles() {
  console.log('Checking for suspicious files...');
  const suspiciousPatterns = [
    '*.log',
    '.DS_Store',
    'npm-debug.log*',
    '.env.backup',
    '*.key',
    '*.pem'
  ];
  
  const foundFiles = [];
  for (const pattern of suspiciousPatterns) {
    try {
      const output = execSync(`find ${join(__dirname, '..')} -name "${pattern}" -type f 2>/dev/null || true`, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024
      }).trim();
      
      if (output) {
        foundFiles.push(...output.split('\n').filter(f => f && !f.includes('node_modules')));
      }
    } catch (error) {
      // Ignore errors
    }
  }
  
  results.checks.push({
    name: 'Suspicious Files',
    status: foundFiles.length === 0 ? 'PASS' : 'WARNING',
    details: { count: foundFiles.length, files: foundFiles.slice(0, 20) },
    message: foundFiles.length === 0 ? 'No suspicious files found' : `Found ${foundFiles.length} suspicious files`
  });
  
  if (foundFiles.length > 0) {
    results.summary.warnings++;
  } else {
    results.summary.passed++;
  }
  results.summary.total++;
}

/**
 * Generate HTML report
 */
function generateHTMLReport() {
  const statusColor = (status) => {
    switch (status) {
      case 'PASS': return '#10b981';
      case 'WARNING': return '#f59e0b';
      case 'CRITICAL': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  const checksHTML = results.checks.map(check => `
    <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${statusColor(check.status)};">
      <h3 style="margin: 0 0 10px 0; color: #111827;">
        <span style="color: ${statusColor(check.status)};">●</span> ${check.name}
      </h3>
      <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: ${statusColor(check.status)}; font-weight: bold;">${check.status}</span></p>
      <p style="margin: 5px 0;"><strong>Message:</strong> ${check.message}</p>
      ${check.details ? `<details style="margin-top: 10px;">
        <summary style="cursor: pointer; color: #0891b2;">View Details</summary>
        <pre style="background-color: #fff; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(check.details, null, 2)}</pre>
      </details>` : ''}
    </div>
  `).join('');
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Security Check Report - ${new Date().toLocaleDateString()}</title>
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); padding: 30px; border-radius: 12px; color: white; margin-bottom: 30px;">
        <h1 style="margin: 0 0 10px 0;">🔒 Security Check Report</h1>
        <p style="margin: 0; opacity: 0.9;">Generated: ${new Date().toLocaleString()}</p>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">Hostname: ${results.hostname}</p>
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px;">
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #111827;">${results.summary.total}</div>
          <div style="color: #6b7280; margin-top: 5px;">Total Checks</div>
        </div>
        <div style="background-color: #d1fae5; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #10b981;">${results.summary.passed}</div>
          <div style="color: #059669; margin-top: 5px;">Passed</div>
        </div>
        <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #f59e0b;">${results.summary.warnings}</div>
          <div style="color: #d97706; margin-top: 5px;">Warnings</div>
        </div>
        <div style="background-color: #fee2e2; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; color: #ef4444;">${results.summary.critical}</div>
          <div style="color: #dc2626; margin-top: 5px;">Critical</div>
        </div>
      </div>
      
      <h2 style="color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Check Results</h2>
      ${checksHTML}
      
      <div style="margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 8px; border-left: 4px solid #0891b2;">
        <p style="margin: 0; color: #0c4a6e;">
          <strong>Note:</strong> This is an automated security check. Please review any warnings or critical issues and take appropriate action.
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
  
  const subject = `Security Check Report - ${results.summary.critical > 0 ? '🚨 CRITICAL' : results.summary.warnings > 0 ? '⚠️ WARNINGS' : '✅ ALL CLEAR'} - ${new Date().toLocaleDateString()}`;
  
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
  console.log('Starting security checks...\n');
  
  try {
    if (CHECKS.npmAudit) checkNpmAudit();
    if (CHECKS.outdatedPackages) checkOutdatedPackages();
    if (CHECKS.envFilePermissions) checkEnvFilePermissions();
    if (CHECKS.sslCertificates) checkSSLCertificates();
    if (CHECKS.suspiciousFiles) checkSuspiciousFiles();
    
    console.log('\n=== Security Check Summary ===');
    console.log(`Total Checks: ${results.summary.total}`);
    console.log(`Passed: ${results.summary.passed}`);
    console.log(`Warnings: ${results.summary.warnings}`);
    console.log(`Critical: ${results.summary.critical}`);
    console.log('==============================\n');
    
    await sendReport();
    
    console.log('Security check completed successfully!');
    process.exit(results.summary.critical > 0 ? 1 : 0);
  } catch (error) {
    console.error('Security check failed:', error);
    process.exit(1);
  }
}

main();

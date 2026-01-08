#!/usr/bin/env node
/**
 * Daily Security & Performance Monitor
 * Sends email reports via Resend API
 * 
 * Run manually: node scripts/security-monitor.js
 * Set up cron: 0 9 * * * cd /root/vbg-app && node scripts/security-monitor.js
 */

import { execSync } from 'child_process';
import https from 'https';
import http from 'http';

// Configuration - uses environment variables
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const REPORT_EMAIL = process.env.REPORT_EMAIL || 'info@veribuilds.com';
const FROM_EMAIL = 'Veritas Security Monitor <info@veribuilds.com>';
const SITES_TO_CHECK = [
  { name: 'VBG App', url: 'https://app.veribuilds.com' },
  { name: 'VBG API', url: 'https://app.veribuilds.com/api/profile', expectStatus: 401 }, // 401 is expected without auth
];

// Helper to run shell commands safely
function runCommand(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', timeout: 30000 }).trim();
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

// Check HTTP endpoint
function checkEndpoint(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.get(url, { timeout: 10000 }, (res) => {
      const responseTime = Date.now() - startTime;
      resolve({
        status: res.statusCode,
        responseTime,
        ok: res.statusCode >= 200 && res.statusCode < 500 // 4xx is OK (means server is responding)
      });
    });
    
    req.on('error', (e) => {
      resolve({ status: 0, responseTime: 0, ok: false, error: e.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 0, responseTime: 10000, ok: false, error: 'Timeout' });
    });
  });
}

// Get system metrics
function getSystemMetrics() {
  const uptime = runCommand('uptime');
  const loadMatch = uptime.match(/load average[s]?:\s*([\d.]+)/);
  const load = loadMatch ? parseFloat(loadMatch[1]) : 0;
  
  const memInfo = runCommand('free -m 2>/dev/null || echo "N/A"');
  let memUsed = 0, memTotal = 0;
  const memMatch = memInfo.match(/Mem:\s+(\d+)\s+(\d+)/);
  if (memMatch) {
    memTotal = parseInt(memMatch[1]);
    memUsed = parseInt(memMatch[2]);
  }
  
  const diskInfo = runCommand('df -h / 2>/dev/null | tail -1 || echo "N/A"');
  const diskMatch = diskInfo.match(/(\d+)%/);
  const diskUsage = diskMatch ? parseInt(diskMatch[1]) : 0;
  
  return { load, memUsed, memTotal, diskUsage, uptime };
}

// Check for suspicious processes
function checkSuspiciousProcesses() {
  const suspicious = [];
  const processes = runCommand('ps aux 2>/dev/null || echo ""');
  
  const suspiciousPatterns = [
    /\/var\/tmp\//,
    /\/tmp\/[a-z]+$/,
    /dockerd-daemon/,
    /cryptominer/,
    /xmrig/,
    /minerd/,
  ];
  
  processes.split('\n').forEach(line => {
    suspiciousPatterns.forEach(pattern => {
      if (pattern.test(line)) {
        suspicious.push(line.trim());
      }
    });
  });
  
  return suspicious;
}

// Check for failed SSH attempts
function checkFailedLogins() {
  const result = runCommand('grep -i "failed password" /var/log/messages 2>/dev/null | tail -10 || echo "No failed logins found"');
  const count = (result.match(/Failed password/gi) || []).length;
  return { count, recent: result };
}

// Check PM2 processes
function checkPM2Status() {
  const status = runCommand('pm2 jlist 2>/dev/null || echo "[]"');
  try {
    const processes = JSON.parse(status);
    return processes.map(p => ({
      name: p.name,
      status: p.pm2_env?.status || 'unknown',
      restarts: p.pm2_env?.restart_time || 0,
      memory: Math.round((p.monit?.memory || 0) / 1024 / 1024),
      cpu: p.monit?.cpu || 0
    }));
  } catch {
    return [];
  }
}

// Check npm vulnerabilities
function checkNpmVulnerabilities() {
  const result = runCommand('cd /root/vbg-app && npm audit --json 2>/dev/null || echo "{}"');
  try {
    const audit = JSON.parse(result);
    return {
      total: audit.metadata?.vulnerabilities?.total || 0,
      critical: audit.metadata?.vulnerabilities?.critical || 0,
      high: audit.metadata?.vulnerabilities?.high || 0
    };
  } catch {
    return { total: 0, critical: 0, high: 0 };
  }
}

// Check open ports
function checkOpenPorts() {
  const result = runCommand('netstat -tlnp 2>/dev/null | grep LISTEN || echo "N/A"');
  return result;
}

// Check established connections
function checkConnections() {
  const result = runCommand('netstat -anp 2>/dev/null | grep ESTABLISHED | grep -v "127.0.0.1" || echo "None"');
  return result;
}

// Generate HTML report
function generateReport(data) {
  const statusIcon = (ok) => ok ? '✅' : '❌';
  const warningIcon = (warn) => warn ? '⚠️' : '✅';
  
  const sitesHtml = data.sites.map(s => `
    <tr>
      <td>${s.name}</td>
      <td>${statusIcon(s.ok)} ${s.status || s.error}</td>
      <td>${s.responseTime}ms</td>
    </tr>
  `).join('');
  
  const pm2Html = data.pm2.map(p => `
    <tr>
      <td>${p.name}</td>
      <td>${statusIcon(p.status === 'online')} ${p.status}</td>
      <td>${p.restarts}</td>
      <td>${p.memory}MB</td>
      <td>${p.cpu}%</td>
    </tr>
  `).join('');
  
  const suspiciousHtml = data.suspicious.length > 0 
    ? `<pre style="background:#fee;padding:10px;border-radius:4px;">${data.suspicious.join('\n')}</pre>`
    : '<p style="color:green;">No suspicious processes detected</p>';

  const overallStatus = data.sites.every(s => s.ok) && 
                        data.pm2.every(p => p.status === 'online') &&
                        data.suspicious.length === 0 &&
                        data.vulnerabilities.critical === 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #1a365d; }
    h2 { color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f7fafc; font-weight: 600; }
    .status-banner { padding: 16px; border-radius: 8px; margin-bottom: 24px; }
    .status-ok { background: #c6f6d5; color: #22543d; }
    .status-warn { background: #fed7d7; color: #742a2a; }
    .metric { display: inline-block; margin: 8px 16px 8px 0; }
    .metric-value { font-size: 24px; font-weight: bold; color: #2d3748; }
    .metric-label { font-size: 12px; color: #718096; }
    pre { overflow-x: auto; font-size: 12px; }
  </style>
</head>
<body>
  <h1>🔒 VBG Security & Performance Report</h1>
  <p>Generated: ${new Date().toLocaleString()}</p>
  
  <div class="status-banner ${overallStatus ? 'status-ok' : 'status-warn'}">
    ${overallStatus ? '✅ All systems operational' : '⚠️ Issues detected - review below'}
  </div>

  <h2>📊 System Metrics</h2>
  <div>
    <div class="metric">
      <div class="metric-value">${data.system.load.toFixed(2)}</div>
      <div class="metric-label">Load Average</div>
    </div>
    <div class="metric">
      <div class="metric-value">${data.system.memUsed}/${data.system.memTotal}MB</div>
      <div class="metric-label">Memory Used</div>
    </div>
    <div class="metric">
      <div class="metric-value">${data.system.diskUsage}%</div>
      <div class="metric-label">Disk Usage</div>
    </div>
  </div>

  <h2>🌐 Website Status</h2>
  <table>
    <tr><th>Site</th><th>Status</th><th>Response Time</th></tr>
    ${sitesHtml}
  </table>

  <h2>⚙️ PM2 Processes</h2>
  <table>
    <tr><th>Process</th><th>Status</th><th>Restarts</th><th>Memory</th><th>CPU</th></tr>
    ${pm2Html}
  </table>

  <h2>🔍 Security Checks</h2>
  
  <h3>Suspicious Processes</h3>
  ${suspiciousHtml}
  
  <h3>NPM Vulnerabilities</h3>
  <p>
    ${warningIcon(data.vulnerabilities.critical > 0)} Critical: ${data.vulnerabilities.critical} | 
    ${warningIcon(data.vulnerabilities.high > 0)} High: ${data.vulnerabilities.high} | 
    Total: ${data.vulnerabilities.total}
  </p>
  
  <h3>Failed SSH Attempts (last 10)</h3>
  <p>${data.failedLogins.count} failed login attempts detected</p>
  
  <h3>Established Connections</h3>
  <pre style="background:#f7fafc;padding:10px;border-radius:4px;font-size:11px;">${data.connections}</pre>

  <hr style="margin-top:32px;">
  <p style="color:#718096;font-size:12px;">
    This is an automated security report from your VBG server (31.97.144.132).<br>
    To stop receiving these emails, remove the cron job on the server.
  </p>
</body>
</html>
  `;
}

// Send email via Resend
async function sendEmail(html, hasIssues) {
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return;
  }

  const subject = hasIssues 
    ? '⚠️ VBG Security Alert - Issues Detected'
    : '✅ VBG Daily Security Report - All Clear';

  const data = JSON.stringify({
    from: FROM_EMAIL,
    to: [REPORT_EMAIL],
    subject: subject,
    html: html
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Email sent successfully');
          resolve(body);
        } else {
          console.error('❌ Failed to send email:', body);
          reject(new Error(body));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Main function
async function main() {
  console.log('🔍 Running security and performance check...\n');

  // Collect all data
  const data = {
    sites: [],
    system: getSystemMetrics(),
    pm2: checkPM2Status(),
    suspicious: checkSuspiciousProcesses(),
    vulnerabilities: checkNpmVulnerabilities(),
    failedLogins: checkFailedLogins(),
    connections: checkConnections(),
    ports: checkOpenPorts()
  };

  // Check all sites
  for (const site of SITES_TO_CHECK) {
    console.log(`Checking ${site.name}...`);
    const result = await checkEndpoint(site.url);
    data.sites.push({ ...site, ...result });
  }

  // Determine if there are issues
  const hasIssues = !data.sites.every(s => s.ok) || 
                    !data.pm2.every(p => p.status === 'online') ||
                    data.suspicious.length > 0 ||
                    data.vulnerabilities.critical > 0 ||
                    data.system.load > 5 ||
                    data.system.diskUsage > 90;

  // Generate and send report
  const html = generateReport(data);
  
  console.log('\n📊 Report Summary:');
  console.log(`   Sites: ${data.sites.filter(s => s.ok).length}/${data.sites.length} OK`);
  console.log(`   PM2: ${data.pm2.filter(p => p.status === 'online').length}/${data.pm2.length} online`);
  console.log(`   Load: ${data.system.load.toFixed(2)}`);
  console.log(`   Suspicious processes: ${data.suspicious.length}`);
  console.log(`   Vulnerabilities: ${data.vulnerabilities.total} (${data.vulnerabilities.critical} critical)`);
  console.log(`   Failed logins: ${data.failedLogins.count}`);
  
  await sendEmail(html, hasIssues);
}

main().catch(console.error);

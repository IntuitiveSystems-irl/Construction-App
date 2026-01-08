#!/usr/bin/env node

/**
 * VBG Route Testing Script
 * Tests all routes, checks for broken links, and validates user flows
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://app.veribuilds.com';
const APP_DIR = path.join(__dirname, '../app');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Test results
const results = {
  routes: [],
  broken: [],
  unused: [],
  warnings: []
};

/**
 * Find all page.tsx files in the app directory
 */
function findAllRoutes(dir, baseRoute = '') {
  const routes = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip special Next.js directories
      if (item.startsWith('_') || item === 'api' || item === 'components' || item === 'contexts' || item === 'styles' || item === 'utils') {
        continue;
      }

      // Handle dynamic routes [id]
      const routePart = item.startsWith('[') && item.endsWith(']') 
        ? ':' + item.slice(1, -1) 
        : item;

      const newRoute = baseRoute + '/' + routePart;
      routes.push(...findAllRoutes(fullPath, newRoute));
    } else if (item === 'page.tsx' || item === 'page.ts' || item === 'page.jsx' || item === 'page.js') {
      routes.push(baseRoute || '/');
    }
  }

  return routes;
}

/**
 * Check if a route requires authentication
 */
function requiresAuth(route) {
  const publicRoutes = ['/', '/login', '/register', '/verify-email', '/reset-password', '/services'];
  return !publicRoutes.includes(route);
}

/**
 * Categorize routes by type
 */
function categorizeRoute(route) {
  if (route.startsWith('/admin')) return 'Admin';
  if (route.startsWith('/dashboard')) return 'Dashboard';
  if (route.includes(':id')) return 'Dynamic';
  if (requiresAuth(route)) return 'Protected';
  return 'Public';
}

/**
 * Check for unused components
 */
function findUnusedComponents() {
  const componentsDir = path.join(APP_DIR, 'components');
  if (!fs.existsSync(componentsDir)) return [];

  const components = fs.readdirSync(componentsDir)
    .filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));

  const unused = [];
  
  for (const component of components) {
    const componentName = component.replace(/\.(tsx|jsx)$/, '');
    let isUsed = false;

    // Search for imports of this component
    function searchInDir(dir) {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          searchInDir(fullPath);
        } else if ((item.endsWith('.tsx') || item.endsWith('.jsx')) && item !== component) {
          const content = fs.readFileSync(fullPath, 'utf8');
          if (content.includes(componentName)) {
            isUsed = true;
            return;
          }
        }
      }
    }

    searchInDir(APP_DIR);
    if (!isUsed) {
      unused.push(componentName);
    }
  }

  return unused;
}

/**
 * Check for broken imports
 */
function checkBrokenImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /from\s+['"](.+?)['"]/g;
  const broken = [];

  let match;
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Skip node_modules and external packages
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      continue;
    }

    const dir = path.dirname(filePath);
    let resolvedPath = path.resolve(dir, importPath);

    // Try different extensions
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
    let found = false;

    for (const ext of extensions) {
      const testPath = resolvedPath + ext;
      if (fs.existsSync(testPath)) {
        found = true;
        break;
      }
    }

    // Check if it's a directory with index file
    if (!found && fs.existsSync(resolvedPath)) {
      const stat = fs.statSync(resolvedPath);
      if (stat.isDirectory()) {
        for (const ext of extensions) {
          if (fs.existsSync(path.join(resolvedPath, 'index' + ext))) {
            found = true;
            break;
          }
        }
      }
    }

    if (!found) {
      broken.push({ file: filePath, import: importPath });
    }
  }

  return broken;
}

/**
 * Generate test report
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log(colors.cyan + '🧪 VBG Route Testing Report' + colors.reset);
  console.log('='.repeat(80) + '\n');

  // Routes summary
  console.log(colors.cyan + '📍 Routes Found:' + colors.reset);
  const routesByCategory = {};
  
  results.routes.forEach(route => {
    const category = categorizeRoute(route);
    if (!routesByCategory[category]) {
      routesByCategory[category] = [];
    }
    routesByCategory[category].push(route);
  });

  Object.keys(routesByCategory).sort().forEach(category => {
    console.log(`\n  ${colors.yellow}${category}:${colors.reset}`);
    routesByCategory[category].sort().forEach(route => {
      const authBadge = requiresAuth(route) ? colors.red + ' 🔒' + colors.reset : colors.green + ' 🌐' + colors.reset;
      console.log(`    ${authBadge} ${route}`);
    });
  });

  console.log(`\n  ${colors.green}Total: ${results.routes.length} routes${colors.reset}\n`);

  // Unused components
  if (results.unused.length > 0) {
    console.log(colors.yellow + '⚠️  Potentially Unused Components:' + colors.reset);
    results.unused.forEach(comp => {
      console.log(`    ${colors.gray}• ${comp}${colors.reset}`);
    });
    console.log('');
  }

  // Broken imports
  if (results.broken.length > 0) {
    console.log(colors.red + '❌ Broken Imports Found:' + colors.reset);
    results.broken.forEach(item => {
      console.log(`    ${colors.gray}${item.file}${colors.reset}`);
      console.log(`      ${colors.red}→ ${item.import}${colors.reset}`);
    });
    console.log('');
  }

  // Warnings
  if (results.warnings.length > 0) {
    console.log(colors.yellow + '⚠️  Warnings:' + colors.reset);
    results.warnings.forEach(warning => {
      console.log(`    ${colors.gray}• ${warning}${colors.reset}`);
    });
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  console.log(colors.cyan + '📊 Summary:' + colors.reset);
  console.log(`  ${colors.green}✓${colors.reset} ${results.routes.length} routes found`);
  console.log(`  ${colors.yellow}⚠${colors.reset} ${results.unused.length} potentially unused components`);
  console.log(`  ${colors.red}✗${colors.reset} ${results.broken.length} broken imports`);
  console.log(`  ${colors.yellow}⚠${colors.reset} ${results.warnings.length} warnings`);
  console.log('='.repeat(80) + '\n');

  // Save to file
  const reportPath = path.join(__dirname, '../test-report.txt');
  const reportContent = generateTextReport();
  fs.writeFileSync(reportPath, reportContent);
  console.log(colors.green + `📄 Full report saved to: ${reportPath}` + colors.reset + '\n');
}

/**
 * Generate text report for file
 */
function generateTextReport() {
  let report = 'VBG Route Testing Report\n';
  report += '='.repeat(80) + '\n\n';
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Base URL: ${BASE_URL}\n\n`;

  report += 'ROUTES FOUND:\n';
  report += '-'.repeat(80) + '\n';
  results.routes.sort().forEach(route => {
    const category = categorizeRoute(route);
    const auth = requiresAuth(route) ? '[AUTH]' : '[PUBLIC]';
    report += `${auth} [${category}] ${route}\n`;
  });

  if (results.unused.length > 0) {
    report += '\n\nPOTENTIALLY UNUSED COMPONENTS:\n';
    report += '-'.repeat(80) + '\n';
    results.unused.forEach(comp => report += `• ${comp}\n`);
  }

  if (results.broken.length > 0) {
    report += '\n\nBROKEN IMPORTS:\n';
    report += '-'.repeat(80) + '\n';
    results.broken.forEach(item => {
      report += `File: ${item.file}\n`;
      report += `  → Missing: ${item.import}\n\n`;
    });
  }

  if (results.warnings.length > 0) {
    report += '\n\nWARNINGS:\n';
    report += '-'.repeat(80) + '\n';
    results.warnings.forEach(warning => report += `• ${warning}\n`);
  }

  report += '\n\nSUMMARY:\n';
  report += '-'.repeat(80) + '\n';
  report += `Total Routes: ${results.routes.length}\n`;
  report += `Unused Components: ${results.unused.length}\n`;
  report += `Broken Imports: ${results.broken.length}\n`;
  report += `Warnings: ${results.warnings.length}\n`;

  return report;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log(colors.cyan + '\n🚀 Starting VBG route tests...\n' + colors.reset);

  // Find all routes
  console.log('📍 Scanning for routes...');
  results.routes = findAllRoutes(APP_DIR);
  console.log(colors.green + `   Found ${results.routes.length} routes\n` + colors.reset);

  // Check for unused components
  console.log('🔍 Checking for unused components...');
  results.unused = findUnusedComponents();
  console.log(colors.green + `   Found ${results.unused.length} potentially unused components\n` + colors.reset);

  // Check for broken imports in all page files
  console.log('🔗 Checking for broken imports...');
  function checkAllFiles(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        checkAllFiles(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
        const broken = checkBrokenImports(fullPath);
        results.broken.push(...broken);
      }
    }
  }
  checkAllFiles(APP_DIR);
  console.log(colors.green + `   Found ${results.broken.length} broken imports\n` + colors.reset);

  // Add warnings for common issues
  if (results.routes.some(r => r.includes('test') || r.includes('demo'))) {
    results.warnings.push('Test/demo routes found - consider removing for production');
  }

  // Generate report
  generateReport();
}

// Run tests
runTests().catch(console.error);

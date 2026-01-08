#!/usr/bin/env node

/**
 * SSL Certificate Generator for Rooster Construction Management
 * Generates self-signed certificates for development and testing
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sslDir = path.join(__dirname, 'ssl');
const keyPath = path.join(sslDir, 'private-key.pem');
const certPath = path.join(sslDir, 'certificate.pem');

console.log('🔐 Generating SSL certificates for Rooster Construction Management...');

// Create SSL directory if it doesn't exist
if (!fs.existsSync(sslDir)) {
  fs.mkdirSync(sslDir, { recursive: true });
  console.log('✅ Created SSL directory');
}

try {
  // Generate private key
  console.log('🔑 Generating private key...');
  execSync(`openssl genrsa -out "${keyPath}" 2048`, { stdio: 'inherit' });
  
  // Generate certificate signing request and certificate
  console.log('📜 Generating certificate...');
  const certConfig = `
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = Washington
L = Spokane
O = Rooster Construction LLC
OU = IT Department
CN = 31.97.144.132
emailAddress = niko@roosterconstruction.org

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 31.97.144.132
DNS.3 = roosterconstruction.org
DNS.4 = www.roosterconstruction.org
IP.1 = 127.0.0.1
IP.2 = 31.97.144.132
  `.trim();
  
  const configPath = path.join(sslDir, 'cert.conf');
  fs.writeFileSync(configPath, certConfig);
  
  execSync(`openssl req -new -x509 -key "${keyPath}" -out "${certPath}" -days 365 -config "${configPath}"`, { stdio: 'inherit' });
  
  // Clean up config file
  fs.unlinkSync(configPath);
  
  console.log('✅ SSL certificates generated successfully!');
  console.log(`📁 Private key: ${keyPath}`);
  console.log(`📁 Certificate: ${certPath}`);
  console.log('');
  console.log('🚀 You can now start the server with HTTPS enabled');
  console.log('💡 Note: Browsers will show a security warning for self-signed certificates');
  console.log('   Click "Advanced" and "Proceed to site" to continue');
  
} catch (error) {
  console.error('❌ Error generating SSL certificates:', error.message);
  console.log('');
  console.log('🔧 Make sure OpenSSL is installed:');
  console.log('   macOS: brew install openssl');
  console.log('   Ubuntu: sudo apt-get install openssl');
  console.log('   Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
  process.exit(1);
}

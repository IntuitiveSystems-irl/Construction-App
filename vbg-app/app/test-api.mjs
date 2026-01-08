import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path, { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import FormData from 'form-data';
import axios from 'axios';
import { wrapper } from 'axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';

// Setup ESM __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env variables
dotenv.config({ path: join(process.cwd(), '.env') });

// Configuration
const BASE_URL = process.env.API_URL || 'http://31.97.144.132:4000';
const TEST_CREDENTIALS = {
  email: 'lbbusiness2025@gmail.com',
  password: 'Test123!'
};

// Axios instance with cookies
const cookieJar = new CookieJar();
const api = wrapper(axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  jar: cookieJar
}));

let isAuthenticated = false;
let profileId = null;

async function testLogin() {
  try {
    console.log('🔐 Logging in...');
    const response = await api.post('/api/login', TEST_CREDENTIALS);
    if (response.status === 200 && response.data.user) {
      console.log('✅ Login success');
      isAuthenticated = true;
      return true;
    } else {
      throw new Error('Login response invalid');
    }
  } catch (err) {
    console.error('❌ Login failed:', err.message);
    return false;
  }
}

async function testGetProfile() {
  if (!isAuthenticated) await testLogin();

  try {
    console.log('👤 Getting profile...');
    const response = await api.get('/api/profile');
    profileId = response.data.user?.id;
    if (profileId) {
      console.log('✅ Profile retrieved:', profileId);
      return true;
    }
    throw new Error('No profile ID returned');
  } catch (err) {
    console.error('❌ Profile fetch failed:', err.message);
    return false;
  }
}

async function testListDocuments() {
  if (!isAuthenticated) await testLogin();
  if (!profileId) await testGetProfile();

  try {
    console.log('📄 Listing documents...');
    const res = await api.get(`/api/documents?profile_id=${profileId}`);
    console.log(`✅ Found ${res.data.length} documents`);
    return true;
  } catch (err) {
    console.error('❌ Document listing failed:', err.message);
    return false;
  }
}

async function testUploadDocument() {
  if (!isAuthenticated) await testLogin();
  if (!profileId) await testGetProfile();

  const filePath = join(__dirname, 'test-upload.txt');
  await fs.writeFile(filePath, 'API Test Document\n' + new Date().toISOString());

  const form = new FormData();
  form.append('document', createReadStream(filePath), 'test-upload.txt');
  form.append('type', 'text/plain');
  form.append('profile_id', profileId);

  try {
    console.log('📤 Uploading document...');
    const res = await api.post('/api/upload-document', form, {
      headers: form.getHeaders(),
    });
    console.log('✅ Upload success:', res.data);
    return true;
  } catch (err) {
    console.error('❌ Upload failed:', err.message);
    return false;
  } finally {
    await fs.unlink(filePath);
  }
}

async function runTests() {
  console.log('🚀 Running API Tests...\n');

  const results = [
    { name: 'login', result: await testLogin() },
    { name: 'getProfile', result: await testGetProfile() },
    { name: 'listDocuments', result: await testListDocuments() },
    { name: 'uploadTestDocument', result: await testUploadDocument() },
  ];

  console.log('\n📊 Test Results:\n================');
  results.forEach(t =>
    console.log(`${t.result ? '✅' : '❌'} ${t.name}`)
  );

  const passed = results.filter(t => t.result).length;
  const failed = results.length - passed;

  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

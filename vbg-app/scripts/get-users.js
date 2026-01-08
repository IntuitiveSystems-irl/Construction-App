import Database from 'better-sqlite3-multiple-ciphers';

const db = new Database('vbg_encrypted.db');
const keyBuffer = Buffer.from('6fbe1452c3372498229386479270a0d4f697ce321c38e33a30579df97c2c6b2f', 'hex');
db.pragma("cipher='sqlcipher'");
db.pragma('legacy=4');
db.key(keyBuffer);

const users = db.prepare('SELECT id, email, name FROM users LIMIT 5').all();
console.log('Users in database:');
console.log(JSON.stringify(users, null, 2));

db.close();

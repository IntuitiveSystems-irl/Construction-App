import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { verbose } = sqlite3;
const sqlite = verbose();

async function createMasterAdmin() {
  try {
    const db = new sqlite.Database('./rooster.db');
    
    const name = 'Niko Rooster';
    const email = 'niko@roosterconstruction.org';
    
    // Get password from environment variable or command line
    const password = process.env.ADMIN_PASSWORD || process.argv[2];
    
    if (!password) {
      console.error('❌ Error: Admin password required');
      console.log('Usage: node create-master-admin.js <password>');
      console.log('   or: ADMIN_PASSWORD=<password> node create-master-admin.js');
      process.exit(1);
    }

    // Hash the password securely
    const saltRounds = 12; // Increased from default for better security
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        console.error('❌ Database error:', err);
        return;
      }

      if (row) {
        // Update existing user
        db.run(
          'UPDATE users SET name = ?, password = ?, is_admin = 1, is_verified = 1 WHERE email = ?',
          [name, hashedPassword, email],
          function(updateErr) {
            if (updateErr) {
              console.error('❌ Update error:', updateErr);
              return;
            }
            console.log('✅ Master admin updated successfully!');
            console.log(`👤 Name: ${name}`);
            console.log(`📧 Email: ${email}`);
            console.log('🔑 Password: [SECURE - Not displayed]');
            db.close();
          }
        );
      } else {
        // Create new user
        db.run(
          'INSERT INTO users (name, email, password, is_verified, is_admin) VALUES (?, ?, ?, 1, 1)',
          [name, email, hashedPassword],
          function(insertErr) {
            if (insertErr) {
              console.error('❌ Insert error:', insertErr);
              return;
            }
            console.log('✅ Master admin created successfully!');
            console.log(`👤 Name: ${name}`);
            console.log(`📧 Email: ${email}`);
            console.log('🔑 Password: [SECURE - Not displayed]');
            db.close();
          }
        );
      }
    });
  } catch (error) {
    console.error('❌ Error creating master admin:', error);
  }
}

createMasterAdmin();

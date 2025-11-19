const bcrypt = require('bcryptjs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
});

// Helper functions
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

function generateId() {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4();
}

function getTimestamp() {
  return new Date().toISOString();
}

async function createAdmin() {
  const email = 'admin@covnantreality.com';
  const password = 'solomon@agnijwala20';
  const name = 'Admin User';

  try {
    console.log('🔐 Creating admin user...');
    console.log(`📧 Email: ${email}`);
    
    // Check if admin already exists
    const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (existingUser) {
      // Update existing user to admin
      console.log('⚠️  User already exists. Updating to admin...');
      const passwordHash = await bcrypt.hash(password, 10);
      await run(
        'UPDATE users SET role = ?, password_hash = ?, updated_at = ? WHERE email = ?',
        ['admin', passwordHash, getTimestamp(), email]
      );
      console.log(`✅ Updated user ${email} to admin`);
    } else {
      // Create new admin user
      console.log('📝 Creating new admin user...');
      const userId = generateId();
      const passwordHash = await bcrypt.hash(password, 10);
      const timestamp = getTimestamp();

      await run(
        `INSERT INTO users (id, name, email, password_hash, role, email_verified, created_at)
         VALUES (?, ?, ?, ?, 'admin', 1, ?)`,
        [userId, name, email, passwordHash, timestamp]
      );
      console.log(`✅ Created admin user: ${email}`);
    }

    // Verify the admin user
    const adminUser = await get('SELECT id, name, email, role FROM users WHERE email = ?', [email]);
    
    console.log('\n✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${adminUser.role}`);
    console.log(`   ID: ${adminUser.id}`);
    console.log('\n⚠️  Remember to change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('\n✅ Database connection closed');
      }
      process.exit(0);
    });
  }
}

createAdmin();


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

async function verifyAdmin() {
  const email = 'admin@covnantreality.com';
  const password = 'solomon@agnijwala20';

  try {
    console.log('🔍 Verifying admin user...');
    console.log(`📧 Email: ${email}`);
    
    // Check if user exists
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      console.log('❌ User not found in database!');
      console.log('💡 Creating admin user...');
      // Recreate the admin user
      const { exec } = require('child_process');
      exec('node scripts/createAdmin.js', (error, stdout, stderr) => {
        if (error) {
          console.error('Error:', error);
        } else {
          console.log(stdout);
        }
        db.close();
        process.exit(0);
      });
      return;
    }

    console.log('\n✅ User found in database:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Is Active: ${user.is_active}`);
    console.log(`   Email Verified: ${user.email_verified}`);

    // Test password
    console.log('\n🔐 Testing password...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (isValidPassword) {
      console.log('✅ Password is correct!');
      console.log('\n📋 Login Credentials:');
      console.log(`   Email: ${email}`);
      console.log(`   Password: ${password}`);
      console.log('\n💡 If login still fails, check:');
      console.log('   1. Backend server is running');
      console.log('   2. Frontend API URL is correct');
      console.log('   3. JWT_SECRET is set in backend/.env');
    } else {
      console.log('❌ Password is incorrect!');
      console.log('💡 Updating password...');
      
      // Update password
      const passwordHash = await bcrypt.hash(password, 10);
      const timestamp = new Date().toISOString();
      
      db.run(
        'UPDATE users SET password_hash = ?, updated_at = ? WHERE email = ?',
        [passwordHash, timestamp, email],
        function(err) {
          if (err) {
            console.error('❌ Error updating password:', err);
          } else {
            console.log('✅ Password updated successfully!');
            console.log('\n📋 Login Credentials:');
            console.log(`   Email: ${email}`);
            console.log(`   Password: ${password}`);
          }
          db.close();
          process.exit(0);
        }
      );
      return;
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
    process.exit(0);
  }
}

verifyAdmin();


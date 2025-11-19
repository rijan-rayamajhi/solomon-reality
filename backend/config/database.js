const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '../database.sqlite');

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    enableForeignKeys();
    initializeDatabase();
  }
});

// Enable foreign keys
function enableForeignKeys() {
  db.run('PRAGMA foreign_keys = ON', (err) => {
    if (err) {
      console.error('Error enabling foreign keys:', err.message);
    }
  });
}

// Initialize database schema
function initializeDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
      is_active INTEGER DEFAULT 1,
      email_verified INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table ready');
      // Add indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      db.run('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)');
    }
  });

  // Properties table
  db.run(`
    CREATE TABLE IF NOT EXISTS properties (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      payload TEXT NOT NULL,
      status TEXT DEFAULT 'Active' CHECK(status IN ('Active', 'Sold', 'Rented', 'Inactive')),
      views INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating properties table:', err.message);
    } else {
      console.log('Properties table ready');
      // Add indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)');
      db.run('CREATE INDEX IF NOT EXISTS idx_properties_views ON properties(views)');
    }
  });

  // Leads table
  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      property_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      message TEXT,
      status TEXT DEFAULT 'Pending' CHECK(status IN ('Pending', 'Contacted', 'Converted', 'Lost')),
      created_at TEXT NOT NULL,
      updated_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating leads table:', err.message);
    } else {
      console.log('Leads table ready');
      db.run('CREATE INDEX IF NOT EXISTS idx_leads_property_id ON leads(property_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)');
    }
  });

  // Wishlist table
  db.run(`
    CREATE TABLE IF NOT EXISTS wishlist (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      property_id TEXT NOT NULL,
      added_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      UNIQUE(user_id, property_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating wishlist table:', err.message);
    } else {
      console.log('Wishlist table ready');
      db.run('CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id)');
    }
  });

  // Analytics table
  db.run(`
    CREATE TABLE IF NOT EXISTS analytics (
      property_id TEXT PRIMARY KEY,
      views INTEGER DEFAULT 0,
      inquiries INTEGER DEFAULT 0,
      conversions INTEGER DEFAULT 0,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating analytics table:', err.message);
    } else {
      console.log('Analytics table ready');
    }
  });

  // Amenities table
  db.run(`
    CREATE TABLE IF NOT EXISTS amenities (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      category TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )
  `, (err) => {
    if (err) {
      console.error('Error creating amenities table:', err.message);
    } else {
      console.log('Amenities table ready');
      // Add indexes
      db.run('CREATE INDEX IF NOT EXISTS idx_amenities_name ON amenities(name)');
      db.run('CREATE INDEX IF NOT EXISTS idx_amenities_category ON amenities(category)');
      
      // Insert default amenities if table is empty
      db.get('SELECT COUNT(*) as count FROM amenities', (err, row) => {
        if (!err && row && row.count === 0) {
          const defaultAmenities = [
            ['Lift', 'Common'],
            ['Vaastu Compliant', 'Common'],
            ['Security Personnel', 'Common'],
            ['Power Backup', 'Common'],
            ['Parking', 'Common'],
            ['Gym', 'Common'],
            ['Club House', 'Common'],
            ['Park', 'Common'],
            ['Swimming Pool', 'Common'],
            ['Gas Pipeline', 'Common'],
            ['Fire Hydrant', 'Common'],
            ['Fire Sprinkler', 'Common'],
            ['Fire NOC', 'Common'],
            ['AC Room', 'Residential'],
            ['Pet Friendly', 'Residential'],
            ['Wheelchair Friendly', 'Residential'],
            ['Wi-Fi', 'Residential'],
            ['Laundry Available', 'Residential'],
            ['Food Service', 'Residential'],
            ['Near Bank', 'Commercial'],
            ['ATM', 'Commercial'],
            ['Waste Disposal', 'Commercial'],
            ['DG Availability', 'Commercial'],
            ['Wheelchair Access', 'Commercial'],
          ];
          
          const timestamp = new Date().toISOString();
          defaultAmenities.forEach(([name, category]) => {
            const id = require('../utils/helpers').generateId();
            db.run(
              'INSERT INTO amenities (id, name, category, created_at) VALUES (?, ?, ?, ?)',
              [id, name, category, timestamp],
              (err) => {
                if (err) {
                  console.error(`Error inserting default amenity ${name}:`, err.message);
                }
              }
            );
          });
        }
      });
    }
  });

  // Property views table
  db.run(`
    CREATE TABLE IF NOT EXISTS property_views (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      user_id TEXT,
      viewed_at TEXT NOT NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating property_views table:', err.message);
    } else {
      console.log('Property views table ready');
      db.run('CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at)');
    }
  });

  // Property drafts table
  db.run(`
    CREATE TABLE IF NOT EXISTS property_drafts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT,
      payload TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating property_drafts table:', err.message);
    } else {
      console.log('Property drafts table ready');
      db.run('CREATE INDEX IF NOT EXISTS idx_property_drafts_user_id ON property_drafts(user_id)');
    }
  });

  // Reviews table
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      is_approved INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Error creating reviews table:', err.message);
    } else {
      console.log('Reviews table ready');
      db.run('CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews(property_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_reviews_is_approved ON reviews(is_approved)');
    }
  });

  // Settings table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating settings table:', err.message);
    } else {
      console.log('Settings table ready');
      db.run('CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)');
    }
  });
}

// Database helper functions
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

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all
};


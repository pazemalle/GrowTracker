const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'growtracker.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

const initDb = () => {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            // Migration: Add role column if it doesn't exist (for existing DBs)
            if (!err) {
                db.all("PRAGMA table_info(users)", (err, columns) => {
                    if (!err) {
                        const hasRole = columns.some(col => col.name === 'role');
                        if (!hasRole) {
                            console.log('Migrating: Adding role column to users table...');
                            db.run("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'", (err) => {
                                if (!err) ensureAdmin();
                            });
                        } else {
                            ensureAdmin();
                        }
                    }
                });
            }
        });

        function ensureAdmin() {
            // Check if any admin exists
            db.get("SELECT COUNT(*) as count FROM users WHERE role = 'admin'", [], (err, row) => {
                if (!err && row.count === 0) {
                    console.log('No admins found. Promoting first user to admin...');
                    db.run("UPDATE users SET role = 'admin' WHERE id = (SELECT id FROM users ORDER BY id ASC LIMIT 1)");
                }
            });
        }

        // Data Table (JSON blobs for simplicity/migration)
        db.run(`CREATE TABLE IF NOT EXISTS user_data (
            user_id INTEGER PRIMARY KEY,
            grows_json TEXT DEFAULT '[]',
            profiles_json TEXT DEFAULT '[]',
            setups_json TEXT DEFAULT '[]',

            seeds_json TEXT DEFAULT '[]',
            notes_json TEXT DEFAULT '[]',
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`, (err) => {
            if (!err) {
                // Migration: Add new JSON columns if they don't exist
                db.all("PRAGMA table_info(user_data)", (err, columns) => {
                    if (!err) {
                        const hasSetups = columns.some(col => col.name === 'setups_json');
                        const hasSeeds = columns.some(col => col.name === 'seeds_json');

                        if (!hasSetups) {
                            console.log('Migrating: Adding setups_json column...');
                            db.run("ALTER TABLE user_data ADD COLUMN setups_json TEXT DEFAULT '[]'");
                        }
                        if (!hasSeeds) {
                            console.log('Migrating: Adding seeds_json column...');
                            db.run("ALTER TABLE user_data ADD COLUMN seeds_json TEXT DEFAULT '[]'");
                        }
                        const hasNotes = columns.some(col => col.name === 'notes_json');
                        if (!hasNotes) {
                            console.log('Migrating: Adding notes_json column...');
                            db.run("ALTER TABLE user_data ADD COLUMN notes_json TEXT DEFAULT '[]'");
                        }
                    }
                });
            }
        });

        // Backups Table
        db.run(`CREATE TABLE IF NOT EXISTS backups (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            data_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);
    });
};

module.exports = { db, initDb };

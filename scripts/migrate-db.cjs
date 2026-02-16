const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../server/growtracker.db');
console.log('Migrating database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
});

db.serialize(() => {
    // Check and add setups_json
    db.run("ALTER TABLE user_data ADD COLUMN setups_json TEXT DEFAULT '[]'", (err) => {
        if (err) {
            if (err.message.includes('duplicate column')) {
                console.log('setups_json column already exists.');
            } else {
                console.error('Error adding setups_json:', err.message);
            }
        } else {
            console.log('Successfully added setups_json column.');
        }
    });

    // Check and add seeds_json
    db.run("ALTER TABLE user_data ADD COLUMN seeds_json TEXT DEFAULT '[]'", (err) => {
        if (err) {
            if (err.message.includes('duplicate column')) {
                console.log('seeds_json column already exists.');
            } else {
                console.error('Error adding seeds_json:', err.message);
            }
        } else {
            console.log('Successfully added seeds_json column.');
        }
    });
});

db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Migration complete.');
});

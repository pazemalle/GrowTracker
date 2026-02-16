const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../server/growtracker.db');
console.log('Checking database at:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
        process.exit(1);
    }
    console.log('Connected to SQLite database.');
});

db.serialize(() => {
    db.all("PRAGMA table_info(users)", (err, columns) => {
        if (err) {
            console.error('Error getting users info:', err);
        } else {
            console.log('Users Table Columns:', columns.map(c => c.name));
        }
    });

    db.all("PRAGMA table_info(user_data)", (err, columns) => {
        if (err) {
            console.error('Error getting user_data info:', err);
        } else {
            console.log('User_Data Table Columns:', columns.map(c => c.name));
        }
    });

    db.all("SELECT * FROM users", (err, rows) => {
        if (err) {
            console.error('Error getting users:', err);
        } else {
            console.log(`Found ${rows.length} users.`);
            rows.forEach(r => console.log(`- ${r.username} (prop: ${r.role})`));
        }
    });
});

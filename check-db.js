const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../server/growtracker.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT user_id, grows_json, profiles_json, last_updated FROM user_data', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log('=== DATABASE CONTENTS ===');
    rows.forEach(row => {
        console.log(`\nUser ID: ${row.user_id}`);
        console.log(`Grows: ${row.grows_json.substring(0, 100)}...`);
        console.log(`Profiles: ${row.profiles_json.substring(0, 100)}...`);
        console.log(`Last Updated: ${row.last_updated}`);

        // Parse and show counts
        try {
            const grows = JSON.parse(row.grows_json);
            const profiles = JSON.parse(row.profiles_json);
            console.log(`Number of Grows: ${grows.length}`);
            console.log(`Number of Profiles: ${profiles.length}`);
        } catch (e) {
            console.log('Could not parse JSON');
        }
    });

    db.close();
});

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'growtracker.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT user_id, grows_json, profiles_json, last_updated FROM user_data', [], (err, rows) => {
    if (err) {
        console.error('Error:', err);
        process.exit(1);
    }

    console.log('=== DATABASE CONTENTS ===');
    if (rows.length === 0) {
        console.log('NO DATA FOUND IN DATABASE');
    }

    rows.forEach(row => {
        console.log(`\nUser ID: ${row.user_id}`);
        console.log(`Last Updated: ${row.last_updated}`);

        // Parse and show counts
        try {
            const grows = JSON.parse(row.grows_json);
            const profiles = JSON.parse(row.profiles_json);
            console.log(`Number of Grows: ${grows.length}`);
            console.log(`Number of Profiles: ${profiles.length}`);

            if (grows.length > 0) {
                console.log('\nGrows Data:');
                console.log(JSON.stringify(grows, null, 2));
            }
            if (profiles.length > 0) {
                console.log('\nProfiles Data:');
                console.log(JSON.stringify(profiles, null, 2));
            }
        } catch (e) {
            console.log('Could not parse JSON:', e.message);
        }
    });

    db.close();
});

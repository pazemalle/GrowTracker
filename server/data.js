const express = require('express');
const { db } = require('./db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = 'super_secret_key_change_me_in_prod';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.user = { id: decoded.id };
        next();
    });
};

// Get Data
router.get('/', authenticateToken, (req, res) => {
    const userId = req.user.id;

    db.get("SELECT grows_json, profiles_json, setups_json, seeds_json, notes_json FROM user_data WHERE user_id = ?", [userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (!row) {
            // No data yet, return empty arrays
            return res.json({ grows: [], profiles: [], setups: [], seeds: [] });
        }

        try {
            const grows = JSON.parse(row.grows_json || '[]');
            const profiles = JSON.parse(row.profiles_json || '[]');
            const setups = JSON.parse(row.setups_json || '[]');
            const seeds = JSON.parse(row.seeds_json || '[]');
            const notes = JSON.parse(row.notes_json || '[]');
            res.json({ grows, profiles, setups, seeds, notes });
        } catch (e) {
            res.status(500).json({ error: 'Error parsing data' });
        }
    });
});

// Save Data
router.post('/', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { grows, profiles, setups, seeds, notes } = req.body;

    if (!grows || !profiles) {
        return res.status(400).json({ error: 'Missing data' });
    }

    const growsJson = JSON.stringify(grows);
    const profilesJson = JSON.stringify(profiles);
    const setupsJson = JSON.stringify(setups || []);
    const seedsJson = JSON.stringify(seeds || []);
    const notesJson = JSON.stringify(notes || []);

    db.get("SELECT user_id, grows_json, profiles_json, setups_json, seeds_json, notes_json FROM user_data WHERE user_id = ?", [userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (row) {
            // Check for backup for today
            db.get("SELECT id FROM backups WHERE user_id = ? AND date(created_at) = date('now')", [userId], (err, backupRow) => {
                if (!err && !backupRow) {
                    // Create backup of current state BEFORE update
                    const currentData = {
                        grows: JSON.parse(row.grows_json || '[]'),
                        profiles: JSON.parse(row.profiles_json || '[]'),
                        setups: JSON.parse(row.setups_json || '[]'),
                        seeds: JSON.parse(row.seeds_json || '[]'),
                        notes: JSON.parse(row.notes_json || '[]')
                    };
                    db.run("INSERT INTO backups (user_id, data_json) VALUES (?, ?)", [userId, JSON.stringify(currentData)], (err) => {
                        if (!err) {
                            // Cleanup old backups (keep last 3 backups regardless of date)
                            db.run(`DELETE FROM backups 
                                    WHERE user_id = ? 
                                    AND id NOT IN (
                                        SELECT id FROM backups 
                                        WHERE user_id = ? 
                                        ORDER BY created_at DESC 
                                        LIMIT 3
                                    )`, [userId, userId]);
                        }
                    });
                }
            });

            // Update
            db.run("UPDATE user_data SET grows_json = ?, profiles_json = ?, setups_json = ?, seeds_json = ?, notes_json = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?",
                [growsJson, profilesJson, setupsJson, seedsJson, notesJson, userId], (err) => {
                    if (err) return res.status(500).json({ error: 'Error updating data' });
                    res.json({ message: 'Data saved successfully' });
                });
        } else {
            // Insert
            db.run("INSERT INTO user_data (user_id, grows_json, profiles_json, setups_json, seeds_json, notes_json) VALUES (?, ?, ?, ?, ?, ?)",
                [userId, growsJson, profilesJson, setupsJson, seedsJson, notesJson], (err) => {
                    if (err) return res.status(500).json({ error: 'Error saving data' });
                    res.json({ message: 'Data saved successfully' });
                });
        }
    });
});


// Get Backups
router.get('/backups', authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.all("SELECT id, created_at FROM backups WHERE user_id = ? ORDER BY created_at DESC", [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Restore Backup
router.post('/backups/:id/restore', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const backupId = req.params.id;
    const { categories } = req.body; // Expect array of categories, e.g., ['grows', 'notes']

    db.get("SELECT data_json FROM backups WHERE id = ? AND user_id = ?", [backupId, userId], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'Backup not found' });

        try {
            const data = JSON.parse(row.data_json);

            // If specific categories requested, build dynamic update
            const validCategories = ['grows', 'profiles', 'setups', 'seeds', 'notes'];
            const categoriesToRestore = (categories && Array.isArray(categories))
                ? categories.filter(c => validCategories.includes(c))
                : validCategories; // Default to all if not specified

            if (categoriesToRestore.length === 0) {
                return res.status(400).json({ error: 'No valid categories specified' });
            }

            const updates = [];
            const values = [];

            categoriesToRestore.forEach(cat => {
                updates.push(`${cat}_json = ?`);
                values.push(JSON.stringify(data[cat] || []));
            });

            values.push(userId); // For WHERE clause

            const sql = `UPDATE user_data SET ${updates.join(', ')}, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?`;

            db.run(sql, values, (err) => {
                if (err) return res.status(500).json({ error: 'Error restoring data' });
                res.json({ message: 'Backup restored successfully', restoredCategories: categoriesToRestore });
            });
        } catch (e) {
            res.status(500).json({ error: 'Error parsing backup data' });
        }
    });
});

// Delete Account
router.delete('/user/delete-account', authenticateToken, (req, res) => {
    const userId = req.user.id;

    // Prevent deleting the root admin (ID 1)
    if (userId === 1) {
        return res.status(403).json({ error: 'Cannot delete root admin account' });
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Delete backups
        db.run("DELETE FROM backups WHERE user_id = ?", [userId], (err) => {
            if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: 'Error deleting backups' });
            }

            // Delete user data
            db.run("DELETE FROM user_data WHERE user_id = ?", [userId], (err) => {
                if (err) {
                    db.run("ROLLBACK");
                    return res.status(500).json({ error: 'Error deleting user data' });
                }

                // Delete user account
                db.run("DELETE FROM users WHERE id = ?", [userId], (err) => {
                    if (err) {
                        db.run("ROLLBACK");
                        return res.status(500).json({ error: 'Error deleting user account' });
                    }

                    db.run("COMMIT", () => {
                        res.json({ message: 'Account deleted successfully' });
                    });
                });
            });
        });
    });
});

module.exports = router;

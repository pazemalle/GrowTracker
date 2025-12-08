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

    db.get("SELECT grows_json, profiles_json, setups_json, seeds_json FROM user_data WHERE user_id = ?", [userId], (err, row) => {
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
            res.json({ grows, profiles, setups, seeds });
        } catch (e) {
            res.status(500).json({ error: 'Error parsing data' });
        }
    });
});

// Save Data
router.post('/', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { grows, profiles, setups, seeds } = req.body;

    if (!grows || !profiles) {
        return res.status(400).json({ error: 'Missing data' });
    }

    const growsJson = JSON.stringify(grows);
    const profilesJson = JSON.stringify(profiles);
    const setupsJson = JSON.stringify(setups || []);
    const seedsJson = JSON.stringify(seeds || []);

    db.get("SELECT user_id FROM user_data WHERE user_id = ?", [userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (row) {
            // Update
            db.run("UPDATE user_data SET grows_json = ?, profiles_json = ?, setups_json = ?, seeds_json = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?",
                [growsJson, profilesJson, setupsJson, seedsJson, userId], (err) => {
                    if (err) return res.status(500).json({ error: 'Error updating data' });
                    res.json({ message: 'Data saved successfully' });
                });
        } else {
            // Insert
            db.run("INSERT INTO user_data (user_id, grows_json, profiles_json, setups_json, seeds_json) VALUES (?, ?, ?, ?, ?)",
                [userId, growsJson, profilesJson, setupsJson, seedsJson], (err) => {
                    if (err) return res.status(500).json({ error: 'Error saving data' });
                    res.json({ message: 'Data saved successfully' });
                });
        }
    });
});

module.exports = router;

const express = require('express');
const { db } = require('./db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = 'super_secret_key_change_me_in_prod';

// Middleware to verify token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(403).json({ error: 'No token provided' });

    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.userId = decoded.id;
        next();
    });
};

// Get Data
router.get('/', verifyToken, (req, res) => {
    db.get(`SELECT grows_json, profiles_json FROM user_data WHERE user_id = ?`, [req.userId], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.json({ grows: [], profiles: [] });

        res.json({
            grows: JSON.parse(row.grows_json),
            profiles: JSON.parse(row.profiles_json)
        });
    });
});

// Sync Data (Save)
router.post('/', verifyToken, (req, res) => {
    const { grows, profiles } = req.body;

    db.run(`UPDATE user_data SET grows_json = ?, profiles_json = ?, last_updated = CURRENT_TIMESTAMP WHERE user_id = ?`,
        [JSON.stringify(grows), JSON.stringify(profiles), req.userId],
        function (err) {
            if (err) return res.status(500).json({ error: 'Update failed' });
            res.json({ success: true });
        }
    );
});

module.exports = router;

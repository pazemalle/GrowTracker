const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('./db');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_key_change_me_in_prod';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    console.warn('WARNING: Using default JWT_SECRET in production. This is highly insecure!');
}

// Register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if this is the FIRST user ever
        db.get("SELECT COUNT(*) as count FROM users", [], (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            const role = row.count === 0 ? 'admin' : 'user';

            db.run(`INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)`,
                [username, hashedPassword, role],
                function (err) {
                    if (err) {
                        if (err.message.includes('UNIQUE constraint failed')) {
                            return res.status(409).json({ error: 'Username already exists' });
                        }
                        return res.status(500).json({ error: err.message });
                    }

                    // Initialize empty data for new user
                    db.run(`INSERT INTO user_data (user_id) VALUES (?)`, [this.lastID]);

                    res.status(201).json({ id: this.lastID, username, role });
                }
            );
        });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });

        // Include role in token
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role || 'user' }, SECRET_KEY, { expiresIn: '7d' });
        res.json({ token, username: user.username, role: user.role || 'user' });
    });
});

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Change Password
router.post('/change-password', authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password required' });
    }

    db.get("SELECT password_hash FROM users WHERE id = ?", [userId], async (err, user) => {
        if (err || !user) return res.status(500).json({ error: 'User not found' });

        const match = await bcrypt.compare(currentPassword, user.password_hash);
        if (!match) return res.status(401).json({ error: 'Incorrect current password' });

        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        db.run("UPDATE users SET password_hash = ? WHERE id = ?", [newHashedPassword, userId], (err) => {
            if (err) return res.status(500).json({ error: 'Error updating password' });
            res.json({ message: 'Password updated successfully' });
        });
    });
});

module.exports = router;

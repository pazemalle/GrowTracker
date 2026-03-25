const express = require('express');
const { db } = require('./db');
const jwt = require('jsonwebtoken');

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_key_change_me_in_prod';

// Middleware to require Admin role
const requireAdmin = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);

        if (user.role !== 'admin') {
            return res.status(403).json({ error: 'Access denied: Admins only' });
        }

        req.user = user;
        next();
    });
};

// GET /users - List all users
router.get('/users', requireAdmin, (req, res) => {
    db.all("SELECT id, username, role, created_at FROM users ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// DELETE /users/:id - Delete a user
router.delete('/users/:id', requireAdmin, (req, res) => {
    const targetUserId = parseInt(req.params.id);

    // Prevent deleting yourself or the Root Admin (ID 1)
    if (targetUserId === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }
    if (targetUserId === 1) {
        return res.status(403).json({ error: 'Cannot delete the Root Admin' });
    }

    db.serialize(() => {
        // Delete user data first
        db.run("DELETE FROM user_data WHERE user_id = ?", [targetUserId], (err) => {
            if (err) return res.status(500).json({ error: 'Error deleting user data' });

            // Delete user
            db.run("DELETE FROM users WHERE id = ?", [targetUserId], (err) => {
                if (err) return res.status(500).json({ error: 'Error deleting user' });
                res.json({ message: 'User deleted successfully' });
            });
        });
    });
});

// PATCH /users/:id/role - Change user role
router.patch('/users/:id/role', requireAdmin, (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const { role } = req.body;

    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    // Protection: Cannot change role of Root Admin (ID 1)
    if (targetUserId === 1) {
        return res.status(403).json({ error: 'Cannot change role of Root Admin' });
    }

    // Protection: Cannot change own role (must ask another admin)
    if (targetUserId === req.user.id) {
        return res.status(400).json({ error: 'Cannot change your own role' });
    }

    db.run("UPDATE users SET role = ? WHERE id = ?", [role, targetUserId], (err) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ message: 'Role updated successfully', role });
    });
});

// PATCH /users/:id/password - Admin reset password
router.patch('/users/:id/password', requireAdmin, async (req, res) => {
    const targetUserId = parseInt(req.params.id);
    const { password } = req.body;

    if (!password || password.length < 4) {
        return res.status(400).json({ error: 'Password too short' });
    }

    // Protection: Cannot reset password of Root Admin (ID 1) unless you ARE ID 1 (but even then, use normal change-password)
    // Actually, allowing admins to reset other admins' passwords is standard, but protecting ID 1 is good practice.
    if (targetUserId === 1 && req.user.id !== 1) {
        return res.status(403).json({ error: 'Cannot reset password of Root Admin' });
    }

    try {
        const hashedPassword = await require('bcryptjs').hash(password, 10);
        db.run("UPDATE users SET password_hash = ? WHERE id = ?", [hashedPassword, targetUserId], (err) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            res.json({ message: 'Password reset successfully' });
        });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

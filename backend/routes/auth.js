const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Simple admin login
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUsername && password === adminPassword) {
        const payload = {
            user: {
                id: 'admin_id_slug',
                role: 'admin'
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '24h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token });
            }
        );
    } else {
        res.status(401).json({ msg: 'Invalid Credentials' });
    }
});

// Admin verification route (to check token validity on reload)
router.get('/verify', authMiddleware, (req, res) => {
    res.json({ msg: 'Token is valid' });
});

// Middleware to protect routes
function authMiddleware(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token') || req.header('Authorization')?.replace('Bearer ', '');

    // Check if no token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
}

module.exports = { router, authMiddleware };

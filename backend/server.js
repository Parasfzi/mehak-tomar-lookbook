require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const path = require('path');
const cors = require('cors');

const app = express();

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
app.use(cors());

// Define Routes
app.use('/api/auth', require('./routes/auth').router);
app.use('/api/styles', require('./routes/styles'));
app.use('/api/images', require('./routes/images'));

// Global error handler
app.use((err, req, res, next) => {
    console.error('Express Error:', err.stack || err.message || err);
    res.status(500).json({ msg: 'Internal Server Error', error: err.message });
});

// Serve Admin Panel static files
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// Serve Frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallbacks for frontend routing to handle index.html
app.get(['/admin', '/admin/*path'], (req, res) => {
    res.sendFile(path.resolve(__dirname, '../admin', 'admin.html'));
});

app.get(['/', '/*path'], (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend', 'index.html'));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

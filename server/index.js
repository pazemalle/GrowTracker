const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./db');
const authRoutes = require('./auth');
const dataRoutes = require('./data');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const corsOptions = process.env.CORS_ORIGIN 
    ? { origin: process.env.CORS_ORIGIN } 
    : {};
app.use(cors(corsOptions));
app.use(express.json());

// Initialize DB
initDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);
app.use('/api/admin', require('./admin'));

// Serve static React build files in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../dist')));
    app.use((req, res) => {
        res.sendFile(path.resolve(__dirname, '../dist', 'index.html'));
    });
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

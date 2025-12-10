const express = require('express');
const cors = require('cors');
const path = require('path');
const { sequelize, testConnection } = require('./config/database');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const appraisalRoutes = require('./routes/appraisalRoutes');
const userRoutes = require('./routes/userRoutes');
const periodRoutes = require('./routes/periodRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for PDF attachments
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database Connection & Sync
const initDB = async () => {
    await testConnection();
    // Sync models with DB
    // force: false ensures we don't drop tables on restart
    // alter: true updates tables if models change (use with caution in prod)
    await sequelize.sync();
    console.log('✅ Database synchronized');
};

initDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appraisals', appraisalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/periods', periodRoutes);

// Health Check
app.get('/', (req, res) => {
    res.send('Agro Preciso Appraisal System API is running');
});

// Database Health Check Endpoint
app.get('/api/health/db', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ connected: true, status: 'Database is connected' });
    } catch (error) {
        res.status(500).json({ 
            connected: false, 
            status: 'Database connection failed', 
            error: error.message 
        });
    }
});

// Serve static files from the React app (in production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Handle React routing - return all requests to React app
    app.get('*', (req, res) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ message: 'API route not found' });
        }
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (process.env.NODE_ENV === 'production') {
        console.log('📦 Serving frontend from public directory');
    }
});

const express = require('express');
const cors = require('cors');
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

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

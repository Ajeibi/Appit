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
    await sequelize.sync();
    console.log('✅ Database synchronized');
};

initDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/appraisals', appraisalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/periods', periodRoutes);

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

app.get('/api/admin/seed', async (req, res) => {
    try {
        const { token } = req.query;
        const expectedToken = process.env.SEED_TOKEN;
        
        // Check if token is provided and matches
        if (!expectedToken) {
            return res.status(500).json({ 
                error: 'SEED_TOKEN not configured. Please set SEED_TOKEN environment variable.' 
            });
        }
        
        if (!token || token !== expectedToken) {
            return res.status(401).json({ 
                error: 'Invalid or missing token. Access denied.' 
            });
        }
        
        // Import seed function
        const { User, Period } = require('./models');
        const bcrypt = require('bcryptjs');
        
        // Disable foreign keys for SQLite
        await sequelize.query('PRAGMA foreign_keys = OFF');
        
        // Drop all tables
        await sequelize.drop({ cascade: true });
        
        // Re-enable foreign keys
        await sequelize.query('PRAGMA foreign_keys = ON');
        
        // Sync to create fresh tables
        await sequelize.sync();
        
        // Hash passwords
        const salt = await bcrypt.genSalt(10);
        const password = await bcrypt.hash('password123', salt);
        const adminPassword = await bcrypt.hash('admin123', salt);
        
        // Create Admin
        const admin = await User.create({
            name: 'System Admin',
            email: 'admin@agrop.co',
            password: adminPassword,
            role: 'admin',
            designation: 'System Administrator',
            department: 'IT'
        });
        
        // Create MD
        const md = await User.create({
            name: 'Managing Director',
            email: 'md@agrop.co',
            password: password,
            role: 'md',
            designation: 'MD/CEO',
            department: 'Executive'
        });
        
        // Create HR
        const hr = await User.create({
            name: 'HR Manager',
            email: 'hr@agrop.co',
            password: password,
            role: 'hr',
            designation: 'HR Manager',
            department: 'Human Resources'
        });
        
        // Create Supervisor (reports to HR)
        const supervisor = await User.create({
            name: 'Jane Supervisor',
            email: 'jane@agrop.co',
            password: password,
            role: 'supervisor',
            designation: 'Operations Manager',
            department: 'Operations',
            supervisorId: hr.id
        });
        
        // Create Staff (reports to Supervisor)
        await User.create({
            name: 'Emmanuel Staff',
            email: 'emmanuel@agrop.co',
            password: password,
            role: 'staff',
            designation: 'Field Officer',
            department: 'Operations',
            supervisorId: supervisor.id
        });
        
        // Create Periods
        await Period.bulkCreate([
            { year: 2025, quarter: 1, label: 'Q1 2025', isActive: true },
            { year: 2025, quarter: 2, label: 'Q2 2025', isActive: false },
            { year: 2025, quarter: 3, label: 'Q3 2025', isActive: false },
            { year: 2025, quarter: 4, label: 'Q4 2025', isActive: false },
        ]);
        
        res.json({ 
            success: true, 
            message: 'Database seeded successfully!',
            users: [
                { email: 'admin@agrop.co', password: 'admin123', role: 'admin' },
                { email: 'md@agrop.co', password: 'password123', role: 'md' },
                { email: 'hr@agrop.co', password: 'password123', role: 'hr' },
                { email: 'jane@agrop.co', password: 'password123', role: 'supervisor' },
                { email: 'emmanuel@agrop.co', password: 'password123', role: 'staff' }
            ]
        });
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        res.status(500).json({ 
            error: 'Failed to seed database', 
            details: error.message 
        });
    }
});

// Serve static files from the React app (in production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    
    // Handle React routing - return all requests to React app
    app.use((req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
            return res.status(404).json({ message: 'API route not found' });
        }
        // Serve index.html for all other routes (React Router)
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
} else {
    // Development: Show API message on root
    app.get('/', (req, res) => {
        res.send('Agro Preciso Appraisal System API is running');
    });
}

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    if (process.env.NODE_ENV === 'production') {
        console.log('📦 Serving frontend from public directory');
    }
});

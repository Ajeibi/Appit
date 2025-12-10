const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
const useMySQL = process.env.DB_DIALECT === 'mysql' && 
                 process.env.DB_NAME && 
                 process.env.DB_USER;

let sequelize;

if (useMySQL) {
    // Use MySQL only if explicitly configured (for cPanel or MySQL setups)
    sequelize = new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASS,
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'mysql',
            logging: false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000
            }
        }
    );
} else {
    // Default: Use SQLite (works for both development and production)
    // For Render: Use a writable directory (app root or data folder)
    // Render's free tier has ephemeral storage, but we can write to the app directory
    const dbPath = process.env.DB_PATH || (
        isProduction 
            ? path.join(__dirname, '../data/database.sqlite') // Production: use data folder
            : path.join(__dirname, '../database.sqlite')      // Development: root
    );
    
    // Ensure data directory exists in production
    if (isProduction) {
        const fs = require('fs');
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }
    
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: dbPath,
        logging: false
    });
}

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');
        const dbMode = useMySQL ? 'MySQL' : 'SQLite';
        console.log(`📊 Mode: ${isProduction ? 'Production' : 'Development'} (${dbMode})`);
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, testConnection };

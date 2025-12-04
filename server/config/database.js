const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';

let sequelize;

if (isProduction) {
    // Production: Use MySQL (cPanel)
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
    // Development: Use SQLite (Local file)
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../database.sqlite'),
        logging: false
    });
}

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');
        console.log(`📊 Mode: ${isProduction ? 'Production (MySQL)' : 'Development (SQLite)'}`);
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
    }
};

module.exports = { sequelize, testConnection };

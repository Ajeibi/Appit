const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PerformanceHistory = sequelize.define('PerformanceHistory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    periodId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    periodLabel: {
        type: DataTypes.STRING,
        allowNull: false
    },
    appraisalId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    score: {
        type: DataTypes.FLOAT,
        allowNull: false
    },
    rating: {
        type: DataTypes.STRING,
        allowNull: false
    },
    completedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = PerformanceHistory;

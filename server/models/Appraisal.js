const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Appraisal = sequelize.define('Appraisal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    // Foreign keys will be set up in associations
    periodLabel: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('draft', 'submitted', 'supervisor_approved', 'hr_approved', 'md_approved'),
        defaultValue: 'draft'
    },
    // The core appraisal content (Objectives, KPIs, Self-Assessment)
    content: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {}
    },
    // Scores and ratings
    scores: {
        type: DataTypes.JSON,
        allowNull: true
    },
    // Timestamps for workflow
    submittedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    completedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // PDF Attachment (stored as base64)
    attachment: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: null
        // Structure: { fileName: string, fileSize: number, fileData: string (base64) }
    }
});

module.exports = Appraisal;

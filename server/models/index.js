const { sequelize } = require('../config/database');
const User = require('./User');
const Period = require('./Period');
const Appraisal = require('./Appraisal');

const PerformanceHistory = require('./PerformanceHistory');

// User Relationships
// A user has a supervisor (Self-referencing)
User.belongsTo(User, { as: 'supervisor', foreignKey: 'supervisorId' });
User.hasMany(User, { as: 'subordinates', foreignKey: 'supervisorId' });
User.hasMany(PerformanceHistory, { foreignKey: 'userId', as: 'performanceHistory' });

// Appraisal Relationships
// An appraisal belongs to a Staff member
Appraisal.belongsTo(User, { as: 'staff', foreignKey: 'staffId' });
User.hasMany(Appraisal, { as: 'appraisals', foreignKey: 'staffId' });

// An appraisal belongs to a Supervisor (who reviews it)
Appraisal.belongsTo(User, { as: 'supervisor', foreignKey: 'supervisorId' });

// An appraisal belongs to a Period
Appraisal.belongsTo(Period, { foreignKey: 'periodId' });
Period.hasMany(Appraisal, { foreignKey: 'periodId' });

// Performance History
PerformanceHistory.belongsTo(User, { foreignKey: 'userId' });
PerformanceHistory.belongsTo(Period, { foreignKey: 'periodId' });

module.exports = {
    sequelize,
    User,
    Period,
    Appraisal,
    PerformanceHistory
};

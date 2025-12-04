const { sequelize, User, Period } = require('./models');
const bcrypt = require('bcryptjs');

const seed = async () => {
    try {
        await sequelize.sync({ force: true }); // Reset DB

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
            supervisorId: hr.id // Supervisor reports to HR
        });

        // Create Staff (reports to Supervisor)
        await User.create({
            name: 'Emmanuel Staff',
            email: 'emmanuel@agrop.co',
            password: password,
            role: 'staff',
            designation: 'Field Officer',
            department: 'Operations',
            supervisorId: supervisor.id // Staff reports to Supervisor
        });

        // Create Periods
        await Period.bulkCreate([
            { year: 2025, quarter: 1, label: 'Q1 2025', isActive: true },
            { year: 2025, quarter: 2, label: 'Q2 2025', isActive: false },
            { year: 2025, quarter: 3, label: 'Q3 2025', isActive: false },
            { year: 2025, quarter: 4, label: 'Q4 2025', isActive: false },
        ]);

        console.log('✅ Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seed();

const { Appraisal, User, Period } = require('./models');

const checkData = async () => {
    try {
        const appraisals = await Appraisal.findAll({
            include: [
                { model: User, as: 'staff', attributes: ['id', 'name', 'designation'] },
                { model: User, as: 'supervisor', attributes: ['id', 'name'] },
                { model: Period }
            ]
        });

        console.log(`Found ${appraisals.length} appraisals.`);

        appraisals.forEach(a => {
            console.log('--------------------------------');
            console.log(`Appraisal ID: ${a.id}`);
            console.log(`Staff ID: ${a.staffId}`);
            console.log(`Staff Name: ${a.staff ? a.staff.name : 'MISSING'}`);
            console.log(`Supervisor ID: ${a.supervisorId}`);
            console.log(`Supervisor Name: ${a.supervisor ? a.supervisor.name : 'MISSING'}`);
            console.log(`Period ID: ${a.periodId}`);
            console.log(`Period Label: ${a.periodLabel}`);
            console.log(`Period Assoc: ${a.Period ? a.Period.label : 'MISSING'}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkData();

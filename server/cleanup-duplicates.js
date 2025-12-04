const { Appraisal } = require('./models');

const cleanupDuplicates = async () => {
    try {
        // Find all appraisals with Unknown Staff (staffId issues)
        const all = await Appraisal.findAll();
        console.log(`Total appraisals: ${all.length}`);

        // Group by staffId and periodId
        const grouped = {};
        all.forEach(app => {
            const key = `${app.staffId}-${app.periodId}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(app);
        });

        // Delete duplicates (keep the first one)
        let deleted = 0;
        for (const key in grouped) {
            const appraisals = grouped[key];
            if (appraisals.length > 1) {
                console.log(`Found ${appraisals.length} duplicates for ${key}`);
                // Delete all but the first
                for (let i = 1; i < appraisals.length; i++) {
                    await appraisals[i].destroy();
                    deleted++;
                }
            }
        }

        console.log(`✅ Deleted ${deleted} duplicate appraisals`);
        const remaining = await Appraisal.findAll();
        console.log(`Remaining appraisals: ${remaining.length}`);
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

cleanupDuplicates();

const { Appraisal, PerformanceHistory } = require('./models');

const resetSystem = async () => {
    try {
        console.log('⚠️  STARTING SYSTEM RESET ⚠️');
        console.log('This will delete all Appraisals and Leaderboard data.');

        // Delete all performance history (Leaderboard data)
        const historyCount = await PerformanceHistory.destroy({ where: {} });
        console.log(`✅ Performance History cleared. (${historyCount} records deleted)`);

        // Delete all appraisals
        const appraisalCount = await Appraisal.destroy({ where: {} });
        console.log(`✅ Appraisals cleared. (${appraisalCount} records deleted)`);

        console.log('------------------------------------------------');
        console.log('🎉 System reset complete!');
        console.log('   - Leaderboard is empty.');
        console.log('   - All Appraisals are gone.');
        console.log('   - Users and Periods are PRESERVED (Login still works).');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error resetting system:', error);
        process.exit(1);
    }
};

resetSystem();

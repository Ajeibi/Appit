const { PerformanceHistory } = require('./models');

const updateScore = async () => {
    try {
        console.log('Updating Performance History scores...');

        // Find all history records with 0 score
        const histories = await PerformanceHistory.findAll();

        if (histories.length === 0) {
            console.log('No history records found.');
            return;
        }

        for (const history of histories) {
            console.log(`Updating history for User ID ${history.userId}...`);

            // Set a dummy score for demonstration if it's 0
            if (history.score === 0) {
                history.score = 85.5; // Example score
                history.rating = 'EP'; // Example rating (Excellent Performance)
                await history.save();
                console.log(`  -> Updated to Score: 85.5, Rating: EP`);
            } else {
                console.log(`  -> Score already set: ${history.score}`);
            }
        }

        console.log('Update complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error updating scores:', error);
        process.exit(1);
    }
};

updateScore();

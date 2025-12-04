const { Appraisal, PerformanceHistory, User, Period } = require('./models');

const backfillHistory = async () => {
    try {
        console.log('Starting backfill of Performance History...');

        // Find all approved appraisals
        const approvedAppraisals = await Appraisal.findAll({
            where: { status: 'md_approved' },
            include: [{ model: Period }]
        });

        console.log(`Found ${approvedAppraisals.length} approved appraisals.`);

        let createdCount = 0;

        for (const appraisal of approvedAppraisals) {
            // Check if history already exists
            const existingHistory = await PerformanceHistory.findOne({
                where: { appraisalId: appraisal.id }
            });

            if (!existingHistory) {
                console.log(`Creating history for Appraisal ID ${appraisal.id} (Staff ID: ${appraisal.staffId})`);

                // Calculate score/rating if missing from appraisal object
                // Assuming scores are stored in appraisal.scores (JSON)
                // If not, we might need to calculate it or use default
                let score = 0;
                let rating = 'N/A';

                if (appraisal.scores) {
                    score = appraisal.scores.totalScore || 0;
                    rating = appraisal.scores.rating || 'N/A';
                } else {
                    // Fallback: Try to extract from content or set default
                    // For now, let's set a placeholder if missing, or try to parse content
                    console.log('  Warning: No scores found in appraisal. Using defaults.');
                    score = 0; // You might want to update this manually later
                    rating = 'N/A';
                }

                await PerformanceHistory.create({
                    userId: appraisal.staffId,
                    periodId: appraisal.periodId,
                    periodLabel: appraisal.periodLabel || appraisal.Period?.label || 'Unknown',
                    appraisalId: appraisal.id,
                    score: score,
                    rating: rating,
                    completedAt: appraisal.updatedAt
                });

                createdCount++;
            } else {
                console.log(`History already exists for Appraisal ID ${appraisal.id}`);
            }
        }

        console.log(`Backfill complete. Created ${createdCount} new history records.`);
        process.exit(0);
    } catch (error) {
        console.error('Error backfilling history:', error);
        process.exit(1);
    }
};

backfillHistory();

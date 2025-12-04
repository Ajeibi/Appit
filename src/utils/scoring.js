// Scoring utility functions

export const RATING_SCORES = {
    'EP': 20,  // Exceptional: 90 points average
    'SP': 17,  // Strong: 72 points average
    'AP': 14,  // Average: 57 points average
    'NIP': 11, // Needs Improvement: 44.5 points average
    'WP': 8    // Weak: 35 points average
};

export const GRADE_RANGES = {
    'A': { min: 80, max: 100, label: 'Exceptional' },
    'B': { min: 65, max: 79, label: 'Strong' },
    'C': { min: 50, max: 64, label: 'Average' },
    'D': { min: 40, max: 49, label: 'Needs Improvement' },
    'E': { min: 0, max: 39, label: 'Weak' }
};

/**
 * Calculate score from ratings
 * @param {Array} sectionB - Array of 20 skill ratings
 * @param {string} ratingType - 'employeeRating' or 'supervisorRating'
 * @returns {number} - Score out of 100
 */
export const calculateScore = (sectionB, ratingType) => {
    if (!sectionB || sectionB.length === 0) return 0;

    let totalPoints = 0;
    let ratedCount = 0;

    sectionB.forEach(skill => {
        const rating = skill[ratingType];
        if (rating && RATING_SCORES[rating]) {
            totalPoints += RATING_SCORES[rating];
            ratedCount++;
        }
    });

    if (ratedCount === 0) return 0;

    // Maximum possible points for rated items
    const maxPossible = ratedCount * 20;

    // Convert to percentage (out of 100)
    const percentage = (totalPoints / maxPossible) * 100;

    return Math.round(percentage * 10) / 10; // Round to 1 decimal place
};

/**
 * Calculate final score (average of employee and supervisor scores)
 * @param {number} employeeScore - Employee self-assessment score
 * @param {number} supervisorScore - Supervisor rating score
 * @param {number} employeeWeight - Weight for employee score (default 0.3)
 * @param {number} supervisorWeight - Weight for supervisor score (default 0.7)
 * @returns {number} - Weighted final score
 */
export const calculateFinalScore = (
    employeeScore,
    supervisorScore,
    employeeWeight = 0.3,
    supervisorWeight = 0.7
) => {
    const finalScore = (employeeScore * employeeWeight) + (supervisorScore * supervisorWeight);
    return Math.round(finalScore * 10) / 10;
};

/**
 * Get grade from score
 * @param {number} score - Score out of 100
 * @returns {object} - Grade object with letter, label, and color
 */
export const getGrade = (score) => {
    if (score >= 80) return { letter: 'A', ...GRADE_RANGES['A'], color: '#10b981' };
    if (score >= 65) return { letter: 'B', ...GRADE_RANGES['B'], color: '#3b82f6' };
    if (score >= 50) return { letter: 'C', ...GRADE_RANGES['C'], color: '#f59e0b' };
    if (score >= 40) return { letter: 'D', ...GRADE_RANGES['D'], color: '#ef4444' };
    return { letter: 'E', ...GRADE_RANGES['E'], color: '#991b1b' };
};

/**
 * Calculate appraisal scores and grade
 * @param {object} appraisalData - The appraisal data object
 * @returns {object} - Scores and grade information
 */
export const calculateAppraisalScores = (appraisalData) => {
    const employeeScore = calculateScore(appraisalData.sectionB, 'employeeRating');
    const supervisorScore = calculateScore(appraisalData.sectionB, 'supervisorRating');
    const finalScore = calculateFinalScore(employeeScore, supervisorScore);
    const grade = getGrade(finalScore);

    return {
        employeeScore,
        supervisorScore,
        finalScore,
        grade: grade.letter,
        gradeLabel: grade.label,
        gradeColor: grade.color
    };
};

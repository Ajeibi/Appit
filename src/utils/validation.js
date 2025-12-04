/**
 * Validation utilities for the appraisal system
 */

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate user data
 */
export const validateUser = (userData, existingUsers = [], isEdit = false, currentUserId = null) => {
    const errors = {};

    // Required fields
    if (!userData.name || userData.name.trim() === '') {
        errors.name = 'Name is required';
    }

    if (!userData.email || userData.email.trim() === '') {
        errors.email = 'Email is required';
    } else if (!isValidEmail(userData.email)) {
        errors.email = 'Invalid email format';
    } else {
        // Check for duplicate email
        const duplicate = existingUsers.find(
            u => u.email.toLowerCase() === userData.email.toLowerCase() &&
                (!isEdit || u.id !== currentUserId)
        );
        if (duplicate) {
            errors.email = 'Email already exists';
        }
    }

    if (!userData.role) {
        errors.role = 'Role is required';
    }

    if (!userData.designation || userData.designation.trim() === '') {
        errors.designation = 'Designation is required';
    }

    if (!userData.department || userData.department.trim() === '') {
        errors.department = 'Department is required';
    }

    // Staff must have supervisor
    if (userData.role === 'staff' && !userData.supervisorId) {
        errors.supervisorId = 'Staff must be assigned a supervisor';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Validate appraisal data before submission
 */
export const validateAppraisal = (appraisalData, role) => {
    const errors = {};

    if (!appraisalData) {
        return { isValid: false, errors: { general: 'No appraisal data provided' } };
    }

    // Section A validation for staff
    if (role === 'staff') {
        const objectives = appraisalData.sectionA?.objectives || [];
        if (objectives.length === 0) {
            errors.objectives = 'At least one objective is required';
        } else {
            objectives.forEach((obj, idx) => {
                if (!obj.objective || obj.objective.trim() === '') {
                    errors[`objective_${idx}`] = `Objective ${idx + 1} is required`;
                }
                if (!obj.actionPlan || obj.actionPlan.trim() === '') {
                    errors[`actionPlan_${idx}`] = `Action plan ${idx + 1} is required`;
                }
            });
        }

        // Self-assessment validation
        const selfAssessment = appraisalData.sectionA?.selfAssessment || {};
        const requiredFields = ['achievements', 'challenges', 'strengths', 'improvements', 'goals'];
        requiredFields.forEach(field => {
            if (!selfAssessment[field] || selfAssessment[field].trim() === '') {
                errors[`selfAssessment_${field}`] = `${field} is required`;
            }
        });

        // Section B validation - all employee ratings required
        const skills = appraisalData.sectionB || [];
        let missingRatings = 0;
        skills.forEach((skill, idx) => {
            if (!skill.employeeRating) {
                missingRatings++;
            }
        });
        if (missingRatings > 0) {
            errors.employeeRatings = `${missingRatings} skill rating(s) missing`;
        }
    }

    // Supervisor validation
    if (role === 'supervisor') {
        const skills = appraisalData.sectionB || [];
        let missingRatings = 0;
        skills.forEach((skill, idx) => {
            if (!skill.supervisorRating) {
                missingRatings++;
            }
        });
        if (missingRatings > 0) {
            errors.supervisorRatings = `${missingRatings} supervisor rating(s) missing`;
        }

        // Supervisor comments on objectives
        const objectives = appraisalData.sectionA?.objectives || [];
        objectives.forEach((obj, idx) => {
            if (!obj.supervisorComment || obj.supervisorComment.trim() === '') {
                errors[`supervisorComment_${idx}`] = `Supervisor comment ${idx + 1} is required`;
            }
        });
    }

    // HR and MD validation
    if (role === 'hr' || role === 'md') {
        const recommendations = appraisalData.recommendations || {};
        if (!recommendations.learningNeeds || recommendations.learningNeeds.trim() === '') {
            errors.learningNeeds = 'Learning and development needs are required';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

/**
 * Check if user can be deleted
 */
export const canDeleteUser = (userId, appraisals, currentUserId) => {
    const errors = [];

    // Can't delete yourself
    if (userId === currentUserId) {
        errors.push('You cannot delete your own account');
        return { canDelete: false, errors, warnings: [] };
    }

    // Check for associated appraisals
    const userAppraisals = appraisals.filter(a => a.staffId === userId);
    const supervisorAppraisals = appraisals.filter(a => a.supervisorId === userId);

    const warnings = [];
    if (userAppraisals.length > 0) {
        warnings.push(`This user has ${userAppraisals.length} appraisal(s) as staff`);
    }
    if (supervisorAppraisals.length > 0) {
        warnings.push(`This user is supervisor for ${supervisorAppraisals.length} appraisal(s)`);
    }

    return {
        canDelete: errors.length === 0,
        errors,
        warnings
    };
};

/**
 * Check if period can be deleted
 */
export const canDeletePeriod = (periodId, appraisals) => {
    const periodAppraisals = appraisals.filter(a => a.periodId === periodId);

    if (periodAppraisals.length > 0) {
        return {
            canDelete: false,
            errors: [`Cannot delete period with ${periodAppraisals.length} existing appraisal(s)`],
            warnings: []
        };
    }

    return {
        canDelete: true,
        errors: [],
        warnings: []
    };
};

/**
 * Check for duplicate appraisal
 */
export const hasDuplicateAppraisal = (staffId, periodId, appraisals, excludeId = null) => {
    return appraisals.some(a =>
        a.staffId === staffId &&
        a.periodId === periodId &&
        a.id !== excludeId
    );
};

/**
 * Validate period data
 */
export const validatePeriod = (periodData, existingPeriods = [], isEdit = false, currentPeriodId = null) => {
    const errors = {};

    if (!periodData.year) {
        errors.year = 'Year is required';
    } else if (periodData.year < 2020 || periodData.year > 2100) {
        errors.year = 'Invalid year';
    }

    if (!periodData.quarter) {
        errors.quarter = 'Quarter is required';
    }

    // Check for duplicate period
    const duplicate = existingPeriods.find(
        p => p.year === periodData.year &&
            p.quarter === periodData.quarter &&
            (!isEdit || p.id !== currentPeriodId)
    );
    if (duplicate) {
        errors.duplicate = 'Period already exists for this year and quarter';
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

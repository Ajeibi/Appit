const { Appraisal, User, Period, PerformanceHistory } = require('../models');
const { Op } = require('sequelize');

const createAppraisal = async (req, res) => {
    try {
        const { periodId, periodLabel, content } = req.body;
        const staffId = req.user.id;

        // Get staff's supervisor
        const staff = await User.findByPk(staffId);
        if (!staff) return res.status(404).json({ message: 'User not found' });

        const newAppraisal = await Appraisal.create({
            staffId,
            supervisorId: staff.supervisorId, // Auto-assign supervisor
            periodId,
            periodLabel,
            content,
            status: 'draft'
        });

        // Reload with associations so frontend has names immediately
        const fullAppraisal = await Appraisal.findByPk(newAppraisal.id, {
            include: [
                { model: User, as: 'staff', attributes: ['name', 'designation'] },
                { model: User, as: 'supervisor', attributes: ['name'] },
                { model: Period }
            ]
        });

        res.status(201).json(fullAppraisal);
    } catch (error) {
        res.status(500).json({ message: 'Error creating appraisal', error: error.message });
    }
};

const getMyAppraisals = async (req, res) => {
    try {
        const appraisals = await Appraisal.findAll({
            where: { staffId: req.user.id },
            include: [
                { model: Period },
                { model: User, as: 'staff', attributes: ['name', 'designation'] },
                { model: User, as: 'supervisor', attributes: ['name'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(appraisals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appraisals', error: error.message });
    }
};

const getAppraisalsForReview = async (req, res) => {
    try {
        // Supervisors see appraisals assigned to them
        // HR/MD/Admin see all (or filtered)
        let whereClause = {};

        if (req.user.role === 'supervisor') {
            whereClause.supervisorId = req.user.id;
            whereClause.status = { [Op.ne]: 'draft' }; // Don't show drafts
        } else if (['hr', 'md', 'admin'].includes(req.user.role)) {
            // HR/MD see all submitted/approved ones
            whereClause.status = { [Op.ne]: 'draft' };
        } else {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        const appraisals = await Appraisal.findAll({
            where: whereClause,
            include: [
                { model: User, as: 'staff', attributes: ['name', 'email', 'designation'] },
                { model: Period }
            ],
            order: [['updatedAt', 'DESC']]
        });

        res.json(appraisals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reviews', error: error.message });
    }
};

const getAllAppraisals = async (req, res) => {
    try {
        // Admin only - see EVERYTHING including drafts
        const appraisals = await Appraisal.findAll({
            include: [
                { model: User, as: 'staff', attributes: ['name', 'email'] },
                { model: Period }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(appraisals);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching all appraisals', error: error.message });
    }
};

const updateAppraisal = async (req, res) => {
    try {
        const { id } = req.params;
        const { content, status, scores, attachment } = req.body;

        const appraisal = await Appraisal.findByPk(id);
        if (!appraisal) return res.status(404).json({ message: 'Appraisal not found' });

        if (content) appraisal.content = content;
        if (status) appraisal.status = status;
        if (scores) appraisal.scores = scores;
        if (attachment !== undefined) {
            console.log('Saving attachment:', attachment);
            appraisal.attachment = attachment;
        }

        if (status === 'submitted') appraisal.submittedAt = new Date();

        if (status === 'md_approved') {
            appraisal.completedAt = new Date();

            // Create Performance History
            if (scores && scores.totalScore) {
                await PerformanceHistory.create({
                    userId: appraisal.staffId,
                    periodId: appraisal.periodId,
                    periodLabel: appraisal.periodLabel,
                    appraisalId: appraisal.id,
                    score: scores.totalScore,
                    rating: scores.rating || 'N/A'
                });
            }
        }

        await appraisal.save();

        // Convert to plain object and ensure attachment is properly parsed
        const appraisalData = appraisal.toJSON();

        // Parse attachment if it's a string
        if (appraisalData.attachment && typeof appraisalData.attachment === 'string') {
            try {
                appraisalData.attachment = JSON.parse(appraisalData.attachment);
            } catch (e) {
                console.error('Error parsing attachment JSON:', e);
            }
        }

        res.json(appraisalData);
    } catch (error) {
        res.status(500).json({ message: 'Error updating appraisal', error: error.message });
    }
};

const getAppraisalById = async (req, res) => {
    try {
        const { id } = req.params;
        const appraisal = await Appraisal.findByPk(id, {
            include: [
                { model: User, as: 'staff', attributes: ['name', 'email', 'designation'] },
                { model: User, as: 'supervisor', attributes: ['name'] },
                { model: Period }
            ]
        });

        if (!appraisal) return res.status(404).json({ message: 'Appraisal not found' });

        // Check permissions
        const user = req.user;
        const isOwner = appraisal.staffId === user.id;
        const isSupervisor = appraisal.supervisorId === user.id;
        const isHROrMDOrAdmin = ['hr', 'md', 'admin'].includes(user.role);

        if (!isOwner && !isSupervisor && !isHROrMDOrAdmin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        // Convert to plain object and ensure attachment is properly parsed
        const appraisalData = appraisal.toJSON();

        // Parse attachment if it's a string (SQLite sometimes stores JSON as string)
        if (appraisalData.attachment && typeof appraisalData.attachment === 'string') {
            try {
                appraisalData.attachment = JSON.parse(appraisalData.attachment);
            } catch (e) {
                console.error('Error parsing attachment JSON:', e);
            }
        }

        console.log('Sending appraisal with attachment:', appraisalData.attachment);

        res.json(appraisalData);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appraisal', error: error.message });
    }
};

const deleteAppraisal = async (req, res) => {
    try {
        const { id } = req.params;
        const appraisal = await Appraisal.findByPk(id);

        if (!appraisal) return res.status(404).json({ message: 'Appraisal not found' });

        // Check permissions (e.g., only owner if draft, or admin)
        // For simplicity, allowing if authorized via route check

        await appraisal.destroy();
        res.json({ message: 'Appraisal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting appraisal', error: error.message });
    }
};

module.exports = {
    createAppraisal,
    getMyAppraisals,
    getAppraisalsForReview,
    getAllAppraisals,
    updateAppraisal,
    deleteAppraisal,
    getAppraisalById
};

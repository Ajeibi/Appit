const { Period, Appraisal } = require('../models');

const getAllPeriods = async (req, res) => {
    try {
        const periods = await Period.findAll({
            order: [['year', 'DESC'], ['quarter', 'DESC']]
        });
        res.json(periods);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching periods', error: error.message });
    }
};

const createPeriod = async (req, res) => {
    try {
        const { year, quarter, label, isActive } = req.body;

        // Check for duplicate
        const existing = await Period.findOne({ where: { year, quarter } });
        if (existing) {
            return res.status(400).json({ message: 'Period already exists for this year and quarter' });
        }

        const period = await Period.create({
            year,
            quarter,
            label,
            isActive: isActive || false
        });

        res.status(201).json(period);
    } catch (error) {
        res.status(500).json({ message: 'Error creating period', error: error.message });
    }
};

const updatePeriod = async (req, res) => {
    try {
        const { id } = req.params;
        const period = await Period.findByPk(id);

        if (!period) return res.status(404).json({ message: 'Period not found' });

        await period.update(req.body);
        res.json(period);
    } catch (error) {
        res.status(500).json({ message: 'Error updating period', error: error.message });
    }
};

const deletePeriod = async (req, res) => {
    try {
        const { id } = req.params;
        const period = await Period.findByPk(id);

        if (!period) return res.status(404).json({ message: 'Period not found' });

        // Check if used in appraisals
        const used = await Appraisal.findOne({ where: { periodId: id } });
        if (used) {
            return res.status(400).json({ message: 'Cannot delete period that has associated appraisals' });
        }

        await period.destroy();
        res.json({ message: 'Period deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting period', error: error.message });
    }
};

module.exports = { getAllPeriods, createPeriod, updatePeriod, deletePeriod };

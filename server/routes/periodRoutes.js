const express = require('express');
const router = express.Router();
const { getAllPeriods, createPeriod, updatePeriod, deletePeriod } = require('../controllers/periodController');
const { auth, checkRole } = require('../middleware/auth');

router.get('/', auth, getAllPeriods);
router.post('/', auth, checkRole(['admin', 'hr', 'md']), createPeriod);
router.put('/:id', auth, checkRole(['admin', 'hr', 'md']), updatePeriod);
router.delete('/:id', auth, checkRole(['admin']), deletePeriod);

module.exports = router;

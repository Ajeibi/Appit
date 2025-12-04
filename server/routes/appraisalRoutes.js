const express = require('express');
const router = express.Router();
const {
    createAppraisal,
    getMyAppraisals,
    getAppraisalsForReview,
    getAllAppraisals,
    updateAppraisal,
    deleteAppraisal,
    getAppraisalById
} = require('../controllers/appraisalController');
const { auth, checkRole } = require('../middleware/auth');

// Staff routes
router.post('/', auth, createAppraisal);
router.get('/my', auth, getMyAppraisals);

// Admin route
router.get('/all', auth, checkRole(['admin']), getAllAppraisals);

// Review routes (Supervisor/HR/MD)
router.get('/reviews', auth, checkRole(['supervisor', 'hr', 'md', 'admin']), getAppraisalsForReview);

// Update (Submit, Approve, Edit)
router.get('/:id', auth, getAppraisalById);
router.put('/:id', auth, updateAppraisal);
router.delete('/:id', auth, deleteAppraisal);

module.exports = router;

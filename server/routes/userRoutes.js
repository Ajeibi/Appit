const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById, updateUser, deleteUser } = require('../controllers/userController');
const { auth, checkRole } = require('../middleware/auth');

// Only HR, MD, Admin can manage users
router.get('/', auth, checkRole(['hr', 'md', 'admin', 'supervisor']), getAllUsers);
router.get('/:id', auth, getUserById);
router.put('/:id', auth, checkRole(['hr', 'md', 'admin']), updateUser);
router.delete('/:id', auth, checkRole(['admin']), deleteUser);

module.exports = router;

const { User } = require('../models');
const bcrypt = require('bcryptjs');

const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] },
            include: [
                { model: User, as: 'supervisor', attributes: ['name'] },
                { model: require('../models').PerformanceHistory, as: 'performanceHistory' }
            ]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [
                { model: User, as: 'supervisor', attributes: ['name'] },
                { model: User, as: 'subordinates', attributes: ['name'] },
                { model: require('../models').PerformanceHistory, as: 'performanceHistory' }
            ]
        });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, role, designation, department, supervisorId, password } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Update fields
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (designation) user.designation = designation;
        if (department) user.department = department;

        // Handle supervisor assignment (allow setting to null)
        if (supervisorId !== undefined) {
            user.supervisorId = supervisorId === '' ? null : supervisorId;
        }

        // Handle password update if provided
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        // Fetch updated user with supervisor info
        const updatedUser = await User.findByPk(id, {
            attributes: { exclude: ['password'] },
            include: [{ model: User, as: 'supervisor', attributes: ['name'] }]
        });

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id);

        if (!user) return res.status(404).json({ message: 'User not found' });

        await user.destroy();
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };

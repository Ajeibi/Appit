import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { UserPlus, Trash2, Edit } from 'lucide-react';

const StaffManagement = () => {
    const { users, addUser, deleteUser, forceDeleteUser, updateUser } = useData();
    const { user: currentUser } = useAuth();
    const notify = useNotification();
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        id: '',
        name: '',
        email: '',
        password: '',
        role: 'staff',
        designation: '',
        department: '',
        supervisorId: '',
        performanceHistory: [],
    });
    const [formErrors, setFormErrors] = useState({});

    if (currentUser.role !== 'hr' && currentUser.role !== 'admin') {
        return <div style={{ color: 'white' }}>Access Denied</div>;
    }

    const handleOpenAdd = () => {
        setIsEditing(false);
        setFormData({
            name: '',
            email: '',
            password: '',
            role: 'staff',
            designation: '',
            department: '',
            supervisorId: '',
            performanceHistory: [],
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleOpenEdit = (user) => {
        setIsEditing(true);
        setFormData({
            id: user.id,
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            designation: user.designation,
            department: user.department,
            supervisorId: user.supervisorId || '',
            performanceHistory: user.performanceHistory || [],
        });
        setFormErrors({});
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormErrors({});

        try {
            let result;
            if (isEditing) {
                result = await updateUser(formData.id, formData);
            } else {
                result = await addUser(formData, currentUser.id);
            }

            if (result.success) {
                notify.success(isEditing ? 'User updated successfully!' : 'User added successfully!');
                setShowModal(false);
                setFormData({
                    name: '',
                    email: '',
                    password: '',
                    role: 'staff',
                    designation: '',
                    department: '',
                    supervisorId: '',
                    performanceHistory: [],
                });
            } else {
                notify.error(result.error || 'Failed to save user');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            notify.error('An unexpected error occurred');
        }
    };


    const handleDelete = async (id, userName) => {
        // First attempt to delete
        const result = await deleteUser(id, currentUser.id);

        if (result.success) {
            notify.success(`${userName} deleted successfully`);
        } else if (result.requiresConfirmation && result.warnings) {
            // Show warnings and ask for confirmation
            const warningMessage = result.warnings.join('\n');
            const confirmed = window.confirm(
                `Warning:\n${warningMessage}\n\nDeleting this user may affect existing appraisals.\n\nDo you want to continue?`
            );

            if (confirmed) {
                const forceResult = await forceDeleteUser(id);
                if (forceResult.success) {
                    notify.success(`${userName} deleted successfully`);
                } else {
                    notify.error(forceResult.error || 'Failed to delete user');
                }
            }
        } else if (result.error) {
            notify.error(result.error);
        }
    };


    const supervisors = users.filter(u => u.role === 'supervisor');

    return (
        <div className="animate-fade-in">
            <div className="header">
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'white' }}>Staff Management</h1>
                <button onClick={handleOpenAdd} className="btn btn-primary">
                    <UserPlus size={20} />
                    Add Staff
                </button>
            </div>

            <div className="card glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--color-text)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Name</th>
                            <th style={{ padding: '1rem' }}>Email</th>
                            <th style={{ padding: '1rem' }}>Role</th>
                            <th style={{ padding: '1rem' }}>Designation</th>
                            <th style={{ padding: '1rem' }}>Department</th>
                            <th style={{ padding: '1rem' }}>Supervisor</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem' }}>{u.name}</td>
                                <td style={{ padding: '1rem' }}>{u.email}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'md' ? 'badge-warning' : 'badge-neutral'}`}>
                                        {u.role.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem' }}>{u.designation}</td>
                                <td style={{ padding: '1rem' }}>{u.department}</td>
                                <td style={{ padding: '1rem' }}>
                                    {u.supervisorId ? users.find(s => s.id === u.supervisorId)?.name : '-'}
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => handleOpenEdit(u)}
                                        className="btn btn-secondary"
                                        style={{ padding: '0.5rem' }}
                                        title="Edit User"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(u.id, u.name)}
                                        className="btn btn-danger"
                                        style={{ padding: '0.5rem' }}
                                        disabled={u.id === currentUser.id}
                                        title={u.id === currentUser.id ? "Cannot delete yourself" : "Delete User"}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit User Modal */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'white', marginBottom: '1.5rem' }}>
                            {isEditing ? 'Edit Staff' : 'Add New Staff'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Name</label>
                                <input
                                    className="input"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Email</label>
                                <input
                                    type="email"
                                    className="input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">
                                    {isEditing ? 'Password (leave blank to keep current)' : 'Password'}
                                </label>
                                <input
                                    type="password"
                                    className="input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!isEditing}
                                    placeholder={isEditing ? "Enter new password to reset" : "Enter password"}
                                    minLength={6}
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Role</label>
                                <select
                                    className="input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <option value="staff">Staff</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="hr">HR</option>
                                    <option value="md">MD/CEO</option>
                                    {currentUser.role === 'admin' && <option value="admin">Admin</option>}
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Designation</label>
                                <input
                                    className="input"
                                    value={formData.designation}
                                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Department</label>
                                <input
                                    className="input"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Assign Supervisor</label>
                                <select
                                    className="input"
                                    value={formData.supervisorId}
                                    onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                                >
                                    <option value="">Select Supervisor</option>
                                    {supervisors.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    {isEditing ? 'Save Changes' : 'Add Staff'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffManagement;

import React from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

const AdminPanel = () => {
    const { appraisals, users } = useData();
    const { user: currentUser, logout } = useAuth();

    if (currentUser.role !== 'admin') {
        return <div style={{ color: 'white' }}>Access Denied</div>;
    }

    const handleResetSystem = () => {
        const confirmed = window.confirm(
            'WARNING: This will delete ALL data (users, appraisals, periods) and reset the system to its initial state.\n\n' +
            'You will be logged out and the system will reload.\n\n' +
            'Are you absolutely sure you want to continue?'
        );

        if (confirmed) {
            try {
                // Log out first
                logout();

                // Clear all localStorage data
                localStorage.removeItem('agrop_appraisals');
                localStorage.removeItem('agrop_users');
                localStorage.removeItem('agrop_periods');
                localStorage.removeItem('agrop_user');

                // Clear everything else
                localStorage.clear();

                // Force reload to reinitialize with default data
                setTimeout(() => {
                    window.location.href = '/';
                }, 100);
            } catch (error) {
                console.error('Error resetting system:', error);
                alert('Failed to reset system. Please try refreshing the page manually.');
            }
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="header">
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'white' }}>System Administration</h1>
            </div>

            <AnalyticsDashboard appraisals={appraisals} users={users} />

            <div className="card glass-panel" style={{ marginTop: '2rem', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#ef4444', marginBottom: '1rem' }}>
                    ⚠️ Danger Zone
                </h2>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    Resetting the system will clear all appraisals, users, and periods, reverting to the initial default state.
                    This action cannot be undone. You will be logged out automatically.
                </p>
                <button
                    onClick={handleResetSystem}
                    className="btn btn-danger"
                    style={{ fontWeight: '600' }}
                >
                    🗑️ Reset System Data
                </button>
            </div>
        </div>
    );
};

export default AdminPanel;

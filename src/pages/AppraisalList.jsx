import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Eye, Search } from 'lucide-react';

const AppraisalList = () => {
    const { user } = useAuth();
    const { appraisals, deleteAppraisal, users } = useData();
    const notify = useNotification();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    // Filter logic
    let filteredAppraisals = [];
    if (user.role === 'staff') {
        filteredAppraisals = appraisals.filter(a => a.staffId === user.id);
    } else if (user.role === 'supervisor') {
        filteredAppraisals = appraisals.filter(a => a.supervisorId === user.id);
    } else {
        filteredAppraisals = appraisals; // HR, MD, Admin see all
    }

    // Apply Search Filter
    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filteredAppraisals = filteredAppraisals.filter(app => {
            const staffName = app.staff?.name || users.find(u => u.id === app.staffId)?.name || '';
            const staffEmail = app.staff?.email || users.find(u => u.id === app.staffId)?.email || '';
            return (
                staffName.toLowerCase().includes(lowerQuery) ||
                staffEmail.toLowerCase().includes(lowerQuery)
            );
        });
    }

    // Apply Status Filter
    if (statusFilter !== 'all') {
        filteredAppraisals = filteredAppraisals.filter(app => app.status === statusFilter);
    }

    const handleDelete = async (id) => {
        const appraisal = appraisals.find(a => a.id === id);
        if (!appraisal) return;

        const staffName = appraisal.staff?.name || users.find(u => u.id === appraisal.staffId)?.name || 'Unknown';
        let confirmMessage = 'Are you sure you want to delete this draft appraisal?';
        if (appraisal.status !== 'draft') {
            confirmMessage = `WARNING: You are about to delete a SUBMITTED appraisal for ${staffName}. This action cannot be undone. Are you sure?`;
        }

        if (window.confirm(confirmMessage)) {
            const result = await deleteAppraisal(id);
            if (result.success) {
                notify.success('Appraisal deleted successfully');
            } else {
                notify.error(result.error || 'Failed to delete appraisal');
            }
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            draft: 'badge-neutral',
            submitted: 'badge-warning',
            supervisor_approved: 'badge-warning',
            hr_approved: 'badge-warning',
            md_approved: 'badge-success',
        };
        return <span className={`badge ${styles[status]}`}>{status.replace('_', ' ')}</span>;
    };

    return (
        <div className="animate-fade-in">
            <div className="header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'white' }}>Appraisals</h1>
                    {user.role === 'staff' && (
                        <button onClick={() => navigate('/appraisals/new')} className="btn btn-primary">
                            + New Appraisal
                        </button>
                    )}
                </div>

                {/* Search and Filter for Admin/HR/MD/Supervisor */}
                {user.role !== 'staff' && (
                    <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
                        <div className="input-group" style={{ flex: 1, minWidth: '250px' }}>
                            <span className="input-group-text">
                                <Search size={18} />
                            </span>
                            <input
                                type="text"
                                className="input"
                                placeholder="Search by staff name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                            />
                        </div>
                        <select
                            className="input"
                            style={{ width: 'auto', minWidth: '180px' }}
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="submitted">Submitted</option>
                            <option value="supervisor_approved">Supervisor Approved</option>
                            <option value="hr_approved">HR Approved</option>
                            <option value="md_approved">MD Approved</option>
                        </select>
                    </div>
                )}
            </div>

            <div className="card glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--color-text)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Period</th>
                            <th style={{ padding: '1rem' }}>Staff Name</th>
                            <th style={{ padding: '1rem' }}>Created Date</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAppraisals.length === 0 ? (
                            <tr>
                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    {searchQuery || statusFilter !== 'all' ? 'No appraisals match your filters.' : 'No appraisals found.'}
                                </td>
                            </tr>
                        ) : (
                            filteredAppraisals.map((app) => {
                                const staffName = app.staff?.name || users.find(u => u.id === app.staffId)?.name || 'Unknown Staff';
                                const staffEmail = app.staff?.email || users.find(u => u.id === app.staffId)?.email || '';
                                const canDelete = (app.status === 'draft' && user.role === 'staff') || user.role === 'admin' || user.role === 'hr';

                                return (
                                    <tr key={app.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>{app.periodLabel || app.period}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {staffName}
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{staffEmail}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{new Date(app.createdAt).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>{getStatusBadge(app.status)}</td>
                                        <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => navigate(`/appraisals/${app.id}`)}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.5rem' }}
                                                title="View/Edit"
                                            >
                                                {app.status === 'draft' && user.role === 'staff' ? <Edit size={16} /> : <Eye size={16} />}
                                            </button>

                                            {canDelete && (
                                                <button
                                                    onClick={() => handleDelete(app.id)}
                                                    className="btn btn-danger"
                                                    style={{ padding: '0.5rem' }}
                                                    title={user.role === 'admin' || user.role === 'hr' ? "Delete Appraisal" : "Delete Draft"}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AppraisalList;

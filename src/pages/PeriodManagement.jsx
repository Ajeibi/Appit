import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Calendar, Plus, X, Check } from 'lucide-react';

const PeriodManagement = () => {
    const { periods, addPeriod, updatePeriod, deletePeriod } = useData();
    const { user } = useAuth();
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPeriod, setNewPeriod] = useState({
        year: new Date().getFullYear(),
        quarter: 'Q1',
        label: '',
        isActive: true
    });

    if (user.role !== 'admin' && user.role !== 'hr') {
        return <div style={{ color: 'white' }}>Access Denied - Admin/HR Only</div>;
    }

    const handleAddPeriod = async (e) => {
        e.preventDefault();
        const label = `${newPeriod.year} ${newPeriod.quarter}`;
        await addPeriod({
            year: newPeriod.year,
            quarter: newPeriod.quarter,
            label,
            isActive: newPeriod.isActive
        });
        setShowAddModal(false);
        setNewPeriod({
            year: new Date().getFullYear(),
            quarter: 'Q1',
            label: '',
            isActive: true
        });
    };

    const toggleStatus = async (id, currentIsActive) => {
        await updatePeriod(id, { isActive: !currentIsActive });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this period? This cannot be undone.')) {
            await deletePeriod(id);
        }
    };

    const sortedPeriods = [...periods].sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        const qOrder = { 'Q1': 1, 'Q2': 2, 'Q3': 3, 'Q4': 4 };
        return qOrder[b.quarter] - qOrder[a.quarter];
    });

    return (
        <div className="animate-fade-in">
            <div className="header">
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'white' }}>
                    Appraisal Period Management
                </h1>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
                    <Plus size={20} />
                    Create New Period
                </button>
            </div>

            <div className="card glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--color-text)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Period</th>
                            <th style={{ padding: '1rem' }}>Year</th>
                            <th style={{ padding: '1rem' }}>Quarter</th>
                            <th style={{ padding: '1rem' }}>Status</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPeriods.map((period) => (
                            <tr key={period.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ padding: '1rem', fontWeight: '600' }}>{period.label}</td>
                                <td style={{ padding: '1rem' }}>{period.year}</td>
                                <td style={{ padding: '1rem' }}>{period.quarter}</td>
                                <td style={{ padding: '1rem' }}>
                                    <span className={`badge ${period.isActive ? 'badge-success' : 'badge-neutral'}`}>
                                        {period.isActive ? 'ACTIVE' : 'CLOSED'}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => toggleStatus(period.id, period.isActive)}
                                        className={`btn ${period.isActive ? 'btn-secondary' : 'btn-primary'}`}
                                        style={{ padding: '0.5rem' }}
                                        title={period.isActive ? 'Close Period' : 'Activate Period'}
                                    >
                                        {period.isActive ? <X size={16} /> : <Check size={16} />}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(period.id)}
                                        className="btn btn-danger"
                                        style={{ padding: '0.5rem' }}
                                        title="Delete Period"
                                    >
                                        <X size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add Period Modal */}
            {showAddModal && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000,
                    }}
                >
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'white', marginBottom: '1.5rem' }}>
                            Create New Appraisal Period
                        </h2>
                        <form onSubmit={handleAddPeriod}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Year</label>
                                <input
                                    type="number"
                                    className="input"
                                    value={newPeriod.year}
                                    onChange={(e) => setNewPeriod({ ...newPeriod, year: parseInt(e.target.value) })}
                                    min="2020"
                                    max="2030"
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Quarter</label>
                                <select
                                    className="input"
                                    value={newPeriod.quarter}
                                    onChange={(e) => setNewPeriod({ ...newPeriod, quarter: e.target.value })}
                                >
                                    <option value="Q1">Q1 (Jan - Mar)</option>
                                    <option value="Q2">Q2 (Apr - Jun)</option>
                                    <option value="Q3">Q3 (Jul - Sep)</option>
                                    <option value="Q4">Q4 (Oct - Dec)</option>
                                </select>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label className="label">Status</label>
                                <select
                                    className="input"
                                    value={newPeriod.isActive}
                                    onChange={(e) => setNewPeriod({ ...newPeriod, isActive: e.target.value === 'true' })}
                                >
                                    <option value="true">Active</option>
                                    <option value="false">Closed</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="btn btn-secondary"
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    Create Period
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeriodManagement;

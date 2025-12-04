import React from 'react';
import { BarChart3, Users, FileText, TrendingUp, Award } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '1rem', borderRadius: '0.75rem', background: `rgba(${color}, 0.1)`, color: `rgb(${color})` }}>
            <Icon size={32} />
        </div>
        <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{title}</p>
            <h3 style={{ fontSize: '2rem', fontWeight: '700', color: 'white' }}>{value}</h3>
            {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{subtitle}</p>}
        </div>
    </div>
);

const AnalyticsDashboard = ({ appraisals, users }) => {
    const stats = {
        totalUsers: users.length,
        totalAppraisals: appraisals.length,
        drafts: appraisals.filter(a => a.status === 'draft').length,
        pending: appraisals.filter(a => a.status === 'submitted' || a.status === 'supervisor_approved' || a.status === 'hr_approved').length,
        completed: appraisals.filter(a => a.status === 'md_approved').length,
        staff: users.filter(u => u.role === 'staff').length,
        supervisors: users.filter(u => u.role === 'supervisor').length,
    };

    // Calculate average score from completed appraisals
    const completedWithScores = appraisals.filter(a => a.status === 'md_approved' && a.scores);
    const averageScore = completedWithScores.length > 0
        ? (completedWithScores.reduce((sum, a) => sum + a.scores.finalScore, 0) / completedWithScores.length).toFixed(1)
        : 0;

    // Grade distribution
    const gradeDistribution = completedWithScores.reduce((acc, a) => {
        const grade = a.scores.grade;
        acc[grade] = (acc[grade] || 0) + 1;
        return acc;
    }, {});

    const completionRate = stats.totalAppraisals > 0
        ? ((stats.completed / stats.totalAppraisals) * 100).toFixed(1)
        : 0;

    return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="16, 185, 129"
                    subtitle={`${stats.staff} staff, ${stats.supervisors} supervisors`}
                />
                <StatCard
                    title="Total Appraisals"
                    value={stats.totalAppraisals}
                    icon={FileText}
                    color="59, 130, 246"
                    subtitle={`${stats.drafts} drafts, ${stats.pending} pending`}
                />
                <StatCard
                    title="Completed"
                    value={stats.completed}
                    icon={TrendingUp}
                    color="34, 197, 94"
                    subtitle={`${completionRate}% completion rate`}
                />
                <StatCard
                    title="Average Score"
                    value={averageScore > 0 ? `${averageScore}%` : 'N/A'}
                    icon={Award}
                    color="251, 191, 36"
                    subtitle={completedWithScores.length > 0 ? `From ${completedWithScores.length} appraisals` : 'No completed appraisals'}
                />
            </div>

            <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>
                    Appraisal Status Breakdown
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'Drafts', count: stats.drafts, color: '#94a3b8' },
                        { label: 'Pending Supervisor', count: appraisals.filter(a => a.status === 'submitted').length, color: '#f59e0b' },
                        { label: 'Pending HR', count: appraisals.filter(a => a.status === 'supervisor_approved').length, color: '#3b82f6' },
                        { label: 'Pending MD', count: appraisals.filter(a => a.status === 'hr_approved').length, color: '#8b5cf6' },
                        { label: 'Completed', count: stats.completed, color: '#10b981' },
                    ].map((item) => (
                        <div
                            key={item.label}
                            style={{
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '0.5rem',
                                borderLeft: `4px solid ${item.color}`
                            }}
                        >
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                {item.label}
                            </p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>
                                {item.count}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {completedWithScores.length > 0 && (
                <div className="card glass-panel" style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>
                        Grade Distribution
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                        {['A', 'B', 'C', 'D', 'E'].map((grade) => {
                            const count = gradeDistribution[grade] || 0;
                            const colors = {
                                'A': '#10b981',
                                'B': '#3b82f6',
                                'C': '#f59e0b',
                                'D': '#ef4444',
                                'E': '#991b1b'
                            };
                            return (
                                <div
                                    key={grade}
                                    style={{
                                        padding: '1rem',
                                        background: `${colors[grade]}20`,
                                        borderRadius: '0.5rem',
                                        textAlign: 'center',
                                        border: `2px solid ${colors[grade]}`
                                    }}
                                >
                                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                        Grade {grade}
                                    </p>
                                    <p style={{ fontSize: '1.5rem', fontWeight: '700', color: colors[grade] }}>
                                        {count}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="card glass-panel">
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>
                    User Distribution by Role
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                    {Object.entries({
                        Staff: users.filter(u => u.role === 'staff').length,
                        Supervisor: users.filter(u => u.role === 'supervisor').length,
                        HR: users.filter(u => u.role === 'hr').length,
                        'MD/CEO': users.filter(u => u.role === 'md').length,
                        Admin: users.filter(u => u.role === 'admin').length,
                    }).map(([role, count]) => (
                        <div
                            key={role}
                            style={{
                                padding: '1rem',
                                background: 'rgba(16, 185, 129, 0.05)',
                                borderRadius: '0.5rem',
                                textAlign: 'center'
                            }}
                        >
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>
                                {role}
                            </p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                                {count}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;

import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { Trophy, Award, Medal, TrendingUp, Download, Search } from 'lucide-react';
import { generateAppraisalPDF } from '../utils/pdfGenerator';

const Leaderboard = () => {
    const { users, periods, appraisals } = useData();
    const { user: currentUser } = useAuth();
    const notify = useNotification();
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [searchQuery, setSearchQuery] = useState('');

    // Get all staff members with performance history
    const staffWithPerformance = users.filter(u =>
        u.role === 'staff' && u.performanceHistory && u.performanceHistory.length > 0
    );

    // Calculate rankings based on selected period
    const calculateRankings = () => {
        let rankings = staffWithPerformance.map(staff => {
            let scores = [];
            let totalScore = 0;
            let maxPossibleScore = 0;

            if (selectedPeriod === 'all') {
                // Cumulative yearly performance (Q1-Q4)
                const yearPeriods = periods.filter(p =>
                    p.label && p.label.includes(selectedYear.toString())
                );

                // Get scores for each quarter of the selected year
                yearPeriods.forEach(period => {
                    const periodScore = staff.performanceHistory.find(h =>
                        h.periodId === period.id
                    );
                    if (periodScore) {
                        scores.push(periodScore);
                        totalScore += periodScore.score || 0;
                    }
                });

                // Max possible score is 100 per quarter * number of quarters
                maxPossibleScore = yearPeriods.length * 100;
            } else {
                // Specific quarter
                const periodScore = staff.performanceHistory.find(h =>
                    h.periodId === Number(selectedPeriod)
                );
                if (periodScore) {
                    scores.push(periodScore);
                    totalScore = periodScore.score || 0;
                    maxPossibleScore = 100; // Single quarter max
                }
            }

            if (scores.length === 0) return null;

            // Calculate percentage score
            const percentageScore = maxPossibleScore > 0
                ? Math.round((totalScore / maxPossibleScore) * 100 * 10) / 10
                : 0;

            const latestGrade = scores[scores.length - 1]?.rating || 'N/A';

            // Determine color based on rating
            let gradeColor = '#94a3b8'; // Default gray
            if (latestGrade === 'EP') gradeColor = '#10b981'; // Green
            else if (latestGrade === 'SP') gradeColor = '#3b82f6'; // Blue
            else if (latestGrade === 'AP') gradeColor = '#f59e0b'; // Amber
            else if (latestGrade === 'NIP') gradeColor = '#ef4444'; // Red
            else if (latestGrade === 'WP') gradeColor = '#7f1d1d'; // Dark Red

            return {
                ...staff,
                totalScore,
                percentageScore,
                appraisalCount: scores.length,
                latestGrade,
                latestGradeColor: gradeColor,
                quartersCompleted: scores.length,
            };
        }).filter(Boolean);

        // Filter by search query
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            rankings = rankings.filter(r =>
                r.name.toLowerCase().includes(lowerQuery) ||
                r.email.toLowerCase().includes(lowerQuery)
            );
        }

        // Sort by percentage score (highest first)
        rankings.sort((a, b) => b.percentageScore - a.percentageScore);

        return rankings;
    };

    const rankings = calculateRankings();

    const getMedalIcon = (position) => {
        if (position === 0) return { icon: Trophy, color: '#fbbf24', label: '1st Place' };
        if (position === 1) return { icon: Award, color: '#9ca3af', label: '2nd Place' };
        if (position === 2) return { icon: Medal, color: '#d97706', label: '3rd Place' };
        return { icon: TrendingUp, color: '#10b981', label: `${position + 1}th Place` };
    };

    const handleDownload = (staff) => {
        // Find the relevant appraisal
        let historyItem = null;

        if (selectedPeriod !== 'all') {
            historyItem = staff.performanceHistory.find(h => h.periodId === Number(selectedPeriod));
        } else {
            // Get latest for the year
            historyItem = staff.performanceHistory
                .filter(h => h.periodLabel && h.periodLabel.includes(selectedYear.toString()))
                .sort((a, b) => new Date(b.completedAt || 0) - new Date(a.completedAt || 0))[0];
        }

        if (!historyItem) {
            notify.error('No appraisal data found for download');
            return;
        }

        // Find full appraisal object
        const fullAppraisal = appraisals.find(a =>
            a.staffId === staff.id &&
            (a.periodLabel === historyItem.periodLabel || a.periodId === historyItem.periodId)
        );

        if (fullAppraisal) {
            // Use nested supervisor if available
            const supervisor = fullAppraisal.supervisor || users.find(u => u.id === fullAppraisal.supervisorId);
            try {
                generateAppraisalPDF(fullAppraisal, staff, supervisor);
                notify.success(`Downloading report for ${staff.name}...`);
            } catch (err) {
                console.error('PDF Generation Error:', err);
                notify.error(`Failed to generate PDF: ${err.message}`);
            }
        } else {
            notify.error('Appraisal details not found');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="header">
                <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'white' }}>Performance Leaderboard</h1>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {/* Search Input */}
                    <div className="input-group" style={{ width: '250px' }}>
                        <span className="input-group-text">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            className="input"
                            placeholder="Search staff..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
                        />
                    </div>

                    <select
                        className="input"
                        style={{ width: 'auto' }}
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    >
                        {[2024, 2025, 2026].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>

                    <select
                        className="input"
                        style={{ width: 'auto' }}
                        value={selectedPeriod}
                        onChange={(e) => setSelectedPeriod(e.target.value)}
                    >
                        <option value="all">Full Year {selectedYear}</option>
                        {periods.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Info Banner */}
            <div style={{
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '0.5rem',
                marginBottom: '1.5rem',
                color: 'var(--color-text)'
            }}>
                <div style={{ fontSize: '0.875rem' }}>
                    {selectedPeriod === 'all' ? (
                        <>
                            <strong style={{ color: '#3b82f6' }}>📊 Yearly Cumulative Ranking:</strong> Scores are calculated by summing all quarterly scores (Q1-Q4) and converting to a percentage. Maximum possible score is 400 points (100 per quarter).
                        </>
                    ) : (
                        <>
                            <strong style={{ color: '#3b82f6' }}>📊 Quarterly Ranking:</strong> Scores are shown as a percentage of the maximum possible score (100 points) for the selected quarter.
                        </>
                    )}
                </div>
            </div>

            <div className="card glass-panel" style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--color-text)' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'left' }}>
                            <th style={{ padding: '1rem' }}>Rank</th>
                            <th style={{ padding: '1rem' }}>Staff Name</th>
                            <th style={{ padding: '1rem' }}>Designation</th>
                            <th style={{ padding: '1rem' }}>Score</th>
                            <th style={{ padding: '1rem' }}>Quarters</th>
                            <th style={{ padding: '1rem' }}>Latest Grade</th>
                            <th style={{ padding: '1rem' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rankings.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    <Trophy size={48} color="var(--color-text-muted)" style={{ marginBottom: '1rem', opacity: 0.5, display: 'block', margin: '0 auto 1rem' }} />
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white', marginBottom: '0.5rem' }}>No Rankings Available</h3>
                                    <p>{searchQuery ? 'No staff members match your search.' : 'No performance data found for the selected period.'}</p>
                                </td>
                            </tr>
                        ) : (
                            rankings.map((staff, index) => {
                                const { icon: Icon, color, label } = getMedalIcon(index);

                                return (
                                    <tr key={staff.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '1rem',
                                                fontSize: '0.875rem',
                                                fontWeight: '600',
                                                color: index < 3 ? color : 'var(--color-text-muted)'
                                            }}>
                                                <Icon size={14} color={color} />
                                                {index + 1}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: '600', color: 'white' }}>{staff.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{staff.email}</div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{staff.designation}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ minWidth: '150px' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '0.25rem'
                                                }}>
                                                    <span style={{ fontWeight: '700', fontSize: '1.125rem', color: 'white' }}>
                                                        {staff.percentageScore}%
                                                    </span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                                        {staff.totalScore} pts
                                                    </span>
                                                </div>
                                                {/* Progress bar */}
                                                <div style={{
                                                    width: '100%',
                                                    height: '6px',
                                                    background: 'rgba(255,255,255,0.1)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${staff.percentageScore}%`,
                                                        height: '100%',
                                                        background: staff.percentageScore >= 80 ? '#10b981' :
                                                            staff.percentageScore >= 60 ? '#3b82f6' :
                                                                staff.percentageScore >= 40 ? '#f59e0b' : '#ef4444',
                                                        transition: 'width 0.3s ease'
                                                    }}></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '0.25rem',
                                                background: 'rgba(59, 130, 246, 0.2)',
                                                color: '#3b82f6',
                                                fontWeight: '600',
                                                fontSize: '0.875rem',
                                                border: '1px solid rgba(59, 130, 246, 0.4)'
                                            }}>
                                                {staff.quartersCompleted} / {selectedPeriod === 'all' ? '4' : '1'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '0.25rem',
                                                background: `${staff.latestGradeColor}20`, // 20% opacity
                                                color: staff.latestGradeColor,
                                                fontWeight: '600',
                                                fontSize: '0.875rem',
                                                border: `1px solid ${staff.latestGradeColor}40`
                                            }}>
                                                {staff.latestGrade}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <button
                                                onClick={() => handleDownload(staff)}
                                                className="btn btn-secondary"
                                                style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                                                title="Download Report"
                                            >
                                                <Download size={16} />
                                            </button>
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

export default Leaderboard;

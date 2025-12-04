import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const StatCard = ({ title, count, icon: Icon, color }) => (
    <div className="card glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '1rem', borderRadius: '0.75rem', background: `rgba(${color}, 0.1)`, color: `rgb(${color})` }}>
            <Icon size={24} />
        </div>
        <div>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{title}</p>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'white' }}>{count}</h3>
        </div>
    </div>
);

const LiveClock = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                {formatDate(currentTime)}
            </div>
            <div style={{ fontSize: '1rem', color: 'var(--color-primary)', fontWeight: '600', fontFamily: 'monospace' }}>
                {formatTime(currentTime)}
            </div>
        </div>
    );
};

import AnalyticsDashboard from '../components/AnalyticsDashboard';

const Dashboard = () => {
    const { user } = useAuth();
    const { appraisals, users } = useData(); // Get users too
    const navigate = useNavigate();

    // Filter appraisals based on role
    const myAppraisals = appraisals.filter(a => a.staffId === user.id);
    const pendingSupervisor = appraisals.filter(a => a.supervisorId === user.id && a.status === 'submitted');
    const pendingHR = appraisals.filter(a => a.status === 'supervisor_approved');
    const pendingMD = appraisals.filter(a => a.status === 'hr_approved');

    const getStats = () => {
        switch (user.role) {
            case 'staff':
                return [
                    { title: 'My Drafts', count: myAppraisals.filter(a => a.status === 'draft').length, icon: FileText, color: '245, 158, 11' },
                    { title: 'Submitted', count: myAppraisals.filter(a => a.status === 'submitted').length, icon: Clock, color: '59, 130, 246' },
                    { title: 'Completed', count: myAppraisals.filter(a => a.status === 'md_approved').length, icon: CheckCircle, color: '34, 197, 94' },
                ];
            case 'supervisor':
                return [
                    { title: 'Pending Review', count: pendingSupervisor.length, icon: AlertCircle, color: '239, 68, 68' },
                    { title: 'Reviewed', count: appraisals.filter(a => a.supervisorId === user.id && a.status !== 'submitted' && a.status !== 'draft').length, icon: CheckCircle, color: '34, 197, 94' },
                ];
            case 'hr':
                return [
                    { title: 'Pending HR Review', count: pendingHR.length, icon: AlertCircle, color: '239, 68, 68' },
                    { title: 'Total Appraisals', count: appraisals.length, icon: FileText, color: '59, 130, 246' },
                ];
            case 'md':
                return [
                    { title: 'Pending Sign-off', count: pendingMD.length, icon: AlertCircle, color: '239, 68, 68' },
                    { title: 'Completed', count: appraisals.filter(a => a.status === 'md_approved').length, icon: CheckCircle, color: '34, 197, 94' },
                ];
            default:
                return [
                    { title: 'Total Appraisals', count: appraisals.length, icon: FileText, color: '59, 130, 246' },
                ];
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: '700', color: 'white' }}>Dashboard</h1>
                        <p style={{ color: 'var(--color-text-muted)' }}>Welcome back, {user.name}</p>
                    </div>
                    <LiveClock />
                </div>
                {user.role === 'staff' && (
                    <button onClick={() => navigate('/appraisals/new')} className="btn btn-primary">
                        + New Appraisal
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {getStats().map((stat, i) => (
                    <StatCard key={i} {...stat} />
                ))}
            </div>

            {/* Show Analytics for HR and MD */}
            {(user.role === 'hr' || user.role === 'md') && (
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'white', marginBottom: '1rem' }}>
                        Organization Overview
                    </h2>
                    <AnalyticsDashboard appraisals={appraisals} users={users} />
                </div>
            )}

            <div className="card glass-panel">
                <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem', color: 'white' }}>Recent Activity</h2>
                {/* Placeholder for activity log */}
                <div style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No recent activity to show.</div>
            </div>
        </div>
    );
};

export default Dashboard;

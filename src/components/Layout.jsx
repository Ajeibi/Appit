import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Settings, LogOut, Calendar, Trophy } from 'lucide-react';
import logo from '../assets/logo.png';

const LiveClock = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const formatDate = (date) => {
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div style={{
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
        }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: '500' }}>
                {formatDate(currentTime)}
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--color-primary)', fontWeight: '600', fontFamily: 'monospace' }}>
                {formatTime(currentTime)}
            </div>
        </div>
    );
};

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['staff', 'supervisor', 'hr', 'md', 'admin'] },
        { path: '/appraisals', label: 'Appraisals', icon: FileText, roles: ['staff', 'supervisor', 'hr', 'md'] },
        { path: '/leaderboard', label: 'Leaderboard', icon: Trophy, roles: ['staff', 'supervisor', 'hr', 'md', 'admin'] },
        { path: '/staff', label: 'Staff Management', icon: Users, roles: ['hr', 'admin'] },
        { path: '/periods', label: 'Period Management', icon: Calendar, roles: ['admin'] },
        { path: '/admin', label: 'System Admin', icon: Settings, roles: ['admin'] },
    ];

    const filteredNav = navItems.filter(item => item.roles.includes(user?.role));

    return (
        <div className="layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '3rem' }} className="logo-container">
                    <img src={logo} alt="Agro Preciso" style={{ width: '100%', height: 'auto', maxHeight: '50px', objectFit: 'contain' }} />
                </div>

                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredNav.map((item) => (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`btn ${location.pathname.startsWith(item.path) ? 'btn-primary' : 'btn-secondary'}`}
                            style={{ justifyContent: 'flex-start', border: 'none', background: location.pathname.startsWith(item.path) ? '' : 'transparent' }}
                        >
                            <item.icon size={20} />
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }} className="desktop-only">
                    <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: 'white' }}>{user?.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{user?.role}</p>
                        <LiveClock />
                    </div>
                    <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'flex-start' }}>
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>

                {/* Mobile logout button */}
                <div className="mobile-only" style={{ marginTop: '1rem' }}>
                    <button onClick={handleLogout} className="btn btn-danger" style={{ width: '100%', justifyContent: 'center', padding: '0.5rem' }}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;

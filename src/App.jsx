import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { NotificationProvider } from './context/NotificationContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AppraisalList from './pages/AppraisalList';
import AppraisalForm from './pages/AppraisalForm';
import StaffManagement from './pages/StaffManagement';
import AdminPanel from './pages/AdminPanel';
import PeriodManagement from './pages/PeriodManagement';
import Leaderboard from './pages/Leaderboard';
import api from './services/api';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
};

const App = () => {
  useEffect(() => {
    // Check database connection status when app mounts
    const checkDbConnection = async () => {
      try {
        const response = await api.get('/health/db');
        if (response.data.connected) {
          console.log('✅ Database is connected');
        } else {
          console.error('❌ Database is not connected:', response.data.error || response.data.status);
        }
      } catch (error) {
        if (error.response) {
          console.error('❌ Database connection check failed:', error.response.data?.error || error.response.data?.status || 'Server error');
        } else if (error.request) {
          console.error('❌ Database connection check failed: Server is not responding. Is the server running?');
        } else {
          console.error('❌ Database connection check failed:', error.message);
        }
      }
    };
    
    checkDbConnection();
  }, []);

  return (
    <AuthProvider>
      <DataProvider>
        <NotificationProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LoginGuard />} />
              <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="appraisals" element={<AppraisalList />} />
                <Route path="appraisals/:id" element={<AppraisalForm />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="staff" element={<StaffManagement />} />
                <Route path="periods" element={<PeriodManagement />} />
                <Route path="admin" element={<AdminPanel />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </NotificationProvider>
      </DataProvider>
    </AuthProvider>
  );
};

const LoginGuard = () => {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Login />;
};

export default App;

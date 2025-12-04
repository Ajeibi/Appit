import React from 'react';
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

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/" replace />;
};

const App = () => {
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

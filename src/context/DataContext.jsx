import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import {
    validateUser,
    validatePeriod,
    canDeleteUser,
    canDeletePeriod,
    hasDuplicateAppraisal
} from '../utils/validation';
import { authAPI, userAPI, appraisalAPI, periodAPI } from '../services/api';
import { APPRAISAL_TEMPLATE } from '../data/mockData';

const DataContext = createContext();

export const useData = () => useContext(DataContext);

export const DataProvider = ({ children }) => {
    const { user } = useAuth();
    const [appraisals, setAppraisals] = useState([]);
    const [users, setUsers] = useState([]);
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch Users (if authorized)
            if (['hr', 'md', 'admin', 'supervisor'].includes(user.role)) {
                const usersRes = await userAPI.getAll();
                setUsers(usersRes.data);
            }

            // Fetch Periods
            const periodsRes = await periodAPI.getAll();
            setPeriods(periodsRes.data);

            // Fetch Appraisals based on role
            let appraisalsData = [];
            if (user.role === 'admin') {
                const res = await appraisalAPI.getAll();
                appraisalsData = res.data;
            } else if (['hr', 'md'].includes(user.role)) {
                // HR/MD see reviews + their own
                const [reviewsRes, myRes] = await Promise.all([
                    appraisalAPI.getReviews(),
                    appraisalAPI.getMy()
                ]);
                // Merge and deduplicate
                const all = [...reviewsRes.data, ...myRes.data];
                appraisalsData = Array.from(new Map(all.map(item => [item.id, item])).values());
            } else if (user.role === 'supervisor') {
                // Supervisor sees reviews + their own
                const [reviewsRes, myRes] = await Promise.all([
                    appraisalAPI.getReviews(),
                    appraisalAPI.getMy()
                ]);
                const all = [...reviewsRes.data, ...myRes.data];
                appraisalsData = Array.from(new Map(all.map(item => [item.id, item])).values());
            } else {
                // Staff sees only their own
                const res = await appraisalAPI.getMy();
                appraisalsData = res.data;
            }
            setAppraisals(appraisalsData);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const createAppraisal = async (staffId, supervisorId, periodId) => {
        try {
            // Client-side validation
            if (hasDuplicateAppraisal(staffId, periodId, appraisals)) {
                throw new Error('An appraisal already exists for this staff member in this period');
            }

            const period = periods.find(p => p.id === periodId);
            if (!period) throw new Error('Appraisal period not found');

            const payload = {
                periodId,
                periodLabel: period.label,
                content: APPRAISAL_TEMPLATE // Send template instead of empty object
            };

            const response = await appraisalAPI.create(payload);
            await fetchData(); // Refresh data
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error creating appraisal:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const getAppraisal = async (id) => {
        try {
            const response = await appraisalAPI.getOne(id);
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error fetching appraisal:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const updateAppraisal = async (id, updates, user, action) => {
        try {
            // Note: 'action' logging is now handled by backend or implied by status change
            // We just send the updates
            const response = await appraisalAPI.update(id, updates);
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('Error updating appraisal:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const deleteAppraisal = async (id) => {
        try {
            await appraisalAPI.delete(id);
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('Error deleting appraisal:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const addUser = async (userData, currentUserId = null) => {
        try {
            // Client-side validation
            const validation = validateUser(userData, users, false, currentUserId);
            if (!validation.isValid) {
                const errorMessages = Object.values(validation.errors).join(', ');
                throw new Error(errorMessages);
            }

            const payload = {
                ...userData,
                password: userData.password || 'password123'
            };

            const response = await authAPI.register(payload);
            await fetchData();
            return { success: true, data: response.data.user };
        } catch (error) {
            console.error('Error adding user:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const deleteUser = async (id, currentUserId) => {
        try {
            // Client-side check
            const deleteCheck = canDeleteUser(id, appraisals, currentUserId);
            if (!deleteCheck.canDelete) {
                throw new Error(deleteCheck.errors.join(', '));
            }

            if (deleteCheck.warnings.length > 0) {
                return {
                    success: false,
                    warnings: deleteCheck.warnings,
                    requiresConfirmation: true
                };
            }

            await userAPI.delete(id);
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const forceDeleteUser = async (id) => {
        try {
            await userAPI.delete(id);
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('Error force deleting user:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const updateUser = async (id, updates) => {
        try {
            const currentUser = users.find(u => u.id === id);
            if (!currentUser) throw new Error('User not found');

            const updatedUserData = { ...currentUser, ...updates };
            const validation = validateUser(updatedUserData, users, true, id);
            if (!validation.isValid) {
                const errorMessages = Object.values(validation.errors).join(', ');
                throw new Error(errorMessages);
            }

            const response = await userAPI.update(id, updates);
            await fetchData();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const addPeriod = async (periodData) => {
        try {
            const validation = validatePeriod(periodData, periods, false);
            if (!validation.isValid) {
                const errorMessages = Object.values(validation.errors).join(', ');
                throw new Error(errorMessages);
            }

            const response = await periodAPI.create(periodData);
            await fetchData();
            return { success: true, data: response.data };
        } catch (error) {
            console.error('Error adding period:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const updatePeriod = async (id, updates) => {
        try {
            const currentPeriod = periods.find(p => p.id === id);
            if (!currentPeriod) throw new Error('Period not found');

            const updatedPeriodData = { ...currentPeriod, ...updates };
            const validation = validatePeriod(updatedPeriodData, periods, true, id);
            if (!validation.isValid) {
                const errorMessages = Object.values(validation.errors).join(', ');
                throw new Error(errorMessages);
            }

            await periodAPI.update(id, updates);
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('Error updating period:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    const deletePeriod = async (id) => {
        try {
            const deleteCheck = canDeletePeriod(id, appraisals);
            if (!deleteCheck.canDelete) {
                throw new Error(deleteCheck.errors.join(', '));
            }

            await periodAPI.delete(id);
            await fetchData();
            return { success: true };
        } catch (error) {
            console.error('Error deleting period:', error);
            return { success: false, error: error.response?.data?.message || error.message };
        }
    };

    return (
        <DataContext.Provider value={{
            appraisals,
            users,
            periods,
            loading,
            createAppraisal,
            getAppraisal,
            updateAppraisal,
            deleteAppraisal,
            addUser,
            deleteUser,
            forceDeleteUser,
            updateUser,
            addPeriod,
            updatePeriod,
            deletePeriod
        }}>
            {children}
        </DataContext.Provider>
    );
};

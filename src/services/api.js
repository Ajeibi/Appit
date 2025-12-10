import axios from 'axios';

// Create axios instance
// In production (served from same domain), use relative URL
// In development, use environment variable or default to localhost
const getBaseURL = () => {
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }
    // If in production and no env var, use relative URL (same domain)
    if (import.meta.env.PROD) {
        return '/api';
    }
    // Development default
    return 'http://localhost:5001/api';
};

const api = axios.create({
    baseURL: getBaseURL(),
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Optional: Redirect to login
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    getMe: () => api.get('/auth/me')
};

export const userAPI = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    update: (id, data) => api.put(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`)
};

export const appraisalAPI = {
    create: (data) => api.post('/appraisals', data),
    getMy: () => api.get('/appraisals/my'),
    getAll: () => api.get('/appraisals/all'),
    getReviews: () => api.get('/appraisals/reviews'),
    getOne: (id) => api.get(`/appraisals/${id}`),
    update: (id, data) => api.put(`/appraisals/${id}`, data),
    delete: (id) => api.delete(`/appraisals/${id}`)
};

export const periodAPI = {
    getAll: () => api.get('/periods'),
    create: (data) => api.post('/periods', data),
    update: (id, data) => api.put(`/periods/${id}`, data),
    delete: (id) => api.delete(`/periods/${id}`)
};

export default api;

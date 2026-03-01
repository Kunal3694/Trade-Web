import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL ||
    (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

const api = axios.create({
    baseURL: API_URL,
});

// Add a request interceptor to automatically attach JWT token
api.interceptors.request.use(
    (config) => {
        // Assuming token is stored in localStorage under 'userInfo'
        const userInfoString = localStorage.getItem('userInfo');
        if (userInfoString) {
            try {
                const userInfo = JSON.parse(userInfoString);
                if (userInfo.token) {
                    config.headers.Authorization = userInfo.token;
                }
            } catch (err) {
                console.error("Error parsing userInfo from localStorage", err);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;

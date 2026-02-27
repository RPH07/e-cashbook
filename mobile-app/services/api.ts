import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_URL = 'http://192.168.1.9:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

export const reportService = {
  getAuditLogs: async () => {
    const response = await api.get('/audit-logs'); 
    return response.data.data;
  }
};

api.interceptors.request.use(
    async (config) => {
        try {
            const token = await SecureStore.getItemAsync('userToken');
            const loginTimestamp = await SecureStore.getItemAsync('loginTimestamp');
            
            if (token && loginTimestamp) {
                const tokenAge = Date.now() - parseInt(loginTimestamp);
                const TOKEN_EXPIRY = 24 * 60 * 60 * 1000;
                
                if (tokenAge >= TOKEN_EXPIRY) {
                    console.log("Token expired, clearing storage...");
                    await SecureStore.deleteItemAsync('userToken');
                    await SecureStore.deleteItemAsync('userRole');
                    await SecureStore.deleteItemAsync('userName');
                    await SecureStore.deleteItemAsync('loginTimestamp');
                    
                    // Redirect to login
                    const { router } = await import('expo-router');
                    router.replace('/login');
                    
                    return Promise.reject(new Error('Token expired'));
                }
            }
            
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error("Gagal ambil token:", error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor untuk handle token expired (401)
api.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        if (error.response?.status === 401) {
            console.log("Token expired atau invalid, logout otomatis...");
            
            // Hapus token dan data user
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userRole');
            await SecureStore.deleteItemAsync('userName');
            await SecureStore.deleteItemAsync('loginTimestamp');
            
            // Import router dinamis untuk redirect
            const { router } = await import('expo-router');
            router.replace('/login');
        }
        return Promise.reject(error);
    }
);

export default api;
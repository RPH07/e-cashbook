import api from './api';
import * as SecureStore from 'expo-secure-store';

interface LoginResponse {
    message: string;
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: 'admin' | 'finance' | 'staff' | 'auditor' | 'viewer';
    };
}

const TOKEN_EXPIRY_DURATION = 24 * 60 * 60 * 1000;

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await api.post('/login', { email, password });

            const responseData = response.data;
            const payload = responseData.data || responseData;

            if (payload.token) {
                // Save token and login timestamp
                await SecureStore.setItemAsync('userToken', payload.token);
                await SecureStore.setItemAsync('loginTimestamp', Date.now().toString());
                
                if (payload.user?.role) {
                    await SecureStore.setItemAsync('userRole', payload.user.role);
                }
                if (payload.user?.name) {
                    await SecureStore.setItemAsync('userName', payload.user.name);
                }
            }

            return payload;

        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Gagal terhubung ke server";
            throw new Error(errorMsg);
        }
    },

    logout: async () => {
        try {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userRole');
            await SecureStore.deleteItemAsync('userName');
            await SecureStore.deleteItemAsync('loginTimestamp');
        } catch (error) {
            console.error("Logout Error:", error);
        }
    },

    isTokenExpired: async (): Promise<boolean> => {
        try {
            const loginTimestamp = await SecureStore.getItemAsync('loginTimestamp');
            
            if (!loginTimestamp) {
                return true; 
            }

            const loginTime = parseInt(loginTimestamp);
            const currentTime = Date.now();
            const timeDiff = currentTime - loginTime;

            return timeDiff >= TOKEN_EXPIRY_DURATION;
        } catch (error) {
            console.error("Error checking token expiry:", error);
            return true; 
        }
    },

    checkAndAutoLogout: async (): Promise<boolean> => {
        const isExpired = await authService.isTokenExpired();
        
        if (isExpired) {
            await authService.logout();
            return true;
        }
        
        return false; 
    }
};
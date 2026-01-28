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

export const authService = {
    login: async (email: string, password: string): Promise<LoginResponse> => {
        try {
            const response = await api.post('/auth/login', { email, password });

            const responseData = response.data;
            const payload = responseData.data || responseData;

            if (payload.token) {
                await SecureStore.setItemAsync('userToken', payload.token);
                if (payload.user?.role) {
                    await SecureStore.setItemAsync('userRole', payload.user.role);
                }
                if (payload.user?.name) {
                    await SecureStore.setItemAsync('userName', payload.user.name);
                }
            }

            return payload;

        } catch (error: any) {
            console.error("Login Error:", error.response?.data || error.message);
            throw error.response?.data?.message || "Gagal terhubung ke server";
        }
    },

    logout: async () => {
        try {
            await SecureStore.deleteItemAsync('userToken');
            await SecureStore.deleteItemAsync('userRole');
            await SecureStore.deleteItemAsync('userName');
        } catch (error) {
            console.error("Logout Error:", error);
        }
    }
};
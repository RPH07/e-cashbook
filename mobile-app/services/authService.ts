import api from "./api";
import * as SecureStore from "expo-secure-store";

interface LoginResponse {
    token: string;
    user: {
        id: number;
        name: string;
        email: string;
        role: 'admin' | 'finance' | 'staff';
    };
}

export const authService = {
    Login: async(email: string, password: string) => {
        // ============================================================
        // [MODE MOCK UP: ON] - PAKE INI SELAMA BACKEND BELUM READY
        // ============================================================
        console.log(`[MOCK] Login attempt: ${email}`);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Delay biar kayak loading beneran

        // Logic Mocking Role
        let role = 'staff';
        if (email.toLowerCase().includes('admin')) role = 'admin';
        else if (email.toLowerCase().includes('finance')) role = 'finance';

        const mockResponse = {
            data: {
                token: "dummy-token-backend-123",
                user: {
                    id: 1,
                    name: email.split('@')[0],
                    email: email,
                    role: role as 'admin' | 'finance' | 'staff'
                }
            }
        };

        const response = mockResponse; 
        // ============================================================
        // const response = await api.post<LoginResponse>('auth/login', {email, password});
        // ============================================================


        // Simpan data penting (Logic ini SAMA, mau Mock atau Real)
        if(response.data.token) {
            await SecureStore.setItemAsync('userToken', response.data.token);
            await SecureStore.setItemAsync('userRole', response.data.user.role);
            await SecureStore.setItemAsync('userName', response.data.user.name);
        }
        return response.data;
    },

    Logout: async() => {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userRole');
        await SecureStore.deleteItemAsync('userName');
    }
}
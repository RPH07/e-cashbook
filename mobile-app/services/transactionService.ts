import { Transaction } from "@/context/TransactionContext";
import api from "./api";

interface CreateTransaction {
    type: 'pemasukan' | 'pengeluaran';
    amount: number;
    category: string;
    date: string;
    note?: string;
    account: string;
    // imageUri?: string | null;
    proofLink?: string | null;
    createdByName: string;
    status?: 'pending' | 'approved' | 'rejected';
}

export const transactionService = {
    getAll: async () => {
        // [MOCK]
        console.log("[MOCK] Get All Transactions");
        return []; // Return array kosong dulu biar gak error loop
        
        // [REAL API]
        // const response = await api.get('/transactions');
        // return response.data;
    },

    create: async(data: CreateTransaction) => {
        // [MOCK]
        console.log("[MOCK] Create Transaction:", data);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
            id: Math.random().toString(36).substr(2, 9),
            status: 'pending', // Default backend biasanya pending
            createdByRole: 'staff',
            ...data
        };

        // [REAL API]
        // const response = await api.post('/transaction', data);
        // return response.data;
    },

    update: async(id: string, data: Partial<CreateTransaction>) => {
        // [MOCK]
        console.log(`[MOCK] Update ID: ${id}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { ...data, id };

        // [REAL API]
        // const response = await api.put(`/transaction/${id}`, data);
        // return response.data;
    },

    delete: async(id: string) => {
        // [MOCK]
        console.log(`[MOCK] Delete ID: ${id}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return true;

        // [REAL API]
        // const response = await api.delete(`/transaction/${id}`);
        // return response.data;
    },

    approve: async(id: string) => {
        // [MOCK]
        console.log(`[MOCK] Approve ID: ${id}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        return { id, status: 'approved' };

        // [REAL API]
        // const response = await api.patch(`/transaction/${id}/approve`);
        // return response.data;
    }
};
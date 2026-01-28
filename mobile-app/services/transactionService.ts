import api from './api';
import { Transaction } from '@/context/TransactionContext';

export interface CreateTransactionDTO {
    type: 'pemasukan' | 'pengeluaran';
    amount: number;
    date: string;
    note?: string;
    proofLink?: string | null;
    status?: 'pending' | 'approved' | 'rejected';
    accountId: number;
    categoryId: number;
    createdByRole?: string;
    createdByName?: string;
}

export const transactionService = {
    getAll: async (): Promise<Transaction[]> => {
        try {
            const response = await api.get('/transactions');
            return response.data.data || response.data; 
        } catch (error) {
            console.error("Gagal ambil transaksi:", error);
            throw error;
        }
    },

    create: async (data: CreateTransactionDTO): Promise<any> => {
        try {
            const typeMap = {
                'pemasukan': 'income',
                'pengeluaran': 'expense'
            };

            const payload = {
                date: data.date,
                amount: Number(data.amount),
                type: typeMap[data.type],
                description: data.note,  
                evidence_link: data.proofLink, 
                accountId: data.accountId,
                categoryId: data.categoryId,
                status: data.status,
                createdByRole: data.createdByRole,
                createdByName: data.createdByName
            };

            // console.log("Mengirim ke Backend (Final):", payload); 

            const response = await api.post('/transactions', payload);
            
            // Balikin data asli dari backend
            return response.data.data || response.data;

        } catch (error: any) {
            console.error("Gagal buat transaksi:", error.response?.data || error.message);
            throw error;
        }
    },

    update: async (id: string, data: Partial<CreateTransactionDTO>): Promise<any> => {
        try {
            const response = await api.put(`/transactions/${id}`, data);
            return response.data;
        } catch (error) {
            console.error("Gagal update transaksi:", error);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            await api.delete(`/transactions/${id}`);
        } catch (error) {
            console.error("Gagal hapus transaksi:", error);
            throw error;
        }
    },

    approve: async (id: string): Promise<void> => {
        try {
            await api.patch(`/transactions/${id}/approve`);
        } catch (error) {
            console.error("Gagal approve transaksi:", error);
            throw error;
        }
    },

    reject: async (id: string): Promise<void> => {
        try {
            await api.patch(`/transactions/${id}/reject`);
        } catch (error) {
            console.error("Gagal reject transaksi:", error);
            throw error;
        }
    },

    getAccounts: async () => {
        try {
            const response = await api.get('/master/accounts');
            return response.data.data || [];
        } catch (error) {
            console.error("Gagal ambil akun:", error);
            return [];
        }
    },

    getCategories: async () => {
        try {
            const response = await api.get('/master/categories');
            return response.data.data || [];
        } catch (error) {
            console.error("Gagal ambil kategori:", error);
            return [];
        }
    }
};
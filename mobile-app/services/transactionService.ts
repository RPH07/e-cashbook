import api from './api';
import { Transaction } from '@/context/TransactionContext';

export interface CreateTransactionDTO {
    type: 'pemasukan' | 'pengeluaran' | 'transfer';
    amount: number;
    date: string;
    note?: string;
    proofLink?: string | null;
    status?: 'pending' | 'approved' | 'rejected';
    accountId: number;
    categoryId?: number; // Optional untuk transfer
    toAccountId?: number; // Untuk transfer
    createdByRole?: string;
    createdByName?: string;
}

export const transactionService = {
    getAll: async (): Promise<Transaction[]> => {
        try {
            const response = await api.get('/transactions');
            const rawData = response.data.data || response.data;

            // Fetch accounts untuk mapping toAccountId ke nama akun
            const accountsResponse = await api.get('/master/accounts');
            const accounts = accountsResponse.data.data || [];
            const accountMap: Record<number, string> = {};
            accounts.forEach((acc: any) => {
                accountMap[acc.id] = acc.account_name || acc.name;
            });

            return rawData.map((item: any) => {
                let toAccountName = item.toAccount?.account_name || item.ToAccount?.account_name;
                if (!toAccountName && item.toAccountId) {
                    toAccountName = accountMap[item.toAccountId];
                }

                return {
                    ...item,
                    account: item.account?.account_name || item.Account?.account_name || 'Unknown',
                    category: item.category?.name || item.Category?.name || 'Unknown',
                    toAccount: toAccountName || undefined,
                    createdByName: item.user?.name || item.User?.name || 'Unknown',
                    createdByRole: item.user?.role || item.User?.role || 'staff',
                    amount: Number(item.amount),
                    type: item.type === 'expense' ? 'pengeluaran' : (item.type === 'income' ? 'pemasukan' : item.type)
                };
            });

        } catch (error) {
            console.error("Gagal ambil transaksi:", error);
            throw error;
        }
    },

    create: async (data: CreateTransactionDTO): Promise<any> => {
        try {
            const typeMap: Record<string, string> = {
                'pemasukan': 'income',
                'pengeluaran': 'expense',
                'transfer': 'transfer'
            };

            const payload: any = {
                date: data.date,
                amount: Number(data.amount),
                type: typeMap[data.type],
                description: data.note,
                evidence_link: data.proofLink,
                accountId: data.accountId,
                status: data.status,
                createdByRole: data.createdByRole,
                createdByName: data.createdByName
            };

            // Tambahkan categoryId hanya untuk non-transfer
            if (data.type !== 'transfer' && data.categoryId) {
                payload.categoryId = data.categoryId;
            }

            // Tambahkan toAccountId untuk transfer
            if (data.type === 'transfer' && (data as any).toAccountId) {
                payload.toAccountId = (data as any).toAccountId;
            }

            const response = await api.post('/transactions', payload);

            // Balikin data asli dari backend
            return response.data.data || response.data;

        } catch (error: any) {
            console.error("Gagal buat transaksi:", error.response?.data || error.message);
            throw error;
        }
    },

    update: async (id: string, data: CreateTransactionDTO): Promise<any> => {
        try {
            const typeMap: Record<string, string> = {
                'pemasukan': 'income',
                'pengeluaran': 'expense',
                'transfer': 'transfer'
            };

            const payload: any = {
                date: data.date,
                amount: Number(data.amount),
                type: typeMap[data.type],
                description: data.note,
                evidence_link: data.proofLink,
                accountId: data.accountId,
                status: data.status,
                createdByRole: data.createdByRole,
                createdByName: data.createdByName
            };

            // Tambahkan categoryId hanya untuk non-transfer
            if (data.type !== 'transfer' && data.categoryId) {
                payload.categoryId = data.categoryId;
            }

            // Tambahkan toAccountId untuk transfer
            if (data.type === 'transfer' && (data as any).toAccountId) {
                payload.toAccountId = (data as any).toAccountId;
            }

            // Pake PUT buat update
            const response = await api.put(`/transactions/${id}`, payload);
            return response.data.data || response.data;

        } catch (error: any) {
            console.error("Gagal update transaksi:", error.response?.data || error.message);
            throw error;
        }
    },

    delete: async (id: string): Promise<void> => {
        try {
            await api.delete(`/transactions/${id}`);
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || "Gagal menghapus transaksi";
            console.error("Gagal hapus transaksi:", errorMessage);
            throw new Error(errorMessage);
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
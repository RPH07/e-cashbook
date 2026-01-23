import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

export interface Transaction {
    id: string;
    type: 'pemasukan' | 'pengeluaran';
    amount: number;
    category: string;
    date: string;
    note?: string;
    account: string;
    imageUri?: string | null;
    status: 'pending' | 'approved' | 'rejected';
    createdByRole: string;
}

export type UserRole = 'admin' | 'finance' | 'staff';

interface TransactionContextType {
    transactions: Transaction[];
    userRole: UserRole;
    setUserRole: (role: UserRole) => void;
    addTransaction: (tx: Transaction) => void;
    deleteTransaction: (id: string) => void;
    updateTransaction: (tx: Transaction) => void;
    approveTransaction: (id: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
    // Dummy Data Awal 
    const [transactions, setTransactions] = useState<Transaction[]>([
        {
            id: '1', type: 'pemasukan', amount: 5000000, category: 'Proyek Website',
            date: new Date().toISOString(), account: 'Giro', note: 'DP Project',
            status: 'approved', createdByRole: 'admin' // Data lama anggap admin
        },
    ]);

    const [userRole, setUserRole] = useState<UserRole>('staff'); 

    useEffect(() => {
        const loadRole = async () => {
            const stored = await SecureStore.getItemAsync('userRole');
            if (stored) setUserRole(stored as UserRole);
        };
        loadRole();
    }, []);

    const changeUserRole = async (role: UserRole) => {
        setUserRole(role);
        await SecureStore.setItemAsync('userRole', role);
    };

    const addTransaction = (tx: Transaction) => {
        const autoStatus = userRole === 'staff' ? 'pending' : 'approved';

        const newTx: Transaction = {
            ...tx,
            status: autoStatus,
            createdByRole: userRole
        };

        setTransactions((prev) => [newTx, ...prev]);
    };

    const deleteTransaction = (id: string) => {
        setTransactions((prev) => prev.filter((item) => item.id !== id));
    };

    const updateTransaction = (updatedTx: Transaction) => {
        setTransactions((prev) =>
            prev.map((item) => (item.id === updatedTx.id ? updatedTx : item))
        );
    };

    const approveTransaction = (id: string) => {
        setTransactions((prev) =>
            prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
        );
    };

    return (
        <TransactionContext.Provider value={{
            transactions,
            userRole,
            setUserRole: changeUserRole,
            addTransaction,
            deleteTransaction,
            updateTransaction,
            approveTransaction
        }}>
            {children}
        </TransactionContext.Provider>
    );
};

export const useTransaction = () => {
    const context = useContext(TransactionContext);
    if (!context) throw new Error("useTransaction must be used within a TransactionProvider");
    return context;
};
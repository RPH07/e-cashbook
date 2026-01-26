import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { transactionService } from '@/services/transactionService';

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
    setUserRole: (role: UserRole) => Promise<void>;
    addTransaction: (tx: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    updateTransaction: (tx: Transaction) => Promise<void>;
    approveTransaction: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [userRole, setUserRole] = useState<UserRole>('staff'); 

    useEffect(() => {
        const loadInitialData = async () => {
            const storedRole = await SecureStore.getItemAsync('userRole');
            if (storedRole) setUserRole(storedRole as UserRole);

            try {
                const apiData = await transactionService.getAll();
                if(Array.isArray(apiData) && apiData.length > 0) {
                    setTransactions(apiData);
                } else {
                    setTransactions([
                        {
                            id: '1', type: 'pemasukan', amount: 5000000, category: 'Proyek Website',
                            date: new Date().toISOString(), account: 'Giro', note: 'DP Project',
                            status: 'approved', createdByRole: 'admin'
                        }
                    ]);
                }
            } catch (error) {
                console.log("Gagal load data: ", error)
            }
        };
        loadInitialData();
    }, []);

    const changeUserRole = async (role: UserRole) => {
        setUserRole(role);
        await SecureStore.setItemAsync('userRole', role);
    };

    const addTransaction = async (tx: Transaction) => {

        try {
            const newTx = await transactionService.create({
                type: tx.type,
                amount: tx.amount,
                category: tx.category,
                date: tx.date,
                note: tx.note,
                account: tx.account,
                imageUri: tx.imageUri
            });

            console.log("Data balik dari Service:", newTx);

            const finalTx: Transaction = {
                ...newTx,
                status: userRole === 'staff' ? 'pending' : 'pending',
                createdByRole: userRole
            };

            setTransactions((prev) => [finalTx, ...prev]);
        } catch (error) {
            console.error(error)
            throw error;
        }
    };

    const deleteTransaction = async (id: string) => {
        try {
            await transactionService.delete(id);
            setTransactions((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const updateTransaction = async (updatedTx: Transaction) => {
        try {
            await transactionService.update(updatedTx.id, {
                type: updatedTx.type,
                amount: updatedTx.amount,
                category: updatedTx.category,
                date: updatedTx.date,
                note: updatedTx.account,
                imageUri: updatedTx.imageUri
            });

            setTransactions((prev) =>
                prev.map((item) => (item.id === updatedTx.id ? updatedTx : item))
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const approveTransaction = async (id: string) => {
        try {
            await transactionService.approve(id);
            setTransactions((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
            );
        } catch (error) {
            console.error(error);
            throw error;
        }
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
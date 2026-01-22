import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Transaction } from '@/components/TransactionCard';

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (tx: Transaction) => void;
    deleteTransaction: (id: string) => void;
    updateTransaction: (tx: Transaction) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const addTransaction = (tx: Transaction) => {
        setTransactions((prev) => [tx, ...prev]);
    };

    const deleteTransaction = (id: string) => {
        setTransactions((prev) => prev.filter((item) => item.id !== id));
    };

    const updateTransaction = (updatedTx: Transaction) => {
        setTransactions((prev) =>
            prev.map((item) => (item.id === updatedTx.id ? updatedTx : item))
        );
    };

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction, deleteTransaction, updateTransaction }}>
            {children}
        </TransactionContext.Provider>
    );
};

export const useTransaction = () => {
    const context = useContext(TransactionContext);
    if (!context) throw new Error("useTransaction must be used within a TransactionProvider");
    return context;
};
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Transaction } from '@/components/TransactionCard';

interface TransactionContextType {
    transactions: Transaction[];
    addTransaction: (tx: Transaction) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    const addTransaction = (tx: Transaction) => {
        setTransactions((prev) => [tx, ...prev]);
    };

    return (
        <TransactionContext.Provider value={{ transactions, addTransaction }}>
            {children}
        </TransactionContext.Provider>
    );
};

export const useTransaction = () => {
    const context = useContext(TransactionContext);
    if (!context) throw new Error("useTransaction must be used within a TransactionProvider");
    return context;
};
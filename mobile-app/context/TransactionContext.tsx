import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    createdByName: string;
    proofLink?: string | null;
}

export interface AuditLog {
    id: string;
    timestamp: string;
    actorName: string;
    actorRole: string;
    actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'REJECT' | 'LOGIN' | 'EXPORT' | 'SYSTEM';
    target: string;
    details: string;
}

export type UserRole = 'admin' | 'finance' | 'staff';

interface TransactionContextType {
    transactions: Transaction[];
    logs:AuditLog[];
    userRole: UserRole;
    userName: string;
    setUserRole: (role: UserRole) => Promise<void>;
    setUserName: (name: string) => Promise<void>;
    addTransaction: (tx: Transaction) => Promise<void>;
    deleteTransaction: (id: string) => Promise<void>;
    updateTransaction: (tx: Transaction) => Promise<void>;
    approveTransaction: (id: string) => Promise<void>;
    rejectTransaction: (id: string) => Promise<void>;
    recordLog: (action: AuditLog['actionType'], target: string, details: string) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [userRole, setUserRole] = useState<UserRole>('staff'); 
    const [userName, setUserName] = useState<string>('User');
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const saveLogsToStorage = async (newLogs: AuditLog[]) => {
        try {
            await AsyncStorage.setItem('appLogs', JSON.stringify(newLogs));
        } catch (error) {
            console.log("Gagal Menyimpan: ", error);
        }
    };

    const recordLog = (actionType: AuditLog['actionType'], target: string, details: string) => {
        const newLog: AuditLog = {
            id: Date.now().toString() + Math.floor(Math.random() * 1000 ),
            timestamp: new Date().toISOString(),
            actorName: userName,
            actorRole: userRole,
            actionType,
            target,
            details

        };
        setLogs(prev => {
            const updated = [newLog, ...prev];
            saveLogsToStorage(updated);
            return updated
        })
    }

    useEffect(() => {
        const loadInitialData = async () => {
            const storedRole = await SecureStore.getItemAsync('userRole');
            const storedName = await SecureStore.getItemAsync('userName');
            const storedLogs = await AsyncStorage.getItem('appLogs');

            if (storedRole) setUserRole(storedRole as UserRole);
            if(storedName) setUserName(storedName);
            if(storedLogs) setLogs(JSON.parse(storedLogs));

            try {
                const apiData = await transactionService.getAll();
                if(Array.isArray(apiData) && apiData.length > 0) {
                    setTransactions(apiData);
                } else {
                    setTransactions([
                        {
                            id: '1', type: 'pemasukan', amount: 5000000, category: 'Proyek Website',
                            date: new Date().toISOString(), account: 'Giro', note: 'DP Project',
                            status: 'approved', createdByRole: 'admin', createdByName: 'Budi'
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

    const changeUserName = async (name: string) => {
        setUserName(name);
        await SecureStore.setItemAsync('userName', name)
    }

const addTransaction = async (tx: Transaction) => {
        try {
            const finalStatus: 'pending' | 'approved' | 'rejected' = userRole === 'staff' ? 'pending' : 'approved';

            const txPayload = {
                type: tx.type,
                amount: tx.amount,
                category: tx.category,
                date: tx.date,
                note: tx.note,
                account: tx.account,
                proofLink: tx.proofLink,
                status: finalStatus,
                createdByRole: userRole,
                createdByName: userName
            };

            const newTx = await transactionService.create(txPayload);
            
            const finalTxForUI: Transaction = {
                ...newTx,
                status: finalStatus, 
                createdByRole: userRole,
                createdByName: userName
            };
            
            setTransactions((prev) => [finalTxForUI, ...prev]);

            // Log
            recordLog('CREATE', `Ref: ${finalTxForUI.id.substring(0,6)}`, `Input Transaksi Baru senilai Rp${tx.amount}`);

        } catch (error) { console.error(error); throw error; }
    };

    const deleteTransaction = async (id: string) => {
        
        try {
            const txToDelete = transactions.find(t => t.id === id);
            await transactionService.delete(id);
            setTransactions((prev) => prev.filter((item) => item.id !== id));
            if (txToDelete) {
                recordLog(
                    'DELETE', 
                    `Ref: ${id.substring(0,6).toUpperCase()}`, 
                    `Menghapus transaksi ${txToDelete.category} senilai Rp${txToDelete.amount}`
                );
            }
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const updateTransaction = async (updatedTx: Transaction) => {
        try {
            const forcedStatus: 'pending' | 'approved' | 'rejected' = 
                (userRole === 'admin' || userRole === 'finance') ? 'approved' : 'pending';
            const finalTx = {
                ...updatedTx,
                status: forcedStatus 
            };
            const oldTx = transactions.find(t => t.id === finalTx.id);
            const changes: string[] = [];

            if (oldTx) {
                if (oldTx.amount !== finalTx.amount) 
                    changes.push(`Nominal: ${oldTx.amount} -> ${finalTx.amount}`);
                if (oldTx.category !== finalTx.category) 
                    changes.push(`Kategori: ${oldTx.category} -> ${finalTx.category}`);
                if (oldTx.status !== finalTx.status) 
                    changes.push(`Status: ${oldTx.status} -> ${finalTx.status}`);
            }
            const changeSummary = changes.length > 0 ? changes.join(', ') : 'Update data';
            await transactionService.update(finalTx.id, {
                type: finalTx.type,
                amount: finalTx.amount,
                category: finalTx.category,
                date: finalTx.date,
                note: finalTx.note,
                account: finalTx.account,
                proofLink: finalTx.proofLink,
                status: finalTx.status,
                // createdByName: userName (Opsional, kalau mau update nama pengedit)
            });
            setTransactions((prev) =>
                prev.map((item) => (item.id === finalTx.id ? finalTx : item))
            );
            recordLog('UPDATE', `Ref: ${finalTx.id.substring(0,6)}`, changeSummary);

        } catch (error) {
            console.error("Gagal update transaksi:", error);
            throw error;
        }
    };

    const approveTransaction = async (id: string) => {
        try {
            await transactionService.approve(id);
            setTransactions((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status: 'approved' } : item))
            );
            recordLog('APPROVE', `Ref: ${id.substring(0,6)}`, 'Menyetujui (ACC) transaksi');
        } catch (error) {
            console.error(error);
            throw error;
        }
    };

    const rejectTransaction = async (id: string) => {
        setTransactions((prev) => prev.map((item) => (item.id === id ? { ...item, status: 'rejected' } : item)));
        recordLog('REJECT', `Ref: ${id.substring(0,6)}`, 'Menolak (Reject) pengajuan transaksi');
    }

    return (
        <TransactionContext.Provider value={{
            transactions,
            logs,
            userRole,
            userName,
            setUserRole: changeUserRole,
            setUserName: changeUserName,
            addTransaction,
            deleteTransaction,
            updateTransaction,
            approveTransaction,
            rejectTransaction,
            recordLog
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
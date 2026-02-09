import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { transactionService } from '@/services/transactionService';
import {reportService} from '@/services/api';

export type UserRole = 'admin' | 'finance' | 'staff' | 'auditor' | 'viewer';

export interface Transaction {
  // imageUri: string | null | undefined;
  id: string;
  type: 'pemasukan' | 'pengeluaran' | 'income' | 'expense' | 'transfer';
  amount: number;
  category: string; 
  date: string;
  note?: string;
  account: string;  
  toAccount?: string; // Untuk transfer
  proofLink?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'waiting_approval_a' | 'void';
  createdByRole: UserRole;
  createdByName: string;
}

export interface CreateTransactionInput {
  type: 'pemasukan' | 'pengeluaran' | 'transfer';
  amount: number;
  date: string;
  note: string;
  proofLink?: string | null;

  accountId: number;  
  accountName: string;  

  categoryId?: number; // Optional untuk transfer
  categoryName?: string;
  
  toAccountId?: number; // Untuk transfer
  toAccountName?: string;
}

interface AuditLog {
  id: string;
  actionType: string;
  actorName: string;
  actorRole: string;
  target: string;
  details: string;
  timestamp: string;
}

interface TransactionContextType {
  transactions: Transaction[];
  userRole: UserRole;
  userName: string;
  logs: AuditLog[];

  addTransaction: (input: CreateTransactionInput) => Promise<void>;
  updateTransaction: (id: string, input: CreateTransactionInput) => Promise<void>;
  deleteTransaction: (id: string) => void;
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;
  voidTransaction: (id: string) => Promise<void>;

  setUserRole: (role: UserRole) => void;
  setUserName: (name: string) => void;
  recordLog: (action: string, target: string, details: string, actorName?: string, actorRole?: string) => void;
  refreshTransactions: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider = ({ children }: { children: ReactNode }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [userRole, setUserRoleState] = useState<UserRole>('staff');
  const [userName, setUserNameState] = useState<string>('User');

  // LOAD DATA
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const storedRole = await SecureStore.getItemAsync('userRole');
        const storedName = await SecureStore.getItemAsync('userName');
        const token = await SecureStore.getItemAsync('userToken');
        const savedLogs = await AsyncStorage.getItem('auditLogs'); 

        if (storedRole) setUserRoleState(storedRole as UserRole);
        if (storedName) setUserNameState(storedName);
        if (savedLogs) {
          try {
            setLogs(JSON.parse(savedLogs));
          } catch (e) {
            console.log('Failed to parse saved logs');
          }
        }

        // Hanya load transaksi jika token ada 
        if (token) {
          await refreshTransactions();
        }

      } catch (error) {
        console.error("Gagal load data context:", error);
      }
    };
    loadInitialData();
  }, []);

  const setUserRole = async (role: UserRole) => {
    setUserRoleState(role);
    await SecureStore.setItemAsync('userRole', role);
  };

  const setUserName = async (name: string) => {
    setUserNameState(name);
    await SecureStore.setItemAsync('userName', name);
  };

  const recordLog = async (action: string, target: string, details: string, customName?: string, customRole?: string) => {
    const newLog: AuditLog = {
      id: Date.now().toString(),
      actionType: action,
      actorName: customName || userName, 
      actorRole: customRole || userRole as string,
      target,
      details,
      timestamp: new Date().toISOString()
    };
    
    const updatedLogs = [newLog, ...logs].slice(0, 200);
    setLogs(updatedLogs);
    
    try {
      await AsyncStorage.setItem('auditLogs', JSON.stringify(updatedLogs));
    } catch (error) {
      console.log('Failed to save logs to storage:', error);
    }
  };

  const addTransaction = async (input: CreateTransactionInput) => {
    try {
      const statusAwal = userRole === 'staff' ? 'pending' : 'approved';

      const payload: any = {
        type: input.type,
        amount: input.amount,
        date: input.date,
        note: input.note,
        accountId: input.accountId,
        proofLink: input.proofLink,
        status: statusAwal,
        createdByRole: userRole,
        createdByName: userName
      };

      // Untuk transfer, tambahkan toAccountId
      if (input.type === 'transfer' && input.toAccountId) {
        payload.toAccountId = input.toAccountId;
      } else {
        // Untuk non-transfer, categoryId wajib
        payload.categoryId = input.categoryId;
      }

      const response = await transactionService.create(payload);

      // Untuk transfer, refresh dari backend karena perlu data toAccount
      if (input.type === 'transfer') {
        await refreshTransactions();
      } else {
        // Untuk non-transfer, langsung update state
        const newTxForUI: Transaction = {
          id: String(response.id), 
          type: input.type,
          amount: input.amount,
          date: input.date,
          note: input.note,
          account: response.account?.account_name || input.accountName,   
          category: response.category?.name || input.categoryName || 'Transfer', 
          toAccount: response.toAccount?.account_name || input.toAccountName,
          proofLink: input.proofLink,
          status: response.status || statusAwal,
          createdByRole: response.user?.role || userRole,
          createdByName: response.user?.name || userName
        };

        setTransactions((prev) => [newTxForUI, ...prev]);
      }
      
      const actionLabel = input.type === 'transfer' ? 'Transfer' : 'Input';
      recordLog('CREATE', `Ref: ${String(response.id).substring(0, 6)}`, `${actionLabel} Rp${input.amount}`);

    } catch (error) {
      console.error("Error di Context:", error);
      throw error; 
    }
  };

  const updateTransaction = async (id: string, input: CreateTransactionInput) => {
    try {
      const statusAwal = userRole === 'staff' ? 'pending' : 'approved';

      const payload: any = {
        type: input.type,
        amount: input.amount,
        date: input.date,
        note: input.note,
        accountId: input.accountId,     
        proofLink: input.proofLink,
        status: statusAwal,
        createdByRole: userRole,
        createdByName: userName
      };

      // Untuk transfer, tambahkan toAccountId
      if (input.type === 'transfer' && input.toAccountId) {
        payload.toAccountId = input.toAccountId;
      } else {
        // Untuk non-transfer, categoryId wajib
        payload.categoryId = input.categoryId;
      }

      await transactionService.update(id, payload);

      // Refresh dari backend untuk memastikan data terbaru
      const updatedTransactions = await transactionService.getAll();
      setTransactions(updatedTransactions as any);

      recordLog('UPDATE', `Ref: ${id.substring(0,6)}`, `Update data Rp${input.amount}`);

    } catch (error) {
      console.error("Gagal update di context:", error);
      throw error; // Lempar error biar bisa ditangkap UI
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionService.delete(id);
      setTransactions(prev => prev.filter(t => t.id !== id));
      recordLog('DELETE', `Ref: ${id.substring(0, 6)}`, 'Hapus data');
      Alert.alert("Sukses", "Transaksi berhasil dihapus");
    } catch (e: any) { 
      const errorMessage = e.message || "Gagal menghapus transaksi";
      console.error('Gagal hapus:', errorMessage);
      Alert.alert("Gagal Hapus", errorMessage); 
    }
  };

  const approveTransaction = async (id: string) => {
    try {
      await transactionService.approve(id);
      await refreshTransactions();
      // setTransactions(prev => prev.map(t => (t.id === id ? { ...t, status: 'approved' } : t)));
      recordLog('APPROVE', `Ref: ${id.substring(0, 6)}`, 'Transaksi disetujui');
    } catch (e) { 
      console.error('gagal approve', e)
      Alert.alert("Gagal Memproses transaksi"); 
    }
  };

  const rejectTransaction = async (id: string) => {
    try {
      await transactionService.reject(id);
      await refreshTransactions();
      // setTransactions(prev => prev.map(t => (t.id === id ? { ...t, status: 'rejected' } : t)));
      recordLog('REJECT', `Ref: ${id.substring(0, 6)}`, 'Transaksi ditolak');
    } catch (e) {
      console.error('gagal reject', e)
      Alert.alert("Gagal reject"); 
    }
  };

  const voidTransaction = async (id: string) => {
        try {
            await transactionService.void(id);
            
            // Update state lokal biar UI langsung berubah tanpa refresh
            setTransactions(prev => prev.map(t => 
                (t.id === id ? { ...t, status: 'void' } : t)
            ));
            
            recordLog('VOID', `Ref: ${id.substring(0, 6)}`, 'Transaksi dibatalkan');
        } catch (error) {
            console.error("Context void error:", error);
            throw error; 
        }
    };

  const refreshTransactions = async () => {
    try {
      const apiData = await transactionService.getAll();
      const mappedData = apiData.map((t: any) => ({
        ...t,
        id: String(t.id),
        note: t.description || t.note || '',
        proofLink: t.evidence_link || t.proofLink || null,
        toAccount: t.toAccount || undefined
      }));
      setTransactions(mappedData as any);
      try {
        const logsData = await reportService.getAuditLogs();
        // Fix mapping: backend return { action, details, user: {name, role}, createdAt }
        const mappedLogs = logsData.map((log: any) => ({
          id: String(log.id),
          actionType: log.action || 'UNKNOWN',
          actorName: log.user?.name || 'System',
          actorRole: log.user?.role || 'system',
          target: log.action?.includes('Transaksi') ? 'Transaksi' : 'System',
          details: log.details || '',
          timestamp: log.createdAt || new Date().toISOString()
        }));
        // Limit to max 200 logs
        const limitedLogs = mappedLogs.slice(0, 200);
        setLogs(limitedLogs);
        // Simpan ke AsyncStorage (unlimited, safe for large data)
        await AsyncStorage.setItem('auditLogs', JSON.stringify(limitedLogs));
      } catch (error) {
        // console.log("User ini gak punya akses liat log ", error);
        // Load from local storage if API fails
        try {
          const savedLogs = await AsyncStorage.getItem('auditLogs');
          if (savedLogs) setLogs(JSON.parse(savedLogs));
        } catch (e) {
          console.log('No cached logs');
        }
      }
    } catch (error) {
      console.error("Gagal refresh transaksi:", error);
    }
  };

  return (
    <TransactionContext.Provider value={{
      transactions, userRole, userName, logs,
      addTransaction, updateTransaction, deleteTransaction,
      approveTransaction, rejectTransaction, voidTransaction,
      setUserRole, setUserName, recordLog, refreshTransactions
    }}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransaction = () => {
  const context = useContext(TransactionContext);
  if (!context) throw new Error("useTransaction error");
  return context;
};
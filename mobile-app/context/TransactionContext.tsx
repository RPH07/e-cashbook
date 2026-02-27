import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import {storage} from '@/services/storage';
import { transactionService } from '@/services/transactionService';

export type UserRole = 'admin' | 'finance' | 'staff' | 'auditor' | 'viewer';

export interface Transaction {
  id: string;
  type: 'pemasukan' | 'pengeluaran' | 'income' | 'expense' | 'transfer';
  amount: number;
  category: string; 
  date: string;
  note?: string;
  account: string;  
  toAccount?: string;
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
  categoryId?: number;
  categoryName?: string;
  toAccountId?: number;
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
        const storedRole = await storage.getItemAsync('userRole');
        const storedName = await storage.getItemAsync('userName');
        const token = await storage.getItemAsync('userToken');

        if (storedRole) setUserRoleState(storedRole as UserRole);
        if (storedName) setUserNameState(storedName);

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
    await storage.setItemAsync('userRole', role);
  };

  const setUserName = async (name: string) => {
    setUserNameState(name);
    await storage.setItemAsync('userName', name);
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

      if (input.type === 'transfer' && input.toAccountId) {
        payload.toAccountId = input.toAccountId;
      } else {
        payload.categoryId = input.categoryId;
      }

      await transactionService.create(payload);
      await refreshTransactions();
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

      if (input.type === 'transfer' && input.toAccountId) {
        payload.toAccountId = input.toAccountId;
      } else {
        payload.categoryId = input.categoryId;
      }

      await transactionService.update(id, payload);
      await refreshTransactions();
    } catch (error) {
      console.error("Gagal update di context:", error);
      throw error; 
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      await transactionService.delete(id);
      await refreshTransactions();
      Alert.alert("Sukses", "Transaksi berhasil dihapus");
    } catch (e: any) { 
      const errorMessage = e.message || "Gagal menghapus transaksi";
      Alert.alert("Gagal Hapus", errorMessage); 
    }
  };

  const approveTransaction = async (id: string) => {
    try {
      await transactionService.approve(id);
      await refreshTransactions();
    } catch (e) { 
      Alert.alert("Gagal Memproses transaksi"); 
      throw e;
    }
  };

  const rejectTransaction = async (id: string) => {
    try {
      await transactionService.reject(id);
      await refreshTransactions();
    } catch (e) {
      Alert.alert("Gagal reject transaksi"); 
      throw e;
    }
  };

  const voidTransaction = async (id: string) => {
    try {
      await transactionService.void(id);
      await refreshTransactions();
    } catch (error) {
      console.error("Context void error:", error);
      throw error; 
    }
  };

  const refreshTransactions = async () => {
    try {
      // 1. Tarik Data Transaksi
      const apiData = await transactionService.getAll();
      const mappedData = apiData.map((t: any) => ({
        ...t,
        id: String(t.id),
        note: t.description || t.note || '',
        proofLink: t.evidence_link || t.proofLink || null,
        toAccount: t.toAccount || undefined
      }));
      setTransactions(mappedData as any);

      // 2. Tarik Data Audit Log dari API Ari
      try {
        const logsData = await transactionService.getAuditLogs();
        const mappedLogs = logsData.map((log: any) => {
          const rawAction = log.action || '';
          let actionClean = '';
          if (rawAction.includes('CREATE')) actionClean = 'CREATE';
          else if (rawAction.includes('UPDATE')) actionClean = 'UPDATE';
          else if (rawAction.includes('DELETE')) actionClean = 'DELETE';
          else if (rawAction.includes('APPROVE')) actionClean = 'APPROVE';
          else if (rawAction.includes('REJECT')) actionClean = 'REJECT';
          else if (rawAction.includes('VOID')) actionClean = 'VOID';

          const refMatch = log.details?.match(/(TRX|TRF)-\d+-\d+/);
          const targetClean = refMatch ? refMatch[0] : 'System';

          return {
            id: String(log.id),
            actionType: actionClean,
            actorName: log.user?.name || 'System',
            actorRole: log.user?.role || 'system',
            target: targetClean,
            details: log.details || '',
            timestamp: log.created_at || log.createdAt || new Date().toISOString()
          };
        });
        setLogs(mappedLogs.slice(0, 200));
      } catch (error) {
        console.log("User ini mungkin gak punya akses liat log (bukan Admin/Auditor)", error);
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
      setUserRole, setUserName, refreshTransactions
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
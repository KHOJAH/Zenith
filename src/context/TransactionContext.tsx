import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, BudgetCategory } from '@/db/schema';
import * as db from '@/db/database';
import { calculateMonthAnalytics, MonthAnalytics } from '@/utils/velocity';

interface TransactionContextType {
  transactions: Transaction[];
  budgets: BudgetCategory[];
  analytics: MonthAnalytics;
  isLoading: boolean;
  currency: string;
  isBalanceHidden: boolean;
  setCurrency: (c: string) => void;
  toggleBalanceVisibility: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  populateDemoData: () => Promise<void>;
  refresh: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currency, setCurrency] = useState<string>('USD');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const [txList, budgetList] = await Promise.all([
        db.getTransactions(),
        db.getBudgets(),
      ]);
      setTransactions(txList);
      setBudgets(budgetList);
    } catch (error) {
      console.error('Failed to load transaction data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    const created = await db.insertTransaction(tx);
    await refresh();
    return created;
  };

  const deleteTransaction = async (id: string) => {
    await db.deleteTransaction(id);
    await refresh();
  };

  const clearAll = async () => {
    await db.clearAllTransactions();
    await refresh();
  };

  const populateDemoData = async () => {
    await db.loadDemoData();
    await refresh();
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden((prev) => !prev);
  };

  const analytics = calculateMonthAnalytics(transactions, budgets);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        budgets,
        analytics,
        isLoading,
        currency,
        isBalanceHidden,
        setCurrency,
        toggleBalanceVisibility,
        addTransaction,
        deleteTransaction,
        clearAll,
        populateDemoData,
        refresh,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, CategoryItem, DateInterval } from '@/db/schema';
import * as db from '@/db/database';
import { calculateMonthAnalytics, MonthAnalytics } from '@/utils/velocity';

interface TransactionContextType {
  transactions: Transaction[];
  categories: CategoryItem[];
  budgets: CategoryItem[]; // Kept for backwards compatibility
  analytics: MonthAnalytics;
  isLoading: boolean;
  currency: string;
  isBalanceHidden: boolean;
  dateInterval: DateInterval;
  setCurrency: (c: string) => void;
  setDateInterval: (interval: DateInterval) => void;
  toggleBalanceVisibility: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  addCustomCategory: (categoryName: string, icon?: string) => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currency, setCurrencyState] = useState<string>('USD');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);

  // Initialize date interval to current month
  const now = new Date();
  const [dateInterval, setDateInterval] = useState<DateInterval>({
    id: 'current_month',
    label: now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString(),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
  });

  // Load persisted currency on mount
  useEffect(() => {
    db.getSetting('currency', 'USD').then((saved) => {
      if (saved) {
        setCurrencyState(saved);
      }
    });
  }, []);

  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c);
    db.setSetting('currency', c).catch((err) => {
      console.error('Failed to persist currency:', err);
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const [txList, catList] = await Promise.all([
        db.getTransactions(),
        db.getCategories(),
      ]);
      setTransactions(txList);
      setCategories(catList);
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
    const created = await db.insertTransaction({
      ...tx,
      currency: tx.currency || currency,
    });
    await refresh();
    return created;
  };

  const deleteTransaction = async (id: string) => {
    await db.deleteTransaction(id);
    await refresh();
  };

  const addCustomCategory = async (categoryName: string, icon = 'tag') => {
    const trimmed = categoryName.trim();
    if (!trimmed) return;
    await db.addCategory({
      category: trimmed,
      icon,
      subtitle: 'Custom category',
    });
    await refresh();
  };

  const clearAll = async () => {
    await db.clearAllTransactions();
    await refresh();
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceHidden((prev) => !prev);
  };

  const analytics = calculateMonthAnalytics(
    transactions,
    categories,
    currency,
    dateInterval.startDate,
    dateInterval.endDate
  );

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        categories,
        budgets: categories, // Alias
        analytics,
        isLoading,
        currency,
        isBalanceHidden,
        dateInterval,
        setCurrency,
        setDateInterval,
        toggleBalanceVisibility,
        addTransaction,
        deleteTransaction,
        addCustomCategory,
        clearAll,
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

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Transaction, CategoryItem, DateInterval } from '@/db/schema';
import * as db from '@/db/database';
import { calculateMonthAnalytics, MonthAnalytics } from '@/utils/velocity';
import { getItem, setItem, getJSON, setJSON, STORAGE_KEYS } from '@/utils/storage';

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
  const defaultInterval: DateInterval = {
    id: 'current_month',
    label: now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    startDate: new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).toISOString(),
    endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString(),
  };
  const [dateInterval, setDateIntervalState] = useState<DateInterval>(defaultInterval);

  // Load persisted settings on mount
  useEffect(() => {
    async function loadPersistedSettings() {
      try {
        const [savedCurrency, savedHidden, savedInterval] = await Promise.all([
          getItem(STORAGE_KEYS.CURRENCY, 'USD'),
          getItem(STORAGE_KEYS.BALANCE_HIDDEN, 'false'),
          getJSON<DateInterval>(STORAGE_KEYS.DATE_INTERVAL, defaultInterval),
        ]);

        if (savedCurrency) setCurrencyState(savedCurrency);
        if (savedHidden === 'true') setIsBalanceHidden(true);
        if (savedInterval && savedInterval.startDate && savedInterval.endDate) {
          setDateIntervalState(savedInterval);
        }
      } catch (err) {
        console.warn('Failed to load persisted settings:', err);
      }
    }

    loadPersistedSettings();
  }, []);

  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c);
    setItem(STORAGE_KEYS.CURRENCY, c);
  }, []);

  const setDateInterval = useCallback((interval: DateInterval) => {
    setDateIntervalState(interval);
    setJSON(STORAGE_KEYS.DATE_INTERVAL, interval);
  }, []);

  const toggleBalanceVisibility = useCallback(() => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      setItem(STORAGE_KEYS.BALANCE_HIDDEN, String(next));
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      let [txList, catList] = await Promise.all([
        db.getTransactions(),
        db.getCategories(),
      ]);

      // If database returned empty on Web, check for storage backup to recover data
      if (txList.length === 0) {
        const backupTx = await getJSON<Transaction[]>(STORAGE_KEYS.TRANSACTIONS_BACKUP, []);
        if (backupTx.length > 0) {
          for (const tx of backupTx) {
            await db.insertTransaction(tx);
          }
          txList = backupTx;
        }
      } else {
        setJSON(STORAGE_KEYS.TRANSACTIONS_BACKUP, txList);
      }

      if (catList.length === 0) {
        const backupCats = await getJSON<CategoryItem[]>(STORAGE_KEYS.CATEGORIES_BACKUP, []);
        if (backupCats.length > 0) {
          for (const c of backupCats) {
            await db.addCategory(c);
          }
          catList = backupCats;
        }
      } else {
        setJSON(STORAGE_KEYS.CATEGORIES_BACKUP, catList);
      }

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
    await setJSON(STORAGE_KEYS.TRANSACTIONS_BACKUP, []);
    await refresh();
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

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Transaction, CategoryItem, DateInterval, RecurringBill } from '@/db/schema';
import * as db from '@/db/database';
import { ZenithBackupPayload, createBackupPayload } from '@/utils/backup';
import { calculateMonthAnalytics, MonthAnalytics } from '@/utils/velocity';
import { getItem, setItem, getJSON, setJSON, STORAGE_KEYS } from '@/utils/storage';
import {
  stepDateInterval as stepDateIntervalUtil,
  getCurrentInterval,
  isCurrentPeriod as isCurrentPeriodUtil,
  canStepNext as canStepNextUtil,
} from '@/utils/dateInterval';
import {
  calculateRecurringSummaries,
  getBillDueDateInInterval,
  type RecurringBillStatus,
  type RecurringCommitmentsSummary,
} from '@/utils/recurring';

interface TransactionContextType {
  transactions: Transaction[];
  categories: CategoryItem[];
  budgets: CategoryItem[]; // Kept for backwards compatibility
  analytics: MonthAnalytics;
  recurringBills: RecurringBill[];
  recurringStatuses: RecurringBillStatus[];
  recurringSummary: RecurringCommitmentsSummary;
  isLoading: boolean;
  currency: string;
  isBalanceHidden: boolean;
  dateInterval: DateInterval;
  salaryDay: number;
  isCurrentInterval: boolean;
  canGoNext: boolean;
  setCurrency: (c: string) => void;
  setDateInterval: (interval: DateInterval) => void;
  setSalaryDay: (day: number) => void;
  stepDateInterval: (direction: 'prev' | 'next') => void;
  resetDateIntervalToCurrent: () => void;
  toggleBalanceVisibility: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at'>) => Promise<Transaction>;
  deleteTransaction: (id: string) => Promise<void>;
  addCustomCategory: (categoryName: string, icon?: string) => Promise<void>;
  addRecurringBill: (bill: Omit<RecurringBill, 'id' | 'created_at'>) => Promise<RecurringBill>;
  updateRecurringBill: (bill: RecurringBill) => Promise<void>;
  deleteRecurringBill: (id: string) => Promise<void>;
  logRecurringBillPayment: (bill: RecurringBill, targetDate?: string | Date) => Promise<Transaction>;
  exportBackup: () => ZenithBackupPayload;
  importBackup: (payload: ZenithBackupPayload, mode: 'merge' | 'overwrite') => Promise<void>;
  clearAll: () => Promise<void>;
  refresh: () => Promise<void>;
}


const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

function getDefaultInterval(): DateInterval {
  return getCurrentInterval('current_month');
}

export function TransactionProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currency, setCurrencyState] = useState<string>('USD');
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(false);
  const [dateInterval, setDateIntervalState] = useState<DateInterval>(getDefaultInterval);
  const [salaryDay, setSalaryDayState] = useState<number>(27);

  // Load persisted settings on mount
  useEffect(() => {
    let isMounted = true;
    async function loadPersistedSettings() {
      try {
        const [savedCurrency, savedHidden, savedInterval, savedSalaryDay] = await Promise.all([
          getItem(STORAGE_KEYS.CURRENCY, 'USD'),
          getItem(STORAGE_KEYS.BALANCE_HIDDEN, 'false'),
          getJSON<DateInterval>(STORAGE_KEYS.DATE_INTERVAL, getDefaultInterval()),
          getItem(STORAGE_KEYS.SALARY_DAY, '27'),
        ]);

        if (!isMounted) return;
        if (savedCurrency) setCurrencyState(savedCurrency);
        if (savedHidden === 'true') setIsBalanceHidden(true);

        const day = parseInt(savedSalaryDay || '27', 10) || 27;
        setSalaryDayState(day);

        if (savedInterval && savedInterval.id === 'salary_cycle') {
          setDateIntervalState(getCurrentInterval('salary_cycle', day));
        } else if (savedInterval) {
          setDateIntervalState(savedInterval);
        }
      } catch (err) {
        console.warn('Failed to load persisted settings:', err);
      }
    }

    loadPersistedSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c);
    setItem(STORAGE_KEYS.CURRENCY, c);
  }, []);

  const setDateInterval = useCallback((interval: DateInterval) => {
    setDateIntervalState(interval);
    setJSON(STORAGE_KEYS.DATE_INTERVAL, interval);
  }, []);

  const setSalaryDay = useCallback((day: number) => {
    const bounded = Math.max(1, Math.min(31, Math.round(day)));
    setSalaryDayState(bounded);
    setItem(STORAGE_KEYS.SALARY_DAY, String(bounded));
  }, []);

  const stepDateInterval = useCallback((direction: 'prev' | 'next') => {
    setDateIntervalState((current) => {
      const next = stepDateIntervalUtil(current, direction, salaryDay);
      setJSON(STORAGE_KEYS.DATE_INTERVAL, next);
      return next;
    });
  }, [salaryDay]);

  const resetDateIntervalToCurrent = useCallback(() => {
    setDateIntervalState((current) => {
      const currentPeriod = getCurrentInterval(current.id, salaryDay);
      setJSON(STORAGE_KEYS.DATE_INTERVAL, currentPeriod);
      return currentPeriod;
    });
  }, [salaryDay]);

  const isCurrentInterval = useMemo(() => {
    return isCurrentPeriodUtil(dateInterval, salaryDay);
  }, [dateInterval, salaryDay]);

  const canGoNext = useMemo(() => {
    return canStepNextUtil(dateInterval, salaryDay);
  }, [dateInterval, salaryDay]);

  const toggleBalanceVisibility = useCallback(() => {
    setIsBalanceHidden((prev) => {
      const next = !prev;
      setItem(STORAGE_KEYS.BALANCE_HIDDEN, String(next));
      return next;
    });
  }, []);

  const refresh = useCallback(async () => {
    try {
      let [txList, catList, billsList] = await Promise.all([
        db.getTransactions(),
        db.getCategories(),
        db.getRecurringBills(),
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

      if (billsList.length === 0) {
        const backupBills = await getJSON<RecurringBill[]>(STORAGE_KEYS.RECURRING_BILLS_BACKUP, []);
        if (backupBills.length > 0) {
          for (const b of backupBills) {
            await db.insertRecurringBill(b);
          }
          billsList = backupBills;
        }
      } else {
        setJSON(STORAGE_KEYS.RECURRING_BILLS_BACKUP, billsList);
      }

      setTransactions(txList);
      setCategories(catList);
      setRecurringBills(billsList);
    } catch (error) {
      console.error('Failed to load transaction data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'created_at'>) => {
    const created = await db.insertTransaction({
      ...tx,
      currency: tx.currency || currency,
    });
    const updated = [created, ...transactions];
    await setJSON(STORAGE_KEYS.TRANSACTIONS_BACKUP, updated);
    await refresh();
    return created;
  };

  const deleteTransaction = async (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    await setJSON(STORAGE_KEYS.TRANSACTIONS_BACKUP, updated);
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

  const addRecurringBill = async (bill: Omit<RecurringBill, 'id' | 'created_at'>) => {
    const created = await db.insertRecurringBill({
      ...bill,
      currency: bill.currency || currency,
    });
    const updated = [...recurringBills, created];
    await setJSON(STORAGE_KEYS.RECURRING_BILLS_BACKUP, updated);
    await refresh();
    return created;
  };

  const updateRecurringBill = async (bill: RecurringBill) => {
    const updated = recurringBills.map((b) => (b.id === bill.id ? bill : b));
    await setJSON(STORAGE_KEYS.RECURRING_BILLS_BACKUP, updated);
    await db.updateRecurringBill(bill);
    await refresh();
  };

  const deleteRecurringBill = async (id: string) => {
    const updated = recurringBills.filter((b) => b.id !== id);
    await setJSON(STORAGE_KEYS.RECURRING_BILLS_BACKUP, updated);
    await db.deleteRecurringBill(id);
    await refresh();
  };

  const logRecurringBillPayment = async (bill: RecurringBill, targetDate?: string | Date) => {
    let txDate: string;
    if (targetDate) {
      txDate = typeof targetDate === 'string' ? targetDate : targetDate.toISOString();
    } else {
      const now = new Date();
      const start = new Date(dateInterval.startDate).getTime();
      const end = new Date(dateInterval.endDate).getTime();
      const nowTime = now.getTime();
      if (nowTime >= start && nowTime <= end) {
        txDate = now.toISOString();
      } else {
        const dueDate = getBillDueDateInInterval(bill, dateInterval.startDate, dateInterval.endDate);
        txDate = (dueDate || new Date(dateInterval.startDate)).toISOString();
      }
    }

    const created = await addTransaction({
      amount: bill.amount,
      category: bill.category,
      type: 'expense',
      merchant: bill.name,
      note: `Recurring • ${bill.name}`,
      date: txDate,
      payment_method: bill.payment_method || 'Card',
      currency: bill.currency || currency,
    });
    return created;
  };

  const exportBackup = useCallback((): ZenithBackupPayload => {
    return createBackupPayload({
      transactions,
      categories,
      recurring_bills: recurringBills,
      settings: {
        currency,
        salary_day: salaryDay,
        is_balance_hidden: isBalanceHidden,
      },
    });
  }, [transactions, categories, recurringBills, currency, salaryDay, isBalanceHidden]);

  const importBackup = useCallback(
    async (payload: ZenithBackupPayload, mode: 'merge' | 'overwrite') => {
      await db.restoreDatabaseFromBackup(payload, mode);

      if (mode === 'overwrite') {
        // Synchronize persistent backup cache BEFORE refresh() to prevent
        // refresh() from resurrecting old wiped transactions, categories, or bills
        await Promise.all([
          setJSON(STORAGE_KEYS.TRANSACTIONS_BACKUP, payload.data.transactions || []),
          setJSON(
            STORAGE_KEYS.CATEGORIES_BACKUP,
            payload.data.categories && payload.data.categories.length > 0
              ? payload.data.categories
              : db.DEFAULT_CATEGORIES
          ),
          setJSON(STORAGE_KEYS.RECURRING_BILLS_BACKUP, payload.data.recurring_bills || []),
        ]);

        if (payload.data.settings) {
          const newCurrency = payload.data.settings.currency || 'USD';
          const newSalaryDay = payload.data.settings.salary_day ?? 27;
          const newHidden = Boolean(payload.data.settings.is_balance_hidden);

          setCurrencyState(newCurrency);
          await setItem(STORAGE_KEYS.CURRENCY, newCurrency);

          setSalaryDayState(newSalaryDay);
          await setItem(STORAGE_KEYS.SALARY_DAY, String(newSalaryDay));

          setIsBalanceHidden(newHidden);
          await setItem(STORAGE_KEYS.BALANCE_HIDDEN, String(newHidden));

          setDateIntervalState((curr) => {
            if (curr.id === 'salary_cycle') {
              const updated = getCurrentInterval('salary_cycle', newSalaryDay);
              setJSON(STORAGE_KEYS.DATE_INTERVAL, updated);
              return updated;
            }
            return curr;
          });
        }
      }

      await refresh();

      const [latestTx, latestCats, latestBills] = await Promise.all([
        db.getTransactions(),
        db.getCategories(),
        db.getRecurringBills(),
      ]);
      await Promise.all([
        setJSON(STORAGE_KEYS.TRANSACTIONS_BACKUP, latestTx),
        setJSON(STORAGE_KEYS.CATEGORIES_BACKUP, latestCats),
        setJSON(STORAGE_KEYS.RECURRING_BILLS_BACKUP, latestBills),
      ]);
    },
    [refresh]
  );


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

  const { statuses: recurringStatuses, summary: recurringSummary } = useMemo(() => {
    return calculateRecurringSummaries(
      recurringBills,
      transactions,
      dateInterval.startDate,
      dateInterval.endDate,
      currency
    );
  }, [recurringBills, transactions, dateInterval.startDate, dateInterval.endDate, currency]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        categories,
        budgets: categories, // Alias
        analytics,
        recurringBills,
        recurringStatuses,
        recurringSummary,
        isLoading,
        currency,
        isBalanceHidden,
        dateInterval,
        salaryDay,
        isCurrentInterval,
        canGoNext,
        setCurrency,
        setDateInterval,
        setSalaryDay,
        stepDateInterval,
        resetDateIntervalToCurrent,
        toggleBalanceVisibility,
        addTransaction,
        deleteTransaction,
        addCustomCategory,
        addRecurringBill,
        updateRecurringBill,
        deleteRecurringBill,
        logRecurringBillPayment,
        exportBackup,
        importBackup,
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

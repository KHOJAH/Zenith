import type { Transaction, CategoryItem, RecurringBill } from './schema';
import type { ZenithBackupPayload } from '../utils/backup';
import { deduplicateMergeData } from '../utils/backup';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  {
    category: 'Housing & Utilities',
    icon: 'home',
    subtitle: 'Rent, water, electricity, internet',
  },
  {
    category: 'Food & Dining',
    icon: 'coffee',
    subtitle: 'Groceries, cafes, restaurants',
  },
  {
    category: 'Shopping & Tech',
    icon: 'shopping-bag',
    subtitle: 'Hardware, apparel, supplies',
  },
  {
    category: 'Entertainment',
    icon: 'film',
    subtitle: 'Streaming, cinema, events',
  },
  {
    category: 'Transport',
    icon: 'navigation',
    subtitle: 'Fuel, transit pass, rideshare',
  },
  {
    category: 'Health & Wellness',
    icon: 'activity',
    subtitle: 'Gym, medical, pharmacy',
  },
];

export const DEFAULT_BUDGETS = DEFAULT_CATEGORIES;

const TX_KEY = 'zenith_web_txs';
const CAT_KEY = 'zenith_web_cats';
const BILL_KEY = 'zenith_web_bills';
const SETTING_KEY_PREFIX = 'zenith_web_setting_';

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || !window.localStorage) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export async function getDatabase(): Promise<any> {
  return null;
}

export async function getTransactions(): Promise<Transaction[]> {
  return getStored<Transaction[]>(TX_KEY, []);
}

export async function insertTransaction(
  tx: Omit<Transaction, 'id' | 'created_at'>
): Promise<Transaction> {
  const current = await getTransactions();
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const created_at = new Date().toISOString();
  const txCurrency = tx.currency || 'USD';

  const newTx: Transaction = {
    ...tx,
    id,
    currency: txCurrency,
    merchant: tx.merchant || tx.category || (tx.type === 'income' ? 'Income' : 'Expense'),
    note: tx.note || '',
    payment_method: tx.payment_method || 'Card',
    created_at,
  };

  const updated = [newTx, ...current];
  setStored(TX_KEY, updated);
  return newTx;
}

export async function deleteTransaction(id: string): Promise<void> {
  const current = await getTransactions();
  const updated = current.filter((t) => t.id !== id);
  setStored(TX_KEY, updated);
}

export async function clearAllTransactions(): Promise<void> {
  setStored(TX_KEY, []);
}

export async function getCategories(): Promise<CategoryItem[]> {
  return getStored<CategoryItem[]>(CAT_KEY, DEFAULT_CATEGORIES);
}

export async function addCategory(category: CategoryItem): Promise<void> {
  const current = await getCategories();
  const filtered = current.filter((c) => c.category !== category.category);
  const updated = [...filtered, category].sort((a, b) => a.category.localeCompare(b.category));
  setStored(CAT_KEY, updated);
}

export const getBudgets = getCategories;
export const addBudgetCategory = (cat: any) =>
  addCategory({ category: cat.category, icon: cat.icon, subtitle: cat.subtitle });

export async function getSetting(key: string, defaultValue: string): Promise<string> {
  if (typeof window === 'undefined' || !window.localStorage) return defaultValue;
  try {
    const v = window.localStorage.getItem(SETTING_KEY_PREFIX + key);
    return v !== null ? v : defaultValue;
  } catch {
    return defaultValue;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(SETTING_KEY_PREFIX + key, value);
  } catch {}
}

export async function getRecurringBills(): Promise<RecurringBill[]> {
  return getStored<RecurringBill[]>(BILL_KEY, []);
}

export async function insertRecurringBill(
  bill: Omit<RecurringBill, 'id' | 'created_at'> & { id?: string; created_at?: string }
): Promise<RecurringBill> {
  const current = await getRecurringBills();
  const id = bill.id || `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const created_at = bill.created_at || new Date().toISOString();

  const newBill: RecurringBill = {
    ...bill,
    id,
    currency: bill.currency || 'USD',
    payment_method: bill.payment_method || 'Card',
    frequency: bill.frequency || 'monthly',
    icon: bill.icon || 'calendar',
    is_active: bill.is_active !== undefined ? bill.is_active : true,
    created_at,
  };

  const updated = [...current, newBill].sort((a, b) => a.due_day - b.due_day);
  setStored(BILL_KEY, updated);
  return newBill;
}

export async function updateRecurringBill(bill: RecurringBill): Promise<void> {
  const current = await getRecurringBills();
  const updated = current.map((b) => (b.id === bill.id ? bill : b));
  setStored(BILL_KEY, updated);
}

export async function deleteRecurringBill(id: string): Promise<void> {
  const current = await getRecurringBills();
  const updated = current.filter((b) => b.id !== id);
  setStored(BILL_KEY, updated);
}

export async function restoreDatabaseFromBackup(
  payload: ZenithBackupPayload,
  mode: 'merge' | 'overwrite'
): Promise<void> {
  if (mode === 'overwrite') {
    setStored(TX_KEY, payload.data.transactions || []);
    setStored(
      CAT_KEY,
      payload.data.categories && payload.data.categories.length > 0
        ? payload.data.categories
        : DEFAULT_CATEGORIES
    );
    setStored(BILL_KEY, payload.data.recurring_bills || []);
    if (payload.data.settings) {
      await setSetting('zenith_currency', payload.data.settings.currency || 'USD');
      await setSetting('zenith_salary_day', String(payload.data.settings.salary_day ?? 27));
      await setSetting('zenith_balance_hidden', String(Boolean(payload.data.settings.is_balance_hidden)));
    }
  } else {
    const [existingTx, existingCats, existingBills] = await Promise.all([
      getTransactions(),
      getCategories(),
      getRecurringBills(),
    ]);

    const { transactionsToAdd, recurringBillsToAdd, categoriesToAdd } = deduplicateMergeData({
      existingTransactions: existingTx,
      incomingTransactions: payload.data.transactions || [],
      existingRecurringBills: existingBills,
      incomingRecurringBills: payload.data.recurring_bills || [],
      existingCategories: existingCats,
      incomingCategories: payload.data.categories || [],
    });

    setStored(TX_KEY, [...existingTx, ...transactionsToAdd]);
    setStored(CAT_KEY, [...existingCats, ...categoriesToAdd]);
    setStored(BILL_KEY, [...existingBills, ...recurringBillsToAdd]);
  }
}

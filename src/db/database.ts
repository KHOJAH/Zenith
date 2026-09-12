import * as SQLite from 'expo-sqlite';
import type { Transaction, CategoryItem, RecurringBill } from './schema';

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

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('zenith_v2.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          category TEXT NOT NULL,
          merchant TEXT NOT NULL,
          note TEXT,
          date TEXT NOT NULL,
          payment_method TEXT,
          currency TEXT DEFAULT 'USD',
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS categories (
          category TEXT PRIMARY KEY NOT NULL,
          icon TEXT NOT NULL,
          subtitle TEXT
        );

        CREATE TABLE IF NOT EXISTS app_settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS recurring_bills (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL,
          currency TEXT DEFAULT 'USD',
          payment_method TEXT DEFAULT 'Card',
          frequency TEXT NOT NULL DEFAULT 'monthly',
          due_day INTEGER NOT NULL,
          due_month INTEGER,
          icon TEXT DEFAULT 'calendar',
          is_active INTEGER DEFAULT 1,
          created_at TEXT NOT NULL
        );
      `);

      try {
        await db.execAsync("ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'USD';");
      } catch {
        // Column already exists
      }

      // Check if categories need migration from old budgets table or initialization
      try {
        await db.execAsync(`
          INSERT OR IGNORE INTO categories (category, icon, subtitle)
          SELECT category, icon, subtitle FROM budgets;
        `);
      } catch {
        // Old budgets table might not exist
      }

      const existingCats = await db.getAllAsync<{ category: string }>('SELECT category FROM categories LIMIT 1');
      if (existingCats.length === 0) {
        for (const c of DEFAULT_CATEGORIES) {
          await db.runAsync(
            'INSERT OR IGNORE INTO categories (category, icon, subtitle) VALUES (?, ?, ?)',
            [c.category, c.icon, c.subtitle || '']
          );
        }
      }

      return db;
    })();
  }
  return dbPromise;
}

export async function getTransactions(): Promise<Transaction[]> {
  const db = await getDatabase();
  return await db.getAllAsync<Transaction>(
    'SELECT * FROM transactions ORDER BY date DESC, created_at DESC'
  );
}

export async function insertTransaction(
  tx: Omit<Transaction, 'id' | 'created_at'>
): Promise<Transaction> {
  const db = await getDatabase();
  const id = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const created_at = new Date().toISOString();
  const txCurrency = tx.currency || 'USD';

  await db.runAsync(
    `INSERT INTO transactions (id, amount, type, category, merchant, note, date, payment_method, currency, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tx.amount,
      tx.type,
      tx.category,
      tx.merchant || tx.category || (tx.type === 'income' ? 'Income' : 'Expense'),
      tx.note || '',
      tx.date,
      tx.payment_method || 'Card',
      txCurrency,
      created_at,
    ]
  );

  return {
    ...tx,
    currency: txCurrency,
    id,
    created_at,
  };
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions WHERE id = ?', [id]);
}

export async function clearAllTransactions(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions');
}

export async function getCategories(): Promise<CategoryItem[]> {
  const db = await getDatabase();
  return await db.getAllAsync<CategoryItem>('SELECT * FROM categories ORDER BY category ASC');
}

export async function addCategory(category: CategoryItem): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO categories (category, icon, subtitle) VALUES (?, ?, ?)`,
    [category.category, category.icon, category.subtitle || '']
  );
}

// Backward-compatible aliases
export const getBudgets = getCategories;
export const addBudgetCategory = (cat: any) => addCategory({ category: cat.category, icon: cat.icon, subtitle: cat.subtitle });

// Settings key-value store for persisting settings (e.g. active currency)
export async function getSetting(key: string, defaultValue: string): Promise<string> {
  try {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', [key]);
    return row ? row.value : defaultValue;
  } catch (error) {
    console.error(`Error reading setting ${key}:`, error);
    return defaultValue;
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  try {
    const db = await getDatabase();
    await db.runAsync('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)', [key, value]);
  } catch (error) {
    console.error(`Error saving setting ${key}:`, error);
  }
}

export async function getRecurringBills(): Promise<RecurringBill[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM recurring_bills ORDER BY due_day ASC, name ASC'
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    amount: Number(row.amount),
    category: row.category,
    currency: row.currency || 'USD',
    payment_method: (row.payment_method || 'Card') as 'Card' | 'Cash',
    frequency: (row.frequency || 'monthly') as 'monthly' | 'yearly',
    due_day: Number(row.due_day),
    due_month: row.due_month != null ? Number(row.due_month) : undefined,
    icon: row.icon || 'calendar',
    is_active: row.is_active === 1 || row.is_active === true || row.is_active === '1',
    created_at: row.created_at,
  }));
}

export async function insertRecurringBill(
  bill: Omit<RecurringBill, 'id' | 'created_at'> & { id?: string; created_at?: string }
): Promise<RecurringBill> {
  const db = await getDatabase();
  const id = bill.id || `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const created_at = bill.created_at || new Date().toISOString();
  const currency = bill.currency || 'USD';
  const payment_method = bill.payment_method || 'Card';
  const frequency = bill.frequency || 'monthly';
  const icon = bill.icon || 'calendar';
  const is_active = bill.is_active !== undefined ? (bill.is_active ? 1 : 0) : 1;
  const due_month = bill.due_month != null ? bill.due_month : null;

  await db.runAsync(
    `INSERT INTO recurring_bills (id, name, amount, category, currency, payment_method, frequency, due_day, due_month, icon, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      bill.name,
      bill.amount,
      bill.category,
      currency,
      payment_method,
      frequency,
      bill.due_day,
      due_month,
      icon,
      is_active,
      created_at,
    ]
  );

  return {
    ...bill,
    id,
    currency,
    payment_method,
    frequency,
    icon,
    is_active: is_active === 1,
    due_month: due_month != null ? due_month : undefined,
    created_at,
  };
}

export async function updateRecurringBill(bill: RecurringBill): Promise<void> {
  const db = await getDatabase();
  const is_active = bill.is_active ? 1 : 0;
  const due_month = bill.due_month != null ? bill.due_month : null;

  await db.runAsync(
    `UPDATE recurring_bills
     SET name = ?, amount = ?, category = ?, currency = ?, payment_method = ?, frequency = ?, due_day = ?, due_month = ?, icon = ?, is_active = ?
     WHERE id = ?`,
    [
      bill.name,
      bill.amount,
      bill.category,
      bill.currency || 'USD',
      bill.payment_method || 'Card',
      bill.frequency || 'monthly',
      bill.due_day,
      due_month,
      bill.icon || 'calendar',
      is_active,
      bill.id,
    ]
  );
}

export async function deleteRecurringBill(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM recurring_bills WHERE id = ?', [id]);
}


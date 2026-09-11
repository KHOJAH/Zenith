import * as SQLite from 'expo-sqlite';
import { Transaction, CategoryItem, BudgetCategory } from './schema';

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

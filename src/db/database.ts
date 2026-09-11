import * as SQLite from 'expo-sqlite';
import { Transaction, BudgetCategory } from './schema';

export const DEFAULT_BUDGETS: BudgetCategory[] = [
  {
    category: 'Housing & Utilities',
    monthly_limit: 1500,
    icon: 'home',
    subtitle: 'Rent, water, electricity, internet',
  },
  {
    category: 'Food & Dining',
    monthly_limit: 700,
    icon: 'coffee',
    subtitle: 'Groceries, cafes, restaurants',
  },
  {
    category: 'Shopping & Tech',
    monthly_limit: 400,
    icon: 'shopping-bag',
    subtitle: 'Hardware, apparel, supplies',
  },
  {
    category: 'Entertainment',
    monthly_limit: 250,
    icon: 'film',
    subtitle: 'Streaming, cinema, events',
  },
  {
    category: 'Transport',
    monthly_limit: 200,
    icon: 'navigation',
    subtitle: 'Fuel, transit pass, rideshare',
  },
  {
    category: 'Health & Wellness',
    monthly_limit: 300,
    icon: 'activity',
    subtitle: 'Gym, medical, pharmacy',
  },
];

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
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS budgets (
          category TEXT PRIMARY KEY NOT NULL,
          monthly_limit REAL NOT NULL,
          icon TEXT NOT NULL,
          subtitle TEXT NOT NULL
        );
      `);

      const existingBudgets = await db.getAllAsync<{ category: string }>('SELECT category FROM budgets LIMIT 1');
      if (existingBudgets.length === 0) {
        for (const b of DEFAULT_BUDGETS) {
          await db.runAsync(
            'INSERT INTO budgets (category, monthly_limit, icon, subtitle) VALUES (?, ?, ?, ?)',
            [b.category, b.monthly_limit, b.icon, b.subtitle]
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

  await db.runAsync(
    `INSERT INTO transactions (id, amount, type, category, merchant, note, date, payment_method, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tx.amount,
      tx.type,
      tx.category,
      tx.merchant,
      tx.note || '',
      tx.date,
      tx.payment_method || 'Card',
      created_at,
    ]
  );

  return {
    ...tx,
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

export async function getBudgets(): Promise<BudgetCategory[]> {
  const db = await getDatabase();
  return await db.getAllAsync<BudgetCategory>('SELECT * FROM budgets ORDER BY monthly_limit DESC');
}

export async function addBudgetCategory(category: BudgetCategory): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO budgets (category, monthly_limit, icon, subtitle) VALUES (?, ?, ?, ?)`,
    [category.category, category.monthly_limit, category.icon, category.subtitle]
  );
}

export async function updateBudgetLimit(category: string, newLimit: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE budgets SET monthly_limit = ? WHERE category = ?', [newLimit, category]);
}

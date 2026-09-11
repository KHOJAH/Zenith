import * as SQLite from 'expo-sqlite';
import { Transaction, BudgetCategory, CategorySummary } from './schema';
import { INITIAL_BUDGETS, DEMO_TRANSACTIONS } from './seed';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('zenith.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;

        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY NOT NULL,
          amount REAL NOT NULL,
          type TEXT NOT NULL,
          category TEXT NOT NULL,
          merchant TEXT NOT NULL,
          note TEXT,
          tags TEXT,
          date TEXT NOT NULL,
          payment_method TEXT,
          is_split INTEGER DEFAULT 0,
          split_count INTEGER DEFAULT 1,
          created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS budgets (
          category TEXT PRIMARY KEY NOT NULL,
          monthly_limit REAL NOT NULL,
          icon TEXT NOT NULL,
          subtitle TEXT NOT NULL
        );
      `);

      // Initialize default budgets if empty
      const existingBudgets = await db.getAllAsync<{ category: string }>('SELECT category FROM budgets LIMIT 1');
      if (existingBudgets.length === 0) {
        for (const b of INITIAL_BUDGETS) {
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
    `INSERT INTO transactions (id, amount, type, category, merchant, note, tags, date, payment_method, is_split, split_count, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      tx.amount,
      tx.type,
      tx.category,
      tx.merchant,
      tx.note || '',
      tx.tags || '',
      tx.date,
      tx.payment_method || 'Card',
      tx.is_split ? 1 : 0,
      tx.split_count || 1,
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

export async function loadDemoData(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM transactions');

  for (const item of DEMO_TRANSACTIONS) {
    const id = `tx_demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const created_at = item.date;
    await db.runAsync(
      `INSERT INTO transactions (id, amount, type, category, merchant, note, tags, date, payment_method, is_split, split_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.amount,
        item.type,
        item.category,
        item.merchant,
        item.note || '',
        item.tags || '',
        item.date,
        item.payment_method || 'Card',
        item.is_split || 0,
        item.split_count || 1,
        created_at,
      ]
    );
  }
}

export async function getBudgets(): Promise<BudgetCategory[]> {
  const db = await getDatabase();
  return await db.getAllAsync<BudgetCategory>('SELECT * FROM budgets ORDER BY monthly_limit DESC');
}

export async function updateBudgetLimit(category: string, newLimit: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE budgets SET monthly_limit = ? WHERE category = ?', [newLimit, category]);
}

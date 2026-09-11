import { Platform } from 'react-native';
import * as db from '@/db/database';

export const STORAGE_KEYS = {
  THEME_MODE: 'zenith_theme_mode',
  CURRENCY: 'zenith_currency',
  BALANCE_HIDDEN: 'zenith_balance_hidden',
  DATE_INTERVAL: 'zenith_date_interval',
  TRANSACTIONS_BACKUP: 'zenith_transactions_backup',
  CATEGORIES_BACKUP: 'zenith_categories_backup',
  SALARY_DAY: 'zenith_salary_day',
};

// In-memory fallback cache
const memoryCache = new Map<string, string>();

function isWeb(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined' && !!window.localStorage;
}

export async function getItem(key: string, defaultValue: string = ''): Promise<string> {
  try {
    if (isWeb()) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }

    // Try SQLite settings
    const sqlVal = await db.getSetting(key, '');
    if (sqlVal) {
      if (isWeb()) window.localStorage.setItem(key, sqlVal);
      return sqlVal;
    }

    // Try in-memory
    if (memoryCache.has(key)) {
      return memoryCache.get(key) || defaultValue;
    }

    return defaultValue;
  } catch (error) {
    console.warn(`[Storage] Failed to read key: ${key}`, error);
    return memoryCache.get(key) || defaultValue;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  try {
    memoryCache.set(key, value);

    if (isWeb()) {
      window.localStorage.setItem(key, value);
    }

    // Persist in SQLite
    await db.setSetting(key, value);
  } catch (error) {
    console.warn(`[Storage] Failed to write key: ${key}`, error);
  }
}

export async function removeItem(key: string): Promise<void> {
  try {
    memoryCache.delete(key);
    if (isWeb()) {
      window.localStorage.removeItem(key);
    }
    await db.setSetting(key, '');
  } catch (error) {
    console.warn(`[Storage] Failed to remove key: ${key}`, error);
  }
}

export async function getJSON<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const raw = await getItem(key, '');
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  try {
    const raw = JSON.stringify(value);
    await setItem(key, raw);
  } catch (error) {
    console.warn(`[Storage] Failed to write JSON key: ${key}`, error);
  }
}

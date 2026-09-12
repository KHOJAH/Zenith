import { Platform, Share } from 'react-native';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import type { Transaction, CategoryItem, RecurringBill } from '@/db/schema';

export interface ZenithBackupPayload {
  version: 1;
  app: 'Zenith';
  exported_at: string;
  metadata: {
    transaction_count: number;
    category_count: number;
    recurring_bills_count: number;
    currency: string;
    salary_day: number;
  };
  data: {
    transactions: Transaction[];
    categories: CategoryItem[];
    recurring_bills: RecurringBill[];
    settings: {
      currency: string;
      salary_day: number;
      is_balance_hidden: boolean;
    };
  };
}

export interface CreateBackupParams {
  transactions: Transaction[];
  categories: CategoryItem[];
  recurring_bills: RecurringBill[];
  settings: {
    currency: string;
    salary_day: number;
    is_balance_hidden: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  payload?: ZenithBackupPayload;
  error?: string;
}

export interface DeduplicateMergeParams {
  existingTransactions: Transaction[];
  incomingTransactions: Transaction[];
  existingRecurringBills: RecurringBill[];
  incomingRecurringBills: RecurringBill[];
  existingCategories: CategoryItem[];
  incomingCategories: CategoryItem[];
}

export interface DeduplicateMergeResult {
  transactionsToAdd: Transaction[];
  recurringBillsToAdd: RecurringBill[];
  categoriesToAdd: CategoryItem[];
  stats: {
    transactionsAdded: number;
    transactionsSkipped: number;
    recurringBillsAdded: number;
    recurringBillsSkipped: number;
    categoriesAdded: number;
    categoriesSkipped: number;
  };
}

/**
 * Serializes the current ledger, categories, recurring bills, and user settings
 * into a versioned, validated ZenithBackupPayload object.
 */
export function createBackupPayload({
  transactions,
  categories,
  recurring_bills,
  settings,
}: CreateBackupParams): ZenithBackupPayload {
  return {
    version: 1,
    app: 'Zenith',
    exported_at: new Date().toISOString(),
    metadata: {
      transaction_count: transactions.length,
      category_count: categories.length,
      recurring_bills_count: recurring_bills.length,
      currency: settings.currency || 'USD',
      salary_day: settings.salary_day ?? 27,
    },
    data: {
      transactions: transactions.map((t) => ({ ...t })),
      categories: categories.map((c) => ({ ...c })),
      recurring_bills: recurring_bills.map((b) => ({ ...b })),
      settings: {
        currency: settings.currency || 'USD',
        salary_day: settings.salary_day ?? 27,
        is_balance_hidden: Boolean(settings.is_balance_hidden),
      },
    },
  };
}

/**
 * Validates any raw string or JSON structure to guarantee it conforms
 * to the ZenithBackupPayload schema, checking schema version, required arrays,
 * and valid transaction/category/recurring bill records.
 */
export function validateBackupPayload(raw: string | any): ValidationResult {
  let data: any;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) {
      return { valid: false, error: 'Empty backup payload received' };
    }
    try {
      data = JSON.parse(trimmed);
    } catch (parseErr: any) {
      return {
        valid: false,
        error: `Invalid JSON format: ${parseErr?.message || 'failed to parse'}`,
      };
    }
  } else {
    data = raw;
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Backup payload must be a JSON object' };
  }

  // Check app identifier
  if (data.app !== 'Zenith') {
    return {
      valid: false,
      error: 'Invalid application identifier (expected "Zenith")',
    };
  }

  // Check schema version
  if (data.version !== 1) {
    return {
      valid: false,
      error: `Unsupported backup version: ${data.version ?? 'missing'} (expected version 1)`,
    };
  }

  // Check exported_at
  if (
    typeof data.exported_at !== 'string' ||
    !data.exported_at.trim() ||
    isNaN(Date.parse(data.exported_at))
  ) {
    return { valid: false, error: 'Missing or invalid exported_at timestamp' };
  }

  // Check data container
  if (!data.data || typeof data.data !== 'object' || Array.isArray(data.data)) {
    return { valid: false, error: 'Missing data container in backup payload' };
  }

  // Check data.transactions
  if (!Array.isArray(data.data.transactions)) {
    return { valid: false, error: 'data.transactions must be an array' };
  }

  // Check data.categories
  if (!Array.isArray(data.data.categories)) {
    return { valid: false, error: 'data.categories must be an array' };
  }

  // Check data.recurring_bills
  if (!Array.isArray(data.data.recurring_bills)) {
    return { valid: false, error: 'data.recurring_bills must be an array' };
  }

  // Check metadata
  if (!data.metadata || typeof data.metadata !== 'object' || Array.isArray(data.metadata)) {
    return { valid: false, error: 'Missing or invalid backup metadata' };
  }
  const { transaction_count, category_count, recurring_bills_count, currency, salary_day } =
    data.metadata;
  if (
    typeof transaction_count !== 'number' ||
    typeof category_count !== 'number' ||
    typeof recurring_bills_count !== 'number' ||
    typeof currency !== 'string' ||
    typeof salary_day !== 'number'
  ) {
    return { valid: false, error: 'Incomplete metadata fields' };
  }

  if (transaction_count !== data.data.transactions.length) {
    return {
      valid: false,
      error: `Metadata transaction_count (${transaction_count}) does not match transactions count (${data.data.transactions.length})`,
    };
  }
  if (category_count !== data.data.categories.length) {
    return {
      valid: false,
      error: `Metadata category_count (${category_count}) does not match categories count (${data.data.categories.length})`,
    };
  }
  if (recurring_bills_count !== data.data.recurring_bills.length) {
    return {
      valid: false,
      error: `Metadata recurring_bills_count (${recurring_bills_count}) does not match recurring bills count (${data.data.recurring_bills.length})`,
    };
  }

  // Deep validate transactions
  for (let i = 0; i < data.data.transactions.length; i++) {
    const tx = data.data.transactions[i];
    if (!tx || typeof tx !== 'object') {
      return { valid: false, error: `Transaction at index ${i} is not an object` };
    }
    if (typeof tx.id !== 'string' || !tx.id.trim()) {
      return { valid: false, error: `Transaction at index ${i} missing valid string id` };
    }
    if (typeof tx.amount !== 'number' || !Number.isFinite(tx.amount) || tx.amount < 0) {
      return { valid: false, error: `Transaction at index ${i} has invalid amount` };
    }
    if (tx.type !== 'expense' && tx.type !== 'income') {
      return {
        valid: false,
        error: `Transaction at index ${i} has invalid type (must be "expense" or "income")`,
      };
    }
    if (typeof tx.category !== 'string' || !tx.category.trim()) {
      return { valid: false, error: `Transaction at index ${i} has invalid category` };
    }
    if (typeof tx.date !== 'string' || !tx.date.trim() || isNaN(Date.parse(tx.date))) {
      return { valid: false, error: `Transaction at index ${i} has invalid date` };
    }
    if (
      typeof tx.created_at !== 'string' ||
      !tx.created_at.trim() ||
      isNaN(Date.parse(tx.created_at))
    ) {
      return { valid: false, error: `Transaction at index ${i} has invalid created_at timestamp` };
    }
  }

  // Deep validate categories
  for (let i = 0; i < data.data.categories.length; i++) {
    const cat = data.data.categories[i];
    if (!cat || typeof cat !== 'object') {
      return { valid: false, error: `Category at index ${i} is not an object` };
    }
    if (typeof cat.category !== 'string' || !cat.category.trim()) {
      return { valid: false, error: `Category at index ${i} missing valid category name` };
    }
    if (typeof cat.icon !== 'string' || !cat.icon.trim()) {
      return { valid: false, error: `Category at index ${i} missing icon identifier` };
    }
  }

  // Deep validate recurring bills
  for (let i = 0; i < data.data.recurring_bills.length; i++) {
    const bill = data.data.recurring_bills[i];
    if (!bill || typeof bill !== 'object') {
      return { valid: false, error: `Recurring bill at index ${i} is not an object` };
    }
    if (typeof bill.id !== 'string' || !bill.id.trim()) {
      return { valid: false, error: `Recurring bill at index ${i} missing valid string id` };
    }
    if (typeof bill.name !== 'string' || !bill.name.trim()) {
      return { valid: false, error: `Recurring bill at index ${i} missing valid name` };
    }
    if (typeof bill.amount !== 'number' || !Number.isFinite(bill.amount) || bill.amount < 0) {
      return { valid: false, error: `Recurring bill at index ${i} has invalid amount` };
    }
    if (typeof bill.category !== 'string' || !bill.category.trim()) {
      return { valid: false, error: `Recurring bill at index ${i} has invalid category` };
    }
    if (bill.frequency !== 'monthly' && bill.frequency !== 'yearly') {
      return {
        valid: false,
        error: `Recurring bill at index ${i} has invalid frequency (must be "monthly" or "yearly")`,
      };
    }
    if (
      typeof bill.due_day !== 'number' ||
      !Number.isInteger(bill.due_day) ||
      bill.due_day < 1 ||
      bill.due_day > 31
    ) {
      return {
        valid: false,
        error: `Recurring bill at index ${i} has invalid due_day (must be integer 1-31)`,
      };
    }
    if (
      bill.frequency === 'yearly' &&
      (typeof bill.due_month !== 'number' ||
        !Number.isInteger(bill.due_month) ||
        bill.due_month < 1 ||
        bill.due_month > 12)
    ) {
      return {
        valid: false,
        error: `Recurring bill at index ${i} has invalid due_month for yearly frequency (must be integer 1-12)`,
      };
    }
    if (
      bill.due_month != null &&
      (typeof bill.due_month !== 'number' ||
        !Number.isInteger(bill.due_month) ||
        bill.due_month < 1 ||
        bill.due_month > 12)
    ) {
      return {
        valid: false,
        error: `Recurring bill at index ${i} has invalid due_month (must be integer 1-12)`,
      };
    }
    if (typeof bill.is_active !== 'boolean') {
      return {
        valid: false,
        error: `Recurring bill at index ${i} has invalid is_active flag (must be boolean)`,
      };
    }
  }

  // Check data.settings
  if (!data.data.settings || typeof data.data.settings !== 'object' || Array.isArray(data.data.settings)) {
    return { valid: false, error: 'Missing or invalid data.settings object' };
  }
  const { currency: sCurrency, salary_day: sSalaryDay, is_balance_hidden } = data.data.settings;
  if (typeof sCurrency !== 'string' || !sCurrency.trim()) {
    return { valid: false, error: 'Invalid settings.currency string' };
  }
  if (typeof sSalaryDay !== 'number' || !Number.isInteger(sSalaryDay) || sSalaryDay < 1 || sSalaryDay > 31) {
    return { valid: false, error: 'Invalid settings.salary_day (must be integer 1-31)' };
  }
  if (typeof is_balance_hidden !== 'boolean') {
    return { valid: false, error: 'Invalid settings.is_balance_hidden (must be boolean)' };
  }

  return {
    valid: true,
    payload: data as ZenithBackupPayload,
  };
}

/**
 * Deduplicates incoming backup data against existing local data for non-destructive merge.
 * Appends records with freshly generated IDs, avoiding duplicate records.
 */
export function deduplicateMergeData({
  existingTransactions,
  incomingTransactions,
  existingRecurringBills,
  incomingRecurringBills,
  existingCategories,
  incomingCategories,
}: DeduplicateMergeParams): DeduplicateMergeResult {
  // 1. Categories deduplication by case-insensitive category name
  const existingCatNames = new Set(
    existingCategories.map((c) => c.category.trim().toLowerCase())
  );
  const categoriesToAdd: CategoryItem[] = [];
  let categoriesSkipped = 0;

  for (const incomingCat of incomingCategories) {
    const key = incomingCat.category.trim().toLowerCase();
    if (existingCatNames.has(key)) {
      categoriesSkipped++;
    } else {
      existingCatNames.add(key);
      categoriesToAdd.push({ ...incomingCat });
    }
  }

  // 2. Recurring bills deduplication
  const existingBillIds = new Set(existingRecurringBills.map((b) => b.id));
  const getBillSig = (b: RecurringBill) =>
    `${b.name.trim().toLowerCase()}|${b.amount}|${(b.currency || 'USD').toUpperCase()}|${b.frequency}|${b.due_day}|${b.due_month ?? ''}|${b.category.trim().toLowerCase()}`;

  const existingBillSigCounts = new Map<string, number>();
  for (const b of existingRecurringBills) {
    const sig = getBillSig(b);
    existingBillSigCounts.set(sig, (existingBillSigCounts.get(sig) || 0) + 1);
  }

  const recurringBillsToAdd: RecurringBill[] = [];
  let recurringBillsSkipped = 0;
  const seenIncomingBillIds = new Set<string>();
  const seenIncomingBillSigs = new Set<string>();

  for (const incomingBill of incomingRecurringBills) {
    if (seenIncomingBillIds.has(incomingBill.id)) {
      recurringBillsSkipped++;
      continue;
    }
    seenIncomingBillIds.add(incomingBill.id);

    const sig = getBillSig(incomingBill);

    if (existingBillIds.has(incomingBill.id)) {
      recurringBillsSkipped++;
      seenIncomingBillSigs.add(sig);
      const count = existingBillSigCounts.get(sig) || 0;
      if (count > 0) existingBillSigCounts.set(sig, count - 1);
      continue;
    }

    const availableCount = existingBillSigCounts.get(sig) || 0;
    if (availableCount > 0) {
      existingBillSigCounts.set(sig, availableCount - 1);
      seenIncomingBillSigs.add(sig);
      recurringBillsSkipped++;
      continue;
    }

    if (seenIncomingBillSigs.has(sig)) {
      recurringBillsSkipped++;
      continue;
    }
    seenIncomingBillSigs.add(sig);

    const newId = `bill_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${recurringBillsToAdd.length + 1}`;
    recurringBillsToAdd.push({
      ...incomingBill,
      id: newId,
    });
  }

  // 3. Transactions deduplication
  const existingTxIds = new Set(existingTransactions.map((t) => t.id));
  const getTxSig = (t: Transaction) =>
    `${t.amount}|${(t.currency || 'USD').toUpperCase()}|${t.type}|${t.category.trim().toLowerCase()}|${t.date.trim()}|${(t.merchant || '').trim().toLowerCase()}|${(t.note || '').trim().toLowerCase()}`;

  const existingTxSigCounts = new Map<string, number>();
  for (const t of existingTransactions) {
    const sig = getTxSig(t);
    existingTxSigCounts.set(sig, (existingTxSigCounts.get(sig) || 0) + 1);
  }

  const transactionsToAdd: Transaction[] = [];
  let transactionsSkipped = 0;
  const seenIncomingTxIds = new Set<string>();
  const seenIncomingTxSigs = new Set<string>();

  for (const incomingTx of incomingTransactions) {
    if (seenIncomingTxIds.has(incomingTx.id)) {
      transactionsSkipped++;
      continue;
    }
    seenIncomingTxIds.add(incomingTx.id);

    const sig = getTxSig(incomingTx);

    if (existingTxIds.has(incomingTx.id)) {
      transactionsSkipped++;
      seenIncomingTxSigs.add(sig);
      const count = existingTxSigCounts.get(sig) || 0;
      if (count > 0) existingTxSigCounts.set(sig, count - 1);
      continue;
    }

    const availableCount = existingTxSigCounts.get(sig) || 0;
    if (availableCount > 0) {
      existingTxSigCounts.set(sig, availableCount - 1);
      seenIncomingTxSigs.add(sig);
      transactionsSkipped++;
      continue;
    }

    if (seenIncomingTxSigs.has(sig)) {
      transactionsSkipped++;
      continue;
    }
    seenIncomingTxSigs.add(sig);

    const newId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${transactionsToAdd.length + 1}`;
    transactionsToAdd.push({
      ...incomingTx,
      id: newId,
    });
  }

  return {
    transactionsToAdd,
    recurringBillsToAdd,
    categoriesToAdd,
    stats: {
      transactionsAdded: transactionsToAdd.length,
      transactionsSkipped,
      recurringBillsAdded: recurringBillsToAdd.length,
      recurringBillsSkipped,
      categoriesAdded: categoriesToAdd.length,
      categoriesSkipped,
    },
  };
}

/**
 * Reads a backup payload file from a URI (native or web) or Web File object.
 */
export async function readBackupFile(uri: string, webFile?: any): Promise<string> {
  if (webFile && typeof webFile.text === 'function') {
    return await webFile.text();
  }

  if (Platform.OS === 'web') {
    const res = await fetch(uri);
    return await res.text();
  }

  // Native (Android / iOS): Use File from expo-file-system
  try {
    const file = new File(uri);
    return await file.text();
  } catch (fsErr) {
    // Fallback to fetch in case of unusual URI schemes
    const res = await fetch(uri);
    return await res.text();
  }
}


/**
 * Exports a ZenithBackupPayload to a .json file.
 * - Web: triggers browser download of `zenith_backup_YYYY-MM-DD.json`.
 * - Native: writes to app cache directory and invokes the OS share sheet.
 */
export async function exportBackupFile(payload: ZenithBackupPayload): Promise<void> {
  const dateStr = (payload.exported_at || new Date().toISOString()).split('T')[0];
  const filename = `zenith_backup_${dateStr}.json`;
  const jsonString = JSON.stringify(payload, null, 2);

  if (Platform.OS === 'web') {
    if (typeof document !== 'undefined') {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    return;
  }

  // Native (Android / iOS)
  try {
    const file = new File(Paths.cache, filename);
    file.create({ overwrite: true });
    file.write(jsonString);

    const isAvailable = await Sharing.isAvailableAsync().catch(() => false);
    if (isAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Zenith Backup',
        UTI: 'public.json',
      });
    } else {
      await Share.share({
        title: filename,
        message: jsonString,
      });
    }
  } catch (err) {
    console.warn('[exportBackupFile] Native file share failed, falling back to Share.share', err);
    await Share.share({
      title: filename,
      message: jsonString,
    });
  }
}


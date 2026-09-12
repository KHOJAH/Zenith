import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  createBackupPayload,
  validateBackupPayload,
  deduplicateMergeData,
  exportBackupFile,
  readBackupFile,
} from '../src/utils/backup.ts';


describe('Data Backup & Restore Suite', () => {
  const sampleTransactions = [
    {
      id: 'tx_1',
      amount: 42.5,
      type: 'expense',
      category: 'Food & Dining',
      merchant: 'Blue Cafe',
      note: 'Coffee and brunch',
      date: '2026-09-10T10:00:00.000Z',
      payment_method: 'Card',
      currency: 'USD',
      created_at: '2026-09-10T10:05:00.000Z',
    },
    {
      id: 'tx_2',
      amount: 3200,
      type: 'income',
      category: 'Income',
      merchant: 'Acme Corp',
      note: 'Salary payment',
      date: '2026-09-01T09:00:00.000Z',
      payment_method: 'Bank Transfer',
      currency: 'USD',
      created_at: '2026-09-01T09:00:00.000Z',
    },
  ];

  const sampleCategories = [
    {
      category: 'Food & Dining',
      icon: 'coffee',
      subtitle: 'Groceries, cafes, restaurants',
    },
    {
      category: 'Housing & Utilities',
      icon: 'home',
      subtitle: 'Rent, water, electricity',
    },
  ];

  const sampleRecurringBills = [
    {
      id: 'bill_1',
      name: 'Internet Fiber',
      amount: 60,
      category: 'Housing & Utilities',
      currency: 'USD',
      payment_method: 'Card',
      frequency: 'monthly',
      due_day: 15,
      icon: 'wifi',
      is_active: true,
      created_at: '2026-01-01T00:00:00.000Z',
    },
  ];

  const sampleSettings = {
    currency: 'USD',
    salary_day: 27,
    is_balance_hidden: false,
  };

  describe('createBackupPayload', () => {
    test('serializes complete ledger, categories, recurring bills, and settings with version 1', () => {
      const payload = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      assert.equal(payload.version, 1);
      assert.equal(payload.app, 'Zenith');
      assert.ok(payload.exported_at);
      assert.equal(typeof payload.exported_at, 'string');

      assert.deepEqual(payload.metadata, {
        transaction_count: 2,
        category_count: 2,
        recurring_bills_count: 1,
        currency: 'USD',
        salary_day: 27,
      });

      assert.equal(payload.data.transactions.length, 2);
      assert.equal(payload.data.categories.length, 2);
      assert.equal(payload.data.recurring_bills.length, 1);
      assert.equal(payload.data.settings.currency, 'USD');
      assert.equal(payload.data.settings.salary_day, 27);
      assert.equal(payload.data.settings.is_balance_hidden, false);
    });

    test('serializes empty state safely with zero counts', () => {
      const payload = createBackupPayload({
        transactions: [],
        categories: [],
        recurring_bills: [],
        settings: { currency: 'EUR', salary_day: 1, is_balance_hidden: true },
      });

      assert.equal(payload.version, 1);
      assert.equal(payload.app, 'Zenith');
      assert.equal(payload.metadata.transaction_count, 0);
      assert.equal(payload.metadata.category_count, 0);
      assert.equal(payload.metadata.recurring_bills_count, 0);
      assert.equal(payload.metadata.currency, 'EUR');
      assert.equal(payload.data.settings.is_balance_hidden, true);
    });
  });

  describe('validateBackupPayload', () => {
    test('successfully validates a valid payload object', () => {
      const payload = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      const res = validateBackupPayload(payload);
      assert.equal(res.valid, true);
      assert.ok(res.payload);
      assert.equal(res.payload.app, 'Zenith');
      assert.equal(res.payload.data.transactions.length, 2);
    });

    test('successfully validates a valid JSON string', () => {
      const payload = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      const jsonStr = JSON.stringify(payload);
      const res = validateBackupPayload(jsonStr);
      assert.equal(res.valid, true);
      assert.ok(res.payload);
      assert.equal(res.payload.version, 1);
    });

    test('rejects corrupt or malformed JSON strings', () => {
      const res1 = validateBackupPayload('{ corrupt: true, ');
      assert.equal(res1.valid, false);
      assert.match(res1.error, /Invalid JSON format/i);

      const res2 = validateBackupPayload('');
      assert.equal(res2.valid, false);
      assert.match(res2.error, /Empty backup payload/i);

      const res3 = validateBackupPayload('   ');
      assert.equal(res3.valid, false);
    });

    test('rejects non-object roots (null, primitives, arrays)', () => {
      assert.equal(validateBackupPayload(null).valid, false);
      assert.equal(validateBackupPayload(undefined).valid, false);
      assert.equal(validateBackupPayload(12345).valid, false);
      assert.equal(validateBackupPayload('hello').valid, false);
      assert.equal(validateBackupPayload([]).valid, false);
    });

    test('rejects payload if app identifier is not "Zenith"', () => {
      const base = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      const wrongApp = { ...base, app: 'OtherApp' };
      const res = validateBackupPayload(wrongApp);
      assert.equal(res.valid, false);
      assert.match(res.error, /Invalid application identifier/i);
    });

    test('rejects unsupported or missing version', () => {
      const base = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      const wrongVersion = { ...base, version: 2 };
      const res = validateBackupPayload(wrongVersion);
      assert.equal(res.valid, false);
      assert.match(res.error, /Unsupported backup version/i);

      const missingVersion = { ...base };
      delete missingVersion.version;
      const res2 = validateBackupPayload(missingVersion);
      assert.equal(res2.valid, false);
    });

    test('rejects missing or malformed exported_at', () => {
      const base = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      const invalidDate = { ...base, exported_at: '' };
      assert.equal(validateBackupPayload(invalidDate).valid, false);

      const missingDate = { ...base };
      delete missingDate.exported_at;
      assert.equal(validateBackupPayload(missingDate).valid, false);
    });

    test('rejects missing or invalid metadata', () => {
      const base = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      const invalidMeta = { ...base, metadata: { transaction_count: '2' } };
      assert.equal(validateBackupPayload(invalidMeta).valid, false);

      const missingMeta = { ...base };
      delete missingMeta.metadata;
      assert.equal(validateBackupPayload(missingMeta).valid, false);
    });

    test('rejects malformed transaction records', () => {
      const base = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      // Invalid amount
      const badAmount = JSON.parse(JSON.stringify(base));
      badAmount.data.transactions[0].amount = 'invalid';
      assert.equal(validateBackupPayload(badAmount).valid, false);

      // Invalid type
      const badType = JSON.parse(JSON.stringify(base));
      badType.data.transactions[0].type = 'transfer';
      assert.equal(validateBackupPayload(badType).valid, false);

      // Missing category
      const badCategory = JSON.parse(JSON.stringify(base));
      badCategory.data.transactions[0].category = '';
      assert.equal(validateBackupPayload(badCategory).valid, false);
    });

    test('rejects malformed category records', () => {
      const base = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      const badCat = JSON.parse(JSON.stringify(base));
      badCat.data.categories[0].category = '';
      assert.equal(validateBackupPayload(badCat).valid, false);

      const badIcon = JSON.parse(JSON.stringify(base));
      badIcon.data.categories[0].icon = '';
      assert.equal(validateBackupPayload(badIcon).valid, false);
    });

    test('rejects malformed recurring bill records', () => {
      const base = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      // Due day out of bounds (> 31)
      const badDueDay = JSON.parse(JSON.stringify(base));
      badDueDay.data.recurring_bills[0].due_day = 32;
      assert.equal(validateBackupPayload(badDueDay).valid, false);

      // Invalid frequency
      const badFreq = JSON.parse(JSON.stringify(base));
      badFreq.data.recurring_bills[0].frequency = 'weekly';
      assert.equal(validateBackupPayload(badFreq).valid, false);

      // Yearly frequency without valid due_month
      const badYearly = JSON.parse(JSON.stringify(base));
      badYearly.data.recurring_bills[0].frequency = 'yearly';
      badYearly.data.recurring_bills[0].due_month = 13;
      assert.equal(validateBackupPayload(badYearly).valid, false);

      const badYearlyMissing = JSON.parse(JSON.stringify(base));
      badYearlyMissing.data.recurring_bills[0].frequency = 'yearly';
      delete badYearlyMissing.data.recurring_bills[0].due_month;
      assert.equal(validateBackupPayload(badYearlyMissing).valid, false);

      // Negative amount
      const negativeBill = JSON.parse(JSON.stringify(base));
      negativeBill.data.recurring_bills[0].amount = -20;
      assert.equal(validateBackupPayload(negativeBill).valid, false);
    });

    test('rejects negative transaction amounts and invalid dates', () => {
      const base = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      const negTx = JSON.parse(JSON.stringify(base));
      negTx.data.transactions[0].amount = -5;
      assert.equal(validateBackupPayload(negTx).valid, false);

      const invalidDateTx = JSON.parse(JSON.stringify(base));
      invalidDateTx.data.transactions[0].date = 'not-a-valid-date';
      assert.equal(validateBackupPayload(invalidDateTx).valid, false);

      const invalidCreatedAtTx = JSON.parse(JSON.stringify(base));
      invalidCreatedAtTx.data.transactions[0].created_at = 'not-a-valid-date';
      assert.equal(validateBackupPayload(invalidCreatedAtTx).valid, false);
    });

    test('rejects mismatched metadata counts versus actual array lengths', () => {
      const base = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      // Mismatched transaction_count
      const badTxCount = JSON.parse(JSON.stringify(base));
      badTxCount.metadata.transaction_count = 999;
      const res1 = validateBackupPayload(badTxCount);
      assert.equal(res1.valid, false);
      assert.match(res1.error, /does not match transactions count/i);

      // Mismatched category_count
      const badCatCount = JSON.parse(JSON.stringify(base));
      badCatCount.metadata.category_count = 999;
      const res2 = validateBackupPayload(badCatCount);
      assert.equal(res2.valid, false);
      assert.match(res2.error, /does not match categories count/i);

      // Mismatched recurring_bills_count
      const badBillCount = JSON.parse(JSON.stringify(base));
      badBillCount.metadata.recurring_bills_count = 999;
      const res3 = validateBackupPayload(badBillCount);
      assert.equal(res3.valid, false);
      assert.match(res3.error, /does not match recurring bills count/i);
    });

    test('rejects malformed settings', () => {
      const base = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      const badSettings = JSON.parse(JSON.stringify(base));
      badSettings.data.settings.salary_day = 45;
      assert.equal(validateBackupPayload(badSettings).valid, false);
    });
  });

  describe('deduplicateMergeData', () => {
    test('skips exact duplicate transactions and generates new IDs for unique ones', () => {
      const existing = [sampleTransactions[0]]; // tx_1
      const incoming = [
        sampleTransactions[0], // Duplicate of tx_1
        sampleTransactions[1], // New: tx_2
        {
          id: 'tx_different_id_same_data',
          amount: 42.5,
          type: 'expense',
          category: 'Food & Dining',
          merchant: 'Blue Cafe',
          note: 'Coffee and brunch',
          date: '2026-09-10T10:00:00.000Z',
          created_at: '2026-09-10T10:05:00.000Z',
        }, // Same content signature as tx_1, should be skipped
      ];

      const result = deduplicateMergeData({
        existingTransactions: existing,
        incomingTransactions: incoming,
        existingRecurringBills: [],
        incomingRecurringBills: [],
        existingCategories: [],
        incomingCategories: [],
      });

      assert.equal(result.stats.transactionsAdded, 1);
      assert.equal(result.stats.transactionsSkipped, 2);
      assert.equal(result.transactionsToAdd.length, 1);

      // Newly added transaction gets a fresh unique ID
      assert.notEqual(result.transactionsToAdd[0].id, 'tx_2');
      assert.ok(result.transactionsToAdd[0].id.startsWith('tx_'));
      assert.equal(result.transactionsToAdd[0].amount, 3200);
      assert.equal(result.transactionsToAdd[0].category, 'Income');
    });

    test('preserves distinct transactions that occur on the same day with different timestamps', () => {
      const coffeeMorning = {
        id: 'tx_coffee_am',
        amount: 4.5,
        type: 'expense',
        category: 'Food & Dining',
        merchant: 'Starbucks',
        note: 'Morning latte',
        date: '2026-09-10T08:30:00.000Z',
        created_at: '2026-09-10T08:30:00.000Z',
      };
      const coffeeAfternoon = {
        id: 'tx_coffee_pm',
        amount: 4.5,
        type: 'expense',
        category: 'Food & Dining',
        merchant: 'Starbucks',
        note: 'Afternoon cold brew',
        date: '2026-09-10T14:45:00.000Z',
        created_at: '2026-09-10T14:45:00.000Z',
      };

      const result = deduplicateMergeData({
        existingTransactions: [],
        incomingTransactions: [coffeeMorning, coffeeAfternoon],
        existingRecurringBills: [],
        incomingRecurringBills: [],
        existingCategories: [],
        incomingCategories: [],
      });

      assert.equal(result.stats.transactionsAdded, 2);
      assert.equal(result.stats.transactionsSkipped, 0);
      assert.equal(result.transactionsToAdd.length, 2);
    });

    test('differentiates same-day transactions in different currencies', () => {
      const usdTx = {
        id: 'tx_usd',
        amount: 50,
        currency: 'USD',
        type: 'expense',
        category: 'Shopping & Tech',
        merchant: 'Amazon',
        note: 'Supplies',
        date: '2026-09-10T12:00:00.000Z',
        created_at: '2026-09-10T12:00:00.000Z',
      };
      const eurTx = {
        id: 'tx_eur',
        amount: 50,
        currency: 'EUR',
        type: 'expense',
        category: 'Shopping & Tech',
        merchant: 'Amazon',
        note: 'Supplies',
        date: '2026-09-10T12:00:00.000Z',
        created_at: '2026-09-10T12:00:00.000Z',
      };

      const result = deduplicateMergeData({
        existingTransactions: [usdTx],
        incomingTransactions: [usdTx, eurTx],
        existingRecurringBills: [],
        incomingRecurringBills: [],
        existingCategories: [],
        incomingCategories: [],
      });

      assert.equal(result.stats.transactionsAdded, 1);
      assert.equal(result.stats.transactionsSkipped, 1);
      assert.equal(result.transactionsToAdd[0].currency, 'EUR');
    });

    test('skips duplicate categories case-insensitively and appends new ones', () => {
      const existing = [{ category: 'Food & Dining', icon: 'coffee' }];
      const incoming = [
        { category: 'food & dining', icon: 'coffee' }, // case duplicate
        { category: 'Travel', icon: 'plane' },          // new category
      ];

      const result = deduplicateMergeData({
        existingTransactions: [],
        incomingTransactions: [],
        existingRecurringBills: [],
        incomingRecurringBills: [],
        existingCategories: existing,
        incomingCategories: incoming,
      });

      assert.equal(result.stats.categoriesAdded, 1);
      assert.equal(result.stats.categoriesSkipped, 1);
      assert.equal(result.categoriesToAdd.length, 1);
      assert.equal(result.categoriesToAdd[0].category, 'Travel');
    });

    test('skips duplicate recurring bills and generates new IDs for unique ones', () => {
      const existing = [sampleRecurringBills[0]]; // bill_1
      const incoming = [
        sampleRecurringBills[0], // Duplicate ID and signature
        {
          id: 'bill_new_gym',
          name: 'Gym',
          amount: 45,
          category: 'Health & Wellness',
          currency: 'USD',
          payment_method: 'Card',
          frequency: 'monthly',
          due_day: 10,
          icon: 'activity',
          is_active: true,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ];

      const result = deduplicateMergeData({
        existingTransactions: [],
        incomingTransactions: [],
        existingRecurringBills: existing,
        incomingRecurringBills: incoming,
        existingCategories: [],
        incomingCategories: [],
      });

      assert.equal(result.stats.recurringBillsAdded, 1);
      assert.equal(result.stats.recurringBillsSkipped, 1);
      assert.equal(result.recurringBillsToAdd.length, 1);
      assert.equal(result.recurringBillsToAdd[0].name, 'Gym');
      assert.notEqual(result.recurringBillsToAdd[0].id, 'bill_new_gym');
    });

    test('handles empty existing data cleanly', () => {
      const result = deduplicateMergeData({
        existingTransactions: [],
        incomingTransactions: sampleTransactions,
        existingRecurringBills: [],
        incomingRecurringBills: sampleRecurringBills,
        existingCategories: [],
        incomingCategories: sampleCategories,
      });

      assert.equal(result.stats.transactionsAdded, 2);
      assert.equal(result.stats.transactionsSkipped, 0);
      assert.equal(result.stats.categoriesAdded, 2);
      assert.equal(result.stats.categoriesSkipped, 0);
      assert.equal(result.stats.recurringBillsAdded, 1);
      assert.equal(result.stats.recurringBillsSkipped, 0);
    });
  });

  describe('readBackupFile & exportBackupFile', () => {
    test('executes exportBackupFile without throwing', async () => {
      const payload = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      await assert.doesNotReject(async () => {
        await exportBackupFile(payload);
      });
    });

    test('readBackupFile reads from web File mock or native URI', async () => {
      const payload = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });
      const jsonStr = JSON.stringify(payload);

      // Web file mock
      const webFileMock = {
        text: async () => jsonStr,
      };
      const webContent = await readBackupFile('mock://uri', webFileMock);
      assert.equal(webContent, jsonStr);

      // Native File mock
      const { File } = await import('../scripts/mocks/expo-file-system.mjs');
      const testFile = new File('mock://test.json');
      testFile.write(jsonStr);

      const nativeContent = await readBackupFile(testFile.uri);
      assert.equal(nativeContent, jsonStr);
    });
  });

  describe('restoreDatabaseFromBackup', () => {
    test('executes overwrite mode cleanly on database', async () => {
      const db = await import('../src/db/database.ts');
      const payload = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      await assert.doesNotReject(async () => {
        await db.restoreDatabaseFromBackup(payload, 'overwrite');
      });
    });

    test('executes overwrite mode with 0 transactions without error', async () => {
      const db = await import('../src/db/database.ts');
      const payload = createBackupPayload({
        transactions: [],
        categories: sampleCategories,
        recurring_bills: [],
        settings: sampleSettings,
      });

      await assert.doesNotReject(async () => {
        await db.restoreDatabaseFromBackup(payload, 'overwrite');
      });
    });

    test('executes merge mode cleanly on database', async () => {
      const db = await import('../src/db/database.ts');
      const payload = createBackupPayload({
        transactions: sampleTransactions,
        categories: sampleCategories,
        recurring_bills: sampleRecurringBills,
        settings: sampleSettings,
      });

      await assert.doesNotReject(async () => {
        await db.restoreDatabaseFromBackup(payload, 'merge');
      });
    });
  });
});


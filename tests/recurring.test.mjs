import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  getBillDueDateInInterval,
  evaluateBillStatus,
  calculateRecurringSummaries,
} from '../src/utils/recurring.ts';

describe('Recurring Bills Business Logic Suite', () => {
  const sampleMonthlyBill1 = {
    id: 'b1',
    name: 'Internet',
    amount: 50,
    category: 'Housing & Utilities',
    currency: 'USD',
    payment_method: 'Card',
    frequency: 'monthly',
    due_day: 5,
    icon: 'wifi',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  };

  const sampleMonthlyBill2 = {
    id: 'b2',
    name: 'Rent',
    amount: 1200,
    category: 'Housing & Utilities',
    currency: 'USD',
    payment_method: 'Card',
    frequency: 'monthly',
    due_day: 28,
    icon: 'home',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  };

  const sampleYearlyBill = {
    id: 'b3',
    name: 'Car Insurance',
    amount: 600,
    category: 'Transport',
    currency: 'USD',
    payment_method: 'Card',
    frequency: 'yearly',
    due_day: 15,
    due_month: 9,
    icon: 'shield',
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
  };

  describe('Cycle Due Date Calculation', () => {
    test('Salary cycle (27 Aug - 26 Sep): due day 28 falls in Aug, due day 5 falls in Sep', () => {
      const start = '2026-08-27T00:00:00.000Z';
      const end = '2026-09-26T23:59:59.999Z';

      const dueB2 = getBillDueDateInInterval(sampleMonthlyBill2, start, end);
      assert.ok(dueB2);
      assert.equal(dueB2.getFullYear(), 2026);
      assert.equal(dueB2.getMonth(), 7); // Aug (0-indexed 7)
      assert.equal(dueB2.getDate(), 28);

      const dueB1 = getBillDueDateInInterval(sampleMonthlyBill1, start, end);
      assert.ok(dueB1);
      assert.equal(dueB1.getFullYear(), 2026);
      assert.equal(dueB1.getMonth(), 8); // Sep (0-indexed 8)
      assert.equal(dueB1.getDate(), 5);
    });

    test('Variable month lengths: 31st in a 30-day month (Sep) clamps to 30', () => {
      const bill31 = { ...sampleMonthlyBill1, due_day: 31 };
      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';

      const due = getBillDueDateInInterval(bill31, start, end);
      assert.ok(due);
      assert.equal(due.getMonth(), 8); // Sep
      assert.equal(due.getDate(), 30, 'Should clamp 31 to 30 for September');
    });

    test('Variable month lengths: 31st in Feb 2026 clamps to 28', () => {
      const bill31 = { ...sampleMonthlyBill1, due_day: 31 };
      const start = '2026-02-01T00:00:00.000Z';
      const end = '2026-02-28T23:59:59.999Z';

      const due = getBillDueDateInInterval(bill31, start, end);
      assert.ok(due);
      assert.equal(due.getMonth(), 1); // Feb
      assert.equal(due.getDate(), 28, 'Should clamp 31 to 28 for Feb 2026');
    });

    test('Yearly bill: matches when due_month and due_day fall within cycle, null otherwise', () => {
      const sepStart = '2026-09-01T00:00:00.000Z';
      const sepEnd = '2026-09-30T23:59:59.999Z';
      const octStart = '2026-10-01T00:00:00.000Z';
      const octEnd = '2026-10-31T23:59:59.999Z';

      const dueInSep = getBillDueDateInInterval(sampleYearlyBill, sepStart, sepEnd);
      assert.ok(dueInSep);
      assert.equal(dueInSep.getMonth(), 8); // Sep
      assert.equal(dueInSep.getDate(), 15);

      const dueInOct = getBillDueDateInInterval(sampleYearlyBill, octStart, octEnd);
      assert.equal(dueInOct, null, 'Yearly bill due in Sep should not match Oct interval');
    });

    test('Year boundary salary cycle (27 Dec 2025 - 26 Jan 2026)', () => {
      const start = '2025-12-27T00:00:00.000Z';
      const end = '2026-01-26T23:59:59.999Z';

      const billDec = { ...sampleMonthlyBill1, due_day: 30 };
      const dueDec = getBillDueDateInInterval(billDec, start, end);
      assert.ok(dueDec);
      assert.equal(dueDec.getFullYear(), 2025);
      assert.equal(dueDec.getMonth(), 11);
      assert.equal(dueDec.getDate(), 30);

      const billJan = { ...sampleMonthlyBill1, due_day: 10 };
      const dueJan = getBillDueDateInInterval(billJan, start, end);
      assert.ok(dueJan);
      assert.equal(dueJan.getFullYear(), 2026);
      assert.equal(dueJan.getMonth(), 0);
      assert.equal(dueJan.getDate(), 10);
    });
  });

  describe('Cycle Status Evaluation', () => {
    const start = '2026-09-01T00:00:00.000Z';
    const end = '2026-09-30T23:59:59.999Z';
    const bill = { ...sampleMonthlyBill1, name: 'Spotify', due_day: 15 };

    test('Marks as PAID when expense has note "Recurring • Spotify"', () => {
      const tx = {
        id: 't1',
        amount: 50,
        type: 'expense',
        category: 'Entertainment',
        merchant: 'Spotify',
        note: 'Recurring • Spotify',
        date: '2026-09-10T10:00:00.000Z',
        currency: 'USD',
        created_at: '2026-09-10T10:00:00.000Z',
      };

      const res = evaluateBillStatus(bill, [tx], start, end, new Date(2026, 8, 12));
      assert.ok(res);
      assert.equal(res.status, 'PAID');
      assert.equal(res.paidTransaction?.id, 't1');
    });

    test('Marks as PAID when expense has matching merchant name', () => {
      const tx = {
        id: 't2',
        amount: 50,
        type: 'expense',
        category: 'Entertainment',
        merchant: 'spotify',
        note: '',
        date: '2026-09-05T10:00:00.000Z',
        currency: 'USD',
        created_at: '2026-09-05T10:00:00.000Z',
      };

      const res = evaluateBillStatus(bill, [tx], start, end, new Date(2026, 8, 12));
      assert.ok(res);
      assert.equal(res.status, 'PAID');
    });

    test('Does NOT mark as PAID if matching transaction is outside cycle', () => {
      const txOld = {
        id: 't3',
        amount: 50,
        type: 'expense',
        category: 'Entertainment',
        merchant: 'Spotify',
        note: 'Recurring • Spotify',
        date: '2026-08-15T10:00:00.000Z',
        currency: 'USD',
        created_at: '2026-08-15T10:00:00.000Z',
      };

      const res = evaluateBillStatus(bill, [txOld], start, end, new Date(2026, 8, 12));
      assert.ok(res);
      assert.equal(res.status, 'UPCOMING');
    });

    test('Does NOT mark as PAID if matching transaction is income', () => {
      const txIncome = {
        id: 't4',
        amount: 50,
        type: 'income',
        category: 'Entertainment',
        merchant: 'Spotify',
        note: 'Recurring • Spotify',
        date: '2026-09-10T10:00:00.000Z',
        currency: 'USD',
        created_at: '2026-09-10T10:00:00.000Z',
      };

      const res = evaluateBillStatus(bill, [txIncome], start, end, new Date(2026, 8, 12));
      assert.ok(res);
      assert.equal(res.status, 'UPCOMING');
    });

    test('Evaluates DUE_TODAY when referenceDate matches dueDate', () => {
      const res = evaluateBillStatus(bill, [], start, end, new Date(2026, 8, 15, 8, 0, 0));
      assert.ok(res);
      assert.equal(res.status, 'DUE_TODAY');
      assert.equal(res.daysUntil, 0);
    });

    test('Evaluates OVERDUE when referenceDate is past dueDate', () => {
      const res = evaluateBillStatus(bill, [], start, end, new Date(2026, 8, 18));
      assert.ok(res);
      assert.equal(res.status, 'OVERDUE');
      assert.ok(res.daysUntil < 0);
    });

    test('Evaluates UPCOMING when referenceDate is before dueDate', () => {
      const res = evaluateBillStatus(bill, [], start, end, new Date(2026, 8, 10));
      assert.ok(res);
      assert.equal(res.status, 'UPCOMING');
      assert.equal(res.daysUntil, 5);
    });
  });

  describe('Summaries and Metrics Calculation', () => {
    test('Calculates totalMonthlyCommitment, cyclePaid, cycleRemaining and sorts statuses by urgency', () => {
      const bills = [
        sampleMonthlyBill1, // 50 USD, due day 5
        sampleMonthlyBill2, // 1200 USD, due day 28
        sampleYearlyBill,   // 600 USD / yr = 50 USD/mo, due Sep 15
        { ...sampleMonthlyBill1, id: 'b_inactive', amount: 999, is_active: false },
      ];

      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';
      const refDate = new Date(2026, 8, 10); // Sep 10, 2026

      // Transaction paying bill1 (Internet, due Sep 5)
      const txs = [
        {
          id: 'tx_paid_b1',
          amount: 50,
          type: 'expense',
          category: 'Housing & Utilities',
          merchant: 'Internet',
          note: 'Recurring • Internet',
          date: '2026-09-05T12:00:00.000Z',
          currency: 'USD',
          created_at: '2026-09-05T12:00:00.000Z',
        },
      ];

      const { statuses, summary } = calculateRecurringSummaries(
        bills,
        txs,
        start,
        end,
        'USD',
        refDate
      );

      // Inactive bill must not be included
      assert.equal(statuses.length, 3);
      assert.ok(!statuses.some((s) => s.bill.id === 'b_inactive'));

      // Total monthly commitment: 50 + 1200 + (600 / 12 = 50) = 1300
      assert.equal(summary.totalMonthlyCommitment, 1300);

      // Cycle Paid: 50 (bill1 paid)
      assert.equal(summary.cyclePaid, 50);

      // Cycle Remaining: 1200 (bill2) + 600 (sampleYearlyBill full payment due this month) = 1800
      assert.equal(summary.cycleRemaining, 1800);
      assert.equal(summary.cycleTotalCommitted, 1850);

      // Status urgency order: UPCOMING bills should come before PAID bills
      const paidStatus = statuses.find((s) => s.bill.id === 'b1');
      assert.equal(paidStatus?.status, 'PAID');

      // Check order: unpaid items first, paid items last
      const lastStatus = statuses[statuses.length - 1];
      assert.equal(lastStatus.status, 'PAID');
    });

    test('Currency conversion in summaries: converts JOD/EUR to target USD', () => {
      const bills = [
        {
          id: 'b_jod',
          name: 'Gym',
          amount: 70.9, // 70.9 JOD = ~100 USD (at rate 0.709)
          category: 'Health & Wellness',
          currency: 'JOD',
          payment_method: 'Card',
          frequency: 'monthly',
          due_day: 10,
          icon: 'activity',
          is_active: true,
          created_at: '2026-01-01T00:00:00.000Z',
        },
      ];

      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';

      const { summary } = calculateRecurringSummaries(bills, [], start, end, 'USD');
      // 70.9 / 0.709 = 100 USD
      assert.equal(summary.totalMonthlyCommitment, 100);
      assert.equal(summary.cycleRemaining, 100);
      assert.equal(summary.cyclePaid, 0);
    });
  });

  describe('Edge Cases & Boundary Robustness', () => {
    test('Leap year: Feb 2024 clamps day 31 to 29', () => {
      const bill = { ...sampleMonthlyBill1, due_day: 31 };
      const start = '2024-02-01T00:00:00.000Z';
      const end = '2024-02-29T23:59:59.999Z';

      const due = getBillDueDateInInterval(bill, start, end);
      assert.ok(due);
      assert.equal(due.getMonth(), 1);
      assert.equal(due.getDate(), 29, '2024 was leap year, day 31 clamps to 29');
    });

    test('Out of bound due_day (e.g. 0 or 40) is safely clamped', () => {
      const billZero = { ...sampleMonthlyBill1, due_day: 0 };
      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';

      const dueZero = getBillDueDateInInterval(billZero, start, end);
      assert.ok(dueZero);
      assert.equal(dueZero.getDate(), 1, '0 clamps to 1');

      const bill40 = { ...sampleMonthlyBill1, due_day: 40 };
      const due40 = getBillDueDateInInterval(bill40, start, end);
      assert.ok(due40);
      assert.equal(due40.getDate(), 30, '40 clamps to days in month (30)');
    });

    test('Case-insensitivity and whitespace trim in note/merchant matching', () => {
      const bill = { ...sampleMonthlyBill1, name: 'Netflix', due_day: 15 };
      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';

      const txMixed = {
        id: 'tx_mixed',
        amount: 50,
        type: 'expense',
        category: 'Entertainment',
        merchant: '  NETFLIX  ',
        note: 'Recurring • NETFLIX',
        date: '2026-09-12T12:00:00.000Z',
        currency: 'USD',
        created_at: '2026-09-12T12:00:00.000Z',
      };

      const res = evaluateBillStatus(bill, [txMixed], start, end, new Date(2026, 8, 14));
      assert.ok(res);
      assert.equal(res.status, 'PAID');
    });

    test('Note matches bill name directly without "Recurring •" prefix', () => {
      const bill = { ...sampleMonthlyBill1, name: 'Gym Membership', due_day: 15 };
      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';

      const txDirect = {
        id: 'tx_direct',
        amount: 50,
        type: 'expense',
        category: 'Health & Wellness',
        merchant: 'Local Fitness',
        note: 'Gym Membership',
        date: '2026-09-10T12:00:00.000Z',
        currency: 'USD',
        created_at: '2026-09-10T12:00:00.000Z',
      };

      const res = evaluateBillStatus(bill, [txDirect], start, end, new Date(2026, 8, 14));
      assert.ok(res);
      assert.equal(res.status, 'PAID');
    });

    test('Empty recurring bills returns zero summaries cleanly', () => {
      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';

      const { statuses, summary } = calculateRecurringSummaries([], [], start, end, 'USD');
      assert.equal(statuses.length, 0);
      assert.equal(summary.totalMonthlyCommitment, 0);
      assert.equal(summary.cycleTotalCommitted, 0);
      assert.equal(summary.cyclePaid, 0);
      assert.equal(summary.cycleRemaining, 0);
    });

    test('Substring collision protection: "Recurring • Google One" does NOT mark "Google" as paid', () => {
      const billGoogle = { ...sampleMonthlyBill1, id: 'b_google', name: 'Google', due_day: 15 };
      const billGoogleOne = { ...sampleMonthlyBill1, id: 'b_google_one', name: 'Google One', due_day: 15 };
      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';

      const txGoogleOne = {
        id: 'tx_google_one',
        amount: 50,
        type: 'expense',
        category: 'Shopping & Tech',
        merchant: 'Google One',
        note: 'Recurring • Google One',
        date: '2026-09-10T12:00:00.000Z',
        currency: 'USD',
        created_at: '2026-09-10T12:00:00.000Z',
      };

      const resGoogle = evaluateBillStatus(billGoogle, [txGoogleOne], start, end, new Date(2026, 8, 12));
      assert.ok(resGoogle);
      assert.equal(resGoogle.status, 'UPCOMING', 'Google should not be marked as PAID when only Google One was paid');

      const resGoogleOne = evaluateBillStatus(billGoogleOne, [txGoogleOne], start, end, new Date(2026, 8, 12));
      assert.ok(resGoogleOne);
      assert.equal(resGoogleOne.status, 'PAID');
    });

    test('Parenthetical note descriptions: "Recurring • Spotify (Family Plan)" matches "Spotify"', () => {
      const billSpotify = { ...sampleMonthlyBill1, id: 'b_spotify', name: 'Spotify', due_day: 15 };
      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';

      const txSpotify = {
        id: 'tx_spotify_family',
        amount: 50,
        type: 'expense',
        category: 'Entertainment',
        merchant: 'Spotify',
        note: 'Recurring • Spotify (Family Plan)',
        date: '2026-09-10T12:00:00.000Z',
        currency: 'USD',
        created_at: '2026-09-10T12:00:00.000Z',
      };

      const res = evaluateBillStatus(billSpotify, [txSpotify], start, end, new Date(2026, 8, 12));
      assert.ok(res);
      assert.equal(res.status, 'PAID');
    });

    test('Duplicate bill names do not double-count a single transaction in cycle summaries', () => {
      const bill1 = { ...sampleMonthlyBill1, id: 'b_elec_1', name: 'Electricity', amount: 60, due_day: 5 };
      const bill2 = { ...sampleMonthlyBill1, id: 'b_elec_2', name: 'Electricity', amount: 60, due_day: 15 };
      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';

      const txSingle = {
        id: 'tx_elec_single',
        amount: 60,
        type: 'expense',
        category: 'Housing & Utilities',
        merchant: 'Electricity',
        note: 'Recurring • Electricity',
        date: '2026-09-04T12:00:00.000Z',
        currency: 'USD',
        created_at: '2026-09-04T12:00:00.000Z',
      };

      const { statuses, summary } = calculateRecurringSummaries(
        [bill1, bill2],
        [txSingle],
        start,
        end,
        'USD',
        new Date(2026, 8, 10)
      );

      assert.equal(statuses.length, 2);
      const paidBills = statuses.filter((s) => s.status === 'PAID');
      const unpaidBills = statuses.filter((s) => s.status !== 'PAID');

      assert.equal(paidBills.length, 1, 'Only 1 bill should be marked PAID with 1 transaction');
      assert.equal(unpaidBills.length, 1, 'The 2nd bill must remain unpaid');
      assert.equal(summary.cyclePaid, 60);
      assert.equal(summary.cycleRemaining, 60);
      assert.equal(summary.cycleTotalCommitted, 120);
    });

    test('Bill names with regex special characters match safely without errors', () => {
      const billSpecial = { ...sampleMonthlyBill1, id: 'b_special', name: 'C++ Course (Pro+)', due_day: 15 };
      const start = '2026-09-01T00:00:00.000Z';
      const end = '2026-09-30T23:59:59.999Z';

      const txSpecial = {
        id: 'tx_special',
        amount: 50,
        type: 'expense',
        category: 'Shopping & Tech',
        merchant: 'Online Academy',
        note: 'Recurring • C++ Course (Pro+)',
        date: '2026-09-10T12:00:00.000Z',
        currency: 'USD',
        created_at: '2026-09-10T12:00:00.000Z',
      };

      const res = evaluateBillStatus(billSpecial, [txSpecial], start, end, new Date(2026, 8, 12));
      assert.ok(res);
      assert.equal(res.status, 'PAID');
    });
  });
});


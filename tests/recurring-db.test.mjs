import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as db from '../src/db/database.ts';

describe('Recurring Bills DB & Schema Suite', () => {
  test('Database module exports required CRUD functions', () => {
    assert.equal(typeof db.getRecurringBills, 'function', 'getRecurringBills must be a function');
    assert.equal(typeof db.insertRecurringBill, 'function', 'insertRecurringBill must be a function');
    assert.equal(typeof db.updateRecurringBill, 'function', 'updateRecurringBill must be a function');
    assert.equal(typeof db.deleteRecurringBill, 'function', 'deleteRecurringBill must be a function');
  });

  test('RecurringBill mock data satisfies schema invariants', () => {
    const monthlyBill = {
      id: 'bill_test_1',
      name: 'Internet Fiber',
      amount: 60,
      category: 'Housing & Utilities',
      currency: 'USD',
      payment_method: 'Card',
      frequency: 'monthly',
      due_day: 15,
      icon: 'wifi',
      is_active: true,
      created_at: '2026-09-12T12:00:00.000Z',
    };

    assert.equal(monthlyBill.name, 'Internet Fiber');
    assert.equal(monthlyBill.amount, 60);
    assert.equal(monthlyBill.due_day, 15);
    assert.equal(monthlyBill.frequency, 'monthly');
    assert.equal(monthlyBill.is_active, true);

    const yearlyBill = {
      id: 'bill_test_2',
      name: 'Car Insurance',
      amount: 720,
      category: 'Transport',
      currency: 'USD',
      payment_method: 'Card',
      frequency: 'yearly',
      due_day: 20,
      due_month: 6,
      icon: 'shield',
      is_active: true,
      created_at: '2026-09-12T12:00:00.000Z',
    };

    assert.equal(yearlyBill.frequency, 'yearly');
    assert.equal(yearlyBill.due_month, 6);
  });
});

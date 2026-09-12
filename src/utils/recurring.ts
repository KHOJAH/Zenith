import type { RecurringBill, Transaction } from '@/db/schema';
import { convertCurrency } from '@/utils/currencies';

export type RecurringStatusType = 'PAID' | 'DUE_TODAY' | 'OVERDUE' | 'UPCOMING';

export interface RecurringBillStatus {
  bill: RecurringBill;
  dueDate: Date;
  status: RecurringStatusType;
  daysUntil: number;
  paidTransaction?: Transaction;
}

export interface RecurringCommitmentsSummary {
  totalMonthlyCommitment: number;
  cycleTotalCommitted: number;
  cyclePaid: number;
  cycleRemaining: number;
}

/**
 * Calculates the date a bill is due within a given date interval.
 * Returns null if the bill does not fall due within this interval.
 */
export function getBillDueDateInInterval(
  bill: RecurringBill,
  startDate: string,
  endDate: string,
  referenceDate: Date = new Date()
): Date | null {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const startYear = start.getFullYear();
  const startMonth = start.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();

  // Enumerate all { year, month } pairs covered by the interval
  const monthsToCheck: { year: number; month: number }[] = [];
  let y = startYear;
  let m = startMonth;
  while (y < endYear || (y === endYear && m <= endMonth)) {
    monthsToCheck.push({ year: y, month: m });
    m++;
    if (m > 11) {
      m = 0;
      y++;
    }
  }

  const matchingCandidates: Date[] = [];

  for (const { year, month } of monthsToCheck) {
    if (bill.frequency === 'yearly') {
      const targetMonth = (bill.due_month ? bill.due_month : 1) - 1;
      if (month !== targetMonth) continue;
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const effectiveDay = Math.min(Math.max(1, bill.due_day), daysInMonth);
    const candidate = new Date(year, month, effectiveDay, 12, 0, 0, 0);

    if (candidate.getTime() >= start.getTime() && candidate.getTime() <= end.getTime()) {
      matchingCandidates.push(candidate);
    }
  }

  if (matchingCandidates.length === 0) return null;
  if (matchingCandidates.length === 1) return matchingCandidates[0];

  // If multiple candidates exist (e.g. wide custom interval), pick closest to reference date
  const refTime = referenceDate.getTime();
  matchingCandidates.sort((a, b) => Math.abs(a.getTime() - refTime) - Math.abs(b.getTime() - refTime));
  return matchingCandidates[0];
}

/**
 * Evaluates payment status and urgency for a recurring bill within a cycle.
 */
export function evaluateBillStatus(
  bill: RecurringBill,
  transactions: Transaction[],
  startDate: string,
  endDate: string,
  referenceDate: Date = new Date()
): RecurringBillStatus | null {
  const dueDate = getBillDueDateInInterval(bill, startDate, endDate, referenceDate);
  if (!dueDate) return null;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const startMs = start.getTime();
  const endMs = end.getTime();

  const billNameLower = bill.name.trim().toLowerCase();
  const recurringPrefix = `recurring • ${billNameLower}`;

  // Find matching expense transaction within this interval
  const matchingTx = transactions.find((tx) => {
    if (tx.type !== 'expense') return false;
    const txTime = new Date(tx.date).getTime();
    if (txTime < startMs || txTime > endMs) return false;

    const noteLower = (tx.note || '').trim().toLowerCase();
    const merchantLower = (tx.merchant || '').trim().toLowerCase();

    return (
      noteLower.includes(recurringPrefix) ||
      noteLower === billNameLower ||
      merchantLower === billNameLower
    );
  });

  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - ref.getTime();
  const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

  let status: RecurringStatusType;
  if (matchingTx) {
    status = 'PAID';
  } else if (daysUntil < 0) {
    status = 'OVERDUE';
  } else if (daysUntil === 0) {
    status = 'DUE_TODAY';
  } else {
    status = 'UPCOMING';
  }

  return {
    bill,
    dueDate,
    status,
    daysUntil,
    paidTransaction: matchingTx,
  };
}

/**
 * Calculates recurring bill statuses and aggregate summary metrics for a cycle.
 */
export function calculateRecurringSummaries(
  bills: RecurringBill[],
  transactions: Transaction[],
  startDate: string,
  endDate: string,
  targetCurrency: string = 'USD',
  referenceDate: Date = new Date()
): { statuses: RecurringBillStatus[]; summary: RecurringCommitmentsSummary } {
  const activeBills = bills.filter((b) => b.is_active !== false);

  let totalMonthlyCommitment = 0;
  for (const bill of activeBills) {
    const base = bill.frequency === 'yearly' ? bill.amount / 12 : bill.amount;
    totalMonthlyCommitment += convertCurrency(base, bill.currency || 'USD', targetCurrency);
  }

  const statuses: RecurringBillStatus[] = [];
  for (const bill of activeBills) {
    const s = evaluateBillStatus(bill, transactions, startDate, endDate, referenceDate);
    if (s) {
      statuses.push(s);
    }
  }

  // Sort by urgency: OVERDUE (0), DUE_TODAY (1), UPCOMING (2), PAID (3)
  const urgencyOrder: Record<RecurringStatusType, number> = {
    OVERDUE: 0,
    DUE_TODAY: 1,
    UPCOMING: 2,
    PAID: 3,
  };

  statuses.sort((a, b) => {
    const rankDiff = urgencyOrder[a.status] - urgencyOrder[b.status];
    if (rankDiff !== 0) return rankDiff;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  let cyclePaid = 0;
  let cycleRemaining = 0;

  for (const st of statuses) {
    const converted = convertCurrency(st.bill.amount, st.bill.currency || 'USD', targetCurrency);
    if (st.status === 'PAID') {
      cyclePaid += converted;
    } else {
      cycleRemaining += converted;
    }
  }

  return {
    statuses,
    summary: {
      totalMonthlyCommitment: Math.round(totalMonthlyCommitment * 100) / 100,
      cycleTotalCommitted: Math.round((cyclePaid + cycleRemaining) * 100) / 100,
      cyclePaid: Math.round(cyclePaid * 100) / 100,
      cycleRemaining: Math.round(cycleRemaining * 100) / 100,
    },
  };
}

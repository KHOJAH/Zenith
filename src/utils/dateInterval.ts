import type { DateInterval } from '@/db/schema';
import { getSalaryCycleDates } from './salary';

export const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Returns the current (present) active period for an interval preset.
 */
export function getCurrentInterval(
  id: DateInterval['id'],
  salaryDay: number = 27
): DateInterval {
  const now = new Date();
  const boundedDay = Math.max(1, Math.min(31, Math.round(salaryDay || 27)));

  switch (id) {
    case 'salary_cycle': {
      const cycle = getSalaryCycleDates(boundedDay, now);
      return {
        id: 'salary_cycle',
        label: formatSalaryCycleLabel(cycle.start, cycle.endDate),
        startDate: cycle.start.toISOString(),
        endDate: cycle.endDate.toISOString(),
      };
    }
    case 'current_month': {
      const year = now.getFullYear();
      const month = now.getMonth();
      const start = new Date(year, month, 1, 0, 0, 0, 0);
      const lastDay = new Date(year, month + 1, 0).getDate();
      const end = new Date(year, month, lastDay, 23, 59, 59, 999);
      return {
        id: 'current_month',
        label: now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }
    case 'last_30_days': {
      const start = new Date(now);
      start.setDate(now.getDate() - 29);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return {
        id: 'last_30_days',
        label: 'Last 30 Days',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }
    case 'last_7_days': {
      const start = new Date(now);
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return {
        id: 'last_7_days',
        label: 'Last 7 Days',
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }
    case 'custom':
    default: {
      const year = now.getFullYear();
      const month = now.getMonth();
      const start = new Date(year, month, 1, 0, 0, 0, 0);
      const lastDay = new Date(year, month + 1, 0).getDate();
      const end = new Date(year, month, lastDay, 23, 59, 59, 999);
      return {
        id: 'current_month',
        label: now.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      };
    }
  }
}

/**
 * Format salary cycle label.
 * E.g. "27 Aug – 26 Sep" when in current year,
 * "27 Dec 2025 – 26 Jan 2026" across different years,
 * "27 Jul – 26 Aug 2025" in past year.
 */
export function formatSalaryCycleLabel(start: Date, end: Date): string {
  const currentYear = new Date().getFullYear();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} ${startYear} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${endYear}`;
  }
  if (startYear !== currentYear) {
    return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${startYear}`;
  }
  return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`;
}

/**
 * Format general date range label (for 30d, 7d, custom)
 */
export function formatDateRangeLabel(start: Date, end: Date): string {
  const currentYear = new Date().getFullYear();
  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  if (startYear !== endYear) {
    return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} ${startYear} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${endYear}`;
  }
  if (startYear !== currentYear) {
    return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${startYear}`;
  }
  return `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}`;
}

/**
 * Shifts an interval backward or forward by 1 period.
 */
export function stepDateInterval(
  current: DateInterval,
  direction: 'prev' | 'next',
  salaryDay: number = 27
): DateInterval {
  const delta = direction === 'next' ? 1 : -1;
  const boundedSalaryDay = Math.max(1, Math.min(31, Math.round(salaryDay || 27)));

  switch (current.id) {
    case 'salary_cycle': {
      // Parse current cycle start date with midday safe offset to avoid midnight DST drift
      const curStart = new Date(current.startDate);
      const safeStart = new Date(curStart.getTime() + 12 * 60 * 60 * 1000);
      const curYear = safeStart.getFullYear();
      const curMonth = safeStart.getMonth();

      // Shift target start month by delta
      const targetMonthDate = new Date(curYear, curMonth + delta, 1, 12, 0, 0, 0);
      const targetYear = targetMonthDate.getFullYear();
      const targetMonth = targetMonthDate.getMonth();

      // Days in target start month
      const daysInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const actualStartDay = Math.min(boundedSalaryDay, daysInTargetMonth);
      const newStart = new Date(targetYear, targetMonth, actualStartDay, 0, 0, 0, 0);

      let newEnd: Date;
      if (boundedSalaryDay === 1) {
        newEnd = new Date(targetYear, targetMonth, daysInTargetMonth, 23, 59, 59, 999);
      } else {
        const nextMonthDate = new Date(targetYear, targetMonth + 1, 1, 12, 0, 0, 0);
        const nextYear = nextMonthDate.getFullYear();
        const nextMonth = nextMonthDate.getMonth();
        const daysInNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
        const actualEndDay = Math.min(boundedSalaryDay - 1, daysInNextMonth);
        newEnd = new Date(nextYear, nextMonth, actualEndDay, 23, 59, 59, 999);
      }

      return {
        id: 'salary_cycle',
        label: formatSalaryCycleLabel(newStart, newEnd),
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      };
    }

    case 'current_month': {
      const curStart = new Date(current.startDate);
      const safeStart = new Date(curStart.getTime() + 12 * 60 * 60 * 1000);
      const curYear = safeStart.getFullYear();
      const curMonth = safeStart.getMonth();

      const targetMonthDate = new Date(curYear, curMonth + delta, 1, 12, 0, 0, 0);
      const targetYear = targetMonthDate.getFullYear();
      const targetMonth = targetMonthDate.getMonth();
      const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

      const newStart = new Date(targetYear, targetMonth, 1, 0, 0, 0, 0);
      const newEnd = new Date(targetYear, targetMonth, daysInMonth, 23, 59, 59, 999);

      return {
        id: 'current_month',
        label: newStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      };
    }

    case 'last_30_days': {
      const curStart = new Date(current.startDate);
      const curEnd = new Date(current.endDate);

      let newStart: Date;
      let newEnd: Date;

      if (direction === 'prev') {
        newEnd = new Date(curStart.getTime() - 1);
        newEnd.setHours(23, 59, 59, 999);
        newStart = new Date(newEnd);
        newStart.setDate(newEnd.getDate() - 29);
        newStart.setHours(0, 0, 0, 0);
      } else {
        newStart = new Date(curEnd.getTime() + 1);
        newStart.setHours(0, 0, 0, 0);
        newEnd = new Date(newStart);
        newEnd.setDate(newStart.getDate() + 29);
        newEnd.setHours(23, 59, 59, 999);
      }

      // Check if newEnd is today or current period
      const now = new Date();
      if (
        newEnd.getFullYear() === now.getFullYear() &&
        newEnd.getMonth() === now.getMonth() &&
        newEnd.getDate() === now.getDate()
      ) {
        return getCurrentInterval('last_30_days', salaryDay);
      }

      return {
        id: 'last_30_days',
        label: formatDateRangeLabel(newStart, newEnd),
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      };
    }

    case 'last_7_days': {
      const curStart = new Date(current.startDate);
      const curEnd = new Date(current.endDate);

      let newStart: Date;
      let newEnd: Date;

      if (direction === 'prev') {
        newEnd = new Date(curStart.getTime() - 1);
        newEnd.setHours(23, 59, 59, 999);
        newStart = new Date(newEnd);
        newStart.setDate(newEnd.getDate() - 6);
        newStart.setHours(0, 0, 0, 0);
      } else {
        newStart = new Date(curEnd.getTime() + 1);
        newStart.setHours(0, 0, 0, 0);
        newEnd = new Date(newStart);
        newEnd.setDate(newStart.getDate() + 6);
        newEnd.setHours(23, 59, 59, 999);
      }

      const now = new Date();
      if (
        newEnd.getFullYear() === now.getFullYear() &&
        newEnd.getMonth() === now.getMonth() &&
        newEnd.getDate() === now.getDate()
      ) {
        return getCurrentInterval('last_7_days', salaryDay);
      }

      return {
        id: 'last_7_days',
        label: formatDateRangeLabel(newStart, newEnd),
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      };
    }

    case 'custom':
    default: {
      const curStart = new Date(current.startDate);
      const curEnd = new Date(current.endDate);
      const durationMs = Math.max(86400000, curEnd.getTime() - curStart.getTime());

      const shiftMs = delta * durationMs;
      const newStart = new Date(curStart.getTime() + shiftMs);
      const newEnd = new Date(curEnd.getTime() + shiftMs);

      return {
        ...current,
        label: formatDateRangeLabel(newStart, newEnd),
        startDate: newStart.toISOString(),
        endDate: newEnd.toISOString(),
      };
    }
  }
}

/**
 * Checks if the given interval corresponds to the present/current active period.
 */
export function isCurrentPeriod(
  interval: DateInterval,
  salaryDay: number = 27
): boolean {
  const current = getCurrentInterval(interval.id, salaryDay);
  const curStart = new Date(current.startDate);
  const intStart = new Date(interval.startDate);
  const curEnd = new Date(current.endDate);
  const intEnd = new Date(interval.endDate);

  if (interval.id === 'current_month') {
    return (
      intStart.getFullYear() === curStart.getFullYear() &&
      intStart.getMonth() === curStart.getMonth()
    );
  }

  return (
    intStart.getFullYear() === curStart.getFullYear() &&
    intStart.getMonth() === curStart.getMonth() &&
    intStart.getDate() === curStart.getDate() &&
    intEnd.getFullYear() === curEnd.getFullYear() &&
    intEnd.getMonth() === curEnd.getMonth() &&
    intEnd.getDate() === curEnd.getDate()
  );
}

/**
 * Boundary check:
 * Dim or disable `>` if attempting to go beyond +1 cycle into the future.
 */
export function canStepNext(
  interval: DateInterval,
  salaryDay: number = 27
): boolean {
  if (interval.id === 'custom') {
    const curStartMs = new Date(interval.startDate).getTime();
    const curEndMs = new Date(interval.endDate).getTime();
    const durationMs = Math.max(86400000, curEndMs - curStartMs);
    const nowMs = Date.now();
    return curStartMs < nowMs + durationMs;
  }

  const current = getCurrentInterval(interval.id, salaryDay);
  const maxAllowed = stepDateInterval(current, 'next', salaryDay);

  const intervalStartMs = new Date(interval.startDate).getTime();
  const maxAllowedStartMs = new Date(maxAllowed.startDate).getTime();

  // If already at or beyond +1 cycle into the future, block further next steps
  // 1 hour buffer accounts for DST shifts
  return intervalStartMs < maxAllowedStartMs - 60 * 60 * 1000;
}

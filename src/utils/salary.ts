/**
 * Zenith Salary Cycle / Payday Calculation Engine
 * Calculates the exact start and end of a user's financial pay cycle
 * based on their recurring monthly salary day.
 */

export function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export interface SalaryCycleResult {
  start: Date;
  endDate: Date;
  label: string;
  sublabel: string;
  daysRemaining: number;
}

export function getSalaryCycleDates(
  salaryDay: number,
  referenceDate: Date = new Date()
): SalaryCycleResult {
  const day = Math.max(1, Math.min(31, Math.round(salaryDay || 27)));
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const currentDay = referenceDate.getDate();

  let start: Date;
  let endDate: Date;

  if (currentDay >= day) {
    // Current cycle started this month on `day`
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const actualStartDay = Math.min(day, daysInCurrentMonth);
    start = new Date(year, month, actualStartDay, 0, 0, 0, 0);

    if (day === 1) {
      endDate = new Date(year, month, daysInCurrentMonth, 23, 59, 59, 999);
    } else {
      const nextMonthYear = month === 11 ? year + 1 : year;
      const nextMonth = month === 11 ? 0 : month + 1;
      const daysInNextMonth = new Date(nextMonthYear, nextMonth + 1, 0).getDate();
      const actualEndDay = Math.min(day - 1, daysInNextMonth);
      endDate = new Date(nextMonthYear, nextMonth, actualEndDay, 23, 59, 59, 999);
    }
  } else {
    // Current cycle started last month on `day`
    const prevMonthYear = month === 0 ? year - 1 : year;
    const prevMonth = month === 0 ? 11 : month - 1;
    const daysInPrevMonth = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
    const actualStartDay = Math.min(day, daysInPrevMonth);
    start = new Date(prevMonthYear, prevMonth, actualStartDay, 0, 0, 0, 0);

    // Cycle ends this month on day - 1
    const actualEndDay = Math.min(day - 1, new Date(year, month + 1, 0).getDate());
    endDate = new Date(year, month, actualEndDay, 23, 59, 59, 999);
  }

  const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const label = `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${endDate.getDate()} ${MONTH_NAMES[endDate.getMonth()]}`;

  const msRemaining = Math.max(0, endDate.getTime() - referenceDate.getTime());
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const sublabel = `Payday: ${getOrdinalSuffix(day)} • ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} left`;

  return { start, endDate, label, sublabel, daysRemaining };
}

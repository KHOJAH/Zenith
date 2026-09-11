import { getCurrencyInfo } from './currencies';

export function formatCurrency(
  amount: number,
  currencyCode = 'USD',
  showSign = false
): string {
  const info = getCurrencyInfo(currencyCode);
  const symbol = info.symbol;

  const absAmount = Math.abs(amount || 0);
  const formatted = absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (showSign) {
    if (amount > 0) return `+${symbol} ${formatted}`.trim();
    if (amount < 0) return `-${symbol} ${formatted}`.trim();
  }

  return `${symbol} ${formatted}`.trim();
}

export function formatDateGroup(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const monthStr = monthNames[date.getMonth()];
  const dayStr = date.getDate();

  if (isToday) return `Today, ${monthStr} ${dayStr}`;
  if (isYesterday) return `Yesterday, ${monthStr} ${dayStr}`;
  return `${monthStr} ${dayStr}`;
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

export function getCurrentMonthName(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

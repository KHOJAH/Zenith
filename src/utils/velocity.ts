import { Transaction, CategoryItem, CategorySummary } from '@/db/schema';
import { convertCurrency } from './currencies';

export interface MonthAnalytics {
  totalExpenses: number;
  totalIncome: number;
  netSavings: number;
  dailyVelocity: number;
  daysPassed: number;
  daysRemaining: number;
  totalDays: number;
  weeklyBurn: {
    week1: number;
    week2: number;
    week3: number;
    week4: number;
  };
  categorySummaries: CategorySummary[];
}

export function calculateMonthAnalytics(
  transactions: Transaction[],
  categories: CategoryItem[],
  targetCurrency: string = 'USD',
  startDateStr?: string,
  endDateStr?: string
): MonthAnalytics {
  const now = new Date();

  // Determine interval start and end
  let start: Date;
  let end: Date;

  if (startDateStr && endDateStr) {
    start = new Date(startDateStr);
    start.setHours(0, 0, 0, 0);
    end = new Date(endDateStr);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default: current calendar month
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    start = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0);
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    end = new Date(currentYear, currentMonth, lastDay, 23, 59, 59, 999);
  }

  const diffMs = Math.max(1, end.getTime() - start.getTime());
  const totalDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  let daysPassed: number;
  let daysRemaining: number;

  if (now.getTime() < start.getTime()) {
    daysPassed = 1;
    daysRemaining = totalDays;
  } else if (now.getTime() > end.getTime()) {
    daysPassed = totalDays;
    daysRemaining = 0;
  } else {
    daysPassed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    daysRemaining = Math.max(0, totalDays - daysPassed);
  }

  // Filter transactions within interval
  const intervalTx = transactions.filter((tx) => {
    const d = new Date(tx.date).getTime();
    return d >= start.getTime() && d <= end.getTime();
  });

  let totalExpenses = 0;
  let totalIncome = 0;
  const categorySpentMap: Record<string, number> = {};

  // 4 time buckets across the interval
  const quarterMs = diffMs / 4;
  let w1 = 0;
  let w2 = 0;
  let w3 = 0;
  let w4 = 0;

  for (const tx of intervalTx) {
    const convertedAmount = convertCurrency(tx.amount, tx.currency || 'USD', targetCurrency);
    const txTime = new Date(tx.date).getTime();
    const offset = txTime - start.getTime();

    if (tx.type === 'expense') {
      totalExpenses += convertedAmount;
      categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + convertedAmount;

      if (offset <= quarterMs) w1 += convertedAmount;
      else if (offset <= quarterMs * 2) w2 += convertedAmount;
      else if (offset <= quarterMs * 3) w3 += convertedAmount;
      else w4 += convertedAmount;
    } else if (tx.type === 'income') {
      totalIncome += convertedAmount;
    }
  }

  // Round sums to 2 decimal places
  totalExpenses = Math.round(totalExpenses * 100) / 100;
  totalIncome = Math.round(totalIncome * 100) / 100;

  // Daily velocity
  const dailyVelocity = Math.round((totalExpenses / Math.max(1, daysPassed)) * 100) / 100;

  // Category color mapping - distinct vibrant palette visible on both Clean White and Obsidian OLED
  const categoryColors: Record<string, string> = {
    'Housing & Utilities': '#3B82F6', // Blue (never #000000 which is invisible on OLED Dark Mode)
    'Food & Dining': '#10B981', // Emerald Mint
    'Shopping & Tech': '#06B6D4', // Cyan
    'Entertainment': '#8B5CF6', // Purple
    'Transport': '#F59E0B', // Amber
    'Health & Wellness': '#EC4899', // Pink
    'Other': '#64748B', // Slate
  };

  const customCategoryPalette = [
    '#F97316', // Orange
    '#14B8A6', // Teal
    '#6366F1', // Indigo
    '#A855F7', // Violet
    '#E11D48', // Rose
    '#84CC16', // Lime
  ];

  // Merge any extra categories found in transactions into category list
  const knownCategories = new Set(categories.map((c) => c.category));
  const mergedCategories: CategoryItem[] = [...categories];
  for (const catName of Object.keys(categorySpentMap)) {
    if (!knownCategories.has(catName)) {
      mergedCategories.push({
        category: catName,
        icon: 'tag',
        subtitle: 'Custom category',
      });
      knownCategories.add(catName);
    }
  }

  // Build category summaries: calculate each category's share of total expenses
  const categorySummaries: CategorySummary[] = mergedCategories.map((c, idx) => {
    const spent = Math.round((categorySpentMap[c.category] || 0) * 100) / 100;
    const percentage = totalExpenses > 0 ? Math.round((spent / totalExpenses) * 100) : 0;
    const color =
      categoryColors[c.category] ||
      customCategoryPalette[idx % customCategoryPalette.length];

    return {
      category: c.category,
      spent,
      percentage,
      icon: c.icon,
      color,
    };
  });

  // Sort categories by highest spend first
  categorySummaries.sort((a, b) => b.spent - a.spent);

  return {
    totalExpenses,
    totalIncome,
    netSavings: Math.round((totalIncome - totalExpenses) * 100) / 100,
    dailyVelocity,
    daysPassed,
    daysRemaining,
    totalDays,
    weeklyBurn: {
      week1: Math.round(w1 * 100) / 100,
      week2: Math.round(w2 * 100) / 100,
      week3: Math.round(w3 * 100) / 100,
      week4: Math.round(w4 * 100) / 100,
    },
    categorySummaries,
  };
}
